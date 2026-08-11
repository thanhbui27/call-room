"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "primary" | "neutral" | "danger" | "ghost" | "ink";

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  icon?: ReactNode;
  compact?: boolean;
}

export function RetroButton({
  children,
  className = "",
  tone = "neutral",
  icon,
  compact = false,
  type = "button",
  ...props
}: RetroButtonProps) {
  return (
    <button
      type={type}
      className={`retro-button retro-button--${tone} ${compact ? "retro-button--compact" : ""} ${className}`}
      {...props}
    >
      {icon ? <span className="retro-button__icon" aria-hidden="true">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
