import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TOPICS, computeTiers } from '../data/lessons';
import { Progress } from '../data/progress';
import { useSimSession } from './simEngine';
import { useAuth } from '../context/AuthContext';

// sprite sheet ของ MASTER — ปรับ path / frame ให้ตรงกับไฟล์จริง
const masterSrc = require('../../assets/boss_talkt_128.png');

function SpriteFrame({ source, frameWidth, frameHeight, totalFrames, fps = 8 }) {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setFrame(prev => (prev + 1) % totalFrames);
        }, 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);

    return (
        <View style={{ width: frameWidth, height: frameHeight, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{
                    width: frameWidth * totalFrames,
                    height: frameHeight,
                    marginLeft: -frameWidth * frame,
                }}
                resizeMode="cover"
            />
        </View>
    );
}

const DEFAULT_INTRO =
    'มาเริ่มกันแบบสบาย ๆ นะ~ ลองทำสัก 2–3 สถานการณ์สั้น ๆ ' +
    'ฉันจะได้จัดเส้นทางให้พอดีกับคุณ ไม่ต้องกังวลว่าถูกหรือผิดเลย!';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_Q = 3;   // calibration สั้น ๆ ไม่เกิน 3 สถานการณ์ — ไม่ให้รู้สึกเหมือนสอบ

// สร้างคิว calibration จาก pretest ของ topic เรียงตาม tier (ราก → ลึก) เอาแค่ 3 ตัวแรก
function buildQueue(nodes) {
    const q = [];
    computeTiers(nodes).forEach(row => row.forEach(n => { if (n.pretest) q.push(n); }));
    return q.slice(0, MAX_Q);
}

