import React from "react";

export class TopLevelErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {"error": null};
    }

    static getDerivedStateFromError(error) {
        return {"error": error};
    }

    componentDidCatch(error, errorInfo) {
        console.error("Unhandled top-level error:", error, errorInfo);
    }

    render() {
        /** @type {Error} */
        const error = this.state.error;
        if (error !== null) {
            return (
                <React.Fragment>
                    <h1>Oops, something went wrong...</h1>
                    <figure>
                        <figcaption>{error.name}</figcaption>
                        <p>{error.message}</p>
                    </figure>
                </React.Fragment>
            );
        }
        return (<React.StrictMode>{this.props.children}</React.StrictMode>);
    }
}
