const purgecss = require("@fullhuman/postcss-purgecss");

module.exports = {
    plugins: [
        [
            purgecss({
                content: ["./src/**/*.js", "./src/**/*.jsx", "./src/**/*.ts", "./src/**/*.tsx"]
            })
        ],
    ],
};
