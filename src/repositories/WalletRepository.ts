import {ThemeName} from "../components/Themes/InstalledThemes";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";
import {BtcRate} from "./api/CoingeckoRepository";
import {DoublyLinkedListRepository, Node} from "./DoublyLinkedListRepository";
import {IndexedDbNodeStore} from "./IndexedDbNodeStore";
import {CoingeckoOHLCHistory, OHLCRepository, PriceCandle} from "./OHLCRepository";

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
    public readonly ohlcRepository = new OHLCRepository(this);

    get dbName(): string {
        return "multi-wallet-app";
    }

    get dbVersion(): number {
        return 8;
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
            [8, async (db: IDBDatabase, transaction: IDBTransaction) => {
                // This store uses a composite (compound) primary key.
                db.createObjectStore(this.ohlcRepository.storeName,
                    {keyPath: ["timestamp", "symbol", "type"] as (keyof PriceCandle)[]});

                // This index uses a composite (compound) key.
                transaction.objectStore(this.ohlcRepository.storeName)
                    .createIndex(this.ohlcRepository.indexes.symbol_type_index,
                        ["symbol", "type"] as (keyof PriceCandle)[]);
            }],
        ]);
    }

    async resetApiData(exchangeRates: Map<string, BtcRate>, history: CoingeckoOHLCHistory): Promise<void> {
        return this.transaction(async transaction => {
            await this.resetExchangeRates(transaction, exchangeRates);
            await this.ohlcRepository.resetCoingeckoCandles(transaction, history);

            // Set timestamp of the api data last update.
            await this.promiseRequest(transaction.objectStore(this.storeNames.configs).put({
                key: "last_update_timestamp",
                value: Date.now()
            } as Config));
        });
    }

    async getUserConfig(): Promise<UserConfig | undefined> {
        const [selectedCurrency, lightTheme, darkTheme] = await Promise.all([
            this.getConfig("selected_currency"),
            this.getConfig("light_theme"),
            this.getConfig("dark_theme"),
        ]);

        if (!selectedCurrency || !lightTheme || !darkTheme) {
            return undefined;
        }
        return {
            selectedCurrencySymbol: selectedCurrency,
            lightTheme: lightTheme,
            darkTheme: darkTheme,
        };
    }

    getUniqueCurrencies(selectedCurrencySymbol: string, amounts: Map<number, Amount>,
                        rates: Map<number, UserRate>): Set<string> {
        const result: Set<string> = new Set([selectedCurrencySymbol]);
        for (const amount of amounts.values()) {
            result.add(amount.symbol);
        }
        for (const rate of rates.values()) {
            result.add(rate.symbol1).add(rate.symbol2);
        }

        return result;
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

    private async resetExchangeRates(transaction: IDBTransaction, rates: Map<string, BtcRate>): Promise<void> {
        const store = transaction.objectStore(this.storeNames.exchangeRates);
        await this.promiseRequest(store.clear());

        for (const [symbol, rate] of rates.entries()) {
            const info: CurrencyInfo = {
                symbol: symbol,
                name: rate.name,
                unit: rate.unit,
                value: rate.value,
                type: rate.type
            };
            store.put(info);
        }
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

export interface UserConfig {
    selectedCurrencySymbol: string,
    lightTheme: ThemeName,
    darkTheme: ThemeName,
}
