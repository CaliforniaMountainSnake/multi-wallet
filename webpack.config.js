const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
    const config = {
        entry: "./src/index.jsx",
        output: {
            path: path.resolve(__dirname, "./www"),
            filename: "bundle.js",
            clean: true,
        },
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
        },
        plugins: [
            new HtmlWebpackPlugin(),
        ],
    };

    // @see https://webpack.js.org/configuration/devtool/
    if (argv.mode === "development") {
        config.devtool = "eval-source-map";
    }
    if (argv.mode === "production") {
        config.devtool = "source-map";
    }

    return config;
};
