import React from "react";
import PropTypes from "prop-types";
import {CurrencySelect} from "./CurrencySelect";
import {Amount, CurrencyInfo} from "../repositories/WalletRepository";
import {convertAmountToCurrency, formatAmount} from "../helpers";

export class AmountTotalRow extends React.Component {
    /**
     * @return {number}
     */
    #calculateTotalSum() {
        /** @type {Map<string, Amount>} */
        const amounts = this.props.amounts;
        /** @type {Map<string, CurrencyInfo>} */
        const rates = this.props.exchangeRates;
        const selectedCurrencyInfo = rates.get(this.props.selectedCurrencySymbol);

        let resultSum = 0;
        for (const amount of amounts.values()) {
            resultSum += convertAmountToCurrency(rates, amount, selectedCurrencyInfo.symbol);
        }
        return resultSum;
    }

    render() {
        /** @type {Map<string, CurrencyInfo>} */
        const rates = this.props.exchangeRates;
        const selectedCurrencyInfo = rates.get(this.props.selectedCurrencySymbol);

        return (
            <tr>
                <td/>
                <td>{formatAmount(this.#calculateTotalSum())} {selectedCurrencyInfo.unit}</td>
                <td colSpan="2">
                    <CurrencySelect id={"selected_currency"} exchangeRates={rates}
                                    value={selectedCurrencyInfo.symbol} onChange={this.props.onChange}/>
                </td>
            </tr>
        );
    }
}

AmountTotalRow.propTypes = {
    amounts: PropTypes.instanceOf(Map).isRequired,
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    selectedCurrencySymbol: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};
