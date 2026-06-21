// ============================================================================
//  STREAK — ตรรกะ "ดาว/วันต่อเนื่อง" แบบบริสุทธิ์ (ไม่ผูกกับ React หรือ Supabase)
// ----------------------------------------------------------------------------
//  แยกจาก AuthContext เพื่อให้ทดสอบ/ใช้ซ้ำได้ และกัน import วนกัน
//  source of truth จริงคือ profiles ใน Supabase (เขียนผ่าน AuthContext)
//  ไฟล์นี้แค่ "คำนวณ" ว่า streak วันนี้ควรเป็นเท่าไร + โบนัสกี่ดาว
// ============================================================================

// โบนัสสะสมเมื่อ streak แตะหลักไมล์ (วัน → ดาวที่ได้ทันที)
// ใช้ทั้งหน้า ProfileScreen (แสดงผล) และตอนคำนวณรางวัล (AuthContext)
export const STREAK_BONUSES = [
  { day: 3,  reward: 2 },
  { day: 7,  reward: 5 },
  { day: 14, reward: 10 },
  { day: 30, reward: 25 },
];

// วันที่แบบ local (YYYY-MM-DD) — สำคัญ: ห้ามใช้ toISOString() ตรง ๆ เพราะเป็น UTC
// จะเพี้ยน 1 วันช่วงก่อน/หลังเที่ยงคืนตามโซนเวลาไทย (UTC+7)
export function localDateStr(d = new Date()) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// วันก่อนหน้า n วัน (default = เมื่อวาน) แบบ local
export function shiftDate(days, from = new Date()) {
  return localDateStr(new Date(from.getTime() + days * 86400000));
}

// โบนัสดาวเมื่อ streak = day (0 ถ้าไม่ใช่หลักไมล์)
export function streakBonusFor(day) {
  return STREAK_BONUSES.find(b => b.day === day)?.reward ?? 0;
}

// ดาวที่ได้เมื่อเช็คอินวันนั้น = +1 ทุกวัน บวกโบนัสหลักไมล์ (ตาม proposal หน้า 14)
//   เช่น วัน 3 = 1 + 2 = 3, วัน 7 = 1 + 5 = 6, วันธรรมดา = 1
export function dailyReward(day) {
  return 1 + streakBonusFor(day);
}

// คำนวณ streak ของวันนี้จากสถานะเดิม
//   - มาแล้ววันนี้      → counted:false (ไม่นับซ้ำ)
//   - ต่อจากเมื่อวาน     → +1
//   - ขาดเกิน 1 วัน      → reset เป็น 1
export function nextStreak({ lastActiveDate, currentStreak = 0 }, today = localDateStr()) {
  if (lastActiveDate === today) {
    return { streak: currentStreak, counted: false };
  }
  const yesterday = shiftDate(-1);
  const streak = lastActiveDate === yesterday ? currentStreak + 1 : 1;
  return { streak, counted: true };
}
