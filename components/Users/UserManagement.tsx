'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';

import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Phone
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock users data - in production this would come from Firebase
  const users = [
    {
      id: '1',
      username: 'admin',
      name: 'ผู้ดูแลระบบหลัก',
      role: 'admin' as const,
      email: 'admin@market.com',
      phone: '081-234-5678',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date(),
      isActive: true
    },
    {
      id: '2',
      username: 'employee1',
      name: 'นางสาวสมใจ ใจดี',
      role: 'employee' as const,
      email: 'somjai@market.com',
      phone: '082-345-6789',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date(),
      isActive: true
    }
  ];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน';
  };

  const handleAddUser = async () => {
    // This would open a modal to add new user
    alert('ฟีเจอร์เพิ่มผู้ใช้ใหม่จะเปิดให้ใช้งานในเร็วๆ นี้');
  };

  const handleEditUser = async (userId: string) => {
    // This would open a modal to edit user
    alert('ฟีเจอร์แก้ไขผู้ใช้จะเปิดให้ใช้งานในเร็วๆ นี้');
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert('ไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }
    
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      // Add notification about user deletion
      await addNotification({
        type: 'maintenance_required',
        title: 'ผู้ใช้ถูกลบ',
        message: `ผู้ใช้ถูกลบโดย ${user?.name}`,
        isRead: false,
        createdAt: new Date(),
        priority: 'medium'
      });
      alert('ลบผู้ใช้เรียบร้อยแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="text-gray-600 mt-1">จัดการบัญชีผู้ใช้ในระบบ</p>
        </div>
        <button 
          onClick={handleAddUser}
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มผู้ใช้ใหม่</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, หรือชื่อผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ผู้ใช้</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">บทบาท</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ติดต่อ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">เข้าสู่ระบบล่าสุด</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">สถานะ</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userData) => (
                <tr key={userData.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{userData.name}</div>
                        <div className="text-sm text-gray-600">@{userData.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(userData.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleText(userData.role)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-3 h-3 mr-2" />
                        {userData.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-2" />
                        {userData.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {userData.lastLogin?.toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      userData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.isActive ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditUser(userData.id)}
                        disabled={isSubmitting}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                      >
                        <Edit className="w-4 h-4" />
                        <span>แก้ไข</span>
                      </button>
                      {userData.id !== user?.id && (
                        <button 
                          onClick={() => handleDeleteUser(userData.id)}
                          disabled={isSubmitting}
                          className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบผู้ใช้</h3>
          <p className="text-gray-600">ไม่มีผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;