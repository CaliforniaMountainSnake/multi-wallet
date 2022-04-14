import React from "react";
import PropTypes from "prop-types";
import {WalletRepository} from "../repositories/WalletRepository";
import {CoingeckoRepository} from "../repositories/CoingeckoRepository";
import {showError} from "../helpers";

/**
 * Use a "controlled component" pattern. Set onChange() and onSubmit().
 */
export class UpdateExchangeRates extends React.Component {
    #coingeckoRepository = new CoingeckoRepository();

    constructor(props) {
        super(props);
        this.state = {
            inProgress: false,
            ratesLastUpdateTimestamp: null,
        };
    }

    /**
     * @param e {MouseEvent}
     * @TODO: Race condition: a button can be pressed multiple times while state is updating.
     */
    handleClick = e => {
        this.setState({inProgress: true});
        this.updateRates().then(rates => {
            console.log("Exchange rates have been updated:", rates);
            this.syncLastUpdateTimestamp();
        }).catch(error => {
            showError(`Unable to update exchange rates: ${error}`);
        }).finally(() => {
            this.setState({inProgress: false});
        });
    };

    syncLastUpdateTimestamp() {
        this.props.dbRepository.getExchangeRatesLastUpdateTimestamp().then(timestamp => {
            this.setState({ratesLastUpdateTimestamp: timestamp});
        });
    }

    /**
     * @returns {Promise<Map<string, BtcRate>>}
     */
    async updateRates() {
        // Get rates from coingecko.
        const rawRates = await this.#coingeckoRepository.getExchangeRates();

        // Save rates into the DB.
        return await this.props.dbRepository.updateExchangeRates(rawRates);
    }

    componentDidMount() {
        this.syncLastUpdateTimestamp();
    }

    render() {
        const updateTimestamp = this.state.ratesLastUpdateTimestamp;
        return (
            <div>
                Date of the last exchange rates update:
                <span>
                    {updateTimestamp === null
                        ? "It seems you have not updated exchange rates yet..."
                        : (new Date(updateTimestamp)).toLocaleString()}
                </span>
                <div>
                    <button onClick={this.handleClick} disabled={this.state.inProgress}>
                        🗘 Update exchange rates
                    </button>
                </div>
            </div>
        );
    }
}

UpdateExchangeRates.propTypes = {
    dbRepository: PropTypes.instanceOf(WalletRepository).isRequired
};
