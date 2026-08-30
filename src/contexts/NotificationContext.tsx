import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem, RedFlagAlert } from '../types/index.js';

interface NotificationContextType {
  notifications: NotificationItem[];
  liveTriageAlerts: RedFlagAlert[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  markAsRead: () => void;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'emergency') => void;
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'emergency';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [liveTriageAlerts, setLiveTriageAlerts] = useState<RedFlagAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'emergency' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  useEffect(() => {
    // Initial fetch of notifications
    fetch('/api/notifications/PAT-HERO-01')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});

    fetch('/api/triage/alerts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLiveTriageAlerts(data);
      })
      .catch(() => {});

    // Connect to Server-Sent Events stream
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('NEW_NOTIFICATION', (e: any) => {
      try {
        const notif = JSON.parse(e.data);
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        addToast(notif.title, notif.message, 'success');
      } catch (err) {}
    });

    eventSource.addEventListener('RED_FLAG_TRIGGERED', (e: any) => {
      try {
        const alert = JSON.parse(e.data);
        setLiveTriageAlerts(prev => [alert, ...prev]);
        addToast('EMERGENCY RED-FLAG ALERT', `${alert.patientName}: ${alert.triggerRule}`, 'emergency');
      } catch (err) {}
    });

    eventSource.addEventListener('QUEUE_UPDATED', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        addToast('Live Queue Updated', `Token ${data.token.tokenNumber} assigned. Position: ${data.queueLength}`, 'info');
      } catch (err) {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const markAsRead = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        liveTriageAlerts,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        markAsRead,
        addToast
      }}
    >
      {children}

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all transform translate-y-0 animate-bounce-short ${
              toast.type === 'emergency'
                ? 'bg-red-600 text-white border-red-400 ring-4 ring-red-300'
                : toast.type === 'success'
                ? 'bg-ayush-800 text-white border-ayush-600'
                : toast.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm tracking-wide">{toast.title}</h4>
                <p className="text-xs mt-1 text-slate-100 opacity-90">{toast.message}</p>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">Live Sync</span>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
