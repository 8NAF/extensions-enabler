import { resolve } from 'path'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import { Configuration } from 'webpack'

const extensionConfig = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	node: {
		__dirname: false,
	},
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
	},
	externals: {
		//'@vscode/sqlite3': 'commonjs @vscode/sqlite3',
		vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vscodeignore file
	},
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: ['.ts', '.js'],
		plugins: [new TsconfigPathsPlugin()],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
			{
				test: /\.node$/,
				loader: 'node-loader',
			},
		],
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log', // enables logging required for problem matchers
	},
} as Configuration

export default extensionConfig
