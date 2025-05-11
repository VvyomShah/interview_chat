"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { Send, Loader2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isSubmitting: boolean
  disabled?: boolean
}

export function ChatInput({ onSendMessage, isSubmitting, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when isSubmitting changes from true to false
  useEffect(() => {
    if (!isSubmitting && !disabled && inputRef.current) {
      // Small timeout to ensure the input is enabled before focusing
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }, [isSubmitting, disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting || disabled) return

    onSendMessage(input)
    setInput("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? "Interview has ended" : "Type your answer..."}
        disabled={isSubmitting || disabled}
        className="flex-1"
      />
      <Button type="submit" disabled={isSubmitting || disabled || !input.trim()}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  )
}
