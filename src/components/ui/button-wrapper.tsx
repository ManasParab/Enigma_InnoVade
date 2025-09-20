import * as React from "react";
import { Button, buttonVariants } from "./button";
import { cn } from "./utils";
import type { VariantProps } from "class-variance-authority@0.7.1";

// Simple wrapper to ensure proper ref forwarding with asChild
export const ButtonWrapper = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & 
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>((props, ref) => {
  return <Button {...props} ref={ref} />;
});

ButtonWrapper.displayName = "ButtonWrapper";