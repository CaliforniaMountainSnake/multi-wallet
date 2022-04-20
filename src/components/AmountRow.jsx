import React from "react";
import PropTypes from "prop-types";
import {Amount, CurrencyInfo} from "../repositories/WalletRepository";
import {DisabledButton} from "./DisabledButton";
import {NonBreakingSpaceText} from "./NonBreakingSpaceText";
import {formatAmount, convertAmountToCurrency} from "../helpers";

/**
 * @TODO: place onDelete callback here. AmountRow should delete the row itself.
 */
export class AmountRow extends React.Component {
    render() {
        /** @type {Map<string, CurrencyInfo>} */
        const rates = this.props.exchangeRates;
        const selectedCurrencyInfo = rates.get(this.props.selectedCurrencySymbol);
        /** @type {Amount} */
        const amount = this.props.amount;
        const currencyInfo = rates.get(amount.symbol);

        const amountInSelectedCurrency = convertAmountToCurrency(rates, amount, selectedCurrencyInfo.symbol);

        return (
            <tr>
                <td title={currencyInfo.name}>
                    <NonBreakingSpaceText>{`${amount.amount} ${currencyInfo.unit}`}</NonBreakingSpaceText>
                </td>
                <td>
                    <NonBreakingSpaceText>
                        {formatAmount(amountInSelectedCurrency)} {selectedCurrencyInfo.unit}
                    </NonBreakingSpaceText>
                </td>
                <td>{amount.comment === undefined ? "" : amount.comment}</td>
                <td>
                    <DisabledButton identifier={this.props.amountId} onClick={this.props.onDelete}>
                        Delete
                    </DisabledButton>
                </td>
            </tr>
        );
    }
}

AmountRow.propTypes = {
    amountId: PropTypes.number.isRequired,
    amount: PropTypes.oneOfType([
        PropTypes.instanceOf(Amount),
        PropTypes.object,// fallback type.
    ]).isRequired,
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    selectedCurrencySymbol: PropTypes.string.isRequired,
    onDelete: PropTypes.func.isRequired,
};
