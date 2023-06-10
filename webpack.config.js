module.exports = {
  entry: {
    main: "./src/index.ts",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
    ],
  },
  node: {
    fs: "empty",
    net: "empty",
  },
  target: "node",
  resolve: {
    extensions: [".js", ".ts"],
  },
}
