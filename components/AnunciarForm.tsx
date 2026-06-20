'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronDown, Eye, Sparkles, Upload, X } from 'lucide-react';
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
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [isFurnished, setIsFurnished] = useState(false);
  const [details, setDetails] = useState('');
  const [features, setFeatures] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [status, setStatus] = useState('');
  const [listingId] = useState(() => crypto.randomUUID());
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
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
      setStatus('Informe pelo menos localizacao, tipo de imovel e negociacao para gerar a sugestao.');
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
        : ['Boa localizacao', 'Facil acesso', 'Oportunidade no RN'];

    const generatedDetails = [
      `${propertyType} disponivel para ${transaction === 'Aluguel' ? 'aluguel' : transaction === 'Temporada' ? 'temporada' : 'venda'}${cleanPrice} em ${locationHint}.`,
      highlights.length
        ? `O imovel conta com ${highlights.join(', ')}, oferecendo praticidade para quem busca conforto e boa localizacao.`
        : 'Uma boa opcao para quem busca praticidade, localizacao e oportunidade no Rio Grande do Norte.',
      details
        ? `Informacoes do proprietario: ${details}`
        : addressExtra
          ? `Informacao adicional: ${addressExtra}. Entre em contato para confirmar disponibilidade e agendar uma visita.`
          : 'Entre em contato para conhecer mais detalhes, confirmar disponibilidade e agendar uma visita.',
      `Diferenciais: ${generatedFeatures.join(', ')}.`
    ].join('\n\n');

    setTitle(generatedTitle);
    setDetails(generatedDetails);
    setFeatures(generatedFeatures.join(', '));
    setStatus('Sugestao gerada. Revise o texto antes de publicar.');
    setIsSuggesting(false);
  }

  async function publishListing() {
    setStatus('');

    if (!title || !location || !propertyType || !transaction || !price || !details) {
      setStatus('Preencha titulo, localizacao, tipo, negociacao, preco e descricao.');
      return;
    }

    if (photos.length < 3) {
      setStatus('Adicione pelo menos 3 fotos para publicar o anuncio.');
      return;
    }

    if (contactMethods.length === 0) {
      setStatus('Escolha pelo menos um meio de contato para os interessados.');
      return;
    }

    if (!acceptedTerms) {
      setStatus('Aceite os Termos de Uso e a Politica de Privacidade para publicar o anuncio.');
      return;
    }

    const documentForListing = hasLockedDocument ? lockedDocumentDigits : ownerDocumentDigits;

    if (accountType === 'particular' && !isValidCpf(documentForListing)) {
      setStatus('Informe um CPF valido para verificacao interna de seguranca.');
      return;
    }

    if (accountType === 'particular' && hasLockedDocument && ownerDocumentDigits !== lockedDocumentDigits) {
      setStatus('O CPF do anuncio deve ser o mesmo CPF cadastrado na sua conta.');
      return;
    }

    if ((contactMethods.includes('phone') || contactMethods.includes('whatsapp')) && !isValidBrazilMobilePhone(ownerPhone)) {
      setStatus('Informe um telefone ou WhatsApp valido.');
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
        throw new Error(`Erro ao verificar anuncios gratuitos: ${countError.message}`);
      }

      if (!isAdmin && Number.isFinite(listingLimit) && (count ?? 0) >= listingLimit) {
        setStatus(
          `Voce atingiu o limite de ${listingLimit} anuncios ativos (${getListingLimitLabel(accountType)}). Fale com a Potilar para ampliar seu plano.`
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
            ? `Anuncio de temporada custa ${LISTING_PRICE_LABEL} por ${PLANS.listing.seasonalDurationDays} dias via Pix. Confira os dados e clique novamente para enviar.`
            : isLaunchPromoActive()
              ? `Voce ja usou os ${freeListingLimit} anuncios gratuitos da promocao (valida ate ${getLaunchPromoDeadlineLabel()}). O proximo custa ${LISTING_PRICE_LABEL} via Pix. Confira os dados e clique novamente para enviar.`
              : `Voce ja usou seu anuncio gratuito. O proximo custa ${LISTING_PRICE_LABEL} via Pix. Confira os dados e clique novamente para enviar.`
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
        is_pet_friendly: !isLand && isPetFriendly,
        is_furnished: !isLand && isFurnished,
        location: formattedLocation,
        neighborhood: formattedNeighborhood || null,
        community: formattedCommunity || null,
        address_extra: addressExtra || null,
        lat,
        lng,
        images: imageUrls,
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
          is_pet_friendly: _pet,
          is_furnished: _furnished,
          ...legacyPayload
        } = listingPayload;
        insertPayload = referralCode ? { ...legacyPayload, referral_code: referralCode } : legacyPayload;
        const retry = await supabase.from('listings').insert(insertPayload as any);
        error = retry.error;
      }

      if (error) {
        throw new Error(`Erro ao salvar anuncio: ${error.message}`);
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

      setStatus('Anuncio gratuito enviado para revisao. Voce pode acompanhar em Minha conta e ativar destaque depois.');
      router.push('/mi-cuenta');
    } catch (error) {
      console.error('Publish listing error', error);
      setStatus(`Nao foi possivel publicar. ${getErrorMessage(error)}`);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <form className="glass-card space-y-5 p-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dados do imovel</h3>
      </div>

      <div className="rounded-2xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-xs font-semibold leading-5 text-ocean-800 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100">
        Envie seu anuncio para publicacao. A analise normalmente ocorre em ate 24 horas.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input type="text" placeholder="Nome do anunciante" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={12}
            placeholder="WhatsApp do anunciante"
            value={ownerPhone}
            onChange={(event) => setOwnerPhone(formatBrazilPhone(event.target.value))}
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-900 ${
              ownerPhoneHasError
                ? 'border-red-300 text-red-700 focus:border-red-500 focus:outline-none dark:border-red-800 dark:text-red-200'
                : 'border-sand-200 dark:border-slate-700'
            }`}
          />
          {ownerPhoneHasError && (
            <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
              WhatsApp invalido.
            </p>
          )}
        </div>
      </div>

      <input type="email" placeholder="Email do anunciante" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />

      <div className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <input
          type="text"
          inputMode="numeric"
          placeholder="CPF do anunciante"
          value={ownerDocument}
          onChange={(event) => {
            if (!hasLockedDocument) setOwnerDocument(formatCpfDocument(event.target.value));
          }}
          readOnly={hasLockedDocument}
          maxLength={14}
          className={`w-full rounded-2xl border bg-sand-50 px-4 py-3 text-sm dark:bg-slate-950 ${
            ownerDocumentHasError
              ? 'border-red-300 text-red-700 focus:border-red-500 focus:outline-none dark:border-red-800 dark:text-red-200'
              : 'border-sand-200 dark:border-slate-700'
          }`}
        />
        {ownerDocumentHasError && (
          <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
            {ownerDocumentDigits.length < 11 ? 'CPF deve ter 11 digitos.' : 'CPF invalido.'}
          </p>
        )}
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hasLockedDocument
            ? 'Usaremos o CPF cadastrado na sua conta. Para alterar, fale com o suporte.'
            : 'Solicitamos este dado apenas para verificacao interna de seguranca. Ele nao sera exibido no anuncio.'}
        </p>
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Meios de contato no anuncio</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ['whatsapp', 'WhatsApp'],
            ['phone', 'Telefone'],
            ['email', 'Email']
          ].map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={contactMethods.includes(value)}
                onChange={() => toggleContactMethod(value)}
              />
              {label}
            </label>
          ))}
        </div>
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
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={openCityPicker}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-sand-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Abrir lista de cidades"
            aria-expanded={isCityPickerOpen}
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          {isCityPickerOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] max-h-72 overflow-y-auto rounded-2xl border border-sand-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              {filteredCities.length > 0 ? (
                filteredCities.slice(0, 80).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onTouchStart={(event) => event.stopPropagation()}
                    onClick={() => selectCity(city)}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-sand-100 focus:bg-sand-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                  >
                    {city}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-slate-500">Nenhuma cidade encontrada.</p>
              )}
            </div>
          )}
        </div>
        <input type="text" placeholder="Bairro" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input type="text" placeholder="Conjunto, COHAB, condominio ou loteamento" value={community} onChange={(event) => setCommunity(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input type="text" placeholder="Rua ou avenida" value={street} onChange={(event) => setStreet(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </div>

      <input type="text" placeholder="Complemento ou referencia" value={addressExtra} onChange={(event) => setAddressExtra(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />

      <div className="grid gap-3 sm:grid-cols-2">
        <select value={propertyType} onChange={(event) => setPropertyType(event.target.value as Property['propertyType'])} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Tipo de imovel</option>
          <option>Casa</option>
          <option>Terreno</option>
          <option>Apartamento</option>
          <option>Kitnet/Conjugado</option>
        </select>
        <select value={transaction} onChange={(event) => setTransaction(event.target.value as Property['transaction'])} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Negociacao</option>
          <option>Compra</option>
          <option>Aluguel</option>
          <option>Temporada</option>
        </select>
      </div>

      <div className={`grid gap-3 ${isLand ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
        <input type="text" placeholder="Preco" value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        {isSeasonal && (
          <select value={pricePeriod} onChange={(event) => setPricePeriod(event.target.value as 'dia' | 'semana' | 'mes')} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="dia">Por dia</option>
            <option value="semana">Por semana</option>
            <option value="mes">Por mes</option>
          </select>
        )}
        {!isLand && (
          <>
            <input type="number" min="0" placeholder="Quartos" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <input type="number" min="0" placeholder="Banheiros" value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <input type="number" min="0" placeholder="Garagem" value={parking} onChange={(event) => setParking(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="0"
          placeholder={isLand ? 'Area do terreno (m2)' : 'Area util (m2)'}
          value={areaSqm}
          onChange={(event) => setAreaSqm(event.target.value)}
          className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {!isLand && (
          <input
            type="text"
            placeholder="Condominio (R$)"
            value={condoFee}
            onChange={(event) => setCondoFee(event.target.value)}
            className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        )}
      </div>

      <PrecoJustoRNAdvisor
        price={price}
        transaction={transaction}
        propertyType={propertyType}
        location={location}
        neighborhood={neighborhood}
        bedrooms={bedrooms}
        areaSqm={areaSqm}
      />

      {!isLand && (
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isPetFriendly} onChange={(event) => setIsPetFriendly(event.target.checked)} />
            Aceita pet
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isFurnished} onChange={(event) => setIsFurnished(event.target.checked)} />
            Mobiliado
          </label>
        </div>
      )}

      <button type="button" onClick={generateSuggestion} disabled={isSuggesting} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sun-300 bg-sun-50 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-sun-500 dark:border-sun-800 dark:bg-slate-900 dark:text-sand-50">
        <Sparkles className="h-4 w-4 text-sun-500" aria-hidden="true" />
        {isSuggesting ? 'Gerando sugestao...' : 'Gerar titulo e descricao com IA'}
      </button>

      <input type="text" placeholder="Titulo do anuncio sugerido ou editado" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      <textarea rows={5} placeholder="Descricao completa do imovel" value={details} onChange={(event) => setDetails(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      <input type="text" placeholder="Diferenciais separados por virgula: varanda, piscina, rua calcada" value={features} onChange={(event) => setFeatures(event.target.value)} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />

      <div className="rounded-2xl border border-dashed border-ocean-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-sand-50 px-4 py-6 text-center transition hover:bg-sand-100 dark:bg-slate-800 dark:hover:bg-slate-700">
          <Camera className="h-7 w-7 text-ocean-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Subir fotos do imovel</span>
          <span className="text-xs text-slate-500">Minimo 3 fotos. Maximo 10.</span>
          <input type="file" accept="image/*" multiple onChange={handlePhotos} className="sr-only" />
        </label>

        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo) => (
              <div key={photo.url} className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                <img src={photo.url} alt={photo.file.name} className="h-full w-full object-cover" />
                <button type="button" onClick={() => removePhoto(photo.url)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow" aria-label="Remover foto">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {photos.length} foto{photos.length === 1 ? '' : 's'} selecionada{photos.length === 1 ? '' : 's'}
        </p>
      </div>

      {status && (
        <p className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {status}
        </p>
      )}

      {requiresPayment && (
        <PixPaymentPanel
          listingId={listingId}
          amount={isSeasonal ? SEASONAL_LISTING_PRICE : PAID_LISTING_PRICE}
          title={title || 'Novo anuncio Potilar'}
          kind={isSeasonal ? 'seasonal' : 'listing'}
          headline={isSeasonal ? `Temporada ${PLANS.listing.seasonalDurationDays} dias` : 'Imovel adicional'}
        />
      )}

      <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          Confirmo que as informacoes e fotos do anuncio sao verdadeiras e aceito os{' '}
          <a href="/termos-de-uso" target="_blank" className="font-semibold text-ocean-700">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank" className="font-semibold text-ocean-700">
            Politica de Privacidade
          </a>
          .
        </span>
      </label>

      <button type="button" onClick={publishListing} disabled={isPublishing} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60">
        <Eye className="h-4 w-4" aria-hidden="true" />
        {isPublishing ? 'Publicando...' : requiresPayment ? 'Enviar anuncio pago para revisao' : 'Publicar anuncio gratis'}
      </button>

    </form>
  );
}
