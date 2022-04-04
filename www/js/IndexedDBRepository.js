export class IndexedDBRepository {
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
        console.warn(`IndexedDB upgrade needed! [${event.oldVersion} to ${event.newVersion}]`)

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
