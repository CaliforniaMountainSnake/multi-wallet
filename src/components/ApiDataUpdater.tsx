import refreshIcon from "bootstrap-icons/icons/arrow-repeat.svg?raw";
import React, {useEffect, useState} from "react";
import {showError} from "../helpers";
import useThrowAsync from "../hooks/useThrowAsync";
import {coingeckoRepository} from "../repositories/api/CoingeckoRepository";
import {CoingeckoOHLCHistory, PriceCandle} from "../repositories/OHLCRepository";
import {WalletRepository} from "../repositories/WalletRepository";
import {LoadingButton, LoadingButtonClickHandler} from "./Utils/LoadingButton";
import StandardPlaceholder from "./Utils/StandardPlaceholder";

const BASE_RELATIVE_CURRENCY = "bitcoin";

export function ApiDataUpdater(props: {
    dbRepository: WalletRepository,
    userCurrenciesSet: Set<string>,
    onChange: () => void,
}): JSX.Element {
    const {throwAsync} = useThrowAsync();
    const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number | undefined>(undefined);

    const reloadLastUpdateTimestamp = async () => {
        const timestamp = await props.dbRepository.getConfig("last_update_timestamp");
        if (!timestamp) {
            console.warn("Api data were not found. Loading...");
            await requestFreshApiData(null);
            return;
        }

        setLastUpdateTimestamp(timestamp);
    };

    const requestFreshApiData: LoadingButtonClickHandler<null> = async (payload, progress) => {
        let requestCounter = 0;
        const history: CoingeckoOHLCHistory = [];
        const showProgress = (msg: string) =>
            progress?.(`${++requestCounter}/${1 + (props.userCurrenciesSet.size * 2)}) ${msg}`);

        const loadHistory = async (currency: string, type: PriceCandle["type"]) => {
            showProgress(`${currency} history...`);
            history.push({
                type: type,
                symbol: currency,
                candles: await coingeckoRepository.getOHLC(BASE_RELATIVE_CURRENCY, currency, type),
            });
        };

        try {
            // Request all necessary data:
            showProgress("exchange rates...");
            const exchangeRates = await coingeckoRepository.getExchangeRates();

            console.log("currenciesSet:", props.userCurrenciesSet);
            for (const currency of props.userCurrenciesSet) {
                await loadHistory(currency, "4_hours_candle_30_days");
                await loadHistory(currency, "4_days_candle_max_days");
            }

            // @TODO: Save all data inside one transaction:
            await props.dbRepository.resetApiData(exchangeRates, history);
            console.log("Fresh API data have been saved into the DB.");

            await reloadLastUpdateTimestamp();
            props.onChange();
        } catch (error) {
            showError(`Unable to load fresh exchange rates: ${error}`);
        }
    };

    useEffect(() => {
        if (!lastUpdateTimestamp) {
            throwAsync(async () => reloadLastUpdateTimestamp());
        }
    }, [lastUpdateTimestamp]);

    return (
        <div className={"card mb-3"}>
            <div className={"row card-body"}>
                <div className={"col-12 col-sm-8 mb-1 mb-sm-0"}>
                    <h5 className={"card-title"}>API data last update:</h5>
                    <h6 className={"card-subtitle text-muted"}>
                        {lastUpdateTimestamp
                            ? (new Date(lastUpdateTimestamp)).toLocaleString()
                            : <StandardPlaceholder/>}
                    </h6>
                </div>
                <div className={"col-12 col-sm-4 d-flex justify-content-sm-end"}>
                    <LoadingButton buttonProps={{
                        variant: "primary",
                        disabled: lastUpdateTimestamp === undefined,
                    }} payload={null} onClick={requestFreshApiData}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: refreshIcon}}/>
                        &nbsp;Update
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}
