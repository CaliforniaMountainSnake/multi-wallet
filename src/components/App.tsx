import React, {ReactNode} from "react";
import {Amount, CurrencyInfo, WalletRepository} from "../repositories/WalletRepository";
import {ExchangeRatesUpdater} from "./ExchangeRatesUpdater";
import {AmountsTable} from "./Amounts/AmountsTable";
import {LoadingButton} from "./Utils/LoadingButton";
import {CoingeckoRepository} from "../repositories/CoingeckoRepository";
import {UserRatesTable} from "./UserRates/UserRatesTable";
import {ThemeLoader, ThemeName} from "./Themes/ThemeLoader";
import {Button} from "react-bootstrap";

interface State {
    theme: ThemeName,
    amounts: Map<number, Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    dbRepository?: WalletRepository,
    ratesLastUpdateTimestamp?: number,
    selectedCurrencySymbol?: string,
}

export default class App extends React.Component<{}, State> {
    private defaultCurrency = "usd";
    private coingeckoRepository = new CoingeckoRepository();

    state: State = {
        theme: "material",
        amounts: new Map(),
        exchangeRates: new Map(),
    };

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
            await dbRepository.updateExchangeRates(rawRates);
            console.debug("Fresh exchange rates were loaded from coingecko and saved into the DB.");
        } catch (error) {
            throw new Error(`Unable to load fresh exchange rates: ${error}`);
        }
    };

    private async loadDbData(dbRepository: WalletRepository): Promise<State> {
        const [amounts, rates, timestamp, selectedCurrency] = await Promise.all([
            dbRepository.getAmounts(),
            dbRepository.getExchangeRates(),
            dbRepository.getConfig("last_update_timestamp"),
            dbRepository.getConfig("selected_currency"),
        ]);
        return {
            theme: "material",
            dbRepository: dbRepository,
            amounts: amounts,
            exchangeRates: rates,
            ratesLastUpdateTimestamp: timestamp,
            selectedCurrencySymbol: selectedCurrency,
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
        if (!data.selectedCurrencySymbol) {
            await dbRepository.setConfig({
                key: "selected_currency",
                value: this.defaultCurrency
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

    private changeTheme = () => {
        this.setState({theme: "slate"});
    };

    render() {
        if (!this.state.dbRepository || !this.state.ratesLastUpdateTimestamp || !this.state.selectedCurrencySymbol) {
            return (<DbLoadingFallback/>);
        }
        return (
            <ThemeLoader lightTheme={"default_bootstrap"} darkTheme={"solar"} fallback={<ThemeLoadingFallback/>}>
                <div className={"container-lg mt-2 mb-2"}>
                    <h1>Multi-currency Wallet</h1>
                    <ExchangeRatesUpdater dbRepository={this.state.dbRepository}
                                          ratesLastUpdateTimestamp={this.state.ratesLastUpdateTimestamp}
                                          loadFreshExchangeRates={this.loadFreshExchangeRates}
                                          onChange={this.onDbDataChanged}/>
                    <div className={"row"}>
                        <div className={"col-12 col-lg-4"}>
                            <UserRatesTable dbRepository={this.state.dbRepository}
                                            exchangeRates={this.state.exchangeRates}/>
                        </div>
                        <div className={"col-12 col-lg-8"}>
                            <AmountsTable dbRepository={this.state.dbRepository}
                                          amounts={this.state.amounts}
                                          exchangeRates={this.state.exchangeRates}
                                          selectedCurrencySymbol={this.state.selectedCurrencySymbol}
                                          onAmountsChange={this.onDbDataChanged}
                                          onSelectedCurrencyChange={this.onDbDataChanged}/>
                        </div>
                    </div>
                    <LoadingButton variant={"danger"} onClick={this.deleteDb}>⚠ Clear DB</LoadingButton>
                    <Button variant={"info"} onClick={this.changeTheme}>Change theme</Button>
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
