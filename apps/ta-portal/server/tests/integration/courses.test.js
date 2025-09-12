/**
 * Integration test for courses functionality
 * Tests the full flow: Route -> Database Query -> Response
 */

/*
* jest.mock replaces the actual Prisma Client with a mock function.
* PrismaClient: jest.fn(() => ({})): This is the mock Prisma Client function.s
*/
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    // Mock Prisma methods as needed
  }))
}));

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../../server/routing/index');

/*
* jest.mock replaces the actual getAllCourses function with a mock function.
* getAllCourses: jest.fn(): This is the mock getAllCourses function.
* Returns a resolved promise with an array of courses.
*/
jest.mock('../../server/database/query_db', () => ({
  getAllCourses: jest.fn(),
}));

const { getAllCourses } = require('../../server/database/query_db');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
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
describe('Courses Integration Tests', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/db/courses should return courses successfully', async () => {
    const mockCourses = [
      { courseCode: 'CS101', name: 'Introduction to Computer Science' },
      { courseCode: 'CS201', name: 'Data Structures' },
    ];
    getAllCourses.mockResolvedValue(mockCourses);

    const response = await request(app)
      .get('/api/db/courses')
      .expect(200);

    expect(response.body).toEqual(mockCourses);
    expect(getAllCourses).toHaveBeenCalledTimes(1);
  });

  test('GET /api/db/courses should handle database errors', async () => {
    getAllCourses.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/db/courses')
      .expect(500);

    expect(response.body).toEqual({ error: 'Failed to retrieve courses.' });
    expect(getAllCourses).toHaveBeenCalledTimes(1);
  });

  test('GET /api/db/courses should handle empty course list', async () => {
    getAllCourses.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/db/courses')
      .expect(200);

    expect(response.body).toEqual([]);
    expect(getAllCourses).toHaveBeenCalledTimes(1);
  });
});
