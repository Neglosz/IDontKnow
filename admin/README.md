# เราสงสัย.exe — Shop Admin

เว็บจัดการไอเทมในร้านค้า (เพิ่ม/แก้/ลบ) เขียนลง `shop_items` + Storage `shop`
แยกจากแอป Expo สมบูรณ์ — เป็น Next.js project ของตัวเอง

## ขนาดรูป (สำคัญ — ส่งให้คนวาดตามนี้)

| ชนิด | ขนาด | หมายเหตุ |
|---|---|---|
| **Icon** (โชว์ในช่อง) | **256×256 px** จัตุรัส | PNG พื้นใส ทุกชิ้นต้องมี |
| **Cat sheet** (ติดตัวแมว) | **450×178 px** (3 เฟรม × 150×178 เรียงนอน) | **overlay โปร่งใส — วาดเฉพาะของชิ้นนั้น ไม่ต้องวาดตัวแมว** เพราะระบบเอาไป "ซ้อนทับ" บนแมว · ตำแหน่ง/ขนาดต้องตรงกับ `assets/player_cat-sheet_150.png` เป๊ะ (เปิดเป็น template วาดของทับ แล้วซ่อนเลเยอร์แมวตอน export) · ใส่ทีหลังได้ |

> เฟรมสูง 178 (ไม่ใช่ 150) = เว้นหัวด้านบน 28px ไว้ใส่หมวกไม่ให้ทะลุกรอบ — ลำตัวแมวอยู่ครึ่งล่าง
> ของหลายชิ้นซ้อนกันได้ (หมวก+แว่น+เสื้อ พร้อมกัน) เพราะแต่ละ sheet เป็น overlay โปร่งใส
> อยากคมบนจอ retina: วาด 2× = 900×356 px (คงสัดส่วน)

## โครงสร้าง path ใน Storage (เว็บจัดให้อัตโนมัติ)
```
shop/icons/{id}.png     ← ไอคอน
shop/sheets/{id}.png    ← sheet ติดตัวแมว
```

## ติดตั้ง & รัน (local)
```bash
cd admin
npm install
cp .env.local.example .env.local   # แล้วใส่ค่า URL + anon key
npm run dev                        # เปิด http://localhost:3000
```

## สิ่งที่ต้องตั้งใน Supabase (ครั้งเดียว)

**1. ตั้งตัวเองเป็น admin**
```sql
update public.profiles set is_admin = true where id = '<your-uid>';
```

**2. bucket `shop`** (Storage → New bucket → ชื่อ `shop` → Public)

**3. Storage policies** (SQL Editor) — ต้องมี insert + update เพราะเว็บใช้ upsert ทับรูปเดิม
```sql
-- อ่านรูปสาธารณะ (ถ้า bucket public อยู่แล้วข้ามได้)
create policy "shop read" on storage.objects
  for select using (bucket_id = 'shop');

-- admin อัปรูปใหม่
create policy "shop admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shop'
              and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- admin ทับรูปเดิม (จำเป็นสำหรับ upsert/แก้ไข)
create policy "shop admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'shop'
         and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
```

> `shop_items` write ใช้ policy `admin manage shop` ที่อยู่ใน migration 0001 แล้ว ไม่ต้องเพิ่ม

## Deploy ขึ้น Vercel (ฟรี)
1. push repo ขึ้น GitHub
2. Vercel → New Project → เลือก repo → **Root Directory = `admin`**
3. ใส่ env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## ความปลอดภัย
- เว็บใช้ **anon key + RLS (is_admin)** เท่านั้น — เขียนได้เฉพาะคนที่ `is_admin = true`
- **ห้าม** ใส่ `service_role` key ในเว็บนี้เด็ดขาด (มันอยู่ใน browser ใครก็เห็น)

## หมายเหตุ
- ลบไอเทม = ลบแถวใน DB เท่านั้น (รูปใน Storage ไม่ถูกลบอัตโนมัติ — ลบมือใน Storage UI ถ้าต้องการ)
- ใส่ icon ก่อน เว้น sheet ไว้ → กลับมา "แก้ไข" แล้วอัป sheet ทีหลังได้ (การ์ดจะขึ้นป้าย "ยังไม่มี sheet")
