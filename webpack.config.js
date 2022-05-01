const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = (env, argv) => {
    const config = {
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
                    use: ["style-loader", "css-loader"],
                },
            ]
        },
        plugins: [
            new HtmlWebpackPlugin(),
            // new BundleAnalyzerPlugin(),
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
