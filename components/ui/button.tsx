"use client"

import { Button as MaterialButton, type ButtonProps } from "m3you"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "app-button inline-flex items-center justify-center gap-2 font-medium [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
        secondary: "",
        ghost: "",
        destructive: "app-button-destructive",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        xs: "",
        sm: "",
        lg: "",
        icon: "app-button-icon",
        "icon-xs": "app-button-icon",
        "icon-sm": "app-button-icon",
        "icon-lg": "app-button-icon",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Omit<ButtonProps, "variant" | "size"> &
  VariantProps<typeof buttonVariants>) {
  const materialVariant = {
    default: "filled",
    outline: "outlined",
    secondary: "tonal",
    ghost: "text",
    destructive: "tonal",
    link: "text",
  } as const
  const materialSize =
    size === "xs" || size === "icon-xs"
      ? "xs"
      : size === "lg" || size === "icon-lg"
        ? "md"
        : "sm"
  return (
    <MaterialButton
      data-slot="button"
      variant={materialVariant[variant ?? "default"]}
      size={materialSize}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
