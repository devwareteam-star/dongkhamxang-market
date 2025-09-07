"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  Phone,
  MapPin,
  User,
  Hash,
  Calendar,
  Users,
} from "lucide-react";
import { Tenant, TenantFormData, Space, TenantStatusLabels } from "@/types";
import { useData } from "@/lib/contexts/DataContext";

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenantData: TenantFormData) => Promise<void>;
  editingTenant?: Tenant | null;
}

// Add this after the interface definitions, before the component
const generateTenantId = (
  tenantName: string,
  existingTenants: Tenant[]
): string => {
  // Clean the name: remove special characters, spaces, and convert to lowercase
  const cleanName = tenantName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 8); // Take up to 8 characters for the name part

  // Find existing tenants with the same name prefix
  const existingIds = existingTenants
    .map((t) => t.tenantId)
    .filter((id) => id.startsWith(cleanName))
    .map((id) => {
      const numberPart = id.replace(cleanName, "");
      return parseInt(numberPart) || 0;
    })
    .sort((a, b) => a - b);

  // Find the next available number
  let nextNumber = 1;
  for (const num of existingIds) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  // Format with leading zeros (001, 002, etc.)
  const paddedNumber = nextNumber.toString().padStart(3, "0");
  return `${cleanName}${paddedNumber}`;
};

