"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";
import { cn } from "./ui";

export default function CopyButton({
  text,
  label = "Copiar",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1_800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[8.5px] uppercase tracking-[0.08em] transition",
        copied
          ? "border-mint/30 bg-mint/[0.08] text-mint"
          : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20 hover:text-white",
        className,
      )}
      aria-label={copied ? "Copiado" : label}
    >
      {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
      {copied ? "Copiado" : label}
    </button>
  );
}
