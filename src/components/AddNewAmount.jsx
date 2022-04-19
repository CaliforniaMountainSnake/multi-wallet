import React from "react";
import PropTypes from "prop-types";
import {CurrencySelect} from "./CurrencySelect";
import {WalletRepository} from "../repositories/WalletRepository";
import {showWarning} from "../helpers";

export class AddNewAmount extends React.Component {
    #idPrefix = `${this.constructor.name}_`;

    constructor(props) {
        super(props);
        this.state = {
            currency: "usd",
            amount: "",
            comment: "",
        };
    }

    /**
     * @param {Event} event
     */
    _handleFormSubmit = event => {
        event.preventDefault();
        this.#addAmount().then(() => {
            this.props.onChange();

            // Reset form inputs.
            this.setState({
                amount: "",
                comment: ""
            });
        }).catch(error => showWarning(error));
    };

    /**
     * @param {Event} event
     */
    _handleFormChange = event => {
        const id = event.target.id.replace(this.#idPrefix, "");
        const value = event.target.value;
        this.setState({
            [id]: value,
        });
    };

    async #addAmount() {
        // Validate and preprocess given data.
        const validator = {
            amount: async amount => {
                const amountFloat = parseFloat(amount);
                if (Number.isNaN(amountFloat) || amountFloat === 0) {
                    throw new Error("Please, enter a valid number!");
                }
                return amountFloat;
            },
            currency: async currency => {
                await this.props.dbRepository.getCurrencyInfo(currency);
                return currency;
            },
            comment: async comment => {
                const trimmed = comment.trim();
                return trimmed === "" ? undefined : trimmed;
            },
        };

        // Now we can add this values into the DB.
        const addedRowKey = await this.props.dbRepository.addAmount(
            await validator.amount(this.state.amount),
            await validator.currency(this.state.currency),
            await validator.comment(this.state.comment),
        );
        console.debug("Added amount with key:", addedRowKey);
    }

    render() {
        return (
            <div>
                <h2>Add a new row</h2>
                <form onSubmit={this._handleFormSubmit}>
                    <table>
                        <tbody>
                        <tr>
                            <td><label htmlFor={this.#idPrefix + "amount"}>Amount:</label></td>
                            <td><input type="number"
                                       id={this.#idPrefix + "amount"}
                                       placeholder="Enter amount"
                                       value={this.state.amount}
                                       onChange={this._handleFormChange}/></td>
                        </tr>
                        <tr>
                            <td><label htmlFor={this.#idPrefix + "currency"}>Currency:</label></td>
                            <td><CurrencySelect id={this.#idPrefix + "currency"}
                                                exchangeRates={this.props.exchangeRates}
                                                value={this.state.currency}
                                                onChange={this._handleFormChange}/>
                            </td>
                        </tr>
                        <tr>
                            <td><label htmlFor={this.#idPrefix + "comment"}>Comment:</label></td>
                            <td><input type="text"
                                       id={this.#idPrefix + "comment"}
                                       value={this.state.comment}
                                       onChange={this._handleFormChange}/></td>
                        </tr>
                        <tr>
                            <td colSpan="2">
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

AddNewAmount.propTypes = {
    dbRepository: PropTypes.instanceOf(WalletRepository).isRequired,
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    onChange: PropTypes.func.isRequired,
};
