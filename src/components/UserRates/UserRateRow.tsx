import arrowDownIcon from "bootstrap-icons/icons/arrow-down.svg?raw";
import arrowUpIcon from "bootstrap-icons/icons/arrow-up.svg?raw";
import deleteIcon from "bootstrap-icons/icons/trash3.svg?raw";
import React, {ReactNode} from "react";
import {formatAmount, getRelativeExchangeRate, showError} from "../../helpers";
import {CurrencyInfo, UserRate, WalletRepository} from "../../repositories/WalletRepository";
import HistoryChart from "../History/HistoryChart";
import {LoadingButton} from "../Utils/LoadingButton";
import StandardPlaceholder from "../Utils/StandardPlaceholder";

export class UserRateRow extends React.Component<{
    id: number,
    rate: UserRate,
    exchangeRates: Map<string, CurrencyInfo>,
    dbRepository: WalletRepository,
    onChange: () => void,
}> {
    private moveUp = async (): Promise<void> => {
        await this.props.dbRepository.userRateRepository.moveUp(this.props.id);
        this.props.onChange();
    };

    private moveDown = async (): Promise<void> => {
        await this.props.dbRepository.userRateRepository.moveDown(this.props.id);
        this.props.onChange();
    };

    private delete = async () => {
        if (confirm(`Are you sure you want to delete "${this.props.rate.symbol1}/${this.props.rate.symbol2}" pair?`)) {
            this.props.dbRepository.userRateRepository.delete(this.props.id).then(() => {
                this.props.onChange();
                console.debug(`Favorite exchange rates pair with key "${this.props.id}" has been deleted.`);
            }).catch((error: Error) => {
                showError("Unable to delete favorite rates pair!", error);
            });
        }
    };

    render(): ReactNode {
        const currencyInfo1 = this.props.exchangeRates.get(this.props.rate.symbol1);
        const currencyInfo2 = this.props.exchangeRates.get(this.props.rate.symbol2);
        if (!currencyInfo1 || !currencyInfo2) {
            return (
                <tr>
                    <td colSpan={6}><StandardPlaceholder/></td>
                </tr>
            );
        }

        return (
            <tr key={this.props.id}>
                <td className={"text-nowrap"} title={`${currencyInfo1.name} / ${currencyInfo2.name}`}>
                    {this.props.rate.symbol1}/{this.props.rate.symbol2}
                </td>
                <td className={"text-nowrap"}>
                    {formatAmount(getRelativeExchangeRate(this.props.exchangeRates, this.props.rate.symbol1, this.props.rate.symbol2))}
                    {" "}{currencyInfo2.unit}
                </td>
                <td className={"text-center"}>
                    <HistoryChart title={`${this.props.rate.symbol1}/${this.props.rate.symbol2}`}
                                  buttonProps={{variant: "secondary", size: "sm"}}
                                  ohlcRepository={this.props.dbRepository.ohlcRepository}
                                  vsCurrency={this.props.rate.symbol2}
                                  targetCurrencies={[{symbol: this.props.rate.symbol1, amount: 1}]}/>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   payload={null} onClick={this.moveUp}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: arrowUpIcon}}/>
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   payload={null} onClick={this.moveDown}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: arrowDownIcon}}/>
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "danger", size: "sm"}}
                                   payload={null} onClick={this.delete}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: deleteIcon}}/>
                    </LoadingButton>
                </td>
            </tr>
        );
    }
}
