import React from "react";
import PropTypes from "prop-types";

export class CurrencySelect extends React.Component {
    render() {
        /** @type {Map<string, BtcRate>} */
        const rates = this.props.exchangeRates;
        const options = [];
        for (const [symbol, rate] of rates.entries()) {
            options.push(
                <option value={symbol} key={symbol}>
                    {`${symbol} - ${rate.name}`}
                </option>
            );
        }

        return (
            <select id={this.props.id} value={this.props.value} onChange={this.props.onChange}>
                {options}
            </select>
        );
    }
}


CurrencySelect.propTypes = {
    id: PropTypes.string.isRequired,
    // It is impossible to set a type Map<string, BtcRate> without TS...
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};
