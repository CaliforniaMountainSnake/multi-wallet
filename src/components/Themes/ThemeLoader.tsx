import React, {lazy, ReactNode} from "react";

export type ThemeName = "default_bootstrap" | "journal" | "material" | "slate" | "solar"

interface Props {
    lightTheme: ThemeName,
    darkTheme: ThemeName,
    children: ReactNode,
    fallback?: ReactNode,
}

interface State {
    isDarkMode: boolean;
}

/**
 * Bootstrap doesn't have builtin functionality for changing themes.
 * So, there is a way to change the theme - reload the whole boostrap.min.css.
 */
export class ThemeLoader extends React.Component<Props, State> {
    private darkModeQuery: string = "(prefers-color-scheme: dark)";
    state: State = {
        isDarkMode: window.matchMedia(this.darkModeQuery).matches,
    };

    private darkModeListener = (event: MediaQueryListEvent) => {
        this.setState({isDarkMode: event.matches});
    };

    componentDidMount() {
        window.matchMedia(this.darkModeQuery).addEventListener("change", this.darkModeListener);
        console.log("Listener was added.");
    }

    componentWillUnmount() {
        window.matchMedia(this.darkModeQuery).removeEventListener("change", this.darkModeListener);
        console.log("Listener was removed.");
    }

    /**
     * @TODO: При текущем подходе при загрузке модуля webpack не выгружает загруженный до этого css.
     * @TODO: Таким образом, при каждой загрузке стили просто дублируются несколько раз.
     * @TODO:
     * @TODO: По всей видимости, необходимо извлекать css-файлы тем в отдельные файлы (MiniCssExtractPlugin).
     * @TODO: И затем заменять в рантайме непосредственно ссылку на css,
     * @TODO: например, с помощью React Helmet.
     * @TODO: (Вместо подгрузки js-модулей, содержащих css-стили).
     */
    private loadTheme(name: ThemeName): ReactNode {
        switch (name) {
            case "default_bootstrap":
                return React.createElement(lazy(() => import("./DefaultBootstrapTheme")));
            case "journal":
                return React.createElement(lazy(() => import("./JournalTheme")));
            case "material":
                return React.createElement(lazy(() => import("./MaterialTheme")));
            case "slate":
                return React.createElement(lazy(() => import("./SlateTheme")));
            case "solar":
                return React.createElement(lazy(() => import("./SolarTheme")));
            default:
                throw Error(`Invalid theme name: "${this.props.lightTheme}"`);
        }
    }

    render(): ReactNode {
        return (
            <React.Suspense fallback={this.props.fallback}>
                {this.loadTheme(this.state.isDarkMode ? this.props.darkTheme : this.props.lightTheme)}
                {this.props.children}
            </React.Suspense>
        );
    }
}
