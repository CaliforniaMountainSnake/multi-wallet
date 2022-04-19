import React from "react";
import PropTypes from "prop-types";

export class CurrencySelect extends React.Component {
    render() {
        /** @type {Map<string, CurrencyInfo>} */
        const rates = this.props.exchangeRates;
        const options = [];
        for (const [, rate] of rates.entries()) {
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


CurrencySelect.propTypes = {
    id: PropTypes.string.isRequired,
    // It is impossible to set a type Map<string, CurrencyInfo> without TS...
    exchangeRates: PropTypes.instanceOf(Map).isRequired,
    onChange: PropTypes.func.isRequired,

    // Optional
    value: PropTypes.string,
};
