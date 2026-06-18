// ============================================================================
// BlockCodeSim — ด่าน "ลากบล็อกโค้ด" (software) สำหรับเสียบเข้าเอนจิน Game.js
// ----------------------------------------------------------------------------
// ไม่มีระบบคะแนน/combo/intro/clear ของตัวเอง — ใช้ "ตัววัด" ของ Game.js
// หน้าที่เดียว: รับ level → ให้ผู้เล่นเรียงบล็อก → ชนะเรียก onSuccess(), ออกเรียก onClose()
// (รูปแบบเดียวกับ SequenceSim / SelectSim / DiagnoseSim ใน simEngine.js)
// ============================================================================
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, PanResponder,
} from 'react-native';

const BORDER = { borderWidth: 3, borderColor: '#2C1B10' };
const MONO = { fontFamily: 'monospace' };
const TYPE_COLOR = {
  event: '#C97D10',
  sensor: '#3A8FE8',
  cond: '#C9A227',
  action: '#2E7D32',
};

const arraysEqual = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export default function BlockCodeSim({ level, onSuccess, onClose }) {
  const [placed, setPlaced] = useState([]);
  const [overlay, setOverlay] = useState('idle');   // idle | success | error

  const boardRef = useRef(null);
  const dropZone = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const measureDropZone = () => {
    boardRef.current?.measureInWindow?.((x, y, w, h) => {
      if (w && h) dropZone.current = { x, y, w, h };
    });
  };

  const dropBlock = (block) =>
    setPlaced((prev) => (prev.includes(block.id) ? prev : [...prev, block.id]));
  const removeBlock = (id) =>
    setPlaced((prev) => prev.filter((b) => b !== id));

  const handleRun = () => {
    if (placed.length === 0) return;
    setOverlay(arraysEqual(placed, level.correct) ? 'success' : 'error');
  };
  const handleRetry = () => {
    setOverlay('idle');
    setPlaced([]);
  };

  return (
    <View style={s.screen}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={onClose} style={s.backBtn}>
          <Text style={s.backBtnTxt}>◄ ออก</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{level.title}</Text>
        <Text style={s.tag}>{'</>'}</Text>
      </View>

      <View style={s.missionScroll}>
        <View style={s.npcAvatarCol}>
          <View style={s.avatarBox}>
            <Text style={s.avatarEmoji}>{level.emoji}</Text>
          </View>
          <Text style={s.npcName} numberOfLines={1}>{level.npc}</Text>
        </View>
        <ScrollView style={s.missionTextScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.missionText}>{level.brief}</Text>
        </ScrollView>
      </View>

      <View style={s.workspace}>
        <View style={s.vault}>
          <Text style={s.sectionLabel}>[ BLOCK VAULT ]</Text>
          {level.blocks.map((block) => (
            <DraggableBlock
              key={block.id}
              block={block}
              used={placed.includes(block.id)}
              dropZone={dropZone}
              measureDropZone={measureDropZone}
              onDragStart={() => setDragActive(true)}
              onDragEnd={() => setDragActive(false)}
              onDrop={dropBlock}
            />
          ))}
        </View>

        <View style={s.circuitCol}>
          <Text style={[s.sectionLabel, { color: '#4CAF50' }]}>[ CIRCUIT BOARD ]</Text>
          <View
            ref={boardRef}
            onLayout={measureDropZone}
            style={[s.board, dragActive && s.boardActive]}
          >
            {placed.length === 0 ? (
              <Text style={s.boardHint}>{'ลากบล็อกจากซ้าย\nมาวางที่นี่ ⤵'}</Text>
            ) : (
              placed.map((id, idx) => {
                const b = level.blocks.find((x) => x.id === id);
                const c = TYPE_COLOR[b.type];
                return (
                  <View key={id}>
                    {idx > 0 && <View style={s.wire} />}
                    <TouchableOpacity
                      style={[s.placedBlock, { borderColor: c }]}
                      activeOpacity={0.8}
                      onPress={() => removeBlock(id)}
                    >
                      <View style={[s.placedNum, { backgroundColor: c }]}>
                        <Text style={s.placedNumTxt}>{idx + 1}</Text>
                      </View>
                      <Text style={[s.placedCode, { color: c }]} numberOfLines={1}>{b.code}</Text>
                      <Text style={s.placedRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      <View style={s.actionArea}>
        <TouchableOpacity
          style={[s.runBtn, placed.length === 0 && s.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleRun}
          disabled={placed.length === 0}
        >
          <Text style={s.runBtnTxt}>[ ⚡ RUN CODE ]</Text>
        </TouchableOpacity>
      </View>

      {overlay !== 'idle' && (
        <View style={s.overlay}>
          <View style={[s.resultPanel, overlay === 'success' ? s.successPanel : s.errorPanel]}>
            {overlay === 'success' ? (
              <>
                <Text style={s.resultTitle}>[ CODE OK ]</Text>
                <Text style={s.resultIcon}>✓</Text>
                <Text style={s.resultText}>
                  {level.success.map((l) => `> ${l}`).join('\n')}
                </Text>
                <TouchableOpacity style={s.orangeBtn} onPress={onSuccess}>
                  <Text style={s.orangeBtnTxt}>[ ต่อไป {'>>>'} ]</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.resultTitle}>[ RUNTIME ERROR ]</Text>
                <Text style={[s.resultIcon, { color: '#D94040' }]}>✗</Text>
                <Text style={s.resultText}>
                  {level.error.map((l) => `> ${l}`).join('\n')}
                </Text>
                <TouchableOpacity style={[s.orangeBtn, { borderColor: '#D94040' }]} onPress={handleRetry}>
                  <Text style={s.orangeBtnTxt}>[ RETRY ]</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function DraggableBlock({ block, used, dropZone, measureDropZone, onDragStart, onDragEnd, onDrop }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const usedRef = useRef(used);
  usedRef.current = used;
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !usedRef.current,
      onMoveShouldSetPanResponder: (_e, g) =>
        !usedRef.current && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
      onPanResponderGrant: () => {
        measureDropZone();
        setDragging(true);
        onDragStart?.();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, g) => {
        const dz = dropZone.current;
        const inside =
          dz && g.moveX >= dz.x && g.moveX <= dz.x + dz.w &&
          g.moveY >= dz.y && g.moveY <= dz.y + dz.h;
        if (inside) dropRef.current?.(block);
        setDragging(false);
        onDragEnd?.();
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        onDragEnd?.();
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  const color = TYPE_COLOR[block.type];

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        s.vaultBlock,
        { borderColor: color },
        used && s.vaultBlockUsed,
        {
          transform: [...pan.getTranslateTransform(), { scale: dragging ? 1.06 : 1 }],
          zIndex: dragging ? 999 : 1,
          elevation: dragging ? 14 : 3,
        },
      ]}
    >
      <Text style={s.vaultIcon}>{block.icon}</Text>
      <View style={s.vaultTextWrap}>
        <Text style={[s.vaultLabel, { color }]} numberOfLines={1}>{block.label}</Text>
        <Text style={s.vaultCode} numberOfLines={1}>{block.code}</Text>
      </View>
      {used ? <Text style={s.vaultUsedMark}>●</Text> : <Text style={s.vaultGrip}>⋮⋮</Text>}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0e0e1a' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E222A', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 3, borderBottomColor: '#2C1B10',
  },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1.5, borderColor: '#555' },
  backBtnTxt: { ...MONO, color: '#aaa', fontSize: 12, fontWeight: '600' },
  title: { ...MONO, flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#F5F2EB', marginHorizontal: 8 },
  tag: { ...MONO, color: '#E8A020', fontSize: 14, fontWeight: '700' },

  missionScroll: {
    flexDirection: 'row', gap: 10, height: 96, backgroundColor: '#F7E7C4',
    borderBottomWidth: 3, borderBottomColor: '#2C1B10', paddingHorizontal: 12, paddingVertical: 10,
  },
  npcAvatarCol: { alignItems: 'center', gap: 3, width: 56 },
  avatarBox: {
    width: 48, height: 48, backgroundColor: '#e8d5a0', ...BORDER, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarEmoji: { fontSize: 26 },
  npcName: { ...MONO, fontSize: 9, fontWeight: '700', color: '#2C1B10', textAlign: 'center' },
  missionTextScroll: { flex: 1 },
  missionText: { ...MONO, fontSize: 12, color: '#2C1B10', lineHeight: 18 },

  workspace: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: '#F5F2EB', padding: 10 },
  sectionLabel: { ...MONO, color: '#2C1B10', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  vault: { flex: 1, gap: 8 },
  vaultBlock: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf7', borderWidth: 3,
    paddingHorizontal: 7, paddingVertical: 8, gap: 6,
  },
  vaultBlockUsed: { opacity: 0.32, backgroundColor: '#e9e4d6' },
  vaultIcon: { fontSize: 16 },
  vaultTextWrap: { flex: 1 },
  vaultLabel: { ...MONO, fontSize: 10, fontWeight: '700' },
  vaultCode: { ...MONO, fontSize: 8, color: '#7B5B3A', marginTop: 1 },
  vaultGrip: { ...MONO, fontSize: 12, color: '#bbb', fontWeight: '700' },
  vaultUsedMark: { ...MONO, fontSize: 10, color: '#27AE60' },

  circuitCol: { flex: 1 },
  board: { flex: 1, backgroundColor: '#120e08', borderWidth: 3, borderColor: '#6B4226', padding: 8 },
  boardActive: { borderColor: '#4CAF50', backgroundColor: '#0d1a0d' },
  boardHint: { ...MONO, color: '#5a4a2a', fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: 40 },
  placedBlock: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a150d', borderWidth: 2,
    paddingHorizontal: 6, paddingVertical: 7, gap: 6,
  },
  placedNum: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  placedNumTxt: { ...MONO, fontSize: 10, fontWeight: '900', color: '#fff' },
  placedCode: { ...MONO, fontSize: 10, fontWeight: '700', flex: 1 },
  placedRemove: { ...MONO, fontSize: 11, color: '#8a7a5a' },
  wire: { width: 3, height: 10, backgroundColor: '#E8A020', alignSelf: 'center' },

  actionArea: {
    backgroundColor: '#F5F2EB', borderTopWidth: 3, borderTopColor: '#2C1B10',
    paddingHorizontal: 10, paddingVertical: 10,
  },
  runBtn: { backgroundColor: '#1E8449', ...BORDER, paddingVertical: 13, alignItems: 'center' },
  runBtnTxt: { ...MONO, color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  btnDisabled: { opacity: 0.4 },

  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22,
  },
  resultPanel: { width: '100%', ...BORDER, padding: 20, alignItems: 'center', gap: 10 },
  successPanel: { backgroundColor: '#0d2a0d' },
  errorPanel: { backgroundColor: '#2a0d0d' },
  resultTitle: { ...MONO, color: '#F5F2EB', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  resultIcon: { ...MONO, fontSize: 36, color: '#4CAF50' },
  resultText: { ...MONO, color: '#ccc', fontSize: 12, lineHeight: 20, alignSelf: 'flex-start' },
  orangeBtn: { width: '100%', backgroundColor: '#C97D10', ...BORDER, paddingVertical: 14, alignItems: 'center' },
  orangeBtnTxt: { ...MONO, color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
