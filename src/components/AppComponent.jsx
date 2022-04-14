import React from "react";
import {WalletRepository} from "../repositories/WalletRepository";
import {UpdateExchangeRates} from "./UpdateExchangeRates";

export class AppComponent extends React.Component {
    #dbRepository = new WalletRepository();

    constructor(props) {
        super(props);
        this.state = {isInitialized: false};
    }

    componentDidMount() {
        document.title = "Multi-currency Wallet";

        this.#dbRepository.open().then(() => {
            this.setState({
                isInitialized: true
            });
        }).catch(error => {
            this.setState(() => {
                throw error;
            });
        });
    }

    render() {
        if (!this.state.isInitialized) {
            return <h1>Initialization. Please, wait...</h1>;
        }
        return (
            <React.Fragment>
                <h1>Multi-currency Wallet</h1>
                <UpdateExchangeRates dbRepository={this.#dbRepository}/>
            </React.Fragment>
        );
    }
}
