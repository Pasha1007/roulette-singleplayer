const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
    entry: {
        game: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[hash].js',
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
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
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
            filename: '[name].[hash].css',
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
                    from: './src/assets/videos/*',
                    to: 'assets/videos/[name][ext]',
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
        port: '5000',
        webSocketServer: false,
        // inline:true,//
        hot: true, // 
        host: '0.0.0.0',
        compress: true, // gzip
    },
};
