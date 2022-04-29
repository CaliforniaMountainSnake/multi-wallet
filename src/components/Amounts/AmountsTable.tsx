import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {AmountRow} from "./AmountRow";
import {AmountTotalRow} from "./AmountTotalRow";
import {NonBreakingSpaceText} from "../Utils/NonBreakingSpaceText";

export class AmountsTable extends React.Component<{
    dbRepository: WalletRepository,
    amounts: Map<number, Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onAmountsChange: () => void,
    onSelectedCurrencyChange: () => void,
}> {
    render(): ReactNode {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;

        // Add new rows.
        const amounts = [];
        for (const [id, amount] of this.props.amounts.entries()) {
            amounts.push(
                <AmountRow key={id} dbRepository={this.props.dbRepository} amountId={id} amount={amount}
                           exchangeRates={this.props.exchangeRates}
                           selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                           onChange={this.props.onAmountsChange}/>
            );
        }

        return (
            <div>
                <h2>Your wallet</h2>
                <div style={{overflowX: "auto"}}>
                    <table className={"data-table"}>
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
                        <AmountTotalRow dbRepository={this.props.dbRepository} amounts={this.props.amounts}
                                        exchangeRates={this.props.exchangeRates}
                                        selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                                        onSelectedCurrencyChange={this.props.onSelectedCurrencyChange}/>
                        </tfoot>
                        <tbody>{amounts}</tbody>
                    </table>
                </div>
            </div>
        );
    }
}
