import {CoingeckoOHLCCandle, CoingeckoOHLCDays} from "./api/CoingeckoRepository";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";

export class OHLCRepository {
    public readonly storeName = "ohlc_candles";
    public readonly indexes = {
        symbol_type_index: "symbol_type_index"
    };
    private readonly repository: BasicIndexedDBRepository;

    constructor(repository: BasicIndexedDBRepository) {
        this.repository = repository;
    }

    /**
     * Get price candles.
     * Candles are always sorted by timestamp (IndexedDB automatically sort them).
     *
     * @param symbol Currency symbol. (e.g. usd, btc, eth).
     * @param days Max number of rows returned.
     */
    public async getCandles(symbol: PriceCandle["symbol"], days: number): Promise<Map<number, PriceCandle>> {
        const config = this.getOHLCQueryConfig(days);
        return this.repository.transaction(async transaction => {
            const store = transaction.objectStore(this.storeName);
            const index = store.index(this.indexes.symbol_type_index);
            return this.repository.promiseCursorRequest<number, PriceCandle>(
                index.openCursor([symbol, config.type], "prev"),
                config.limit, value => value.timestamp.getTime());
        });
    }

    public async resetCoingeckoCandles(transaction: IDBTransaction, history: CoingeckoOHLCHistory): Promise<void> {
        const store = transaction.objectStore(this.storeName);
        await this.repository.promiseRequest(store.clear());

        history.forEach(info => info.candles.forEach(candle => {
            store.put(this.preprocessCoingeckoCandle(info.type, info.symbol, candle));
        }));
    }

    private preprocessCoingeckoCandle(type: PriceCandle["type"], symbol: PriceCandle["symbol"],
                                      candle: CoingeckoOHLCCandle): PriceCandle {
        return {
            type: type,
            symbol: symbol,
            timestamp: new Date(candle[0]),
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
        };
    }

    private getOHLCQueryConfig(days: number): {
        type: PriceCandle["type"],
        limit: number,
    } {
        if (days <= 30) {
            return {
                type: "4_hours_candle_30_days",
                limit: days * (24 / 4),
            };
        }

        return {
            type: "4_days_candle_max_days",
            limit: days / 4,
        };
    }
}

export type CoingeckoOHLCHistory = {
    type: PriceCandle["type"],
    symbol: PriceCandle["symbol"],
    candles: CoingeckoOHLCCandle[]
}[];

export interface PriceCandle {
    type: CoingeckoOHLCDays,
    timestamp: Date,
    symbol: string,
    open: number,
    high: number,
    low: number,
    close: number,
}
