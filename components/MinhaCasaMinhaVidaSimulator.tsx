'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Building2,
  Calculator,
  DollarSign,
  Home,
  Info,
  MapPin,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

const decimalCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

type SimulationMode = 'payment' | 'income' | 'property-income';

type McmvBand = {
  name: string;
  min: number;
  max: number;
  label: string;
  rate: number;
};

const BANDS: McmvBand[] = [
  { name: 'Faixa 1', min: 0, max: 2850, label: 'Renda familiar até R$ 2.850', rate: 4.85 },
  { name: 'Faixa 2', min: 2850.01, max: 4700, label: 'Renda familiar de R$ 2.850,01 até R$ 4.700', rate: 6.5 },
  { name: 'Faixa 3', min: 4700.01, max: 8600, label: 'Renda familiar de R$ 4.700,01 até R$ 8.600', rate: 7.23 },
  { name: 'Faixa 4', min: 8600.01, max: 12000, label: 'Renda familiar de R$ 8.600,01 até R$ 12.000', rate: 10.47 }
];

const RN_CITIES = [
  'Natal',
  'Parnamirim',
  'Mossoró',
  'São Gonçalo do Amarante',
  'Macaíba',
  'Ceará-Mirim',
  'Caicó',
  'Currais Novos',
  'Assú',
  'Pau dos Ferros'
];

const MODES = [
  {
    id: 'payment' as const,
    title: 'Pela prestação',
    subtitle: 'Sei quanto posso pagar por mês',
    text: 'Descubra qual imóvel cabe no seu bolso com essa parcela.',
    Icon: DollarSign,
    tone: 'blue',
    time: '1 minuto'
  },
  {
    id: 'income' as const,
    title: 'Pela renda mensal',
    subtitle: 'Sei minha renda familiar por mês',
    text: 'Saiba quanto você consegue financiar com sua renda.',
    Icon: TrendingUp,
    tone: 'amber',
    time: '1 minuto'
  },
  {
    id: 'property-income' as const,
    title: 'Renda + valor do imóvel',
    subtitle: 'Já sei a renda e o valor do imóvel',
    text: 'Veja se essa casa cabe no seu bolso.',
    Icon: Home,
    tone: 'green',
    time: '2 minutos'
  }
];

function parseMoney(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return value.includes(',') ? Number(digits) / 100 : Number(digits);
}

function formatMoneyInput(value: string) {
  const amount = Number(value.replace(/\D/g, '')) / 100;
  if (!amount) return '';
  return numberFormatter.format(amount);
}

function findBand(income: number) {
  return BANDS.find((band) => income >= band.min && income <= band.max) ?? BANDS[BANDS.length - 1];
}

function buildSearchHref(city: string, maxPrice: number) {
  const params = new URLSearchParams();
  params.set('transaction', 'Compra');
  if (city) params.set('city', city);
  if (maxPrice) params.set('maxPrice', String(Math.round(maxPrice)));
  return `/imoveis?${params.toString()}`;
}

function estimateMaxTerm(birthDate: string) {
  const year = Number(birthDate.split('/')[2]);
  if (!year) return 420;
  const age = new Date().getFullYear() - year;
  return Math.max(120, Math.min(420, (80 - age) * 12));
}

