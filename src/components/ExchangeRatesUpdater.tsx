import React, {ReactNode} from "react";
import {DisabledButton} from "./Utils/DisabledButton";
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
            <div className={"card mb-3"}>
                <div className={"card-body"}>
                    <h5 className={"card-title"}>Date of the last exchange rates update:</h5>
                    <h6 className={"card-subtitle text-muted mb-2"}>
                        {(new Date(this.props.ratesLastUpdateTimestamp)).toLocaleString()}
                    </h6>
                    <div>
                        <DisabledButton
                            className={"btn btn-primary"}
                            onClick={this.handleClick}>
                            🗘 Update exchange rates
                        </DisabledButton>
                    </div>
                </div>
            </div>
        );
    }
}
