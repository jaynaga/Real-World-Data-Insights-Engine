import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Sample notifications data - in a real app this would come from an API
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'FAIR Score Generated',
      message: 'Dataset "Synthea Patient Data" scored 78%',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Dataset Upload Complete',
      message: 'Upload "Medical Imaging Study" processed',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Project Updated',
      message: 'Dashboard "Healthcare Analytics" refreshed',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: true
    },
    {
      id: 4,
      type: 'info',
      title: 'Welcome to RWDE',
      message: 'Get started by uploading your first dataset',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    setNotifications([newNotification, ...notifications]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
