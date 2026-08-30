import React, { createContext, useContext, useState, useEffect } from 'react';

interface HighContrastContextType {
  highContrast: boolean;
  largeFont: boolean;
  toggleHighContrast: () => void;
  toggleLargeFont: () => void;
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined);

export const HighContrastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [largeFont, setLargeFont] = useState<boolean>(false);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleLargeFont = () => setLargeFont(prev => !prev);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    if (largeFont) {
      document.documentElement.classList.add('large-font');
    } else {
      document.documentElement.classList.remove('large-font');
    }
  }, [largeFont]);

  return (
    <HighContrastContext.Provider value={{ highContrast, largeFont, toggleHighContrast, toggleLargeFont }}>
      {children}
    </HighContrastContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(HighContrastContext);
  if (!context) throw new Error('useAccessibility must be used within HighContrastProvider');
  return context;
};
