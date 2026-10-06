import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { User, Achievement } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: (role: 'student' | 'admin') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserStats: (newXp: number, newLevel: number, levelUp: boolean, unlockedAchievements?: any[]) => void;
  activeLevelUp: { level: number; title: string } | null;
  dismissLevelUp: () => void;
  activeAchievement: Achievement | null;
  dismissAchievement: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('studyforge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeLevelUp, setActiveLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('studyforge_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Failed to refresh user:', err);
      localStorage.removeItem('studyforge_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { identifier: string; password: string }) => {
    const data = await api.login(credentials);
    localStorage.setItem('studyforge_token', data.token);
    setToken(data.token);
    setUser(data.user);

    if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
      setActiveAchievement(data.unlockedAchievements[0]);
    }
  };

  const register = async (formData: any) => {
    const data = await api.register(formData);
    localStorage.setItem('studyforge_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const demoLogin = async (role: 'student' | 'admin') => {
    const data = await api.demoLogin(role);
    localStorage.setItem('studyforge_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('studyforge_token');
    setToken(null);
    setUser(null);
  };

  const updateUserStats = (newXp: number, newLevel: number, levelUp: boolean, unlockedAchievements?: any[]) => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });

    if (levelUp) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
        });
      } catch (e) {}
      setActiveLevelUp({ level: newLevel, title: user?.levelInfo?.title || 'Scholar' });
    }

    if (unlockedAchievements && unlockedAchievements.length > 0) {
      setActiveAchievement(unlockedAchievements[0]);
    }
  };

  const dismissLevelUp = () => setActiveLevelUp(null);
  const dismissAchievement = () => setActiveAchievement(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        updateUserStats,
        activeLevelUp,
        dismissLevelUp,
        activeAchievement,
        dismissAchievement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
