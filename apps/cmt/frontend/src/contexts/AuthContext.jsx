import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API_BASE } from "../utils/api.js";
import { logout } from "../utils/auth.js";
import { homeForUser } from "../utils/roles.js";

export const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [session, setSession] = useState({user: null, status: "loading"});
    const request = useRef(null);
    const refresh = useCallback(async () => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setSession(current => current.user ? current : {user: null, status: "loading"});
        try {
            const response = await fetch(`${API_BASE.replace(/\/$/, "")}/auth/me`, {
                credentials: "include", cache: "no-store", signal: controller.signal
            });
            if (controller.signal.aborted) return;
            if (response.status === 401 || response.status === 403) {
                setSession({user: null, status: response.status === 401 ? "anonymous" : "forbidden"});
                return;
            }
            if (!response.ok) throw new Error("Session verification failed");
            const {user} = await response.json();
            if (controller.signal.aborted) return;
            if (!homeForUser(user)) {
                setSession({user: null, status: "forbidden"});
                return;
            }
            setSession({user, status: "authenticated"});
        } catch {
            if (!controller.signal.aborted) setSession({user: null, status: "error"});
        }
    }, []);

    useEffect(() => {
        void refresh();
        const recheck = () => { if (document.visibilityState === "visible") void refresh(); };
        window.addEventListener("focus", recheck);
        document.addEventListener("visibilitychange", recheck);
        return () => {
            request.current?.abort();
            window.removeEventListener("focus", recheck);
            document.removeEventListener("visibilitychange", recheck);
        };
    }, [refresh]);

    useEffect(() => {
        if (typeof session.user?.expiresInMs !== "number") return;
        const delay = Math.max(0, Math.min(session.user.expiresInMs, 2147483647));
        const timer = window.setTimeout(() => {
            setSession({user: null, status: "loading"});
            void refresh();
        }, delay);
        return () => window.clearTimeout(timer);
    }, [session.user, refresh]);

    const signOut = useCallback(() => {
        request.current?.abort();
        setSession({user: null, status: "anonymous"});
        logout();
    }, []);

    // Discard mounted views and cached data when the verified account changes.
    const identity = session.user ? `${session.user.email}:${session.user.studentProfileId || ""}` : "anonymous";
    return <AuthContext.Provider key={identity} value={{...session, refresh, signOut}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const auth = useContext(AuthContext);
    if (!auth) throw new Error("AuthProvider is required");
    return auth;
}
