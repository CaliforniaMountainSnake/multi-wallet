import useThrowAsyncError from "./useThrowAsyncError";

/**
 * Use this hook to re-throw an error to the ErrorBoundary inside a top-level callbacks.
 */
export default function useThrowAsync() {
    const {throwAsyncError} = useThrowAsyncError();
    return {
        /**
         * Catch callback error and re-throw it asynchronously to the nearest Error Boundary.
         */
        throwAsync: async <T>(callback: () => Promise<T>): Promise<T | undefined> => {
            try {
                return await callback();
            } catch (error) {
                if (error instanceof Error) {
                    throwAsyncError(error);
                    return;
                }

                console.error(`Promise reject type is not a "Error"! Error:`, error);
                throwAsyncError(new Error(`${error}`));
            }
        }
    };
}
