import {CurrencyInfo} from "../repositories/WalletRepository";

export const validator = {
    amount: async (amount: string): Promise<number> => {
        const parsed = parseFloat(amount);
        if (Number.isNaN(parsed) || parsed === 0) {
            throw new Error("Please, enter a valid number!");
        }
        return parsed;
    },
    symbol: async (symbol: string, exchangeRates: Map<string, CurrencyInfo>): Promise<string> => {
        if (!exchangeRates.get(symbol)) {
            throw new Error(`Wrong currency symbol: "${symbol}"!`);
        }
        return symbol;
    },
    comment: async (comment: string): Promise<string | undefined> => {
        const trimmedComment = comment.trim();
        return trimmedComment === "" ? undefined : trimmedComment;
    }
};
