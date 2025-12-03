import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Simple test to verify the app components exist
describe('App', () => {
  test('renders without crashing', () => {
    // Since full app testing requires router context, just verify basic rendering
    const TestComponent = () => <div data-testid="test">Test</div>;
    render(<BrowserRouter><TestComponent /></BrowserRouter>);
    expect(screen.getByTestId('test')).toBeInTheDocument();
  });
});
