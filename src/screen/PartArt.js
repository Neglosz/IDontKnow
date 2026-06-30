// ============================================================================
//  PartArt.js — barrel: รวม export ของงานภาพ (art) ที่แยกไฟล์ไว้ใน ./art/*
//  เพื่อให้ดู/แก้ไขง่ายและเป็นสัดเป็นส่วน งานภาพถูกแยกเป็น 3 ไฟล์:
//    • art/parts.js      — ชิ้นส่วน "ของจริง"  → PartArt, PART_KINDS, hasPartArt
//    • art/symbols.js    — สัญลักษณ์ schematic → SchematicSymbol
//    • art/containers.js — ลังกระดาษ + รางถ่าน → CardboardBox, BatteryRail
//
//  ไฟล์อื่น import เหมือนเดิมได้เลย เช่น:
//    import { PartArt, SchematicSymbol, hasPartArt } from './PartArt';
// ============================================================================
export { PART_KINDS, hasPartArt, PartArt } from './art/parts';
export { SchematicSymbol } from './art/symbols';
export { CardboardBox, BatteryRail } from './art/containers';
