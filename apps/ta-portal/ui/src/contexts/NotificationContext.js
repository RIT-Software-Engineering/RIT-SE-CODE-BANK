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


/**
 * The NotificationProvider component provides a context for showing and hiding notifications.
 *
 * The value passed to the context is an object with a single property, `showNotification`, which is a
 * function that takes a message and an optional type (defaulting to 'success') and shows a notification
 * with the given message and type.
 *
 * The `NotificationProvider` component itself renders a `Notification` component with the current
 * notification state and a callback to hide the notification when the user dismisses it.
 *
 * The consumer of the context can call `showNotification` to show a notification, and the notification
 * will be automatically hidden after 5 seconds.
 *
 * @param {ReactNode} children The children of the component.
 * @example
 * import { NotificationProvider, useNotification } from '@/contexts/NotificationContext';
 *
 * function MyComponent() {
 *   const { showNotification } = useNotification();
 *
 *   return (
 *     <div>
 *       <button onClick={() => showNotification('This is a notification')}>
 *         Show Notification
 *       </button>
 *     </div>
 *   );
 * }
 *
 * function App() {
 *   return (
 *     <NotificationProvider>
 *       <MyComponent />
 *     </NotificationProvider>
 *   );
 * }
 */
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
