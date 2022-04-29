import {BtcRate} from "./CoingeckoRepository";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";

export class WalletRepository extends BasicIndexedDBRepository {
    private storeNames = {
        configs: "configs",
        exchangeRates: "exchange_rates",
        userRates: "user_exchange_rates",
        amounts: "amounts",
    };

    get dbName(): string {
        return "multi-wallet-app";
    }

    get dbVersion(): number {
        return 5;
    }

    getMigrations(): Map<number, (db: IDBDatabase, transaction: IDBTransaction) => Promise<void>> {
        const map = new Map<number, (db: IDBDatabase, transaction: IDBTransaction) => Promise<void>>();
        map.set(1, async (db: IDBDatabase) => {
            db.createObjectStore(this.storeNames.configs, {keyPath: "key"});
        });
        map.set(2, async (db: IDBDatabase) => {
            db.createObjectStore(this.storeNames.exchangeRates, {keyPath: "symbol"});
        });
        map.set(3, async (db: IDBDatabase) => {
            db.createObjectStore(this.storeNames.amounts, {autoIncrement: true});
        });
        map.set(4, async (db: IDBDatabase) => {
            db.createObjectStore(this.storeNames.userRates, {autoIncrement: true});
        });
        map.set(5, async (db: IDBDatabase, transaction: IDBTransaction) => {
            // Add a new "enabled" property to all amounts.
            const store = transaction.objectStore(this.storeNames.amounts);
            const amounts = await this.promiseCursorRequest<number, Amount>(store.openCursor());
            for (const [key, amount] of amounts) {
                amount.enabled = true;
                store.put(amount, key);
            }
        });
        return map;
    }

    /**
     * Get config value.
     *
     * @see https://stackoverflow.com/a/72021643
     */
    async getConfig<K extends ConfigKey>(key: K): Promise<ConfigValue<K> | undefined> {
        const conf: Config | undefined = await this.getByKey(this.storeNames.configs, key);
        return conf?.value as any;// I have no ideas why we need to assert "any" here...
    }

    async setConfig(conf: Config): Promise<void> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.configs);
            await this.promiseRequest(store.put(conf));
        });
    }

    async getAmounts(): Promise<Map<number, Amount>> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.amounts);
            return await this.promiseCursorRequest<number, Amount>(store.openCursor());
        }, "readonly");
    }

    async getAmount(key: number): Promise<Amount> {
        return await this.getByKeyOfThrowError(this.storeNames.amounts, key);
    }

    async putAmount(amount: Amount, key?: number): Promise<IDBValidKey> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.amounts);
            return await this.promiseRequest(store.put(amount, key));
        });
    }

    async deleteAmount(key: number): Promise<void> {
        return await this.deleteByKey(this.storeNames.amounts, key);
    }

    async getUserRates(): Promise<Map<number, UserRate>> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.userRates);
            return await this.promiseCursorRequest<number, UserRate>(store.openCursor());
        }, "readonly");
    }

    async addUserRate(rate: UserRate): Promise<IDBValidKey> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.userRates);
            return await this.promiseRequest(store.add(rate));
        });
    }

    async deleteUserRate(key: number): Promise<void> {
        return await this.deleteByKey(this.storeNames.userRates, key);
    }

    async getExchangeRates(): Promise<Map<string, CurrencyInfo>> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.exchangeRates);
            return await this.promiseCursorRequest<string, CurrencyInfo>(store.openCursor());
        }, "readonly");
    }

    async updateExchangeRates(data: Map<string, BtcRate>): Promise<void> {
        return await this.transaction(async transaction => {
            const ratesStore = transaction.objectStore(this.storeNames.exchangeRates);
            const configStore = transaction.objectStore(this.storeNames.configs);

            // Save exchange rates.
            for (const [key, value] of data.entries()) {
                const info: CurrencyInfo = {
                    symbol: key,
                    name: value.name,
                    unit: value.unit,
                    value: value.value,
                    type: value.type
                };
                ratesStore.put(info);
            }

            // Set last update timestamp.
            const conf: Config = {
                key: "last_update_timestamp",
                value: Date.now()
            };
            await this.promiseRequest(configStore.put(conf));
        });
    }
}

export interface Amount {
    amount: number,
    symbol: string,
    enabled: boolean,
    comment?: string
}

export interface UserRate {
    symbol1: string,
    symbol2: string,
}

export interface CurrencyInfo extends BtcRate {
    symbol: string;
}

export type Config = {
    key: "last_update_timestamp",
    value: number,
} | {
    key: "selected_currency",
    value: string,
}

export type ConfigKey = Config["key"];
export type ConfigValue<K> = Extract<Config, { key: K }>["value"];
