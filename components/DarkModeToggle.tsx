'use client';

import * as Switch from '@radix-ui/react-switch';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function DarkModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (theme ?? resolvedTheme) === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-sun-500" aria-hidden="true" />
      <Switch.Root
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        className={cn(
          'relative h-6 w-11 cursor-pointer rounded-full border border-sand-300 bg-white shadow-inner transition dark:border-slate-700 dark:bg-slate-900'
        )}
        aria-label="Alternar modo escuro"
        disabled={!mounted}
      >
        <Switch.Thumb
          className={cn(
            'block h-5 w-5 translate-x-0 rounded-full bg-ocean-600 shadow transition-transform',
            isDark && 'translate-x-5'
          )}
        />
      </Switch.Root>
      <Moon className="h-4 w-4 text-slate-500" aria-hidden="true" />
    </div>
  );
}
