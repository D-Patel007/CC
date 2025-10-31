"use client"
import { ThemeProvider } from "@/lib/context/ThemeContext"
import { ReactNode } from "react"

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
