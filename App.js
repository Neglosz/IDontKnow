import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WardrobeProvider } from './src/context/WardrobeContext';
import SignInScreen from './src/screen/SignInScreen';
import SignUpScreen from './src/screen/SignUpScreen';
import ForgotPasswordScreen from './src/screen/ForgotPasswordScreen';
import WelcomeScreen from './src/screen/WelcomeScreen';
import CreateCharacterScreen from './src/screen/CreateCharacterScreen';
import ScanScreen from './src/screen/ScanScreen';
import ScanLoading from './src/screen/ScanLoading';
import SelectLens from './src/screen/SelectLens';
import KnowledgeScreen from './src/screen/KnowledgeScreen';
import CalibrateScreen from './src/screen/CalibrateScreen';
import SkillTreeScreen from './src/screen/SkillTreeScreen';
import Game from './src/screen/Game';
import ProfileScreen from './src/screen/ProfileScreen';
import SettingScreen from './src/screen/SettingScreen';
import HistoryMap from './src/screen/HistoryMap';
import ShopScreen from './src/screen/ShopScreen';
import NavBar from './src/components/NavBar';
import DailyRewardModal from './src/components/DailyRewardModal';

// แมปหน้า -> แท็บ navbar ที่ active (หน้าไหนไม่อยู่ในนี้ = ไม่มี navbar เช่น scan-loading / game)
const NAV_ACTIVE = {
  scan:          'scan',
  'select-lens': 'scan',
  calibrate:     'scan',
  learn:         'shop',
  quest:         'quest',
  'skill-tree':  'quest',
  profile:       'profile',
  setting:       'profile',
  shop:          'shop',
  map:           'map',
};

function AppScreens() {
  const { user, isNewUser, clearNewUser, loading } = useAuth();
  const [screen, setScreen] = useState('scan');
  const [navParams, setNavParams] = useState(null);

  const navigate = (next, params) => {
    setNavParams(params ?? null);
    setScreen(next);
  };

  // ระหว่างกู้ session ตอนเปิดแอป — กันไม่ให้กระพริบหน้า SignIn
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#F7F1E5' }} />;
  }

  if (!user) {
    if (screen === 'signup')          return <SignUpScreen onNavigate={setScreen} />;
    if (screen === 'forgot-password') return <ForgotPasswordScreen onNavigate={setScreen} />;
    return <SignInScreen onNavigate={setScreen} />;
  }

  if (isNewUser) {
    if (screen === 'create-character') {
      return (
        <CreateCharacterScreen
          onBack={() => setScreen('welcome')}
          onDone={() => { clearNewUser(); setScreen('scan'); }}
        />
      );
    }
    return <WelcomeScreen onStart={() => setScreen('create-character')} />;
  }

  const navActive = NAV_ACTIVE[screen];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F1E5' }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {screen === 'scan-loading'  ? <ScanLoading onNavigate={navigate} />
         : screen === 'select-lens'  ? <SelectLens onNavigate={navigate} />
         : screen === 'learn'        ? <KnowledgeScreen onNavigate={navigate} {...navParams} />
         : screen === 'calibrate'    ? <CalibrateScreen onNavigate={navigate} {...navParams} />
         : screen === 'skill-tree'   ? <SkillTreeScreen onNavigate={navigate} {...navParams} />
         : screen === 'quest'        ? <SkillTreeScreen onNavigate={navigate} {...navParams} />
         : screen === 'game-hardware' ? <Game onNavigate={navigate} {...navParams} />
         : screen === 'profile'      ? <ProfileScreen onNavigate={navigate} />
         : screen === 'setting'      ? <SettingScreen onNavigate={navigate} />
         : screen === 'shop'         ? <ShopScreen onNavigate={navigate} />
         : screen === 'map'          ? <HistoryMap onNavigate={navigate} />
         : <ScanScreen onNavigate={navigate} />}
      </View>
      {navActive && <NavBar active={navActive} onPress={navigate} />}
      {/* ป๊อปอัปเช็คอินรายวัน — เด้งเองตอนเปิดแอปวันแรกของวัน */}
      <DailyRewardModal />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'PKNonthaburi': require('./assets/PK Nonthaburi Demo.ttf'),
    'Jersey': require('./assets/Jersey25.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#120E08' }}>
          <AuthProvider>
            <WardrobeProvider>
              <AppScreens />
            </WardrobeProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({});
