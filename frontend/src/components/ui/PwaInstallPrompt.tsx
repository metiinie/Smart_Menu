'use client';

import { useEffect, useState } from 'react';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem('arifsmart_pwa_prompt_dismissed') === '1';
    if (dismissed) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
      setHidden(false);
    };

    const onInstalled = () => {
      setHidden(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setHidden(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setHidden(true);
    localStorage.setItem('arifsmart_pwa_prompt_dismissed', '1');
  };

  if (hidden || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[120] max-w-md mx-auto">
      <div className="rounded-2xl bg-white/95 backdrop-blur border border-emerald-200 shadow-xl p-3">
        <p className="text-sm font-semibold text-slate-800">Install ArifSmart app on your phone</p>
        <p className="text-xs text-slate-500 mt-1">Open menu faster and use it like a native app.</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-[#08AE75] text-white text-sm font-semibold py-2"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 rounded-xl border border-slate-300 text-slate-600 text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
