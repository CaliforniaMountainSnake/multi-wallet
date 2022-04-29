import React, {ReactNode} from "react";
import {CurrencySelect} from "../CurrencySelect";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {showWarning} from "../../helpers";

type ToString<T> = {
    [Property in keyof T]: string;
}

interface State extends ToString<Required<Omit<Amount, "enabled">>> {
}

export class AddNewAmount extends React.Component<{
    dbRepository: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: () => void,
}, State> {
    private idPrefix = `${this.constructor.name}_`;
    private ids = {
        amount: `${this.idPrefix}amount`,
        symbol: `${this.idPrefix}symbol`,
        comment: `${this.idPrefix}comment`,
    };

    state: State = {
        amount: "",
        symbol: this.props.exchangeRates.keys().next().value,
        comment: "",
    };

    private handleFormSubmit = (event: React.FormEvent): void => {
        event.preventDefault();
        this.addAmount().then(() => {
            this.props.onChange();

            // Reset form inputs.
            this.setState({
                amount: "",
                comment: ""
            });
        }).catch(error => showWarning(error));
    };

    private handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const value: string = event.target.value;
        switch (event.target.id) {
            case this.ids.amount:
                this.setState({amount: value});
                break;
            case this.ids.symbol:
                this.setState({symbol: value});
                break;
            case this.ids.comment:
                this.setState({comment: value});
                break;
        }
    };

    private async addAmount(): Promise<void> {
        // Validate and preprocess given data.
        const validator = {
            amount: async (amount: string): Promise<number> => {
                const amountFloat = parseFloat(amount);
                if (Number.isNaN(amountFloat) || amountFloat === 0) {
                    throw new Error("Please, enter a valid number!");
                }
                return amountFloat;
            },
            symbol: async (symbol: string): Promise<string> => {
                if (!this.props.exchangeRates.get(symbol)) {
                    throw new Error(`Wrong currency symbol: "${symbol}"!`);
                }
                return symbol;
            },
            comment: async (comment: string): Promise<string | undefined> => {
                const trimmed = comment.trim();
                return trimmed === "" ? undefined : trimmed;
            },
        };

        // Now we can add this values into the DB.
        const addedRowKey = await this.props.dbRepository.putAmount({
            amount: await validator.amount(this.state.amount),
            symbol: await validator.symbol(this.state.symbol),
            comment: await validator.comment(this.state.comment),
            enabled: true,
        });
        console.debug("Added amount with key:", addedRowKey);
    }

    render(): ReactNode {
        return (
            <div>
                <h2>Add new amount</h2>
                <form onSubmit={this.handleFormSubmit}>
                    <table>
                        <tbody>
                        <tr>
                            <th><label htmlFor={this.ids.amount}>Amount:</label></th>
                            <td><input type="number"
                                       id={this.ids.amount}
                                       placeholder="Enter amount"
                                       value={this.state.amount}
                                       onChange={this.handleFormChange}/></td>
                        </tr>
                        <tr>
                            <th><label htmlFor={this.ids.symbol}>Currency:</label></th>
                            <td><CurrencySelect id={this.ids.symbol}
                                                exchangeRates={this.props.exchangeRates}
                                                value={this.state.symbol}
                                                onChange={this.handleFormChange}/>
                            </td>
                        </tr>
                        <tr>
                            <th><label htmlFor={this.ids.comment}>Comment:</label></th>
                            <td><input type="text"
                                       id={this.ids.comment}
                                       value={this.state.comment}
                                       onChange={this.handleFormChange}/></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                <input type="submit" disabled={this.props.exchangeRates.size === 0} value="Add"/>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </form>
            </div>
        );
    }
}
