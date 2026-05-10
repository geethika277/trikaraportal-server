import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const qc = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      qc.clear();
    },
  });

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
