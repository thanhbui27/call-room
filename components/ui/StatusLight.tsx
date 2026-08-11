interface StatusLightProps {
  label: string;
  tone?: "green" | "amber" | "red" | "gray";
  pulse?: boolean;
}

export function StatusLight({ label, tone = "green", pulse = false }: StatusLightProps) {
  return (
    <span className="status-light">
      <span className={`status-light__dot status-light__dot--${tone} ${pulse ? "status-light__dot--pulse" : ""}`} />
      {label}
    </span>
  );
}
