import React, {ReactNode} from "react";
import {CurrencyInfo} from "../repositories/WalletRepository";

export class CurrencySelect extends React.Component<{
    id: string,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void,
    value?: string,
}> {
    render(): ReactNode {
        const options = [];
        for (const [, rate] of this.props.exchangeRates.entries()) {
            options.push(
                <option value={rate.symbol} data-unit={rate.unit} key={rate.symbol}>
                    {`${rate.symbol} - ${rate.name}`}
                </option>
            );
        }

        return (
            <select id={this.props.id} disabled={this.props.exchangeRates.size === 0}
                    value={this.props.value} onChange={this.props.onChange}>
                {options}
            </select>
        );
    }
}
