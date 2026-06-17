import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import MenuScreen from './src/screen/MenuScreen';
import HardwareGame from './src/screen/Game';
import SoftwareGame from './src/screen/SoftwareGame';
import ScanScreen from './src/screen/ScanScreen';
import ScanLoading from './src/screen/ScanLoading';
import SelectLens from './src/screen/SelectLens';
import KnowledgeScreen from './src/screen/KnowledgeScreen';
import CalibrateScreen from './src/screen/CalibrateScreen';
import SkillTreeScreen from './src/screen/SkillTreeScreen';

export default function App() {
  const [screen, setScreen] = useState('scan');
  const [navParams, setNavParams] = useState(null);

  const navigate = (next, params) => {
    setNavParams(params ?? null);
    setScreen(next);
  };

  const [fontsLoaded] = useFonts({
    'PKNonthaburi': require('./assets/PK Nonthaburi Demo.ttf'),
    'Jersey': require('./assets/Jersey25.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
    <View style={{ flex: 1, backgroundColor: '#120E08' }}>
      {/* <StatusBar style="light" />

      {screen === 'menu' && <MenuScreen onSelect={setScreen} />}
      {screen === 'hardware' && <HardwareGame />}
      {screen === 'software' && <SoftwareGame />} */}

      {/* floating back button — only shown inside a game */}
      {/* {screen !== 'menu' && (
        <TouchableOpacity style={s.backBtn} onPress={() => setScreen('menu')}>
          <Text style={s.backText}>← MENU</Text>
        </TouchableOpacity>
      )} */}
      {screen === 'scan' && <ScanScreen onNavigate={navigate} />}
      {screen === 'scan-loading' && <ScanLoading onNavigate={navigate} />}
      {screen === 'select-lens' && <SelectLens onNavigate={navigate} />}
      {screen === 'learn' && <KnowledgeScreen onNavigate={navigate} {...navParams} />}
      {screen === 'calibrate' && <CalibrateScreen onNavigate={navigate} {...navParams} />}
      {screen === 'skill-tree' && <SkillTreeScreen onNavigate={navigate} {...navParams} />}
    </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 12,
    backgroundColor: '#2C1B10',
    borderWidth: 2,
    borderColor: '#C97D10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  backText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    color: '#C97D10',
    letterSpacing: 1,
  },
});
