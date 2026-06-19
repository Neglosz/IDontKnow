// ============================================================================
//  PROGRESS — เก็บ "mastery" (concept ที่ผู้เล่นรู้แล้ว) แบบ store กลาง
// ----------------------------------------------------------------------------
//  อยู่รอดข้ามหน้าจอ (App.js mount/unmount แต่ละ screen) ต่างจาก useState ในจอ
//  ตอนนี้เก็บ in-memory — ภายหลังเปลี่ยนเป็น AsyncStorage/Supabase ได้ที่ไฟล์นี้
//  ที่เดียว โดยไม่ต้องแตะหน้าจอ (แพทเทิร์นเดียวกับ Tracker ใน simEngine.js)
//
//  เติม mastery ได้ 2 ทาง:
//    • calibration ผ่าน  → Progress.learn(concepts)   (B: CalibrateScreen)
//    • เล่นจบ node       → Progress.learn(node.teaches) (C: Game clear)
//  เมื่อ mastery เปลี่ยน → computeStatus/computeTiers ใน SkillTree คำนวณใหม่
// ============================================================================
import { useEffect, useState } from 'react';

const _mastery = new Set();
const _listeners = new Set();
const _emit = () => _listeners.forEach(fn => fn());

let _calibration = null;   // คะแนน calibration 0–100 (null = ยังไม่ได้ทำ)
let _streakDays = 0;       // จำนวนวันเรียนติดต่อกัน
let _lastDay = null;       // วันล่าสุดที่เข้าเรียน (YYYY-MM-DD)
const _today = () => new Date().toISOString().slice(0, 10);

export const Progress = {
  // concept ที่รู้แล้วทั้งหมด (สำเนา กันแก้ตรง ๆ)
  all() { return new Set(_mastery); },
  has(concept) { return _mastery.has(concept); },

  // ── Calibration Score (20% ของ Level Score) ──
  setCalibration(pct) { _calibration = pct; },
  calibration() { return _calibration; },

  // ── Consistency Score (20%) — แปลง streak 0–10 วัน → % ตาม proposal ──
  touchStreak() {
    const today = _today();
    if (_lastDay === today) return;
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    _streakDays = _lastDay === yest ? _streakDays + 1 : 1;
    _lastDay = today;
  },
  streakDays() { return _streakDays; },
  consistencyScore() { return (Math.min(_streakDays, 10) / 10) * 100; },

  // ทำเครื่องหมายว่า "รู้แล้ว" — ใช้ทั้งตอน calibrate และเล่นจบ node
  learn(concepts = []) {
    let changed = false;
    concepts.forEach(c => { if (!_mastery.has(c)) { _mastery.add(c); changed = true; } });
    if (changed) _emit();
    return changed;
  },

  // ล้างทั้งหมด (เริ่ม calibration ใหม่ / ทดสอบ)
  reset() { _mastery.clear(); _calibration = null; _emit(); },

  subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); },
};

// hook ให้จอ re-render อัตโนมัติเมื่อ mastery เปลี่ยน
export function useMastery() {
  const [mastery, setMastery] = useState(() => Progress.all());
  useEffect(() => Progress.subscribe(() => setMastery(Progress.all())), []);
  return mastery;
}
