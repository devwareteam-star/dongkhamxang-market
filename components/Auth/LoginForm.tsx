'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Building2, User, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ValidationErrors {
  username?: string;
  password?: string;
}

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [selectedDemo, setSelectedDemo] = useState<string>('');
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false
  });

  // Validation functions
  const validateUsername = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້';
    }
    if (value.length < 3) {
      return 'ຊື່ຜູ້ໃຊ້ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ';
    }
    if (value.length > 20) {
      return 'ຊື່ຜູ້ໃຊ້ຕ້ອງບໍ່ເກີນ 20 ຕົວອັກສອນ';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'ຊື່ຜູ້ໃຊ້ໃຊ້ໄດ້ແຕ່ຕົວອັກສອນ ຕົວເລກ ແລະ _';
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'ກະລຸນາປ້ອນລະຫັດຜ່ານ';
    }
    if (value.length < 6) {
      return 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ';
    }
    if (value.length > 50) {
      return 'ລະຫັດຜ່ານຕ້ອງບໍ່ເກີນ 50 ຕົວອັກສອນ';
    }
    return undefined;
  };

  // Handle input changes with validation
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      const error = validateUsername(value);
      setValidationErrors(prev => ({ ...prev, username: error }));
    }
    // Clear general error when user starts typing
    if (error) setError('');
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setValidationErrors(prev => ({ ...prev, password: error }));
    }
    // Clear general error when user starts typing
    if (error) setError('');
  };

  // Handle input blur (when user leaves field)
  const handleBlur = (field: 'username' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'username') {
      const error = validateUsername(username);
      setValidationErrors(prev => ({ ...prev, username: error }));
    } else {
      const error = validatePassword(password);
      setValidationErrors(prev => ({ ...prev, password: error }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    return !usernameError && !passwordError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched for validation display
    setTouched({ username: true, password: true });

    // Validate all fields
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    
    setValidationErrors({
      username: usernameError,
      password: passwordError
    });

    // Stop if there are validation errors
    if (usernameError || passwordError) {
      setError('ກະລຸນາແກ້ໄຂຂໍ້ຜິດພາດໃນແບບຟອມ');
      return;
    }

    try {
      console.log('Attempting login with:', username, password);
      const success = await login(username, password);
      console.log('Login result:', success);
      if (!success) {
        setError('ຊື່ຜູ້ໃຊ້ຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ');
    }
  };

  // Updated to match the usernames in your AuthContext
  const handleDemoLogin = (demoUsername: string) => {
    console.log('Demo login clicked for:', demoUsername);
    
    // Clear validation errors when using demo
    setValidationErrors({});
    setTouched({ username: false, password: false });
    setError('');
    
    setUsername(demoUsername);
    
    // Set correct passwords based on your AuthContext users array
    if (demoUsername === 'admin') {
      setPassword('admin123');
    } else if (demoUsername === 'manager') {
      setPassword('manager123');
    } else if (demoUsername === 'staff') {
      setPassword('staff123');
    }
    
    setSelectedDemo(demoUsername);
  };

  // Helper function to get input border color based on validation state
  const getInputBorderClass = (fieldName: 'username' | 'password') => {
    const hasError = touched[fieldName] && validationErrors[fieldName];
    const isValid = touched[fieldName] && !validationErrors[fieldName] && (fieldName === 'username' ? username : password).length > 0;
    
    if (hasError) return 'border-red-300 focus:ring-red-500 focus:border-red-500';
    if (isValid) return 'border-green-300 focus:ring-green-500 focus:border-green-500';
    return 'border-gray-300 focus:ring-blue-500 focus:border-transparent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">ຕະຫຼາດສົດດົງຄຳຊ້າງ</h1>
            <p className="text-blue-100 text-sm">ລະບົບຄຸ້ມຄອງການເຊົ່າຕະຫຼາດ</p>
            <p className="text-blue-200 text-xs mt-1">Market Rental Management System</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ຊື່ຜູ້ໃຊ້ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  touched.username && validationErrors.username ? 'text-red-400' : 
                  touched.username && !validationErrors.username && username ? 'text-green-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onBlur={() => handleBlur('username')}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${getInputBorderClass('username')}`}
                  placeholder="ປ້ອນຊື່ຜູ້ໃຊ້"
                  required
                />
                {touched.username && !validationErrors.username && username && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {touched.username && validationErrors.username && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ລະຫັດຜ່ານ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  touched.password && validationErrors.password ? 'text-red-400' : 
                  touched.password && !validationErrors.password && password ? 'text-green-400' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pl-10 pr-20 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${getInputBorderClass('password')}`}
                  placeholder="ປ້ອນລະຫັດຜ່ານ"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {touched.password && !validationErrors.password && password && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {touched.password && validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`w-full py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isLoading || !isFormValid()
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ກຳລັງເຂົ້າສູ່ລະບົບ...</span>
                </div>
              ) : (
                'ເຂົ້າສູ່ລະບົບ'
              )}
            </button>
          </div>
        </form>

        {/* Demo Accounts - Updated to match AuthContext users */}
        <div className="bg-gray-50 p-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">ບັນຊີທົດລອງໃຊ້ງານ</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleDemoLogin('admin')}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedDemo === 'admin'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-purple-200 bg-white hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-purple-700">ຜູ້ຄຸ້ມຄອງສູງສຸດ</p>
                  <p className="text-sm text-purple-600">admin / admin123</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleDemoLogin('manager')}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedDemo === 'manager'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-indigo-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-indigo-700">ຜູ້ຈັດການຕະຫຼາດ</p>
                  <p className="text-sm text-indigo-600">manager / manager123</p>
                </div>
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleDemoLogin('staff')}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedDemo === 'staff'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-blue-700">ພະນັກງານເກັບເງິນ</p>
                  <p className="text-sm text-blue-600">staff / staff123</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              ຄິກທີ່ບັນຊີທົດລອງເພື່ອເຂົ້າສູ່ລະບົບອັດຕະໂນມັດ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;