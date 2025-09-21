'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { auth, profile, preferences, UserProfile, UserPreferences } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userPreferences: UserPreferences | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (currentUser: User) => {
    try {
      // プロフィール取得
      const profileData = await profile.get(currentUser.id);
      setUserProfile(profileData);

      // 設定取得または作成
      let preferencesData = await preferences.get(currentUser.id);
      if (!preferencesData) {
        preferencesData = await preferences.createDefault(currentUser.id);
      }
      setUserPreferences(preferencesData);

      // Analytics: ユーザーログイン追跡
      trackEvent({
        name: 'User Login',
        properties: {
          user_id: currentUser.id,
          email: currentUser.email,
          has_profile: !!profileData,
        },
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const clearUserData = () => {
    setUser(null);
    setUserProfile(null);
    setUserPreferences(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = await profile.get(user.id);
      setUserProfile(profileData);
      
      const preferencesData = await preferences.get(user.id);
      setUserPreferences(preferencesData);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  useEffect(() => {
    // 初期認証状態チェック
    auth.getCurrentUser().then((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserData(currentUser);
      }
      setLoading(false);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        clearUserData();
        
        trackEvent({
          name: 'User Logout',
          properties: {},
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await auth.signIn(email, password);
      
      trackEvent({
        name: 'User Sign In Attempt',
        properties: {
          method: 'email',
          success: true,
        },
      });
    } catch (error) {
      trackEvent({
        name: 'User Sign In Attempt',
        properties: {
          method: 'email',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      await auth.signUp(email, password, fullName);
      
      trackEvent({
        name: 'User Sign Up Attempt',
        properties: {
          method: 'email',
          success: true,
          has_full_name: !!fullName,
        },
      });
    } catch (error) {
      trackEvent({
        name: 'User Sign Up Attempt',
        properties: {
          method: 'email',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await auth.signInWithGoogle();
      
      trackEvent({
        name: 'User Sign In Attempt',
        properties: {
          method: 'google',
          success: true,
        },
      });
    } catch (error) {
      trackEvent({
        name: 'User Sign In Attempt',
        properties: {
          method: 'google',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
      
      trackEvent({
        name: 'Password Reset Request',
        properties: {
          success: true,
        },
      });
    } catch (error) {
      trackEvent({
        name: 'Password Reset Request',
        properties: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedProfile = await profile.update(user.id, updates);
      setUserProfile(updatedProfile);
      
      trackEvent({
        name: 'Profile Update',
        properties: {
          user_id: user.id,
          fields_updated: Object.keys(updates),
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedPreferences = await preferences.update(user.id, updates);
      setUserPreferences(updatedPreferences);
      
      trackEvent({
        name: 'Preferences Update',
        properties: {
          user_id: user.id,
          fields_updated: Object.keys(updates),
        },
      });
    } catch (error) {
      console.error('Preferences update error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    userPreferences,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    updatePreferences,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}