import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { AuthProvider, useAuth } from './src/context/AuthContext';
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

function AppScreens() {
  const { user, isNewUser, clearNewUser } = useAuth();
  const [screen, setScreen] = useState('scan');
  const [navParams, setNavParams] = useState(null);

  const navigate = (next, params) => {
    setNavParams(params ?? null);
    setScreen(next);
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: '#120E08' }}>
      <StatusBar style="dark" />
      {screen === 'scan'         && <ScanScreen onNavigate={navigate} />}
      {screen === 'scan-loading' && <ScanLoading onNavigate={navigate} />}
      {screen === 'select-lens'  && <SelectLens onNavigate={navigate} />}
      {screen === 'learn'        && <KnowledgeScreen onNavigate={navigate} {...navParams} />}
      {screen === 'calibrate'    && <CalibrateScreen onNavigate={navigate} {...navParams} />}
      {screen === 'skill-tree'   && <SkillTreeScreen onNavigate={navigate} {...navParams} />}
      {screen === 'game-hardware' && <Game onNavigate={navigate} {...navParams} />}
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
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#120E08' }}>
        <AuthProvider>
          <AppScreens />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({});
