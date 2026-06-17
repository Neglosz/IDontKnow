import React, { createContext, useContext, useState } from 'react';

const MOCK_USERS = [
  { id: '1', email: 'test@test.com', password: '123456', name: 'ผู้ใช้ทดสอบ' },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [characterName, setCharacterName] = useState('');

  const signIn = (email, password) => {
    const found = MOCK_USERS.find(
      u => u.email === email.trim() && u.password === password
    );
    if (!found) return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    setUser(found);
    return { user: found };
  };

  const signUp = (name, email, password) => {
    const exists = MOCK_USERS.find(u => u.email === email.trim());
    if (exists) return { error: 'อีเมลนี้ถูกใช้งานแล้ว' };
    const newUser = { id: String(Date.now()), name, email: email.trim(), password };
    MOCK_USERS.push(newUser);
    setIsNewUser(true);
    setUser(newUser);
    return { user: newUser };
  };

  const signOut = () => setUser(null);
  const clearNewUser = () => setIsNewUser(false);

  return (
    <AuthContext.Provider value={{ user, isNewUser, characterName, setCharacterName, signIn, signUp, signOut, clearNewUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
