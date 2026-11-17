import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { API_BASE } from "../utils/api.js";

export default function useStudentData(resource, collection, namespace = "students") {
    const {refresh: refreshSession} = useAuth();
    const [state, setState] = useState({data: null, loading: true, error: false});
    const request = useRef(null);
    const refresh = useCallback(async () => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setState({data: null, loading: true, error: false});
        try {
            const response = await fetch(`${API_BASE.replace(/\/$/, "")}/${namespace}/${resource}`, {
                credentials: "include", cache: "no-store", signal: controller.signal
            });
            if (response.status === 401) void refreshSession();
            if (!response.ok) throw new Error("Student request failed");
            const data = await response.json();
            if (!Array.isArray(data[collection])) throw new Error("Invalid student response");
            if (!controller.signal.aborted) setState({data, loading: false, error: false});
        } catch {
            if (!controller.signal.aborted) setState({data: null, loading: false, error: true});
        }
    }, [resource, collection, namespace, refreshSession]);
    useEffect(() => {
        void refresh();
        return () => request.current?.abort();
    }, [refresh]);
    return {...state, refresh};
}
