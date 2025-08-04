import React, { useState } from 'react';
import { FiBell, FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';

const Notifications = () => {
  // Sample notifications data - in a real app this would come from an API
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'FAIR Score Generated',
      message: 'Your dataset "Synthea Patient Data" has received a FAIR score of 78%',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Dataset Upload Complete',
      message: 'Your upload "Medical Imaging Study" has been successfully processed',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Project Visualization Updated',
      message: 'Your project "Healthcare Analytics" dashboard has been automatically updated with new data',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: true
    },
    {
      id: 4,
      type: 'info',
      title: 'Welcome to RWDE',
      message: 'Get started by uploading your first dataset or exploring sample data',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true
    }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <FiX className="w-5 h-5 text-red-600" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type, read) => {
    const baseClasses = read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20';
    switch (type) {
      case 'success':
        return read ? baseClasses : 'bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return read ? baseClasses : 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return read ? baseClasses : 'bg-red-50 dark:bg-red-900/20';
      default:
        return baseClasses;
    }
  };

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

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiBell className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <FiBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${getNotificationBg(notification.type, notification.read)} 
                  border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          notification.read 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          notification.read 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-gray-700 dark:text-gray-200'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notifications are automatically cleared after 30 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
