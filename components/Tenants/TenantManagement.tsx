'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { Tenant } from '@/types'; // Add this import
import TenantModal from './TenantModal';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const TenantManagement: React.FC = () => {
  const { tenants, rooms, addTenant, updateTenant, deleteTenant, payments } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.phone.includes(searchTerm) ||
                         tenant.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && tenant.isActive) ||
                         (statusFilter === 'inactive' && !tenant.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleAddTenant = () => {
    setEditingTenant(null);
    setIsTenantModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsTenantModalOpen(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    // Check if tenant has pending payments
    const tenantPayments = payments.filter(p => p.tenantId === tenantId && p.status !== 'paid');
    if (tenantPayments.length > 0) {
      alert('ไม่สามารถลบผู้เช่าได้ เนื่องจากมีการชำระเงินค้างอยู่');
      return;
    }

    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้เช่านี้? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      setIsSubmitting(true);
      try {
        await deleteTenant(tenantId);
        alert('ลบผู้เช่าเรียบร้อยแล้ว');
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบผู้เช่า');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitTenant = async (tenantData: Omit<Tenant, 'id'>) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting tenant data:', tenantData);
      if (editingTenant) {
        await updateTenant(editingTenant.id, tenantData);
      } else {
        console.log('Adding new tenant to room:', tenantData.roomId);
        await addTenant(tenantData);
        console.log('Tenant added successfully');
      }
      setIsTenantModalOpen(false);
      setEditingTenant(null);
    } catch (error) {
      console.error('Error submitting tenant:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้เช่า</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลผู้เช่าทั้งหมด {tenants.length} คน</p>
        </div>
        <button 
          onClick={handleAddTenant}
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มผู้เช่าใหม่</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">ใช้งานอยู่</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <UserCheck className="w-4 h-4 mr-2" />
            แสดง {filteredTenants.length} คน
          </div>
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => {
          const room = rooms.find(r => r.id === tenant.roomId);
          
          return (
            <div key={tenant.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                    <p className="text-sm text-gray-600">ห้อง {room?.roomNumber}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.isActive ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{tenant.phone}</span>
                </div>
                {tenant.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{tenant.email}</span>
                  </div>
                )}
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{tenant.address}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">เริ่มเช่า</p>
                    <p className="font-medium">{new Date(tenant.startDate).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ประเภท</p>
                    <p className="font-medium">{tenant.contractType === 'monthly' ? 'รายเดือน' : 'รายปี'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">เงินมัดจำ</p>
                    <p className="font-medium text-green-600">฿{tenant.deposit.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {tenant.emergencyContact && (
                <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-yellow-800 mb-1">ติดต่อฉุกเฉิน</p>
                  <p className="text-sm text-yellow-700">{tenant.emergencyContact.name}</p>
                  <p className="text-xs text-yellow-600">{tenant.emergencyContact.phone}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditTenant(tenant)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>แก้ไข</span>
                </button>
                <button 
                  onClick={() => handleDeleteTenant(tenant.id)}
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบผู้เช่า</h3>
          <p className="text-gray-600">ไม่มีผู้เช่าที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}

      {/* Tenant Modal */}
      <TenantModal
        isOpen={isTenantModalOpen}
        onClose={() => {
          setIsTenantModalOpen(false);
          setEditingTenant(null);
        }}
        onSubmit={handleSubmitTenant}
        editingTenant={editingTenant}
      />
    </div>
  );
};

export default TenantManagement;