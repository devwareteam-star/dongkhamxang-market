"use client";

import React, { useState } from "react";
import { useData } from "@/lib/contexts/DataContext";
import {
  Space,
  SpaceTypeLabels,
  SpaceStatusLabels,
  PaymentFrequencyStatusLabels,
} from "@/types";
import SpaceModal from "./RoomModal";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  MapPin,
  ChevronUp,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";

const SpaceManagement: React.FC = () => {
  const { spaces, addSpace, updateSpace, deleteSpace, tenants } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredSpaces = spaces
    .filter((space) => {
      const matchesSearch =
        space.spaceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (space.productCategory &&
          space.productCategory
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || space.status === statusFilter;
      const matchesType =
        typeFilter === "all" || space.spaceType === typeFilter;
      const matchesZone = zoneFilter === "all" || space.zone === zoneFilter;
      const matchesPayment =
        paymentFilter === "all" || space.paymentFrequency === paymentFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesZone &&
        matchesPayment
      );
    })
    .sort((a, b) => {
      // Define the order: Table, Room, Booth, Signage
      const typeOrder = { table: 1, room: 2, booth: 3, signage: 4 };

      // Primary sort by space type
      const typeComparison = typeOrder[a.spaceType] - typeOrder[b.spaceType];
      if (typeComparison !== 0) return typeComparison;

      // Secondary sort by space code for same types
      return a.spaceCode.localeCompare(b.spaceCode);
    });

  const handleAddSpace = () => {
    setEditingSpace(null);
    setIsSpaceModalOpen(true);
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setIsSpaceModalOpen(true);
  };

  const handleDeleteSpace = async (spaceId: string) => {
    const space = spaces.find((s) => s.id === spaceId);
    const activeTenant = space?.currentTenantId
      ? tenants.find((t) => t.tenantId === space.currentTenantId)
      : null;

    if (activeTenant) {
      alert("ບໍ່ສາມາດລົບພື້ນທີ່ໄດ້ ເນື່ອງຈາກມີຜູ້ເຊົ່າຢູ່");
      return;
    }

    if (
      confirm(
        "ທ່ານແນ່ໃຈແລ້ວບໍ່ວ່າຈະລົບພື້ນທີ່ນີ້? ການດຳເນີນການນີ້ບໍ່ສາມາດຍົກເລີກໄດ້"
      )
    ) {
      setIsSubmitting(true);
      try {
        await deleteSpace(spaceId);
        alert("ລົບພື້ນທີ່ແລ້ວ");
      } catch (error) {
        alert("ເກີດຂໍ້ຜິດພາດໃນການລົບພື້ນທີ່");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitSpace = async (
    spaceData: Omit<
      Space,
      "id" | "spaceId" | "createdAt" | "updatedAt" | "createdBy"
    >
  ) => {
    setIsSubmitting(true);
    try {
      if (editingSpace) {
        await updateSpace(editingSpace.id, spaceData);
      } else {
        await addSpace(spaceData);
      }
      setIsSpaceModalOpen(false);
      setEditingSpace(null);
    } catch (error: any) {
      console.error("Error submitting space:", error);
      alert(error.message || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກພື້ນທີ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Space["status"]) => {
    const colors = {
      rented: "bg-green-100 text-green-800",
      vacant: "bg-yellow-100 text-yellow-800",
      maintainance: "bg-red-400 text-white",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: Space["spaceType"]) => {
    const colors = {
      table: "bg-blue-100 text-blue-800",
      room: "bg-purple-100 text-purple-800",
      signage: "bg-orange-100 text-orange-800",
      booth: "bg-teal-100 text-teal-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          colors[type] || "bg-gray-100 text-gray-800"
        }`}
      >
        {SpaceTypeLabels[type] || type}
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            ຈັດການພື້ນທີ່ເຊົ່າ
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            ຈັດການຂໍ້ມູນພື້ນທີ່ເຊົ່າທັງໝົດ {spaces.length} ພື້ນທີ່
          </p>
        </div>
        <button
          onClick={handleAddSpace}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm md:text-base">ເພີ່ມພື້ນທີ່ໃໝ່</span>
        </button>
      </div>

      {/* Search and Filter Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາລະຫັດພື້ນທີ່ຫຼືໂຊນ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">ຟິວເຕີ</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">ສະຖານະທັງໝົດ</option>
                <option value="ວ່າງ">ວ່າງ</option>
                <option value="ເຊົ່າແລ້ວ">ເຊົ່າແລ້ວ</option>
                <option value="ຊ່ອມແຊມ">ຊ່ອມແຊມ</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">ປະເພດທັງໝົດ</option>
                <option value="ໂຕະ">ໂຕະ</option>
                <option value="ຫ້ອງເຊົ່າ">ຫ້ອງເຊົ່າ</option>
                <option value="ປ້າຍ">ປ້າຍ</option>
                <option value="ບູດ">ບູດ</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {spaces.some((space) => space.spaceType === "room") && (
              <div className="relative">
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">ໂຊນທັງໝົດ</option>
                  <option value="G">G</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            )}

            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">ການຈ່າຍທັງໝົດ</option>
                <option value="daily">ຈ່າຍຕໍ່ມື້</option>
                <option value="monthly">ຈ່າຍຕໍ່ເດືອນ</option>
                <option value="yearly">ຈ່າຍຕໍ່ປີ</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Result Count */}
        <div className="mt-4 flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
          <Building2 className="w-4 h-4 mr-2" />
          ສະແດງ {filteredSpaces.length} ພື້ນທີ່
        </div>
      </div>

      {/* Mobile Card View / Desktop Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile Card View (hidden on desktop) */}
        <div className="block md:hidden">
          {filteredSpaces.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ບໍ່ພົບພື້ນທີ່ເຊົ່າ
              </h3>
              <p className="text-gray-600">
                ບໍ່ມີພື້ນທີ່ທີ່ຕົງກັບເງື່ອນໄຂການຄົ້ນຫາ
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSpaces.map((space) => {
                const tenant = tenants.find(
                  (t) => t.allSpace?.includes(space.id)
                );

                return (
                  <div key={space.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col space-y-2">
                        {getTypeBadge(space.spaceType)}
                        <div className="font-bold text-lg text-gray-900">
                          {space.spaceCode}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSpace(space)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="ແກ້ໄຂ"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSpace(space.id)}
                          disabled={isSubmitting}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="ລົບ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">ສະຖານະ:</span>
                        <div className="mt-1">{getStatusBadge(space.status)}</div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">ລາຄາ:</span>
                        <div className="mt-1 font-medium text-blue-600">
                          ₭{space.originalRentAmount?.toLocaleString()}
                        </div>
                      </div>

                      {space.spaceType === "room" && (
                        <div>
                          <span className="text-gray-500">ໂຊນ:</span>
                          <div className="mt-1 flex items-center text-gray-700">
                            <MapPin className="w-3 h-3 mr-1" />
                            {space.zone}
                          </div>
                        </div>
                      )}

                      {tenant && (
                        <div>
                          <span className="text-gray-500">ຜູ້ເຊົ່າ:</span>
                          <div className="mt-1 text-purple-600 font-medium">
                            {tenant.tenantName}
                          </div>
                        </div>
                      )}

                      {space.productCategory && (
                        <div className="col-span-2">
                          <span className="text-gray-500">ປະເພດສິນຄ້າ:</span>
                          <div className="mt-1 text-gray-700">
                            {space.productCategory}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <div className="max-h-[650px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ປະເພດ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ລະຫັດພື້ນທີ່
                    </th>
                    {filteredSpaces.some((space) => space.spaceType === "room") && (
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        ໂຊນ
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ສະຖານະ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ປະເພດການຈ່າຍ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ລາຄາ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ຜູ້ເຊົ່າ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      ປະເພດສິນຄ້າ
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      ການດຳເນີນການ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSpaces.map((space) => {
                    const tenant = tenants.find(
                      (t) => t.allSpace?.includes(space.id)
                    );

                    return (
                      <tr
                        key={space.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(space.spaceType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {space.spaceCode}
                          </div>
                        </td>
                        {filteredSpaces.some(
                          (space) => space.spaceType === "room"
                        ) && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {space.spaceType === "room" ? (
                              <div className="flex items-center text-gray-700">
                                <MapPin className="w-3 h-3 mr-1" />
                                {space.zone}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(space.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-green-600">
                            {space.paymentFrequency
                              ? PaymentFrequencyStatusLabels[
                                  space.paymentFrequency
                                ] || space.paymentFrequency
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-blue-600">
                            ₭{space.originalRentAmount?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tenant ? (
                            <div className="text-purple-600 font-medium">
                              {tenant.tenantName}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {space.productCategory ? (
                            <div
                              className="text-gray-700 max-w-32 truncate"
                              title={space.productCategory}
                            >
                              {space.productCategory}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditSpace(space)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="ແກ້ໄຂ"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSpace(space.id)}
                              disabled={isSubmitting}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="ລົບ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredSpaces.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ບໍ່ພົບພື້ນທີ່ເຊົ່າ
              </h3>
              <p className="text-gray-600">
                ບໍ່ມີພື້ນທີ່ທີ່ຕົງກັບເງື່ອນໄຂການຄົ້ນຫາ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Space Modal */}
      <SpaceModal
        isOpen={isSpaceModalOpen}
        onClose={() => {
          setIsSpaceModalOpen(false);
          setEditingSpace(null);
        }}
        onSubmit={handleSubmitSpace}
        editingSpace={editingSpace}
      />
    </div>
  );
};

export default SpaceManagement;