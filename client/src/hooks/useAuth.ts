import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    setIsAuthenticated(isAuth);
    setIsLoading(false);
  }, []);

  const login = (password: string) => {
    // Simple password check - in production, use proper authentication
    const correctPassword = 'admin123'; // Change this to your desired password
    
    if (password === correctPassword) {
      localStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
}
