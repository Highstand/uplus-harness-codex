import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import inputErrorIcon from "./input-error.svg";

type Children = { children: ReactNode };

export function ScreenShell({ children }: Children) {
  return <div className="ui-shell">{children}</div>;
}

export function Header({ title, leading, trailing }: { title: string; leading?: ReactNode; trailing?: ReactNode }) {
  return <header className="ui-header">{leading}<h1 className="ui-header-title">{title}</h1>{trailing}</header>;
}

export function Content({ children }: Children) {
  return <main className="ui-content">{children}</main>;
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style"> & {
  variant?: "primary" | "secondary";
  scale?: "sm" | "lg" | "xl";
};

export function Button({ variant = "primary", scale = "lg", type = "button", ...props }: ButtonProps) {
  return <button {...props} type={type} className="ui-button" data-variant={variant} data-scale={scale} />;
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "style" | "size"> & {
  id: string;
  label: string;
  error?: string;
};

export function Input({ id, label, error, disabled, placeholder = label, "aria-describedby": describedBy, ...props }: InputProps) {
  const errorId = `${id}-error`;
  const showError = Boolean(error) && !disabled;
  return <div className="ui-field">
    <div className="ui-input-field" data-invalid={showError}>
      <input {...props} id={id} disabled={disabled} placeholder={placeholder} aria-label={label} className="ui-input" aria-invalid={showError} aria-describedby={showError ? [describedBy, errorId].filter(Boolean).join(" ") : describedBy} />
    </div>
    {showError && <div id={errorId} className="ui-input-message" role="alert"><Image src={inputErrorIcon} alt="" unoptimized className="ui-input-error-icon" /><p className="ui-input-error">{error}</p></div>}
  </div>;
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "style" | "size"> & { label: string };

export function Checkbox({ label, ...props }: CheckboxProps) {
  return <label className="ui-checkbox-label"><input {...props} type="checkbox" className="ui-checkbox" /><span>{label}</span></label>;
}

export function FilterChip({ selected, ...props }: Omit<ButtonProps, "variant" | "scale"> & { selected: boolean }) {
  return <button {...props} type="button" className="ui-chip" aria-pressed={selected} />;
}

export function Tag({ children }: Children) {
  return <span className="ui-tag">{children}</span>;
}

export function ListRow({ label, children }: Children & { label: string }) {
  return <div className="ui-row"><span className="ui-row-label">{label}</span><span>{children}</span></div>;
}

export function Card({ children, selected = false }: Children & { selected?: boolean }) {
  return <section className="ui-card" data-selected={selected}>{children}</section>;
}

export function BottomCTA({ children, summary, layout = "single" }: Children & { summary?: ReactNode; layout?: "single" | "double" | "price" }) {
  return <footer className="ui-bottom-cta" data-layout={layout}>{summary}<div className="ui-actions">{children}</div></footer>;
}
