'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const BUCKET = 'shop';
const SLOTS = ['hat', 'outfit', 'glasses', 'accessory'];
const SLOT_TH = { hat: 'หมวก', outfit: 'ชุด', glasses: 'แว่น', accessory: 'เครื่องประดับ' };
const RARITIES = ['common', 'rare', 'epic'];
const RARITY_COLOR = { common: '#9AA7B5', rare: '#3A8FE8', epic: '#A24DD0' };
const RARITY_TH = { common: 'ธรรมดา', rare: 'หายาก', epic: 'เอพิค' };

// เฟรม sheet = 150×178 (สูงกว่ากว้างเพื่อเว้นหัวใส่หมวก) × 3 เฟรม = 450×178
const FRAME_W = 150;
const FRAME_H = 178;

const EMPTY = {
  id: '', name_th: '', slot: 'hat', price: 0, rarity: 'common',
  is_new: false, is_active: true, sort_order: 0, icon_path: null, sheet_path: null,
};

function publicUrl(path, bust) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return bust ? `${data.publicUrl}?t=${bust}` : data.publicUrl;
}

// อ่านขนาดรูปฝั่ง browser เพื่อเตือน (ไม่บล็อก) ถ้าไม่ตรงสเปก
function checkDims(file, kind) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      let warn = '';
      if (kind === 'icon' && w !== h) warn = `⚠ ไอคอนควรเป็นจัตุรัส (แนะนำ 256×256) ตอนนี้ ${w}×${h}`;
      if (kind === 'sheet' && w !== Math.round(h * FRAME_W / FRAME_H) * 3)
        warn = `⚠ sheet ควรเป็น 3 เฟรม × ${FRAME_W}×${FRAME_H} (เช่น 450×178) ตอนนี้ ${w}×${h}`;
      resolve(warn);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
    img.src = url;
  });
}

