import warningIcon from "bootstrap-icons/icons/exclamation-triangle.svg?raw";
import React, {ReactNode, useEffect, useState} from "react";
import useThrowAsync from "../hooks/useThrowAsync";
import useThrowAsyncError from "../hooks/useThrowAsyncError";
import {Amount, CurrencyInfo, UserConfig, UserRate, WalletRepository} from "../repositories/WalletRepository";
import {AmountsTable} from "./Amounts/AmountsTable";
import {ApiDataUpdater} from "./ApiDataUpdater";
import {AppNavbar} from "./AppNavbar";
import {DarkModeAware} from "./Themes/DarkModeProvider";
import {ThemeName} from "./Themes/InstalledThemes";
import {ThemeConfigurator} from "./Themes/ThemeConfigurator";
import {ThemeLoader} from "./Themes/ThemeLoader";
import {UserRatesTable} from "./UserRates/UserRatesTable";
import {LoadingButton, LoadingButtonClickHandler} from "./Utils/LoadingButton";

interface Props extends DarkModeAware {
    defaultCurrency: string;
    defaultLightTheme: ThemeName;
    defaultDarkTheme: ThemeName;
}

export default function App(props: Props): JSX.Element {
    const {throwAsyncError} = useThrowAsyncError();
    const {throwAsync} = useThrowAsync();

    const [dbRepository, setDbRepository] = useState<WalletRepository | undefined>(undefined);

    // User data:
    const [amounts, setAmounts] = useState<Map<number, Amount>>(new Map());
    const [userRates, setUserRates] = useState<Map<number, UserRate>>(new Map());
    const [userConfig, setUserConfig] = useState<UserConfig | undefined>(undefined);
    const [currenciesSet, setCurrenciesSet] = useState<Set<string> | undefined>(undefined);

    // Api data:
    const [exchangeRates, setExchangeRates] = useState<Map<string, CurrencyInfo>>(new Map());

    const deleteDb: LoadingButtonClickHandler<WalletRepository> = async (repository): Promise<void> => {
        if (confirm("Are you sure you want to delete the local DB?")) {
            await repository.deleteIndexedDB();
            console.warn(`Database "${repository.dbName}" has been deleted.`);
            setDbRepository(undefined);
        }
    };

    const reloadUserData = (repository: WalletRepository): void => {
        throwAsync(async () => {
            let [freshAmounts, freshRates, freshConfig] = await Promise.all([
                repository.amountRepository.getAll(),
                repository.userRateRepository.getAll(),
                repository.getUserConfig()
            ]);

            if (!freshConfig) {
                await Promise.all([
                    repository.setConfig({key: "selected_currency", value: props.defaultCurrency}),
                    repository.setConfig({key: "light_theme", value: props.defaultLightTheme}),
                    repository.setConfig({key: "dark_theme", value: props.defaultDarkTheme}),
                ]);
                freshConfig = (await repository.getUserConfig())!;
                console.log("Config has been initialized.");
            }

            setAmounts(freshAmounts);
            setUserRates(freshRates);
            setUserConfig(freshConfig);
            setCurrenciesSet(repository.getUniqueCurrencies(freshConfig.selectedCurrencySymbol, freshAmounts, freshRates));
            console.log("User data have been reloaded.");
        });
    };

    const reloadApiData = (repository: WalletRepository): void => {
        throwAsync(async () => {
            setExchangeRates(await repository.getExchangeRates());
        });
    };

    useEffect(() => {
        throwAsync(async () => {
            if (!dbRepository) {
                const repository = new WalletRepository();
                await repository.open(async (error: Error) => throwAsyncError(error));
                setDbRepository(repository);
                reloadUserData(repository);
                reloadApiData(repository);
            }
        });
    }, [dbRepository]);

    if (!dbRepository || !userConfig || !currenciesSet) {
        return <DbLoadingFallback/>;
    }
    return <>
        <ThemeLoader theme={props.isDarkMode ? userConfig.darkTheme : userConfig.lightTheme}
                     fallback={<ThemeLoadingFallback/>}>
            <AppNavbar>
                <ThemeConfigurator dbRepository={dbRepository} onChange={() => reloadUserData(dbRepository)}
                                   isDarkMode={props.isDarkMode}
                                   installedLightTheme={userConfig.lightTheme}
                                   installedDarkTheme={userConfig.darkTheme}/>
            </AppNavbar>
            <div className={"container-xl mt-2 mb-2"}>
                <ApiDataUpdater dbRepository={dbRepository}
                                userCurrenciesSet={currenciesSet}
                                onChange={() => reloadApiData(dbRepository)}/>
                <div className={"row"}>
                    <div className={"col-12 col-xl-5"}>
                        <UserRatesTable dbRepository={dbRepository}
                                        exchangeRates={exchangeRates}
                                        userRates={userRates}
                                        onChange={() => reloadUserData(dbRepository)}/>
                    </div>
                    <div className={"col-12 col-xl-7"}>
                        <AmountsTable dbRepository={dbRepository}
                                      amounts={amounts}
                                      exchangeRates={exchangeRates}
                                      selectedCurrencySymbol={userConfig.selectedCurrencySymbol} // @TODO: move into AmountsTable.
                                      onAmountsChange={() => reloadUserData(dbRepository)}
                                      onSelectedCurrencyChange={() => reloadUserData(dbRepository)}/>
                    </div>
                </div>
                <LoadingButton buttonProps={{variant: "danger"}} payload={dbRepository} onClick={deleteDb}>
                    <span className={"icon"} dangerouslySetInnerHTML={{__html: warningIcon}}/>
                    &nbsp;Clear DB
                </LoadingButton>
            </div>
        </ThemeLoader>
    </>;
}

class DbLoadingFallback extends React.Component {
    render(): ReactNode {
        return (
            <div>
                Database loading...
            </div>
        );
    }
}

class ThemeLoadingFallback extends React.Component {
    render(): ReactNode {
        return (
            <div>
                Theme loading...
            </div>
        );
    }
}
