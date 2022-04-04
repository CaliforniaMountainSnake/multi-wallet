import { IndexedDBRepository } from "./IndexedDBRepository.js"
import { CoingeckoRepository } from "./CoingeckoRepository.js"

export class App {
    #dbRepository
    #coingeckoRepository

    constructor() {
        this.#dbRepository = new IndexedDBRepository()
        this.#coingeckoRepository = new CoingeckoRepository()
    }

    async start() {
        await this.#dbRepository.open()
        console.log(`IndexedDB "${this.#dbRepository.dbName}" has been opened.`)

        // Set listeners.
        this.#setListeners()

        const symbols = await this.#dbRepository.getSymbols()
        console.log("Symbols:", symbols)

        // Render the data table
        await this.#renderDataTable()
    }

    async #renderDataTable() {
        // Promise.all()???
        return Promise.all([
            this.#renderAddNewAmountRow(),
            this.#renderCurrencySelect("total_currency"),
        ])
    }

    async #renderAddNewAmountRow() {
        await this.#renderCurrencySelect("add_currency")

        this.#safeOnClick(document.getElementById("add_button"), async () => {
            try {
                const amount = document.getElementById("add_amount").value
                const currencySelect = document.getElementById("add_currency")
                const currency = currencySelect.options[currencySelect.selectedIndex].value
                await this.#addNewAmount(amount, currency)
            } catch (error) {
                console.warn(error)
                alert(error)
            }
        })
    }

    /**
     * @param {any} amount 
     * @param {string} currency
     */
    async #addNewAmount(amount, currency) {
        // Validate amount.
        const amountFloat = parseFloat(amount)
        if (Number.isNaN(amountFloat) || amountFloat == 0) {
            throw new Error("Please, enter a valid number!")
        }

        // Validate currency.
        const curObj = await this.#dbRepository.getBtcToSymbolExchangeRate(currency)

        // Now we can add this value into the DB.
        console.log("Amount:", amountFloat, "Currency:", curObj)
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
        const symbols = await this.#dbRepository.getSymbols()
        for (const symbol of symbols) {
            const opt = document.createElement("option")
            opt.value = symbol
            opt.innerHTML = symbol
            currencySelect.appendChild(opt)
        }
    }

    #setListeners() {
        this.#safeOnClick(document.getElementById("update_exchange_rates"), async () => {
            try {
                const rawRates = await this.#coingeckoRepository.getExchangeRates()
                const exchangeRates = await this.#dbRepository.updateExchangeRates(rawRates["rates"])

                await this.#renderCurrencySelect("add_currency")
                await this.#renderCurrencySelect("total_currency")
                console.log("Echange rates have been updated:", exchangeRates)

                const usdRubRate = await this.#dbRepository.getExchangeRate("usd", "rub")
                console.log("usd/rub rate:", usdRubRate)
            } catch (error) {
                console.error("Unable to update echange rates", error)
            }
        })
        this.#safeOnClick(document.getElementById("delete_db"), async () => {
            try {
                await this.#delay(1000)
                await this.#dbRepository.deleteIndexedDB()
                console.warn(`Database "${this.#dbRepository.dbName}" has been deleted!`)
            } catch (error) {
                console.error(`Unable to delete database "${this.#dbRepository.dbName}"`, error)
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
