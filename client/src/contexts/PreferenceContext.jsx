import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTranslator } from '../lib/i18n.js';

const PreferenceContext = createContext(null);

export function PreferenceProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('bankikhata_language') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('bankikhata_theme') || 'light');

  useEffect(() => {
    localStorage.setItem('bankikhata_language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('bankikhata_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t: createTranslator(language)
    }),
    [language, theme]
  );

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreference() {
  return useContext(PreferenceContext);
}
