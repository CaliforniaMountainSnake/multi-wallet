export abstract class BasicIndexedDBRepository {
    // You must not use this var before calling "open()".
    private db!: IDBDatabase;

    abstract get dbName(): string

    abstract get dbVersion(): number

    /**
     * Get migrations. First migration must have an index "1".
     */
    abstract getMigrations(): Map<number, (db: IDBDatabase) => void>

    async open(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request: IDBOpenDBRequest = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = event => this.migrateIndexedDB(event, request.result);
            request.onblocked = event => this.onBlocked(event);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
                console.debug(`IndexedDB "${this.dbName}" has been opened.`);
            };
        });
    }

    async deleteIndexedDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            // At first, close the connection to avoid "onblocked" event.
            this.db.close();

            // Delete the DB.
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onblocked = event => this.onBlocked(event);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Delete a row.
     * Be sure to convert the key to a number when the DB key has a number type.
     *
     * Warning! The delete methods always return to success event handler with undefined as result
     * whether given key was deleted or not.
     *
     * @see https://stackoverflow.com/a/14330794
     */
    protected async deleteByKey(storeName: string, key: IDBValidKey): Promise<void> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(storeName);
            return await this.promiseRequest(store.delete(key));
        });
    }

    protected async getByKey(storeName: string, key: IDBValidKey): Promise<any> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(storeName);
            return await this.promiseRequest(store.get(key));
        }, "readonly");
    }

    protected async getByKeyOfThrowError(storeName: string, key: IDBValidKey): Promise<any> {
        const value = await this.getByKey(storeName, key);
        if (value) {
            return value;
        }
        throw new Error(`Unable to find a row with key: "${key}" in the store "${storeName}"`);
    }

    protected async promiseRequest<V>(request: IDBRequest<V>): Promise<V> {
        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    protected async promiseCursorRequest<K extends IDBValidKey, V>(
        request: IDBRequest<IDBCursorWithValue | null>
    ): Promise<Map<K, V>> {
        return new Promise((resolve, reject) => {
            const values = new Map();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const cursor: IDBCursorWithValue | null = request.result;
                if (cursor) {
                    values.set(cursor.key, cursor.value);
                    cursor.continue();
                } else {
                    resolve(values);
                }
            };
        });
    }

    protected async transaction<V>(
        body: (transaction: IDBTransaction) => Promise<V>,
        mode: "readonly" | "readwrite" = "readwrite"
    ): Promise<V> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.db.objectStoreNames, mode);
            const transactionResultPromise = body(transaction);

            transaction.onabort = event => reject((event.target as IDBTransaction).error);
            transaction.oncomplete = () => {
                transactionResultPromise
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            };
        });
    }

    private onBlocked(event: Event): void {
        // There is another connection to the DB.
        // And this connection was not closed after firing the "db.onversionchange" there.
        const msg = "Unable to update the DB version (or delete the DB)!"
            + " There is an another connection to the same DB."
            + " Please, close another tabs before update.";
        console.warn(msg, event);
        alert(msg);
    }

    private migrateIndexedDB(event: IDBVersionChangeEvent, db: IDBDatabase): void {
        console.warn(`IndexedDB upgrade needed! [${event.oldVersion} to ${event.newVersion}]`);
        if (!event.newVersion) {
            console.debug("Database is being deleted...");
            return;
        }

        const migrations = this.getMigrations();
        for (let i = event.oldVersion + 1; i <= event.newVersion; i++) {
            const migration = migrations.get(i);
            if (!migration) {
                throw new Error(`Migration "${i}" does not exist!`);
            }

            migration(db);
            console.debug(`Migration "${i}" has been applied.`);
        }
    }
}