const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTenant,
}) => {
  const { spaces, tenants, loading } = useData();
  const [formData, setFormData] = useState<TenantFormData>({
    tenantId: "",
    tenantName: "",
    allSpace: [],
    contact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (editingTenant) {
      setFormData({
        tenantId: editingTenant.tenantId,
        tenantName: editingTenant.tenantName,
        allSpace: editingTenant.allSpace || [],
        contact: editingTenant.contact || "",
      });
    } else {
      setFormData({
        tenantId: "",
        tenantName: "",
        allSpace: [],
        contact: "",
      });
    }
    setErrors({});
  }, [editingTenant, isOpen]);

  const handleSpaceToggle = (spaceId: string) => {
    console.log("Toggling space:", spaceId);
    console.log("Current selected:", formData.allSpace);

    setFormData((prev) => ({
      ...prev,
      allSpace: (prev.allSpace || []).includes(spaceId)
        ? (prev.allSpace || []).filter((id) => id !== spaceId)
        : [...(prev.allSpace || []), spaceId],
    }));
  };

  const calculateTotalRent = () => {
    return (formData.allSpace || []).reduce((total, spaceId) => {
      const space = spaces.find((s) => s.id === spaceId); // Change from s.spaceId to s.id
      return total + (space ? space.baseRentMonthly : 0);
    }, 0);
  };

  const getFilteredSpaces = () => {
    const availableSpaces = spaces.filter((space) => {
      // Show vacant spaces
      if (space.status === "ວ່າງ") return true;

      // Show spaces currently assigned to this tenant (when editing)
      if (editingTenant && (formData.allSpace || []).includes(space.id))
        return true; // Change from space.spaceId to space.id

      return false;
    });

    if (spaceTypeFilter === "all") {
      return availableSpaces;
    }

    return availableSpaces.filter(
      (space) => space.spaceType === spaceTypeFilter
    );
  };

  // Add this validation function inside the TenantModal component
const validateSpaceSelection = (): string[] => {
  const unavailableSpaces: string[] = [];

  formData.allSpace.forEach((spaceId) => {
    const space = spaces.find((s) => s.id === spaceId);

    if (!space) {
      unavailableSpaces.push(spaceId);
      return;
    }

    // For UPDATE: Skip validation if this space was already assigned to this tenant
    if (editingTenant && editingTenant.allSpace?.includes(spaceId)) {
      return; // This space was already theirs, so it's valid
    }

    // Check if space is occupied by another tenant (only for new assignments)
    if (
      space.status === "ເຊົ່າແລ້ວ" &&
      space.currentTenantId &&
      space.currentTenantId !== editingTenant?.tenantId
    ) {
      unavailableSpaces.push(space.spaceCode);
    }

    // Check if space is under maintenance
    if (space.status === "ຊ່ອມແຊມ") {
      unavailableSpaces.push(space.spaceCode);
    }
  });

  return unavailableSpaces;
};

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Remove tenantId validation for new tenants since it's auto-generated
    if (!formData.tenantName.trim()) {
      newErrors.tenantName = "ກະລຸນາຕື່ມຊື່ທຸລະກິດ/ຮ້ານຄ້າ";
    }

    if (!formData.contact?.trim()) {
      newErrors.contact = "ກະລຸນາຕື່ມຂໍ້ມູນຕິດຕໍ່";
    }

    const unavailableSpaces = validateSpaceSelection();
    if (unavailableSpaces.length > 0) {
      newErrors.spaces = `ພື້ນທີ່ ${unavailableSpaces.join(
        ", "
      )} ບໍ່ສາມາດເລືອກໄດ້ ເນື່ອງຈາກຖືກເຊົ່າແລ້ວຫຼືກຳລັງສ້ອມແປງ`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderSpaceCheckbox = (space: Space) => {
    const isUnavailable = space.status === 'ເຊົ່າແລ້ວ' && 
                       space.currentTenantId && 
                       space.currentTenantId !== editingTenant?.tenantId;
  
  const isInMaintenance = space.status === 'ຊ່ອມແຊມ';
 return (
    <label 
      key={space.id} // Change from space.spaceId to space.id
      className={`flex items-center space-x-3 p-2 rounded transition-colors ${
        isUnavailable || isInMaintenance 
          ? 'bg-red-50 opacity-60 cursor-not-allowed' 
          : 'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={formData.allSpace.includes(space.id)} // Change from space.spaceId to space.id
        onChange={() => {
          if (!isUnavailable && !isInMaintenance) {
            handleSpaceToggle(space.id); // Change from space.spaceId to space.id
          }
        }}
          disabled={isUnavailable || isInMaintenance}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <div className="flex-1">
          <div
            className={`text-sm font-medium ${
              isUnavailable || isInMaintenance
                ? "text-gray-400"
                : "text-gray-900"
            }`}
          >
            {space.spaceCode}
            {isUnavailable && (
              <span className="ml-2 text-xs text-red-500">(ເຊົ່າແລ້ວ)</span>
            )}
            {isInMaintenance && (
              <span className="ml-2 text-xs text-orange-500">(ສ້ອມແປງ)</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {space.spaceType} • Zone {space.zone} • ₭
            {space.baseRentMonthly.toLocaleString()}/ເດືອນ
          </div>
        </div>
      </label>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
  console.log('Editing tenant:', editingTenant);


    if (!validateForm()) {
       console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId: formData.tenantId.trim(),
        tenantName: formData.tenantName.trim(),
        allSpace: formData.allSpace,
        contact: formData.contact?.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error submitting tenant:", error);
      // Error will be handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof TenantFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTenant ? "ແກ້ໄຂຂໍ້ມູນຜູ້ເຊົ່າ" : "ເພີ່ມຜູ້ເຊົ່າໃໝ່"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Business Information */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              ຂໍ້ມູນທຸລະກິດ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenant ID */}
              {editingTenant ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ລະຫັດຜູ້ເຊົ່າ
                  </label>
                  <input
                    type="text"
                    value={formData.tenantId}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-100 rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ລະຫັດຜູ້ເຊົ່າ (ສ້າງອັດຕະໂນມັດ)
                  </label>
                  <input
                    type="text"
                    value={formData.tenantId}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-100 rounded-lg"
                    placeholder="ຈະສ້າງອັດຕະໂນມັດຈາກຊື່ທຸລະກິດ"
                  />
                </div>
              )}

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ຊື່ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tenantName}
                  onChange={(e) => {
                    const name = e.target.value;
                    handleInputChange("tenantName", name);

                    // Auto-generate tenantId for new tenants
                    if (!editingTenant && name.trim()) {
                      const newId = generateTenantId(name, tenants); // Pass existing tenants
                      handleInputChange("tenantId", newId);
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tenantName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="ຊື່ຮ້ານຄ້າ/ທຸລະກິດ"
                />
                {errors.tenantName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.tenantName}
                  </p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ຂໍ້ມູນຕິດຕໍ່ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.contact ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="ເບີໂທລະສັບຫຼືອີເມວ"
              />
              {errors.contact && (
                <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
              )}
            </div>
          </div>

          {/* Space Assignment */}
          <div className="mb-8">
  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
    <Hash className="w-5 h-5 mr-2 text-green-600" />
    ຈັດສັນພື້ນທີ່ເຊົ່າ
  </h3>

  {/* IF EDITING - Show two separate sections */}
  {editingTenant ? (
    <>
      {/* Current Rented Spaces */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ພື້ນທີ່ທີ່ເຊົ່າຢູ່ປັດຈຸບັນ ({(formData.allSpace || []).length} ພື້ນທີ່)
        </label>
        <div className="max-h-40 overflow-y-auto border border-blue-300 bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(formData.allSpace || []).map((spaceId) => {
              const space = spaces.find((s) => s.id === spaceId);
              if (!space) return null;
              
              return (
                <label key={spaceId} className="flex items-center space-x-3 p-2 rounded hover:bg-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleSpaceToggle(spaceId)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900">
                      {space.spaceCode} <span className="text-xs text-blue-600">(ປັດຈຸບັນ)</span>
                    </div>
                    <div className="text-xs text-blue-700">
                      {space.spaceType} • Zone {space.zone} • ₭{space.baseRentMonthly.toLocaleString()}/ເດືອນ
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {(formData.allSpace || []).length === 0 && (
            <p className="text-blue-600 text-center py-4">ບໍ່ມີພື້ນທີ່ທີ່ເຊົ່າຢູ່</p>
          )}
        </div>
      </div>

      {/* Available Spaces to Add */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ພື້ນທີ່ວ່າງທີ່ສາມາດເພີ່ມໄດ້
        </label>
        
        {/* Space Type Filter for Available Spaces */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "ທັງໝົດ" },
              { key: "ໂຕະ", label: "ໂຕະ" },
              { key: "ຫ້ອງເຊົ່າ", label: "ຫ້ອງເຊົ່າ" },
              { key: "ບູດ", label: "ບູດ" },
              { key: "ປ້າຍ", label: "ປ້າຍ" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSpaceTypeFilter(tab.key)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  spaceTypeFilter === tab.key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-40 overflow-y-auto border border-green-300 bg-green-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {spaces
              .filter((space) => {
                // Only show truly vacant spaces
                const isVacant = space.status === "ວ່າງ";
                const matchesFilter = spaceTypeFilter === "all" || space.spaceType === spaceTypeFilter;
                const notCurrentlySelected = !(formData.allSpace || []).includes(space.id);
                
                return isVacant && matchesFilter && notCurrentlySelected;
              })
              .map((space) => (
                <label key={space.id} className="flex items-center space-x-3 p-2 rounded hover:bg-green-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleSpaceToggle(space.id)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900">
                      {space.spaceCode} <span className="text-xs text-green-600">(ວ່າງ)</span>
                    </div>
                    <div className="text-xs text-green-700">
                      {space.spaceType} • Zone {space.zone} • ₭{space.baseRentMonthly.toLocaleString()}/ເດືອນ
                    </div>
                  </div>
                </label>
              ))
            }
          </div>
          
          {spaces.filter((space) => {
            const isVacant = space.status === "ວ່າງ";
            const matchesFilter = spaceTypeFilter === "all" || space.spaceType === spaceTypeFilter;
            const notCurrentlySelected = !(formData.allSpace || []).includes(space.id);
            return isVacant && matchesFilter && notCurrentlySelected;
          }).length === 0 && (
            <p className="text-green-600 text-center py-4">ບໍ່ມີພື້ນທີ່ວ່າງເພີ່ມເຕີມ</p>
          )}
        </div>
      </div>
    </>
  ) : (
    // IF ADDING - Keep original single list for available spaces
    <>
      {/* Space Type Filter Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            {
              key: "all",
              label: "ທັງໝົດ",
              count: spaces.filter((s) => s.status === "ວ່າງ").length,
            },
            {
              key: "ໂຕະ",
              label: "ໂຕະ",
              count: spaces.filter((s) => s.status === "ວ່າງ" && s.spaceType === "ໂຕະ").length,
            },
            {
              key: "ຫ້ອງເຊົ່າ",
              label: "ຫ້ອງເຊົ່າ",
              count: spaces.filter((s) => s.status === "ວ່າງ" && s.spaceType === "ຫ້ອງເຊົ່າ").length,
            },
            {
              key: "ບູດ",
              label: "ບູດ",
              count: spaces.filter((s) => s.status === "ວ່າງ" && s.spaceType === "ບູດ").length,
            },
            {
              key: "ປ້າຍ",
              label: "ປ້າຍ",
              count: spaces.filter((s) => s.status === "ວ່າງ" && s.spaceType === "ປ້າຍ").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSpaceTypeFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                spaceTypeFilter === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {errors.spaces && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errors.spaces}</p>
        </div>
      )}

      {/* Available Spaces */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ເລືອກພື້ນທີ່ທີ່ຕ້ອງການເຊົ່າ{" "}
          {spaceTypeFilter !== "all" && `(${spaceTypeFilter})`}
        </label>

        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getFilteredSpaces().map((space) => renderSpaceCheckbox(space))}
          </div>

          {/* Empty state */}
          {getFilteredSpaces().length === 0 && (
            <p className="text-gray-500 text-center py-8">
              ບໍ່ມີພື້ນທີ່ວ່າງໃຫ້ເລືອກໃນໝວດນີ້
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="mt-2 text-xs text-gray-500 flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ວ່າງ
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            ເຊົ່າແລ້ວ
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            ສ້ອມແປງ
          </span>
        </div>
      </div>
    </>
  )}

  {/* Selected Spaces Summary - Show for both add and edit */}
  {(formData.allSpace || []).length > 0 && (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm font-medium text-gray-800 mb-2">
        ລວມພື້ນທີ່ທີ່ເລືອກ ({formData.allSpace.length} ພື້ນທີ່)
      </div>
      <div className="flex flex-wrap gap-2">
        {(formData.allSpace || []).map((spaceId) => {
          const space = spaces.find((s) => s.id === spaceId);
          return space ? (
            <span
              key={spaceId}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
            >
              {space.spaceCode}
            </span>
          ) : null;
        })}
      </div>
      <div className="text-sm text-blue-600 mt-2">
        ລວມຄ່າເຊົ່າ: ₭{calculateTotalRent().toLocaleString()}/ເດືອນ
      </div>
    </div>
  )}
</div>

          {/* Current Status Display (if editing) */}
          {editingTenant && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2 text-purple-600" />
                ພື້ນທີ່ທີ່ເຊົ່າ
              </h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  ພື້ນທີ່ປັດຈຸບັນ:
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {editingTenant.allSpace?.length || 0} ພື້ນທີ່
                </div>
                <div className="text-sm text-gray-700 mt-2">
                  ລະຫັດ: {editingTenant.allSpace?.join(", ") || "ບໍ່ມີ"}
                </div>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              ໝາຍເຫດສຳຄັນ:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• ຂໍ້ມູນຜູ້ເຊົ່າຈະຖືກບັນທຶກໃນລະບົບຖານຂໍ້ມູນ Firestore</li>
              <li>• ການຈັດສັນພື້ນທີ່ເຊົ່າຈະເຮັດຜ່ານລະບົບສັນຍາແຍກຕ່າງຫາກ</li>
              <li>• ສະຖານະ "ບັນຊີດຳ" ຈະປ້ອງກັນການເຮັດສັນຍາໃໝ່</li>
              {editingTenant && (
                <li>• ການແກ້ໄຂຂໍ້ມູນຈະບໍ່ກະທົບຕໍ່ສັນຍາທີ່ມີຜົນຢູ່</li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ກຳລັງບັນທຶກ...</span>
                </div>
              ) : editingTenant ? (
                "ອັບເດດຂໍ້ມູນຜູ້ເຊົ່າ"
              ) : (
                "ເພີ່ມຜູ້ເຊົ່າໃໝ່"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantModal;