import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  mustChangePassword: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => void;
  logout: () => Promise<void>;
  sessionExpiredRef: React.MutableRefObject<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionExpiredRef = useRef(false);

  const lastActivityRef = useRef<number>(Date.now());
  const timeoutMsRef = useRef<number>(0);

  const fetchConfig = () => {
    fetch("/api/settings/config", { credentials: "include" })
      .then((r) => r.ok ? r.json() : {})
      .then((config: Record<string, string>) => {
        const minutes = parseInt(config["session_timeout_minutes"] ?? "0", 10);
        timeoutMsRef.current = minutes > 0 ? minutes * 60 * 1000 : 0;
      })
      .catch(() => {});
  };

  const fetchMe = () => {
    setLoading(true);
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => { setUser(null); setLoading(false); });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  useEffect(() => { fetchMe(); }, []);

  // Re-fetch config on mount and whenever the user changes (e.g. after login)
  // so a freshly saved timeout setting takes effect immediately.
  useEffect(() => {
    fetchConfig();
  }, [user?.id]);

  // Also re-poll every 2 minutes so any setting change made during the session
  // takes effect without a page refresh.
  useEffect(() => {
    const interval = setInterval(fetchConfig, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track user activity — reset the clock on any interaction
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => document.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, onActivity));
  }, []);

  // Check for idle timeout every 10 seconds so a 1-minute timeout fires
  // within 10 seconds of expiring (previously 30 s, which felt broken).
  // Admin accounts are exempt from the session timeout.
  useEffect(() => {
    const interval = setInterval(() => {
      const timeoutMs = timeoutMsRef.current;
      if (!timeoutMs || !user) return;
      if (user.roles.includes("Admin")) return;
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > timeoutMs) {
        sessionExpiredRef.current = true;
        logout().catch(() => {});
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchMe, logout, sessionExpiredRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
