"use client"

import { TextField, type TextFieldProps } from "m3you"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

function Input({ className, type = "text", ...props }: TextFieldProps) {
  return (
    <TextField
      type={type}
      variant="filled"
      className={cn("app-text-field", className)}
      leadingIcon={type === "search" ? <Search size={20} /> : undefined}
      {...props}
    />
  )
}

export { Input }
