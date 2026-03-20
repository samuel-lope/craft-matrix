import React, { useState } from 'react';
import { X, Lock, User, Loader2 } from 'lucide-react';
import Modal from './Modal';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { id: string, login: string }) => void;
};

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setLogin(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 32) setPassword(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password })
        });
        let data: any = {};
        try { data = await res.json(); } catch (e) { console.error('Parse err:', e); }
        
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        
        // Auto login after register
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password })
        });
        let loginData: any = {};
        try { loginData = await loginRes.json(); } catch (e) { console.error('Parse err:', e); }
        
        if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');
        
        onLoginSuccess(loginData.user);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password })
        });
        let data: any = {};
        try { data = await res.json(); } catch (e) { console.error('Parse err:', e); }
        
        if (!res.ok) throw new Error(data.error || 'Invalid credentials');
        
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Auth">
      <div className="space-y-6">
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'login' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'register' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Login ID</label>
            <div className="flex bg-black border border-neutral-800 focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
              <div className="flex items-center justify-center px-3 border-r border-neutral-800 bg-neutral-950">
                <User className="w-4 h-4 text-neutral-500" />
              </div>
              <input
                type="text"
                value={login}
                onChange={handleLoginChange}
                placeholder="Alphanumeric only"
                className="w-full h-10 px-3 bg-transparent text-[10px] font-bold text-neutral-200 outline-none uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Password</label>
            <div className="flex bg-black border border-neutral-800 focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
              <div className="flex items-center justify-center px-3 border-r border-neutral-800 bg-neutral-950">
                <Lock className="w-4 h-4 text-neutral-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Max 32 chars"
                className="w-full h-10 px-3 bg-transparent text-[10px] font-bold text-neutral-200 outline-none tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 border border-rose-900/50 bg-rose-500/10 text-rose-400 text-[10px] font-bold tracking-widest uppercase rounded-sm text-center">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !login || !password}
              className="w-full py-3 btn-primary flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : activeTab === 'register' ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
