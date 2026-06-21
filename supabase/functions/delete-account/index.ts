// ─────────────────────────────────────────────────────────────────────────
// delete-account — ลบบัญชีผู้ใช้ถาวร (ต้องใช้ service_role จึงทำฝั่ง server)
// ----------------------------------------------------------------------------
// client (anon key) ลบ auth user เองไม่ได้ — เรียกฟังก์ชันนี้แทน
// ขั้นตอน: อ่าน JWT ของผู้เรียก → หา user id → ใช้ service_role ลบ user
//          (profiles + scans + ... ลบตามด้วย ON DELETE CASCADE ใน schema)
//
// deploy:  supabase functions deploy delete-account
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
// Supabase ใส่ให้อัตโนมัติใน Edge Function (ไม่ต้องตั้งเอง)
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'ไม่มีสิทธิ์' }), { status: 401 });
    }

    // client ที่ผูก JWT ของผู้ใช้ → ใช้ดึง user id ของคนที่เรียก
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'ผู้ใช้ไม่ถูกต้อง' }), { status: 401 });
    }

    // client สิทธิ์ service_role → ลบ auth user จริง (profiles ลบตามด้วย cascade)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
