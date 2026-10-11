"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Hoy", icon: "🏠" },
  { href: "/history", label: "Historial", icon: "📈" },
  { href: "/log", label: "Agregar", icon: "📷", primary: true },
  { href: "/weight", label: "Peso", icon: "⚖️" },
  { href: "/goals", label: "Objetivo", icon: "🎯" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-lg items-end justify-around px-2">
        {tabs.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          if (t.primary) {
            return (
              <li key={t.href} className="-mt-6">
                <Link
                  href={t.href}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-accent text-2xl text-[#06281c] shadow-lg shadow-accent/30"
                  aria-label={t.label}
                >
                  {t.icon}
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] ${active ? "text-accent" : "text-muted"}`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
