import { createContext, useContext, useMemo, useState } from 'react';
const LanguageContext = createContext();
export function LanguageProvider({
  children
}) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('spms-language') || 'en');
  function setLanguage(value) {
    setLanguageState(value);
    localStorage.setItem('spms-language', value);
  }
  const value = useMemo(() => ({
    language,
    setLanguage,
    tamil: language === 'ta'
  }), [language]);
  return <LanguageContext.Provider value={value}>
    {children}
  </LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
