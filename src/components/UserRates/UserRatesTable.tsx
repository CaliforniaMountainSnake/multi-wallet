import React, {ReactNode} from "react";
import {AddNewRate} from "./AddNewRate";
import {CurrencyInfo, UserRate, WalletRepository} from "../../repositories/WalletRepository";
import {DisabledButton} from "../Utils/DisabledButton";
import {formatAmount, getRelativeExchangeRate, showError} from "../../helpers";

interface State {
    userRates?: Map<number, UserRate>,
}

export class UserRatesTable extends React.Component<{
    dbRepository: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
}, State> {
    state: State = {
        userRates: undefined,
    };

    private onUserRatesChanged = (): void => {
        this.props.dbRepository.getUserRates().then((rates: Map<number, UserRate>) => {
            this.setState({userRates: rates});
        }).catch((error: Error) => {
            showError("Unable to update favorite exchange rates!", error);
        });
    };

    private deleteUserRate = async (rateId?: number) => {
        const rate = this.state.userRates?.get(rateId!)!;
        if (confirm(`Are you sure you want to delete "${rate.symbol1}/${rate.symbol2}" pair?`)) {
            this.props.dbRepository.deleteUserRate(rateId!).then(() => {
                this.onUserRatesChanged();
                console.debug(`Favorite exchange rates pair with key "${rateId}" has been deleted.`);
            }).catch((error: Error) => {
                showError("Unable to delete favorite rates pair!", error);
            });
        }
    };

    componentDidMount(): void {
        if (!this.state.userRates) {
            this.onUserRatesChanged();
        }
    }

    render(): ReactNode {
        const ratesRows: ReactNode[] = [];
        if (this.state.userRates) {
            for (const [id, rate] of this.state.userRates) {
                const currInfo1 = this.props.exchangeRates.get(rate.symbol1)!;
                const currInfo2 = this.props.exchangeRates.get(rate.symbol2)!;
                ratesRows.push(
                    <tr key={id}>
                        <td className={"text-nowrap"} title={`${currInfo1.name} / ${currInfo2.name}`}>
                            {rate.symbol1}/{rate.symbol2}
                        </td>
                        <td className={"text-nowrap"}>
                            {formatAmount(getRelativeExchangeRate(this.props.exchangeRates, rate.symbol1, rate.symbol2))}
                            {" "}{currInfo2.unit}
                        </td>
                        <td className={"text-center"}>
                            <DisabledButton<number> payload={id}
                                                    className={"btn btn-secondary"}
                                                    onClick={this.deleteUserRate}>Delete</DisabledButton>
                        </td>
                    </tr>
                );
            }
        }

        return (
            <div className={"mb-3"}>
                <h2 className={"card-title"}>Favorite exchange rates</h2>
                <div className={"table-responsive"}>
                    <table className={"table table-bordered align-middle"}>
                        <thead>
                        <tr>
                            <th>Pair</th>
                            <th>Cost</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        <AddNewRate dbRepository={this.props.dbRepository} exchangeRates={this.props.exchangeRates}
                                    onChange={this.onUserRatesChanged}/>
                        {ratesRows}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
