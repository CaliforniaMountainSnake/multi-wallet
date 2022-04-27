import React, {ReactNode} from "react";
import {DisabledButton} from "./DisabledButton";
import {showError} from "../helpers";
import {WalletRepository} from "../repositories/WalletRepository";

export class ExchangeRatesUpdater extends React.Component<{
    dbRepository: WalletRepository,
    ratesLastUpdateTimestamp: number,
    loadFreshExchangeRates: (dbRepository: WalletRepository) => Promise<void>
    onChange: () => void,
}> {
    private handleClick = async () => {
        try {
            await this.props.loadFreshExchangeRates(this.props.dbRepository);
            this.props.onChange();
        } catch (error) {
            showError(error);
        }
    };

    render(): ReactNode {
        return (
            <div>
                Date of the last exchange rates update:
                <span>
                    {(new Date(this.props.ratesLastUpdateTimestamp)).toLocaleString()}
                </span>
                <div>
                    <DisabledButton onClick={this.handleClick}>
                        🗘 Update exchange rates
                    </DisabledButton>
                </div>
            </div>
        );
    }
}
