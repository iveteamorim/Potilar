'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Plus, Share, Smartphone, X } from 'lucide-react';

const STORAGE_KEY = 'potilar-pwa-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandaloneDisplay() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return true;
  }

  return userAgent.includes('Mac') && navigator.maxTouchPoints > 1;
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export default function HomePwaInstallCard() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeSheetButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const sheetTitleId = useId();

  useEffect(() => {
    setMounted(true);

    if (isStandaloneDisplay() || wasDismissed()) {
      return;
    }

    const ios = isIosDevice();
    setIsIos(ios);

    if (ios) {
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onAppInstalled() {
      persistDismissed();
      setInstallPrompt(null);
      setVisible(false);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!iosSheetOpen) {
      return;
    }

    closeSheetButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIosSheetOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [iosSheetOpen]);

  function dismissCard() {
    persistDismissed();
    setIosSheetOpen(false);
    setVisible(false);
  }

  async function handleInstall() {
    if (isIos) {
      setIosSheetOpen(true);
      return;
    }

    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice.outcome === 'accepted') {
        persistDismissed();
        setVisible(false);
      }
    } catch {
      setInstallPrompt(null);
    }
  }

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div className="md:hidden">
      <section className="border-b border-sand-200 bg-[#f7fbf8] px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="relative mx-auto max-w-6xl rounded-2xl border border-sand-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={dismissCard}
            aria-label="Fechar convite para instalar o PotiLar"
            className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-sand-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D62] dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#39B54A]/10 text-[#39B54A]">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-base font-semibold leading-snug text-[#002D62] dark:text-white">
                Tenha o PotiLar na tela inicial
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Acesse com mais rapidez pelo celular.</p>
              <button
                type="button"
                onClick={() => void handleInstall()}
                aria-describedby={titleId}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[#002D62] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#00244e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D62] focus-visible:ring-offset-2"
              >
                Instalar PotiLar
              </button>
            </div>
          </div>
        </div>
      </section>

      {iosSheetOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fechar instruções de instalação"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIosSheetOpen(false)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-sand-200 bg-white px-5 pb-8 pt-5 shadow-soft dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sand-200 dark:bg-slate-700" aria-hidden="true" />
            <h3 id={sheetTitleId} className="text-lg font-semibold text-[#002D62] dark:text-white">
              Adicionar o PotiLar à Tela de Início
            </h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sand-50 text-[#002D62] dark:bg-slate-800 dark:text-ocean-200">
                  <Share className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="font-semibold text-slate-900 dark:text-white">1. Toque em Compartilhar</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#39B54A]/10 text-[#39B54A]">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="font-semibold text-slate-900 dark:text-white">2. Escolha Adicionar à Tela de Início</span>
                </span>
              </li>
            </ol>
            <button
              ref={closeSheetButtonRef}
              type="button"
              onClick={() => setIosSheetOpen(false)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#002D62] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00244e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D62] focus-visible:ring-offset-2"
            >
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
