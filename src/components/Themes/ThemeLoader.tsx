import React, {ReactNode} from "react";
import {Helmet} from "react-helmet-async";

export type ThemeName = "default_bootstrap" | "journal" | "material" | "slate" | "solar"
type LazyStyleLoader = {
    [key in ThemeName]: () => Promise<typeof import("*?raw")>
}

interface State {
    isDarkMode: boolean,
    currentStyle?: string,
}

/**
 * Bootstrap doesn't have builtin functionality for changing themes.
 * So, there is a way to change the theme - reload the whole boostrap.min.css.
 */
export class ThemeLoader extends React.Component<{
    lightTheme: ThemeName,
    darkTheme: ThemeName,
    children: ReactNode,
    fallback: ReactNode,
}, State> {
    private darkModeQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    state: State = {
        isDarkMode: this.darkModeQuery.matches,
        currentStyle: undefined,
    };

    private lazyStyleLoaders: LazyStyleLoader = {
        "default_bootstrap": () => import("bootstrap/dist/css/bootstrap.min.css?raw"),
        "journal": () => import("bootswatch/dist/journal/bootstrap.min.css?raw"),
        "material": () => import("bootswatch/dist/materia/bootstrap.min.css?raw"),
        "slate": () => import("bootswatch/dist/slate/bootstrap.min.css?raw"),
        "solar": () => import( "bootswatch/dist/solar/bootstrap.min.css?raw"),
    };

    private darkModeListener = (event: MediaQueryListEvent) => {
        this.setState({isDarkMode: event.matches}, () => this.loadTheme());
    };

    componentDidMount() {
        this.loadTheme();
        this.darkModeQuery.addEventListener("change", this.darkModeListener);
    }

    componentWillUnmount() {
        this.darkModeQuery.removeEventListener("change", this.darkModeListener);
    }

    private loadTheme(): void {
        const theme = this.state.isDarkMode ? this.props.darkTheme : this.props.lightTheme;
        this.lazyStyleLoaders[theme]().then((result) => {
            this.setState({currentStyle: result.default});
        }).catch((error) => {
            this.setState(() => {
                throw error;
            });
        });
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
