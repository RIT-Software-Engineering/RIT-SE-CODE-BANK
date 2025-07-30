"use client";

import React, { createContext, useState, useContext, useCallback } from 'react';
import Notification from '@/components/common/models/NotificationModel';

// Create the context
const NotificationContext = createContext(null);

// Create a custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Create the provider component
export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  // Use useCallback to prevent unnecessary re-renders of consuming components
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification({ message: '', type: 'success' });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {/* The actual notification UI component */}
      <Notification notification={notification} onDismiss={hideNotification} />
      {children}
    </NotificationContext.Provider>
  );
}
