import * as React from "react";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  iconFn?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, iconFn, ...props }, ref) => (
    <div className="relative">
      <input
        type={type}
        className={cn(
          "block h-10 border border-input rounded-md bg-background w-full px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
      {Icon && (
        <div className="absolute inset-y-0 end-3 flex items-center ps-3">
          <Icon
            className="h-5 w-5 text-muted-foreground hover:cursor-pointer z-20"
            onClick={iconFn}
          />
        </div>
      )}
    </div>
  )
);
Input.displayName = "Input";

export { Input };
