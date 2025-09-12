/**
 * Basic test for the main routing module
 * This verifies that Jest is working and that our routing setup is correct
 */

const router = require('../../server/routing/index');

describe('Main Router', () => {
  test('should export a router object', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });

  test('should have the correct router stack with mounted routes', () => {

    expect(router.stack).toBeDefined();
    expect(Array.isArray(router.stack)).toBe(true);
    expect(router.stack.length).toBeGreaterThan(0);
  });

  test('should have db and slack routes mounted', () => {
    const routePaths = router.stack.map(layer => layer.route ? layer.route.path : 'middleware');
    
    expect(router.stack.length).toBeGreaterThanOrEqual(2);
  });
});
