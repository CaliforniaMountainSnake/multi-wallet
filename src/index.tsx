import React from "react";
import {createRoot} from "react-dom/client";
import {TopLevelErrorBoundary} from "./components/TopLevelErrorBoundary";
import App from "./components/App";
import {HelmetProvider} from "react-helmet-async";
import "./styles/style.css";
import {DarkModeProvider} from "./components/Themes/DarkModeProvider";

const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
root.render(
    <TopLevelErrorBoundary>
        <HelmetProvider>
            <DarkModeProvider child={App} childProps={{
                defaultCurrency: "usd",
                defaultLightTheme: "default_bootstrap",
                defaultDarkTheme: "darkly",
            }}/>
        </HelmetProvider>
    </TopLevelErrorBoundary>
);
