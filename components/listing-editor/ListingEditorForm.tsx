'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ChevronDown, Save, Sparkles, Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { createClient } from '@/lib/supabase/client';
import { geocodeListingAddress } from '@/lib/geocodeListing';
import { KNOWN_CITY_NAMES, normalizeKnownCityName, resolveListingCoordinates } from '@/lib/locationCoordinates';
import { formatPlaceName as formatDisplayPlaceName } from '@/lib/textFormat';
import { normalizeTourUrl } from '@/lib/tourUrl';

type ListingEditorData = {
  id: string;
  title: string;
  property_type: 'Casa' | 'Terreno' | 'Apartamento' | 'Kitnet/Conjugado';
  transaction: 'Compra' | 'Aluguel' | 'Temporada';
  price: number;
  price_period?: 'dia' | 'semana' | 'mes' | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  location: string;
  neighborhood?: string | null;
  community?: string | null;
  address_extra?: string | null;
  description: string;
  features: string[];
  images: string[];
  video_url?: string | null;
  tour_url?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_methods?: string[] | null;
  condo_included?: boolean | null;
  is_pet_friendly?: boolean | null;
  is_furnished?: boolean | null;
};

type NewPhoto = {
  file: File;
  url: string;
};

function splitFeatures(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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

export default function ListingEditorForm({
  listing,
  backHref
}: {
  listing: ListingEditorData;
  backHref: string;
}) {
  const router = useRouter();
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(listing.title);
  const [propertyType, setPropertyType] = useState(listing.property_type);
  const [transaction, setTransaction] = useState(listing.transaction);
  const [price, setPrice] = useState(String(listing.price));
  const [pricePeriod, setPricePeriod] = useState<'dia' | 'semana' | 'mes'>(listing.price_period ?? 'dia');
  const [bedrooms, setBedrooms] = useState(String(listing.bedrooms));
  const [bathrooms, setBathrooms] = useState(String(listing.bathrooms));
  const [parking, setParking] = useState(String(listing.parking));
  const [location, setLocation] = useState(listing.location);
  const [neighborhood, setNeighborhood] = useState(listing.neighborhood ?? '');
  const [community, setCommunity] = useState(listing.community ?? '');
  const [addressExtra, setAddressExtra] = useState(listing.address_extra ?? '');
  const [description, setDescription] = useState(listing.description);
  const [features, setFeatures] = useState((listing.features ?? []).join(', '));
  const [videoUrl, setVideoUrl] = useState(listing.video_url ?? '');
  const [tourUrl, setTourUrl] = useState(listing.tour_url ?? '');
  const [condoIncluded, setCondoIncluded] = useState(Boolean(listing.condo_included));
  const [isPetFriendly, setIsPetFriendly] = useState(Boolean(listing.is_pet_friendly));
  const [isFurnished, setIsFurnished] = useState(Boolean(listing.is_furnished));
  const [contactName, setContactName] = useState(listing.contact_name ?? '');
  const [contactPhone, setContactPhone] = useState(listing.contact_whatsapp ?? listing.contact_phone ?? '');
  const [contactEmail, setContactEmail] = useState(listing.contact_email ?? '');
  const [contactMethods, setContactMethods] = useState<string[]>(listing.contact_methods?.length ? listing.contact_methods : ['whatsapp']);
  const [images, setImages] = useState<string[]>(listing.images ?? []);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  function toggleContactMethod(method: string) {
    setContactMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method]
    );
  }

  function openCityPicker() {
    cityInputRef.current?.focus();
    cityInputRef.current?.showPicker?.();
  }

  function handlePhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));

    setNewPhotos((current) => [...current, ...selected]);
    event.target.value = '';
  }

  function removeNewPhoto(url: string) {
    setNewPhotos((current) => {
      const photo = current.find((item) => item.url === url);
      if (photo) URL.revokeObjectURL(photo.url);
      return current.filter((item) => item.url !== url);
    });
  }

  async function generateSuggestion() {
    setStatus('');

    if (!location || !propertyType || !transaction) {
      setStatus('Informe pelo menos cidade, tipo de imóvel e negociação para gerar a sugestão.');
      return;
    }

    setIsSuggesting(true);

    try {
      const response = await fetch('/api/ai/credits/use', { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(data.error ?? 'Não foi possível usar créditos de IA. Compre créditos em Minha conta.');
        return;
      }
    } catch {
      setStatus('Não foi possível verificar seus créditos de IA.');
      return;
    } finally {
      setIsSuggesting(false);
    }

    setIsSuggesting(true);

    const formattedPrice = price ? `R$ ${price.replace(/^R\$\s*/i, '')}${transaction === 'Temporada' ? `/${pricePeriod}` : ''}` : '';
    const isLand = propertyType === 'Terreno';
    const bedroomText = !isLand && Number(bedrooms) > 0 ? `${bedrooms} quarto${bedrooms === '1' ? '' : 's'}` : '';
    const bathroomText = !isLand && Number(bathrooms) > 0 ? `${bathrooms} banheiro${bathrooms === '1' ? '' : 's'}` : '';
    const parkingText = !isLand && Number(parking) > 0 ? `${parking} vaga${parking === '1' ? '' : 's'} de garagem` : '';
    const highlights = [bedroomText, bathroomText, parkingText].filter(Boolean);
    const typedFeatures = splitFeatures(features);
    const correctedLocation = formatDisplayPlaceName(normalizeKnownCityName(location));
    const formattedNeighborhood = neighborhood ? formatDisplayPlaceName(neighborhood) : '';
    const formattedCommunity = community ? formatDisplayPlaceName(community) : '';
    const locationParts = [formattedNeighborhood, formattedCommunity, correctedLocation].filter(Boolean);
    const locationHint = locationParts.join(', ') || correctedLocation;
    const transactionLabel = transaction === 'Aluguel' ? 'alugar' : transaction === 'Temporada' ? 'temporada' : 'venda';
    const generatedTitle = `${propertyType} para ${transactionLabel}${formattedNeighborhood ? ` no ${formattedNeighborhood}` : correctedLocation ? ` em ${correctedLocation}` : ''}`;
    const generatedFeatures =
      typedFeatures.length > 0
        ? typedFeatures
        : [
            formattedNeighborhood || formattedCommunity ? 'Boa localização' : '',
            transaction === 'Temporada' ? 'Ideal para temporada' : transaction === 'Compra' ? 'Boa oportunidade de compra' : 'Pronto para morar',
            isFurnished ? 'Mobiliado' : '',
            isPetFriendly ? 'Aceita pet' : '',
            condoIncluded ? 'Condomínio incluso' : ''
          ].filter(Boolean);

    const openingByTransaction =
      transaction === 'Temporada'
        ? `${propertyType} para temporada em ${locationHint}${formattedPrice ? `, com diária de ${formattedPrice}` : ''}. Uma opção interessante para quem quer aproveitar a região com praticidade e conforto.`
        : transaction === 'Aluguel'
          ? `${propertyType} para aluguel em ${locationHint}${formattedPrice ? ` por ${formattedPrice}` : ''}. Um imóvel indicado para quem busca boa localização, praticidade e um espaço funcional para o dia a dia.`
          : `${propertyType} à venda em ${locationHint}${formattedPrice ? ` por ${formattedPrice}` : ''}. Uma oportunidade para quem procura um imóvel no Rio Grande do Norte com boa apresentação e potencial para moradia ou investimento.`;

    const layoutSentence = isLand
      ? 'O terreno oferece uma área versátil, com perfil adequado para quem deseja construir, investir ou planejar um projeto próprio.'
      : highlights.length
        ? `A configuração reúne ${highlights.join(', ')}, formando um conjunto funcional e fácil de avaliar durante a visita.`
        : 'O imóvel tem uma proposta simples e funcional, com características que podem atender diferentes perfis de comprador ou inquilino.';

    const comfortItems = [
      isFurnished ? 'mobiliado' : '',
      isPetFriendly ? 'aceita pet' : '',
      condoIncluded ? 'condomínio incluso' : '',
      formattedCommunity ? `referência em ${formattedCommunity}` : '',
      addressExtra ? `referência: ${addressExtra}` : ''
    ].filter(Boolean);

    const comfortSentence = comfortItems.length
      ? `Entre os pontos que ajudam na decisão estão: ${comfortItems.join(', ')}.`
      : formattedNeighborhood || formattedCommunity
        ? 'A localização facilita a comparação com outros imóveis da região e ajuda quem já procura por esse entorno.'
        : 'A localização no RN permite avaliar o imóvel com calma e comparar com outras oportunidades da Potilar.';

    const generatedDescription = [
      openingByTransaction,
      layoutSentence,
      comfortSentence,
      generatedFeatures.length ? `Destaques do imóvel: ${generatedFeatures.join(', ')}.` : '',
      'Entre em contato para confirmar disponibilidade, combinar uma visita e tirar dúvidas diretamente com o responsável pelo anúncio.'
    ].filter(Boolean).join('\n\n');

    setTitle(generatedTitle);
    setDescription(generatedDescription);
    setFeatures(generatedFeatures.join(', '));
    setStatus('Sugestão gerada. Foi usado 1 crédito de IA. Revise o texto antes de salvar.');
    setIsSuggesting(false);
  }

  async function saveListing() {
    setStatus('');

    if (!title || !location || !propertyType || !transaction || !price || !description) {
      setStatus('Preencha título, cidade, tipo, negociação, preço e descrição.');
      return;
    }

    if (images.length + newPhotos.length < 6) {
      setStatus('O anúncio precisa ter pelo menos 6 fotos.');
      return;
    }

    const normalizedVideoUrl = normalizeVideoUrl(videoUrl);
    if (videoUrl.trim() && !normalizedVideoUrl) {
      setStatus('Informe um link de vídeo válido, com http:// ou https://.');
      return;
    }

    const normalizedTourUrl = normalizeTourUrl(tourUrl);
    if (tourUrl.trim() && !normalizedTourUrl) {
      setStatus('Informe um link de tour virtual 3D válido, com http:// ou https://.');
      return;
    }

    if (contactMethods.length === 0) {
      setStatus('Escolha pelo menos um meio de contato.');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const uploaded: string[] = [];

      for (const [index, photo] of newPhotos.entries()) {
        const uploadFile = await compressImage(photo.file);
        const extension = uploadFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${listing.id}/edit-${Date.now()}-${index + 1}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }

      const finalImages = [...images, ...uploaded];
      const formattedLocation = formatDisplayPlaceName(normalizeKnownCityName(location));
      const formattedNeighborhood = neighborhood ? formatDisplayPlaceName(neighborhood) : '';
      const formattedCommunity = community ? formatDisplayPlaceName(community) : '';
      const geocodedCoordinates = await geocodeListingAddress({
        neighborhood: formattedNeighborhood,
        community: formattedCommunity,
        city: formattedLocation
      });
      const [lat, lng] =
        geocodedCoordinates ??
        resolveListingCoordinates(formattedLocation, formattedNeighborhood, formattedCommunity, addressExtra);
      const cleanedPhone = contactPhone.trim() || null;
      const listingContactPhone = contactMethods.includes('phone') ? cleanedPhone : null;
      const listingContactWhatsapp = contactMethods.includes('whatsapp') ? cleanedPhone : null;

      const { error } = await supabase.rpc('update_listing_details', {
        listing_id: listing.id,
        new_title: title,
        new_property_type: propertyType,
        new_transaction: transaction,
        new_price: Number(price.replace(/\D/g, '')) || 0,
        new_price_period: transaction === 'Temporada' ? pricePeriod : null,
        new_bedrooms: Number(bedrooms) || 0,
        new_bathrooms: Number(bathrooms) || 0,
        new_parking: Number(parking) || 0,
        new_location: formattedLocation,
        new_neighborhood: formattedNeighborhood || null,
        new_community: formattedCommunity || null,
        new_address_extra: addressExtra || null,
        new_lat: lat,
        new_lng: lng,
        new_description: description,
        new_features: splitFeatures(features),
        new_images: finalImages,
        new_contact_name: contactName || null,
        new_contact_phone: listingContactPhone,
        new_contact_whatsapp: listingContactWhatsapp,
        new_contact_email: contactMethods.includes('email') ? contactEmail || null : null,
        new_contact_methods: contactMethods
      });

      if (error) throw new Error(error.message);

      const extraUpdate = await supabase
        .from('listings')
        .update({
          video_url: normalizedVideoUrl,
          tour_url: normalizedTourUrl,
          condo_included: transaction === 'Aluguel' && condoIncluded,
          is_pet_friendly: isPetFriendly,
          is_furnished: isFurnished
        })
        .eq('id', listing.id);
      if (extraUpdate.error && !/column|schema cache/i.test(extraUpdate.error.message)) {
        throw new Error(extraUpdate.error.message);
      }

      setStatus('Anúncio atualizado com sucesso.');
      router.push(backHref);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? `Não foi possível guardar: ${error.message}` : 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="glass-card space-y-5 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título do anúncio" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Preço" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select value={propertyType} onChange={(event) => setPropertyType(event.target.value as ListingEditorData['property_type'])} className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option>Casa</option>
          <option>Terreno</option>
          <option>Apartamento</option>
          <option>Kitnet/Conjugado</option>
        </select>
        <select value={transaction} onChange={(event) => setTransaction(event.target.value as ListingEditorData['transaction'])} className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option>Compra</option>
          <option>Aluguel</option>
          <option>Temporada</option>
        </select>
      </div>

      {transaction === 'Temporada' && (
        <select value={pricePeriod} onChange={(event) => setPricePeriod(event.target.value as 'dia' | 'semana' | 'mes')} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="dia">Preço por dia</option>
          <option value="semana">Preço por semana</option>
          <option value="mes">Preço por mês</option>
        </select>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="relative">
          <input ref={cityInputRef} value={location} list="known-cities-editor" onChange={(event) => {
            setLocation(event.target.value);
          }} placeholder="Cidade" className="city-autocomplete w-full appearance-none rounded-2xl border border-sand-200 bg-white px-4 py-3 pr-10 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <button
            type="button"
            onClick={openCityPicker}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-sand-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Abrir lista de cidades"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <datalist id="known-cities-editor">
            {KNOWN_CITY_NAMES.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
        <input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Bairro" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={community} onChange={(event) => setCommunity(event.target.value)} placeholder="Conjunto, COHAB ou condomínio" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={addressExtra} onChange={(event) => setAddressExtra(event.target.value)} placeholder="Referência" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Quartos</span>
          <input type="number" min="0" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} placeholder="0" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Banheiros</span>
          <input type="number" min="0" value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} placeholder="0" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Garagem</span>
          <input type="number" min="0" value={parking} onChange={(event) => setParking(event.target.value)} placeholder="0" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
      </div>

      {propertyType !== 'Terreno' && (
        <div className="grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:grid-cols-3">
          <label className="inline-flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <input type="checkbox" checked={isPetFriendly} onChange={(event) => setIsPetFriendly(event.target.checked)} />
            Aceita pet
          </label>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <input type="checkbox" checked={isFurnished} onChange={(event) => setIsFurnished(event.target.checked)} />
            Mobiliado
          </label>
          {transaction === 'Aluguel' && (
            <label className="inline-flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <input type="checkbox" checked={condoIncluded} onChange={(event) => setCondoIncluded(event.target.checked)} />
              Condomínio incluso
            </label>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-ocean-100 bg-ocean-50/70 p-4 dark:border-ocean-900 dark:bg-ocean-950/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">IA para melhorar anúncio</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Gera título e descrição profissional usando os dados preenchidos.</p>
          </div>
          <button
            type="button"
            onClick={generateSuggestion}
            disabled={isSuggesting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isSuggesting ? 'Gerando...' : 'Gerar com IA - 1 crédito'}
          </button>
        </div>
      </div>

      <textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      <input value={features} onChange={(event) => setFeatures(event.target.value)} placeholder="Diferenciais separados por vírgula" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />

      <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="listing-video-url">
          Vídeo do imóvel
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cole aqui um link do YouTube, Instagram, TikTok, Drive ou outro vídeo público.</p>
        <input
          id="listing-video-url"
          type="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="https://..."
          className="mt-3 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="listing-tour-url">
          Tour virtual 3D
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cole o link do Matterport, Kuula, CloudPano ou outro tour em 360°.</p>
        <input
          id="listing-tour-url"
          type="url"
          value={tourUrl}
          onChange={(event) => setTourUrl(event.target.value)}
          placeholder="https://..."
          className="mt-3 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Fotos do anúncio</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mínimo 6 fotos. Máximo 10.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <div key={image} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                <Image src={image} alt={title} fill className="object-cover" />
                {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-ocean-600 px-2 py-1 text-[10px] font-semibold text-white">Principal</span>}
              </div>
              <button type="button" onClick={() => setImages((current) => current.filter((item) => item !== image))} className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                Remover
              </button>
            </div>
          ))}
          {newPhotos.map((photo) => (
            <div key={photo.url} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                <img src={photo.url} alt={photo.file.name} className="h-full w-full object-cover" />
              </div>
              <button type="button" onClick={() => removeNewPhoto(photo.url)} className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                Remover
              </button>
            </div>
          ))}
        </div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Subir mais fotos
          <input type="file" accept="image/*" multiple onChange={handlePhotos} className="sr-only" />
        </label>
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Contato do anúncio</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Nome" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Telefone ou WhatsApp" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="Email" className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            ['whatsapp', 'WhatsApp'],
            ['phone', 'Telefone'],
            ['email', 'Email']
          ].map(([value, label]) => (
            <label key={value} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <input type="checkbox" checked={contactMethods.includes(value)} onChange={() => toggleContactMethod(value)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {status && (
        <p className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {status}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={saveListing} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button type="button" onClick={() => router.push(backHref)} className="inline-flex items-center gap-2 rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
          <X className="h-4 w-4" aria-hidden="true" />
          Cancelar
        </button>
      </div>
    </form>
  );
}


