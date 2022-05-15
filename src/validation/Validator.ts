import {CurrencyInfo, UserRate} from "../repositories/WalletRepository";
import {LazyThemeLoader, ThemeName} from "../components/Themes/InstalledThemes";

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
    },
    theme: async (theme: string): Promise<ThemeName> => {
        if (!Object.keys(LazyThemeLoader).includes(theme)) {
            throw new Error(`Invalid theme name: "${theme}"!`);
        }
        return theme as ThemeName;
    },
};

async function symbolValidator(symbol: string, exchangeRates: Map<string, CurrencyInfo>): Promise<string> {
    if (!exchangeRates.get(symbol)) {
        throw new Error(`Wrong currency symbol: "${symbol}"!`);
    }
    return symbol;
}

export type ValidationErrors<T> = {
    [P in keyof T as `${string & P}Error`]?: Error
};

type PromisesObject<T> = {
    [name: string]: PromiseLike<T>
}

type PromiseResults<V, T extends PromisesObject<V>> = {
    [P in keyof T]: Awaited<PromiseLike<T[P]>>
}

/**
 * Validate given data.
 *
 * @TODO: It definitely needs to be tested.
 */
export function validate<V, T extends PromisesObject<V>>(
    values: T,
    onSuccess: (validatedData: PromiseResults<V, T>) => void,
    onError: (validationErrors: ValidationErrors<T>) => void,
): void {
    const errors: { [name: string]: Error } = {};
    const results: { [name: string]: V } = {};
    Promise.allSettled(Object.values(values)).then(promiseResults => {
        let promiseResultIndex = 0;
        for (const [key,] of Object.entries(values)) {
            const value = promiseResults[promiseResultIndex++];
            if (value.status === "fulfilled") {
                results[key] = value.value;
                continue;
            }
            errors[`${key}Error`] = value.reason;
        }

        if (Object.keys(errors).length > 0) {
            onError(errors as ValidationErrors<T>);
            return;
        }
        onSuccess(results as PromiseResults<V, T>);
    });
}
