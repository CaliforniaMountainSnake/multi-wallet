import React, {ReactNode} from "react";
import {CurrencyInfo, UserRate} from "../../repositories/WalletRepository";
import {formatAmount, getRelativeExchangeRate, showError} from "../../helpers";
import {LoadingButton} from "../Utils/LoadingButton";
import {DoublyLinkedListRepository} from "../../repositories/DoublyLinkedListRepository";
import deleteIcon from "bootstrap-icons/icons/trash3.svg?raw";
import arrowUpIcon from "bootstrap-icons/icons/arrow-up.svg?raw";
import arrowDownIcon from "bootstrap-icons/icons/arrow-down.svg?raw";

export class UserRateRow extends React.Component<{
    id: number,
    rate: UserRate,
    exchangeRates: Map<string, CurrencyInfo>,
    rateRepository: DoublyLinkedListRepository<UserRate>,
    onChange: () => void,
}> {
    private moveUp = async (): Promise<void> => {
        await this.props.rateRepository.moveUp(this.props.id);
        this.props.onChange();
    };

    private moveDown = async (): Promise<void> => {
        await this.props.rateRepository.moveDown(this.props.id);
        this.props.onChange();
    };

    private delete = async () => {
        if (confirm(`Are you sure you want to delete "${this.props.rate.symbol1}/${this.props.rate.symbol2}" pair?`)) {
            this.props.rateRepository.delete(this.props.id).then(() => {
                this.props.onChange();
                console.debug(`Favorite exchange rates pair with key "${this.props.id}" has been deleted.`);
            }).catch((error: Error) => {
                showError("Unable to delete favorite rates pair!", error);
            });
        }
    };

    render(): ReactNode {
        const currencyInfo1 = this.props.exchangeRates.get(this.props.rate.symbol1)!;
        const currencyInfo2 = this.props.exchangeRates.get(this.props.rate.symbol2)!;
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
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   onClick={this.moveUp}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: arrowUpIcon}}/>
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "secondary", size: "sm"}}
                                   onClick={this.moveDown}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: arrowDownIcon}}/>
                    </LoadingButton>
                </td>
                <td className={"text-center"}>
                    <LoadingButton buttonProps={{variant: "danger", size: "sm"}}
                                   onClick={this.delete}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: deleteIcon}}/>
                    </LoadingButton>
                </td>
            </tr>
        );
    }
}
