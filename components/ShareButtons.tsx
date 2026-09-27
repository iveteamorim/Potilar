'use client';

import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  buildNewsShareUrl,
  isNativeShareAbortError,
  shouldCountCopy,
  shouldCountNativeShare,
  type NewsShareAction
} from '@/lib/newsAnalytics';

export default function ShareButtons({
  title,
  url,
  compact = false,
  toolbar = false,
  text,
  variant,
  className = '',
  attribution = false,
  onShareAction
}: {
  title: string;
  url: string;
  compact?: boolean;
  toolbar?: boolean;
  text?: string;
  variant?: 'action' | 'icon';
  className?: string;
  attribution?: boolean;
  onShareAction?: (action: NewsShareAction) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listingMessage = `Olha este imóvel na Potilar: ${title} ${url}`;
  const shareText = text ?? title;
  const resolvedVariant = variant ?? (toolbar ? 'toolbar' : compact ? 'compact' : 'default');
  const isNewsShare = resolvedVariant === 'action' || resolvedVariant === 'icon';
  const whatsappShareUrl = attribution && isNewsShare ? buildNewsShareUrl(url, 'whatsapp') : url;
  const copyShareUrl = attribution && isNewsShare ? buildNewsShareUrl(url, 'copy') : url;
  const nativeShareUrl = attribution && isNewsShare ? buildNewsShareUrl(url, 'native') : url;
  const whatsappMessage = isNewsShare ? `${shareText} ${whatsappShareUrl}` : listingMessage;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function copyNewsLink() {
    try {
      await navigator.clipboard.writeText(copyShareUrl);
      setCopied(true);
      if (shouldCountCopy(true)) {
        onShareAction?.('copy');
      }
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function shareNativeOrToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: shareText, url: nativeShareUrl });
        if (shouldCountNativeShare('resolved')) {
          onShareAction?.('native');
        }
      } catch (error) {
        if (isNativeShareAbortError(error)) {
          setMenuOpen(false);
          return;
        }
      }
      setMenuOpen(false);
      return;
    }

    setMenuOpen((open) => !open);
  }

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (resolvedVariant === 'action' || resolvedVariant === 'icon') {
    const isIcon = resolvedVariant === 'icon';

    return (
      <div ref={rootRef} className={`relative ${className}`.trim()}>
        <button
          type="button"
          onClick={shareNativeOrToggle}
          aria-label={isIcon ? 'Compartilhar notícia' : undefined}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          className={
            isIcon
              ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-sand-200/80 bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:text-ocean-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300'
              : 'inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-ocean-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 dark:text-slate-400'
          }
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {isIcon ? null : 'Compartilhar'}
        </button>
        {menuOpen ? (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 min-w-[11rem] rounded-xl border border-sand-200 bg-white p-1.5 shadow-soft dark:border-slate-700 dark:bg-slate-900"
          >
            <a
              role="menuitem"
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                event.stopPropagation();
                onShareAction?.('whatsapp');
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand-50 hover:text-ocean-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                void copyNewsLink();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-sand-50 hover:text-ocean-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? 'Link copiado' : 'Copiar link'}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (toolbar) {
    const itemClass =
      'inline-flex flex-col items-center gap-1.5 text-[11px] font-semibold text-slate-600 transition hover:text-ocean-800 dark:text-slate-300';

    return (
      <>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className={itemClass}
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Compartilhar
        </a>
        <button type="button" onClick={copyLink} className={itemClass}>
          <Copy className="h-5 w-5" aria-hidden="true" />
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
      </>
    );
  }

  if (compact) {
    return (
      <>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-green-200 px-3 py-2 text-center font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-950/30"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Compartilhar
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ocean-200 px-3 py-2 text-center font-semibold text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? 'Link copiado' : 'Copiar link'}
        </button>
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Compartilhe este anúncio</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
        Envie para WhatsApp ou copie o link para divulgar.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Compartilhar
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ocean-200 px-4 py-3 text-sm font-semibold text-ocean-700 dark:border-slate-700 dark:text-slate-200"
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        {copied ? 'Link copiado' : 'Copiar link'}
      </button>
      </div>
    </div>
  );
}
