'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Notification, { NotificationType } from '@/components/Notification';

interface NotificationData {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextValue {
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback(
    (message: string, type: NotificationType, duration: number = 5000) => {
      const id = Math.random().toString(36).substring(7);

      setNotifications((prev) => [
        ...prev,
        {
          id,
          message,
          type,
          duration,
        },
      ]);
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'success', duration);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'error', duration);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'warning', duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'info', duration);
    },
    [showNotification]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}

      {/* Render notifications */}
      <div className="notification-container">
        {notifications.map((notification, index) => (
          <div key={notification.id} style={{ marginBottom: index > 0 ? '0.5rem' : 0 }}>
            <Notification
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        .notification-container {
          position: fixed;
          top: 0;
          right: 0;
          padding: 2rem;
          z-index: 9999;
          pointer-events: none;
        }

        .notification-container > div {
          pointer-events: auto;
        }

        @media (max-width: 640px) {
          .notification-container {
            padding: 1rem;
            left: 0;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return context;
}
