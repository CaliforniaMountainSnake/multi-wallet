import { BtcRate } from "./CoingeckoRepository.js"

export class IndexedDBRepository {
    /** @type {IDBDatabase} */
    #db
    #dbName = "multi-wallet-app"
    #dbVersion = 3

    #configs_store_name = "configs"
    #exchange_rates_store_name = "exchange_rates"
    #amounts_store_name = "amounts"

    get dbName() {
        return this.#dbName
    }

    /**
     * @param {string} key 
     * @returns {Promise<any>} Config value.
     */
    async getConfig(key) {
        return (await this.#getByKey(this.#configs_store_name, key))["value"]
    }

    /**
     * Set config if it is not set yet.
     * 
     * @param {string} key 
     * @param {any} value 
     * @returns {Promise<boolean>}
     */
    async initConfig(key, value) {
        try {
            await this.getConfig(key)
            return true
        } catch (error) {
            await this.setConfig(key, value)
            return false
        }
    }

    /**
     * @param {string} key 
     * @param {any} value 
     * @returns {Promise<string>} Added row's key.
     */
    async setConfig(key, value) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#configs_store_name)
            return await this.#promiseRequest(store.put({ "key": key, "value": value }))
        })
    }

    /**
    * @returns {Promise<Map<string, Amount>}
    */
    async getAmounts() {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#amounts_store_name)
            return await this.#promiseCursorRequest(store.openCursor())
        }, "readonly")
    }

    /**
     * @param {number} key 
     * @returns {Promise<Amount>}
     */
    async getAmount(key) {
        return await this.#getByKey(this.#amounts_store_name, key)
    }

    /**
     * @param {number} amount 
     * @param {string} currency 
     * @param {string} comment 
     * @returns {Promise<number>} Added row's key.
     */
    async addAmount(amount, currency, comment) {
        const amountObj = new Amount(amount, currency, comment)

        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#amounts_store_name)
            return await this.#promiseRequest(store.add(amountObj))
        })
    }

    /**
     * @param {number} key 
     * @returns {Promise<number>} Deleted row's key.
     */
    async deleteAmount(key) {
        return await this.#deleteByKey(this.#amounts_store_name, key)
    }

    /**
     * @param {string} symbol 
     * @returns {Promise<BtcRate>}
     */
    async getBtcToSymbolExchangeRate(symbol) {
        return await this.#getByKey(this.#exchange_rates_store_name, symbol)
    }

    /**
     * @returns {Promise<Map<string, BtcRate>}
     */
    async getExchangeRates() {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#exchange_rates_store_name)
            return await this.#promiseCursorRequest(store.openCursor())
        }, "readonly")
    }

    /**
     * @param {Map<string, BtcRate>} data
     * @returns {Promise<Map<string, BtcRate>>}
     */
    async updateExchangeRates(data) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(this.#exchange_rates_store_name)
            for (const [key, value] of data.entries()) {
                store.put(Object.assign({ "symbol": key }, value))
            }

            return await this.#promiseCursorRequest(store.openCursor())
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
                console.log(`IndexedDB "${this.#dbName}" has been opened.`)
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
     * Delete a row.
     * Be sure to convert the key to a number when the DB key has a number type.
     * 
     * Warning! The delete methods always return to success event handler with undefined as result
     * whether given key was deleted or not.
     * 
     * @param {string} storeName 
     * @param {any} key 
     * @returns {Promise<any>}
     * 
     * @see https://stackoverflow.com/a/14330794
     */
    async #deleteByKey(storeName, key) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(storeName)
            return await this.#promiseRequest(store.delete(key))
        })
    }

    /**
     * @param {string} storeName 
     * @param {any} key 
     * @returns {Promise<any>} Rejected promise if there is no row with the given key.
     */
    async #getByKey(storeName, key) {
        return await this.#transaction(async transaction => {
            const store = transaction.objectStore(storeName)
            const value = await this.#promiseRequest(store.get(key))
            if (value === undefined) {
                throw new Error(`Unable to find a row with key: "${key}"`)
            }

            return value
        }, "readonly")
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
     * @param {IDBRequest<IDBCursorWithValue>} request 
     * @returns {Promise<Map<any, any>}
     */
    async #promiseCursorRequest(request) {
        return new Promise((resolve, reject) => {
            const values = new Map()
            request.onerror = event => reject(event.target.error)
            request.onsuccess = event => {
                /** @type {IDBCursor} */
                const cursor = event.target.result
                if (cursor) {
                    values.set(cursor.key, cursor.value)
                    cursor.continue()
                }
                else {
                    resolve(values)
                }
            }
        })
    }

    /**
     * @param {function(IDBTransaction):Promise<any>} transactionBody 
     * @param {"readonly"|"readwrite"} mode
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

    /**
     * @param {IDBVersionChangeEvent} event
     */
    #migrateIndexedDB(event) {
        console.warn(`IndexedDB upgrade needed! [${event.oldVersion} to ${event.newVersion}]`)

        /** @type {IDBDatabase} */
        const db = event.target.result

        const migrations = {
            1: () => {
                db.createObjectStore(this.#configs_store_name, { keyPath: "key" })
            },
            2: () => {
                db.createObjectStore(this.#exchange_rates_store_name, { keyPath: "symbol" })
            },
            3: () => {
                db.createObjectStore(this.#amounts_store_name, { autoIncrement: true })
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
}

export class Amount {
    /**
     * @param {number} amount 
     * @param {string} symbol 
     * @param {string} comment 
     */
    constructor(amount, symbol, comment) {
        this.amount = amount
        this.symbol = symbol
        this.comment = comment
    }
}
