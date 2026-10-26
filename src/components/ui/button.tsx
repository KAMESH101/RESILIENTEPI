import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs hover:bg-black dark:hover:bg-slate-100 hover:shadow-xs transition-all font-medium",
        outline:
          "border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 shadow-2xs aria-expanded:bg-white dark:aria-expanded:bg-white/10 transition-all",
        secondary:
          "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100/90 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-500/30 aria-expanded:bg-blue-100/80 shadow-2xs transition-colors",
        ghost:
          "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white aria-expanded:bg-white/70 dark:aria-expanded:bg-white/10 aria-expanded:text-slate-900 dark:aria-expanded:text-white transition-colors",
        destructive:
          "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/30 hover:bg-red-100/80 dark:hover:bg-red-900/50 focus-visible:border-red-400 focus-visible:ring-red-200",
        link: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9.5 gap-2 px-4.5 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-6.5 gap-1 rounded-full px-2.5 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-full px-3 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-6 rounded-full text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9 shrink-0 aspect-square rounded-full",
        "icon-xs":
          "size-6 shrink-0 aspect-square rounded-full in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7.5 shrink-0 aspect-square rounded-full in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-10.5 shrink-0 aspect-square rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// forwardRef: this project runs React 18, where `ref` is not a regular prop, and
// Radix triggers (`asChild`) need the button's ref to anchor popovers and menus.
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(function Button({ className, variant = "default", size = "default", asChild = false, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Button, buttonVariants }
