'use client';

import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PropertyCardMoreMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

export default function PropertyCardMoreMenu({
  items,
  compact = false
}: {
  items: PropertyCardMoreMenuItem[];
  compact?: boolean;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function close() {
      setOpen(false);
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  function toggleMenu(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ top: rect.bottom + 8, left: rect.right });
    }
    setOpen(true);
  }

  const buttonSize = compact ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Mais opções do anúncio"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggleMenu}
        className={`inline-flex ${buttonSize} shrink-0 items-center justify-center rounded-lg border border-ocean-200 bg-white text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
      >
        <MoreHorizontal className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
      </button>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[80] min-w-[220px] -translate-x-full rounded-xl border border-sand-200 bg-white py-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const className =
                'flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-sand-50 dark:text-slate-200 dark:hover:bg-slate-800';

              if (item.href) {
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    role="menuitem"
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noreferrer' : undefined}
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                    {item.label}
                  </a>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={className}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
