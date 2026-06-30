import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
    TOPICS, computeTiers, computeStatus,
    firstAvailableId, missingPrereqNode,
} from '../data/lessons';
import { useMastery } from '../data/progress';

const hippoSrc = require('../../assets/hippo.png');

const NODE = 84;
const T3_GAP = 56;
const BRANCH_W = NODE + T3_GAP;

function SpriteFrame({ source, frameWidth, frameHeight, totalFrames, fps = 8 }) {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setFrame(p => (p + 1) % totalFrames), 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);
    return (
        <View style={{ width: frameWidth, height: frameHeight, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{ width: frameWidth * totalFrames, height: frameHeight, marginLeft: -frameWidth * frame }}
                resizeMode="cover"
            />
        </View>
    );
}
function SkillNode({ id, node, status, selected, onPress }) {
    const n = node;
    const map = {
        done: { col: '#7E9B57', icon: 'checkmark-circle-outline', txt: '#4A2800' },
        available: { col: '#C8972F', icon: 'star-outline', txt: '#4A2800' },
        locked: { col: '#B0A492', icon: 'lock-closed', txt: '#8B7E6A' },
    }[status];

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPress(id)}
            style={[
                styles.node,
                { borderColor: map.col },
                selected && styles.nodeSelected,
                selected && { borderColor: map.col },
            ]}
        >
            <Ionicons name={map.icon} size={24} color={map.col} />
            <Text style={[styles.nodeEn, { color: map.txt }]} numberOfLines={1}>{n.en}</Text>
            <Text style={[styles.nodeTh, { color: map.txt }]} numberOfLines={1}>{n.th}</Text>
        </TouchableOpacity>
    );
}

