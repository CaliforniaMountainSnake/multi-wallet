import React from "react";
import PropTypes from "prop-types";
import {Amount, CurrencyInfo, WalletRepository} from "../repositories/WalletRepository";
import {AmountRow} from "./AmountRow";
import {AmountTotalRow} from "./AmountTotalRow";

export class AmountsTable extends React.Component {
    /**
     * @param {number} amountId
     * @private
     */
    _deleteAmount = async amountId => {
        const amount = await this.props.dbRepository.getAmount(amountId);
        if (confirm(this.#getAmountDeletionMsg(amount))) {
            await this.props.dbRepository.deleteAmount(amountId);
            this.props.onAmountsChange();
            console.debug(`Amount with key "${amountId}" has been deleted.`, amount);
        }
    };

    /**
     * @param {Event} event
     * @private
     */
    _updateSelectedCurrency = event => {
        this.props.dbRepository.setConfig(WalletRepository.confNames.selectedCurrency, event.target.value).then(() => {
            this.props.onSelectedCurrencyChange();
        }).catch(error => {
            this.setState(() => throw error);
        });
    };

    /**
     * @TODO: use string component?
     * @param {Amount} amount
     * @returns {string}
     */
    #getAmountDeletionMsg(amount) {
        /** @type {Map<string, CurrencyInfo>} */
        const rates = this.props.exchangeRates;
        const unit = rates.get(amount.symbol).unit;
        let msg = `Are you sure you want to delete ${amount.amount} ${unit} `;
        msg += amount.comment === undefined ? "?" : `(${amount.comment}) ?`;

        return msg;
    }

    render() {
        /** @type {Map<string, Amount>} */
        const amounts = this.props.amounts;
        /** @type {Map<string, CurrencyInfo>} */
        const rates = this.props.exchangeRates;
        const selectedCurrencyInfo = rates.get(this.props.selectedCurrencySymbol);

        // Add new rows.
        const rows = [];
        for (const [id, amount] of amounts.entries()) {
            rows.push(
                <AmountRow key={id} amountId={parseInt(id)} amount={amount}
                           exchangeRates={rates}
                           selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                           onDelete={this._deleteAmount}/>
            );
        }

        return (
            <div>
                <h2>Your wallet</h2>
                <table border="1" id="data_table">
                    <thead>
                    <tr>
                        <th>Amount</th>
                        <th id="amount_in_selected_currency">Amount in {selectedCurrencyInfo.unit}</th>
                        <th>Comment</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tfoot>
                    <tr>
                        <th colSpan="5">Total:</th>
                    </tr>
                    <AmountTotalRow amounts={this.props.amounts}
                                    exchangeRates={rates}
                                    selectedCurrencySymbol={this.props.selectedCurrencySymbol}
                                    onChange={this._updateSelectedCurrency}/>
                    </tfoot>
                    <tbody>{rows}</tbody>
                </table>
            </div>
        );
    }
}

AmountsTable.propTypes = {
    dbRepository: PropTypes.instanceOf(WalletRepository).isRequired,
    amounts: PropTypes.instanceOf(Map).isRequired,
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    selectedCurrencySymbol: PropTypes.string.isRequired,
    onAmountsChange: PropTypes.func.isRequired,
    onSelectedCurrencyChange: PropTypes.func.isRequired,
};
