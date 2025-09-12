const nextJest = require('next/jest')

/*
* nextJest is a function that creates a jest config for a next.js project.
* dir: './': This is the directory that contains the next.js project.
* createJestConfig is a function that creates a jest config for a next.js project.
*/
const createJestConfig = nextJest({
  dir: './',
})

/*
* customJestConfig is an object that contains the jest config for the next.js project.
* testEnvironment: 'jsdom': This is the environment that jest will use to run the tests.
*/
const customJestConfig = {
  testEnvironment: 'jsdom',
}

/*
* module.exports is used to export the jest config for the next.js project.
*/
module.exports = createJestConfig(customJestConfig)
