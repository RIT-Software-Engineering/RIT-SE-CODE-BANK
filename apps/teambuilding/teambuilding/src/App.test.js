import { render, screen } from '@testing-library/react';
import App from './App';
import Manager_page from './manager_page';

test('renders learn react link', () => {
  render(<Manager_page />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
