import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  token?: string;
}

interface AuthCtx {
  user: User | null;
  googleLogin: (token: string) => Promise<boolean>; // Returns true if it's a new user needing role selection
  emailLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  googleLogin: async () => false,
  emailLogin: async () => false,
  logout: () => { },
});

export function useAuthProvider(): AuthCtx {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('agrovision_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('agrovision_user', JSON.stringify(user));
    else localStorage.removeItem('agrovision_user');
  }, [user]);

  return {
    user,
    googleLogin: async (token: string) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Google Login failed');

        setUser(data);
        return data.isNewUser || false;
      } catch (error) {
        console.error('Google Login error:', error);
        throw error;
      }
    },
    emailLogin: async (email: string, password: string) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        setUser(data);
        return data.isNewUser || false;
      } catch (error) {
        console.error('Email Login error:', error);
        throw error;
      }
    },
    logout: () => setUser(null),
  };
}

export const useAuth = () => useContext(AuthContext);
