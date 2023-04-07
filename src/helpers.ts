import { Amount, CurrencyInfo } from "./repositories/WalletRepository";

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

export function convertAmountToCurrency(exchangeRates: Map<string, CurrencyInfo>,
    amount: Amount, symbol: string): number {
    if (amount.amount === 0) {
        return 0;
    }
    return amount.amount / getRelativeExchangeRate(exchangeRates, symbol, amount.symbol);
}

export function calculateTotalSum(exchangeRates: Map<string, CurrencyInfo>, amounts: Map<number, Amount>,
    selectedCurrencySymbol: string): number {
    let resultSum = 0;
    for (const amount of amounts.values()) {
        if (amount.enabled) {
            resultSum += convertAmountToCurrency(exchangeRates, amount, selectedCurrencySymbol);
        }
    }
    return resultSum;
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

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @see https://stackoverflow.com/a/14919494
 * @return Formatted string.
 */
export function formatNumberToHumanReadable(bytes: number, si: boolean = true, dp: number = 1): string {
    // parseFloat removes trailing decimal zeros.
    // @see https://stackoverflow.com/a/19623253
    const roundNumber = (number: number): number => {
        return parseFloat(number.toFixed(dp));
    };

    const thresh: number = si ? 1000 : 1024;
    if (bytes === 0) {
        return "0";
    }
    if (Math.abs(bytes) < thresh) {
        return roundNumber(bytes).toString();
    }

    const units = si
        ? ["K", "M", "B", "T", "Qua", "Qui", "Sex", "Sep"]
        : ["Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"];
    let u: number = -1;
    const r: number = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return `${roundNumber(bytes)} ${units[u]}`;
}
