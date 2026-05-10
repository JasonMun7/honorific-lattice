import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Icon control: shadcn `Button` + `Tooltip` / `TooltipTrigger asChild` / `TooltipContent`.
 * Pass `className` for sizing (e.g. h-10 w-10) over the default `size="icon"`.
 *
 * @param {{
 *   tooltip: string;
 *   className?: string;
 *   disabled?: boolean;
 *   side?: "top" | "right" | "bottom" | "left";
 *   sideOffset?: number;
 *   size?: import("react").ComponentProps<typeof Button>["size"];
 *   variant?: import("react").ComponentProps<typeof Button>["variant"];
 *   children: import("react").ReactNode;
 * } & Omit<import("react").ComponentProps<"button">, "title" | "size" | "variant">} props
 */
export default function IconTooltipButton({
  tooltip,
  className,
  disabled = false,
  side = "bottom",
  sideOffset = 8,
  children,
  type = "button",
  size = "icon",
  variant = "ghost",
  ...props
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type={type}
          variant={variant}
          size={size}
          disabled={disabled}
          className={cn(className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className="max-w-[min(20rem,calc(100vw-2rem))] px-3 py-2 text-left text-xs font-normal leading-snug shadow-lg"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
