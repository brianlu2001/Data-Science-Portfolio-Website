import { useState, useEffect } from 'react';

// Simple hash function for client-side (not truly secure, but better than plaintext)
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'data_science_portfolio_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    console.log('Auth check:', { isAuth, localStorage: localStorage.getItem('admin_authenticated') });
    setIsAuthenticated(isAuth);
    setIsLoading(false);
  }, []);

  const login = async (password: string) => {
    try {
      console.log('Login attempt with password length:', password.length);
      // Hash the provided password
      const hashedPassword = await simpleHash(password);
      console.log('Generated hash:', hashedPassword);
      
      // Pre-computed hash of "Dance39850175_" with salt
      const correctPasswordHash = '242840155af0b55f51a3ce04af122191d537f6a39a71a4e6b894d52228def094';
      console.log('Expected hash:', correctPasswordHash);
      
      if (hashedPassword === correctPasswordHash) {
        console.log('Password correct, setting authentication');
        localStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('Password incorrect');
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out');
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
