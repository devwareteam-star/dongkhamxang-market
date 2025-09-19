'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { Tenant, TenantFormData } from '@/types';
import TenantModal from './TenantModal';
import {
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Hash,
  Filter,
  X,
} from 'lucide-react';

const TenantManagement: React.FC = () => {
  const {
    tenants,
    spaces,
    addTenant,
    updateTenant,
    deleteTenant,
    payments,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    spaceCount: 'all', // all, none, hasSpaces
    spaceType: 'all',  // all, ໂຕະ, ຫ້ອງເຊົ່າ, ບູດ, ປ້າຍ
    zone: 'all',       // all, A, B, C, D, G
  });

  // Match new schema: tenant.allSpace contains spaceIds
  const getTenantSpaces = (tenant: Tenant) => {
    const selectedIds = tenant.allSpace || [];
    if (selectedIds.length === 0) return [];
    return spaces.filter((s) => selectedIds.includes(s.id));
  };

  // Enhanced filtering with new filters
  const filteredTenants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    
    return tenants.filter((tenant) => {
      // Text search
      if (q) {
        const name = (tenant.tenantName || '').toLowerCase();
        const contact = (tenant.contact || '').toLowerCase();
        if (!name.includes(q) && !contact.includes(q)) return false;
      }
      
      const tenantSpaces = getTenantSpaces(tenant);
      
      // Space count filter
      if (filters.spaceCount === 'none' && tenantSpaces.length > 0) return false;
      if (filters.spaceCount === 'hasSpaces' && tenantSpaces.length === 0) return false;
      
      // Space type filter
      if (filters.spaceType !== 'all') {
        const hasMatchingSpaceType = tenantSpaces.some(space => space.spaceType === filters.spaceType);
        if (!hasMatchingSpaceType) return false;
      }
      
      // Zone filter
      if (filters.zone !== 'all') {
        const hasMatchingZone = tenantSpaces.some(space => space.zone === filters.zone);
        if (!hasMatchingZone) return false;
      }
      
      return true;
    });
  }, [tenants, searchTerm, filters, spaces]);

  const handleAddTenant = () => {
    setEditingTenant(null);
    setIsTenantModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsTenantModalOpen(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    const tenantPayments = payments?.filter?.(
      (p: any) => p.tenantId === tenantId && p.paymentStatus !== 'ຈ່າຍແລ້ວ'
    ) ?? [];
    if (tenantPayments.length > 0) {
      alert('ບໍ່ສາມາດລຶບຜູ້ເຊົ່າໄດ້ ເນື່ອງຈາກມີການຊຳລະເງິນຄ້າງຢູ່');
      return;
    }

    if (
      confirm('ທ່ານແນ່ໃຈແລ້ວບໍ່ທີ່ຈະລຶບຜູ້ເຊົ່ານີ້? ການດຳເນີນການນີ້ບໍ່ສາມາດຍົກເລີກໄດ້')
    ) {
      setIsSubmitting(true);
      try {
        await deleteTenant(tenantId);
        alert('ລຶບຜູ້ເຊົ່າສຳເລັດແລ້ວ');
      } catch (error) {
        alert('ເກີດຂໍ້ຜິດພາດໃນການລຶບຜູ້ເຊົ່າ');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitTenant = async (tenantData: TenantFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTenant) {
        if (!editingTenant.id) {
          throw new Error('Missing tenant document ID');
        }
        await updateTenant(editingTenant.id, tenantData);
      } else {
        await addTenant(tenantData);
      }
      setIsTenantModalOpen(false);
      setEditingTenant(null);
    } catch (error) {
      console.error('Error submitting tenant:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      spaceCount: 'all',
      spaceType: 'all',
      zone: 'all',
    });
    setSearchTerm('');
  };

  // Check if any filters are active
  const hasActiveFilters = filters.spaceCount !== 'all' || 
                          filters.spaceType !== 'all' || 
                          filters.zone !== 'all' || 
                          searchTerm.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ຈັດການຜູ້ເຊົ່າ</h1>
          <p className="text-gray-600 mt-1">
            ຈັດການຂໍ້ມູນຜູ້ເຊົ່າທັງໝົດ {tenants.length} ຄົນ
            {hasActiveFilters && ` (ສະແດງ ${filteredTenants.length} ຄົນ)`}
          </p>
        </div>
        <button
          onClick={handleAddTenant}
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          <span>ເພີ່ມຜູ້ເຊົ່າໃໝ່</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ ຫຼື ຂໍ້ມູນຕິດຕໍ່..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>ຕົວກອງ</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {Object.values(filters).filter(v => v !== 'all').length + (searchTerm.trim() ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Results Count */}
          <div className="flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            <UserCheck className="w-4 h-4 mr-2" />
            ສະແດງ {filteredTenants.length} ຄົນ
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Space Count Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ຈຳນວນພື້ນທີ່ເຊົ່າ
                </label>
                <select
                  value={filters.spaceCount}
                  onChange={(e) => setFilters(prev => ({ ...prev, spaceCount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ທັງໝົດ</option>
                  <option value="none">ບໍ່ມີພື້ນທີ່ເຊົ່າ</option>
                  <option value="hasSpaces">ມີພື້ນທີ່ເຊົ່າ</option>
                </select>
              </div>

              {/* Space Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ປະເພດພື້ນທີ່
                </label>
                <select
                  value={filters.spaceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, spaceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ທັງໝົດ</option>
                  <option value="ໂຕະ">ໂຕະ</option>
                  <option value="ຫ້ອງເຊົ່າ">ຫ້ອງເຊົ່າ</option>
                  <option value="ບູດ">ບູດ</option>
                  <option value="ປ້າຍ">ປ້າຍ</option>
                </select>
              </div>

              {/* Zone Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ໂຊນ
                </label>
                <select
                  value={filters.zone}
                  onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ທັງໝົດ</option>
                  <option value="A">Zone A</option>
                  <option value="B">Zone B</option>
                  <option value="C">Zone C</option>
                  <option value="D">Zone D</option>
                  <option value="G">Zone G</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>ລ້າງຕົວກອງ</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tenants Grid - Updated with xl:grid-cols-5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredTenants.map((tenant) => {
          const tenantSpaces = getTenantSpaces(tenant);

          return (
            <div
              key={tenant.tenantId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tenant.tenantName}
                    </h3>
                    {tenant.contact ? (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{tenant.contact}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Assigned Spaces */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    ພື້ນທີ່ເຊົ່າ ({tenantSpaces.length})
                  </span>
                </div>
                {tenantSpaces.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {tenantSpaces.slice(0, 3).map((space) => (
                      <span
                        key={space.id}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {space.spaceCode} ({space.zone})
                      </span>
                    ))}
                    {tenantSpaces.length > 3 && (
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                        +{tenantSpaces.length - 3} ອື່ນໆ
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-blue-600">ຍັງບໍ່ມີພື້ນທີ່ເຊົ່າ</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditTenant(tenant)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>ແກ້ໄຂ</span>
                </button>
                <button
                  onClick={() => handleDeleteTenant(tenant.tenantId)}
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

      {/* Empty State */}
      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'ບໍ່ພົບຜູ້ເຊົ່າທີ່ຕົງກັບເງື່ອນໄຂ' : 'ບໍ່ພົບຜູ້ເຊົ່າ'}
          </h3>
          <p className="text-gray-600">
            {hasActiveFilters 
              ? 'ລອງປັບເງື່ອນໄຂການຄົ້ນຫາຫຼືຕົວກອງ'
              : 'ບໍ່ມີຜູ້ເຊົ່າທີ່ຕົງກັບເງື່ອນໄຂການຄົ້ນຫາ'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ລ້າງຕົວກອງ
            </button>
          )}
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