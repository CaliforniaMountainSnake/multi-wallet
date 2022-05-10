import {CurrencyInfo, UserRate} from "../repositories/WalletRepository";

export const validator = {
    amount: async (amount: string): Promise<number> => {
        const parsed = parseFloat(amount);
        if (Number.isNaN(parsed) || parsed === 0) {
            throw new Error("Please, enter a valid number!");
        }
        return parsed;
    },
    symbol: symbolValidator,
    symbols: async (symbol1: string, symbol2: string, exchangeRates: Map<string, CurrencyInfo>): Promise<UserRate> => {
        await symbolValidator(symbol1, exchangeRates);
        await symbolValidator(symbol2, exchangeRates);
        if (symbol1 === symbol2) {
            throw new Error("Please, select different currencies!");
        }
        return {
            symbol1: symbol1,
            symbol2: symbol2,
        };
    },
    comment: async (comment: string): Promise<string | undefined> => {
        const trimmedComment = comment.trim();
        return trimmedComment === "" ? undefined : trimmedComment;
    }
};

async function symbolValidator(symbol: string, exchangeRates: Map<string, CurrencyInfo>): Promise<string> {
    if (!exchangeRates.get(symbol)) {
        throw new Error(`Wrong currency symbol: "${symbol}"!`);
    }
    return symbol;
}
