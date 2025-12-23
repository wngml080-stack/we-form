"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
        classNames: {
          success: "!bg-green-50 !border-green-200 !text-green-800",
          error: "!bg-red-50 !border-red-200 !text-red-800",
          warning: "!bg-yellow-50 !border-yellow-200 !text-yellow-800",
          info: "!bg-blue-50 !border-blue-200 !text-blue-800",
        },
      }}
      richColors
      closeButton
      duration={3000}
    />
  );
}
