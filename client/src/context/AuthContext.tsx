import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { AuthContext } from './auth';
import type { User } from './auth';
import { apiUrl } from '../lib/api';

async function readError(response: Response) {
  try {
    const data = await response.json();
    return data.error || data.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status}). Please try again.`;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/user'), { credentials: 'include' });
        if (res.status === 401) return;
        if (!res.ok) throw new Error(await readError(res));
        setUser(await res.json());
      } catch (e) {
        console.error('Failed to fetch user', e);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Cannot reach the ScamSense API. Check that the server is running and try again.');
    }
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    let res: Response;
    try {
      res = await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    } catch {
      throw new Error('Cannot reach the ScamSense API. Check that the server is running and try again.');
    }
    if (!res.ok) throw new Error(await readError(res));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