export default function SkillTreeScreen({ onNavigate }) {
    const TABS = TOPICS.map(t => t.th);
    const [activeTab, setActiveTab] = useState(TABS[0]);

    const topic = TOPICS.find(t => t.th === activeTab) ?? TOPICS[0];
    const NODES = topic.nodes;

    // mastery = concept ที่ผู้เล่น "รู้แล้ว" — มาจาก store กลาง (calibration / เล่นจบ node)
    // อยู่รอดข้ามหน้าจอ และ re-render เองเมื่อเปลี่ยน → dynamic skill tree
    const mastery = useMastery();
    // 🧪 โหมดทดสอบ: ปลดล็อกทุก node ให้กดเข้าเล่นได้หมด (ยังไม่เก็บค่า/ไม่ gate)
    //    ปิดเมื่อพร้อมใช้จริง → เปลี่ยนเป็น false แล้วระบบจะ gate ตาม mastery ตามเดิม
    const TEST_UNLOCK_ALL = true;
    const realStatus = computeStatus(NODES, mastery);
    const status = TEST_UNLOCK_ALL
        ? Object.fromEntries(NODES.map(n => [n.id, n.steps?.length ? 'available' : realStatus[n.id]]))
        : realStatus;
    const tiers = computeTiers(NODES);
    const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
    const DEFAULT_SELECTED = firstAvailableId(NODES, mastery);

    const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED);
    const [treeW, setTreeW] = useState(0);   // ความกว้างพื้นที่วาด tree (วัดจริง)

    // เปลี่ยนแท็บ → เด้งไปเลือก node เริ่มต้น (frontier) ของหัวข้อนั้น
    const switchTab = (tab) => {
        const t = TOPICS.find(x => x.th === tab) ?? TOPICS[0];
        setActiveTab(tab);
        setSelectedId(firstAvailableId(t.nodes, mastery));
    };

    const selected = byId[selectedId] ?? NODES[0];
    const selectedStatus = status[selected.id];
    const isLocked = selectedStatus === 'locked';
    const reqNode = missingPrereqNode(selected, NODES, mastery);

    const fade = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        fade.setValue(0);
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }, [selectedId, fade]);

    const closePopup = () => setSelectedId(DEFAULT_SELECTED);
    const goRequired = () => setSelectedId(reqNode?.id ?? DEFAULT_SELECTED);

    const startLesson = () => {
        if (selected.steps?.length) onNavigate?.('game-hardware', { lesson: selected });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                <View style={styles.headerWrap}>
                    <Text style={styles.title}>SKILL TREE</Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabRow}
                    >
                        {TABS.map(tab => {
                            const on = tab === activeTab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    activeOpacity={0.85}
                                    onPress={() => switchTab(tab)}
                                    style={[styles.chip, on && styles.chipOn]}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{tab}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <Text style={styles.quest}>
                        <Text style={styles.questLabel}>Quest : </Text>
                        {topic.quest}
                    </Text>

                    {(() => {
                        const total = NODES.length;
                        const doneCount = NODES.filter(n => status[n.id] === 'done').length;
                        return (
                            <View style={styles.progressRow}>
                                <View style={styles.progressBar}>
                                    {NODES.map((n, i) => (
                                        <View
                                            key={n.id}
                                            style={[styles.segment, i < doneCount ? styles.segmentOn : styles.segmentOff]}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.progressNum}>{doneCount}/{total}</Text>
                            </View>
                        );
                    })()}
                </View>

                <ScrollView
                    style={styles.tree}
                    contentContainerStyle={styles.treeContent}
                    showsVerticalScrollIndicator={false}
                >
                    {(() => {
                        // ── กราฟ: concept → node ที่สอน, แล้วหาพ่อ/ลูกของแต่ละ node ────────
                        const teacherOf = {};
                        NODES.forEach(n => (n.teaches || []).forEach(c => { teacherOf[c] = n.id; }));
                        const parentsOf = {}, childrenOf = {};
                        NODES.forEach(n => { childrenOf[n.id] = []; });
                        NODES.forEach(n => {
                            parentsOf[n.id] = (n.requires || []).map(c => teacherOf[c]).filter(Boolean);
                            parentsOf[n.id].forEach(p => childrenOf[p] && childrenOf[p].push(n.id));
                        });

                        // ── จัดเรียง node ในแต่ละ tier ให้ "ลูกอยู่ใกล้พ่อ" → เส้นไขว้น้อยสุด ──
                        const rows = tiers.map(r => r.slice());
                        const idxOf = row => { const m = {}; row.forEach((n, i) => { m[n.id] = i; }); return m; };
                        const bary = (id, rel, ix, fb) => {
                            const a = (rel[id] || []).map(k => ix[k]).filter(v => v != null);
                            return a.length ? a.reduce((s, v) => s + v, 0) / a.length : fb;
                        };
                        for (let sweep = 0; sweep < 4; sweep++) {
                            for (let i = 1; i < rows.length; i++) {
                                const ix = idxOf(rows[i - 1]);
                                rows[i] = rows[i].map((n, o) => ({ n, o }))
                                    .sort((a, b) => (bary(a.n.id, parentsOf, ix, a.o) - bary(b.n.id, parentsOf, ix, b.o)) || a.o - b.o)
                                    .map(x => x.n);
                            }
                            for (let i = rows.length - 2; i >= 0; i--) {
                                const ix = idxOf(rows[i + 1]);
                                rows[i] = rows[i].map((n, o) => ({ n, o }))
                                    .sort((a, b) => (bary(a.n.id, childrenOf, ix, a.o) - bary(b.n.id, childrenOf, ix, b.o)) || a.o - b.o)
                                    .map(x => x.n);
                            }
                        }

                        // ── วางพิกัดจริงจากลำดับที่จัดแล้ว ──────────────────────────────────
                        const V_STEP = 132;                 // ระยะแนวตั้งระหว่าง tier (center→center)
                        const TOP = NODE / 2 + 12;
                        const contentH = TOP + Math.max(0, rows.length - 1) * V_STEP + NODE / 2 + 16;
                        const pos = {};
                        rows.forEach((row, ti) => {
                            const n = row.length;
                            row.forEach((node, j) => {
                                pos[node.id] = { x: (treeW || 1) * (j + 1) / (n + 1), y: TOP + ti * V_STEP };
                            });
                        });

                        const edges = [];
                        NODES.forEach(n => (n.requires || []).forEach(c => {
                            const p = teacherOf[c];
                            if (p && pos[p] && pos[n.id])
                                edges.push({ from: pos[p], to: pos[n.id], fromId: p, toId: n.id, key: p + '>' + n.id });
                        }));
                        const isHot = ed => ed.fromId === selectedId || ed.toId === selectedId;
                        const drawOrder = edges.slice().sort((a, b) => (isHot(a) ? 1 : 0) - (isHot(b) ? 1 : 0));

                        return (
                            <View
                                style={{ width: '100%', height: contentH }}
                                onLayout={e => { const w = e.nativeEvent.layout.width; if (w && Math.abs(w - treeW) > 1) setTreeW(w); }}
                            >
                                {treeW > 0 && (
                                    <Svg pointerEvents="none" width={treeW} height={contentH} style={StyleSheet.absoluteFill}>
                                        {drawOrder.map(ed => {
                                            const pby = ed.from.y + NODE / 2, cty = ed.to.y - NODE / 2;
                                            const c1 = pby + (cty - pby) * 0.5;   // เส้นโค้งแนวตั้งนุ่ม ๆ
                                            const d = `M ${ed.from.x} ${pby} C ${ed.from.x} ${c1}, ${ed.to.x} ${c1}, ${ed.to.x} ${cty}`;
                                            const hot = isHot(ed);
                                            return <Path key={ed.key} d={d}
                                                stroke={hot ? '#C8972F' : '#D2C6B0'} strokeWidth={hot ? 3.5 : 2.5}
                                                fill="none" strokeLinecap="round" />;
                                        })}
                                    </Svg>
                                )}
                                {treeW > 0 && rows.map((_, ti) => (
                                    <Text key={'lbl' + ti} style={[styles.tierLabelAbs, { top: TOP + ti * V_STEP - 9 }]}>T{ti}</Text>
                                ))}
                                {treeW > 0 && rows.flat().map(n => {
                                    const p = pos[n.id];
                                    return (
                                        <View key={n.id} style={{ position: 'absolute', left: p.x - NODE / 2, top: p.y - NODE / 2 }}>
                                            <SkillNode id={n.id} node={n} status={status[n.id]}
                                                selected={selectedId === n.id} onPress={setSelectedId} />
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })()}
                </ScrollView>

                <Animated.View style={[styles.panel, { opacity: fade }]}>
                    {isLocked ? (
                        <View style={styles.pipoRow}>
                            <SpriteFrame source={hippoSrc} frameWidth={90} frameHeight={90} totalFrames={4} fps={5} />

                            <View style={styles.pipoBubbleWrap}>
                                <View style={styles.pipoBadge}>
                                    <Text style={styles.pipoBadgeText}>PIPO</Text>
                                </View>

                                <View style={styles.bubble}>
                                    <Text
                                        style={styles.bubbleText}
                                        textBreakStrategy="highQuality"
                                        lineBreakStrategyIOS="standard"
                                    >
                                        อึ๋ย! ด่านนี้ยังเรียนไม่ได้นะ ต้องผ่านด่าน
                                        ‘{reqNode?.fullTh}’ ก่อนนะ!
                                    </Text>

                                    <View style={styles.pipoBtnRow}>
                                        <TouchableOpacity style={styles.pipoBtn} activeOpacity={0.85} onPress={goRequired}>
                                            <Text style={styles.pipoBtnText}>ไปด่านที่ต้องเรียน</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pipoBtn} activeOpacity={0.85} onPress={closePopup}>
                                            <Text style={styles.pipoBtnText}>ปิด</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={styles.infoCard}>
                                <View style={[styles.infoIcon, { borderColor: selectedStatus === 'done' ? '#7E9B57' : '#C8972F' }]}>
                                    <Ionicons
                                        name={selectedStatus === 'done' ? 'checkmark-circle-outline' : 'star-outline'}
                                        size={24}
                                        color={selectedStatus === 'done' ? '#7E9B57' : '#C8972F'}
                                    />
                                </View>
                                <View style={styles.infoTextWrap}>
                                    <Text style={styles.infoTitle} numberOfLines={1}>
                                        <Text style={styles.infoTitleEn}>{selected.en} </Text>
                                        {selected.fullTh}
                                    </Text>
                                    <Text style={styles.infoDesc} numberOfLines={2}>{selected.desc}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.cta, !selected.steps?.length && styles.ctaDone]}
                                activeOpacity={0.85}
                                onPress={startLesson}
                                disabled={!selected.steps?.length}
                            >
                                {!!selected.steps?.length && (
                                    <LinearGradient
                                        colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                                        locations={[0, 0.15, 0.85, 1]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Text style={[styles.ctaText, !selected.steps?.length && styles.ctaTextDone]}>
                                    {selected.steps?.length
                                        ? 'เริ่มเรียนรู้ ➤'
                                        : selectedStatus === 'done' ? 'ผ่านแล้ว ✓' : 'เร็ว ๆ นี้'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1 },

    headerWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    title: {
        fontFamily: 'Jersey', fontSize: 28, fontWeight: '900',
        color: '#C47A30', letterSpacing: 1, marginBottom: 10,
    },
    tabRow: { gap: 8, paddingRight: 20 },
    chip: {
        borderWidth: 2, borderColor: "#D8CBB5", borderRadius: 18,
        paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F7F1E5',
    },
    chipOn: { backgroundColor: '#C47A30', borderColor: '#C47A30' },
    chipText: { fontFamily: 'PKNonthaburi', fontSize: 16, color: '#2C1810' },
    chipTextOn: { color: '#FFFFFF', fontWeight: '700' },

    quest: { fontFamily: 'PKNonthaburi', fontSize: 18, color: '#4A2800', marginTop: 12 },
    questLabel: { fontWeight: '700', color: '#C47A30', fontFamily: 'Jersey', fontSize:18 },

    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    progressBar: { flex: 1, flexDirection: 'row', gap: 6 },
    segment: { flex: 1, height: 10, borderRadius: 5 },
    segmentOn: { backgroundColor: '#C47A30' },
    segmentOff: { backgroundColor: '#E0D6C4' },
    progressNum: { fontFamily: 'Jersey', fontSize: 18, fontWeight: '900', color: '#2C1810' },

    tree: { flex: 1 },
    treeContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },

    tierRow: {
        height: NODE,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tierBg: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tierLabel: {
        width: 30,
        fontFamily: 'Jersey', fontSize: 18, fontWeight: '900',
        color: '#8B7E6A', letterSpacing: 0.5,
    },
    tierLabelAbs: {
        position: 'absolute', left: 0,
        fontFamily: 'Jersey', fontSize: 16, fontWeight: '900',
        color: '#8B7E6A', letterSpacing: 0.5,
    },
    tierDivider: { flex: 1, height: 1.5, backgroundColor: '#B7AC98', opacity: 0.6 },

    t3row: { flexDirection: 'row', justifyContent: 'center', gap: T3_GAP },
    tierNodes: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: T3_GAP },

    node: {
        width: NODE, height: NODE,
        borderRadius: 12, borderWidth: 2.5,
        backgroundColor: '#F6F0E2',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 4, gap: 2,
    },
    nodeSelected: {
        borderWidth: 3.5,
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 2,
        shadowOffset: { width: 0, height: 3 }, elevation: 4,
    },
    nodeEn: { fontFamily: 'Jersey', fontSize: 18, fontWeight: '700' },
    nodeTh: { fontFamily: 'PKNonthaburi', fontSize: 16 },

    branchWrap: { alignSelf: 'center', alignItems: 'center' },
    branchDown: {
        width: BRANCH_W, height: 22,
        borderColor: '#B7AC98',
        borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5,
        borderTopLeftRadius: 8, borderTopRightRadius: 8,
    },
    branchUp: {
        width: BRANCH_W, height: 22,
        borderColor: '#B7AC98',
        borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5,
        borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    },

    panel: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1.5,
        borderTopColor: '#B7AC98',
        backgroundColor: '#F7F1E5',
    },

    infoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    infoIcon: {
        width: 48, height: 48, borderRadius: 10, borderWidth: 2.5,
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F0E2',
    },
    infoTextWrap: { flex: 1, minWidth: 0 },
    infoTitle: { fontFamily: 'PKNonthaburi', fontSize: 18, color: '#2C1810' },
    infoTitleEn: { color: '#2C1810' },
    infoDesc: { fontFamily: 'PKNonthaburi', fontSize: 16, color: '#8B7E6A', marginTop: 2 },

    cta: {
        overflow: 'hidden', borderRadius: 10, height: 52,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#2C1810',
    },
    ctaText: { fontFamily: 'PKNonthaburi', fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
    ctaDone: { backgroundColor: '#D8CBB5', borderColor: '#C2B6A4' },
    ctaTextDone: { color: '#6E441B' },

    pipoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    pipoBubbleWrap: { flex: 1, position: 'relative' },
    pipoBadge: {
        position: 'absolute', top: -10, right: 10, zIndex: 2,
        backgroundColor: '#F7F1E5', borderWidth: 1.5, borderColor: '#C47A30',
        borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2,
    },
    pipoBadgeText: { fontFamily: 'Jersey', fontSize: 16, fontWeight: '900', color: '#C47A30', letterSpacing: 0.5 },
    bubble: {
        backgroundColor: '#EFE7DA',
        borderWidth: 2, borderColor: '#2C1810',
        borderRadius: 16, borderBottomLeftRadius: 5,
        paddingTop: 12, paddingBottom: 10, paddingHorizontal: 14,
    },
    bubbleText: { fontFamily: 'PKNonthaburi', fontSize: 18, color: '#4A2800', lineHeight: 24 },
    pipoBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    pipoBtn: {
        borderWidth: 1.5, borderColor: '#C47A30', borderRadius: 14,
        paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#F7F1E5',
    },
    pipoBtnText: { fontFamily: 'PKNonthaburi', fontSize: 16, fontWeight: '700', color: '#C47A30' },
});