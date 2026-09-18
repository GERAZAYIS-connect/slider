import { useEffect, useState } from "react";

export function navigate(path: string): void {
  if (window.location.hash !== path) {
    window.location.hash = path;
  }
}

export function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}