export default function CalibrateScreen({
    onNavigate,
    topicKey,
    topic,                       // เผื่อส่ง object lens/topic มา
    masterIntro = DEFAULT_INTRO,
}) {
    const { recordDailyActivity } = useAuth();
    const resolved = TOPICS.find(t => t.key === (topicKey ?? topic?.key)) ?? TOPICS[0];
    const queue = useMemo(() => buildQueue(resolved.nodes), [resolved]);

    // useSimSession = เก็บ "หลักฐานพฤติกรรม" (เวลา/วิธีคิด) แทนการตัดสินด้วยคำตอบล้วน
    const sess = useSimSession({
        questId: 'calibrate_' + resolved.key, archetype: 'calibrate',
        topicTags: [resolved.key], parMs: 15000,
    });
    const correctRef = useRef(0);

    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);

    const node = queue[idx];
    const pretest = node?.pretest;
    const scenario = pretest?.q ?? '';
    const options = (pretest?.choices ?? []).map((c, i) => ({ id: LETTERS[i], th: c, en: '' }));
    const correctId = pretest ? LETTERS[pretest.answer] : null;

    const answered = selected !== null;
    const isCorrect = selected === correctId;
    const isLast = idx + 1 >= queue.length;

    // อนิเมชันเลื่อนขึ้นของแถบผล
    const slide = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);

    // topic ไม่มี pretest เลย → ข้ามไป skill tree
    useEffect(() => { if (queue.length === 0) onNavigate?.('skill-tree'); }, [queue.length]);

    const handlePick = (id) => {
        if (answered) return;          // เลือกได้ครั้งเดียวต่อสถานการณ์
        setSelected(id);
        const ok = id === correctId;
        if (ok) { correctRef.current += 1; Progress.learn(node.teaches ?? []); } // ทำได้ = รู้แล้ว → ข้ามได้
        sess.submit({ correct: ok });
    };

    // ทำทุกสถานการณ์จนครบ (ไม่หยุดกลางคันให้รู้สึกว่า "ตก") แล้วค่อยจัดเส้นทาง
    // จุดเริ่ม = node แรกที่ยังไม่ได้ทำเครื่องหมายว่ารู้ (frontier) — เกิดเองจาก mastery
    const finish = () => {
        const total = queue.length || 1;
        Progress.setCalibration(Math.round((correctRef.current / total) * 100));
        Progress.touchStreak();          // streak ใน session (ใช้คำนวณ level score ทันที)
        recordDailyActivity();           // นับ streak จริงลง Supabase + cache (วันละครั้ง)
        sess.complete({
            completeness: correctRef.current === total ? 'full'
                : correctRef.current > 0 ? 'partial' : 'none',
        });
        onNavigate?.('skill-tree');
    };

    const goNext = () => {
        if (!isLast) {
            slide.setValue(0);
            setSelected(null);
            setIdx(i => i + 1);
            requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
        } else {
            finish();
        }
    };

    useEffect(() => {
        if (answered) {
            Animated.timing(slide, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }).start();
            // เลื่อนลิสต์ให้เห็นข้อที่เลือก/เฉลยด้วย
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        }
    }, [answered, slide]);

    const barTranslate = slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

    if (!node) return <SafeAreaView style={styles.safe} edges={['top']} />;

    // โทนนุ่ม: เน้น "วิธีที่เหมาะ" เป็นเขียว, ที่เราเลือกเป็นกลาง ๆ (ไม่ใช้สีแดงตัดสิน)
    const optionStateStyle = (id) => {
        if (!answered) return null;
        if (id === correctId) return styles.optCorrect;       // วิธีที่เหมาะ = เขียวอ่อน
        if (id === selected) return styles.optChosen;         // ที่เราเลือก = เน้นกลาง ๆ
        return styles.optDimmed;
    };
    const letterStateStyle = (id) => {
        if (!answered) return null;
        if (id === correctId) return styles.letterCorrect;
        if (id === selected) return styles.letterChosen;
        return null;
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                <View style={styles.headRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate?.('learn')}>
                        <Text style={styles.backText}>◄ BACK</Text>
                    </TouchableOpacity>
                    <Text style={styles.calCount}>ลองดู {idx + 1}/{queue.length}</Text>
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ===== กล่องข้อความ MASTER (อ้างอิงบับเบิล + ตัดคำจาก ScanScreen) ===== */}
                    <View style={styles.msgRow}>
                        <View style={styles.masterAvatar}>
                            <SpriteFrame
                                source={masterSrc}
                                frameWidth={90}
                                frameHeight={90}
                                totalFrames={14}
                                fps={5}
                            />
                        </View>

                        <View style={styles.msgCol}>
                            <View style={styles.nameBadge}>
                                <Text style={styles.nameBadgeText}>MASTER</Text>
                            </View>

                            <View style={styles.bubble}>
                                <Text
                                    style={styles.bubbleText}
                                    textBreakStrategy="highQuality"
                                    lineBreakStrategyIOS="standard"
                                >
                                    {masterIntro}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ===== กล่อง SCENARIO ===== */}
                    <View style={styles.scenarioBox}>
                        <View style={styles.scenarioBadge}>
                            <Text style={styles.scenarioBadgeText}>สถานการณ์</Text>
                        </View>
                        <Text
                            style={styles.scenarioText}
                            textBreakStrategy="highQuality"
                            lineBreakStrategyIOS="standard"
                        >
                            {scenario}
                        </Text>
                    </View>

                    {/* ===== ตัวเลือก A–D ===== */}
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            activeOpacity={0.85}
                            onPress={() => handlePick(opt.id)}
                            style={[styles.optionBtn, optionStateStyle(opt.id)]}
                        >
                            <View style={[styles.letterBox, letterStateStyle(opt.id)]}>
                                <Text style={styles.letterText}>{opt.id}</Text>
                            </View>
                            <View style={styles.optTextWrap}>
                                <Text style={styles.optTh}>{opt.th}</Text>
                                <Text style={styles.optEn}>{opt.en}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ===== แถบเฉลยปักล่างจอ (เด้งขึ้นหลังตอบ ไม่ต้อง scroll หา) ===== */}
                {answered && (
                    <Animated.View
                        style={[
                            styles.resultBar,
                            isCorrect ? styles.resultBarOk : styles.resultBarNeutral,
                            { opacity: slide, transform: [{ translateY: barTranslate }] },
                        ]}
                    >
                        <View style={styles.resultHeader}>
                            <View style={[styles.resultIcon, isCorrect ? styles.resultIconOk : styles.resultIconNeutral]}>
                                <Text style={styles.resultIconText}>{isCorrect ? '✓' : '✦'}</Text>
                            </View>
                            <Text style={[styles.resultTitle, { color: isCorrect ? GREEN : '#8A5A1E' }]}>
                                {isCorrect ? 'เยี่ยมไปเลย!' : 'รับไว้แล้วน้า~'}
                            </Text>
                        </View>

                        <Text
                            style={styles.resultText}
                            textBreakStrategy="highQuality"
                            lineBreakStrategyIOS="standard"
                        >
                            {isCorrect
                                ? `เรื่อง “${node.fullTh}” คุณเข้าใจแล้ว เดี๋ยวข้ามให้เลย`
                                : `ไม่เป็นไรเลย~ เดี๋ยวเราเริ่มเรื่อง “${node.fullTh}” ไปด้วยกันนะ`}
                        </Text>

                        <TouchableOpacity
                            style={styles.ctaPrimary}
                            activeOpacity={0.85}
                            onPress={goNext}
                        >
                            <LinearGradient
                                colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                                locations={[0, 0.15, 0.85, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.ctaPrimaryText}>
                                {isLast ? 'ดูเส้นทางของฉัน' : 'ต่อไป'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

            </View>
        </SafeAreaView>
    );
}

const GREEN = '#3F7D3A';

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1, paddingHorizontal: 20 },
    content: { flex: 1 },

    headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    calCount: { fontFamily: 'Jersey', fontSize: 18, fontWeight: '900', color: '#C47A30', letterSpacing: 0.5 },
    backBtn: { paddingVertical: 10 },
    backText: {
        fontFamily: 'Jersey',
        fontSize: 26,
        fontWeight: '900',
        color: '#3A1A00',
        letterSpacing: 1,
    },

    // ===== กล่องข้อความ MASTER =====
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    masterAvatar: {
        width: 90,
        height: 90,
    },
    msgCol: { flex: 1 },
    nameBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F7F1E5',
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 4,
    },
    nameBadgeText: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 0.5,
    },
    bubble: {
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 16,
        borderBottomLeftRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bubbleText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
    },

    // ===== SCENARIO =====
    scenarioBox: {
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 14,
        paddingTop: 16,
        paddingBottom: 14,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    scenarioBadge: {
        position: 'absolute',
        top: -12,
        left: 12,
        backgroundColor: '#F7F1E5',
        borderWidth: 1.5,
        borderColor: '#C47A30',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    scenarioBadgeText: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 0.5,
    },
    scenarioText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
        marginTop: 2,
    },

    // ===== ตัวเลือก =====
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F7F1E5',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    optCorrect: { borderColor: GREEN, backgroundColor: '#E5F0DC' },
    optChosen: { borderColor: '#C47A30', backgroundColor: '#F3E7D2' },
    optDimmed: { opacity: 0.5 },

    letterBox: {
        width: 42,
        height: 42,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#2C1810',
        alignItems: 'center',
        justifyContent: 'center',
    },
    letterCorrect: { borderColor: GREEN },
    letterChosen: { borderColor: '#C47A30' },
    letterText: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: '#2C1810',
    },
    optTextWrap: { flex: 1, minWidth: 0 },
    optTh: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#2C1810',
    },
    optEn: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#6E441B',
        marginTop: 1,
    },

    // ===== แถบเฉลยปักล่างจอ =====
    resultBar: {
        marginHorizontal: -20,      // ขยายเต็มความกว้างจอ (body มี padding 20)
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 12,
        borderTopWidth: 2,
    },
    resultBarOk: { backgroundColor: '#E5F0DC', borderTopColor: GREEN },
    resultBarNeutral: { backgroundColor: '#F3E7D2', borderTopColor: '#C47A30' },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    resultIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultIconOk: { backgroundColor: GREEN },
    resultIconNeutral: { backgroundColor: '#C47A30' },
    resultIconText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 18,
    },
    resultTitle: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    resultText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 15,
        color: '#2C1810',
        lineHeight: 22,
        marginBottom: 12,
    },

    // ===== CTA =====
    ctaPrimary: {
        overflow: 'hidden',
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
    },
    ctaPrimaryText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 6,
    },
});