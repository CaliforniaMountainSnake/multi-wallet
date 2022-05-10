import React, {ReactNode} from "react";
import {CurrencyInfo} from "../../repositories/WalletRepository";
import {Form} from "react-bootstrap";

export class CurrencySelect extends React.Component<{
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    value: string,
    isInvalid?: boolean,
    className?: string,
}> {
    render(): ReactNode {
        const options = [];
        for (const [, rate] of this.props.exchangeRates.entries()) {
            options.push(
                <option key={rate.symbol} value={rate.symbol}>
                    {`${rate.symbol} - ${rate.name}`}
                </option>
            );
        }

        return (
            <Form.Control as={"select"} className={this.props.className}
                          isInvalid={this.props.isInvalid}
                          disabled={this.props.exchangeRates.size === 0}
                          value={this.props.value} onChange={this.props.onChange}>
                {options}
            </Form.Control>
        );
    }
}
