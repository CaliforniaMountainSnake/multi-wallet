/**
 * @ts-check
 */
export class BasicIndexedDBRepository {
    /**
     * @type {IDBDatabase}
     */
    #db;

    /**
     * @return {string}
     */
    get dbName() {
        throw new Error("You must override this method.");
    }

    /**
     * @return {number}
     */
    get dbVersion() {
        throw new Error("You must override this method.");
    }

    /**
     * Get migrations. First migration must have an index "1".
     *
     * @param {IDBDatabase} db
     * @return {Map<number, function():void>}
     */
    getMigrations(db) {
        throw new Error("You must override this method.");
    }

    /**
     * @returns {Promise<void>}
     */
    async open() {
        return new Promise((resolve, reject) => {
            let openRequest = indexedDB.open(this.dbName, this.dbVersion);
            openRequest.onupgradeneeded = event => this.#migrateIndexedDB(event);
            openRequest.onblocked = event => this.#onBlocked(event);
            openRequest.onerror = () => reject(openRequest.error);
            openRequest.onsuccess = () => {
                this.#db = openRequest.result;
                resolve();
                console.debug(`IndexedDB "${this.dbName}" has been opened.`);
            };
        });
    }

    /**
     * @returns {Promise<void>}
     */
    async deleteIndexedDB() {
        return new Promise((resolve, reject) => {
            // At first, close the connection to avoid "onblocked" event.
            this.#db.close();

            // Delete the DB.
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            deleteRequest.onblocked = event => this.#onBlocked(event);
            deleteRequest.onerror = event => reject(event.target.error);
            deleteRequest.onsuccess = event => resolve();
        });
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
    async _deleteByKey(storeName, key) {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(storeName);
            return await this._promiseRequest(store.delete(key));
        });
    }

    /**
     * @param {string} storeName
     * @param {any} key
     * @returns {Promise<any>} Rejected promise if there is no row with the given key.
     */
    async _getByKey(storeName, key) {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(storeName);
            const value = await this._promiseRequest(store.get(key));
            if (value === undefined) {
                throw new Error(`Unable to find a row with key: "${key}"`);
            }

            return value;
        }, "readonly");
    }

    /**
     * @param {IDBRequest} request
     * @returns {Promise<any>}
     */
    async _promiseRequest(request) {
        return new Promise((resolve, reject) => {
            request.onerror = event => reject(event.target.error);
            request.onsuccess = event => resolve(event.target.result);
        });
    }

    /**
     * @param {IDBRequest<IDBCursorWithValue>} request
     * @returns {Promise<Map<any, any>>}
     */
    async _promiseCursorRequest(request) {
        return new Promise((resolve, reject) => {
            const values = new Map();
            request.onerror = event => reject(event.target.error);
            request.onsuccess = event => {
                /** @type {IDBCursor} */
                const cursor = event.target.result;
                if (cursor) {
                    values.set(cursor.key, cursor.value);
                    cursor.continue();
                } else {
                    resolve(values);
                }
            };
        });
    }

    /**
     * @param {function(IDBTransaction):Promise<any>} transactionBody
     * @param {"readonly"|"readwrite"} mode
     * @returns {Promise<any>}
     */
    async _transaction(transactionBody, mode = "readwrite") {
        return new Promise((resolve, reject) => {
            const transaction = this.#db.transaction(this.#db.objectStoreNames, mode);
            const transactionResultPromise = transactionBody(transaction);

            transaction.onabort = event => reject(event.target.error);
            transaction.oncomplete = () => {
                transactionResultPromise
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            };
        });
    }

    /**
     * @param {IDBVersionChangeEvent} event
     */
    #onBlocked(event) {
        // There is another connection to the DB.
        // And this connection was not closed after firing the "db.onversionchange" there.
        const msg = "Unable to update the DB version (or delete the DB)!"
            + " There is an another connection to the same DB."
            + " Please, close another tabs before update.";
        console.warn(msg, event);
        alert(msg);
    }

    /**
     * @param {IDBVersionChangeEvent} event
     */
    #migrateIndexedDB(event) {
        console.warn(`IndexedDB upgrade needed! [${event.oldVersion} to ${event.newVersion}]`);

        /** @type {IDBDatabase} */
        const db = event.target.result;
        const migrations = this.getMigrations(db);

        for (let i = event.oldVersion + 1; i <= event.newVersion; i++) {
            if (!migrations.has(i)) {
                console.error(`Migration "${i}" does not exist!`);
                break;
            }

            migrations.get(i)();
            console.debug(`Migration "${i}" has been applied.`);
        }
    }
}
