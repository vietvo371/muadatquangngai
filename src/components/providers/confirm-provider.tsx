"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFunction | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context
}

interface ConfirmProviderProps {
  children: React.ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((confirmOptions: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(confirmOptions)
      setOpen(true)
      setIsLoading(false)
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    if (resolveRef.current) {
      resolveRef.current(true)
    }
    // We keep open state true for a short moment to show loading if needed,
    // but usually resolve does async action outside, so we close it
    setOpen(false)
    setIsLoading(false)
  }, [])

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false)
    }
    setOpen(false)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel()
        }}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        isLoading={isLoading}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  )
}
