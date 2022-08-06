const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {GenerateSW} = require("workbox-webpack-plugin");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "./www"),
        filename: "[name].bundle.js",
        chunkFilename: "[name].chunk-bundle.js",
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
                use: {loader: "babel-loader"},
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {loader: "ts-loader"},
            },
            {
                test: /\.css$/i,
                // use: ["style-loader", "css-loader", "postcss-loader"],
                use: ["style-loader", "css-loader"],
                resourceQuery: {not: [/raw/]},
            },
            {
                // @see https://webpack.js.org/guides/asset-modules/#source-assets
                resourceQuery: /raw/,
                type: "asset/source",
            },
        ]
    },
    optimization: {
        splitChunks: {
            // chunks: "all",
        },
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new GenerateSW({}),
    ],
};
