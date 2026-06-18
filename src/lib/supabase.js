// ─────────────────────────────────────────────────────────────────────────
// Supabase client (React Native / Expo)
// ----------------------------------------------------------------------------
// คีย์อ่านจาก env (EXPO_PUBLIC_*) — ดู .env.example
// session เก็บใน AsyncStorage ตามคู่มือ Supabase Expo (รองรับ JWT ขนาดใหญ่)
// ⚠️ anon key เป็น public key ได้ (ปลอดภัยเพราะมี RLS) — ห้ามใส่ service_role
//    หรือ GEMINI_API_KEY ในแอป เด็ดขาด ให้ไว้ฝั่ง Edge Function เท่านั้น
// ─────────────────────────────────────────────────────────────────────────
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] ไม่พบ EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — ' +
    'คัดลอก .env.example เป็น .env แล้วใส่ค่าจาก Supabase dashboard'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // ปิดสำหรับ mobile (ไม่มี URL callback)
  },
});
