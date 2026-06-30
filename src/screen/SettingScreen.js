import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
    Modal, TextInput, Switch, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import DressedCat from '../components/DressedCat';

// ---- ค่า mockup ทั้งหมด ----
const MOCK = {
    name: 'NOBI',
    title: 'นักสำรวจมือใหม่',
    email: 'user@exsample.com',
    version: '1.0.0',
};

const TIME_OPTIONS = ['08:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

// ====== Sprite sheet animation (240x80 = 3 เฟรม) ======
function SpriteFrame({ source, frameWidth, frameHeight, totalFrames, fps = 3.5, scale = 1 }) {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setFrame(prev => (prev + 1) % totalFrames);
        }, 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);

    const w = frameWidth * scale;
    const h = frameHeight * scale;

    return (
        <View style={{ width: w, height: h, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{
                    width: w * totalFrames,
                    height: h,
                    marginLeft: -w * frame,
                }}
                resizeMode="cover"
            />
        </View>
    );
}

// ====== Toggle (สีเขียวเมื่อเปิด) ======
function Toggle({ value, onValueChange }) {
    return (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#D8CBB5', true: '#4CC764' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D8CBB5"
        />
    );
}

// ====== Section header ======
function SectionHeader({ icon, label }) {
    return (
        <View style={styles.sectionHeader}>
            {icon}
            <Text style={styles.sectionLabel}>{label}</Text>
        </View>
    );
}

// ====== กล่อง modal กลางจอ ======
function ModalCard({ visible, title, onClose, children }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeaderRow}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle-outline" size={26} color="#E04A5A" />
                        </TouchableOpacity>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    );
}

// ====== ช่องกรอกรหัสผ่าน + ปุ่มดวงตา ======
function PasswordField({ placeholder, value, onChangeText }) {
    const [hidden, setHidden] = useState(true);
    return (
        <View style={styles.inputWrap}>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#B6A88F"
                secureTextEntry={hidden}
                value={value}
                onChangeText={onChangeText}
            />
            <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6E441B" />
            </TouchableOpacity>
        </View>
    );
}