export default function MinhaCasaMinhaVidaSimulator() {
  const [mode, setMode] = useState<SimulationMode>('property-income');
  const [started, setStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [incomeInput, setIncomeInput] = useState('10.000,00');
  const [desiredPaymentInput, setDesiredPaymentInput] = useState('2.000,00');
  const [propertyInput, setPropertyInput] = useState('400.000,00');
  const [downPaymentInput, setDownPaymentInput] = useState('');
  const [fgtsInput, setFgtsInput] = useState('');
  const [birthDate, setBirthDate] = useState('10/08/1990');
  const [city, setCity] = useState('Natal');
  const [propertyType, setPropertyType] = useState<'Casa' | 'Apartamento'>('Casa');

  const result = useMemo(() => {
    const providedIncome = parseMoney(incomeInput);
    const desiredPayment = parseMoney(desiredPaymentInput);
    const providedPropertyValue = parseMoney(propertyInput);
    const downPayment = parseMoney(downPaymentInput);
    const fgts = parseMoney(fgtsInput);
    const term = estimateMaxTerm(birthDate);

    const income = mode === 'payment' ? desiredPayment / 0.3 : providedIncome;
    const band = findBand(income || 0);
    const monthlyRate = Math.pow(1 + band.rate / 100, 1 / 12) - 1;
    const paymentCapacity = mode === 'payment' ? desiredPayment : income * 0.3;
    const factor = monthlyRate > 0 ? (1 - Math.pow(1 + monthlyRate, -term)) / monthlyRate : term;
    const maxFinancing = paymentCapacity * factor;
    const propertyByCapacity = maxFinancing / 0.8;
    const propertyValue = mode === 'property-income' ? providedPropertyValue : propertyByCapacity;
    const minimumEntry = Math.max(propertyValue * 0.2, downPayment + fgts);
    const financing = Math.max(0, propertyValue - minimumEntry);
    const firstPayment =
      mode === 'property-income'
        ? monthlyRate > 0
          ? financing * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -term)))
          : financing / term
        : paymentCapacity;
    const expenses = propertyValue * 0.05;

    return {
      income,
      band,
      term,
      propertyValue,
      minimumEntry,
      financing,
      firstPayment,
      expenses,
      rate: band.rate
    };
  }, [birthDate, desiredPaymentInput, downPaymentInput, fgtsInput, incomeInput, mode, propertyInput]);

  const searchHref = buildSearchHref(city, result.propertyValue);
  const handleModeChange = (nextMode: SimulationMode) => {
    setMode(nextMode);
    setStarted(true);
    setShowResults(false);
  };
  const selectedMode = MODES.find((item) => item.id === mode) ?? MODES[0];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-slate-800 dark:bg-slate-900">
      {!started ? (
        <div className="bg-white px-5 py-10 sm:px-8 lg:px-14 lg:py-16 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-ocean-200 bg-ocean-50 px-4 py-1 text-sm font-semibold text-ocean-800">
              Simulação rápida
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl dark:text-white">
              Como você quer simular?
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Escolha a forma que faz mais sentido para você descobrir quanto pode financiar.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {MODES.map(({ id, title, subtitle, text, Icon, tone }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleModeChange(id)}
                className="group flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm transition hover:-translate-y-1 hover:border-ocean-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex flex-1 flex-col items-center justify-center p-7">
                  <span className={`grid h-16 w-16 place-items-center rounded-full ${iconTone(tone)}`}>
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="mt-8 text-2xl font-semibold leading-tight text-slate-950 dark:text-white">{title}</span>
                  <span className="mt-5 text-lg leading-7 text-slate-600 dark:text-slate-300">{subtitle}</span>
                </span>
                <span className="flex min-h-[76px] items-center justify-between border-t border-slate-200 bg-slate-50 px-6 text-left text-base leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {text}
                  <ArrowRight className={`ml-4 h-6 w-6 shrink-0 transition group-hover:translate-x-1 ${arrowTone(tone)}`} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
      <div className="bg-white px-5 py-8 sm:px-8 dark:bg-slate-950">
        <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-ocean-200 bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-800">
              {selectedMode.title}
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              Informe os dados para calcular
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setStarted(false);
              setShowResults(false);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            ← Página inicial
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-start">
          <TextField label="Data de nascimento *" value={birthDate} onChange={setBirthDate} placeholder="10/08/1990" />

          {mode === 'payment' ? (
            <MoneyField
              label="Prestação desejada *"
              helper="Quanto você gostaria de pagar por mês?"
              value={desiredPaymentInput}
              onChange={setDesiredPaymentInput}
            />
          ) : (
            <MoneyField
              label="Renda mensal *"
              helper="Sua renda mensal total bruta"
              value={incomeInput}
              onChange={setIncomeInput}
            />
          )}

          {mode === 'property-income' && (
            <MoneyField
              label="Valor do imóvel *"
              helper="Qual o valor do imóvel desejado?"
              value={propertyInput}
              onChange={setPropertyInput}
            />
          )}

          <button
            type="button"
            onClick={() => setShowResults(true)}
            className="inline-flex h-[60px] items-center justify-center gap-3 rounded-xl bg-ocean-700 px-7 text-base font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg lg:mt-7 lg:min-w-[180px]"
          >
            <Calculator className="h-5 w-5" />
            Calcular
          </button>
        </div>

        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900">
          <summary className="cursor-pointer text-sm font-bold text-ocean-800 dark:text-ocean-100">
            Ajustar cidade, tipo, entrada ou FGTS
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CitySelect value={city} onChange={setCity} />
            <PropertyTypeToggle value={propertyType} onChange={setPropertyType} />
            <MoneyField label="Entrada disponível" helper="Opcional" value={downPaymentInput} onChange={setDownPaymentInput} />
            <MoneyField label="FGTS disponível" helper="Opcional" value={fgtsInput} onChange={setFgtsInput} />
          </div>
        </details>

        {showResults && (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {mode === 'payment' && (
                <ResultCard
                  tone="blue"
                  Icon={DollarSign}
                  label="Renda estimada necessária"
                  value={decimalCurrencyFormatter.format(result.income)}
                  helper="Para pagar a prestação desejada"
                />
              )}
            <ResultCard
              tone="amber"
              Icon={Home}
              label="Valor do imóvel"
              value={decimalCurrencyFormatter.format(result.propertyValue)}
              helper="Valor estimado do imóvel"
            />
            <ResultCard
              tone="blue"
              Icon={DollarSign}
              label="Valor mínimo de entrada"
              value={decimalCurrencyFormatter.format(result.minimumEntry)}
            />
            <ResultCard
              tone="neutral"
              Icon={Calculator}
              label="Valor máximo de financiamento"
              value={decimalCurrencyFormatter.format(result.financing)}
              helper="Valor a ser financiado"
            />
            <ResultCard
              tone="neutral"
              Icon={Info}
              label="Taxa efetiva"
              value={`${result.rate.toFixed(2).replace('.', ',')}% a.a.`}
              helper="Taxa anual estimada"
            />
            <ResultCard tone="neutral" Icon={Info} label="Sistema de amortização" value="PRICE" helper="Parcelas fixas" />
            <ResultCard
              tone="green"
              Icon={DollarSign}
              label="Primeira parcela"
              value={decimalCurrencyFormatter.format(result.firstPayment)}
            />
            <ResultCard
              tone="neutral"
              Icon={Calculator}
              label="ITBI e outras despesas"
              value={decimalCurrencyFormatter.format(result.expenses)}
              helper="Aproximadamente 5% do valor"
            />
            <ResultCard
              tone="neutral"
              Icon={Info}
              label="Prazo máximo"
              value={`${result.term} meses`}
              helper="Prazo estimado de acordo com a idade"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <p className="font-bold text-slate-950 dark:text-white">Importante</p>
            <p className="mt-2 text-sm leading-7">
              Este resultado é apenas uma estimativa inicial. As condições finais dependem da análise de crédito, renda,
              documentação, regras vigentes e simulação completa da Caixa ou instituição financeira.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={searchHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ocean-700 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
            >
              Ver imóveis compatíveis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/mi-cuenta/alertas"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ocean-200 px-5 py-4 text-sm font-bold text-ocean-800 transition hover:-translate-y-0.5 hover:bg-ocean-50 dark:text-ocean-100"
            >
              <Bell className="h-4 w-4" />
              Receber alertas
            </Link>
          </div>
        </>
        )}
      </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[60px] rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-950 outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}

function MoneyField({
  label,
  helper,
  value,
  onChange
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
      <div className="flex h-[60px] min-w-0 items-center rounded-xl border border-slate-300 bg-white px-4 transition focus-within:border-ocean-600 focus-within:ring-2 focus-within:ring-ocean-100 dark:border-slate-700 dark:bg-slate-950">
        <span className="text-lg text-slate-950 dark:text-white">R$</span>
        <input
          value={value}
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
          inputMode="numeric"
          placeholder="0,00"
          className="ml-2 min-w-0 flex-1 bg-transparent text-lg text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
        />
      </div>
      {helper && <span className="text-sm text-slate-500 dark:text-slate-400">{helper}</span>}
    </label>
  );
}

function CitySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Onde deseja morar?</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[60px] rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-950 outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      >
        {RN_CITIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function PropertyTypeToggle({
  value,
  onChange
}: {
  value: 'Casa' | 'Apartamento';
  onChange: (value: 'Casa' | 'Apartamento') => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Tipo do imóvel</span>
      <div className="grid grid-cols-2 gap-2">
        {(['Casa', 'Apartamento'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`inline-flex h-[60px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
              value === item
                ? 'border-ocean-700 bg-ocean-700 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-ocean-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
            }`}
          >
            {item === 'Casa' ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function iconTone(tone: string) {
  if (tone === 'amber') return 'bg-amber-100 text-amber-700';
  if (tone === 'green') return 'bg-green-100 text-green-700';
  return 'bg-sky-100 text-ocean-700';
}

function timeTone(tone: string) {
  if (tone === 'amber') return 'border-amber-300 bg-amber-50 text-amber-800';
  if (tone === 'green') return 'border-green-300 bg-green-50 text-green-800';
  return 'border-sky-300 bg-sky-50 text-ocean-800';
}

function arrowTone(tone: string) {
  if (tone === 'amber') return 'text-amber-600';
  if (tone === 'green') return 'text-green-700';
  return 'text-ocean-700';
}

function resultTone(tone: string) {
  if (tone === 'amber') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (tone === 'blue') return 'border-sky-300 bg-sky-50 text-ocean-700';
  if (tone === 'green') return 'border-green-300 bg-green-50 text-green-700';
  return 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400';
}

function ResultCard({
  label,
  value,
  helper,
  tone = 'neutral',
  Icon
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: 'amber' | 'blue' | 'green' | 'neutral';
  Icon: typeof Home;
}) {
  return (
    <article className={`min-h-[170px] rounded-2xl border p-5 ${resultTone(tone)}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-base font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      </div>
      <p className="mt-8 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
      {helper && <p className="mt-5 text-base text-slate-600 dark:text-slate-300">{helper}</p>}
    </article>
  );
}

export function MinhaCasaMinhaVidaHighlights() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        {
          title: 'Entenda sua faixa',
          text: 'Veja uma indicação inicial pela renda familiar mensal.',
          Icon: ShieldCheck
        },
        {
          title: 'Busque imóveis no RN',
          text: 'Filtre anúncios de compra em cidades do Rio Grande do Norte.',
          Icon: MapPin
        },
        {
          title: 'Planeje a entrada',
          text: 'Some entrada e FGTS para visualizar o valor aproximado a financiar.',
          Icon: Home
        }
      ].map(({ title, text, Icon }) => (
        <article key={title} className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
        </article>
      ))}
    </div>
  );
}
