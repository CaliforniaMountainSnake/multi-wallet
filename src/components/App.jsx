import React from "react";
import {CurrencyInfo, WalletRepository} from "../repositories/WalletRepository";
import {ExchangeRatesUpdater} from "./ExchangeRatesUpdater";
import {AddNewAmount} from "./AddNewAmount";
import {AmountsTable} from "./AmountsTable";
import {DisabledButton} from "./DisabledButton";
import {CoingeckoRepository} from "../repositories/CoingeckoRepository";

export class App extends React.Component {
    #defaultCurrency = "usd";
    #coingeckoRepository = new CoingeckoRepository();

    constructor(props) {
        super(props);
        this.state = {
            isUiBlocked: true,
            /** @type {WalletRepository} */
            dbRepository: null,
            /** @type {Map<string, Amount>} */
            amounts: new Map(),
            /** @type {Map<string, CurrencyInfo>} */
            exchangeRates: new Map(),
            ratesLastUpdateTimestamp: null,
            selectedCurrencySymbol: null,
        };
    }

    _deleteDb = async () => {
        return new Promise((resolve, reject) => {
            if (!confirm("Are you sure you want to delete the local DB?")) {
                resolve();
                return;
            }
            this.setState({isUiBlocked: true}, () => {
                console.debug("UI has been blocked, starting DB deletion process...");
                this.state.dbRepository.deleteIndexedDB().then(() => {
                    console.warn(`Database "${this.state.dbRepository.dbName}" has been deleted.`);
                    return this.#initialize();
                }).then(() => resolve()).catch(error => reject(error));
            });
        });
    };

    _onAmountsChange = () => {
        this.state.dbRepository.getAmounts().then(amounts => {
            this.setState({
                amounts: amounts,
            }, () => console.log("Amounts were changed."));
        }).catch(error => {
            this.setState(() => throw error);
        });
    };

    _onRatesChange = () => {
        Promise.all([
            this.state.dbRepository.getExchangeRates(),
            this.state.dbRepository.getConfig(WalletRepository.confNames.ratesLastUpdateTimestamp),
        ]).then(([rates, timestamp]) => {
            this.setState({
                exchangeRates: rates,
                ratesLastUpdateTimestamp: timestamp,
            }, () => console.log("Exchange rates were changed."));
        }).catch(error => {
            this.setState(() => throw error);
        });
    };

    _onSelectedCurrencyChange = () => {
        this.state.dbRepository.getConfig(WalletRepository.confNames.selectedCurrency).then(symbol => {
            this.setState({selectedCurrencySymbol: symbol}, () => {
                console.log(`Total currency was changed to "${symbol}".`);
            });
        }).catch(error => {
            this.setState(() => throw error);
        });
    };

    /**
     * @param {WalletRepository} dbRepository
     * @return {Promise<void>}
     * @private
     */
    _loadFreshExchangeRates = async (dbRepository) => {
        try {
            const rawRates = await this.#coingeckoRepository.getExchangeRates();
            await dbRepository.updateExchangeRates(rawRates);
            console.debug("Fresh exchange rates were loaded from coingecko and saved into the DB.");
        } catch (error) {
            throw new Error(`Unable to load fresh exchange rates: ${error}`);
        }
    };

    /**
     * Load data from the DB and set initial values if needed.
     * It loads data twice. This is not the fastest solution, but a quite simple and reliable.
     *
     * @param {WalletRepository} dbRepository
     * @return {Promise<[Map<string, Amount>, Map<string, CurrencyInfo>, number, string]>} [amounts, rates, timestamp, selectedCurrency]
     */
    async #seedDbData(dbRepository) {
        const dataLoader = async () => {
            return await Promise.all([
                dbRepository.getAmounts(),
                dbRepository.getExchangeRates(),
                dbRepository.getConfig(WalletRepository.confNames.ratesLastUpdateTimestamp),
                dbRepository.getConfig(WalletRepository.confNames.selectedCurrency),
            ]);
        };

        let [amounts, rates, timestamp, selectedCurrency] = await dataLoader();
        if (rates.size === 0) {
            await this._loadFreshExchangeRates(dbRepository);
        }
        if (selectedCurrency === undefined) {
            await dbRepository.setConfig(WalletRepository.confNames.selectedCurrency, this.#defaultCurrency);
        }

        return await dataLoader();
    }

    async #initialize() {
        const dbRepository = new WalletRepository();
        await dbRepository.open();
        const [amounts, rates, timestamp, selectedCurrency] = await this.#seedDbData(dbRepository);

        this.setState({
            isUiBlocked: false,
            dbRepository: dbRepository,
            amounts: amounts,
            exchangeRates: rates,
            ratesLastUpdateTimestamp: timestamp,
            selectedCurrencySymbol: selectedCurrency,
        }, () => console.info("App data were initialized."));
    }

    componentDidMount() {
        console.debug(`Component "${this.constructor.name}" was mounted.`);
        document.title = "Multi-currency Wallet";

        if (this.state.dbRepository === null) {
            this.#initialize().catch(error => {
                this.setState(() => throw error);
            });
        }
    }

    render() {
        if (this.state.isUiBlocked) {
            return <span>Initialization. Please, wait...</span>;
        }
        return (
            <React.Fragment>
                <h1>Multi-currency Wallet</h1>
                <ExchangeRatesUpdater dbRepository={this.state.dbRepository}
                                      ratesLastUpdateTimestamp={this.state.ratesLastUpdateTimestamp}
                                      loadFreshExchangeRates={this._loadFreshExchangeRates}
                                      onChange={this._onRatesChange}/>
                <AddNewAmount dbRepository={this.state.dbRepository}
                              exchangeRates={this.state.exchangeRates}
                              onChange={this._onAmountsChange}/>
                <AmountsTable dbRepository={this.state.dbRepository}
                              amounts={this.state.amounts}
                              exchangeRates={this.state.exchangeRates}
                              selectedCurrencySymbol={this.state.selectedCurrencySymbol}
                              onAmountsChange={this._onAmountsChange}
                              onSelectedCurrencyChange={this._onSelectedCurrencyChange}/>
                <br/>
                <DisabledButton onClick={this._deleteDb}>⚠ Clear DB</DisabledButton>
            </React.Fragment>
        );
    }
}
