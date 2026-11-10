"use client";
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();


export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(); 

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserState(JSON.parse(stored));
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);
  
  // Wrap setUser to update state and storage
  const setUser = (u) => setUserState(u);

const logout = () => setUser(undefined);


  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUser = () => useContext(UserContext);
