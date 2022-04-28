import React, {ReactNode} from "react";
import {CurrencySelect} from "./CurrencySelect";
import {Amount, CurrencyInfo} from "../repositories/WalletRepository";
import {NonBreakingSpaceText} from "./NonBreakingSpaceText";
import {convertAmountToCurrency, formatAmount} from "../helpers";

export class AmountTotalRow extends React.Component<{
    amounts: Map<number, Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void,
}> {
    private calculateTotalSum(): number {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;

        let resultSum = 0;
        for (const amount of this.props.amounts.values()) {
            resultSum += convertAmountToCurrency(this.props.exchangeRates, amount, selectedCurrencyInfo.symbol);
        }
        return resultSum;
    }

    render(): ReactNode {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;
        return (
            <tr>
                <td/>
                <td>
                    <NonBreakingSpaceText>
                        {formatAmount(this.calculateTotalSum())} {selectedCurrencyInfo.unit}
                    </NonBreakingSpaceText>
                </td>
                <td colSpan={2}>
                    <CurrencySelect id={"selected_currency"} exchangeRates={this.props.exchangeRates}
                                    value={selectedCurrencyInfo.symbol} onChange={this.props.onChange}/>
                </td>
            </tr>
        );
    }
}
