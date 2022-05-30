import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {LoadingButton} from "../Utils/LoadingButton";
import {convertAmountToCurrency, formatAmount} from "../../helpers";
import {PutAmount} from "./PutAmount";
import deleteIcon from "bootstrap-icons/icons/trash3.svg?raw";
import editIcon from "bootstrap-icons/icons/pencil.svg?raw";
import arrowUpIcon from "bootstrap-icons/icons/arrow-up.svg?raw";
import arrowDownIcon from "bootstrap-icons/icons/arrow-down.svg?raw";

export class AmountRow extends React.Component<{
    dbRepository: WalletRepository,
    amountId: number,
    amount: Amount,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onChange: () => void,
}> {
    private moveUp = async (): Promise<void> => {
        await this.props.dbRepository.amountRepository.moveUp(this.props.amountId);
        this.props.onChange();
    };

    private moveDown = async (): Promise<void> => {
        await this.props.dbRepository.amountRepository.moveDown(this.props.amountId);
        this.props.onChange();
    };

    private deleteAmount = async (): Promise<void> => {
        if (confirm(this.getAmountDeletionMsg(this.props.amount))) {
            await this.props.dbRepository.amountRepository.delete(this.props.amountId);
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

        this.props.dbRepository.amountRepository.put(clonedAmount, this.props.amountId)
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
                    {/* Use key to force recreate PutAmount component */}
                    {/* to avoid syncing the state when props are changed.*/}
                    {/* @see https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#recommendation-fully-uncontrolled-component-with-a-key */}
                    <PutAmount key={[this.props.amountId, JSON.stringify(this.props.amount)].join()}
                               modalTitle={"Edit amount"}
                               buttonText={{
                                   main: (<span className={"icon"} dangerouslySetInnerHTML={{__html: editIcon}}/>),
                                   modal: "Update",
                               }}
                               buttonProps={{variant: "secondary", size: "sm"}}
                               flushOnHide={true}
                               dbRepository={this.props.dbRepository} exchangeRates={this.props.exchangeRates}
                               initialAmount={this.props.amount}
                               initialAmountId={this.props.amountId}
                               onChange={this.props.onChange}/>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   onClick={this.moveUp}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: arrowUpIcon}}/>
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   onClick={this.moveDown}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: arrowDownIcon}}/>
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "danger", size: "sm"}}
                                   onClick={this.deleteAmount}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: deleteIcon}}/>
                    </LoadingButton>
                </td>
            </tr>
        );
    }
}
