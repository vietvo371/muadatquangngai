"use client"

import React, { useMemo } from 'react'

interface PasswordStrengthProps {
  password?: string
}

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const score = useMemo(() => {
    if (!password) return -1
    let s = 0
    if (password.length >= 8) s += 1
    if (/[A-Z]/.test(password)) s += 1
    if (/[0-9]/.test(password)) s += 1
    if (/[^A-Za-z0-9]/.test(password)) s += 1
    return s
  }, [password])

  if (score === -1) return null

  const getStatus = (s: number) => {
    switch(s) {
      case 0: return { label: 'Quá yếu', color: 'bg-[#e03131]', textColor: 'text-[#e03131]' }
      case 1: return { label: 'Yếu', color: 'bg-[#f59e0b]', textColor: 'text-[#f59e0b]' }
      case 2: return { label: 'Trung bình', color: 'bg-[#facc15]', textColor: 'text-[#facc15]' }
      case 3: return { label: 'Mạnh', color: 'bg-[#10b981]', textColor: 'text-[#10b981]' }
      case 4: return { label: 'Rất mạnh', color: 'bg-[#059669]', textColor: 'text-[#059669]' }
      default: return { label: '', color: 'bg-gray-200', textColor: 'text-gray-500' }
    }
  }

  const status = getStatus(score)

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1 w-full">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full flex-1 rounded-full transition-colors duration-300 ${
              score > index ? status.color : (score === 0 && index === 0 ? status.color : 'bg-gray-200')
            }`}
          />
        ))}
      </div>
      <div className={`text-[12px] font-semibold text-right ${status.textColor}`}>
        {status.label}
      </div>
    </div>
  )
}
