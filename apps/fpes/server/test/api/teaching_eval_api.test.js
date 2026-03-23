const mockQuery = jest.fn();
const mockConn = { query: mockQuery, release: jest.fn() };
jest.mock('../../db', () => ({ getConnection: jest.fn(() => mockConn) }));
jest.mock('fs');
jest.mock('@google/generative-ai');

const api = require('../../api/teaching_eval_api');

afterEach(() => jest.clearAllMocks());

describe('getFacultyTeachingEvalPercentiles', () => {
  test('returns mapped percentile rows', async () => {
    mockQuery.mockResolvedValueOnce([
      { professor_name: 'Dr. Smith', overall_avg: '4.50', eval_count: '3', percentile: '75.00' }
    ]);
    const result = await api.getFacultyTeachingEvalPercentiles();
    expect(result).toEqual([
      { professor_name: 'Dr. Smith', overall_avg: 4.5, eval_count: 3, percentile: 75 }
    ]);
  });

  test('returns empty array when no evals exist', async () => {
    mockQuery.mockResolvedValueOnce([]);
    const result = await api.getFacultyTeachingEvalPercentiles();
    expect(result).toEqual([]);
  });
});

describe('getFacultyPercentileByName', () => {
  test('returns null when professor not found', async () => {
    mockQuery.mockResolvedValueOnce([]);
    const result = await api.getFacultyPercentileByName('Unknown Prof');
    expect(result).toBeNull();
  });

  test('returns percentile data for known professor', async () => {
    mockQuery.mockResolvedValueOnce([
      { professor_name: 'Dr. Jones', overall_avg: '3.80', eval_count: '2', percentile: '50.00' }
    ]);
    const result = await api.getFacultyPercentileByName('Dr. Jones');
    expect(result).toEqual({ professor_name: 'Dr. Jones', overall_avg: 3.8, eval_count: 2, percentile: 50 });
  });
});

describe('getFacultyPercentileById', () => {
  test('returns null when faculty id not found', async () => {
    mockQuery.mockResolvedValueOnce([]);
    const result = await api.getFacultyPercentileById(999);
    expect(result).toBeNull();
  });

  test('returns percentile data for matching faculty id', async () => {
    mockQuery.mockResolvedValueOnce([
      { faculty_information_id: 1, faculty_name: 'Dr. Lee', overall_avg: '4.10', eval_count: '1', percentile: '100.00' }
    ]);
    const result = await api.getFacultyPercentileById(1);
    expect(result).toEqual({ professor_name: 'Dr. Lee', overall_avg: 4.1, eval_count: 1, percentile: 100 });
  });
});
