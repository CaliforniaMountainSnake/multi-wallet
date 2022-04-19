import React from "react";
import PropTypes from "prop-types";
import {DisabledButton} from "./DisabledButton";
import {showError} from "../helpers";
import {WalletRepository} from "../repositories/WalletRepository";

export class ExchangeRatesUpdater extends React.Component {
    _handleClick = async () => {
        try {
            await this.props.loadFreshExchangeRates(this.props.dbRepository);
            this.props.onChange();
        } catch (error) {
            showError(error);
        }
    };

    render() {
        return (
            <div>
                Date of the last exchange rates update:
                <span>
                    {(new Date(this.props.ratesLastUpdateTimestamp)).toLocaleString()}
                </span>
                <div>
                    <DisabledButton onClick={this._handleClick}>
                        🗘 Update exchange rates
                    </DisabledButton>
                </div>
            </div>
        );
    }
}

ExchangeRatesUpdater.propTypes = {
    dbRepository: PropTypes.instanceOf(WalletRepository).isRequired,
    ratesLastUpdateTimestamp: PropTypes.number.isRequired,
    // async function!
    loadFreshExchangeRates: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
};
