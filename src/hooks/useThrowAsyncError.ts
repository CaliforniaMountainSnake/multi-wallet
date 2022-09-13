import React from "react";

/**
 * Use this hook to throw an error from an async function.
 * This error will be caught by ErrorBoundary.
 * (Unlike normally thrown errors that became "Uncaught (in promise)").
 *
 * @see https://medium.com/trabe/catching-asynchronous-errors-in-react-using-error-boundaries-5e8a5fd7b971
 */
export default function useThrowAsyncError() {
    const [_, setError] = React.useState();
    return {
        /**
         * Throw an error asynchronously to the nearest Error Boundary.
         */
        throwAsyncError: React.useCallback(
            (error: Error) => {
                setError(() => {
                    throw error;
                });
            },
            [setError],
        )
    };
};
