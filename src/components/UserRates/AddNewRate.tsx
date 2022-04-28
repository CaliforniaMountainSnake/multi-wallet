import React, {ReactNode} from "react";
import {CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {CurrencySelect} from "../CurrencySelect";
import {DisabledButton} from "../DisabledButton";
import {showWarning} from "../../helpers";

interface State {
    symbol1: string,
    symbol2: string,
}

export class AddNewRate extends React.Component<{
    dbRepository: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: () => void,
}, State> {
    private idPrefix = `${this.constructor.name}_`;
    private ids = {
        symbol1: `${this.idPrefix}symbol1`,
        symbol2: `${this.idPrefix}symbol2`
    };
    private defaultState: State = {
        symbol1: this.props.exchangeRates.keys().next().value,
        symbol2: this.props.exchangeRates.keys().next().value,
    };

    state: State = this.defaultState;

    private addNewRate = async (): Promise<void> => {
        const validator = async (symbol1: string, symbol2: string): Promise<State> => {
            if (!this.props.exchangeRates.has(symbol1) || !this.props.exchangeRates.has(symbol2)) {
                throw new Error(`Wrong currency symbol: "${symbol1}" or "${symbol2}"!`);
            }
            if (symbol1 === symbol2) {
                throw  new Error("You must select different currencies!");
            }
            return {
                symbol1: symbol1,
                symbol2: symbol2
            };
        };

        try {
            const validatedSymbols = await validator(this.state.symbol1, this.state.symbol2);
            const addedKey = await this.props.dbRepository.addUserRate(validatedSymbols);
            this.setState(this.defaultState);
            this.props.onChange();
            console.debug("New user exchange rate added", addedKey);
        } catch (error) {
            showWarning(error);
        }
    };

    private handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const value: string = event.target.value;
        switch (event.target.id) {
            case this.ids.symbol1:
                this.setState({symbol1: value});
                break;
            case this.ids.symbol2:
                this.setState({symbol2: value});
                break;
        }
    };

    render(): ReactNode {
        return (
            <tr>
                <td colSpan={2}>
                    <CurrencySelect id={this.ids.symbol1} exchangeRates={this.props.exchangeRates}
                                    value={this.state.symbol1}
                                    onChange={this.handleInputChange}/><br/>
                    <CurrencySelect id={this.ids.symbol2} exchangeRates={this.props.exchangeRates}
                                    value={this.state.symbol2}
                                    onChange={this.handleInputChange}/>
                </td>
                <td>
                    <DisabledButton onClick={this.addNewRate}>Add</DisabledButton>
                </td>
            </tr>
        );
    }
}
