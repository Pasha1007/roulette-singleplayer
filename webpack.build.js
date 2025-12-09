const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

// Change VIDEO_THEME to 'default' or 'christmas_edition' to switch video folders
const VIDEO_THEME = 'christmas_edition';

module.exports = {
    entry: {
        game: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].[contenthash].js',
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/i,
                loader: 'babel-loader',
            },
            {
                test: /\.(png|svg|jpg|gif|jpeg|webp)$/i,
                loader: 'url-loader',
                options: {
                    // 8kb一下
                    limit: 8 * 1024,
                    esModule: false,
                    name: 'img/[contenthash:9].[ext]',
                },
                type: 'javascript/auto',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf|mp3)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'css/[name][hash][ext][query]',
                },
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
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /\.js(\?.*)?$/i, //需要压缩的文件
                exclude: [/node_modules/, /\/.\/publish\//],
                parallel: true,
                extractComments: false, //是否将注释剥离到单独的文件中,默认值： true
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    compress: {
                        //drop_console: true, //移除console
                        // drop_debug:true,
                    },
                },
            }),
        ],
        concatenateModules: true,
        runtimeChunk: false,
        splitChunks: {
            chunks: 'all',
            minSize: 10000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            enforceSizeThreshold: 50000,
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/, // 匹配 node_modules 中的模块
                    name: 'common', // 提取后的公共模块文件名
                    enforce: true, // 强制提取
                },
                /*common: {
                    minChunks:2, // 至少被两个 chunk 引用才提取
                    name: 'common', // 提取后的公共模块文件名
                    priority: 10, // 提取优先级
                    reuseExistingChunk: true, // 如果该模块已经被提取过，则直接复用
                },*/
            },
        },
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './html/index.ejs',
            filename: 'index.html',
            chunks: ['game'],
            inject: 'body',
            scriptLoading: 'blocking', // js 加载是否异步  webpack5 特性  {'blocking'|'defer'|'module'}
        }),
        new HtmlWebpackPlugin({
            template: './html/index.ejs',
            filename: 'games/roulettes/1.0.0/index.html',
            chunks: ['game'],
            inject: 'body',
            scriptLoading: 'blocking', // js 加载是否异步  webpack5 特性  {'blocking'|'defer'|'module'}
        }),
        new MiniCssExtractPlugin({
            filename: './css/[name].[contenthash].css',
            chunkFilename: './css/[id].css',
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
};
