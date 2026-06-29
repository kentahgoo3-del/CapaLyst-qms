import { useQuery } from "@tanstack/react-query";

  export interface CurrentUser {
    id: number;
    name: string;
    email: string;
    roles: string[];
  }

  export function useCurrentUser() {
    return useQuery<CurrentUser>({
      queryKey: ["auth", "me"],
      queryFn: async () => {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Not authenticated");
        return res.json() as Promise<CurrentUser>;
      },
      staleTime: 5 * 60 * 1000,
      retry: false,
    });
  }
  