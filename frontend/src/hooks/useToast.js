// frontend/src/hooks/useToast.js
import toast from 'react-hot-toast';

export const useToast = () => {
  const success = (message) => toast.success(message);
  const error = (message) => toast.error(message);
  const info = (message) => toast(message);
  const warning = (message) => toast(message, { icon: '⚠️' });

  return { success, error, info, warning };
};