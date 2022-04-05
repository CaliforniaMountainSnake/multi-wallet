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
        console.log(`IndexedDB "${this.#dbRepository.dbName}" has been opened.`)

        await this.initConfigs()

        // Set listeners.
        this.#setListeners()

        // Load local exchange rates.
        this.#exchange_rates = await this.#dbRepository.getExchangeRates()
        console.log("Exchange rates:", this.#exchange_rates)
        console.log("usd/rub rate:", this.#getExchangeRate("usd", "rub"))

        // Render the data table
        await this.#renderApp()
    }

    async initConfigs() {
        await this.#dbRepository.initConfig(this.#conf_key_selected_total_currency, this.#default_total_currency)
        await this.#dbRepository.initConfig(this.#conf_key_last_update_timestamp, 0)
        console.log("Configs have been initialized.")
    }

    async #renderApp() {
        return Promise.all([
            this.#renderLastUpdateTime(),
            this.#renderAddNewAmountRow(),
            this.#renderDataTableHead(),
            this.#renderDataTableBody(),
            this.#renderDataTableTotalSummary(),
        ])
    }

    async #renderLastUpdateTime() {
        const timestamp = await this.#dbRepository.getConfig(this.#conf_key_last_update_timestamp)
        document.getElementById("last_update_time").innerHTML = (new Date(timestamp)).toLocaleString()
    }

    async #renderDataTableTotalSummary() {
        // Get selected currency.
        const targetCurrency = await this.#dbRepository.getConfig(this.#conf_key_selected_total_currency)
        const targetUnit = this.#exchange_rates.get(targetCurrency).unit

        // Render total currency select elem.
        await this.#renderCurrencySelect("total_currency")
        document.getElementById("total_currency").value = targetCurrency

        // Calculate the result sum.
        const amounts = await this.#dbRepository.getAmounts()
        let resultSum = 0
        for (const [id, amount] of amounts.entries()) {
            const rate = this.#getExchangeRate(targetCurrency, amount.symbol)
            resultSum += amount.amount / rate
        }

        document.getElementById("total_sum").innerHTML = `${this.#formatAmount(resultSum)} ${targetUnit}`
    }

    async #renderDataTableBody() {
        // Clear tbody.
        const oldTbody = document.querySelector("#data_table tbody")
        const tbody = document.createElement("tbody")
        oldTbody.parentNode.replaceChild(tbody, oldTbody)

        // Get selected currency.
        const targetCurrency = await this.#dbRepository.getConfig(this.#conf_key_selected_total_currency)
        const targetUnit = this.#exchange_rates.get(targetCurrency).unit

        // Add new rows.
        const amounts = await this.#dbRepository.getAmounts()
        for (const [id, amount] of amounts.entries()) {
            tbody.appendChild(this.#createDataTableRow(id, amount, targetCurrency, targetUnit))
        }

        // Set listeners for delete buttons.
        document.querySelectorAll(".delete_button").forEach(button => {
            this.#safeOnClick(button, async () => {
                const id = Number.parseInt(button.dataset.id)
                try {
                    const amount = await this.#dbRepository.getAmount(id)
                    if (confirm(this.#getAmountDeletionMsg(amount))) {
                        await this.#dbRepository.deleteAmount(id)
                        await this.#renderApp()
                        console.log(`Amount row with key "${id}" has been deleted.`)
                    }
                } catch (error) {
                    console.error(error)
                    alert(error)
                }
            })
        })

        console.log("Amounts:", amounts)
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
        const targetCurrency = await this.#dbRepository.getConfig(this.#conf_key_selected_total_currency)
        const targetUnit = this.#exchange_rates.get(targetCurrency).unit

        document.getElementById("amount_in_selected_currency").innerHTML = `Amount in ${targetUnit}`
    }

    async #renderAddNewAmountRow() {
        await this.#renderCurrencySelect("add_currency")

        this.#safeOnClick(document.getElementById("add_button"), async () => {
            try {
                const amount = document.getElementById("add_amount").value
                const comment = document.getElementById("add_comment").value
                const currencySelect = document.getElementById("add_currency")
                const currency = currencySelect.options[currencySelect.selectedIndex].value

                await this.#addAmount(amount, currency, comment)
                await this.#renderApp()
            } catch (error) {
                console.warn(error)
                alert(error)
            }
        })
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
     * @param {string} selectId 
     */
    async #renderCurrencySelect(selectId) {
        // Remove existed options.
        const currencySelect = document.getElementById(selectId)
        while (currencySelect.options.length > 0) {
            currencySelect.remove(0)
        }

        // Add new options.
        for (const [symbol, rate] of this.#exchange_rates.entries()) {
            const opt = document.createElement("option")
            opt.value = symbol
            opt.innerHTML = `${symbol} - ${rate.name}`
            currencySelect.appendChild(opt)
        }
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

    #setListeners() {
        document.getElementById("total_currency").onchange = event => {
            this.#dbRepository.setConfig(this.#conf_key_selected_total_currency, event.target.value).then(key => {
                console.log("Selected a new currency:", event.target.value)
                return this.#renderApp()
            }).catch(error => {
                console.error("Unable to calculate the total sum! Error:", error)
            })
        }
        this.#safeOnClick(document.getElementById("update_exchange_rates"), async () => {
            try {
                const rawRates = await this.#coingeckoRepository.getExchangeRates()
                this.#exchange_rates = await this.#dbRepository.updateExchangeRates(rawRates)
                await this.#dbRepository.setConfig(this.#conf_key_last_update_timestamp, Date.now())

                await this.#renderApp()
                console.log("Echange rates have been updated:", this.#exchange_rates)
            } catch (error) {
                const errMsg = `Unable to update echange rates: ${error}`
                console.error(errMsg)
                alert(errMsg)
            }
        })
        this.#safeOnClick(document.getElementById("delete_db"), async () => {
            if (confirm("Are you sure you want to delete the local DB?")) {
                try {
                    await this.#dbRepository.deleteIndexedDB()
                    console.warn(`Database "${this.#dbRepository.dbName}" has been deleted!`)
                } catch (error) {
                    console.error(`Unable to delete database "${this.#dbRepository.dbName}"`, error)
                }
            }
        })
    }

    /**
     * @param {HTMLElement} element 
     * @param {function():Promise<void>} callback 
     */
    #safeOnClick(element, callback) {
        element.onclick = () => {
            element.disabled = true
            callback()
                .catch(error => {
                    console.error(`Uncaught error in the "onclick" callback:`, error)
                })
                .finally(() => element.disabled = false)
        }
    }

    /**
     * @param {int} ms 
     * @returns {Promise<void>}
     */
    #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
