import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = login(password);
    
    if (success) {
      onLoginSuccess();
    } else {
      setError('Invalid password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <Card className="w-full max-w-md glass-effect border-gray-600">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="w-12 h-12 text-royal-500" />
          </div>
          <CardTitle className="text-2xl text-white">Admin Access</CardTitle>
          <p className="text-gray-400">Enter password to access admin dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-royal-500 hover:bg-royal-600 text-white"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              For demo purposes, password is: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 