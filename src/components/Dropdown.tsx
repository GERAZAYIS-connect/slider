import React, { useEffect, useRef, useState } from "react";

interface DropdownProps {
  position?: string;
  width?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  button: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}

export function Dropdown({
  position = "left-0",
  width = "w-72",
  buttonClassName,
  ariaLabel,
  button,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ??
          "flex items-center gap-1.5 border border-ink bg-paper px-3 py-1.5 text-sm font-medium transition hover:border-blue hover:text-blue"
        }
      >
        {button(open)}
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 max-w-[calc(100vw-1.5rem)] border border-ink bg-paper shadow-hard ${position} ${width}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
