import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    image?: string
    fallback: string
    alt?: string
  }[]
  limit?: number
}

export function AvatarGroup({
  items,
  limit = 3,
  className,
  ...props
}: AvatarGroupProps) {
  const avatars = items.slice(0, limit)
  const excess = items.length - limit

  return (
    <div
      className={cn("flex items-center justify-end -space-x-2", className)}
      {...props}
    >
      {avatars.map((item, index) => (
        <Avatar
          key={index}
          className="ring-2 ring-background"
        >
          {item.image ? (
            <AvatarImage src={item.image} alt={item.alt || item.fallback} />
          ) : null}
          <AvatarFallback>{item.fallback}</AvatarFallback>
        </Avatar>
      ))}
      {excess > 0 ? (
        <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-background bg-muted text-muted-foreground">
          <span className="flex h-full w-full items-center justify-center text-xs font-medium">
            +{excess}
          </span>
        </div>
      ) : null}
    </div>
  )
}
