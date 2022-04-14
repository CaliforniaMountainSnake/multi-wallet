import {BtcRate} from "./CoingeckoRepository.js";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";

/**
 * @ts-check
 */
export class WalletRepository extends BasicIndexedDBRepository {
    #storeNames = {
        configs: "configs",
        exchangeRates: "exchange_rates",
        amounts: "amounts",
    };
    #confNames = {
        ratesLastUpdateTimestamp: "last_update_timestamp"
    };

    get dbName() {
        return "multi-wallet-app";
    }

    get dbVersion() {
        return 3;
    }

    /**
     * @param {IDBDatabase} db
     * @return {Map<number, function():void>}
     */
    getMigrations(db) {
        const map = new Map();
        map.set(1, () => {
            db.createObjectStore(this.#storeNames.configs, {keyPath: "key"});
        });
        map.set(2, () => {
            db.createObjectStore(this.#storeNames.exchangeRates, {keyPath: "symbol"});
        });
        map.set(3, () => {
            db.createObjectStore(this.#storeNames.amounts, {autoIncrement: true});
        });
        return map;
    }

    async getExchangeRatesLastUpdateTimestamp() {
        return await this.getConfig(this.#confNames.ratesLastUpdateTimestamp);
    }

    /**
     * @param {string} key
     * @returns {Promise<any>} Config value.
     */
    async getConfig(key) {
        return (await this._getByKey(this.#storeNames.configs, key))["value"];
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
            await this.getConfig(key);
            return true;
        } catch (error) {
            await this.setConfig(key, value);
            return false;
        }
    }

    /**
     * @param {string} key
     * @param {any} value
     * @returns {Promise<string>} Added row's key.
     */
    async setConfig(key, value) {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(this.#storeNames.configs);
            return await this._promiseRequest(store.put({"key": key, "value": value}));
        });
    }

    /**
     * @returns {Promise<Map<string, Amount>>}
     */
    async getAmounts() {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(this.#storeNames.amounts);
            return await this._promiseCursorRequest(store.openCursor());
        }, "readonly");
    }

    /**
     * @param {number} key
     * @returns {Promise<Amount>}
     */
    async getAmount(key) {
        return await this._getByKey(this.#storeNames.amounts, key);
    }

    /**
     * @param {number} amount
     * @param {string} currency
     * @param {string} comment
     * @returns {Promise<number>} Added row's key.
     */
    async addAmount(amount, currency, comment) {
        const amountObj = new Amount(amount, currency, comment);

        return await this._transaction(async transaction => {
            const store = transaction.objectStore(this.#storeNames.amounts);
            return await this._promiseRequest(store.add(amountObj));
        });
    }

    /**
     * @param {number} key
     * @returns {Promise<number>} Deleted row's key.
     */
    async deleteAmount(key) {
        return await this._deleteByKey(this.#storeNames.amounts, key);
    }

    /**
     * @param {string} symbol
     * @returns {Promise<BtcRate>}
     */
    async getBtcToSymbolExchangeRate(symbol) {
        return await this._getByKey(this.#storeNames.exchangeRates, symbol);
    }

    /**
     * @returns {Promise<Map<string, BtcRate>>}
     */
    async getExchangeRates() {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(this.#storeNames.exchangeRates);
            return await this._promiseCursorRequest(store.openCursor());
        }, "readonly");
    }

    /**
     * @param {Map<string, BtcRate>} data
     * @returns {Promise<Map<string, BtcRate>>}
     */
    async updateExchangeRates(data) {
        return await this._transaction(async transaction => {
            const ratesStore = transaction.objectStore(this.#storeNames.exchangeRates);
            const configStore = transaction.objectStore(this.#storeNames.configs);

            // Save exchange rates.
            for (const [key, value] of data.entries()) {
                ratesStore.put(Object.assign({"symbol": key}, value));
            }

            // Set last update timestamp.
            await this._promiseRequest(configStore.put({
                "key": this.#confNames.ratesLastUpdateTimestamp,
                "value": Date.now()
            }));
            return await this._promiseCursorRequest(ratesStore.openCursor());
        });
    }
}

export class Amount {
    /**
     * @param {number} amount
     * @param {string} symbol
     * @param {string} comment
     */
    constructor(amount, symbol, comment) {
        this.amount = amount;
        this.symbol = symbol;
        this.comment = comment;
    }
}