export default function SettingScreen({ onNavigate }) {
    const { signOut, user, characterName, changePassword, deleteAccount } = useAuth();

    // toggles (mockup state)
    const [notifDaily, setNotifDaily] = useState(true);
    const [notifStreak, setNotifStreak] = useState(true);
    const [soundFx, setSoundFx] = useState(true);
    const [notifTime, setNotifTime] = useState('20:00');

    // modals
    const [showAccount, setShowAccount] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showTime, setShowTime] = useState(false);

    // form fields (mockup)
    const [curPw, setCurPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [deleteText, setDeleteText] = useState('');
    const [deletePw, setDeletePw] = useState('');
    const [tempTime, setTempTime] = useState(notifTime);

    const back = () => onNavigate?.('profile');

    const openTime = () => {
        setTempTime(notifTime);
        setShowTime(true);
    };

    // ── Account: เปลี่ยนรหัสผ่าน / ลบบัญชี ──
    const [pwLoading, setPwLoading] = useState(false);
    const [delLoading, setDelLoading] = useState(false);
    const CONFIRM_WORD = 'ลบบัญชีของฉัน';

    const submitPassword = async () => {
        if (newPw.length < 8) { Alert.alert('รหัสผ่านสั้นไป', 'อย่างน้อย 8 ตัวอักษร'); return; }
        if (newPw !== confirmPw) { Alert.alert('ไม่ตรงกัน', 'ยืนยันรหัสผ่านใหม่ไม่ตรงกัน'); return; }
        setPwLoading(true);
        const res = await changePassword(curPw, newPw);
        setPwLoading(false);
        if (res.error) { Alert.alert('เปลี่ยนรหัสผ่านไม่สำเร็จ', res.error); return; }
        Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        setCurPw(''); setNewPw(''); setConfirmPw('');
        setShowPassword(false);
    };

    const submitDelete = async () => {
        if (deleteText.trim() !== CONFIRM_WORD) {
            Alert.alert('ยืนยันไม่ถูกต้อง', `กรุณาพิมพ์ "${CONFIRM_WORD}" ให้ตรง`);
            return;
        }
        setDelLoading(true);
        const res = await deleteAccount(deletePw);
        setDelLoading(false);
        if (res.error) { Alert.alert('ลบบัญชีไม่สำเร็จ', res.error); return; }
        // สำเร็จ → deleteAccount เรียก signOut ให้แล้ว จอเด้งกลับ SignIn อัตโนมัติ
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={back} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="play-back" size={20} color="#C47A30" />
                        <Text style={styles.title}>SETTING</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile row */}
                <View style={styles.profileRow}>
                    <View style={styles.avatarWrap}>
                        <DressedCat size={58} />
                    </View>
                    <View style={styles.profileTextCol}>
                        <Text style={styles.profileName}>{characterName || 'ผู้เล่นใหม่'}</Text>
                        <Text style={styles.profileTitle}>{MOCK.title}</Text>
                    </View>
                </View>

                {/* Account */}
                <SectionHeader
                    icon={<Ionicons name="settings-sharp" size={18} color="#2C1810" />}
                    label="Account"
                />
                <View style={styles.card}>
                    <TouchableOpacity style={styles.rowItem} onPress={() => setShowAccount(true)}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>อีเมลที่ใช้สมัคร</Text>
                            <Text style={styles.rowSub}>{user?.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#6E441B" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.rowItem} onPress={signOut}>
                        <Ionicons name="exit-outline" size={20} color="#E04A5A" />
                        <Text style={styles.logoutText}>ออกจากระบบ</Text>
                    </TouchableOpacity>
                </View>

                {/* Notification */}
                <SectionHeader
                    icon={<Ionicons name="notifications" size={18} color="#2C1810" />}
                    label="Notification"
                />
                <View style={styles.card}>
                    <View style={styles.rowItem}>
                        <Text style={[styles.rowLabel, { flex: 1 }]}>แจ้งเตือนภารกิจประจำวัน</Text>
                        <Toggle value={notifDaily} onValueChange={setNotifDaily} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowItem}>
                        <Text style={[styles.rowLabel, { flex: 1 }]}>แจ้งเตือนความสม่ำเสมอในการเรียน</Text>
                        <Toggle value={notifStreak} onValueChange={setNotifStreak} />
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.rowItem} onPress={openTime}>
                        <Text style={[styles.rowLabel, { flex: 1 }]}>เวลาแจ้งเตือน</Text>
                        <View style={styles.timeChip}>
                            <Text style={styles.timeChipText}>{notifTime}</Text>
                            <Ionicons name="chevron-down" size={16} color="#6E441B" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Display */}
                <SectionHeader
                    icon={<Ionicons name="globe-outline" size={18} color="#2C1810" />}
                    label="Display"
                />
                <View style={styles.card}>
                    <View style={styles.rowItem}>
                        <Ionicons name="volume-medium" size={20} color="#2C1810" style={{ marginRight: 8 }} />
                        <Text style={[styles.rowLabel, { flex: 1 }]}>เสียงเอฟเฟกต์</Text>
                        <Toggle value={soundFx} onValueChange={setSoundFx} />
                    </View>
                </View>

                {/* About */}
                <SectionHeader label="About" />
                <View style={styles.card}>
                    <View style={styles.rowItem}>
                        <Text style={[styles.rowLabel, { flex: 1 }]}>เวอร์ชัน</Text>
                        <Text style={styles.versionText}>{MOCK.version}</Text>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.rowItem} onPress={() => {}}>
                        <Text style={[styles.rowLabel, { flex: 1 }]}>นโยบายความเป็นส่วนตัว</Text>
                        <Ionicons name="chevron-forward" size={22} color="#6E441B" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.rowItem} onPress={() => {}}>
                        <Text style={[styles.rowLabel, { flex: 1 }]}>ข้อกำหนดการใช้งาน</Text>
                        <Ionicons name="chevron-forward" size={22} color="#6E441B" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ===== Modal: จัดการบัญชี ===== */}
            <ModalCard visible={showAccount} title="จัดการบัญชี" onClose={() => setShowAccount(false)}>
                <Text style={styles.fieldLabel}>อีเมลที่ใช้สมัคร</Text>
                <View style={[styles.inputWrap, styles.inputDisabled]}>
                    <Ionicons name="mail-outline" size={18} color="#B6A88F" style={{ marginRight: 8 }} />
                    <Text style={styles.disabledText}>{user?.email}</Text>
                </View>
                <Text style={styles.hintText}>ไม่สามารถเปลี่ยนอีเมลได้</Text>

                <TouchableOpacity
                    style={styles.modalActionRow}
                    onPress={() => { setShowAccount(false); setShowPassword(true); }}
                >
                    <Ionicons name="lock-closed-outline" size={20} color="#452817" />
                    <Text style={styles.modalActionText}>เปลี่ยนรหัสผ่าน</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6E441B" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.modalActionRow, styles.modalActionDanger]}
                    onPress={() => { setShowAccount(false); setShowDelete(true); }}
                >
                    <Ionicons name="trash-outline" size={20} color="#E04A5A" />
                    <Text style={[styles.modalActionText, { color: '#E04A5A' }]}>ลบบัญชี</Text>
                    <Ionicons name="chevron-forward" size={20} color="#E04A5A" />
                </TouchableOpacity>
            </ModalCard>

            {/* ===== Modal: เปลี่ยนรหัสผ่าน ===== */}
            <ModalCard visible={showPassword} title="เปลี่ยนรหัสผ่าน" onClose={() => setShowPassword(false)}>
                <Text style={styles.fieldLabel}>รหัสผ่านปัจจุบัน</Text>
                <PasswordField placeholder="กรอกรหัสผ่านปัจจุบัน" value={curPw} onChangeText={setCurPw} />

                <Text style={styles.fieldLabel}>รหัสผ่านใหม่</Text>
                <PasswordField placeholder="อย่างน้อย 8 ตัวอักษร" value={newPw} onChangeText={setNewPw} />

                <Text style={styles.fieldLabel}>ยืนยันรหัสผ่านใหม่</Text>
                <PasswordField placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" value={confirmPw} onChangeText={setConfirmPw} />

                <View style={styles.modalBtnRow}>
                    <TouchableOpacity style={[styles.modalBtn, styles.btnSave]} onPress={submitPassword} disabled={pwLoading}>
                        <Text style={styles.btnSaveText}>{pwLoading ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setShowPassword(false)}>
                        <Text style={styles.btnCancelText}>ยกเลิก</Text>
                    </TouchableOpacity>
                </View>
            </ModalCard>

            {/* ===== Modal: ลบบัญชี ===== */}
            <ModalCard visible={showDelete} title="ลบบัญชี" onClose={() => setShowDelete(false)}>
                <View style={styles.warnBox}>
                    <View style={styles.warnHeaderRow}>
                        <Ionicons name="warning-outline" size={18} color="#E04A5A" />
                        <Text style={styles.warnTitle}>คำเตือน</Text>
                    </View>
                    <Text style={styles.warnText}>
                        การลบบัญชีจะทำให้ข้อมูลทั้งหมดของคุณถูกลบอย่างถาวร รวมถึง
                    </Text>
                    <Text style={styles.warnBullet}>•  ความคืบหน้าทั้งหมด</Text>
                    <Text style={styles.warnBullet}>•  ไอเทมที่ซื้อ</Text>
                    <Text style={styles.warnBullet}>•  ประวัติการเล่น</Text>
                </View>

                <Text style={styles.fieldLabel}>พิมพ์ ลบบัญชีของฉัน เพื่อยืนยัน</Text>
                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        placeholder="ลบบัญชีของฉัน"
                        placeholderTextColor="#B6A88F"
                        value={deleteText}
                        onChangeText={setDeleteText}
                    />
                </View>

                <Text style={styles.fieldLabel}>รหัสผ่านปัจจุบัน</Text>
                <PasswordField placeholder="กรอกรหัสผ่านเพื่อยืนยัน" value={deletePw} onChangeText={setDeletePw} />

                <View style={styles.modalBtnRow}>
                    <TouchableOpacity style={[styles.modalBtn, styles.btnDanger]} onPress={submitDelete} disabled={delLoading}>
                        <Text style={styles.btnSaveText}>{delLoading ? 'กำลังลบ...' : 'ลบบัญชี'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.btnMuted]} onPress={() => setShowDelete(false)}>
                        <Text style={styles.btnMutedText}>ยกเลิก</Text>
                    </TouchableOpacity>
                </View>
            </ModalCard>

            {/* ===== Modal: เลือกเวลาแจ้งเตือน ===== */}
            <ModalCard visible={showTime} title="เลือกเวลาแจ้งเตือน" onClose={() => setShowTime(false)}>
                <ScrollView style={styles.timeList} contentContainerStyle={{ paddingVertical: 4 }}>
                    {TIME_OPTIONS.map(t => {
                        const selected = t === tempTime;
                        return (
                            <TouchableOpacity
                                key={t}
                                style={[styles.timeOption, selected && styles.timeOptionActive]}
                                onPress={() => setTempTime(t)}
                            >
                                <Text style={[styles.timeOptionText, selected && styles.timeOptionTextActive]}>{t}</Text>
                                {selected && <Ionicons name="checkmark" size={18} color="#3F8A2E" />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                        style={[styles.modalBtn, styles.btnSave]}
                        onPress={() => { setNotifTime(tempTime); setShowTime(false); }}
                    >
                        <Text style={styles.btnSaveText}>บันทึก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setShowTime(false)}>
                        <Text style={styles.btnCancelText}>ยกเลิก</Text>
                    </TouchableOpacity>
                </View>
            </ModalCard>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1, paddingHorizontal: 20 },
    content: { paddingBottom: 28 },

    header: { paddingTop: 8, paddingBottom: 12 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: {
        fontFamily: 'Jersey',
        fontSize: 28,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 1,
    },

    // profile
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderTopWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: '#E0D6C4',
        marginBottom: 18,
    },
    avatarWrap: {
        width: 58,
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileTextCol: { justifyContent: 'center' },
    profileName: {
        fontFamily: 'Jersey',
        fontSize: 26,
        fontWeight: '900',
        color: '#2C1810',
        letterSpacing: 1,
    },
    profileTitle: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5FBF',
        marginTop: 2,
    },

    // section
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    sectionLabel: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        color: '#2C1810',
    },

    card: {
        backgroundColor: '#FCF8EF',
        borderWidth: 2,
        borderColor: '#D8CBB5',
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 20,
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        minHeight: 56,
    },
    divider: { height: 1.5, backgroundColor: '#EDE4D2' },
    rowLabel: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#2C1810',
    },
    rowSub: {
        fontFamily: 'Jersey',
        fontSize: 16,
        color: '#9A8A72',
        marginTop: 3,
    },
    logoutText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#E04A5A',
    },
    versionText: {
        fontFamily: 'Jersey',
        fontSize: 18,
        fontWeight: '900',
        color: '#452817',
    },
    timeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#E5DAC6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    timeChipText: {
        fontFamily: 'Jersey',
        fontSize: 18,
        fontWeight: '900',
        color: '#452817',
    },

    // ===== modal =====
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(40,30,20,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#FBF3E2',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            android: { elevation: 8 },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
            },
        }),
    },
    modalHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: 'PKNonthaburi',
        fontSize: 22,
        fontWeight: '700',
        color: '#2C1810',
    },

    fieldLabel: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#452817',
        marginBottom: 6,
        marginTop: 4,
    },
    hintText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#9A8A72',
        marginTop: 4,
        marginBottom: 8,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFDF7',
        borderWidth: 1.5,
        borderColor: '#E0D6C4',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 6,
    },
    inputDisabled: { backgroundColor: '#F0E8D8' },
    input: {
        flex: 1,
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#2C1810',
        paddingVertical: 0,
    },
    disabledText: {
        flex: 1,
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#8A7B64',
    },

    modalActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFDF7',
        borderWidth: 1.5,
        borderColor: '#E0D6C4',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginTop: 10,
    },
    modalActionDanger: {
        backgroundColor: '#FCEAEC',
        borderColor: '#F0B8BF',
    },
    modalActionText: {
        flex: 1,
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#452817',
    },

    modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSave: { backgroundColor: '#4CC764' },
    btnSaveText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    btnCancel: { backgroundColor: '#E8556A' },
    btnCancelText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    btnDanger: { backgroundColor: '#E8556A' },
    btnMuted: { backgroundColor: '#DDD2BC' },
    btnMutedText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#8A7B64',
    },

    // ลบบัญชี warning
    warnBox: {
        borderWidth: 2,
        borderColor: '#E8556A',
        borderRadius: 12,
        backgroundColor: '#FFFDF7',
        padding: 14,
        marginBottom: 14,
    },
    warnHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    warnTitle: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#E04A5A',
    },
    warnText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#452817',
        lineHeight: 22,
    },
    warnBullet: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#452817',
        marginLeft: 12,
        lineHeight: 24,
    },

    // เลือกเวลา
    timeList: { maxHeight: 220 },
    timeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFDF7',
        borderWidth: 1.5,
        borderColor: '#E0D6C4',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    timeOptionActive: {
        backgroundColor: '#E7F3E0',
        borderColor: '#9FD08C',
    },
    timeOptionText: {
        fontFamily: 'Jersey',
        fontSize: 20,
        fontWeight: '900',
        color: '#452817',
    },
    timeOptionTextActive: { color: '#3F8A2E' },
});
