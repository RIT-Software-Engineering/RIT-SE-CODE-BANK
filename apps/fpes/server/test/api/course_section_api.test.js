const mockQuery = jest.fn();
const mockConn = { query: mockQuery, release: jest.fn() };
jest.mock('../../db', () => ({ getConnection: jest.fn(() => mockConn) }));
jest.mock('fs');

const api = require('../../api/course_section_api');

afterEach(() => jest.clearAllMocks());

describe('getDaysOfTheWeek', () => {
  test('maps day numbers to abbreviations', () => {
    expect(api.getDaysOfTheWeek([1, 3, 5])).toBe('Mon/Wed/Fri');
  });

  test('sorts values before mapping', () => {
    expect(api.getDaysOfTheWeek([3, 1])).toBe('Mon/Wed');
  });
});

describe('getAllCourseSections', () => {
  test('returns query results', async () => {
    const rows = [{ id: 1, course_name: 'Software Engineering', course_code: 'SWEN-261' }];
    mockQuery.mockResolvedValueOnce(rows);
    const result = await api.getAllCourseSections();
    expect(result).toEqual(rows);
  });
});

describe('getSectionByID', () => {
  test('queries with correct id', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 5 }]);
    const result = await api.getSectionByID(5);
    expect(result).toEqual([{ id: 5 }]);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE cs.id = ?'), [5]);
  });
});

describe('updateCourseSection', () => {
  test('returns changedRows 0 when body has no allowed fields', async () => {
    const result = await api.updateCourseSection(1, { unknown_field: 'x' });
    expect(result).toEqual({ changedRows: 0 });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
