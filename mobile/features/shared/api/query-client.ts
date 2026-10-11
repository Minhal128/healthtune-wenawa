import { QueryClient, QueryKey } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const invalidateQuery = (...args: QueryKey) => {
  return queryClient.invalidateQueries({ queryKey: args });
};

export const resetQuery = (...args: QueryKey) => {
  return queryClient.resetQueries({ queryKey: args });
};

export const refetchQuery = (...args: QueryKey) => {
  return queryClient.refetchQueries({ queryKey: args });
};