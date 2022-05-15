import React, {ReactNode} from "react";
import {Helmet} from "react-helmet-async";
import {LazyThemeLoader, ThemeName} from "./InstalledThemes";

interface Props {
    theme: ThemeName,
    children: ReactNode,
    fallback: ReactNode,
}

interface State {
    currentStyle?: string,
}

/**
 * Bootstrap doesn't have builtin functionality for changing themes.
 * So, there is a way to change the theme - reload the whole boostrap.min.css.
 */
export class ThemeLoader extends React.Component<Props, State> {
    state: State = {
        currentStyle: undefined,
    };

    private loadTheme(): void {
        LazyThemeLoader[this.props.theme]().then((result) => {
            this.setState({currentStyle: result.default});
        }).catch((error) => {
            this.setState(() => {
                throw error;
            });
        });
    }

    componentDidMount() {
        this.loadTheme();
        console.debug("Theme was loaded first time:", this.props.theme);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        if (prevProps.theme !== this.props.theme) {
            this.loadTheme();
            console.debug("Theme was updated:", this.props.theme);
        }
    }

    render(): ReactNode {
        if (this.state.currentStyle === undefined) {
            return this.props.fallback;
        }

        return (
            <React.Fragment>
                <Helmet>
                    <style>{this.state.currentStyle}</style>
                </Helmet>
                {this.props.children}
            </React.Fragment>
        );
    }
}
