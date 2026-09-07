import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth?action=user', { credentials: 'include' })
      .then(res => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        return true;
      }
      if (res.status === 401) return false;
      if (res.status === 429) throw new Error('Too many login attempts. Please wait a few minutes and try again.');
      throw new Error('Sign-in is temporarily unavailable. Please try again shortly.');
    } catch (error) {
      if (error instanceof TypeError) throw new Error('Could not connect. Check your connection and try again.');
      throw error;
    }
  };

  const logout = async () => {
    const res = await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' });
    if (res.ok) window.location.href = '/';
  };

  return { isAuthenticated, isLoading, login, logout };
}
