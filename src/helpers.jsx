import {Amount, CurrencyInfo} from "./repositories/WalletRepository";

/**
 * @param {any} error
 * @param {function(any):void} logger
 */
export function showMessage(error, logger = console.log) {
    logger(error);
    alert(error);
}

/**
 * @param {any} error
 */
export function showError(error) {
    showMessage(error, console.error);
}

/**
 * @param {any} error
 */
export function showWarning(error) {
    showMessage(error, console.warn);
}

/**
 * @param {number} amount
 * @returns {string}
 */
export function formatAmount(amount) {
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

/**
 * @param {Map<string, CurrencyInfo>} exchangeRates
 * @param {Amount} amount
 * @param {string} symbol
 * @return {number}
 */
export function convertAmountToCurrency(exchangeRates, amount, symbol) {
    if (amount.amount === 0) {
        return 0;
    }
    return amount.amount / getRelativeExchangeRate(exchangeRates, symbol, amount.symbol);
}


/**
 * @param {HTMLElement} element
 * @param {function(HTMLElement):Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function disableElementWhileCallback(element, callback) {
    element.disabled = true;
    try {
        return await callback(element);
    } finally {
        element.disabled = false;
    }
}

/**
 * @param {int} ms
 * @returns {Promise<void>}
 */
export async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {Map<string, CurrencyInfo>} exchangeRates
 * @param {string} symbol1
 * @param {string} symbol2
 * @returns {number}
 */
function getRelativeExchangeRate(exchangeRates, symbol1, symbol2) {
    const cur1 = exchangeRates.get(symbol1);
    const cur2 = exchangeRates.get(symbol2);
    if (cur1 === undefined || cur2 === undefined) {
        throw new Error(`Wrong currency symbols: "${symbol1}" or "${symbol2}"!`);
    }

    return (cur2.value / cur1.value);
}
