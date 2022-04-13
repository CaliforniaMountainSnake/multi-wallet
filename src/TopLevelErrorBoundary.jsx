import React from "react";

export class TopLevelErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(error) {
        return {hasError: true};
    }

    componentDidCatch(error, errorInfo) {
        console.error("Unhandled top-level error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <h1>Oops, something went wrong. See the console messages.</h1>
            );
        }
        return this.props.children;
    }
}
