import React, {ReactNode} from "react";
import {CurrencySelect} from "../CurrencySelect";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";

interface Errors {
    amountError?: Error,
    symbolError?: Error,
}

interface State extends Errors {
    amount: string,
    symbol: string,
    comment: string,
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
        amountError: undefined,
        symbolError: undefined,
    };

    /**
     * Validate and preprocess form data.
     */
    private async validate(): Promise<Amount> {
        const result: Partial<Amount> = {enabled: true};
        const errors: Errors = {};

        result.amount = parseFloat(this.state.amount);
        if (Number.isNaN(result.amount) || result.amount === 0) {
            errors.amountError = new Error("Please, enter a valid number!");
        }
        result.symbol = this.state.symbol;
        if (!this.props.exchangeRates.get(result.symbol)) {
            errors.symbolError = new Error(`Wrong currency symbol: "${result.symbol}"!`);
        }
        const trimmedComment = this.state.comment.trim();
        result.comment = trimmedComment === "" ? undefined : trimmedComment;

        if (errors.amountError || errors.symbolError) {
            this.setState(errors);
            throw new Error("Validation failed");
        }
        return (result as Amount);
    }

    private handleFormSubmit = (event: React.FormEvent): void => {
        event.preventDefault();
        this.addAmount().then(() => {
            this.props.onChange();

            // Reset form inputs.
            this.setState({
                amount: "",
                comment: "",
            });
        }).catch(error => {
            this.setState(() => {
                throw error;
            });
        });
    };

    private handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const value: string = event.target.value;
        switch (event.target.id) {
            case this.ids.amount:
                this.setState({amount: value, amountError: undefined});
                break;
            case this.ids.symbol:
                this.setState({symbol: value, symbolError: undefined});
                break;
            case this.ids.comment:
                this.setState({comment: value});
                break;
        }
    };

    private async addAmount(): Promise<void> {
        try {
            const amount = await this.validate();
            const addedRowKey = await this.props.dbRepository.putAmount(amount);
            console.debug("Added amount with key:", addedRowKey);
        } catch (error) {
            console.debug(error);
        }
    }

    render(): ReactNode {
        return (
            <div className={"card mb-3"}>
                <div className={"card-body"}>
                    <h2 className={"card-title"}>Add new amount</h2>
                    <form onSubmit={this.handleFormSubmit}>
                        <div className={"mb-3"}>
                            <label htmlFor={this.ids.amount}
                                   className={"form-label"}>Amount:</label>
                            <input type="number"
                                   className={`form-control ${this.state.amountError ? "is-invalid" : ""}`}
                                   id={this.ids.amount}
                                   placeholder="Enter amount"
                                   value={this.state.amount}
                                   onChange={this.handleFormChange}/>
                            <div className={"invalid-feedback"}>
                                {this.state.amountError?.message}
                            </div>
                        </div>
                        <div className={"mb-3"}>
                            <label htmlFor={this.ids.symbol}
                                   className={"form-label"}>Currency:</label>
                            <CurrencySelect id={this.ids.symbol}
                                            className={`form-select ${this.state.symbolError ? "is-invalid" : ""}`}
                                            exchangeRates={this.props.exchangeRates}
                                            value={this.state.symbol}
                                            onChange={this.handleFormChange}/>
                            <div className={"invalid-feedback"}>
                                {this.state.symbolError?.message}
                            </div>
                        </div>
                        <div className={"mb-3"}>
                            <label htmlFor={this.ids.comment}
                                   className={"form-label"}>Comment:</label>
                            <input type="text"
                                   className={"form-control"}
                                   id={this.ids.comment}
                                   value={this.state.comment}
                                   onChange={this.handleFormChange}/>
                        </div>
                        <input type="submit"
                               className={"btn btn-primary"}
                               disabled={this.props.exchangeRates.size === 0} value="Add"/>
                    </form>
                </div>
            </div>
        );
    }
}
