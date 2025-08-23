'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Bell, 
  Filter, 
  Check,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Wrench
} from 'lucide-react';

const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationAsRead, deleteNotification } = useData();
  const [filter, setFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_due':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'payment_overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'contract_expiring':
        return <Calendar className="w-5 h-5 text-orange-600" />;
      case 'maintenance_required':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setIsSubmitting(true);
    try {
    await markNotificationAsRead(notificationId);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนนี้?')) {
      setIsSubmitting(true);
      try {
        await deleteNotification(notificationId);
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบการแจ้งเตือน');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-gray-600 mt-1">
            การแจ้งเตือนทั้งหมด {notifications.length} รายการ 
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                ยังไม่อ่าน {unreadCount} รายการ
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ยังไม่อ่าน ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('payment_overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'payment_overdue'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            เกินกำหนดชำระ
          </button>
          <button
            onClick={() => setFilter('payment_due')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'payment_due'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ใกล้ครบกำหนด
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-xl shadow-sm border-l-4 ${getPriorityColor(notification.priority)} p-6 ${
              !notification.isRead ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{notification.createdAt.toLocaleDateString('th-TH')}</span>
                    <span>{notification.createdAt.toLocaleTimeString('th-TH')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                      notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.priority === 'high' ? 'สำคัญมาก' :
                       notification.priority === 'medium' ? 'สำคัญ' : 'ปกติ'}
                    </span>
                  </div>
                </div>
              </div>
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
                </button>
              )}
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                disabled={isSubmitting}
                className="flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                <span>ลบ</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
          <p className="text-gray-600">
            {filter === 'all' ? 'ไม่มีการแจ้งเตือนในระบบ' : 'ไม่มีการแจ้งเตือนในหมวดหมู่นี้'}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;