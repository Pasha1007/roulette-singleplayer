const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

// Change VIDEO_THEME to 'default' or 'christmas_edition' to switch video folders
const VIDEO_THEME = 'christmas_edition';

module.exports = {
    mode: 'development',
    devtool: 'eval-source-map', // Fast rebuilds with source maps for debugging
    entry: {
        game: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].js', // No hash for dev - faster rebuilds
        clean: true, // Clean dist folder on rebuild
    },
    watch: false, // Set to true if running with --watch flag
    watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 300, // Delay rebuild after first change (ms)
        poll: 1000, // Check for changes every second (use if normal watch doesn't work)
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/i,
                loader: 'babel-loader',
            },
            {
                test: /\.(png|svg|jpg|gif|jpeg)$/i,
                loader: 'url-loader',
                options: {
                    // 8kb一下
                    limit: 8 * 1024,
                    esModule: false,
                    name: 'img/[hash:9].[ext]',
                },
                type: 'javascript/auto',
            },
            {
                test: /\.html$/,
                use: ['html-loader'],
            },
            {
                test: /\.(css)$/,
                use: [
                    'style-loader',
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false,
                        },
                    },
                    'css-loader',
                    // 'less-loader'
                ],
            },
            {
                test: /\.(less)$/,
                use: [
                    'style-loader',
                    {
                        loader: MiniCssExtractPlugin.loader,

                        options: {
                            publicPath: '../',
                            esModule: false,
                        },
                    },
                    'css-loader',
                    'less-loader',
                ],
            },
            {
                test: /\.ejs$/,
                use: {
                    loader: 'ejs-loader',
                    options: {
                        esModule: false, // 关闭 ES 模块语法
                    },
                },
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf|mp3)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'css/[name][hash][ext][query]',
                },
            },
        ],
    },
    optimization: {
        minimize: false, // Disable minification for faster dev builds
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'common',
                    priority: 10,
                },
            },
        },
    },
    plugins: [
        // new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './html/index_.ejs',
            filename: 'index.html',
            inject: 'body',
            scriptLoading: 'blocking', // js 加载是否异步  webpack5 特性  {'blocking'|'defer'|'module'}
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css', // No hash for dev - faster rebuilds
            chunkFilename: '[id].css',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: './src/assets2/roulette/*',
                    to: 'assets2/roulette/[name][ext]',
                },
                {
                    from: './src/assets/music/*',
                    to: 'assets/music/[name][ext]',
                },
                {
                    from: './src/assets/images/*',
                    to: 'assets/images/[name][ext]',
                },
                {
                    from: `./src/assets/videos/${VIDEO_THEME}/*`,
                    to: `assets/videos/${VIDEO_THEME}/[name][ext]`,
                },
                {
                    from: './lang/*',
                    to: 'lang/[name][ext]',
                },
            ],
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, './dist'),
        },
        headers: {
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': '*',
        },
        historyApiFallback: true,
        allowedHosts: 'all',
        port: '3000', // Changed from 5000 to 3000
        webSocketServer: false,
        // inline:true,//
        hot: true, //
        host: '0.0.0.0',
        compress: true, // gzip
    },
};
