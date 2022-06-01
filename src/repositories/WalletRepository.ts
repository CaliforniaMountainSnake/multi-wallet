import {BtcRate} from "./CoingeckoRepository";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";
import {ThemeName} from "../components/Themes/InstalledThemes";
import {DoublyLinkedListRepository, Node} from "./DoublyLinkedListRepository";
import {IndexedDbNodeStore} from "./IndexedDbNodeStore";

export class WalletRepository extends BasicIndexedDBRepository {
    private storeNames = {
        configs: "configs",
        exchangeRates: "exchange_rates",
        userRates: "user_exchange_rates",
        amounts: "amounts",
    };
    private readonly amountNodeStore = new IndexedDbNodeStore<Amount>(this, this.storeNames.amounts);
    private readonly userRateNodeStore = new IndexedDbNodeStore<UserRate>(this, this.storeNames.userRates);

    public readonly amountRepository = new DoublyLinkedListRepository<Amount>(this.amountNodeStore);
    public readonly userRateRepository = new DoublyLinkedListRepository<UserRate>(this.userRateNodeStore);

    get dbName(): string {
        return "multi-wallet-app";
    }

    get dbVersion(): number {
        return 7;
    }

    getMigrations(): Map<number, (db: IDBDatabase, transaction: IDBTransaction) => Promise<void>> {
        return new Map([
            [1, async (db: IDBDatabase) => {
                db.createObjectStore(this.storeNames.configs, {keyPath: "key"});
            }],
            [2, async (db: IDBDatabase) => {
                db.createObjectStore(this.storeNames.exchangeRates, {keyPath: "symbol"});
            }],
            [3, async (db: IDBDatabase) => {
                db.createObjectStore(this.storeNames.amounts, {autoIncrement: true});
            }],
            [4, async (db: IDBDatabase) => {
                db.createObjectStore(this.storeNames.userRates, {autoIncrement: true});
            }],
            [5, async (db: IDBDatabase, transaction: IDBTransaction) => {
                // Add a new "enabled" property to all amounts.
                const store = transaction.objectStore(this.storeNames.amounts);
                const amounts = await this.promiseCursorRequest<number, Amount>(store.openCursor());
                for (const [key, amount] of amounts) {
                    amount.enabled = true;
                    store.put(amount, key);
                }
            }],
            [6, async (db: IDBDatabase, transaction: IDBTransaction) => {
                // Transform amounts store to a doubly linked list to have ability to change row order in O(1) time.
                await this.amountNodeStore.migrateStoreToDoublyLinkedList(transaction, this.amountRepository);
            }],
            [7, async (db: IDBDatabase, transaction: IDBTransaction) => {
                // Transform user rates store to a doubly linked list to have ability to change row order in O(1) time.
                await this.userRateNodeStore.migrateStoreToDoublyLinkedList(transaction, this.userRateRepository);
            }],
        ]);
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

    async getExchangeRates(): Promise<Map<string, CurrencyInfo>> {
        return await this.transaction(async transaction => {
            const store = transaction.objectStore(this.storeNames.exchangeRates);
            return await this.promiseCursorRequest<string, CurrencyInfo>(store.openCursor());
        }, "readonly");
    }

    async setExchangeRates(data: Map<string, BtcRate>): Promise<void> {
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

export interface Amount extends Node {
    amount: number,
    symbol: string,
    enabled: boolean,
    comment?: string
}

export interface UserRate extends Node {
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
} | {
    key: "light_theme",
    value: ThemeName,
} | {
    key: "dark_theme",
    value: ThemeName,
}

export type ConfigKey = Config["key"];
export type ConfigValue<K> = Extract<Config, { key: K }>["value"];
