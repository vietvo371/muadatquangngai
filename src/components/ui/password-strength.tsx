"use client"

import React, { useMemo } from 'react'
import { Check, X } from 'lucide-react'

interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
  { label: 'Có chữ hoa (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Có chữ số (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'Có ký tự đặc biệt (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

interface PasswordStrengthProps {
  password?: string
  showChecklist?: boolean
}

export function PasswordStrength({ password = '', showChecklist = false }: PasswordStrengthProps) {
  const score = useMemo(() => {
    if (!password) return -1
    return PASSWORD_RULES.reduce((s, rule) => s + (rule.test(password) ? 1 : 0), 0)
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
      {showChecklist && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          {PASSWORD_RULES.map((rule) => {
            const passed = rule.test(password)
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}
              >
                {passed ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
