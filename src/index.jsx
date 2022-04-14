import React from "react";
import {createRoot} from "react-dom/client";
import {AppComponent} from "./components/AppComponent";
import {TopLevelErrorBoundary} from "./components/TopLevelErrorBoundary";

const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
root.render(
    <TopLevelErrorBoundary>
        <AppComponent/>
    </TopLevelErrorBoundary>
);
