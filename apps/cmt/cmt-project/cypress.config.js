// Taken from https://www.cypress.io/blog/cypress-studio-a-beginners-guide

const { defineConfig } = require("cypress");
module.exports = defineConfig({
 e2e: {
   experimentalStudio:true,
   setupNodeEvents(on, config) {
     // implement node event listeners here
   },
 },
});