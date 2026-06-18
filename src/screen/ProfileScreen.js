import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, TouchableOpacity, Alert, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const starSrc = require('../../assets/star.png');
const catSrc = require('../../assets/player_cat-sheet_120.png');

// gradient ของไฟ — ปรับสี/ทิศได้ตรงนี้ที่เดียว
const FIRE_GRAD = ['#F4BB4A', '#DE7A1A'];        // วงกลมใหญ่ (เข้มกว่า)
const CELL_GRAD = ['#F3B850', '#E68C2D'];        // ช่องวัน active
const GRAD_START = { x: 0.5, y: 0 };
const GRAD_END = { x: 0.5, y: 1 };

// icon ใช้เป็น emoji เพื่อให้สีตรงกับดีไซน์ในภาพ
// ถ้ามีไฟล์ pixel-art ของตัวเอง เปลี่ยนเป็น <Image source={require(...)} /> ได้เลย
const KNOWLEDGE = [
    { key: 'engineering', label: 'Engineering', icon: '💡', percent: 80 },
    { key: 'science',     label: 'Science',     icon: '🔬', percent: 40 },
    { key: 'history',     label: 'History',     icon: '📜', percent: 20 },
    { key: 'math',        label: 'Math',        icon: '🧮', percent: 60 },
];

const WEEK_DAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const STREAK_DAYS = 5;

const BONUSES = [
    { day: 3, reward: 2, claimed: true },
    { day: 7, reward: 5, claimed: false },
];

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

