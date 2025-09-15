'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  MapPin
} from 'lucide-react';

const EmployeeSchedule: React.FC = () => {
  const { user } = useAuth();
  const { payments, spaces, tenants } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get tasks for the selected date
  const selectedDateObj = new Date(selectedDate);
  const tasksForDate = payments.filter(payment => {
    const dueDate = new Date(payment.dueDate);
    return dueDate.toDateString() === selectedDateObj.toDateString() && 
    payment.paymentStatus === 'pending' || payment.paymentStatus === 'overdue'
  });

  // Get completed tasks for today
  const today = new Date();
  const completedToday = payments.filter(payment => 
    payment.paymentDate
 && 
    new Date(payment.paymentDate
).toDateString() === today.toDateString() &&
    payment.processedBy === user?.userId
  );

  const getTaskPriority = (payment: any) => {
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) return { level: 'high', text: 'เร่งด่วน', color: 'bg-red-100 text-red-800' };
    if (daysDiff > 3) return { level: 'medium', text: 'สำคัญ', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'normal', text: 'ปกติ', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตารางงาน</h1>
          <p className="text-gray-600 mt-1">จัดการงานและตารางเก็บเงินประจำวัน</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">วันนี้</p>
          <p className="text-lg font-semibold text-gray-900">
            {today.toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">เลือกวันที่:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center space-x-4 ml-auto text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>เร่งด่วน</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>สำคัญ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>ปกติ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">งานที่ต้องทำวันนี้</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{tasksForDate.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">เสร็จแล้ววันนี้</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{completedToday.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">ยอดเก็บวันนี้</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                ฿{completedToday.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tasks for Selected Date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            งานวันที่ {new Date(selectedDate).toLocaleDateString('th-TH')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            มี {tasksForDate.length} งานที่ต้องดำเนินการ
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {tasksForDate.map((payment) => {
            const room = spaces.find(r => r.id === (payment.spaceId || payment.roomId));
            const tenant = tenants.find(t => t.id === payment.tenantId);
            const priority = getTaskPriority(payment);

            return (
              <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      priority.level === 'high' ? 'bg-red-500' :
                      priority.level === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">เก็บเงินห้อง {room?.spaceCode}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priority.color}`}>
                          {priority.text}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{tenant?.tenantName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{room?.zone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>กำหนดชำระ: {new Date(payment.dueDate).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">฿{payment.amountPaid || payment.amountDue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{payment.paymentType === 'monthly' ? 'รายเดือน' : 'รายปี'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {tasksForDate.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีงานในวันนี้</h3>
            <p className="text-gray-600">ไม่มีงานเก็บเงินที่ต้องดำเนินการในวันที่เลือก</p>
          </div>
        )}
      </div>

      {/* Recent Completed Tasks */}
      {completedToday.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">งานที่เสร็จแล้ววันนี้</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {completedToday.slice(0, 5).map((payment) => {
              const room = spaces.find(r => r.id === (payment.spaceId || payment.roomId));
              const tenant = tenants.find(t => t.id === payment.tenantId);

              return (
                <div key={payment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">ห้อง {room?.spaceCode}</h4>
                        <p className="text-sm text-gray-600">{tenant?.tenantName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">฿{payment.amountPaid || payment.amountDue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {payment.paymentDate
 ? new Date(payment.paymentDate
).toLocaleTimeString('th-TH') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSchedule;