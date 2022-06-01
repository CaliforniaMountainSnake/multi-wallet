import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {AmountRow} from "./AmountRow";
import {AmountTotalRow} from "./AmountTotalRow";
import {PutAmount} from "./PutAmount";

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
                <AmountRow key={id} amountId={id} amount={amount}
                           amountRepository={this.props.dbRepository.amountRepository}
                           exchangeRates={this.props.exchangeRates}
                           selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                           onChange={this.props.onAmountsChange}/>
            );
        }

        return (
            <div>
                <h2>Your wallet</h2>
                <PutAmount modalTitle={"Add new amount"}
                           buttonText={{main: "Add amount", modal: "Add"}}
                           buttonProps={{variant: "primary", className: "mb-2"}}
                           flushOnHide={false}
                           amountRepository={this.props.dbRepository.amountRepository}
                           exchangeRates={this.props.exchangeRates}
                           onChange={this.props.onAmountsChange}/>
                <div className={"table-responsive"}>
                    <table className={"table table-bordered align-middle"}>
                        <thead>
                        <tr>
                            <th>Amount</th>
                            <th className={"text-nowrap"} title={`Amount in ${selectedCurrencyInfo.name}`}>
                                Amount in {selectedCurrencyInfo.unit}
                            </th>
                            <th>Comment</th>
                            <th colSpan={5}>Actions</th>
                        </tr>
                        </thead>
                        <tfoot>
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
