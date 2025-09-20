import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/session';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { isDark } = useThemeStore();
  const { unlockWallet } = useAuthStore();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);

  // Reset form when modal opens and load timeout setting
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
      
      // Load timeout setting from localStorage
      const savedTimeout = localStorage.getItem('auto-lock-timeout');
      if (savedTimeout) {
        setTimeoutMinutes(parseInt(savedTimeout, 10));
      }
    }
  }, [isOpen]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsUnlocking(true);
    setError('');

    try {
      const success = unlockWallet(password);
      
      if (success) {
        toast.success('Mở khóa ví thành công');
        setPassword('');
        // Modal sẽ tự động đóng khi isLocked = false
      } else {
        setError('Mật khẩu không đúng. Vui lòng thử lại.');
      }
    } catch (error) {
      setError('Không thể mở khóa ví. Vui lòng thử lại.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Prevent closing modal with Escape key for security
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div 
        className={`relative rounded-2xl p-8 max-w-md w-full border shadow-2xl ${
          isDark 
            ? 'bg-gray-900 border-white/20' 
            : 'bg-white border-gray-200'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Security Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
           <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
             Ví đã bị khóa
           </h2>
           <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
             Nhập mật khẩu để mở khóa ví
           </p>
        </div>

        {/* Security Notice */}
        <div className={`rounded-lg p-4 mb-6 border ${
          isDark 
            ? 'bg-yellow-900/20 border-yellow-600/20' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div>
               <h4 className={`font-semibold text-sm mb-1 ${
                 isDark ? 'text-yellow-300' : 'text-yellow-800'
               }`}>
                 Thông báo bảo mật
               </h4>
               <p className={`text-sm ${
                 isDark ? 'text-yellow-400' : 'text-yellow-700'
               }`}>
                 Ví của bạn đã được tự động khóa để bảo mật sau {timeoutMinutes} phút không hoạt động.
               </p>
            </div>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
             <label className={`block text-sm font-medium mb-2 ${
               isDark ? 'text-white/80' : 'text-gray-700'
             }`}>
               Mật khẩu
             </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  isDark
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/50'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                 placeholder="Nhập mật khẩu ví của bạn"
                autoFocus
                disabled={isUnlocking}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                  isDark 
                    ? 'text-white/60 hover:text-white/80' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={isUnlocking}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg border ${
              isDark 
                ? 'bg-red-900/20 border-red-600/20 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Unlock Button */}
          <button
            type="submit"
            disabled={!password.trim() || isUnlocking}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isUnlocking ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 <span>Đang mở khóa...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                 <span>Mở khóa ví</span>
              </>
            )}
          </button>
        </form>

        {/* Security Tips */}
        <div className="mt-6 pt-4 border-t border-white/10">
           <p className={`text-xs text-center ${
             isDark ? 'text-white/50' : 'text-gray-500'
           }`}>
             💡 Mẹo: Ví của bạn tự động khóa sau {timeoutMinutes} phút không hoạt động để bảo mật
           </p>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
