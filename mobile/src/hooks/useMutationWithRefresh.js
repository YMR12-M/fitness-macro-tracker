import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/toast-context.js';

/**
 * A mutation that invalidates the queries its write affects, so a logged meal
 * updates the dashboard totals without a manual refetch anywhere. Failures
 * surface as a toast by default rather than being swallowed.
 */
export function useMutationWithRefresh({ mutationFn, invalidate = [], onSuccess, onError }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      for (const queryKey of invalidate) {
        queryClient.invalidateQueries({ queryKey });
      }
      onSuccess?.(...args);
    },
    onError: (error, ...rest) => {
      if (onError) return onError(error, ...rest);
      return toast.error(error.message);
    }
  });
}
