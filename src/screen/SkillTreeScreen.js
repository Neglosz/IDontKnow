import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import NavBar from '../components/NavBar';

const hippoSrc = require('../../assets/hippo.png');

const NODE = 84;
const T3_GAP = 56;
const BRANCH_W = NODE + T3_GAP;

const TABS = ['การต่อวงจร', 'ออกแบบบอร์ด', 'เขียนโค้ดคุม', 'เชื่อมต่อระบบ'];

const NODES = {
    t0: {
        tier: 'T0', en: 'Basic Design', th: 'พื้นฐานการออกแบบ', status: 'done',
        fullTh: 'พื้นฐานการออกแบบ', desc: 'ทำความเข้าใจหลักการออกแบบวงจรเบื้องต้น'
    },
    t1: {
        tier: 'T1', en: 'Circuit Reading', th: 'อ่านวงจรไฟฟ้า', status: 'done',
        fullTh: 'อ่านวงจรไฟฟ้า', desc: 'อ่านและตีความสัญลักษณ์ในแผนผังวงจร'
    },
    t2: {
        tier: 'T2', en: 'PCB Layout', th: 'ออกแบบ PCB', status: 'available',
        fullTh: 'ออกแบบแผ่นวงจร PCB', desc: 'การแปลงพิมพ์เขียวให้กลายเป็นลายวงจรพิมพ์'
    },
    t3a: {
        tier: 'T3', en: 'Power Management', th: 'ระบบจ่ายไฟ', status: 'locked',
        fullTh: 'ระบบจ่ายไฟ', requiredId: 't2'
    },
    t3b: {
        tier: 'T3', en: 'Signal Integrity', th: 'การวัดกระแส', status: 'locked',
        fullTh: 'การวัดกระแส', requiredId: 't2'
    },
    t4: {
        tier: 'T4', en: 'Advanced Design', th: 'ออกแบบขั้นสูง', status: 'locked',
        fullTh: 'ออกแบบขั้นสูง', requiredId: 't2'
    },
};

const DEFAULT_SELECTED = 't2';

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
function SkillNode({ id, selected, onPress }) {
    const n = NODES[id];
    const map = {
        done: { col: '#7E9B57', icon: 'checkmark-circle-outline', txt: '#4A2800' },
        available: { col: '#C8972F', icon: 'star-outline', txt: '#4A2800' },
        locked: { col: '#B0A492', icon: 'lock-closed', txt: '#8B7E6A' },
    }[n.status];

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

const VLine = ({ color, height }) => (
    <View style={{ alignSelf: 'center', width: 3, height, backgroundColor: color }} />
);

function TierRow({ label, children }) {
    return (
        <View style={styles.tierRow}>
            <View style={styles.tierBg} pointerEvents="none">
                <Text style={styles.tierLabel}>{label}</Text>
                <View style={styles.tierDivider} />
            </View>
            {children}
        </View>
    );
}

export default function SkillTreeScreen({ onNavigate }) {
    const [activeTab, setActiveTab] = useState('ออกแบบบอร์ด');
    const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED);

    const selected = NODES[selectedId];
    const isLocked = selected.status === 'locked';

    const fade = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        fade.setValue(0);
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }, [selectedId, fade]);

    const closePopup = () => setSelectedId(DEFAULT_SELECTED);
    const goRequired = () => setSelectedId(selected.requiredId ?? DEFAULT_SELECTED);

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
                                    onPress={() => setActiveTab(tab)}
                                    style={[styles.chip, on && styles.chipOn]}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{tab}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <Text style={styles.quest}>
                        <Text style={styles.questLabel}>Quest : </Text>
                        เรียนรู้ขั้นตอนการออกแบบบอร์ด
                    </Text>

                    <View style={styles.progressRow}>
                        <View style={styles.progressBar}>
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <View
                                    key={i}
                                    style={[styles.segment, i < 2 ? styles.segmentOn : styles.segmentOff]}
                                />
                            ))}
                        </View>
                        <Text style={styles.progressNum}>2/6</Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.tree}
                    contentContainerStyle={styles.treeContent}
                    showsVerticalScrollIndicator={false}
                >
                    <TierRow label="T0">
                        <SkillNode id="t0" selected={selectedId === 't0'} onPress={setSelectedId} />
                    </TierRow>
                    <VLine color={'#7E9B57'} height={26} />

                    <TierRow label="T1">
                        <SkillNode id="t1" selected={selectedId === 't1'} onPress={setSelectedId} />
                    </TierRow>
                    <VLine color={'#C8972F'} height={26} />

                    <TierRow label="T2">
                        <SkillNode id="t2" selected={selectedId === 't2'} onPress={setSelectedId} />
                    </TierRow>

                    <View style={styles.branchWrap}>
                        <VLine color={'#B7AC98'} height={14} />
                        <View style={styles.branchDown} />
                    </View>

                    <TierRow label="T3">
                        <View style={styles.t3row}>
                            <SkillNode id="t3a" selected={selectedId === 't3a'} onPress={setSelectedId} />
                            <SkillNode id="t3b" selected={selectedId === 't3b'} onPress={setSelectedId} />
                        </View>
                    </TierRow>

                    <View style={styles.branchWrap}>
                        <View style={styles.branchUp} />
                        <VLine color={'#B7AC98'} height={14} />
                    </View>

                    <TierRow label="T4">
                        <SkillNode id="t4" selected={selectedId === 't4'} onPress={setSelectedId} />
                    </TierRow>
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
                                        ‘{NODES[selected.requiredId]?.fullTh}’ ก่อนนะ!
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
                                <View style={[styles.infoIcon, { borderColor: selected.status === 'done' ? '#7E9B57' : '#C8972F' }]}>
                                    <Ionicons
                                        name={selected.status === 'done' ? 'checkmark-circle-outline' : 'star-outline'}
                                        size={24}
                                        color={selected.status === 'done' ? '#7E9B57' : '#C8972F'}
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
                                style={styles.cta}
                                activeOpacity={0.85}
                                onPress={() => onNavigate?.('game-hardware')}
                            >
                                <LinearGradient
                                    colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                                    locations={[0, 0.15, 0.85, 1]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Text style={styles.ctaText}>เริ่มเรียนรู้ ➤</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>

            </View>

            <NavBar active="quest" onPress={onNavigate} />
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
    tierDivider: { flex: 1, height: 1.5, backgroundColor: '#B7AC98', opacity: 0.6 },

    t3row: { flexDirection: 'row', justifyContent: 'center', gap: T3_GAP },

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