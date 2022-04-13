// @ts-check
export class CoingeckoRepository {
    #apiDomain = "https://api.coingecko.com/api/v3"

    /**
     * @returns {Promise<string[]>}
     */
    async getSupportedVsCurrencies() {
        return await this.#request("/simple/supported_vs_currencies")
    }

    /**
     * @returns {Promise<Map<string, BtcRate>>}
     */
    async getExchangeRates() {
        const plainRates = (await this.#request("/exchange_rates"))["rates"];
        return new Map(Object.entries(plainRates))
    }

    async #request(url) {
        const response = await fetch(this.#apiDomain + url, {headers: {"Accept": "application/json"}})
        if (response.status !== 200) {
            throw new Error(`Wrong API response code (${response.status})`)
        }
        return await response.json()
    }
}

export class BtcRate {
    /**
     * @param {string} name
     * @param {string} unit
     * @param {number} value
     * @param {string} type
     */
    constructor(name, unit, value, type) {
        this.name = name
        this.unit = unit
        this.value = value
        this.type = type
    }
}
