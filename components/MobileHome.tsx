'use client';

import { cities } from '@/data/cities';
import { Calendar, Check, ChevronDown, Eye, Heart, Home, KeyRound, MapPin, Menu, MessageCircle, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const transactions = [
  { value: 'Compra', label: 'Comprar', Icon: Home },
  { value: 'Aluguel', label: 'Alugar', Icon: KeyRound },
  { value: 'Temporada', label: 'Temporada', Icon: Calendar }
] as const;

const propertyTypes = ['', 'Casa', 'Apartamento', 'Terreno', 'Kitnet/Conjugado', 'Ponto comercial'] as const;

const menuLinks = [
  { label: 'Início', href: '/' },
  { label: 'Imóveis', href: '/imoveis' },
  { label: 'Anunciar', href: '/anunciar' },
  { label: 'Favoritos', href: '/mi-cuenta/favoritos' },
  { label: 'Corretores / Imobiliárias', href: '/imobiliarias' },
  { label: 'Contato', href: '/contato' },
  { label: 'Financiamento de imóveis', href: '/minha-casa-minha-vida' },
  { label: 'Segurança', href: '/seguranca' }
];

export default function MobileHome() {
  const router = useRouter();
  const pathname = usePathname();
  const [transaction, setTransaction] = useState<(typeof transactions)[number]['value']>('Compra');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenedAt = useRef(0);

  function handleSearch() {
    const params = new URLSearchParams();
    if (propertyType) params.set('propertyType', propertyType);
    if (transaction) params.set('transaction', transaction);
    if (city) params.set('city', city);
    router.push(`/imoveis?${params.toString()}`);
  }

  function openChat() {
    router.push('/mi-cuenta/mensagens');
  }

  function openMenu() {
    menuOpenedAt.current = Date.now();
    setMenuOpen(true);
  }

  function closeMenu() {
    if (Date.now() - menuOpenedAt.current < 400) return;
    setMenuOpen(false);
  }

  const nav = [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Buscas', href: '/imoveis', icon: Search },
    { label: 'Favoritos', href: '/mi-cuenta/favoritos', icon: Heart },
    { label: 'Chat', href: '/mi-cuenta/mensagens', icon: MessageCircle }
  ];

  return (
    <div className="bg-[#07194A] text-white">
      <div className="flex w-full items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <Link href="/" className="flex min-w-0 items-center" aria-label="Potilar - Imoveis no Rio Grande do Norte">
          <span className="min-w-0">
            <span className="block truncate font-sans text-[1.65rem] font-black leading-none tracking-[-0.04em] max-[359px]:text-[1.4rem]">
              <span className="text-white">Poti</span>
              <span style={{ color: '#44B536' }}>Lar</span>
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-white/75 max-[359px]:text-[10px]">O portal de imóveis do RN</span>
          </span>
        </Link>
        <Link
          href="/mi-cuenta"
          aria-label="Minha conta"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e7c56a] bg-[#fff6df] text-[#07194A]"
        >
          <UserRound className="h-6 w-6 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>

      <div className="relative mx-auto h-52 w-full max-w-xl sm:h-72 md:h-80">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/ponta-negra-mobile.jpg')" }}
          role="img"
          aria-label="Ponta Negra, Natal (RN)"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07194A]/25 via-[#07194A]/10 to-[#07194A]" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <h1 className="max-w-[18rem] font-sans text-[1.7rem] font-semibold leading-snug tracking-[-0.02em] text-white max-[359px]:max-w-none max-[359px]:text-[1.45rem]">
            Encontre o seu imóvel no Rio Grande do Norte
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-3 px-4 pb-5 pt-4">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-[#0c2458] p-1">
          {transactions.map((option) => {
            const selected = transaction === option.value;
            const Icon = option.Icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTransaction(option.value)}
                className={`inline-flex h-11 min-w-0 items-center justify-center gap-1 rounded-xl px-1 text-[13px] font-bold max-[359px]:gap-0.5 max-[359px]:px-0.5 max-[359px]:text-[11px] ${
                  selected ? 'bg-[#C6EF3A] text-[#07194A]' : 'text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 max-[359px]:h-3.5 max-[359px]:w-3.5" strokeWidth={2.25} aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>

        <label className="relative block">
          <span className="sr-only">Tipo de imóvel</span>
          <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" aria-hidden="true" />
          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-white/15 bg-[#0c2458] pl-10 pr-10 text-sm font-semibold text-white outline-none"
          >
            {propertyTypes.map((type) => (
              <option key={type || 'todos'} value={type}>
                {type || 'Imóveis'}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" aria-hidden="true" />
        </label>

        <label className="relative block">
          <span className="sr-only">Cidade ou bairro</span>
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" aria-hidden="true" />
          <input
            list="mobile-rn-cities"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Onde você quer buscar?"
            className="h-12 w-full rounded-xl border border-white/15 bg-[#0c2458] pl-10 pr-4 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/45"
          />
          <datalist id="mobile-rn-cities">
            {cities.map((cityName) => (
              <option key={cityName} value={cityName} />
            ))}
          </datalist>
        </label>

        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C6EF3A] text-base font-bold text-[#07194A]"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          Buscar imóveis
        </button>

        <Link
          href="/anunciar"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#C6EF3A]/80 text-sm font-bold text-[#C6EF3A]"
        >
          + Publique seu anúncio
        </Link>

        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          {[
            { label: '2 anúncios grátis', Icon: Check },
            { label: 'Mais visibilidade', Icon: Eye },
            { label: 'Leads exclusivos', Icon: ShieldCheck }
          ].map(({ label, Icon }) => (
            <div key={label} className="px-1">
              <Icon className="mx-auto h-5 w-5 text-[#C6EF3A]" aria-hidden="true" />
              <p className="mt-1 text-[11px] font-semibold leading-tight text-white/85 max-[359px]:text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#091A49] pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
      >
        <div className="mx-auto grid w-full max-w-xl grid-cols-5">
          {nav.map((item) => {
            const active = item.label === 'Chat' ? pathname.startsWith('/mi-cuenta/mensagens') : item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            const className = `flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[11px] font-semibold max-[359px]:text-[10px] ${active ? 'text-[#C6EF3A]' : 'text-white/70'}`;
            if (item.label === 'Chat') {
              return (
                <button key={item.label} type="button" onClick={openChat} className={className}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link key={item.label} href={item.href} className={className}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={openMenu}
            className="flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[11px] font-semibold text-white/70 max-[359px]:text-[10px]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            Menu
          </button>
        </div>
      </nav>

      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[2000]">
            <button type="button" className="absolute inset-0 bg-slate-950/60" aria-label="Fechar menu" onClick={closeMenu} />
            <aside className="absolute bottom-0 right-0 top-0 z-10 flex w-[min(100%,20rem)] flex-col bg-[#EAF3FF] text-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#091A49]/10 px-4 py-4">
                <p className="text-lg font-black tracking-[-0.04em]">
                  <span className="text-[#07194A]">Poti</span>
                  <span style={{ color: '#44B536' }}>Lar</span>
                </p>
                <button type="button" onClick={() => setMenuOpen(false)} className="inline-flex h-11 w-11 items-center justify-center" aria-label="Fechar menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-1 overflow-y-auto p-3">
                {menuLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-base font-semibold text-slate-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </div>
  );
}
