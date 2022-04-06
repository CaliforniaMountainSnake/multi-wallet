import { Amount, IndexedDBRepository } from "./IndexedDBRepository.js"
import { CoingeckoRepository, BtcRate } from "./CoingeckoRepository.js"

export class App {
    #dbRepository
    #coingeckoRepository

    #conf_key_last_update_timestamp = "last_update_timestamp"
    #conf_key_selected_total_currency = "selected_total_currency"
    #default_total_currency = "usd"

    /** @type {Map<string, BtcRate>} */
    #exchange_rates = new Map()

    constructor() {
        this.#dbRepository = new IndexedDBRepository()
        this.#coingeckoRepository = new CoingeckoRepository()
    }

    async start() {
        await this.#dbRepository.open()
        await this.initConfigs()

        // Load local exchange rates.
        this.#exchange_rates = await this.#dbRepository.getExchangeRates()

        // Render the data table
        await this.#renderApp()
    }

    async initConfigs() {
        await this.#dbRepository.initConfig(this.#conf_key_selected_total_currency, this.#default_total_currency)
        try {
            await this.#dbRepository.getConfig(this.#conf_key_last_update_timestamp)
        } catch (error) {
            await this.#updateExchangeRates()
        }

        console.log("Configs have been initialized.")
    }

    async #renderApp() {
        return Promise.all([
            this.#renderLastUpdateTime(),
            this.#renderAddNewAmountRow(),
            this.#renderDataTableHead(),
            this.#renderDataTableBody(),
            this.#renderDataTableTotalSummary(),
            this.#renderDbDeletionButton(),
        ])
    }

    async #renderDbDeletionButton() {
        document.getElementById("delete_db").onclick = event => {
            this.#disableElementWhileCallback(event.target, async () => {
                if (confirm("Are you sure you want to delete the local DB?")) {
                    await this.#dbRepository.deleteIndexedDB()
                    console.warn(`Database "${this.#dbRepository.dbName}" has been deleted!`)

                    await this.start()
                }
            }).catch(error => {
                console.error(`Unable to delete database "${this.#dbRepository.dbName}"`, error)
            })
        }
    }

    async #renderLastUpdateTime() {
        const timestamp = await this.#dbRepository.getConfig(this.#conf_key_last_update_timestamp)
        document.getElementById("last_update_time").innerHTML = (new Date(timestamp)).toLocaleString()

        document.getElementById("update_exchange_rates").onclick = event => this.#updateExchangeRates()
    }

    async #updateExchangeRates() {
        try {
            await this.#disableElementWhileCallback(document.getElementById("update_exchange_rates"), async () => {
                const rates = await this.#coingeckoRepository.getExchangeRates()
                this.#exchange_rates = await this.#dbRepository.updateExchangeRates(rates)
                await this.#dbRepository.setConfig(this.#conf_key_last_update_timestamp, Date.now())

                await this.#renderApp()
                console.log("Exchange rates have been updated:", this.#exchange_rates)
            })
        } catch (error) {
            this.#showMessage(`Unable to update exchange rates: ${error}`, console.error)
        }
    }

    async #renderDataTableTotalSummary() {
        // Get selected currency.
        const [selectedSymbol, selectedRate] = await this.#getSelectedCurrencyInfo()

        // Render total currency select elem.
        this.#renderCurrencySelect(document.getElementById("total_currency")).value = selectedSymbol

        // Calculate total sum.
        const totalSum = await this.#calculateTotalSum(selectedSymbol)
        document.getElementById("total_sum").innerHTML = `${this.#formatAmount(totalSum)} ${selectedRate.unit}`

        // Set select's listener.
        document.getElementById("total_currency").onchange = event => {
            this.#dbRepository.setConfig(this.#conf_key_selected_total_currency, event.target.value).then(() => {
                console.log("Selected a new currency:", event.target.value)
                return this.#renderApp()
            }).catch(error => {
                console.error("Unable to calculate total sum! Error:", error)
            })
        }
    }

    /**
     * @param {string} targetCurrency
     * @returns {Promise<number>}
     */
    async #calculateTotalSum(targetCurrency) {
        const amounts = await this.#dbRepository.getAmounts()
        let resultSum = 0
        for (const [id, amount] of amounts.entries()) {
            const rate = this.#getExchangeRate(targetCurrency, amount.symbol)
            resultSum += amount.amount / rate
        }
        return resultSum
    }

    async #renderDataTableBody() {
        // Clear tbody.
        const oldTbody = document.querySelector("#data_table tbody")
        const tbody = document.createElement("tbody")
        oldTbody.parentNode.replaceChild(tbody, oldTbody)

        // Get selected currency.
        const [selectedSymbol, selectedRate] = await this.#getSelectedCurrencyInfo()

        // Add new rows.
        const amounts = await this.#dbRepository.getAmounts()
        for (const [id, amount] of amounts.entries()) {
            tbody.appendChild(this.#createDataTableRow(id, amount, selectedSymbol, selectedRate.unit))
        }

        // Set listeners for delete buttons.
        document.querySelectorAll(".delete_button").forEach(button => {
            button.onclick = () => {
                this.#disableElementWhileCallback(button, async () => {
                    const id = Number.parseInt(button.dataset.id)
                    const amount = await this.#dbRepository.getAmount(id)
                    if (confirm(this.#getAmountDeletionMsg(amount))) {
                        await this.#dbRepository.deleteAmount(id)
                        await this.#renderApp()
                    }
                }).catch(error => this.#showMessage(error, console.error))
            }
        })
    }

    /**
     * @returns {Promise<[string, BtcRate]>}
     */
    async #getSelectedCurrencyInfo() {
        const symbol = await this.#dbRepository.getConfig(this.#conf_key_selected_total_currency)
        const rate = this.#exchange_rates.get(symbol)

        return [symbol, rate]
    }

    /**
     * @param {Amount} amount 
     * @returns {string}
     */
    #getAmountDeletionMsg(amount) {
        const unit = this.#exchange_rates.get(amount.symbol).unit
        let msg = `Are you sure you want to delete ${amount.amount} ${unit} `
        msg += amount.comment === undefined ? "?" : `(${amount.comment}) ?`

        return msg
    }

    /**
     * @param {number} id 
     * @param {Amount} amount 
     * @param {string} targetCurrency
     * @param {string} targetUnit
     * @returns {HTMLTableRowElement}
     */
    #createDataTableRow(id, amount, targetCurrency, targetUnit) {
        const isEmptyComment = amount.comment === undefined
        const tr = document.createElement("tr")
        const unit = this.#exchange_rates.get(amount.symbol).unit
        const name = this.#exchange_rates.get(amount.symbol).name
        const targetCurrencyAmount = amount.amount / this.#getExchangeRate(targetCurrency, amount.symbol)

        tr.appendChild(this.#createTd(`${amount.amount} ${unit}`))
        tr.appendChild(this.#createTd(`${this.#formatAmount(targetCurrencyAmount)} ${targetUnit}`))
        tr.appendChild(this.#createTd(name, isEmptyComment ? 2 : 1))
        if (!isEmptyComment) {
            tr.appendChild(this.#createTd(amount.comment))
        }
        tr.appendChild(this.#createTd(`<button class="delete_button" data-id="${id}">Delete</button>`))

        return tr
    }

    /**
     * @param {string} data 
     * @param {number} colspan
     * @returns {HTMLTableCellElement}
     */
    #createTd(data, colspan = 1) {
        const td = document.createElement("td")
        td.colSpan = colspan
        td.innerHTML = data
        return td
    }

    /**
     * @param {number} amount 
     * @returns {number}
     */
    #formatAmount(amount) {
        const fractionDigits = 2
        if (amount === 0) {
            return amount
        }
        if (amount < 1) {
            // @see https://stackoverflow.com/a/31002148
            const countOfDecimalZeros = -Math.floor(Math.log10(amount) + 1)
            return amount.toFixed(countOfDecimalZeros + fractionDigits * 2)
        }

        return amount.toFixed(fractionDigits)
    }

    async #renderDataTableHead() {
        // Get selected currency.
        const [selectedSymbol, selectedRate] = await this.#getSelectedCurrencyInfo()

        document.getElementById("amount_in_selected_currency").innerHTML = `Amount in ${selectedRate.unit}`
    }

    async #renderAddNewAmountRow() {
        this.#renderCurrencySelect(document.getElementById("add_currency"))

        document.getElementById("add_button").onclick = event => {
            this.#disableElementWhileCallback(event.target, async () => {
                const amount = document.getElementById("add_amount").value
                const comment = document.getElementById("add_comment").value
                const currency = document.getElementById("add_currency").value

                await this.#addAmount(amount, currency, comment)
                await this.#renderApp()
            }).catch(error => this.#showMessage(error, console.warn))
        }
    }

    /**
     * @param {any} amount 
     * @param {string} currency
     * @param {string} comment
     */
    async #addAmount(amount, currency, comment) {
        // Validate given data.
        const amountValidator = amount => {
            const amountFloat = parseFloat(amount)
            if (Number.isNaN(amountFloat) || amountFloat == 0) {
                throw new Error("Please, enter a valid number!")
            }
            return amountFloat
        }
        const currencyValidator = async currency => {
            await this.#dbRepository.getBtcToSymbolExchangeRate(currency)
            return currency
        }
        const commentValidator = comment => {
            const trimmed = comment.trim()
            return trimmed === "" ? undefined : trimmed
        }

        // Now we can add this values into the DB.
        const addedRowKey = await this.#dbRepository.addAmount(
            amountValidator(amount),
            await currencyValidator(currency),
            commentValidator(comment),
        )
        console.log("Added key:", addedRowKey)
    }

    /**
     * @param {HTMLSelectElement} selectElement
     * @returns {HTMLSelectElement}
     */
    #renderCurrencySelect(selectElement) {
        // Remove existed options.
        while (selectElement.options.length > 0) {
            selectElement.remove(0)
        }

        // Add new options.
        for (const [symbol, rate] of this.#exchange_rates.entries()) {
            const opt = document.createElement("option")
            opt.value = symbol
            opt.innerHTML = `${symbol} - ${rate.name}`
            selectElement.appendChild(opt)
        }

        return selectElement
    }

    /**
     * @param {string} symbol1 
     * @param {string} symbol2 
     * @returns {number}
     */
    #getExchangeRate(symbol1, symbol2) {
        const cur1 = this.#exchange_rates.get(symbol1)
        const cur2 = this.#exchange_rates.get(symbol2)
        if (cur1 === undefined || cur2 === undefined) {
            throw new Error(`Symbol "${symbol1}" or "${symbol2}" do not found in the DB`)
        }

        return (cur2["value"] / cur1["value"])
    }

    /**
     * @param {HTMLElement} element 
     * @param {function(HTMLElement):Promise<any>} callback 
     * @returns {Promise<any>}
     */
    async #disableElementWhileCallback(element, callback) {
        element.disabled = true
        try {
            return await callback(element)
        } finally {
            element.disabled = false
        }
    }

    /**
     * @param {any} error
     * @param {function(any):void} logger
     */
    #showMessage(error, logger = console.log) {
        logger(error)
        alert(error)
    }

    /**
     * @param {int} ms 
     * @returns {Promise<void>}
     */
    #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
