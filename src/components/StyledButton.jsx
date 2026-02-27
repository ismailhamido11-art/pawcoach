import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StyledButton({ 
  children, 
  variant = "default", 
  size = "default",
  animated = true,
  className,
  ...props 
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        animated && "btn-hover",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}