import {BtcRate} from "./CoingeckoRepository.js";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";

/**
 * @TODO: create "Config" object.
 * @ts-check
 */
export class WalletRepository extends BasicIndexedDBRepository {
    static confNames = {
        ratesLastUpdateTimestamp: "last_update_timestamp",
        selectedCurrency: "selected_currency",
    };
    #storeNames = {
        configs: "configs",
        exchangeRates: "exchange_rates",
        amounts: "amounts",
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

    /**
     * @param {string} key
     * @returns {Promise<any|undefined>} Config value or undefined if this config is not set.
     */
    async getConfig(key) {
        /** @type {Config|undefined} */
        const conf = await this._getByKey(this.#storeNames.configs, key);
        return conf === undefined ? undefined : conf.value;
    }

    /**
     * @param {string} key
     * @param {any} value
     * @returns {Promise<any>} The set config value. Should be equal to the {value} param.
     */
    async setConfig(key, value) {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(this.#storeNames.configs);
            await this._promiseRequest(store.put(new Config(key, value)));
            return (await this._promiseRequest(store.get(key)))["value"];
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
        return await this._getByKeyOfThrowError(this.#storeNames.amounts, key);
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
     * @returns {Promise<CurrencyInfo>}
     */
    async getCurrencyInfo(symbol) {
        return await this._getByKeyOfThrowError(this.#storeNames.exchangeRates, symbol);
    }

    /**
     * @returns {Promise<Map<string, CurrencyInfo>>}
     */
    async getExchangeRates() {
        return await this._transaction(async transaction => {
            const store = transaction.objectStore(this.#storeNames.exchangeRates);
            return await this._promiseCursorRequest(store.openCursor());
        }, "readonly");
    }

    /**
     * @param {Map<string, BtcRate>} data
     * @returns {Promise<void>}
     */
    async updateExchangeRates(data) {
        return await this._transaction(async transaction => {
            const ratesStore = transaction.objectStore(this.#storeNames.exchangeRates);
            const configStore = transaction.objectStore(this.#storeNames.configs);

            // Save exchange rates.
            for (const [key, value] of data.entries()) {
                // ratesStore.put(Object.assign({"symbol": key}, value));
                ratesStore.put(new CurrencyInfo(key, value.name, value.unit, value.value, value.type));
            }

            // Set last update timestamp.
            await this._promiseRequest(configStore.put(new Config(
                WalletRepository.confNames.ratesLastUpdateTimestamp,
                Date.now(),
            )));
        });
    }
}

export class Config {
    /**
     * @param {string} key
     * @param {any} value
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
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

export class CurrencyInfo extends BtcRate {
    /**
     * @param {string} symbol
     * @param {string} name
     * @param {string} unit
     * @param {number} value
     * @param {string} type
     */
    constructor(symbol, name, unit, value, type) {
        super(name, unit, value, type);
        this.symbol = symbol;
    }
}
