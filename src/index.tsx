import React from "react";
import {createRoot} from "react-dom/client";
import {App} from "./components/App";
import {TopLevelErrorBoundary} from "./components/TopLevelErrorBoundary";
import "./styles/style.css";

const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
root.render(
    <TopLevelErrorBoundary>
        <App/>
    </TopLevelErrorBoundary>
);
