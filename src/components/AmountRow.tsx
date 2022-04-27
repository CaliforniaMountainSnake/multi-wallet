import React, {ReactNode} from "react";
import {Amount, CurrencyInfo} from "../repositories/WalletRepository";
import {DisabledButton} from "./DisabledButton";
import {NonBreakingSpaceText} from "./NonBreakingSpaceText";
import {convertAmountToCurrency, formatAmount} from "../helpers";

/**
 * @TODO: place onDelete callback here. AmountRow should delete the row itself.
 */
export class AmountRow extends React.Component<{
    amountId: number,
    amount: Amount,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onDelete: (amountId: number) => Promise<void>,
}> {
    private handleDelete = async () => {
        return await this.props.onDelete(this.props.amountId);
    };

    render(): ReactNode {
        const currencyInfo = this.props.exchangeRates.get(this.props.amount.symbol)!;
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;
        const amountInSelectedCurrency = convertAmountToCurrency(
            this.props.exchangeRates,
            this.props.amount,
            selectedCurrencyInfo.symbol
        );

        return (
            <tr>
                <td title={currencyInfo.name}>
                    <NonBreakingSpaceText>{`${this.props.amount.amount} ${currencyInfo.unit}`}</NonBreakingSpaceText>
                </td>
                <td>
                    <NonBreakingSpaceText>
                        {formatAmount(amountInSelectedCurrency)} {selectedCurrencyInfo.unit}
                    </NonBreakingSpaceText>
                </td>
                <td>{this.props.amount.comment ?? ""}</td>
                <td>
                    <DisabledButton onClick={this.handleDelete}>
                        Delete
                    </DisabledButton>
                </td>
            </tr>
        );
    }
}
