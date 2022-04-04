export class CoingeckoRepository {
    #apiDomain = "https://api.coingecko.com/api/v3"

    async getSupportedVsCurrencies() {
        return await this.#request("/simple/supported_vs_currencies")
    }

    async getExchangeRates() {
        return await this.#request("/exchange_rates")
    }

    async #request(url) {
        const response = await fetch(this.#apiDomain + url, { headers: { "Accept": "application/json" } })
        if (response.status != 200) {
            throw new Error(`Wrong API response code (${response.status})`)
        }
        return await response.json()
    }
}
