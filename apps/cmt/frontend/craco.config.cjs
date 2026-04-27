const packagesToLoad = ['apps/workflow/ecosystem', 'apps/cmt/shared-utilities']
packagesToLoad.forEach((path, _, array) => array.push(path.replaceAll('/', '\\'))) // This is because I don't know how webpack does its naming stuff on Linux

const matchJavascript = /\.[jt]sx?$/

// craco really wants commonjs
module.exports = {
    webpack: {
        configure: webpackConfig => {
            // Without this config it works, but this should let local dependencies update while the dev server is running
            webpackConfig.resolve.symlinks = true

            // this config is to allow the loaders that webpack is using (https://webpack.js.org/concepts/loaders/)
            // to see and load (transpile) the code in our local dependencies (cmt-utils, workflows ecosystem)

            // create-react-app has a list of these that is uses by default
            // and each file will pick "one of" those loaders (first match) to load (transpile) the file with.

            // What this is doing is finding the babel rule (babel is a javascript loader that supports our use case of jsx to es5)
            // and then changing its include rule to include packages as specified by the array at the top

            // get the rule that has the list of loaders
            const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf)
            if (!oneOfRule) return webpackConfig

            // add a new loader to the start of the list. This should only return true for the packages in packagesToLoad,
            // and false for everything else, so that it will just go down the list of loaders and still find the first one that
            // matches.
            oneOfRule.oneOf.unshift({
                test: matchJavascript,
                include: modulePath => packagesToLoad.some(pkgPath => modulePath.includes(pkgPath)),
                use: {
                    loader: require.resolve('babel-loader'),
                    options: {
                        presets: [
                            [
                                require.resolve('babel-preset-react-app'),
                                {
                                    runtime: 'automatic', // This lets jsx be parsed correctly without requiring React to be imported
                                },
                            ],
                        ],
                    },
                },
            })

            return webpackConfig
        },
    },
}
