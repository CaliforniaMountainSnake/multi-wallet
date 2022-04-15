import React from "react";
import {WalletRepository} from "../repositories/WalletRepository";
import {ExchangeRatesUpdater} from "./ExchangeRatesUpdater";
import {AddNewAmount} from "./AddNewAmount";

export class AppComponent extends React.Component {
    #dbRepository = new WalletRepository();

    constructor(props) {
        super(props);
        this.state = {
            isInitialized: false,
            exchangeRates: new Map(),
            amounts: new Map(),
        };
    }

    #handleAmountsChange = () => {
        console.log("Amounts were changed.");
        this.#dbRepository.getAmounts().then(amounts => {
            this.setState({
                amounts: amounts,
            });
        }).catch(error => {
            this.setState(() => throw error);
        });
    };

    #handleRatesChange = () => {
        console.log("Exchange rates were changed.");
        this.#dbRepository.getExchangeRates().then(rates => {
            this.setState({
                exchangeRates: rates,
            });
        }).catch(error => {
            this.setState(() => throw error);
        });
    };

    /**
     * @return {Promise<([Map<string, BtcRate>, Map<string, Amount>])>}
     */
    async #initialize() {
        await this.#dbRepository.open();
        const rates = await this.#dbRepository.getExchangeRates();
        const amounts = await this.#dbRepository.getAmounts();

        return [rates, amounts];
    }

    componentDidMount() {
        document.title = "Multi-currency Wallet";

        this.#initialize().then(data => {
            const [rates, amounts] = data;
            this.setState({
                isInitialized: true,
                exchangeRates: rates,
                amounts: amounts,
            });
            console.debug("App data were initialized.");
        }).catch(error => {
            this.setState(() => throw error);
        });
    }

    render() {
        if (!this.state.isInitialized) {
            return <h1>Initialization. Please, wait...</h1>;
        }
        return (
            <React.Fragment>
                <h1>Multi-currency Wallet</h1>
                <ExchangeRatesUpdater dbRepository={this.#dbRepository}
                                      onChange={this.#handleRatesChange}/>
                <AddNewAmount dbRepository={this.#dbRepository}
                              exchangeRates={this.state.exchangeRates}
                              onChange={this.#handleAmountsChange}/>
            </React.Fragment>
        );
    }
}
