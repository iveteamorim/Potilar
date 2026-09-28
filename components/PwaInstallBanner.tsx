'use client';

import { useEffect, useId, useState } from 'react';
import { Plus, Share, X } from 'lucide-react';

const STORAGE_KEY = 'potilar-pwa-install-dismissed';

type BannerMode = 'android' | 'ios-safari' | 'ios-other';

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

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser|FBAN|FBAV|Instagram|Line\/|Twitter|GSA\//i.test(userAgent)) {
    return false;
  }

  return /Safari/i.test(userAgent);
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

export default function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<BannerMode | null>(null);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const sheetTitleId = useId();

  useEffect(() => {
    setMounted(true);

    if (isStandaloneDisplay() || wasDismissed()) {
      return;
    }

    if (isIosDevice()) {
      setMode(isIosSafari() ? 'ios-safari' : 'ios-other');
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMode('android');
      setVisible(true);
    }

    function onAppInstalled() {
      persistDismissed();
      setInstallPrompt(null);
      setVisible(false);
      setIosSheetOpen(false);
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

  function dismissBanner() {
    persistDismissed();
    setIosSheetOpen(false);
    setVisible(false);
  }

  async function handleAndroidInstall() {
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

  if (!mounted || !visible || !mode) {
    return null;
  }

  return (
    <div className="md:hidden">
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200/80 bg-white/90 px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-2 pb-[env(safe-area-inset-bottom)]">
          <div className="min-w-0 flex-1">
            {mode === 'android' ? (
              <button
                type="button"
                onClick={() => void handleAndroidInstall()}
                className="inline-flex max-w-full items-center rounded-full bg-[#002D62] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#00244e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D62] focus-visible:ring-offset-2"
              >
                Instalar PotiLar
              </button>
            ) : null}
            {mode === 'ios-safari' ? (
              <button
                type="button"
                onClick={() => setIosSheetOpen(true)}
                className="inline-flex max-w-full items-center rounded-full bg-[#002D62] px-3.5 py-1.5 text-left text-xs font-semibold leading-4 text-white transition hover:bg-[#00244e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D62] focus-visible:ring-offset-2"
              >
                Adicionar PotiLar à Tela de Início
              </button>
            ) : null}
            {mode === 'ios-other' ? (
              <p className="text-xs leading-4 text-slate-600 dark:text-slate-300">Abra o PotiLar no Safari para instalar.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Fechar convite para instalar o PotiLar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-sand-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D62] dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

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
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-sand-200 bg-white px-5 pb-8 pt-4 shadow-soft dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sand-200 dark:bg-slate-700" aria-hidden="true" />
            <h2 id={sheetTitleId} className="sr-only">
              Adicionar à Tela de Início
            </h2>
            <ol className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sand-50 text-[#002D62] dark:bg-slate-800 dark:text-ocean-200">
                  <Share className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-medium text-slate-900 dark:text-white">1. Compartilhar</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#39B54A]/10 text-[#39B54A]">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-medium text-slate-900 dark:text-white">2. Adicionar à Tela de Início</span>
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
