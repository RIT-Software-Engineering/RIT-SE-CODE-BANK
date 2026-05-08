"use client";
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();


export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState();

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Wrap setUser to update state
  const setUser = (u) => setUserState(u);

  const logout = () => {
    localStorage.removeItem("user");
    setUserState(undefined);
  };


  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUser = () => useContext(UserContext);
