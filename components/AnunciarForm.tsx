'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronDown, Eye, Sparkles, X } from 'lucide-react';
import PixPaymentPanel from '@/components/PixPaymentPanel';
import PrecoJustoRNAdvisor from '@/components/PrecoJustoRNAdvisor';
import type { Property } from '@/data/properties';
import { compressImage } from '@/lib/imageCompression';
import { createClient } from '@/lib/supabase/client';
import { geocodeListingAddress } from '@/lib/geocodeListing';
import { KNOWN_CITY_NAMES, normalizeKnownCityName, resolveListingCoordinates } from '@/lib/locationCoordinates';
import { formatPlaceName as formatDisplayPlaceName } from '@/lib/textFormat';
import { getActiveListingStatuses, getListingLimitForAccount, getListingLimitLabel } from '@/lib/listingLimits';
import { PLANS, formatPlanPrice, getFreeListingLimit, getLaunchPromoDeadlineLabel, isLaunchPromoActive } from '@/lib/plans';

const PAID_LISTING_PRICE = PLANS.listing.additionalPrice;
const SEASONAL_LISTING_PRICE = PLANS.listing.seasonalPrice;
const LISTING_PRICE_LABEL = formatPlanPrice(PLANS.listing.additionalPrice);

type PhotoPreview = {
  file: File;
  url: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  if (typeof error === 'string') return error;
  return 'Erro desconhecido';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPlaceName(value: string) {
  const smallWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\p{L}[\p{L}'’]*/gu, (word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function cleanDocument(value: string) {
  return value.replace(/\D/g, '');
}

function formatCpfDocument(value: string) {
  return cleanDocument(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatBrazilPhone(value: string) {
  const digits = cleanDocument(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} ${digits.slice(2)}`;
}

function isValidBrazilMobilePhone(value: string) {
  const digits = cleanDocument(value);
  return digits.length === 11 && digits[2] === '9';
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

function hasSequentialDigits(value: string) {
  const ascending = '01234567890123456789';
  const descending = '98765432109876543210';
  return ascending.includes(value) || descending.includes(value);
}

function isValidCpf(value: string) {
  const digits = cleanDocument(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits) || hasSequentialDigits(digits)) return false;

  const calculateDigit = (length: number, factor: number) => {
    const sum = digits
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(9, 10) === Number(digits[9]) && calculateDigit(10, 11) === Number(digits[10]);
}

function normalizeVideoUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

type AnunciarFormProps = {
  referralCode?: string;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  defaultDocument?: string;
  accountType?: string;
  defaultCity?: string;
};

export default function AnunciarForm({
  referralCode,
  defaultName = '',
  defaultPhone = '',
  defaultEmail = '',
  defaultDocument = '',
  accountType = 'particular',
  defaultCity = ''
}: AnunciarFormProps) {
  const router = useRouter();
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [ownerName, setOwnerName] = useState(defaultName);
  const [ownerPhone, setOwnerPhone] = useState(defaultPhone);
  const [ownerEmail, setOwnerEmail] = useState(defaultEmail);
  const [ownerDocument, setOwnerDocument] = useState(formatCpfDocument(defaultDocument));
  const [contactMethods, setContactMethods] = useState<string[]>(['whatsapp']);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(defaultCity);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [community, setCommunity] = useState('');
  const [addressExtra, setAddressExtra] = useState('');
  const [propertyType, setPropertyType] = useState<Property['propertyType'] | ''>('');
  const [transaction, setTransaction] = useState<Property['transaction'] | ''>('');
  const [price, setPrice] = useState('');
  const [pricePeriod, setPricePeriod] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [parking, setParking] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [condoFee, setCondoFee] = useState('');
  const [condoIncluded, setCondoIncluded] = useState(false);
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [isFurnished, setIsFurnished] = useState(false);
  const [details, setDetails] = useState('');
  const [features, setFeatures] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [status, setStatus] = useState('');
  const [listingId] = useState(() => crypto.randomUUID());
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const isSeasonal = transaction === 'Temporada';
  const isLand = propertyType === 'Terreno';
  const ownerDocumentDigits = cleanDocument(ownerDocument);
  const lockedDocumentDigits = cleanDocument(defaultDocument);
  const hasLockedDocument = lockedDocumentDigits.length === 11;
  const ownerDocumentHasError =
    ownerDocumentDigits.length > 0 &&
    (ownerDocumentDigits.length < 11 || (ownerDocumentDigits.length === 11 && !isValidCpf(ownerDocument)));
  const ownerPhoneHasError = ownerPhone.length > 0 && !isValidBrazilMobilePhone(ownerPhone);
  const filteredCities = useMemo(() => {
    const search = normalizeSearch(location);
    if (!search) return KNOWN_CITY_NAMES;

    return KNOWN_CITY_NAMES.filter((city) => normalizeSearch(city).includes(search));
  }, [location]);

  useEffect(() => {
    if (!isLand) return;
    setBedrooms('');
    setBathrooms('');
    setParking('');
    setCondoFee('');
    setIsPetFriendly(false);
    setIsFurnished(false);
  }, [isLand]);

  function handlePhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 10 - photos.length)
      .map((file) => ({
        file,
        url: URL.createObjectURL(file)
      }));

    setPhotos((current) => [...current, ...selected]);
    event.target.value = '';
  }

  function removePhoto(url: string) {
    setPhotos((current) => {
      const photo = current.find((item) => item.url === url);
      if (photo) URL.revokeObjectURL(photo.url);
      return current.filter((item) => item.url !== url);
    });
  }

  function toggleContactMethod(method: string) {
    setContactMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method]
    );
  }

  function openCityPicker() {
    cityInputRef.current?.focus();
    setIsCityPickerOpen(true);
  }

  function selectCity(city: string) {
    setLocation(city);
    setIsCityPickerOpen(false);
    cityInputRef.current?.focus();
  }

  function generateSuggestion() {
    setStatus('');

    if (!location || !propertyType || !transaction) {
      setStatus('Informe pelo menos localização, tipo de imóvel e negociação para gerar a sugestão.');
      return;
    }

    setIsSuggesting(true);

    const cleanPrice = price ? ` por ${price}${transaction === 'Temporada' ? `/${pricePeriod}` : ''}` : '';
    const bedroomText = !isLand && Number(bedrooms) > 0 ? `${bedrooms} quarto${bedrooms === '1' ? '' : 's'}` : '';
    const bathroomText = !isLand && Number(bathrooms) > 0 ? `${bathrooms} banheiro${bathrooms === '1' ? '' : 's'}` : '';
    const parkingText = !isLand && Number(parking) > 0 ? `${parking} vaga${parking === '1' ? '' : 's'} de garagem` : '';
    const highlights = [bedroomText, bathroomText, parkingText].filter(Boolean);
    const typedFeatures = features
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const correctedLocation = formatDisplayPlaceName(normalizeKnownCityName(location));
    const locationHint = [correctedLocation, neighborhood, community].filter(Boolean).join(', ') || correctedLocation;
    const titleLocation = correctedLocation;
    const transactionLabel =
      transaction === 'Aluguel' ? 'alugar' : transaction === 'Temporada' ? 'temporada' : 'venda';
    const generatedTitle =
      title ||
      `${propertyType} para ${transactionLabel}${titleLocation ? ` em ${titleLocation}` : ''}`;
    const generatedFeatures =
      typedFeatures.length > 0
        ? typedFeatures
        : ['Boa localização', 'Fácil acesso', 'Oportunidade no RN'];

    const generatedDetails = [
      `${propertyType} disponível para ${transaction === 'Aluguel' ? 'aluguel' : transaction === 'Temporada' ? 'temporada' : 'venda'}${cleanPrice} em ${locationHint}.`,
      highlights.length
        ? `O imóvel conta com ${highlights.join(', ')}, oferecendo praticidade para quem busca conforto e boa localização.`
        : 'Uma boa opção para quem busca praticidade, localização e oportunidade no Rio Grande do Norte.',
      details
        ? `Informações do proprietário: ${details}`
        : addressExtra
          ? `Informação adicional: ${addressExtra}. Entre em contato para confirmar disponibilidade e agendar uma visita.`
          : 'Entre em contato para conhecer mais detalhes, confirmar disponibilidade e agendar uma visita.',
      `Diferenciais: ${generatedFeatures.join(', ')}.`
    ].join('\n\n');

    setTitle(generatedTitle);
    setDetails(generatedDetails);
    setFeatures(generatedFeatures.join(', '));
    setStatus('Sugestão gerada. Revise o texto antes de publicar.');
    setIsSuggesting(false);
  }

  function goToStep(step: number) {
    setStatus('');
    setActiveStep(Math.min(5, Math.max(1, step)));
  }

  function goNext() {
    setStatus('');

    if (activeStep === 1) {
      if (!ownerName || !ownerPhone || !ownerEmail) {
        setStatus('Informe nome, WhatsApp e email para continuar.');
        return;
      }

      const documentForListing = hasLockedDocument ? lockedDocumentDigits : ownerDocumentDigits;
      if (accountType === 'particular' && !isValidCpf(documentForListing)) {
        setStatus('Informe um CPF válido para verificação interna.');
        return;
      }
    }

    if (activeStep === 2 && (!location || !propertyType || !transaction || !price)) {
      setStatus('Informe cidade, tipo, negociação e preço para continuar.');
      return;
    }

    if (activeStep === 3 && photos.length < 6) {
      setStatus('Adicione pelo menos 6 fotos para continuar.');
      return;
    }

    if (activeStep === 4 && (!title || !details)) {
      setStatus('Crie ou revise o título e a descrição antes de continuar.');
      return;
    }

    goToStep(activeStep + 1);
  }

  async function publishListing() {
    setStatus('');

    if (!title || !location || !propertyType || !transaction || !price || !details) {
      setStatus('Preencha título, localização, tipo, negociação, preço e descrição.');
      return;
    }

    if (photos.length < 6) {
      setStatus('Adicione pelo menos 6 fotos para publicar o anúncio.');
      return;
    }

    const normalizedVideoUrl = normalizeVideoUrl(videoUrl);
    if (videoUrl.trim() && !normalizedVideoUrl) {
      setStatus('Informe um link de vídeo válido, com http:// ou https://.');
      return;
    }

    if (contactMethods.length === 0) {
      setStatus('Escolha pelo menos um meio de contato para os interessados.');
      return;
    }

    if (!acceptedTerms) {
      setStatus('Aceite os Termos de Uso e a Política de Privacidade para publicar o anúncio.');
      return;
    }

    const documentForListing = hasLockedDocument ? lockedDocumentDigits : ownerDocumentDigits;

    if (accountType === 'particular' && !isValidCpf(documentForListing)) {
      setStatus('Informe um CPF válido para verificação interna de segurança.');
      return;
    }

    if (accountType === 'particular' && hasLockedDocument && ownerDocumentDigits !== lockedDocumentDigits) {
      setStatus('O CPF do anúncio deve ser o mesmo CPF cadastrado na sua conta.');
      return;
    }

    if ((contactMethods.includes('phone') || contactMethods.includes('whatsapp')) && !isValidBrazilMobilePhone(ownerPhone)) {
      setStatus('Informe um telefone ou WhatsApp válido.');
      return;
    }

    if (contactMethods.includes('email') && !ownerEmail) {
      setStatus('Informe o email do anunciante.');
      return;
    }

    setIsPublishing(true);
    const supabase = createClient();

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?next=/anunciar');
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('role, account_type').eq('id', user.id).single();
      const isAdmin = profile?.role === 'admin';
      const accountType = profile?.account_type ?? 'particular';
      const listingLimit = getListingLimitForAccount(accountType, isAdmin);

      const { count, error: countError } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .in('status', [...getActiveListingStatuses()]);

      if (countError) {
        throw new Error(`Erro ao verificar anúncios gratuitos: ${countError.message}`);
      }

      if (!isAdmin && Number.isFinite(listingLimit) && (count ?? 0) >= listingLimit) {
        setStatus(
          `Você atingiu o limite de ${listingLimit} anúncios ativos (${getListingLimitLabel(accountType)}). Fale com a Potilar para ampliar seu plano.`
        );
        setIsPublishing(false);
        return;
      }

      const formattedLocation = formatDisplayPlaceName(normalizeKnownCityName(location));
      const formattedNeighborhood = neighborhood ? formatDisplayPlaceName(neighborhood) : '';
      const formattedCommunity = community ? formatDisplayPlaceName(community) : '';
      const freeListingLimit = getFreeListingLimit();
      const freeSlotsUsed = !isAdmin && (count ?? 0) >= freeListingLimit;
      const requiresListingPix = !isAdmin && (freeSlotsUsed || isSeasonal);
      const listingPaymentAmount = isSeasonal ? SEASONAL_LISTING_PRICE : PAID_LISTING_PRICE;

      if (requiresListingPix && !requiresPayment) {
        setRequiresPayment(true);
        setStatus(
          isSeasonal
            ? `Anúncio de temporada custa ${LISTING_PRICE_LABEL} por ${PLANS.listing.seasonalDurationDays} dias via Pix. Confira os dados e clique novamente para enviar.`
            : isLaunchPromoActive()
              ? `Você já usou os ${freeListingLimit} anúncios gratuitos da promoção (válida até ${getLaunchPromoDeadlineLabel()}). O próximo custa ${LISTING_PRICE_LABEL} via Pix. Confira os dados e clique novamente para enviar.`
              : `Você já usou seu anúncio gratuito. O próximo custa ${LISTING_PRICE_LABEL} via Pix. Confira os dados e clique novamente para enviar.`
        );
        setIsPublishing(false);
        return;
      }

      const imageUrls: string[] = [];

      for (const [index, photo] of photos.entries()) {
        const uploadFile = await compressImage(photo.file);
        const extension = uploadFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${listingId}/${index + 1}-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

        if (uploadError) {
          throw new Error(`Erro ao enviar foto "${photo.file.name}": ${uploadError.message}`);
        }

        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
        imageUrls.push(data.publicUrl);
      }

      const formattedStreet = street ? formatDisplayPlaceName(street) : '';
      const geocodedCoordinates = await geocodeListingAddress({
        street: formattedStreet,
        neighborhood: formattedNeighborhood,
        community: formattedCommunity,
        city: formattedLocation
      });
      const [lat, lng] =
        geocodedCoordinates ??
        resolveListingCoordinates(
          formattedLocation,
          formattedStreet,
          formattedNeighborhood,
          formattedCommunity,
          addressExtra
        );
      const listingPayload = {
        id: listingId,
        owner_id: user.id,
        slug: slugify(`${title}-${formattedLocation}-${listingId}`),
        title,
        property_type: propertyType,
        transaction,
        price: Number(price.replace(/\D/g, '')) || 0,
        price_period: transaction === 'Temporada' ? pricePeriod : null,
        bedrooms: isLand ? 0 : Number(bedrooms) || 0,
        bathrooms: isLand ? 0 : Number(bathrooms) || 0,
        parking: isLand ? 0 : Number(parking) || 0,
        area_sqm: Number(areaSqm) > 0 ? Number(areaSqm) : null,
        condo_fee: !isLand && Number(condoFee.replace(/\D/g, '')) > 0 ? Number(condoFee.replace(/\D/g, '')) : null,
        condo_included: !isLand && transaction === 'Aluguel' && condoIncluded,
        is_pet_friendly: !isLand && isPetFriendly,
        is_furnished: !isLand && isFurnished,
        location: formattedLocation,
        neighborhood: formattedNeighborhood || null,
        community: formattedCommunity || null,
        address_extra: addressExtra || null,
        lat,
        lng,
        images: imageUrls,
        video_url: normalizedVideoUrl,
        contact_name: ownerName || null,
        contact_phone: contactMethods.includes('phone') ? ownerPhone : null,
        contact_whatsapp: contactMethods.includes('whatsapp') ? ownerPhone : null,
        contact_email: contactMethods.includes('email') ? ownerEmail : null,
        contact_methods: contactMethods,
        description: details,
        features: features
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        is_paid: requiresListingPix,
        payment_status: requiresListingPix ? 'pix_pending' : 'not_required',
        payment_amount: requiresListingPix ? listingPaymentAmount : null,
        featured_plan: null,
        featured_payment_status: 'not_requested',
        featured_payment_amount: null,
        status: 'pending'
      };

      let insertPayload: Record<string, unknown> = referralCode ? { ...listingPayload, referral_code: referralCode } : listingPayload;
      let { error } = await supabase.from('listings').insert(insertPayload as any);

      if (error && /column|schema cache/i.test(error.message)) {
        const {
          area_sqm: _area,
          condo_fee: _condo,
          condo_included: _condoIncluded,
          is_pet_friendly: _pet,
          is_furnished: _furnished,
          video_url: _videoUrl,
          ...legacyPayload
        } = listingPayload;
        insertPayload = referralCode ? { ...legacyPayload, referral_code: referralCode } : legacyPayload;
        const retry = await supabase.from('listings').insert(insertPayload as any);
        error = retry.error;
      }

      if (error) {
        throw new Error(`Erro ao salvar anúncio: ${error.message}`);
      }

      if (ownerName || ownerPhone || documentForListing) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: ownerName,
          phone: ownerPhone,
          advertiser_document: documentForListing
        });

        if (profileError && !profileError.message.toLowerCase().includes('advertiser_document')) {
          throw new Error(`Erro ao salvar dados do anunciante: ${profileError.message}`);
        }
      }

      if (requiresListingPix) {
        router.push(`/mi-cuenta/pagar/${listingId}?tipo=${isSeasonal ? 'seasonal' : 'listing'}`);
        return;
      }

      setStatus('Anúncio gratuito enviado para revisão. Você pode acompanhar em Minha conta e ativar destaque depois.');
      router.push('/mi-cuenta');
    } catch (error) {
      console.error('Publish listing error', error);
      setStatus(`Não foi possível publicar. ${getErrorMessage(error)}`);
    } finally {
      setIsPublishing(false);
    }
  }

  const steps = ['Dados', 'Imóvel', 'Fotos', 'Descrição', 'Publicar'];
  const inputClass = 'w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900';
  const selectedPhoto = photos[0]?.url;
  const previewPrice = price ? `R$ ${price}` : 'R$ 0';
  const previewTitle = title || [propertyType, transaction === 'Aluguel' ? 'para alugar' : transaction === 'Temporada' ? 'para temporada' : 'para venda'].filter(Boolean).join(' ') || 'Seu imóvel na Potilar';

  return (
    <form className="glass-card overflow-hidden p-0">
      <div className="border-b border-sand-200 bg-white/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = activeStep === stepNumber;
            return (
              <button
                key={label}
                type="button"
                onClick={() => goToStep(stepNumber)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-ocean-600 text-white shadow-soft'
                    : 'bg-sand-50 text-slate-600 hover:bg-sand-100 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {stepNumber} {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5 p-6">
        {activeStep === 1 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Passo 1</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Quem está anunciando?</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Nome" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className={inputClass} />
              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="WhatsApp"
                  value={ownerPhone}
                  onChange={(event) => setOwnerPhone(formatBrazilPhone(event.target.value))}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-900 ${
                    ownerPhoneHasError
                      ? 'border-red-300 text-red-700 focus:border-red-500 focus:outline-none dark:border-red-800 dark:text-red-200'
                      : 'border-sand-200 dark:border-slate-700'
                  }`}
                />
                {ownerPhoneHasError && <p className="mt-2 text-xs font-semibold text-red-600">WhatsApp inválido.</p>}
              </div>
            </div>

            <input type="email" placeholder="Email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className={inputClass} />

            <details className="rounded-2xl border border-sand-200 bg-sand-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">Verificação de identidade</summary>
              <div className="mt-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="CPF"
                  value={ownerDocument}
                  onChange={(event) => {
                    if (!hasLockedDocument) setOwnerDocument(formatCpfDocument(event.target.value));
                  }}
                  readOnly={hasLockedDocument}
                  maxLength={14}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-950 ${
                    ownerDocumentHasError ? 'border-red-300 text-red-700' : 'border-sand-200 dark:border-slate-700'
                  }`}
                />
                {ownerDocumentHasError && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {ownerDocumentDigits.length < 11 ? 'CPF deve ter 11 dígitos.' : 'CPF inválido.'}
                  </p>
                )}
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Este dado não aparece no anúncio. Usamos apenas para verificação interna.
                </p>
              </div>
            </details>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['whatsapp', 'Mostrar WhatsApp'],
                ['phone', 'Mostrar telefone'],
                ['email', 'Mostrar email']
              ].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <input type="checkbox" checked={contactMethods.includes(value)} onChange={() => toggleContactMethod(value)} />
                  {label}
                </label>
              ))}
            </div>
          </section>
        )}

        {activeStep === 2 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Passo 2</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Sobre o imóvel</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <input
                  ref={cityInputRef}
                  type="text"
                  placeholder="Cidade"
                  value={location}
                  onFocus={() => setIsCityPickerOpen(true)}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setIsCityPickerOpen(true);
                  }}
                  className="city-autocomplete w-full appearance-none rounded-2xl border border-sand-200 bg-white px-4 py-3 pr-10 text-sm dark:border-slate-700 dark:bg-slate-900"
                  autoComplete="off"
                />
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={openCityPicker} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-sand-100 hover:text-slate-700" aria-label="Abrir lista de cidades">
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
                {isCityPickerOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] max-h-72 overflow-y-auto rounded-2xl border border-sand-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
                    {filteredCities.length > 0 ? (
                      filteredCities.slice(0, 80).map((city) => (
                        <button key={city} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectCity(city)} className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-sand-100 dark:text-slate-200 dark:hover:bg-slate-800">
                          {city} <span className="text-xs font-normal text-slate-400">RN</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-slate-500">Nenhuma cidade encontrada.</p>
                    )}
                  </div>
                )}
              </div>
              <input type="text" placeholder="Bairro" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className={inputClass} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder="Rua ou avenida" value={street} onChange={(event) => setStreet(event.target.value)} className={inputClass} />
              <input type="text" placeholder="Conjunto, condomínio ou loteamento" value={community} onChange={(event) => setCommunity(event.target.value)} className={inputClass} />
            </div>

            <input type="text" placeholder="Complemento ou referência" value={addressExtra} onChange={(event) => setAddressExtra(event.target.value)} className={inputClass} />

            <div className="grid gap-3 sm:grid-cols-2">
              <select value={propertyType} onChange={(event) => setPropertyType(event.target.value as Property['propertyType'])} className={inputClass}>
                <option value="">Tipo de imóvel</option>
                <option>Casa</option>
                <option>Terreno</option>
                <option>Apartamento</option>
                <option>Kitnet/Conjugado</option>
              </select>
              <select value={transaction} onChange={(event) => setTransaction(event.target.value as Property['transaction'])} className={inputClass}>
                <option value="">Negociação</option>
                <option>Compra</option>
                <option>Aluguel</option>
                <option>Temporada</option>
              </select>
            </div>

            <div className={`grid gap-3 ${isLand ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Preço</span>
                <input type="text" placeholder="R$" value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} />
              </label>
              {isSeasonal && (
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Período</span>
                  <select value={pricePeriod} onChange={(event) => setPricePeriod(event.target.value as 'dia' | 'semana' | 'mes')} className={inputClass}>
                    <option value="dia">Por dia</option>
                    <option value="semana">Por semana</option>
                    <option value="mes">Por mês</option>
                  </select>
                </label>
              )}
              {!isLand && (
                <>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Quartos</span>
                    <input type="number" min="0" placeholder="0" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className={inputClass} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Banheiros</span>
                    <input type="number" min="0" placeholder="0" value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} className={inputClass} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Garagem</span>
                    <input type="number" min="0" placeholder="0" value={parking} onChange={(event) => setParking(event.target.value)} className={inputClass} />
                  </label>
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" min="0" placeholder={isLand ? 'Área do terreno (m2)' : 'Área útil (m2)'} value={areaSqm} onChange={(event) => setAreaSqm(event.target.value)} className={inputClass} />
              {!isLand && <input type="text" placeholder="Condomínio (R$)" value={condoFee} onChange={(event) => setCondoFee(event.target.value)} className={inputClass} />}
            </div>

            <PrecoJustoRNAdvisor price={price} transaction={transaction} propertyType={propertyType} location={location} neighborhood={neighborhood} bedrooms={bedrooms} areaSqm={areaSqm} />

            {!isLand && (
              <div className="grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:grid-cols-3">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><input type="checkbox" checked={isPetFriendly} onChange={(event) => setIsPetFriendly(event.target.checked)} /> Aceita pet</label>
                <label className="inline-flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><input type="checkbox" checked={isFurnished} onChange={(event) => setIsFurnished(event.target.checked)} /> Mobiliado</label>
                {transaction === 'Aluguel' && (
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><input type="checkbox" checked={condoIncluded} onChange={(event) => setCondoIncluded(event.target.checked)} /> Condomínio incluso</label>
                )}
              </div>
            )}
          </section>
        )}

        {activeStep === 3 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Passo 3</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Fotos do imóvel</h3>
            </div>

            <div className="rounded-3xl border border-dashed border-ocean-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-sand-50 px-4 py-10 transition hover:bg-sand-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <Camera className="h-10 w-10 text-ocean-600" aria-hidden="true" />
                <span className="text-lg font-semibold text-slate-900 dark:text-white">Arraste suas fotos aqui</span>
                <span className="text-sm text-slate-500">ou selecionar fotos</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">{photos.length} / 10 fotos</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotos} className="sr-only" />
              </label>
              <p className="mt-4 text-xs font-semibold text-ocean-700">Mínimo 6 fotos. A primeira foto será a capa do anúncio.</p>

              {photos.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {photos.map((photo, index) => (
                    <div key={photo.url} className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                      <img src={photo.url} alt={photo.file.name} className="h-full w-full object-cover" />
                      {index === 0 && <span className="absolute left-1 top-1 rounded-full bg-ocean-600 px-2 py-1 text-[10px] font-semibold text-white">Capa</span>}
                      <button type="button" onClick={() => removePhoto(photo.url)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow" aria-label="Remover foto">
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="listing-video-url">Adicionar vídeo (opcional)</label>
              <p className="mt-1 text-xs text-slate-500">Cole um link do YouTube, Instagram, TikTok ou Drive.</p>
              <input id="listing-video-url" type="url" placeholder="https://..." value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className={`${inputClass} mt-3`} />
            </div>
          </section>
        )}

        {activeStep === 4 && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-ocean-100 bg-ocean-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Passo 4</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Crie seu anúncio em menos de 1 minuto</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Preencha apenas os dados básicos. A Potilar escreve o título e a descrição para você.</p>
            </div>

            <button type="button" onClick={generateSuggestion} disabled={isSuggesting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isSuggesting ? 'Criando anúncio...' : 'Criar anúncio com IA'}
            </button>

            <input type="text" placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
            <textarea rows={6} placeholder="Descrição" value={details} onChange={(event) => setDetails(event.target.value)} className={inputClass} />
            <input type="text" placeholder="Diferenciais: varanda, piscina, rua calçada" value={features} onChange={(event) => setFeatures(event.target.value)} className={inputClass} />
          </section>
        )}

        {activeStep === 5 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Passo 5</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Assim seu anúncio aparecerá</h3>
            </div>

            <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="aspect-[16/9] bg-sand-100">
                {selectedPhoto ? (
                  <img src={selectedPhoto} alt="Capa do anúncio" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Sua foto de capa</div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <h4 className="text-xl font-semibold text-ocean-800">{previewTitle}</h4>
                <p className="text-sm text-slate-500">{[location, neighborhood].filter(Boolean).join(' - ') || 'Rio Grande do Norte'}</p>
                <p className="text-2xl font-semibold text-ocean-700">{previewPrice}{isSeasonal ? `/${pricePeriod}` : ''}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  {!isLand && <span>{bedrooms || 0} quartos</span>}
                  {!isLand && <span>{bathrooms || 0} banheiros</span>}
                  {!isLand && <span>{parking || 0} vagas</span>}
                  {areaSqm && <span>{areaSqm} m2</span>}
                </div>
              </div>
            </div>

            {requiresPayment && (
              <PixPaymentPanel listingId={listingId} amount={isSeasonal ? SEASONAL_LISTING_PRICE : PAID_LISTING_PRICE} title={title || 'Novo anúncio Potilar'} kind={isSeasonal ? 'seasonal' : 'listing'} headline={isSeasonal ? `Temporada ${PLANS.listing.seasonalDurationDays} dias` : 'Imóvel adicional'} />
            )}

            <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5" />
              <span>
                Confirmo que as informações e fotos são verdadeiras e aceito os{' '}
                <a href="/termos-de-uso" target="_blank" className="font-semibold text-ocean-700">Termos de Uso</a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" className="font-semibold text-ocean-700">Política de Privacidade</a>.
              </span>
            </label>
          </section>
        )}

        {status && (
          <p className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {status}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-sand-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <button type="button" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 1} className="rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-40">
            Voltar
          </button>
          {activeStep < 5 ? (
            <button type="button" onClick={goNext} className="rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700">
              Continuar
            </button>
          ) : (
            <button type="button" onClick={publishListing} disabled={isPublishing} className="flex items-center justify-center gap-2 rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {isPublishing ? 'Publicando...' : requiresPayment ? 'Enviar anúncio pago para revisão' : 'Publicar anúncio grátis'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}



