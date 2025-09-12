// Test for Users page component
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUsersPage from '../../src/app/Users/page';

/*
* jest.mock replaces the actual useAuth function with a mock function. With an admin user role, the component should render the Access Denied message.
* user: { role: 'ADMIN' }: This is the mock user object that is returned by the useAuth function.
* loading: false: This is the mock loading state that is returned by the useAuth function.
*/
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'ADMIN' },
    loading: false
  })
}));

/*
* jest.mock replaces the actual API calls with mock functions.
* getAllUsers: This mock function returns an empty array.
* getUserProfile: This mock function returns an empty object.
* jest.fn(): This creates a mock function. 
* Promise.resolve(): This resolves the promise with the specified value.
* [] and {} are the values that the mock functions return.
*/
jest.mock('../../src/services/db-apis', () => ({
  getAllUsers: jest.fn(() => Promise.resolve([])),
  getUserProfile: jest.fn(() => Promise.resolve({}))
}));

/*
* Describe is used to group related tests together.
* Test is used to define a single test case.
* Expect is used to assert that a condition is true.
* ToBeInTheDocument is used to check if an element is in the document.
* Screen.getByText is used to get the element by its text content.
* Screen is an object that contains the query methods to find elements in the document.
*
*/

describe('Users Page', () => {
  test('should render Access Denied message', () => {
    render(<AdminUsersPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
