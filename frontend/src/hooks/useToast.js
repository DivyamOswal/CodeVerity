// frontend/src/hooks/useToast.js
import { useMemo } from 'react';
import toast from 'react-hot-toast';

export const useToast = () => {
  return useMemo(
    () => ({
      success: (message) => toast.success(message),
      error: (message) => toast.error(message),
      info: (message) => toast(message),
      warning: (message) => toast(message, { icon: '⚠️' }),
      promise: (promise, messages) => toast.promise(promise, messages),
    }),
    []
  );
};
