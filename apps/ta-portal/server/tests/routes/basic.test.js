/**
 * Basic route tests for the TA Portal server
 * Tests the simplest endpoints to verify routing is working
 */

// Mock Prisma Client before any imports
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({}))
}));

/*
* Supertest is a library that is used to test HTTP requests to the server.
*/
const request = require('supertest');
const express = require('express');
const apiRoutes = require('../../server/routing/index');


//create a test Express app that mimics the main server setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/', (req, res) => {
    res.send('Welcome to the RIT TA Portal Backend!');
  });
  
  app.use('/api', apiRoutes);
  
  return app;
};

/*
* describe is used to group related tests together.
* beforeAll is used to run a function before all tests in the describe block.
* test is used to define a single test case.
* expect is used to assert that a condition is true.
* toBeDefined is used to check if a value is defined.
*/
describe('Basic Routes', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });

  test('GET / should return welcome message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toBe('Welcome to the RIT TA Portal Backend!');
  });

  test('API routes should be mounted at /api', async () => {
    const response = await request(app)
      .get('/api');
    
    expect(response.status).toBeDefined();
  });
});
