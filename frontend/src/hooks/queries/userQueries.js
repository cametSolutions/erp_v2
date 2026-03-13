// src/hooks/queries/userQueries.js
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/api/services/user.service";

export const userQueryKeys = {
  all: ["users"],
  list: () => [...userQueryKeys.all, "list"],
  detail: (userId) => [...userQueryKeys.all, "detail", userId],
};

export const useUserOptionsQuery = (enabled = true) =>
  useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: userService.getUsers,
    enabled,
    select: (users) =>
      (users || []).map((u) => ({
        id: u?._id || u?.id,
        name: u?.userName || u?.email || "Untitled User",
        email: u?.email || "",
        mobile: u?.mobileNumber || "",
        role: u?.role || "",
      })),
    staleTime: 30_000,
  });

export const useUserByIdQuery = (userId, enabled = true) =>
  useQuery({
    queryKey: userQueryKeys.detail(userId || ""),
    queryFn: () => userService.getUserById(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 30_000,
  });
