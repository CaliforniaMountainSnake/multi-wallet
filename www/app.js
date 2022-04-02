async function input() {
    let book1 = {
        id: 5893,
        title: "Test book!",
        created_at: Date.now()
    }
    let book2 = {
        id: 5894,
        title: "Another book!",
        created_at: Date.now()
    }

    // Open repository
    // Ошибки запросов в транзакции вызывают отмену транзакции,
    // только если всплытие ошибки недвусмысленно не предотвращено
    // методом Event.preventDefault() внутри IDBRequest.onerror().
    let repository = new IndexedDBRepository()
    await repository.open()
    console.log(`IndexedDB "${repository.dbName}" has been opened.`)

    // Set listeners.
    setListeners(repository)

    // Test transaction
    try {
        const transactionResult = await repository.transaction(async transaction => {
            let booksStore = transaction.objectStore("books")
            let request = booksStore.add(book1)
            booksStore.add(book2)
            return [book1, book2]
        })
        console.log("Transaction has been completed:", transactionResult)
    } catch (error) {
        console.warn("Unable to execute a transaction:", error)
    }
}

class IndexedDBRepository {
    /** @type {IDBDatabase} */
    #db
    #dbName = "test"
    #dbVersion = 3

    get dbName() {
        return this.#dbName
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
     * @param {function(IDBTransaction):Promise<any>} transactionBody 
     * @returns {Promise<any>}
     */
    async transaction(transactionBody, mode = "readwrite") {
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
        console.warn(`Upgrade needed! [${event.oldVersion} to ${event.newVersion}]`)

        /** @type {IDBDatabase} */
        const db = event.target.result

        let migrations = {
            1: function () {
                db.createObjectStore("books", { keyPath: "id" })
            },
            2: function () { console.log("Migration has been started.") },
            3: function () { console.log("Migration has been started.") },
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
        let amount = prompt("Enter the amount of money:")
        console.log(`Received: ${amount}`)
    })
    safeOnClick(document.getElementById("update_exchange_rates"), async () => {

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
