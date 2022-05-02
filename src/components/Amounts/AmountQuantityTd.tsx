import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {validator} from "../../validation/Validator";

interface State {
    amountFormData?: string,
    amountFormError?: Error,
}

export class AmountQuantityTd extends React.Component<{
    dbRepository: WalletRepository,
    amountId: number,
    amount: Amount,
    amountCurrencyInfo: CurrencyInfo,
    onChange: () => void,
}, State> {
    private defaultState: State = {
        amountFormData: undefined,
        amountFormError: undefined,
    };
    state: State = this.defaultState;

    private handleFormSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!this.state.amountFormData) {
            throw new Error("Amount is invalid");
        }

        // validate
        validator.amount(this.state.amountFormData).then((validatedAmount: number) => {
            const clonedAmount = Object.assign({}, this.props.amount);
            clonedAmount.amount = validatedAmount;
            return this.props.dbRepository.putAmount(clonedAmount, this.props.amountId);
        }).then(() => {
            this.setState(this.defaultState);
            this.props.onChange();
            console.debug("Amount has been updated.");
        }).catch((error: Error) => {
            this.setState({amountFormError: error});
        });
    };

    private handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({amountFormData: event.target.value});
    };

    private showForm = () => {
        this.setState({amountFormData: this.props.amount.amount.toString()});
    };

    private showQuantity = () => {
        this.setState(this.defaultState);
    };

    render(): ReactNode {
        if (this.state.amountFormData !== undefined) {
            return (
                <td>
                    <form onSubmit={this.handleFormSubmit}>
                        <div>
                            <input type="number"
                                   className={`form-control mb-2 ${this.state.amountFormError ? "is-invalid" : ""}`}
                                   placeholder="Enter amount"
                                   value={this.state.amountFormData}
                                   onChange={this.handleFormChange}/>
                            <div className={"invalid-feedback"}>
                                {this.state.amountFormError?.message}
                            </div>
                        </div>
                        <button type={"button"} className={"btn btn-sm btn-secondary mb-2 me-2"}
                                onClick={this.showQuantity}>
                            Cancel
                        </button>
                        <button type={"submit"} className={"btn btn-sm btn-warning mb-2"}>Update</button>
                    </form>
                </td>
            );
        }

        return (
            <td className={"text-nowrap"} title={this.props.amountCurrencyInfo.name}
                onClick={this.showForm}>
                {`${this.props.amount.amount} ${this.props.amountCurrencyInfo.unit}`}
            </td>
        );
    }
}
