'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useData } from '@/lib/contexts/DataContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  User,
  MapPin,
  Target,
  Filter,
  Search
} from 'lucide-react';

const EmployeeSchedule: React.FC = () => {
  const { user } = useAuth();
  const { payments, spaces, tenants, loading } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // All overdue and today's tasks
  const allOverdueTasks = useMemo(() => {
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return payments.filter(payment => {
      // Only unpaid payments
      if (payment.status === 'paid' || payment.paymentStatus === 'paid') return false;
      
      const dueDate = new Date(payment.dueDate);
      
      // Include all overdue and today's payments
      return dueDate < endOfToday;
    }).filter(payment => {
      // Apply search filter
      if (!searchTerm) return true;
      
      const space = spaces.find(s => s.id === (payment.spaceId || payment.roomId));
      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
      
      const searchString = `${space?.spaceCode || ''} ${tenant?.tenantName || ''} ${space?.zone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  }, [payments, searchTerm, spaces, tenants]);

  // Today's tasks only
  const todaysTasks = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    return payments.filter(payment => {
      // Only unpaid payments
      if (payment.status === 'paid' || payment.paymentStatus === 'paid') return false;
      
      const dueDate = new Date(payment.dueDate);
      
      // Only today's payments
      return dueDate >= startOfToday && dueDate < endOfToday;
    }).filter(payment => {
      // Apply search filter
      if (!searchTerm) return true;
      
      const space = spaces.find(s => s.id === (payment.spaceId || payment.roomId));
      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
      
      const searchString = `${space?.spaceCode || ''} ${tenant?.tenantName || ''} ${space?.zone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  }, [payments, searchTerm, spaces, tenants]);

  // Enhanced task filtering for selected date
  const tasksForDate = useMemo(() => {
    const selectedDateObj = new Date(selectedDate);
    const endOfDay = new Date(selectedDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    return payments.filter(payment => {
      // Only unpaid payments
      if (payment.status === 'paid' || payment.paymentStatus === 'paid') return false;
      
      const dueDate = new Date(payment.dueDate);
      
      // Include overdue payments and payments due on selected date
      return dueDate <= endOfDay;
    }).filter(payment => {
      // Apply search filter
      if (!searchTerm) return true;
      
      const space = spaces.find(s => s.id === (payment.spaceId || payment.roomId));
      const tenant = tenants.find(t => t.tenantId === payment.tenantId);
      
      const searchString = `${space?.spaceCode || ''} ${tenant?.tenantName || ''} ${space?.zone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  }, [payments, selectedDate, searchTerm, spaces, tenants]);

  // Get completed tasks for today (only for completed tasks section)
  const completedToday = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return payments.filter(payment => 
      payment.paymentDate && 
      new Date(payment.paymentDate) >= startOfDay &&
      new Date(payment.paymentDate) < endOfDay &&
      payment.processedBy === user?.id
    );
  }, [payments, user?.id]);

  // Enhanced priority calculation
  const getTaskPriority = (payment: any) => {
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) return { 
      level: 'high', 
      text: 'ເຮັ່ງດ່ວນ', 
      color: 'bg-red-100 text-red-800 border-red-200',
      textColor: 'text-red-700',
      bgColor: 'bg-red-500'
    };
    if (daysDiff > 3) return { 
      level: 'medium', 
      text: 'ສຳຄັນ', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-500'
    };
    if (daysDiff >= 0) return { 
      level: 'normal', 
      text: 'ປົກກະຕິ', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-500'
    };
    return { 
      level: 'upcoming', 
      text: 'ຈະມາເຖິງ', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-500'
    };
  };

  // Filter tasks by priority
  const filteredTasks = useMemo(() => {
    if (priorityFilter === 'all') return tasksForDate;
    return tasksForDate.filter(payment => {
      const priority = getTaskPriority(payment);
      return priority.level === priorityFilter;
    });
  }, [tasksForDate, priorityFilter]);

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'daily': return 'ລາຍວັນ';
      case 'monthly': return 'ລາຍເດືອນ';
      case 'yearly': return 'ລາຍປີ';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">ຕາຕະລາງວຽກພະນັກງານ</h1>
            <p className="text-gray-600 mt-1">ຈັດການວຽກ ແລະ ຕາຕະລາງເກັບເງິນປະຈຳວັນ</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center lg:text-right">
              <p className="text-sm text-gray-500">ມື້ນີ້</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('lo-LA')}
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>ເຮັ່ງດ່ວນ</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>ສຳຄັນ</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>ປົກກະຕິ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-xl p-4 lg:p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-red-600">ວຽກທີ່ຕ້ອງເຮັດທັງໝົດ</p>
                <p className="text-xl lg:text-2xl font-bold text-red-700 mt-1">{allOverdueTasks.length}</p>
                <p className="text-xs text-red-500 mt-1">ລວມເກີນກຳນົດ ແລະ ມື້ນີ້</p>
              </div>
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 lg:p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-blue-600">ວຽກທີ່ຕ້ອງເຮັດມື້ນີ້</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-700 mt-1">{todaysTasks.length}</p>
                <p className="text-xs text-blue-500 mt-1">ກຳນົດຊຳລະວັນນີ້ເທົ່ານັ້ນ</p>
              </div>
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center space-x-4 flex-1">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">ຊ່ວງວັນທີ:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-500 text-sm">ຫາ</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">ທຸກລະດັບ</option>
                  <option value="high">ເຮັ່ງດ່ວນ</option>
                  <option value="medium">ສຳຄັນ</option>
                  <option value="normal">ປົກກະຕິ</option>
                  <option value="upcoming">ຈະມາເຖິງ</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                ວຽກຊ່ວງວັນທີ {new Date(startDate).toLocaleDateString('lo-LA')} - {new Date(endDate).toLocaleDateString('lo-LA')}
              </h3>
              <p className="text-sm text-gray-600">
                ມີ {filteredTasks.length} ວຽກທີ່ຕ້ອງດຳເນີນການ
              </p>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {filteredTasks.map((payment) => {
              const space = spaces.find(s => s.id === (payment.spaceId || payment.roomId));
              const tenant = tenants.find(t => t.tenantId === payment.tenantId);
              const priority = getTaskPriority(payment);
              const totalAmount = (payment.amountDue || 0) + (payment.lateFee || 0);

              return (
                <div key={payment.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-4 h-4 rounded-full ${priority.bgColor} flex-shrink-0 mt-1`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">ເກັບເງິນ {space?.spaceCode}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priority.color} self-start`}>
                            {priority.text}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{tenant?.tenantName || 'ບໍ່ມີຂໍ້ມູນ'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{space?.zone || space?.spaceType || 'ບໍ່ມີຂໍ້ມູນ'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>ກຳນົດ: {new Date(payment.dueDate).toLocaleDateString('lo-LA')}</span>
                          </div>
                        </div>
                        {payment.lateFee && payment.lateFee > 0 && (
                          <div className="mt-1 text-xs text-red-600">
                            ຄ່າປັບ: ₭{payment.lateFee.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 lg:gap-1">
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">₭{totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{getPaymentTypeText(payment.paymentType)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tasksForDate.length === 0 ? 'ບໍ່ມີວຽກໃນມື້ນີ້' : 'ບໍ່ພົບວຽກທີ່ຄົ້ນຫາ'}
              </h3>
              <p className="text-gray-600">
                {tasksForDate.length === 0 
                  ? 'ບໍ່ມີວຽກເກັບເງິນທີ່ຕ້ອງດຳເນີນການໃນວັນທີເລືອກ'
                  : 'ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາ'
                }
              </p>
            </div>
          )}
        </div>

        {/* Recent Completed Tasks */}
        {completedToday.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">ວຽກທີ່ສຳເລັດແລ້ວມື້ນີ້</h3>
              <p className="text-sm text-gray-600 mt-1">ສຳເລັດ {completedToday.length} ລາຍການ</p>
            </div>
            <div className="divide-y divide-gray-100">
              {completedToday.slice(0, 5).map((payment) => {
                const space = spaces.find(s => s.id === (payment.spaceId || payment.roomId));
                const tenant = tenants.find(t => t.tenantId === payment.tenantId);
                const totalAmount = (payment.amountPaid || payment.amountDue || 0) + (payment.lateFee || 0);

                return (
                  <div key={payment.id} className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900">{space?.spaceCode}</h4>
                          <p className="text-sm text-gray-600 truncate">{tenant?.tenantName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₭{totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleTimeString('lo-LA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {completedToday.length > 5 && (
              <div className="p-4 text-center border-t border-gray-100">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  ເບິ່ງທັງໝົດ ({completedToday.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSchedule;