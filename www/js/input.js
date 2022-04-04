import { App } from "./App.js"

// This is the input point of the app.
// Start app.
(new App()).start().then(() => {
    console.log("App has been started.")
}).catch(error => {
    console.error("Unhandled top level error:", error)
})
