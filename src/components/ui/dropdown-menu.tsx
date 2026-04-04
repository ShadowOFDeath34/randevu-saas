"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("useDropdownMenu must be used within DropdownMenu")
  }
  return context
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = ({
  children,
  asChild
}: {
  children: React.ReactNode
  asChild?: boolean
}) => {
  const { open, setOpen } = useDropdownMenu()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return (
      <div onClick={handleClick} className="inline-flex">
        {children}
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  )
}

const DropdownMenuContent = ({
  children,
  align = "center"
}: {
  children: React.ReactNode
  align?: "start" | "center" | "end"
}) => {
  const { open } = useDropdownMenu()

  if (!open) return null

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0"
  }

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "top-full mt-1",
        alignClasses[align]
      )}
    >
      {children}
    </div>
  )
}

const DropdownMenuItem = ({
  children,
  className,
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) => {
  const { setOpen } = useDropdownMenu()

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
