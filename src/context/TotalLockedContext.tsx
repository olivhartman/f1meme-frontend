import React, { createContext, useContext, useState } from 'react';

interface TotalLockedContextType {
  totalLockedTokens: number;
  setTotalLockedTokens: (value: number) => void;
}

const TotalLockedContext = createContext<TotalLockedContextType>({
  totalLockedTokens: 0,
  setTotalLockedTokens: () => {},
});

export const TotalLockedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalLockedTokens, setTotalLockedTokens] = useState(0);

  return (
    <TotalLockedContext.Provider value={{ totalLockedTokens, setTotalLockedTokens }}>
      {children}
    </TotalLockedContext.Provider>
  );
};

export const useTotalLocked = () => useContext(TotalLockedContext); 