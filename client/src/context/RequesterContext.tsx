import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { RequesterUser, fetchActiveRequesters } from "../api.js";

const LOCAL_STORAGE_KEY = "toktickit_current_requester";

interface RequesterContextType {
  currentRequester: RequesterUser | null;
  setCurrentRequester: (user: RequesterUser) => void;
  requesters: RequesterUser[];
  isLoading: boolean;
  error: string | null;
  isSelectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  reloadRequesters: () => Promise<void>;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export function RequesterProvider({ children }: { children: React.ReactNode }) {
  const [currentRequester, setCurrentRequesterState] = useState<RequesterUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  const reloadRequesters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActiveRequesters();
      // Ensure only active users are kept
      const activeUsers = data.filter((u) => u.isActive);
      setRequesters(activeUsers);

      // If currentRequester is set, ensure it still exists in active users;
      // if not set yet, we leave it or prompt selection
      setCurrentRequesterState((prev) => {
        if (!prev) return null;
        const matched = activeUsers.find((u) => u.id === prev.id);
        return matched || null;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load requesters");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadRequesters();
  }, [reloadRequesters]);

  // If initial load completes and there's no current requester, open selector automatically
  useEffect(() => {
    if (!isLoading && !currentRequester && requesters.length > 0) {
      setIsSelectorOpen(true);
    }
  }, [isLoading, currentRequester, requesters.length]);

  const setCurrentRequester = useCallback((user: RequesterUser) => {
    setCurrentRequesterState(user);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore storage errors
    }
    setIsSelectorOpen(false);
  }, []);

  const openSelector = useCallback(() => {
    setIsSelectorOpen(true);
  }, []);

  const closeSelector = useCallback(() => {
    // Only allow closing if a user is already selected
    if (currentRequester) {
      setIsSelectorOpen(false);
    }
  }, [currentRequester]);

  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        setCurrentRequester,
        requesters,
        isLoading,
        error,
        isSelectorOpen,
        openSelector,
        closeSelector,
        reloadRequesters,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
