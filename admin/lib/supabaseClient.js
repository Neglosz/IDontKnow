import { createClient } from '@supabase/supabase-js';

// เว็บ admin เขียนผ่าน RLS (policy "admin manage shop" + storage admin)
// จึงใช้ anon key ได้ปลอดภัย — ไม่ใส่ service_role ใน browser เด็ดขาด
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
