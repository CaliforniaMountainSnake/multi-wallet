import React from "react";
import {createRoot} from "react-dom/client";
import {AppComponent} from "./AppComponent";
import {TopLevelErrorBoundary} from "./TopLevelErrorBoundary";

const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
root.render(
    <TopLevelErrorBoundary>
        <AppComponent/>
    </TopLevelErrorBoundary>
);
