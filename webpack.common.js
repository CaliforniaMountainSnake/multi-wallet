const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "./www"),
        filename: "bundle.js",
        clean: true,
    },
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx", "..."],
    },
    module: {
        rules: [
            {
                test: /\.m?jsx?$/,
                exclude: /node_modules/,
                use: {loader: "babel-loader"}
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {loader: "ts-loader"}
            },
            {
                test: /\.css$/i,
                // use: ["style-loader", "css-loader", "postcss-loader"],
                use: ["style-loader", "css-loader"],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin(),
    ],
};
