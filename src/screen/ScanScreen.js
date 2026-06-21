import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Animated,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';

const hippoSrc = require('../../assets/hippo.png');
const catSrc = require('../../assets/player_cat-sheet_120.png');
const starSrc = require('../../assets/star.png');

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

function CameraIcon({ size = 56, color = '#6B4220' }) {
    const s = size;
    return (
        <Svg width={s} height={s * 0.82} viewBox="0 0 56 46">
            <Rect x="2" y="12" width="52" height="32" rx="6" ry="6"
                fill="none" stroke={color} strokeWidth="3" />
            <Rect x="18" y="2" width="20" height="12" rx="4" ry="4"
                fill="none" stroke={color} strokeWidth="3" />
            <Circle cx="28" cy="28" r="9" fill="none" stroke={color} strokeWidth="2.5" />
            <Circle cx="28" cy="28" r="4.5" fill="none" stroke={color} strokeWidth="2" />
            <Circle cx="44" cy="20" r="2.5" fill={color} />
        </Svg>
    );
}

function ViewfinderBrackets() {
    const SIZE = 32;
    const THICK = 5;
    const col = '#6E441B';
    const corners = [
        { top: 18, left: 18, borderTopWidth: THICK, borderLeftWidth: THICK },
        { top: 18, right: 18, borderTopWidth: THICK, borderRightWidth: THICK },
        { bottom: 18, left: 18, borderBottomWidth: THICK, borderLeftWidth: THICK },
        { bottom: 18, right: 18, borderBottomWidth: THICK, borderRightWidth: THICK },
    ];
    return (
        <>
            {corners.map((pos, i) => (
                <View
                    key={i}
                    style={{ position: 'absolute', width: SIZE, height: SIZE, borderColor: col, ...pos }}
                />
            ))}
        </>
    );
}
function ScanCamera() {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraOn, setCameraOn] = useState(false);
    const [autofocus, setAutofocus] = useState('on');
    const [focusPoint, setFocusPoint] = useState(null);

    const ringScale = useRef(new Animated.Value(1)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;
    const refocusTimer = useRef(null);
    const hideTimer = useRef(null);

    useEffect(() => {
        return () => {
            clearTimeout(refocusTimer.current);
            clearTimeout(hideTimer.current);
        };
    }, []);

    const toggleCamera = async () => {
        if (!cameraOn) {
            if (!permission?.granted) {
                const res = await requestPermission();
                if (!res.granted) return;
            }
            setCameraOn(true);
        } else {
            setCameraOn(false);
        }
    };

    // แตะเพื่อโฟกัส: ขยับวงโฟกัสไปจุดที่แตะ แล้วสั่งโฟกัสใหม่
    const handleFocus = (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setFocusPoint({ x: locationX, y: locationY });

        // กระตุ้นออโต้โฟกัสใหม่ด้วยการสลับค่า
        setAutofocus('off');
        clearTimeout(refocusTimer.current);
        refocusTimer.current = setTimeout(() => setAutofocus('on'), 60);

        // อนิเมชันวงโฟกัส
        ringScale.setValue(1.5);
        ringOpacity.setValue(1);
        Animated.parallel([
            Animated.timing(ringScale, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();

        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
            Animated.timing(ringOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
        }, 700);
    };

    return (
        <View style={styles.cameraRoot}>
            {cameraOn ? (
                <Pressable style={styles.cameraWrap} onPress={handleFocus}>
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        autofocus={autofocus}
                    />
                    {focusPoint && (
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.focusRing,
                                {
                                    left: focusPoint.x - 36,
                                    top: focusPoint.y - 36,
                                    opacity: ringOpacity,
                                    transform: [{ scale: ringScale }],
                                },
                            ]}
                        />
                    )}
                    <TouchableOpacity style={styles.camToggleBtn} onPress={toggleCamera} activeOpacity={0.85}>
                        <Ionicons name="power" size={20} color="#fff" />
                    </TouchableOpacity>
                </Pressable>
            ) : (
                <TouchableOpacity style={styles.vfCenter} activeOpacity={0.8} onPress={toggleCamera}>
                    <ViewfinderBrackets />
                    <Ionicons name="camera-outline" size={72} color="#6E441B" />
                    <Text style={styles.vfMainText}>แตะเพื่อเปิดกล้อง</Text>
                    <Text style={styles.vfSubText}>เปิดกล้องเพื่อเริ่มสแกนสิ่งของรอบตัว</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

function ChatMessage({ side, name, avatar, children }) {
    const right = side === 'right';
    return (
        <View style={[styles.msgRow, right && styles.msgRowRight]}>
            {!right && avatar}

            <View style={[styles.msgCol, right ? styles.msgColRight : styles.msgColLeft]}>
                <Text style={[styles.msgName, right && styles.msgNameRight]}>{name}</Text>

                <View style={[styles.bubble, right ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text
                        style={styles.bubbleText}
                        textBreakStrategy="highQuality"
                        lineBreakStrategyIOS="standard"
                    >
                        {children}
                    </Text>
                </View>
            </View>

            {right && avatar}
        </View>
    );
}

export default function ScanScreen({ onNavigate }) {
    const { stars } = useAuth();
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                {/* HEADER — ปักไว้ด้านบน ไม่เลื่อน */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.appTitle}>I DON'T KNOW.exe</Text>
                        <Text style={styles.appSub}>SCAN • LEARN</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                        <Image source={starSrc} style={{ width: 18, height: 18 }} resizeMode="contain" />
                        <Text style={styles.scoreNum}>{stars}</Text>
                    </View>
                </View>

                {/* ส่วนกลาง — flex ยืด/หดตามจอ (ไม่มี scroll) */}
                <View style={styles.content}>
                    <View style={styles.viewfinder}>
                        <ScanCamera />

                        <Text style={styles.vfHint}>เช่น อุปกรณ์ไฟฟ้า  สิ่งของ  หรือสถานที่</Text>
                    </View>

                    <View style={styles.dialog}>
                        <ChatMessage
                            side="left"
                            name="PIPO"
                            avatar={
                                <SpriteFrame
                                    source={hippoSrc}
                                    frameWidth={90}
                                    frameHeight={90}
                                    totalFrames={4}
                                    fps={5}
                                />
                            }
                        >
                            ลองสแกนสิ่งรอบตัวดูสิ NOBI~ อาจมีเรื่องน่าสนใจซ่อนอยู่ก็ได้นะ!
                        </ChatMessage>

                        <ChatMessage
                            side="right"
                            name="NOBI"
                            avatar={
                                <View style={styles.catWrap}>
                                    <SpriteFrame
                                        source={catSrc}
                                        frameWidth={120}
                                        frameHeight={120}
                                        totalFrames={3}
                                        fps={3.5}
                                    />
                                </View>
                            }
                        >
                            อื้อ! อุปกรณ์ชิ้นนี้ทำงานยังไงนะ? มาลองสแกนดูให้รู้กันไปเลย!
                        </ChatMessage>
                    </View>
                </View>

                {/* CTA — ปักไว้เหนือ NavBar เสมอ ไม่จม */}
                <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={() => onNavigate?.('scan-loading')}>
                    <LinearGradient
                        colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                        locations={[0, 0.15, 0.85, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.ctaText}>ออกสำรวจ !</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#F7F1E5',
    },
    body: {
        flex: 1,
        paddingHorizontal: 20,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 8,
        paddingBottom: 14,
    },
    appTitle: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: "#C47A30",
        letterSpacing: 0.4,
    },
    appSub: {
        fontFamily: 'Jersey',
        fontSize: 14,
        fontWeight: '800',
        color: "#6E441B",
        letterSpacing: 2.5,
        marginTop: 3,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 2.5,
        borderColor: '#3A1A00',
        borderRadius: 10,
        paddingHorizontal: 3,
        paddingVertical: 3,
    },
    scoreNum: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: '#3A1A00',
    },

    content: {
        flex: 1,
    },

    viewfinder: {
        borderWidth: 5,
        borderColor: '#452817',
        borderRadius: 10,
        flex: 1,
        minHeight: 200,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 20,
    },
    cameraRoot: {
        flex: 1,
    },
    vfCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 10,
    },
    cameraWrap: {
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: '#000',
        position: 'relative',
    },
    focusRing: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2.5,
        borderColor: '#FFE08A',
    },
    camToggleBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    vfMainText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '700',
        color: "#6E441B",
    },
    vfSubText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 14,
        color: "#6E441B",
        opacity:0.6
    },
    vfHint: {
        position: 'absolute',
        bottom: 12,
        alignSelf: 'center',
        fontFamily: 'PKNonthaburi',
        textAlign: 'center',
        fontSize: 15,
        color: '#F7F1E5',
        backgroundColor: 'rgba(44,24,16,0.55)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },

    dialog: {
        marginTop: 8,
    },
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 18,
    },
    msgRowRight: {},
    msgCol: { flex: 1 },
    msgColLeft: { alignItems: 'flex-start' },
    msgColRight: { alignItems: 'flex-end' },

    msgName: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C77A20',
        letterSpacing: 1,
        marginBottom: 4,
        marginLeft: 4,
    },
    msgNameRight: {
        marginLeft: 0,
        marginRight: 4,
    },

    bubble: {
        maxWidth: '100%',
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bubbleLeft: { borderBottomLeftRadius: 5 },
    bubbleRight: { borderBottomRightRadius: 5 },
    bubbleText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
        lineHeight: 30,
    },

    catWrap: {
        transform: [{ scaleX: -1 }],
    },

    ctaBtn: {
        overflow: 'hidden',
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    ctaText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});