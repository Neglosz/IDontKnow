import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // new user = ล็อกอินแล้วแต่ยังไม่ได้ตั้งชื่อตัวละคร (profile.character_name = null)
  const [isNewUser, setIsNewUser] = useState(false);

  // โหลด profile ของผู้ใช้ปัจจุบัน
  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setIsNewUser(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    setProfile(data ?? null);
    setIsNewUser(!data?.character_name);
  }, []);

  // ติดตามสถานะ session (รวมตอนเปิดแอปครั้งแรก + เปลี่ยนแปลงภายหลัง)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user?.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        await loadProfile(session?.user?.id);
      }
    );
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: mapAuthError(error) };
    return { user: data.user };
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: mapAuthError(error) };
    // ถ้า Supabase เปิด "ยืนยันอีเมล" จะยังไม่มี session ทันที
    if (!data.session) return { user: data.user, needsConfirmation: true };
    return { user: data.user };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsNewUser(false);
  }, []);

  // บันทึกชื่อตัวละครลง profiles (ใช้ในหน้า CreateCharacter)
  const setCharacterName = useCallback(async (name) => {
    if (!user) return { error: 'ยังไม่ได้เข้าสู่ระบบ' };
    const { data, error } = await supabase
      .from('profiles')
      .update({ character_name: name, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) return { error: error.message };
    setProfile(data);
    return { profile: data };
  }, [user]);

  const clearNewUser = useCallback(() => setIsNewUser(false), []);

  const value = {
    user,
    profile,
    loading,
    isNewUser,
    characterName: profile?.character_name ?? '',
    signIn,
    signUp,
    signOut,
    setCharacterName,
    clearNewUser,
    refreshProfile: () => loadProfile(user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// แปลข้อความ error ของ Supabase เป็นภาษาไทยที่ผู้ใช้เข้าใจ
function mapAuthError(error) {
  const m = (error?.message ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'อีเมลนี้ถูกใช้งานแล้ว';
  if (m.includes('password')) return 'รหัสผ่านไม่ถูกต้อง (อย่างน้อย 6 ตัวอักษร)';
  if (m.includes('email')) return 'อีเมลไม่ถูกต้อง';
  return error?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}
