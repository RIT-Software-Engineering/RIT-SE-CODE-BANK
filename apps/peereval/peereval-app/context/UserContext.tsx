'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => void;
}

const UserContext = createContext<UserContextType>({
    userId: "1",
    setUserId: id => {}
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("1");

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUserContext = () => useContext(UserContext);