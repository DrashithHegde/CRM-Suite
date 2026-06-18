import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bell, X, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n) => !n.read).length);
    }

    const handleLeadCreated = (event) => addNotification('leadCreated', event.detail);
    const handleStatusUpdated = (event) => addNotification('leadStatusUpdated', event.detail);
    const handleNoteAdded = (event) => addNotification('noteAdded', event.detail);

    window.addEventListener('leadCreated', handleLeadCreated);
    window.addEventListener('leadStatusUpdated', handleStatusUpdated);
    window.addEventListener('noteAdded', handleNoteAdded);

    return () => {
      window.removeEventListener('leadCreated', handleLeadCreated);
      window.removeEventListener('leadStatusUpdated', handleStatusUpdated);
      window.removeEventListener('noteAdded', handleNoteAdded);
    };
  }, []);

  const addNotification = (type, data) => {
    const messages = {
      leadCreated: `New lead: ${data.name}`,
      leadStatusUpdated: `Lead #${data.leadId} status changed`,
      noteAdded: `New note added for lead #${data.leadId}`,
    };

    const newNotification = {
      id: Date.now(),
      type,
      message: messages[type] || 'New update',
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, 50);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount((prev) => prev + 1);
  };

  const markAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'leadCreated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'leadStatusUpdated':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case 'noteAdded':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showPanel,
        setShowPanel,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        getIcon,
      }}
    >
      {children}
      {showPanel && (
        <div className="fixed right-4 top-20 z-50 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={markAllAsRead} className="text-xs text-blue-600">
                Mark all read
              </button>
              <button onClick={clearNotifications} className="text-xs text-red-600">
                Clear
              </button>
              <button onClick={() => setShowPanel(false)} className="text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.timestamp), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
