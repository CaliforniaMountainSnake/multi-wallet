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

        this.#setListeners()
    }

    #setListeners() {
        this.#safeOnClick(document.getElementById("add_new_amount"), async () => {
            const amount = prompt("Enter the amount of money:")
            console.log(`Received: ${amount}`)
        })
        this.#safeOnClick(document.getElementById("update_exchange_rates"), async () => {
            try {
                const rawRates = await this.#coingeckoRepository.getExchangeRates()
                const exchangeRates = await this.#dbRepository.updateExchangeRates(rawRates["rates"])
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
