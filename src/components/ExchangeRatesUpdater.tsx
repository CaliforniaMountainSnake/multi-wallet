import React, {ReactNode} from "react";
import {LoadingButton} from "./Utils/LoadingButton";
import {showError} from "../helpers";
import {WalletRepository} from "../repositories/WalletRepository";
import refreshIcon from "bootstrap-icons/icons/arrow-repeat.svg?raw";

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
                    <div className={"col-12 col-sm-8 mb-1 mb-sm-0"}>
                        <h5 className={"card-title"}>Exchange rates last update:</h5>
                        <h6 className={"card-subtitle text-muted"}>
                            {(new Date(this.props.ratesLastUpdateTimestamp)).toLocaleString()}
                        </h6>
                    </div>
                    <div className={"col-12 col-sm-4 d-flex justify-content-sm-end"}>
                        <LoadingButton buttonProps={{variant: "primary"}} onClick={this.handleClick}>
                            <span className={"icon"} dangerouslySetInnerHTML={{__html: refreshIcon}}/>
                            &nbsp;Update
                        </LoadingButton>
                    </div>
                </div>
            </div>
        );
    }
}
