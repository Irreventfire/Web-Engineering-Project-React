import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { UserRole } from '../types';

// Test component that displays auth state
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isViewer, canEdit, login, logout, hasRole } = useAuth();
  
  return (
    <div>
      <span data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</span>
      <span data-testid="isAdmin">{isAdmin ? 'true' : 'false'}</span>
      <span data-testid="isViewer">{isViewer ? 'true' : 'false'}</span>
      <span data-testid="canEdit">{canEdit ? 'true' : 'false'}</span>
      <span data-testid="username">{user?.username || 'none'}</span>
      <span data-testid="hasAdminRole">{hasRole(UserRole.ADMIN) ? 'true' : 'false'}</span>
      <span data-testid="hasUserRole">{hasRole(UserRole.USER) ? 'true' : 'false'}</span>
      <button 
        data-testid="loginAdmin"
        onClick={() => login({ id: 1, username: 'admin', email: 'admin@test.com', role: UserRole.ADMIN, enabled: true })}
      >
        Login Admin
      </button>
      <button 
        data-testid="loginUser"
        onClick={() => login({ id: 2, username: 'user', email: 'user@test.com', role: UserRole.USER, enabled: true })}
      >
        Login User
      </button>
      <button 
        data-testid="loginViewer"
        onClick={() => login({ id: 3, username: 'viewer', email: 'viewer@test.com', role: UserRole.VIEWER, enabled: true })}
      >
        Login Viewer
      </button>
      <button data-testid="logout" onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initial state is not authenticated', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  test('login sets user and authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginAdmin'));
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('admin');
  });

  test('admin has all roles', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginAdmin'));
    });
    
    expect(screen.getByTestId('hasAdminRole')).toHaveTextContent('true');
    expect(screen.getByTestId('hasUserRole')).toHaveTextContent('true');
  });

  test('regular user does not have admin role', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginUser'));
    });
    
    expect(screen.getByTestId('hasAdminRole')).toHaveTextContent('false');
    expect(screen.getByTestId('hasUserRole')).toHaveTextContent('true');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
    expect(screen.getByTestId('canEdit')).toHaveTextContent('true');
  });

  test('viewer cannot edit', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginViewer'));
    });
    
    expect(screen.getByTestId('isViewer')).toHaveTextContent('true');
    expect(screen.getByTestId('canEdit')).toHaveTextContent('false');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
    expect(screen.getByTestId('hasAdminRole')).toHaveTextContent('false');
    expect(screen.getByTestId('hasUserRole')).toHaveTextContent('false');
  });

  test('admin can edit', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginAdmin'));
    });
    
    expect(screen.getByTestId('canEdit')).toHaveTextContent('true');
    expect(screen.getByTestId('isViewer')).toHaveTextContent('false');
  });

  test('logout clears user state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginAdmin'));
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    
    act(() => {
      fireEvent.click(screen.getByTestId('logout'));
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  test('persists user to localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('loginAdmin'));
    });
    
    const storedUser = localStorage.getItem('user');
    expect(storedUser).not.toBeNull();
    const parsed = JSON.parse(storedUser!);
    expect(parsed.username).toBe('admin');
    expect(parsed.role).toBe('ADMIN');
  });
});