function ProgressBar({ percent }) {
    return (
        <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(Math.max(percent, 0), 100)}%` }]} />
        </View>
    );
}

function WeekCell({ day, active, isToday }) {
    const flame = <Ionicons name="flame" size={16} color="#fff" />;

    let cell;
    if (isToday) {
        cell = (
            <View style={styles.weekCellTodayRing}>
                <LinearGradient colors={CELL_GRAD} start={GRAD_START} end={GRAD_END} style={styles.weekCellInnerToday}>
                    {flame}
                </LinearGradient>
            </View>
        );
    } else if (active) {
        cell = (
            <LinearGradient colors={CELL_GRAD} start={GRAD_START} end={GRAD_END} style={styles.weekCell}>
                {flame}
            </LinearGradient>
        );
    } else {
        cell = (
            <View style={[styles.weekCell, styles.weekCellInactive]}>
                <Text style={styles.weekDash}>-</Text>
            </View>
        );
    }

    return (
        <View style={styles.weekCol}>
            <Text style={styles.weekDayLabel}>{day}</Text>
            {cell}
        </View>
    );
}

export default function ProfileScreen({ onNavigate }) {
    const soon = () => Alert.alert('เร็ว ๆ นี้', 'ฟีเจอร์นี้กำลังจัดทำ');

    const nextBonus = BONUSES.find(b => !b.claimed);
    const daysLeft = nextBonus ? Math.max(nextBonus.day - STREAK_DAYS, 0) : 0;
    const prevBonusDay = BONUSES.filter(b => b.claimed).slice(-1)[0]?.day ?? 0;
    const bonusProgress = nextBonus
        ? (STREAK_DAYS - prevBonusDay) / (nextBonus.day - prevBonusDay)
        : 1;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>PROFILE</Text>
                    <TouchableOpacity onPress={() => onNavigate?.('setting')}>
                        <Ionicons name="settings-outline" size={26} color="#452817" />
                    </TouchableOpacity>
                </View>

                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrap}>
                        <SpriteFrame source={catSrc} frameWidth={100} frameHeight={100} totalFrames={3} fps={3.5} />
                    </View>

                    <View style={styles.nameRow}>
                        <Text style={styles.name}>NOBI</Text>
                        <TouchableOpacity onPress={soon}>
                            <Ionicons name="pencil" size={16} color="#452817" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.titleLabel}>นักสำรวจมือใหม่</Text>

                    <View style={styles.scoreBadge}>
                        <Image source={starSrc} style={{ width: 18, height: 18 }} resizeMode="contain" />
                        <Text style={styles.scoreNum}>1200</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Knowledge</Text>
                        <TouchableOpacity onPress={soon}>
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {KNOWLEDGE.map((k, i) => (
                        <View key={k.key} style={[styles.knowledgeRow, i === KNOWLEDGE.length - 1 && { marginBottom: 0 }]}>
                            <View style={styles.knowledgeIconWrap}>
                                <Text style={styles.knowledgeIcon}>{k.icon}</Text>
                            </View>
                            <View style={styles.knowledgeBarCol}>
                                <View style={styles.knowledgeLabelRow}>
                                    <Text style={styles.knowledgeLabel}>{k.label}</Text>
                                    <Text style={styles.knowledgePercent}>{k.percent}%</Text>
                                </View>
                                <ProgressBar percent={k.percent} />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <View style={styles.streakHeaderRow}>
                        <Ionicons name="flame" size={20} color="#E07B1B" />
                        <Text style={styles.cardTitle}>Daily Streak</Text>
                    </View>

                    <View style={styles.streakBig}>
                        <LinearGradient
                            colors={FIRE_GRAD}
                            start={GRAD_START}
                            end={GRAD_END}
                            style={styles.streakCircle}
                        >
                            <Ionicons name="flame" size={38} color="#FFFFFF" />
                        </LinearGradient>
                        <View style={styles.streakTextCol}>
                            <View style={styles.streakNumRow}>
                                <Text style={styles.streakNum}>{STREAK_DAYS}</Text>
                                <Text style={styles.streakDayLabel}>วัน</Text>
                            </View>
                            <Text style={styles.streakSub}>เรียนต่อเนื่อง</Text>
                        </View>
                    </View>

                    <View style={styles.weekBox}>
                        <View style={styles.weekRow}>
                            {WEEK_DAYS.map((d, i) => (
                                <WeekCell
                                    key={d}
                                    day={d}
                                    active={i < STREAK_DAYS}
                                    isToday={i === STREAK_DAYS - 1}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.bonusBox}>
                        <Text style={styles.bonusTitle}>🎁 Streak Bonus</Text>

                        {BONUSES.map(b => (
                            <View key={b.day} style={[styles.bonusRow, b.claimed && styles.bonusRowClaimed]}>
                                <View style={[styles.bonusDayBadge, b.claimed && styles.bonusDayBadgeClaimed]}>
                                    <Text style={styles.bonusDayNum}>{b.day}</Text>
                                </View>
                                <Text style={styles.bonusText}>ครบ {b.day} วัน</Text>
                                <View style={styles.bonusReward}>
                                    <Image source={starSrc} style={{ width: 14, height: 14 }} resizeMode="contain" />
                                    <Text style={styles.bonusRewardText}>+{b.reward}</Text>
                                </View>
                                {b.claimed && <Text style={styles.bonusClaimed}>ได้รับแล้ว</Text>}
                            </View>
                        ))}

                        {nextBonus && (
                            <>
                                <View style={styles.nextBonusRow}>
                                    <Text style={styles.nextBonusLabel}>ถึงโบนัสถัดไป</Text>
                                    <Text style={styles.nextBonusDays}>อีก {daysLeft} วัน</Text>
                                </View>
                                <View style={styles.progressTrackBonus}>
                                    <LinearGradient
                                        colors={['#F2C24E', '#E8923A']}
                                        start={{ x: 0, y: 0.5 }}
                                        end={{ x: 1, y: 0.5 }}
                                        style={[styles.progressFillBonus, { width: `${Math.min(Math.max(bonusProgress, 0), 1) * 100}%` }]}
                                    />
                                </View>
                            </>
                        )}

                        <Text style={styles.footnote}>หมายเหตุ: ขาดเรียนเกิน 1 วัน Streak จะรีเซ็ตเป็น 0</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1, paddingHorizontal: 20 },
    content: { paddingBottom: 24 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 10,
    },
    title: {
        fontFamily: 'Jersey',
        fontSize: 28,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 1,
    },

    avatarSection: { alignItems: 'center', marginBottom: 18 },
    avatarWrap: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 8,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    name: {
        fontFamily: 'Jersey',
        fontSize: 26,
        fontWeight: '900',
        color: '#2C1810',
        letterSpacing: 1,
    },
    titleLabel: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5FBF',
        marginBottom: 10,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFE7DA',
        gap: 6,
        borderWidth: 2.5,
        borderColor: '#D8CBB5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    scoreNum: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        color: '#3A1A00',
    },

    card: {
        backgroundColor: '#FCF8EF',
        borderWidth: 2,
        borderColor: '#D8CBB5',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    cardTitle: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: '#452817',
    },
    viewAll: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '700',
        color: '#C47A30',
    },

    knowledgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    knowledgeIconWrap: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    knowledgeIcon: { fontSize: 24 },
    knowledgeBarCol: { flex: 1 },
    knowledgeLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    knowledgeLabel: {
        fontFamily: 'Jersey',
        fontSize: 18,
        fontWeight: '700',
        color: '#2C1810',
    },
    knowledgePercent: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#6E441B',
    },

    progressTrack: {
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E0D6C4',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
        backgroundColor: '#C47A30',
    },

    streakHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },

    streakBig: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 18,
    },
    streakCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#C2700F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
    },
    streakTextCol: { justifyContent: 'center' },
    streakNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    streakNum: {
        fontFamily: 'Jersey',
        fontSize: 44,
        fontWeight: '900',
        color: '#241509',
    },
    streakDayLabel: {
        fontFamily: 'PKNonthaburi',
        fontSize: 22,
        fontWeight: '700',
        color: '#2C1810',
    },
    streakSub: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#6E441B',
        opacity: 0.7,
        marginTop: 2,
    },

    weekBox: {
        backgroundColor: '#F4ECDC',
        borderWidth: 1.5,
        borderColor: '#E0D6C4',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    weekCol: { alignItems: 'center', gap: 8 },
    weekDayLabel: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '700',
        color: '#6E441B',
    },

    // ช่องวันแบบสี่เหลี่ยมมุมมน
    weekCell: {
        width: 35,
        height: 35,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekCellInactive: {
        backgroundColor: '#FBF7EE',
        borderWidth: 2,
        borderColor: '#E6DBC7',
    },
    weekCellTodayRing: {
        width: 42,
        height: 42,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#E8862B',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -3,   // ชดเชยให้ก้อนวันนี้ดูอยู่ระดับเดียวกัน
    },
    weekCellInnerToday: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekDash: { color: '#B6A88F', fontWeight: '700' },

    bonusBox: {
        backgroundColor: '#F2EAD8',
        borderRadius: 12,
        padding: 14,
    },
    bonusTitle: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#452817',
        marginBottom: 10,
    },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: '#E0D6C4',
        backgroundColor: '#FFFFFF',
    },
    bonusRowClaimed: { backgroundColor: '#DCEFD2', borderColor: '#9FD08C' },
    bonusDayBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#B7AC98',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bonusDayBadgeClaimed: { backgroundColor: '#5FA84B' },
    bonusDayNum: {
        fontFamily: 'Jersey',
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    bonusText: {
        flex: 1,
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#452817',
    },
    bonusReward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bonusRewardText: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#452817',
    },
    bonusClaimed: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '700',
        color: '#3F8A2E',
        marginLeft: 6,
    },

    nextBonusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 8,
    },
    nextBonusLabel: { fontFamily: 'PKNonthaburi', fontSize: 16, color: '#452817' },
    nextBonusDays: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '900',
        color: '#C47A30',
    },
    progressTrackBonus: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E0D6C4',
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressFillBonus: {
        height: 10,
        borderRadius: 5,
    },

    footnote: {
        fontFamily: 'PKNonthaburi',
        fontSize: 14,
        color: '#C17C66',
        textAlign: 'center',
    },
});