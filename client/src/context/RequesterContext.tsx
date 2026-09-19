import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { RequesterUser, fetchActiveRequesters } from "../api.js";

const LOCAL_STORAGE_KEY = "toktickit_current_requester";

interface RequesterContextType {
  currentRequester: RequesterUser | null;
  setCurrentRequester: (user: RequesterUser) => void;
  requesters: RequesterUser[];
  isLoading: boolean;
  error: string | null;
  setLoadingState: (val: boolean) => void;
  setErrorState: (msg: string | null) => void;
  isSelectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  reloadRequesters: () => Promise<void>;
}

const DEFAULT_REQUESTER: RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  department: "Engineering",
  isActive: true,
};

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export function RequesterProvider({ children }: { children: React.ReactNode }) {
  const [currentRequester, setCurrentRequesterState] = useState<RequesterUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const setLoadingState = (val: boolean) => {
    setIsLoading(val);
  };
  const [error, setError] = useState<string | null>(null);
  const setErrorState = (msg: string | null) => {
    setError(msg);
  };
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  const reloadRequesters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActiveRequesters();
      // Ensure only active users are kept
      const activeUsers = data.filter((u) => u.isActive);
      setRequesters(activeUsers);

      // Preserve current requester if still active
      setCurrentRequesterState((prev) => {
        if (!prev) return null;
        const matched = activeUsers.find((u) => u.id === prev.id);
        return matched || null;
      });
    } catch (err: any) {
      // Explicit error message for network/offline failures
      setError('Failed to fetch requesters. Connection error.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadRequesters();
  }, [reloadRequesters]);

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
    // When the selector is opened, attempt to fetch the latest requesters.
    // This will also set loading state and capture any errors.
    reloadRequesters();
    setIsSelectorOpen(true);
  }, [reloadRequesters]);

  const closeSelector = useCallback(() => {
    setIsSelectorOpen(false);
  }, []);


  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        setCurrentRequester,
        requesters,
        isLoading,
        error,
        setErrorState,
        setLoadingState,
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
