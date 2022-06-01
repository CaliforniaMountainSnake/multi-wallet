import React, {ReactNode} from "react";
import {AddNewRate} from "./AddNewRate";
import {CurrencyInfo, UserRate} from "../../repositories/WalletRepository";
import {UserRateRow} from "./UserRateRow";
import {DoublyLinkedListRepository} from "../../repositories/DoublyLinkedListRepository";

export class UserRatesTable extends React.Component<{
    rateRepository: DoublyLinkedListRepository<UserRate>,
    exchangeRates: Map<string, CurrencyInfo>,
    userRates: Map<number, UserRate>,
    onChange: () => void,
}> {
    render(): ReactNode {
        const rows: ReactNode[] = [];
        for (const [id, rate] of this.props.userRates) {
            rows.push(
                <UserRateRow key={id} id={id} rate={rate} exchangeRates={this.props.exchangeRates}
                             rateRepository={this.props.rateRepository}
                             onChange={this.props.onChange}/>
            );
        }

        return (
            <div>
                <h2 className={"card-title"}>Exchange rates</h2>
                <AddNewRate className={"mb-2"}
                            rateRepository={this.props.rateRepository} exchangeRates={this.props.exchangeRates}
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
