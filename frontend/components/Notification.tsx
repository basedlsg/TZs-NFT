'use client';

import { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

/**
 * Notification/Toast Component
 *
 * Displays temporary notification messages
 */
export default function Notification({
  message,
  type,
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: {
      bg: '#48bb78',
      border: '#38a169',
      text: '#ffffff',
    },
    error: {
      bg: '#f56565',
      border: '#e53e3e',
      text: '#ffffff',
    },
    warning: {
      bg: '#ed8936',
      border: '#dd6b20',
      text: '#ffffff',
    },
    info: {
      bg: '#4299e1',
      border: '#3182ce',
      text: '#ffffff',
    },
  };

  const color = colors[type];

  return (
    <div className={`notification ${isExiting ? 'exiting' : ''}`}>
      <div className="notification-icon">{icons[type]}</div>
      <div className="notification-message">{message}</div>
      <button className="notification-close" onClick={handleClose} aria-label="Close">
        ×
      </button>

      <style jsx>{`
        .notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          min-width: 300px;
          max-width: 500px;
          background-color: ${color.bg};
          color: ${color.text};
          border-left: 4px solid ${color.border};
          border-radius: 4px;
          padding: 1rem 1.25rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        }

        .notification.exiting {
          animation: slideOut 0.3s ease-in;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .notification-icon {
          font-size: 1.5rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .notification-message {
          flex: 1;
          line-height: 1.5;
        }

        .notification-close {
          background: none;
          border: none;
          color: ${color.text};
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          transition: background-color 0.2s;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 640px) {
          .notification {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}
