"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";

export type ToastType = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MIN_TOAST_DURATION_MS = 3000;
const MAX_TOAST_DURATION_MS = 7000;

const TYPE_CLASSES: Record<ToastType, string> = {
  success: "border-brand-sabz/40 text-brand-sabz",
  error: "border-red-500/40 text-red-500",
  warning: "border-brand-zard/40 text-brand-zard",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idRef.current;
    const duration = Math.min(MAX_TOAST_DURATION_MS, Math.max(MIN_TOAST_DURATION_MS, message.length * 70));
    setToasts((previous) => [...previous, { id, message, type }]);
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, duration);
    timersRef.current.add(timer);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100010] flex flex-col gap-2 items-center w-full px-4 pointer-events-none"
        dir="rtl"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-fit max-w-sm flex items-center gap-2 px-5 py-3 text-sm font-bold leading-6 border bg-brand-menu shadow-[0_15px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200 ${TYPE_CLASSES[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};