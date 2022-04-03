async function input() {
    // Open repository
    // Ошибки запросов в транзакции вызывают отмену транзакции,
    // только если всплытие ошибки недвусмысленно не предотвращено
    // методом Event.preventDefault() внутри IDBRequest.onerror().
    let repository = new IndexedDBRepository()
    await repository.open()
    console.log(`IndexedDB "${repository.dbName}" has been opened.`)

    // Set listeners.
    setListeners(repository)
}

class CoingeckoRepository {
    #apiDomain = "https://api.coingecko.com/api/v3"

    async getSupportedVsCurrencies() {
        return await this.#request("/simple/supported_vs_currencies")
    }

    async getExchangeRates() {
        return await this.#request("/exchange_rates")
    }

    async #request(url) {
        const response = await fetch(this.#apiDomain + url, { headers: { "Accept": "application/json" } })
        if (response.status != 200) {
            throw new Error(`Wrong API response code (${response.status})`)
        }
        return await response.json()
    }
}

class IndexedDBRepository {
    /** @type {IDBDatabase} */
    #db
    #dbName = "test"
    #dbVersion = 3

    #books_store_name = "books"
    #supported_vs_currencies_store_name = "supported_vs_currencies"
    #exchange_rates_store_name = "exchange_rates"

    get dbName() {
        return this.#dbName
    }

    /**
     * @param {string} symbol1 
     * @param {string} symbol2 
     * @returns {Promise<number>}
     */
    async getExchangeRate(symbol1, symbol2) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#exchange_rates_store_name)
            const cur1 = await this.#promiseRequest(store.get(symbol1))
            const cur2 = await this.#promiseRequest(store.get(symbol2))

            return (cur2["value"] / cur1["value"])
        }, "readonly")
    }

    /**
     * @param {object} data
     * @returns {Promise<object[]>}
     */
    async updateExchangeRates(data) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#exchange_rates_store_name)
            for (const [key, value] of Object.entries(data)) {
                store.put(Object.assign({ "symbol": key }, value))
            }

            return await this.#promiseRequest(store.getAll())
        })
    }

    /**
     * @param {string[]} currencies 
     * @returns {Promise<string[]>}
     */
    async updateSupportedCurrencies(currencies) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#supported_vs_currencies_store_name)
            for (let symbol of currencies) {
                store.put({ "symbol": symbol })
            }

            return currencies
        })
    }

    /**
     * @returns {Promise<void>}
     */
    async open() {
        return new Promise((resolve, reject) => {
            let openRequest = indexedDB.open(this.#dbName, this.#dbVersion)
            openRequest.onupgradeneeded = event => this.#migrateIndexedDB(event)
            openRequest.onblocked = event => this.#onBlocked(event)
            openRequest.onerror = () => reject(openRequest.error)
            openRequest.onsuccess = () => {
                this.#db = openRequest.result
                resolve()
            }
        })
    }

    /**
     * @returns {Promise<void>}
     */
    async deleteIndexedDB() {
        return new Promise((resolve, reject) => {
            // At first, close the connection to avoid "onblocked" event.
            this.#db.close()

            // Delete the DB.
            const deleteRequest = indexedDB.deleteDatabase(this.#dbName)
            deleteRequest.onblocked = event => this.#onBlocked(event)
            deleteRequest.onerror = event => reject(event.target.error)
            deleteRequest.onsuccess = event => resolve()
        })
    }

    /**
     * @param {IDBVersionChangeEvent} event
     */
    #migrateIndexedDB(event) {
        console.warn(`Upgrade needed! [${event.oldVersion} to ${event.newVersion}]`)

        /** @type {IDBDatabase} */
        const db = event.target.result

        const migrations = {
            1: () => {
                db.createObjectStore(this.#supported_vs_currencies_store_name, { keyPath: "symbol" })
            },
            2: () => {
                db.createObjectStore(this.#exchange_rates_store_name, { keyPath: "symbol" })
            },
            3: () => {
                // nothing
            },
        }

        for (let i = event.oldVersion + 1; i <= event.newVersion; i++) {
            if (!(i in migrations)) {
                console.error(`Migration "${i}" does not exist!`)
                break
            }

            migrations[i]()
            console.info(`Migration "${i}" has been applied.`)
        }
    }

    /**
     * @param {IDBRequest} request 
     * @returns {Promise<any>}
     */
    async #promiseRequest(request) {
        return new Promise((resolve, reject) => {
            request.onerror = event => reject(event.target.error)
            request.onsuccess = event => resolve(event.target.result)
        })
    }

    /**
     * @param {function(IDBTransaction):Promise<any>} transactionBody 
     * @returns {Promise<any>}
     */
    async #transaction(transactionBody, mode = "readwrite") {
        return new Promise((resolve, reject) => {
            const transaction = this.#db.transaction(this.#db.objectStoreNames, mode)
            const transactionResultPromise = transactionBody(transaction)

            transaction.onabort = event => reject(event.target.error)
            transaction.oncomplete = () => {
                transactionResultPromise
                    .then(result => resolve(result))
                    .catch(error => reject(error))
            }
        })
    }

    /**
     * @param {IDBVersionChangeEvent} event 
     */
    #onBlocked(event) {
        // There is another connection to the DB.
        // And this connection was not closed after firing the "db.onversionchange" there.
        const msg = "Unable to update the DB version (or delete the DB)!"
            + " There is an another connection to the same DB."
            + " Please, close another tabs before update."
        console.warn(msg, event)
        alert(msg)
    }
}

/**
 * @param {HTMLElement} element 
 * @param {function():Promise<void>} callback 
 */
function safeOnClick(element, callback) {
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
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {IndexedDBRepository} repository 
 */
function setListeners(repository) {
    safeOnClick(document.getElementById("add_item"), async () => {
        const amount = prompt("Enter the amount of money:")
        console.log(`Received: ${amount}`)
    })
    safeOnClick(document.getElementById("update_exchange_rates"), async () => {
        try {
            const coingeckoRepository = new CoingeckoRepository()
            const rawRates = await coingeckoRepository.getExchangeRates()
            const exchangeRates = await repository.updateExchangeRates(rawRates["rates"])
            console.log("Echange rates have been updated:", exchangeRates)

            const usdRubRate = await repository.getExchangeRate("usd", "rub")
            console.log("usd/rub rate:", usdRubRate)
        } catch (error) {
            console.error("Unable to update echange rates", error)
        }
    })
    safeOnClick(document.getElementById("delete_db"), async () => {
        try {
            await delay(1000)
            await repository.deleteIndexedDB()
            console.warn(`Database "${repository.dbName}" has been deleted!`)
        } catch (error) {
            console.error(`Unable to delete database "${repository.dbName}"`, error)
        }
    })
}

input().then(() => {
    console.log("Completed.")
}).catch(error => {
    console.error("Unhandled top level error:", error)
})
