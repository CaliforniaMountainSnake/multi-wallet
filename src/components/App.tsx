import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, UserRate, WalletRepository} from "../repositories/WalletRepository";
import {ExchangeRatesUpdater} from "./ExchangeRatesUpdater";
import {AmountsTable} from "./Amounts/AmountsTable";
import {LoadingButton} from "./Utils/LoadingButton";
import {CoingeckoRepository} from "../repositories/CoingeckoRepository";
import {UserRatesTable} from "./UserRates/UserRatesTable";
import {ThemeLoader} from "./Themes/ThemeLoader";
import {AppNavbar} from "./AppNavbar";
import {ThemeConfigurator} from "./Themes/ThemeConfigurator";
import {ThemeName} from "./Themes/InstalledThemes";
import {DarkModeAware} from "./Themes/DarkModeProvider";
import warningIcon from "bootstrap-icons/icons/exclamation-triangle.svg?raw";

interface Props extends DarkModeAware {
    defaultCurrency: "usd";
    defaultLightTheme: ThemeName;
    defaultDarkTheme: ThemeName;
}

interface State {
    dbRepository?: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
    amounts: Map<number, Amount>,
    userRates: Map<number, UserRate>,
    ratesLastUpdateTimestamp?: number,
    selectedCurrencySymbol?: string,
    lightTheme?: ThemeName,
    darkTheme?: ThemeName,
}

export default class App extends React.Component<Props, State> {
    private coingeckoRepository = new CoingeckoRepository();

    private initialState: State = {
        amounts: new Map(),
        exchangeRates: new Map(),
        userRates: new Map(),
    };
    state: State = this.initialState;

    private deleteDb = async (): Promise<void> => {
        const dbRepository = this.state.dbRepository!;
        if (confirm("Are you sure you want to delete the local DB?")) {
            await dbRepository.deleteIndexedDB();
            console.warn(`Database "${dbRepository.dbName}" has been deleted.`);
            await this.initialize();
        }
    };

    private onDbDataChanged = (): void => {
        this.loadDbData(this.state.dbRepository!).then(data => {
            this.setState(data, () => console.log("DB data were changed."));
        }).catch(error => {
            this.setState(() => {
                throw error;
            });
        });
    };

    private loadFreshExchangeRates = async (dbRepository: WalletRepository): Promise<void> => {
        try {
            const rawRates = await this.coingeckoRepository.getExchangeRates();
            await dbRepository.setExchangeRates(rawRates);
            console.debug("Fresh exchange rates were loaded from coingecko and saved into the DB.");
        } catch (error) {
            throw new Error(`Unable to load fresh exchange rates: ${error}`);
        }
    };

    private async loadDbData(dbRepository: WalletRepository): Promise<State> {
        const [exchangeRates, amounts, userRates, timestamp, selectedCurrency, lightTheme, darkTheme] = await Promise.all([
            dbRepository.getExchangeRates(),
            dbRepository.amountRepository.getAll(),
            dbRepository.userRateRepository.getAll(),
            dbRepository.getConfig("last_update_timestamp"),
            dbRepository.getConfig("selected_currency"),
            dbRepository.getConfig("light_theme"),
            dbRepository.getConfig("dark_theme"),
        ]);
        return {
            dbRepository: dbRepository,
            exchangeRates: exchangeRates,
            amounts: amounts,
            userRates: userRates,
            ratesLastUpdateTimestamp: timestamp,
            selectedCurrencySymbol: selectedCurrency,
            lightTheme: lightTheme,
            darkTheme: darkTheme,
        };
    }

    private async initialize() {
        const dbRepository = new WalletRepository();
        await dbRepository.open(async (error: Error) => {
            this.setState(() => {
                throw error;
            });
        });

        // Load data for the first time.
        const data = await this.loadDbData(dbRepository);
        if (data.exchangeRates.size === 0) {
            await this.loadFreshExchangeRates(dbRepository);
        }
        if (data.selectedCurrencySymbol === undefined) {
            await dbRepository.setConfig({
                key: "selected_currency",
                value: this.props.defaultCurrency
            });
        }
        if (data.lightTheme === undefined) {
            await dbRepository.setConfig({
                key: "light_theme",
                value: this.props.defaultLightTheme
            });
        }
        if (data.darkTheme === undefined) {
            await dbRepository.setConfig({
                key: "dark_theme",
                value: this.props.defaultDarkTheme
            });
        }

        // Load the updated data for the second time.
        this.setState(await this.loadDbData(dbRepository), () => {
            console.info("App data were initialized.");
        });
    }

    componentDidMount() {
        console.debug(`Component "${this.constructor.name}" was mounted.`);
        document.title = "Multi-currency Wallet";

        if (!this.state.dbRepository) {
            this.initialize().catch(error => {
                this.setState(() => {
                    throw error;
                });
            });
        }
    }

    render() {
        // @TODO: "Object.values(this.state).every(item => item !== undefined)" can be useful here,
        // @TODO: but it looks like TypeScript type narrowing doesn't recognize it.
        if (this.state.dbRepository === undefined || this.state.ratesLastUpdateTimestamp === undefined
            || this.state.selectedCurrencySymbol === undefined || this.state.lightTheme === undefined
            || this.state.darkTheme === undefined) {
            return (<DbLoadingFallback/>);
        }
        return (
            <ThemeLoader theme={this.props.isDarkMode ? this.state.darkTheme : this.state.lightTheme}
                         fallback={<ThemeLoadingFallback/>}>
                <AppNavbar>
                    <ThemeConfigurator dbRepository={this.state.dbRepository} onChange={this.onDbDataChanged}
                                       isDarkMode={this.props.isDarkMode}
                                       installedLightTheme={this.state.lightTheme}
                                       installedDarkTheme={this.state.darkTheme}/>
                </AppNavbar>
                <div className={"container-xl mt-2 mb-2"}>
                    <ExchangeRatesUpdater dbRepository={this.state.dbRepository}
                                          ratesLastUpdateTimestamp={this.state.ratesLastUpdateTimestamp}
                                          loadFreshExchangeRates={this.loadFreshExchangeRates}
                                          onChange={this.onDbDataChanged}/>
                    <div className={"row"}>
                        <div className={"col-12 col-xl-5"}>
                            <UserRatesTable rateRepository={this.state.dbRepository.userRateRepository}
                                            exchangeRates={this.state.exchangeRates}
                                            userRates={this.state.userRates}
                                            onChange={this.onDbDataChanged}/>
                        </div>
                        <div className={"col-12 col-xl-7"}>
                            <AmountsTable dbRepository={this.state.dbRepository}
                                          amounts={this.state.amounts}
                                          exchangeRates={this.state.exchangeRates}
                                          selectedCurrencySymbol={this.state.selectedCurrencySymbol}
                                          onAmountsChange={this.onDbDataChanged}
                                          onSelectedCurrencyChange={this.onDbDataChanged}/>
                        </div>
                    </div>
                    <LoadingButton buttonProps={{variant: "danger"}} onClick={this.deleteDb}>
                        <span className={"icon"} dangerouslySetInnerHTML={{__html: warningIcon}}/>
                        &nbsp;Clear DB
                    </LoadingButton>
                </div>
            </ThemeLoader>
        );
    }
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
