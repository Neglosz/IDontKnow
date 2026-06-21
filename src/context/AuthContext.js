import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { localDateStr, nextStreak, dailyReward } from '../data/streak';

const AuthContext = createContext(null);

// key ของ cache profile ใน AsyncStorage (แยกตาม user)
const profileCacheKey = (uid) => `@profile:${uid}`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // new user = ล็อกอินแล้วแต่ยังไม่ได้ตั้งชื่อตัวละคร (profile.character_name = null)
  const [isNewUser, setIsNewUser] = useState(false);

  // เก็บ profile ล่าสุดไว้ใน ref ด้วย — ฟังก์ชัน award/spend อ่านค่าปัจจุบันได้
  // โดยไม่ติด stale closure และไม่ต้องผูก dependency กับ profile
  const profileRef = useRef(null);

  // set profile ที่เดียว: อัปเดต state + ref + new-user flag + cache ลง AsyncStorage
  const applyProfile = useCallback((data) => {
    profileRef.current = data ?? null;
    setProfile(data ?? null);
    setIsNewUser(!data?.character_name);
    if (data?.id) {
      AsyncStorage.setItem(profileCacheKey(data.id), JSON.stringify(data)).catch(() => {});
    }
  }, []);

  // โหลด profile ของผู้ใช้ปัจจุบัน — โชว์ค่าจาก cache ก่อน (ทันที/ออฟไลน์ได้)
  // แล้วค่อย sync ของจริงจาก Supabase ทับ
  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      profileRef.current = null;
      setProfile(null);
      setIsNewUser(false);
      return;
    }
    // 1) cache ก่อน — ไม่ให้จอกระพริบ/รองรับเปิดแอปตอนเน็ตหลุด
    try {
      const cached = await AsyncStorage.getItem(profileCacheKey(uid));
      if (cached) applyProfile(JSON.parse(cached));
    } catch {}
    // 2) ของจริงจาก server (ถ้าต่อเน็ตได้)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (!error && data) applyProfile(data);
  }, [applyProfile]);

  // patch profiles + ตอบกลับ row ใหม่ (helper กลางของ award/spend/streak)
  const patchProfile = useCallback(async (patch) => {
    const uid = user?.id;
    if (!uid) return { error: 'ยังไม่ได้เข้าสู่ระบบ' };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', uid)
      .select()
      .single();
    if (error) return { error: error.message };
    applyProfile(data);
    return { profile: data };
  }, [user, applyProfile]);

  // ── ECONOMY ───────────────────────────────────────────────────────────────
  // บันทึก "วันนี้มาเรียนแล้ว" → อัปเดต streak + แจกโบนัสดาวถ้าแตะหลักไมล์
  // idempotent ต่อวัน (กันด้วย last_active_date) เรียกซ้ำในวันเดียวกันไม่มีผล
  const recordDailyActivity = useCallback(async () => {
    const p = profileRef.current;
    if (!p) return { error: 'ยังไม่มีโปรไฟล์' };
    const today = localDateStr();
    if (p.last_active_date === today) {
      return { counted: false, streak: p.current_streak ?? 0, reward: 0 };
    }
    const { streak } = nextStreak(
      { lastActiveDate: p.last_active_date, currentStreak: p.current_streak ?? 0 },
      today,
    );
    const reward = dailyReward(streak);   // +1 ทุกวัน + โบนัสหลักไมล์
    const res = await patchProfile({
      current_streak: streak,
      best_streak: Math.max(p.best_streak ?? 0, streak),
      last_active_date: today,
      total_stars: (p.total_stars ?? 0) + reward,
    });
    if (res.error) return res;
    return { counted: true, streak, reward };
  }, [patchProfile]);

  // บวกดาว (เล่นจบ node / boss bonus) — reason เก็บไว้เผื่อ log ภายหลัง
  const awardStars = useCallback(async (delta, _reason = 'quiz') => {
    if (!delta) return { profile: profileRef.current };
    const current = profileRef.current?.total_stars ?? 0;
    return patchProfile({ total_stars: Math.max(0, current + delta) });
  }, [patchProfile]);

  // หักดาว (ซื้อของในร้าน) — กันยอดติดลบ
  const spendStars = useCallback(async (amount) => {
    const current = profileRef.current?.total_stars ?? 0;
    if (amount > current) return { error: 'ดาวไม่พอ', balance: current };
    const res = await patchProfile({ total_stars: current - amount });
    if (res.error) return res;
    return { ...res, balance: current - amount };
  }, [patchProfile]);

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
    profileRef.current = null;
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
    applyProfile(data);
    return { profile: data };
  }, [user, applyProfile]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if(!user?.email) return {error: 'ยังไม่ได้เข้าสู่ระบบ'};
    const {error: reauthErr} = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if(reauthErr) return {error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'};
    const {error} = await supabase.auth.updateUser({password: newPassword});
    if(error) return{error: mapAuthError(error)};
    return{ok:true}
  }, [user]);

  const deleteAccount = useCallback(async (currentPassword) => {
    if(!user?.email) return {error: 'ยังไม่ได้เข้าสู่ระบบ'};
    const {error: reauthErr} = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if(reauthErr) return {error: 'รหัสผ่านไม่ถูกต้อง'};
    const {error} = await supabase.functions.invoke('delete-account');
    if(error) return {error:error.message};
    await signOut();
    return {ok:true};
  }, [user, signOut]);


  const clearNewUser = useCallback(() => setIsNewUser(false), []);

  const value = {
    user,
    profile,
    loading,
    isNewUser,
    characterName: profile?.character_name ?? '',
    // ── ตัวเลข economy ที่จอใช้บ่อย (อ่านง่าย ไม่ต้องแกะ profile เอง) ──
    stars: profile?.total_stars ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    bestStreak: profile?.best_streak ?? 0,
    lastActiveDate: profile?.last_active_date ?? null,
    signIn,
    signUp,
    signOut,
    setCharacterName,
    changePassword,
    deleteAccount,
    clearNewUser,
    refreshProfile: () => loadProfile(user?.id),
    // ── การกระทำกับดาว/streak (เขียนทะลุไป Supabase + cache) ──
    recordDailyActivity,
    awardStars,
    spendStars,
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
