import React, {ErrorInfo, ReactNode} from "react";

interface State {
    error?: Error;
}

export class TopLevelErrorBoundary extends React.Component<{ children: ReactNode }, State> {
    state: State = {};

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return {error: error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Unhandled top-level error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.error) {
            return (
                <React.Fragment>
                    <h1>Oops, something went wrong...</h1>
                    <figure>
                        <figcaption>{this.state.error.name}</figcaption>
                        <p>{this.state.error.message}</p>
                    </figure>
                </React.Fragment>
            );
        }
        return (<React.StrictMode>{this.props.children}</React.StrictMode>);
    }
}
