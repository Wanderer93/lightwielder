const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/entry_point.js',
  mode: 'development',
  cache: {
    type: 'filesystem'
  },
  plugins: [
    new HtmlWebpackPlugin(
      {
        title: 'set-phaser-to-stun',
        template: 'template-index.html',
        inject: false
      }
    )
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  optimization: {
    runtimeChunk: 'single',

    splitChunks: {

      cacheGroups: {

        vendor: {

          test: /[\\/]node_modules[\\/]/,

          name: 'vendors',

          chunks: 'all'

        }

      }

    }
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|wav|mp3|ogg|xml)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: ''
          }
        }
      }
    ]
  },
  ignoreWarnings: [
    {
      message: /size limit/
    },
    {
      message: /limit the size of your bundles/
    }
  ],
  resolve: {
    alias: {
      Assets: path.resolve(__dirname, './assets/')
    }
  }

}
