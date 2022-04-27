import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../repositories/WalletRepository";
import {AmountRow} from "./AmountRow";
import {AmountTotalRow} from "./AmountTotalRow";
import {NonBreakingSpaceText} from "./NonBreakingSpaceText";

export class AmountsTable extends React.Component<{
    dbRepository: WalletRepository,
    amounts: Map<string, Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onAmountsChange: () => void,
    onSelectedCurrencyChange: () => void,
}> {

    private deleteAmount = async (amountId: number): Promise<void> => {
        const amount = await this.props.dbRepository.getAmount(amountId);
        if (confirm(this.getAmountDeletionMsg(amount))) {
            await this.props.dbRepository.deleteAmount(amountId);
            this.props.onAmountsChange();
            console.debug(`Amount with key "${amountId}" has been deleted.`, amount);
        }
    };

    private updateSelectedCurrency = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        this.props.dbRepository.setConfig({
            key: "selected_currency",
            value: event.target.value
        }).then(() => {
            this.props.onSelectedCurrencyChange();
        }).catch(error => {
            this.setState(() => {
                throw error;
            });
        });
    };

    private getAmountDeletionMsg(amount: Amount): string {
        const unit = this.props.exchangeRates.get(amount.symbol)!.unit;
        let msg = `Are you sure you want to delete ${amount.amount} ${unit} `;
        msg += amount.comment === undefined ? "?" : `(${amount.comment}) ?`;

        return msg;
    }

    render(): ReactNode {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;

        // Add new rows.
        const rows = [];
        for (const [id, amount] of this.props.amounts.entries()) {
            rows.push(
                <AmountRow key={id} amountId={parseInt(id)} amount={amount}
                           exchangeRates={this.props.exchangeRates}
                           selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                           onDelete={this.deleteAmount}/>
            );
        }

        return (
            <div>
                <h2>Your wallet</h2>
                <div style={{overflowX: "auto"}}>
                    <table className={"amounts"}>
                        <thead>
                        <tr>
                            <th>Amount</th>
                            <th>
                                <NonBreakingSpaceText>Amount in {selectedCurrencyInfo.unit}</NonBreakingSpaceText>
                            </th>
                            <th>Comment</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tfoot>
                        <tr>
                            <th colSpan={5}>Total:</th>
                        </tr>
                        <AmountTotalRow amounts={this.props.amounts}
                                        exchangeRates={this.props.exchangeRates}
                                        selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                                        onChange={this.updateSelectedCurrency}/>
                        </tfoot>
                        <tbody>{rows}</tbody>
                    </table>
                </div>
            </div>
        );
    }
}
