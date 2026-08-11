import type { ReactNode } from "react";
import { Minus, Square, X } from "lucide-react";

interface WindowChromeProps {
  title: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function WindowChrome({ title, children, className = "", footer }: WindowChromeProps) {
  return (
    <section className={`retro-window ${className}`}>
      <div className="retro-window__titlebar">
        <div className="retro-window__brandmark" aria-hidden="true">PL</div>
        <span className="retro-window__title">{title}</span>
        <div className="retro-window__actions" aria-hidden="true">
          <span><Minus size={11} strokeWidth={3} /></span>
          <span><Square size={9} strokeWidth={3} /></span>
          <span><X size={12} strokeWidth={3} /></span>
        </div>
      </div>
      {children}
      {footer ? <div className="retro-window__footer">{footer}</div> : null}
    </section>
  );
}
