import {Amount, CurrencyInfo} from "./repositories/WalletRepository";

function showMessage(logger: (message?: any, ...optionalParams: any[]) => void = console.log,
                     message?: any, ...optionalParams: any[]
): void {
    logger(message, ...optionalParams);
    alert(message + " " + optionalParams.join(" "));
}

export function showError(message?: any, ...optionalParams: any[]): void {
    showMessage(console.error, message, ...optionalParams);
}

export function showWarning(message?: any, ...optionalParams: any[]): void {
    showMessage(console.warn, message, ...optionalParams);
}

export function formatAmount(amount: number): string {
    const fractionDigits = 2;
    if (amount === 0) {
        return amount.toString();
    }
    if (amount < 1) {
        // @see https://stackoverflow.com/a/31002148
        const countOfDecimalZeros = -Math.floor(Math.log10(amount) + 1);
        return amount.toFixed(countOfDecimalZeros + fractionDigits * 2);
    }

    return amount.toFixed(fractionDigits);
}

export function convertAmountToCurrency(exchangeRates: Map<string, CurrencyInfo>, amount: Amount,
                                        symbol: string): number {
    if (amount.amount === 0) {
        return 0;
    }
    return amount.amount / getRelativeExchangeRate(exchangeRates, symbol, amount.symbol);
}

export async function delay(ms: number, msg: string | undefined = undefined): Promise<void> {
    const baseMsg = `Sleep for ${ms} ms`;
    console.debug(msg ? `${baseMsg}: ${msg}` : `${baseMsg}...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRelativeExchangeRate(exchangeRates: Map<string, CurrencyInfo>, symbol1: string, symbol2: string) {
    const cur1 = exchangeRates.get(symbol1);
    const cur2 = exchangeRates.get(symbol2);
    if (cur1 === undefined || cur2 === undefined) {
        throw new Error(`Wrong currency symbols: "${symbol1}" or "${symbol2}"!`);
    }

    return (cur2.value / cur1.value);
}
