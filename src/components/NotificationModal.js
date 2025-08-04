import React, { useRef, useEffect } from 'react';
import { FiBell, FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';

const NotificationModal = ({ isOpen, onClose, triggerRef }) => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
  const modalRef = useRef();

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current && 
        !modalRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  // Position the modal near the notification button
  const getModalPosition = () => {
    if (!triggerRef.current) return { top: '60px', right: '20px' };
    
    const buttonRect = triggerRef.current.getBoundingClientRect();
    return {
      top: `${buttonRect.bottom + 8}px`,
      right: `${window.innerWidth - buttonRect.right}px`
    };
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <FiAlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <FiX className="w-4 h-4 text-red-600" />;
      default:
        return <FiInfo className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Now';
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
        style={getModalPosition()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <FiBell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            notification.read 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-xs mt-0.5 ${
                            notification.read 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-gray-700 dark:text-gray-200'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  Read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 3 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationModal;
