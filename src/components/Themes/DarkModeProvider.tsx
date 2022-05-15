import React, {ReactNode} from "react";

export interface DarkModeAware {
    isDarkMode: boolean;
}

// @see https://stackoverflow.com/a/69850582
// @see https://github.com/microsoft/TypeScript/issues/23182#issuecomment-379091887
type UndefinedIfEmptyObject<Obj extends Record<PropertyKey, unknown>> =
    [keyof Obj] extends [never] ? undefined : Obj

export class DarkModeProvider<T extends DarkModeAware> extends React.Component<{
    child: React.ComponentType<T>,
    childProps: UndefinedIfEmptyObject<Omit<T, keyof DarkModeAware>>,
}, DarkModeAware> {
    private darkModeQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    state: DarkModeAware = {
        isDarkMode: this.darkModeQuery.matches,
    };

    private darkModeListener = (event: MediaQueryListEvent) => {
        this.setState({isDarkMode: event.matches});
    };

    componentDidMount() {
        this.darkModeQuery.addEventListener("change", this.darkModeListener);
    }

    componentWillUnmount() {
        this.darkModeQuery.removeEventListener("change", this.darkModeListener);
    }

    render(): ReactNode {
        const darkModeAwaitedProps = Object.assign({}, this.props.childProps ?? {}, this.state) as T;
        return React.createElement(this.props.child, darkModeAwaitedProps);
    }
}
