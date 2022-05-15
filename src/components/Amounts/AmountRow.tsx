import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {LoadingButton} from "../Utils/LoadingButton";
import {convertAmountToCurrency, formatAmount} from "../../helpers";
import {PutAmount} from "./PutAmount";

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

    private switchAmountStatus: React.ChangeEventHandler<HTMLInputElement> = event => {
        const clonedAmount = Object.assign({}, this.props.amount);
        clonedAmount.enabled = !clonedAmount.enabled;

        this.props.dbRepository.putAmount(clonedAmount, this.props.amountId)
            .then(this.props.onChange).catch(error => {
            this.setState(() => {
                throw error;
            });
        });
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
                <td className={"text-nowrap"} title={currencyInfo.name}>
                    {`${this.props.amount.amount} ${currencyInfo.unit}`}
                </td>
                <td className={"text-nowrap"}>
                    {formatAmount(amountInSelectedCurrency)} {selectedCurrencyInfo.unit}
                </td>
                <td style={{whiteSpace: "pre-line"}}>{this.props.amount.comment ?? ""}</td>
                <td className={"text-center"}>
                    <div className={"form-switch"}>
                        <input type={"checkbox"} role={"switch"} className={"form-check-input"}
                               checked={this.props.amount.enabled}
                               onChange={this.switchAmountStatus}/>
                    </div>
                </td>
                <td className={"text-center"}>
                    <PutAmount buttonProps={{variant: "secondary", size: "sm"}}
                               buttonText={{main: "Edit", modal: "Update"}}
                               flushOnHide={true}
                               dbRepository={this.props.dbRepository} exchangeRates={this.props.exchangeRates}
                               initialAmount={this.props.amount}
                               initialAmountId={this.props.amountId}
                               onChange={this.props.onChange}/>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   onClick={this.deleteAmount}>Delete</LoadingButton>
                </td>
            </tr>
        );
    }
}
