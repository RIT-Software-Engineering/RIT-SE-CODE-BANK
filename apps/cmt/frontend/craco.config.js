export const config = {
    webpack: {
        configure: webpackConfig => {
            // npm workspaces "install" local dependencies with symlinks.
            // Without this config it works, but this should let it update while the dev server is running
            webpackConfig.resolve.symlinks = true

            return webpackConfig
        },
    },
}
