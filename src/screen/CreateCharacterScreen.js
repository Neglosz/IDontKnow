import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const catSrc = require('../../assets/player_cat-sheet_120.png');
const TOTAL_FRAMES = 3;
const DISPLAY = 160;
const FPS = 6;

function CatSprite() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % TOTAL_FRAMES), 1000 / FPS);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ width: DISPLAY, height: DISPLAY, overflow: 'hidden' }}>
      <Image
        source={catSrc}
        style={{ width: DISPLAY * TOTAL_FRAMES, height: DISPLAY, marginLeft: -DISPLAY * frame }}
        resizeMode="cover"
      />
    </View>
  );
}

const DEFAULT_NAME = 'NOBI';
const MAX_LEN = 12;

export default function CreateCharacterScreen({ onBack, onDone }) {
  const { setCharacterName } = useAuth();
  const [name, setName] = useState('');
  const [success, setSuccess] = useState(false);

  const displayName = name.trim() || DEFAULT_NAME;
  const hasName = name.trim().length > 0;

  const handleCreate = () => {
    if (!hasName || success) return;
    setCharacterName(name.trim());
    setSuccess(true);
    setTimeout(() => onDone(), 1000);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.body}>

        {/* Title */}
        <View style={s.titleWrap}>
          <Text style={s.title}>ตั้งชื่อตัวละคร</Text>
          <Text style={s.titleSub}>ตั้งชื่อของคุณ ชื่อนี้จะแสดงในแอป</Text>
        </View>

        {/* Cat sprite */}
        <View style={s.catWrap}>
          <CatSprite />
        </View>

        {/* Character name display */}
        <View style={s.nameWrap}>
          <Text style={s.charName}>{displayName}</Text>
          <Text style={s.charRole}>นักสำรวจมือใหม่</Text>
        </View>

        {/* Input */}
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="ใส่ชื่อของคุณ"
            placeholderTextColor="#B8A898"
            maxLength={MAX_LEN}
            value={name}
            onChangeText={setName}
            editable={!success}
          />
        </View>
        <Text style={s.counter}>{name.length}/{MAX_LEN}</Text>

        {/* Create button */}
        <TouchableOpacity
          style={[s.btn, !hasName && !success && s.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleCreate}
          disabled={!hasName || success}
        >
          {hasName && !success && (
            <LinearGradient
              colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
              locations={[0, 0.15, 0.85, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {success && (
            <LinearGradient
              colors={['#82C87A', '#4A9644', '#4A9644', '#2E6A2A']}
              locations={[0, 0.15, 0.85, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text style={[s.btnText, !hasName && !success && s.btnTextDisabled]}>
            {success ? 'สร้างตัวละครสำเร็จ' : 'สร้างตัวละคร'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F1E5' },
  body: { flex: 1, paddingHorizontal: 24 },


  titleWrap: { alignItems: 'center', marginTop: 40 },
  title: {
    fontFamily: 'PKNonthaburi',
    fontSize: 26,
    fontWeight: '700',
    color: '#3A1A00',
  },
  titleSub: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#6E441B',
    marginTop: 4,
    opacity: 0.8,
  },

  catWrap: { alignItems: 'center', marginTop: 20 },

  nameWrap: { alignItems: 'center', marginTop: 20 },
  charName: {
    fontFamily: 'Jersey',
    fontSize: 32,
    fontWeight: '900',
    color: '#3A1A00',
    letterSpacing: 1,
  },
  charRole: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#7B5EA7',
    marginTop: 10,
  },

  inputWrap: {
    borderWidth: 1.5,
    borderColor: '#C9BBA4',
    borderRadius: 10,
    backgroundColor: '#FDFAF5',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
    marginTop: 20, 
  },
  input: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#3A1A00',
  },
  counter: {
    fontFamily: 'PKNonthaburi',
    fontSize: 16,
    color: '#8B6340',
    textAlign: 'right',
    marginBottom: 10,
    marginTop: 5,
  },

  btn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2C1810',
    marginBottom:150
  },
  btnDisabled: {
    backgroundColor: '#D9CEBF',
    borderColor: '#C9BBA4',
  },
  btnText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  btnTextDisabled: {
    color: '#9E8E7E',
  },
});
