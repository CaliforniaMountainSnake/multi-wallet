const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    // mode: 'production',
    mode: "development",
    entry: "./src/index.jsx",
    output: {
        path: path.resolve(__dirname, "./www"),
        filename: "bundle.js",
    },
    plugins: [new HtmlWebpackPlugin()],
    resolve: {
        extensions: [".jsx", "..."],
    },
    module: {
        rules: [
            {
                test: /\.m?jsx?$/,
                exclude: /node_modules/,
                use: {loader: "babel-loader"}
            }
        ]
    }
};
