import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {DisabledButton} from "../Utils/DisabledButton";
import {NonBreakingSpaceText} from "../Utils/NonBreakingSpaceText";
import {convertAmountToCurrency, formatAmount} from "../../helpers";

export class AmountRow extends React.Component<{
    dbRepository: WalletRepository,
    amountId: number,
    amount: Amount,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onChange: () => void,
}> {

    private deleteAmount = async (): Promise<void> => {
        if (confirm(this.getAmountDeletionMsg(this.props.amount))) {
            await this.props.dbRepository.deleteAmount(this.props.amountId);
            console.debug(`Amount with key "${this.props.amountId}" has been deleted.`, this.props.amount);
            this.props.onChange();
        }
    };

    private getAmountDeletionMsg(amount: Amount): string {
        const unit = this.props.exchangeRates.get(amount.symbol)!.unit;
        let msg = `Are you sure you want to delete ${amount.amount} ${unit} `;
        msg += amount.comment === undefined ? "?" : `(${amount.comment}) ?`;

        return msg;
    }

    private switchAmountStatus = async () => {
        const clonedAmount = Object.assign({}, this.props.amount);
        clonedAmount.enabled = !clonedAmount.enabled;

        await this.props.dbRepository.putAmount(clonedAmount, this.props.amountId);
        this.props.onChange();
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
            <tr className={this.props.amount.enabled ? undefined : "disabled"}>
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
                    <NonBreakingSpaceText>
                        <DisabledButton title={this.props.amount.enabled ? "Disable️" : "Enable"}
                                        onClick={this.switchAmountStatus}>
                            {this.props.amount.enabled ? "✅️" : "❎"}
                        </DisabledButton>
                        <DisabledButton title={"Delete"} onClick={this.deleteAmount}>❌</DisabledButton>
                    </NonBreakingSpaceText>
                </td>
            </tr>
        );
    }
}
