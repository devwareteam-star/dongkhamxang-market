"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, MapPin, DollarSign } from "lucide-react";
import { Space, SpaceFormData } from "@/types";

import {
  getAvailableSpaceCodes,
  getNextAvailableSpaceCode,
  validateSpaceCode,
  getSpaceCodesByType,
  getRoomCodesByZone,
} from "@/lib/contexts/spaceConfig";

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
 onSubmit: (
  spaceData: Omit<Space, "id" | "spaceId" | "createdAt" | "updatedAt" | "createdBy">
) => Promise<void>;
  editingSpace?: Space | null;
}

const SpaceModal: React.FC<SpaceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSpace,
}) => {
  type PaymentFrequency = "daily" | "monthly" | "yearly";

  const getPaymentOptionsForSpaceType = (
    spaceType: Space["spaceType"]
  ): PaymentFrequency[] => {
    switch (spaceType) {
      case "ໂຕະ": // Table
        return ["daily", "monthly", "yearly"];
      case "ຫ້ອງເຊົ່າ": // Room
        return ["monthly", "yearly"];
      case "ບູດ": // Booth
        return ["daily"];
      case "ປ້າຍ": // Signage
        return ["yearly"];
      default:
        return ["monthly"];
    }
  };

  const getPaymentFrequencyLabel = (frequency: PaymentFrequency): string => {
    switch (frequency) {
      case "daily":
        return "ຕໍ່ມື້ (Daily)";
      case "monthly":
        return "ຕໍ່ເດືອນ (Monthly)";
      case "yearly":
        return "ຕໍ່ປີ (Yearly)";
      default:
        return frequency;
    }
  };

  const getAvailableSpaceCodesForCurrentSelection = (): string[] => {
  if (formData.spaceType === 'ຫ້ອງເຊົ່າ' && formData.zone) {
    return getRoomCodesByZone(formData.zone);
  }
  return getSpaceCodesByType(formData.spaceType);
};

const getSpaceCodePlaceholder = (): string => {
  switch (formData.spaceType) {
    case 'ໂຕະ':
      return 'T001, T002, ... T130';
    case 'ຫ້ອງເຊົ່າ':
      if (formData.zone) {
        const zoneInfo = {
          'G': 'RG001-RG145',
          'A': 'RA001-RA030', 
          'B': 'RB001-RB015',
          'C': 'RC001-RC050',
          'D': 'RD001-RD010'
        };
        return zoneInfo[formData.zone];
      }
      return 'ເລືອກໂຊນກ່ອນ';
    case 'ບູດ':
      return 'B001, B002, B003';
    case 'ປ້າຍ':
      return 'S001, S002, ... S010';
    default:
      return 'ເລືອກປະເພດກ່ອນ';
  }
};

const handleSpaceCodeChange = (value: string) => {
  setFormData(prev => ({ ...prev, spaceCode: value }));
  
  // Clear space code error when user types
  if (errors.spaceCode) {
    setErrors(prev => ({ ...prev, spaceCode: '' }));
  }
};

const handleAutoSuggestSpaceCode = () => {
  const zone = formData.spaceType === 'ຫ້ອງເຊົ່າ' ? formData.zone : undefined;
  const suggestedCode = getNextAvailableSpaceCode(formData.spaceType, zone);
  
  if (suggestedCode) {
    handleSpaceCodeChange(suggestedCode);
  } else {
    alert('ບໍ່ມີລະຫັດພື້ນທີ່ທີ່ໃຊ້ໄດ້');
  }
};

  const [formData, setFormData] = useState({
    spaceCode: "",
    spaceType: "ໂຕະ" as Space["spaceType"],
    zone: "G" as Space["zone"],
    status: "ວ່າງ" as Space["status"],
    paymentFrequency: "daily" as PaymentFrequency, // Add this
    baseRentAmount: "", // Rename from baseRentMonthly
    productCategory: "",
    position: {
      x: "",
      y: "",
      floor: "1",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingSpace) {
      // Get the payment frequency and original amount from the space data
      const getPaymentFrequencyFromSpace = (space: Space): PaymentFrequency => {
        // If the space has a saved payment frequency, use it
        if (space.paymentFrequency) {
          return space.paymentFrequency;
        }
        // Otherwise, default to the first option for this space type
        return getPaymentOptionsForSpaceType(space.spaceType)[0];
      };

      const getOriginalAmountFromSpace = (space: Space): string => {
        // If we have the original amount, use it
        if (space.originalRentAmount) {
          return space.originalRentAmount.toString();
        }
        // Otherwise, use the monthly rate as-is
        return space.baseRentMonthly.toString();
      };

      const paymentFreq = getPaymentFrequencyFromSpace(editingSpace);

      setFormData({
        spaceCode: editingSpace.spaceCode,
        spaceType: editingSpace.spaceType,
        zone: editingSpace.zone,
        status: editingSpace.status,
        paymentFrequency: paymentFreq,
        baseRentAmount: getOriginalAmountFromSpace(editingSpace), // Use baseRentAmount instead of baseRentMonthly
        productCategory: editingSpace.productCategory || "",
        position: {
          x: editingSpace.position?.x?.toString() || "",
          y: editingSpace.position?.y?.toString() || "",
          floor: editingSpace.position?.floor?.toString() || "1",
        },
      });
    } else {
      setFormData({
        spaceCode: "",
        spaceType: "ໂຕະ",
        zone: "G",
        status: "ວ່າງ",
        paymentFrequency: "daily", // Default for table
        baseRentAmount: "", // Use baseRentAmount instead of baseRentMonthly
        productCategory: "",
        position: {
          x: "",
          y: "",
          floor: "1",
        },
      });
    }
    setErrors({});
  }, [editingSpace, isOpen]);

  const validateForm = () => {
  const newErrors: Record<string, string> = {};

  // Space code validation using the config
  if (!formData.spaceCode.trim()) {
    newErrors.spaceCode = 'ກະລຸນາໃສ່ລະຫັດພື້ນທີ່';
  } else {
    const zone = formData.spaceType === 'ຫ້ອງເຊົ່າ' ? formData.zone : undefined;
    const validation = validateSpaceCode(formData.spaceCode, formData.spaceType, zone);
    
    if (!validation.isValid) {
      newErrors.spaceCode = validation.message || 'ລະຫັດພື້ນທີ່ບໍ່ຖືກຕ້ອງ';
    }
  }

  // Zone validation (only for rooms)
  if (formData.spaceType === 'ຫ້ອງເຊົ່າ' && !formData.zone) {
    newErrors.zone = 'ກະລຸນາເລືອກໂຊນ';
  }

  // Rent amount validation
  if (!formData.baseRentAmount || parseFloat(formData.baseRentAmount) <= 0) {
    newErrors.baseRentAmount = 'ກະລຸນາໃສ່ຄ່າເຊົ່າທີ່ຖືກຕ້ອງ';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert all rates to monthly for consistent storage
      const rentAmount = parseFloat(formData.baseRentAmount);
      let monthlyRate: number;

      switch (formData.paymentFrequency) {
        case "daily":
          monthlyRate = rentAmount * 30;
          break;
        case "yearly":
          monthlyRate = rentAmount / 12;
          break;
        case "monthly":
        default:
          monthlyRate = rentAmount;
          break;
      }

      const spaceData = {
        spaceCode: formData.spaceCode.trim(),
    spaceType: formData.spaceType,
    zone: formData.spaceType === 'ຫ້ອງເຊົ່າ' ? formData.zone : undefined,
    status: formData.status,
    baseRentMonthly: monthlyRate,
    paymentFrequency: formData.paymentFrequency,
    originalRentAmount: rentAmount,
    productCategory: formData.productCategory.trim() || undefined,
    currentTenantId: undefined,
    currentContractId: undefined,
    // ... position logic
    position: 
          formData.position.x && formData.position.y
            ? {
                x: parseFloat(formData.position.x),
                y: parseFloat(formData.position.y),
                floor: parseInt(formData.position.floor) || 1,
              }
            : undefined,
      };

      await onSubmit(spaceData);
    } catch (error) {
      console.error("Error submitting space:", error);
      alert(
        "ເກີດຂໍ້ຜິດພາດ: " +
          (error instanceof Error ? error.message : "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("position.")) {
      const positionField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        position: {
          ...prev.position,
          [positionField]: value,
        },
      }));
    } else if (field === "paymentFrequency") {
      // Type assertion for paymentFrequency
      setFormData((prev) => ({ ...prev, [field]: value as PaymentFrequency }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Add this handler to reset zone when spaceType changes:
  const handleSpaceTypeChange = (value: Space["spaceType"]) => {
    const availablePaymentOptions = getPaymentOptionsForSpaceType(value);
    const defaultPaymentFrequency = availablePaymentOptions[0];

    setFormData((prev) => ({
      ...prev,
      spaceType: value,
      zone: value === "ຫ້ອງເຊົ່າ" ? prev.zone : undefined,
      paymentFrequency: defaultPaymentFrequency, // Auto-set payment frequency
      baseRentAmount: "", // Clear amount when changing space type
    }));

    if (errors.spaceType) {
      setErrors((prev) => ({ ...prev, spaceType: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingSpace ? "ແກ້ໄຂຂໍ້ມູນພື້ນທີ່" : "ເພີ່ມພື້ນທີ່ໃໝ່"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Space Type */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ປະເພດພື້ນທີ່ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.spaceType}
                onChange={(e) =>
                  handleSpaceTypeChange(e.target.value as Space["spaceType"])
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ໂຕະ">ໂຕະ (Table)</option>
                <option value="ຫ້ອງເຊົ່າ">ຫ້ອງເຊົ່າ (Room)</option>
                <option value="ປ້າຍ">ປ້າຍ (Signage)</option>
                <option value="ບູດ">ບູດ (Booth)</option>
              </select>
            </div>
            {/* Space Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ລະຫັດພື້ນທີ່ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.spaceCode}
                  onChange={(e) =>
                    handleSpaceCodeChange(e.target.value.toUpperCase())
                  }
                  list={`spaceCodes-${formData.spaceType}-${formData.zone}`}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.spaceCode ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={getSpaceCodePlaceholder()}
                  maxLength={5}
                />

                {/* Datalist for autocomplete */}
                <datalist
                  id={`spaceCodes-${formData.spaceType}-${formData.zone}`}
                >
                  {getAvailableSpaceCodesForCurrentSelection().map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>

                {/* Auto-suggest button */}
                <button
                  type="button"
                  onClick={handleAutoSuggestSpaceCode}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  ແນະນຳ
                </button>
              </div>

              {errors.spaceCode && (
                <p className="text-red-500 text-sm mt-1">{errors.spaceCode}</p>
              )}

            </div>

            {/* Zone */}
            {formData.spaceType === "ຫ້ອງເຊົ່າ" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ໂຊນ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => handleInputChange("zone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="G">G</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ສະຖານະ
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ວ່າງ">ວ່າງ (Vacant)</option>
                <option value="ເຊົ່າແລ້ວ">ເຊົ່າແລ້ວ (Rented)</option>
                <option value="ຊ່ອມແຊມ">ຊ່ອມແຊມ (Maintenance)</option>
              </select>
            </div>

            {/* Monthly Rent */}
            {/* Payment Configuration */}
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                ການກຳນົດຄ່າເຊົ່າ
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Frequency - Auto-selected based on space type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ຮູບແບບການຈ່າຍ
                  </label>
                  {getPaymentOptionsForSpaceType(formData.spaceType).length ===
                  1 ? (
                    // Single option - show as readonly
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                      {getPaymentFrequencyLabel(
                        getPaymentOptionsForSpaceType(formData.spaceType)[0]
                      )}
                    </div>
                  ) : (
                    // Multiple options - show as select
                    <select
                      value={formData.paymentFrequency}
                      onChange={(e) =>
                        handleInputChange("paymentFrequency", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getPaymentOptionsForSpaceType(formData.spaceType).map(
                        (option) => (
                          <option key={option} value={option}>
                            {getPaymentFrequencyLabel(option)}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>

                {/* Rent Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ຄ່າເຊົ່າ
                    {getPaymentFrequencyLabel(formData.paymentFrequency)} (KIP){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.baseRentAmount}
                      onChange={(e) =>
                        handleInputChange("baseRentAmount", e.target.value)
                      }
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.baseRentAmount
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={
                        formData.paymentFrequency === "daily"
                          ? "50000"
                          : formData.paymentFrequency === "monthly"
                          ? "500000"
                          : "5000000"
                      }
                      min="0"

                    />
                  </div>
                  {errors.baseRentAmount && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.baseRentAmount}
                    </p>
                  )}
                </div>
              </div>

              {/* Cost Preview */}
              {formData.baseRentAmount &&
                parseFloat(formData.baseRentAmount) > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">
                      ການຄິດໄລ່ຄ່າເຊົ່າ:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {formData.paymentFrequency !== "daily" && (
                        <div className="text-blue-700">
                          <span className="font-medium">ຕໍ່ມື້:</span> ₭
                          {Math.round(
                            parseFloat(formData.baseRentAmount) /
                              (formData.paymentFrequency === "monthly"
                                ? 30
                                : 365)
                          ).toLocaleString()}
                        </div>
                      )}
                      {formData.paymentFrequency !== "monthly" && (
                        <div className="text-blue-700">
                          <span className="font-medium">ຕໍ່ເດືອນ:</span> ₭
                          {Math.round(
                            parseFloat(formData.baseRentAmount) *
                              (formData.paymentFrequency === "daily"
                                ? 30
                                : formData.paymentFrequency === "yearly"
                                ? 1 / 12
                                : 1)
                          ).toLocaleString()}
                        </div>
                      )}
                      {formData.paymentFrequency !== "yearly" && (
                        <div className="text-blue-700">
                          <span className="font-medium">ຕໍ່ປີ:</span> ₭
                          {Math.round(
                            parseFloat(formData.baseRentAmount) *
                              (formData.paymentFrequency === "daily"
                                ? 365
                                : formData.paymentFrequency === "monthly"
                                ? 12
                                : 1)
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Product Category */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ປະເພດສິນຄ້າ
            </label>
            <input
              type="text"
              value={formData.productCategory}
              onChange={(e) =>
                handleInputChange("productCategory", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ເຊັ່ນ ອາຫານ, ເຄື່ອງນຸ່ງຫົ່ມ, ເຄື່ອງໃຊ້ໄຟຟ້າ"
            />
          </div>

          {/* Position Coordinates (Optional) */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ຕຳແໜ່ງພິກັດ (ເປັນທາງເລືອກ)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X</label>
                <input
                  type="number"
                  value={formData.position.x}
                  onChange={(e) =>
                    handleInputChange("position.x", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y</label>
                <input
                  type="number"
                  value={formData.position.y}
                  onChange={(e) =>
                    handleInputChange("position.y", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ໃຊ້ສຳລັບການສະແດງຜັງຕະຫຼາດ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-6">
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
              ) : editingSpace ? (
                "ອັບເດດພື້ນທີ່"
              ) : (
                "ເພີ່ມພື້ນທີ່ໃໝ່"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceModal;
