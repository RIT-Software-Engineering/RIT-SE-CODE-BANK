import { useEffect } from "react";
import { Icons, TypeStyles } from "@/utils/notificationsUtils";

export default function Notification({ notification, onDismiss }) {
  const { message, type } = notification;

  // Automatically dismiss the notification after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    // Positioning the notification at the top-center of the screen
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div
        className={`flex items-center p-4 rounded-lg shadow-lg border ${TypeStyles[type]}`}
        role="alert"
      >
        <div className="flex-shrink-0">{Icons[type]}</div>
        <div className="ml-3 text-sm font-medium">{message}</div>
        <button
          onClick={onDismiss}
          className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 ${TypeStyles[type]} hover:bg-opacity-50 focus:ring-2 focus:ring-offset-2`}
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}