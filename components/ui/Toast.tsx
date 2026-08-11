import { CheckCircle2, TriangleAlert, X } from "lucide-react";

interface ToastProps {
  message: string;
  tone?: "success" | "error";
  onDismiss?: () => void;
}

export function Toast({ message, tone = "success", onDismiss }: ToastProps) {
  return (
    <div className={`toast toast--${tone}`} role={tone === "error" ? "alert" : "status"}>
      {tone === "success" ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
      <span>{message}</span>
      {onDismiss ? (
        <button onClick={onDismiss} aria-label="Dismiss notification"><X size={14} /></button>
      ) : null}
    </div>
  );
}
