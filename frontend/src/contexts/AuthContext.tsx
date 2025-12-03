import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user && user.enabled;
  const isAdmin = user?.role === UserRole.ADMIN;

  /**
   * Check if the current user has access to a given role level.
   * Role hierarchy: ADMIN > USER > VIEWER
   * - ADMIN has access to all roles
   * - USER has access to USER and VIEWER roles
   * - VIEWER has access to VIEWER role only
   */
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    // ADMIN has all permissions
    if (user.role === UserRole.ADMIN) return true;
    // USER has USER and VIEWER permissions
    if (user.role === UserRole.USER && role !== UserRole.ADMIN) return true;
    // VIEWER only has VIEWER permission
    return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
