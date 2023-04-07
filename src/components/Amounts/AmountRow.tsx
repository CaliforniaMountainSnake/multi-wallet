import arrowDownIcon from "bootstrap-icons/icons/arrow-down.svg?raw";
import arrowUpIcon from "bootstrap-icons/icons/arrow-up.svg?raw";
import editIcon from "bootstrap-icons/icons/pencil.svg?raw";
import deleteIcon from "bootstrap-icons/icons/trash3.svg?raw";
import React, { ReactNode } from "react";
import { calculateTotalSum, convertAmountToCurrency, formatAmount } from "../../helpers";
import { DoublyLinkedListRepository } from "../../repositories/DoublyLinkedListRepository";
import { Amount, CurrencyInfo } from "../../repositories/WalletRepository";
import { LoadingButton, LoadingButtonClickHandler } from "../Utils/LoadingButton";
import AmountRowPlaceholder from "./AmountRowPlaceholder";
import { PutAmount } from "./PutAmount";

export class AmountRow extends React.Component<{
    amountRepository: DoublyLinkedListRepository<Amount>,
    amountId: number,
    amount: Amount,
    amounts: Map<number, Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onChange: () => void,
}> {
    private moveUp: LoadingButtonClickHandler<null> = async (): Promise<void> => {
        await this.props.amountRepository.moveUp(this.props.amountId);
        this.props.onChange();
    };

    private moveDown: LoadingButtonClickHandler<null> = async (): Promise<void> => {
        await this.props.amountRepository.moveDown(this.props.amountId);
        this.props.onChange();
    };

    private delete: LoadingButtonClickHandler<CurrencyInfo> = async (currencyInfo): Promise<void> => {
        if (confirm(this.getAmountDeletionMsg(currencyInfo))) {
            await this.props.amountRepository.delete(this.props.amountId);
            console.debug(`Amount with key "${this.props.amountId}" has been deleted.`, this.props.amount);
            this.props.onChange();
        }
    };

    private getAmountDeletionMsg(currencyInfo: CurrencyInfo): string {
        let msg = `Are you sure you want to delete ${this.props.amount.amount} ${currencyInfo.unit} `;
        msg += this.props.amount.comment === undefined ? "?" : `(${this.props.amount.comment}) ?`;
        return msg;
    }

    private switchAmountStatus: React.ChangeEventHandler<HTMLInputElement> = event => {
        const clonedAmount = Object.assign({}, this.props.amount);
        clonedAmount.enabled = !clonedAmount.enabled;

        this.props.amountRepository.put(clonedAmount, this.props.amountId)
            .then(this.props.onChange).catch(error => {
                this.setState(() => {
                    throw error;
                });
            });
    };

    render(): ReactNode {
        const currencyInfo = this.props.exchangeRates.get(this.props.amount.symbol);
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol);
        if (!currencyInfo || !selectedCurrencyInfo) {
            return <AmountRowPlaceholder />;
        }

        const amountInSelectedCurrency = convertAmountToCurrency(
            this.props.exchangeRates,
            this.props.amount,
            selectedCurrencyInfo.symbol
        );

        const totalSum = calculateTotalSum(this.props.exchangeRates, this.props.amounts, selectedCurrencyInfo.symbol);
        return (
            <tr className={this.props.amount.enabled ? undefined : "disabled"}>
                <td className={"text-nowrap"} title={currencyInfo.name}>
                    {`${this.props.amount.amount} ${currencyInfo.unit}`}
                </td>
                <td className={"text-nowrap"}>
                    {formatAmount(amountInSelectedCurrency)} {selectedCurrencyInfo.unit}
                </td>
                <td className={"text-nowrap"}>
                    {this.props.amount.enabled ? formatAmount(100 * amountInSelectedCurrency / totalSum) : 0} %
                </td>
                <td style={{ whiteSpace: "pre-line" }}>{this.props.amount.comment ?? ""}</td>
                {/* buttons: */}
                <td className={"text-center"}>
                    <div className={"form-switch"}>
                        <input type={"checkbox"} role={"switch"} className={"form-check-input"}
                            checked={this.props.amount.enabled}
                            onChange={this.switchAmountStatus} />
                    </div>
                </td>
                <td className={"text-center"}>
                    {/* Use a key to force recreate PutAmount component */}
                    {/* to avoid syncing the state when props are changed.*/}
                    {/* @see https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#recommendation-fully-uncontrolled-component-with-a-key */}
                    <PutAmount key={[this.props.amountId, JSON.stringify(this.props.amount)].join()}
                        modalTitle={"Edit amount"}
                        buttonText={{
                            main: (<span className={"icon"} dangerouslySetInnerHTML={{ __html: editIcon }} />),
                            modal: "Update",
                        }}
                        buttonProps={{ variant: "secondary", size: "sm" }}
                        flushOnHide={true}
                        amountRepository={this.props.amountRepository} exchangeRates={this.props.exchangeRates}
                        initialAmount={this.props.amount}
                        initialAmountId={this.props.amountId}
                        onChange={this.props.onChange} />
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{ variant: "secondary", size: "sm" }}
                        payload={null} onClick={this.moveUp}>
                        <span className={"icon"} dangerouslySetInnerHTML={{ __html: arrowUpIcon }} />
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{ variant: "secondary", size: "sm" }}
                        payload={null} onClick={this.moveDown}>
                        <span className={"icon"} dangerouslySetInnerHTML={{ __html: arrowDownIcon }} />
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{ variant: "danger", size: "sm" }}
                        payload={currencyInfo} onClick={this.delete}>
                        <span className={"icon"} dangerouslySetInnerHTML={{ __html: deleteIcon }} />
                    </LoadingButton>
                </td>
            </tr>
        );
    }
}
