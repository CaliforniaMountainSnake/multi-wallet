import React, {ReactNode} from "react";
import {CurrencySelect} from "../Utils/CurrencySelect";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {convertAmountToCurrency, formatAmount} from "../../helpers";

export class AmountTotalRow extends React.Component<{
    dbRepository: WalletRepository,
    amounts: Map<number, Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    selectedCurrencySymbol: string,
    onSelectedCurrencyChange: () => void,
}> {
    private updateSelectedCurrency = (event: React.ChangeEvent<HTMLInputElement>): void => {
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

    private calculateTotalSum(): number {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;
        let resultSum = 0;
        for (const amount of this.props.amounts.values()) {
            if (amount.enabled) {
                resultSum += convertAmountToCurrency(this.props.exchangeRates, amount, selectedCurrencyInfo.symbol);
            }
        }
        return resultSum;
    }

    render(): ReactNode {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol)!;
        return (
            <tr>
                <th>Total:</th>
                <td className={"text-nowrap"}>
                    {formatAmount(this.calculateTotalSum())} {selectedCurrencyInfo.unit}
                </td>
                <td colSpan={3}>
                    <CurrencySelect className={"form-select"}
                                    exchangeRates={this.props.exchangeRates}
                                    value={selectedCurrencyInfo.symbol} onChange={this.updateSelectedCurrency}/>
                </td>
            </tr>
        );
    }
}
