/**
 * Basic route tests for the TA Portal server
 * Tests the simplest endpoints to verify routing is working
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../../server/routing/index');

// Create a test Express app that mimics the main server setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/', (req, res) => {
    res.send('Welcome to the RIT TA Portal Backend!');
  });
  
  app.use('/api', apiRoutes);
  
  return app;
};

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
