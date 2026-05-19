"use client"

import React, { useState, useRef, KeyboardEvent } from 'react'

interface OTPInputProps {
  length?: number
  value?: string
  onChange?: (value: string) => void
}

export function OTPInput({ length = 6, value = '', onChange }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus()
    }
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (isNaN(Number(val))) return

    const newOtp = [...otp]
    // Get only the last character entered
    newOtp[index] = val.substring(val.length - 1)
    setOtp(newOtp)
    onChange?.(newOtp.join(''))

    // Move to next input if there's a value
    if (val && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current is empty, move to previous and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        onChange?.(newOtp.join(''))
        focusInput(index - 1)
      } else {
        // Clear current
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
        onChange?.(newOtp.join(''))
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < length; i++) {
      newOtp[i] = pastedData[i] || ''
    }
    setOtp(newOtp)
    onChange?.(newOtp.join(''))
    
    // Focus next empty or the last one
    focusInput(Math.min(pastedData.length, length - 1))
  }

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-[20px] font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-[#1075b1]/15 focus:border-[#1075b1] transition-all bg-white"
        />
      ))}
    </div>
  )
}