export default function Page() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [sheetFile, setSheetFile] = useState(null);
  const [iconWarn, setIconWarn] = useState('');
  const [sheetWarn, setSheetWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);          // { text, err }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toast = (text, err = false) => setMsg({ text, err });
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    (async () => {
      const { data } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single();
      setIsAdmin(!!data?.is_admin);
    })();
  }, [session]);

  useEffect(() => { if (isAdmin) loadItems(); }, [isAdmin]);

  async function loadItems() {
    const { data, error } = await supabase.from('shop_items').select('*').order('sort_order');
    if (error) toast('โหลดรายการไม่สำเร็จ: ' + error.message, true);
    else setItems(data ?? []);
  }

  async function login(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) toast(error.message, true);
  }

  const isEditing = (f) => f && items.some((i) => i.id === f.id);

  function openNew() {
    setForm({ ...EMPTY });
    setIconFile(null); setSheetFile(null); setIconWarn(''); setSheetWarn('');
  }
  function openEdit(item) {
    setForm({ ...item });
    setIconFile(null); setSheetFile(null); setIconWarn(''); setSheetWarn('');
  }

  async function onPickIcon(file) {
    setIconFile(file);
    setIconWarn(file ? await checkDims(file, 'icon') : '');
  }
  async function onPickSheet(file) {
    setSheetFile(file);
    setSheetWarn(file ? await checkDims(file, 'sheet') : '');
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = form.id.trim();
      if (!id) throw new Error('ต้องระบุ id (เช่น hat_santa)');
      if (!/^[a-z0-9_]+$/.test(id)) throw new Error('id ใช้ได้แค่ a-z, 0-9, _ (ตัวเล็ก)');
      if (!form.name_th.trim()) throw new Error('ต้องระบุชื่อ');

      let { icon_path, sheet_path } = form;
      if (iconFile) {
        icon_path = `icons/${id}.png`;
        const { error } = await supabase.storage.from(BUCKET)
          .upload(icon_path, iconFile, { upsert: true, contentType: 'image/png' });
        if (error) throw error;
      }
      if (sheetFile) {
        sheet_path = `sheets/${id}.png`;
        const { error } = await supabase.storage.from(BUCKET)
          .upload(sheet_path, sheetFile, { upsert: true, contentType: 'image/png' });
        if (error) throw error;
      }

      const row = {
        id, name_th: form.name_th.trim(), slot: form.slot,
        price: Number(form.price) || 0, rarity: form.rarity,
        is_new: !!form.is_new, is_active: !!form.is_active,
        sort_order: Number(form.sort_order) || 0, icon_path, sheet_path,
      };
      const { error } = await supabase.from('shop_items').upsert(row);
      if (error) throw error;

      toast('บันทึกแล้ว ✓');
      setForm(null);
      loadItems();
    } catch (err) {
      toast('ผิดพลาด: ' + (err.message ?? String(err)), true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!confirm(`ลบ "${item.name_th}" ?\n(รูปใน Storage ไม่ถูกลบอัตโนมัติ)`)) return;
    const { error } = await supabase.from('shop_items').delete().eq('id', item.id);
    if (error) toast('ลบไม่สำเร็จ: ' + error.message, true);
    else { setForm(null); loadItems(); toast('ลบแล้ว'); }
  }

  const Brand = () => (
    <div className="brand">
      <div className="brand-mark">🛍️</div>
      <div className="brand-title">Shop Admin<small>เราสงสัย.exe</small></div>
    </div>
  );
  const Toast = () => msg && <div className={`toast ${msg.err ? 'err' : ''}`}>{msg.text}</div>;

  // ── login ──
  if (!session) {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={login}>
          <Brand />
          <h2>เข้าสู่ระบบ</h2>
          <div className="field"><label>อีเมล</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field"><label>รหัสผ่าน</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="submit">เข้าสู่ระบบ</button>
          </div>
        </form>
        <Toast />
      </div>
    );
  }

  if (isAdmin === null) return <div className="center-note"><p className="muted">กำลังตรวจสอบสิทธิ์…</p></div>;

  if (isAdmin === false) {
    return (
      <>
        <div className="topbar"><div className="topbar-inner"><Brand />
          <button className="btn btn--ghost btn--sm" onClick={() => supabase.auth.signOut()}>ออกจากระบบ</button>
        </div></div>
        <div className="container">
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>บัญชีนี้ไม่ใช่ admin</h2>
            <p className="muted">{session.user.email} ยังไม่มีสิทธิ์จัดการร้านค้า</p>
            <p className="muted" style={{ fontSize: 13 }}>ตั้งสิทธิ์ใน Supabase:</p>
            <code style={{ display: 'block', background: '#f1e9d8', padding: '10px 12px', borderRadius: 8, fontSize: 12.5 }}>
              update profiles set is_admin = true where id = '{session.user.id}';
            </code>
          </div>
        </div>
        <Toast />
      </>
    );
  }

  // ── หน้าจัดการ ──
  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <Brand />
          <div className="userchip">
            {session.user.email}
            <button className="btn btn--ghost btn--sm" onClick={() => supabase.auth.signOut()}>ออก</button>
          </div>
        </div>
      </div>

      <div className="container">
        {!form && (
          <>
            <div className="toolbar">
              <h2>ไอเทมในร้าน <span className="count">· {items.length} ชิ้น</span></h2>
              <button className="btn btn--green" onClick={openNew}>＋ เพิ่มของใหม่</button>
            </div>

            {items.length === 0 ? (
              <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)' }}>
                ยังไม่มีไอเทม — กด “เพิ่มของใหม่” เพื่อเริ่ม
              </div>
            ) : (
              <div className="grid">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className={`card-item ${it.is_active ? '' : 'off'}`}
                    style={{ '--rarity': RARITY_COLOR[it.rarity] ?? '#ccc' }}
                    onClick={() => openEdit(it)}
                  >
                    <div className="thumb-wrap">
                      {it.icon_path
                        ? <img className="thumb" src={publicUrl(it.icon_path)} alt={it.name_th} />
                        : <span className="thumb-empty">ไม่มีรูป</span>}
                    </div>
                    <div className="item-name">{it.name_th}</div>
                    <div className="item-meta">{SLOT_TH[it.slot] ?? it.slot} · {it.price}★</div>
                    <div className="pills">
                      <span className="pill" style={{ background: RARITY_COLOR[it.rarity] ?? '#999' }}>
                        {RARITY_TH[it.rarity] ?? it.rarity}
                      </span>
                      {it.is_new && <span className="pill pill--new">NEW</span>}
                      <span className={`pill ${it.sheet_path ? 'pill--ok' : 'pill--soft'}`}>
                        {it.sheet_path ? '✓ sheet' : 'ยังไม่มี sheet'}
                      </span>
                      {!it.is_active && <span className="pill pill--soft">ปิดขาย</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {form && (
          <div className="panel">
            <div className="panel-head">
              <button className="btn btn--ghost btn--sm" onClick={() => setForm(null)}>← กลับ</button>
              <h2>{isEditing(form) ? `แก้ไข: ${form.id}` : 'เพิ่มของใหม่'}</h2>
            </div>
            <p className="panel-sub">รูปจะถูกอัปไป Storage และจัด path ให้อัตโนมัติ (icons/{form.id || 'id'}.png)</p>

            <form onSubmit={save}>
              <div className="grid2">
                <div className="field">
                  <label>id {isEditing(form) ? '(ล็อกแล้ว)' : '· a-z 0-9 _'}</label>
                  <input type="text" value={form.id} disabled={isEditing(form)} placeholder="hat_santa"
                    onChange={(e) => setForm({ ...form, id: e.target.value })} />
                </div>
                <div className="field">
                  <label>ชื่อ (ไทย)</label>
                  <input type="text" value={form.name_th} placeholder="หมวกซานต้า"
                    onChange={(e) => setForm({ ...form, name_th: e.target.value })} />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>ช่อง (slot)</label>
                  <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
                    {SLOTS.map((s) => <option key={s} value={s}>{SLOT_TH[s]} ({s})</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>ความหายาก</label>
                  <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
                    {RARITIES.map((r) => <option key={r} value={r}>{RARITY_TH[r]} ({r})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <label>ราคา (ดาว)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="field">
                  <label>ลำดับการแสดง (น้อย = ก่อน)</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
              </div>

              <div className="checks">
                <label className="check">
                  <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} />
                  ป้าย NEW
                </label>
                <label className="check">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  เปิดขาย
                </label>
              </div>

              <div className="uploads">
                <div className="dz">
                  <div className="dz-title">ไอคอน (โชว์ในช่อง)</div>
                  <div className="dz-spec">256×256 px · PNG พื้นใส</div>
                  <div className="dz-preview" style={{ width: 96, height: 96 }}>
                    {(iconFile || form.icon_path)
                      ? <img src={iconFile ? URL.createObjectURL(iconFile) : publicUrl(form.icon_path, 1)} alt="" />
                      : <span className="thumb-empty">—</span>}
                  </div>
                  <input type="file" accept="image/png" onChange={(e) => onPickIcon(e.target.files?.[0] ?? null)} />
                  {iconWarn && <div className="warn">{iconWarn}</div>}
                </div>

                <div className="dz">
                  <div className="dz-title">sheet ติดตัวแมว (ใส่ทีหลังได้)</div>
                  <div className="dz-spec">450×178 px (3 เฟรม × 150×178) · วาดเฉพาะของชิ้นนี้ พื้นโปร่งใส (ซ้อนทับบนแมว ไม่ต้องวาดตัวแมว)</div>
                  <div className="dz-preview" style={{ width: 180, height: 71 }}>
                    {(sheetFile || form.sheet_path)
                      ? <img src={sheetFile ? URL.createObjectURL(sheetFile) : publicUrl(form.sheet_path, 1)} alt="" />
                      : <span className="thumb-empty">—</span>}
                  </div>
                  <input type="file" accept="image/png" onChange={(e) => onPickSheet(e.target.files?.[0] ?? null)} />
                  {sheetWarn && <div className="warn">{sheetWarn}</div>}
                </div>
              </div>

              <div className="actions">
                <button className="btn btn--green" type="submit" disabled={busy}>{busy ? 'กำลังบันทึก…' : '💾 บันทึก'}</button>
                <button className="btn btn--ghost" type="button" onClick={() => setForm(null)}>ยกเลิก</button>
                {isEditing(form) && (
                  <button className="btn btn--danger" type="button" onClick={() => remove(form)} style={{ marginLeft: 'auto' }}>ลบ</button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      <Toast />
    </>
  );
}
