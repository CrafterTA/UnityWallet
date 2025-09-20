import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/session';

interface UseAutoLockOptions {
  timeoutMinutes?: number;
  onLock?: () => void;
  onUnlock?: () => void;
}

export const useAutoLock = (options: UseAutoLockOptions = {}) => {
  const { timeoutMinutes = 15, onLock, onUnlock } = options;
  const { logout, isAuthenticated } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Get timeout from localStorage or use default
  const getTimeoutMinutes = () => {
    const savedTimeout = localStorage.getItem('auto-lock-timeout');
    return savedTimeout ? parseInt(savedTimeout, 10) : timeoutMinutes;
  };

  // Reset timer when user is active
  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;
    
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const currentTimeoutMinutes = getTimeoutMinutes();
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        onLock?.(); // Chỉ lock ví, không logout
      }
    }, currentTimeoutMinutes * 60 * 1000);
  }, [isAuthenticated, timeoutMinutes, onLock]);

  // Track user activity
  const trackActivity = useCallback(() => {
    if (!isAuthenticated) return;
    resetTimer();
  }, [isAuthenticated, resetTimer]);

  // Setup event listeners for user activity
  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isAuthenticated, trackActivity, resetTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    resetTimer,
    trackActivity
  };
};
