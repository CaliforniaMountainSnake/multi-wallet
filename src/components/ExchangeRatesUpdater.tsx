import React, {ReactNode} from "react";
import {LoadingButton} from "./Utils/LoadingButton";
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
                <div className={"row card-body"}>
                    <div className={"col-12 col-md-8 mb-1 mb-md-0"}>
                        <h5 className={"card-title"}>Date of the last exchange rates update:</h5>
                        <h6 className={"card-subtitle text-muted"}>
                            {(new Date(this.props.ratesLastUpdateTimestamp)).toLocaleString()}
                        </h6>
                    </div>
                    <div className={"col-12 col-md-4 d-flex justify-content-md-end"}>
                        <LoadingButton variant={"primary"} onClick={this.handleClick}>
                            🗘 Update exchange rates
                        </LoadingButton>
                    </div>
                </div>
            </div>
        );
    }
}
