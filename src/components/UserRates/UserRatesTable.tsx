import React, {ReactNode} from "react";
import {CurrencyInfo, UserRate, WalletRepository} from "../../repositories/WalletRepository";
import {AddNewRate} from "./AddNewRate";
import {UserRateRow} from "./UserRateRow";

export class UserRatesTable extends React.Component<{
    dbRepository: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
    userRates: Map<number, UserRate>,
    onChange: () => void,
}> {
    render(): ReactNode {
        const rows: ReactNode[] = [];
        for (const [id, rate] of this.props.userRates) {
            rows.push(
                <UserRateRow key={id} id={id} rate={rate} exchangeRates={this.props.exchangeRates}
                             dbRepository={this.props.dbRepository}
                             onChange={this.props.onChange}/>
            );
        }

        return (
            <div>
                <h2 className={"card-title"}>Exchange rates</h2>
                <AddNewRate className={"mb-2"}
                            rateRepository={this.props.dbRepository.userRateRepository}
                            exchangeRates={this.props.exchangeRates}
                            onChange={this.props.onChange}/>
                <div className={"table-responsive"}>
                    <table className={"table table-bordered align-middle"}>
                        <thead>
                        <tr>
                            <th>Pair</th>
                            <th>Cost</th>
                            <th colSpan={3}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </table>
                </div>
            </div>
        );
    }
}
