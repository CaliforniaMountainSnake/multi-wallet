import React from "react";
import {createRoot} from "react-dom/client";
import {HelmetProvider} from "react-helmet-async";
import {Workbox} from "workbox-window";
import App from "./components/App";
import {DarkModeProvider} from "./components/Themes/DarkModeProvider";
import {TopLevelErrorBoundary} from "./components/TopLevelErrorBoundary";
import "./styles/style.css";

if ("serviceWorker" in navigator) {
    const wb = new Workbox("/service-worker.js");
    wb.register().then(() => console.debug("Service worker has been registered."));
}

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
