import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';

export default function Login() {
  const { login, loginLoading } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Login failed', description: err.response?.data?.message || 'Invalid credentials', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trikara</h1>
            <p className="text-gray-400 text-xs">Agency Portal</p>
          </div>
        </div>

        <Card className="border-gray-700 bg-gray-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-center">Sign in</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@trikara.dev"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={loginLoading}>
                {loginLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-gray-800/50 rounded-md">
              <p className="text-xs text-gray-400 font-medium mb-2">Demo credentials</p>
              <div className="space-y-1">
                {[
                  ['Superadmin', 'admin@trikara.dev'],
                  ['PM', 'priya@trikara.dev'],
                  ['Developer', 'karthik@trikara.dev'],
                  ['BDE', 'rahul@trikara.dev'],
                ].map(([role, email]) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setForm({ email, password: role === 'Superadmin' ? 'Admin@123' : 'Test@123' })}
                    className="block w-full text-left text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {role}: {email}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
