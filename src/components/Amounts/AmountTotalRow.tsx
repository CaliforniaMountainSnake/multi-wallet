import React, {ReactNode} from "react";
import {InputGroup} from "react-bootstrap";
import {convertAmountToCurrency, formatAmount} from "../../helpers";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import HistoryChart, {TargetCurrencies} from "../History/HistoryChart";
import {CurrencySelect} from "../Utils/CurrencySelect";

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

    private calculateTotalSum(selectedCurrencyInfo: CurrencyInfo): number {
        let resultSum = 0;
        for (const amount of this.props.amounts.values()) {
            if (amount.enabled) {
                resultSum += convertAmountToCurrency(this.props.exchangeRates, amount, selectedCurrencyInfo.symbol);
            }
        }
        return resultSum;
    }

    render(): ReactNode {
        const selectedCurrencyInfo = this.props.exchangeRates.get(this.props.selectedCurrencySymbol);
        if (!selectedCurrencyInfo || this.props.amounts.size === 0) {
            return <tr>
                <td colSpan={8}>
                    You don't have added amounts yet.
                </td>
            </tr>;
        }

        const activeAmounts: Amount[] = [...this.props.amounts.values()]
            .filter(amount => amount.enabled);
        const targetTotalCurrencies: TargetCurrencies = activeAmounts.map(amount => ({
            symbol: amount.symbol,
            amount: amount.amount,
        }));

        return (
            <tr>
                <th>Total:</th>
                <td className={"text-nowrap"}>
                    {formatAmount(this.calculateTotalSum(selectedCurrencyInfo))} {selectedCurrencyInfo.unit}
                </td>
                <td colSpan={6}>
                    <div className={"d-flex flex-row justify-content-between"}>
                        <InputGroup>
                            <HistoryChart title={"Total portfolio price"}
                                          buttonProps={{
                                              variant: "secondary",
                                              size: "sm",
                                              disabled: activeAmounts.length === 0,
                                              className: "mr-5",
                                          }}
                                          ohlcRepository={this.props.dbRepository.ohlcRepository}
                                          vsCurrency={selectedCurrencyInfo.symbol}
                                          targetCurrencies={targetTotalCurrencies}/>

                            <CurrencySelect className={"form-select"}
                                            exchangeRates={this.props.exchangeRates}
                                            value={selectedCurrencyInfo.symbol} onChange={this.updateSelectedCurrency}/>
                        </InputGroup>
                    </div>
                </td>
            </tr>
        );
    }
}
