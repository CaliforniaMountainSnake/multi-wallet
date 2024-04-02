import { delay } from "../../helpers";

export class CoingeckoRepository {
    /**
     * Coingecko Free API* has a [rate limit](https://www.coingecko.com/ru/api/documentation) of N calls/minute.
     */
    private static readonly REQUESTS_PER_MINUTE_LIMIT = 5;

    /**
     * Time in milliseconds to wait after each request to avoid API limits.
     */
    private static readonly REQUEST_DEBOUNCE_TIME_MS = (6e4 / CoingeckoRepository.REQUESTS_PER_MINUTE_LIMIT) + 100;

    private apiDomain: string = "https://api.coingecko.com/api/v3";

    async getExchangeRates(): Promise<Map<string, BtcRate>> {
        const plainRates = (await this.request("/exchange_rates"))["rates"];
        return new Map(Object.entries(plainRates));
    }

    /**
     * Get coin's OHLC (open, high, low, close).
     *
     * Candle's body:
     * 1 - 2 days:          30 minutes.
     * 3 - 30 days:         4 hours.
     * 31 days and beyond:  4 days.
     *
     * @param coinId The coin id (can be obtained from /coins/list) eg. bitcoin.
     * @param vsCurrency The target currency of market data (usd, eur, jpy, etc.)
     * @param period Data up to number of days ago (1/7/14/30/90/180/365/max).
     * @returns [timestamp, open, high, low, close][].
     */
    async getOHLC(coinId: string, vsCurrency: string, period: CoingeckoOHLCDays): Promise<CoingeckoOHLCCandle[]> {
        const days = period === "4_hours_candle_30_days" ? 30 : 365;
        return await this.request(`/coins/${coinId}/ohlc?vs_currency=${vsCurrency}&days=${days}`);
    }

    /**
     * Get historical market data include price, market cap, and 24h volume (granularity auto).
     *
     * Data granularity is automatic (cannot be adjusted):
     * 1 day from current time          = 5 minute interval data.
     * 1 - 90 days from current time    = hourly data.
     * above 90 days from current time  = daily data (00:00 UTC).
     *
     * @param coinId The coin id (can be obtained from /coins) eg. bitcoin.
     * @param vsCurrency The target currency of market data (usd, eur, jpy, etc.)
     * @param days Data up to number of days ago (eg. 1,14,30,max).
     */
    async getMarketHistory(coinId: string, vsCurrency: string, days: number | "max"): Promise<CoingeckoMarketHistory> {
        return await this.request(`/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`);
    }

    async getSupportedVsCurrencies(): Promise<string[]> {
        return await this.request("/simple/supported_vs_currencies");
    }

    private async request(url: string): Promise<any> {
        await delay(CoingeckoRepository.REQUEST_DEBOUNCE_TIME_MS, "api debounce.");
        const response: Response = await fetch(this.apiDomain + url, { headers: { "Accept": "application/json" } });
        if (response.status !== 200) {
            throw new Error(`Wrong API response code (${response.status})`);
        }
        return response.json();
    }
}

export const coingeckoRepository = new CoingeckoRepository();

/**
 * [timestamp, open, high, low, close].
 */
export type CoingeckoOHLCCandle = [number, number, number, number, number]

export interface CoingeckoMarketHistory {
    readonly prices: [number, number][],
    readonly market_caps: [number, number][],
    readonly total_volumes: [number, number][],
}

/**
 * Data up to number of days ago.
 */
export type CoingeckoOHLCDays = "4_hours_candle_30_days" | "4_days_candle_max_days"

export interface BtcRate {
    name: string,
    unit: string,
    value: number,
    type: "fiat" | "crypto" | "commodity",
}
