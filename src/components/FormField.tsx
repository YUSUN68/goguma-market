import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };

export default function FormField({ label, hint, id, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-skin focus:bg-white focus:ring-4 focus:ring-skin/10"
        {...props}
      />
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-skin py-3.5 text-[15px] font-bold text-white shadow-card transition hover:bg-skin-dark active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "잠시만요… 🍠" : children}
    </button>
  );
}

export function Alert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const style =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-flesh bg-flesh-soft text-skin-dark";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm ${style}`}>
      {children}
    </p>
  );
}
