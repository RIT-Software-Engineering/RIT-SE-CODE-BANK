const path = require("path");

module.exports = {
  rootDir: path.resolve(__dirname),
  testEnvironment: "node",
  moduleDirectories: [
    "node_modules",
    path.join(__dirname, "apps/ta-portal/server"),
    path.join(__dirname, "services"),
  ],
  moduleNameMapper: {
  "@server/(.*)": "<rootDir>/apps/ta-portal/server/server/$1",
  "@services/(.*)": "<rootDir>/services/$1",
},
  transform: {},
  verbose: true,
};
