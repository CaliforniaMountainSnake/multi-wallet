export class CoingeckoRepository {
    #apiDomain: string = "https://api.coingecko.com/api/v3";

    async getSupportedVsCurrencies(): Promise<string[]> {
        return await this.request("/simple/supported_vs_currencies");
    }

    async getExchangeRates(): Promise<Map<string, BtcRate>> {
        const plainRates = (await this.request("/exchange_rates"))["rates"];
        return new Map(Object.entries(plainRates));
    }

    private async request(url: string): Promise<any> {
        const response: Response = await fetch(this.#apiDomain + url, {headers: {"Accept": "application/json"}});
        if (response.status !== 200) {
            throw new Error(`Wrong API response code (${response.status})`);
        }
        return await response.json();
    }
}

export interface BtcRate {
    name: string,
    unit: string,
    value: number,
    type: "fiat" | "crypto" | "commodity",
}
