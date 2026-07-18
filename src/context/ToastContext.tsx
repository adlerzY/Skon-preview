"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const TOAST_DURATION_MS = 3000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100010] flex flex-col gap-2 items-center w-full px-4 pointer-events-none"
        dir="rtl"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-fit max-w-sm flex items-center gap-2 px-5 py-3 text-sm font-bold border bg-brand-menu shadow-[0_15px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200 ${
              t.type === "success" ? "border-brand-sabz/40 text-brand-sabz" : "border-red-500/40 text-red-500"
            }`}
          >
            {t.message}
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