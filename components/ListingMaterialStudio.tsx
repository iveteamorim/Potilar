'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bath,
  BedDouble,
  Car,
  Check,
  ChevronRight,
  Copy,
  Download,
  Hash,
  Home,
  Loader2,
  MapPin,
  PanelTop,
  Phone,
  Printer,
  Share2,
  Square
} from 'lucide-react';
import ListingQrCode from '@/components/ListingQrCode';
import type { ListingMaterialPayload, ListingMaterialSpec } from '@/lib/listingMaterial';
import './ListingMaterialStudio.css';

type MaterialTarget = 'window' | 'gate' | 'facade' | 'banner' | 'post' | 'social';
type PosterModel = 'classic' | 'premium' | 'agency';
type ContactChannel = 'whatsapp' | 'phone';
type PdfMode = 'domestic' | 'print';

type PosterSize = {
  label: string;
  widthMm: number;
  heightMm: number;
};

function WhatsAppGlyph({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 2.08.62 3.99 1.68 5.6L2 22l4.72-1.55a9.86 9.86 0 0 0 5.32 1.55c5.46 0 9.89-4.4 9.89-9.83S17.5 2 12.04 2Zm5.76 13.99c-.24.67-1.18 1.16-1.9 1.3-.49.1-1.12.18-3.25-.7-2.72-1.12-4.47-3.9-4.61-4.08-.13-.18-1.12-1.49-1.12-2.84 0-1.35.71-2.01.96-2.29.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.59.45.24.58.81 2 .88 2.14.07.15.12.31.02.49-.1.18-.15.31-.3.48-.15.16-.31.37-.45.49-.15.13-.3.27-.13.53.16.27.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.15.44.12.6-.07.16-.18.69-.8.88-1.08.18-.27.37-.22.62-.13.25.09 1.59.75 1.86.89.27.13.45.2.51.31.07.12.07.67-.17 1.34Z" />
    </svg>
  );
}

function ScanArrow() {
  return (
    <svg className="campaign-scan-arrow" viewBox="0 0 72 40" aria-hidden>
      <path
        d="M58 7c-7 16-24 24-46 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M22 15 6 26l16 3z" fill="currentColor" />
    </svg>
  );
}

function cleanContact(value?: string | null) {
  return value?.trim() || '';
}

function nationalDigits(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2);
  return digits;
}

function formatWhatsappPoster(value: string) {
  const digits = nationalDigits(value);
  if (digits.length === 11) return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}

function getFeatureIcon(item: string) {
  const value = item.toLowerCase();
  if (value.includes('quarto')) return BedDouble;
  if (value.includes('banheiro')) return Bath;
  if (value.includes('vaga')) return Car;
  if (value.includes('m2') || value.includes('m²')) return Square;
  if (value.includes('codigo') || value.includes('código')) return Hash;
  return Home;
}

function getSpecIcon(id: ListingMaterialSpec['id']) {
  if (id === 'beds') return BedDouble;
  if (id === 'baths') return Bath;
  if (id === 'parking') return Car;
  return Home;
}

const sizesByTarget: Record<MaterialTarget, PosterSize[]> = {
  window: [
    { label: 'A4 - 210 x 297 mm', widthMm: 210, heightMm: 297 },
    { label: 'A3 - 297 x 420 mm', widthMm: 297, heightMm: 420 }
  ],
  gate: [
    { label: 'A2 - 420 x 594 mm', widthMm: 420, heightMm: 594 },
    { label: 'A1 - 594 x 841 mm', widthMm: 594, heightMm: 841 }
  ],
  facade: [
    { label: 'A1 - 594 x 841 mm', widthMm: 594, heightMm: 841 },
    { label: 'Lona - 100 x 150 cm', widthMm: 1000, heightMm: 1500 }
  ],
  banner: [
    { label: 'Lona - 80 x 120 cm', widthMm: 800, heightMm: 1200 },
    { label: 'Lona - 100 x 150 cm', widthMm: 1000, heightMm: 1500 },
    { label: 'Lona - 60 x 90 cm', widthMm: 600, heightMm: 900 }
  ],
  post: [
    { label: 'A3 - 297 x 420 mm', widthMm: 297, heightMm: 420 },
    { label: 'A2 - 420 x 594 mm', widthMm: 420, heightMm: 594 }
  ],
  social: [
    { label: 'Instagram - 1080 x 1080', widthMm: 108, heightMm: 108 },
    { label: 'Story - 1080 x 1920', widthMm: 108, heightMm: 192 }
  ]
};

const targets: Array<{
  id: MaterialTarget;
  label: string;
  description: string;
  recommendation: string;
  icon: typeof PanelTop;
}> = [
  { id: 'social', label: 'Redes sociais', description: 'Instagram, Story, Facebook e WhatsApp.', recommendation: '1080px', icon: Share2 },
  { id: 'window', label: 'Janela', description: 'Apartamento, vitrine ou janela pequena.', recommendation: 'A4 ou A3', icon: PanelTop },
  { id: 'gate', label: 'Reja', description: 'Portao, grade ou frente da casa.', recommendation: 'A2 recomendado', icon: Home },
  { id: 'facade', label: 'Fachada', description: 'Alta leitura desde a rua.', recommendation: 'A1 recomendado', icon: Home },
  { id: 'banner', label: 'Lona', description: 'Material para grafica e grande impacto.', recommendation: '80 x 120 cm', icon: Printer },
  { id: 'post', label: 'Poste', description: 'Texto maximo, informacao minima.', recommendation: 'A3 ou A2', icon: PanelTop }
];

export default function ListingMaterialStudio({ material }: { material: ListingMaterialPayload }) {
  const previewStageRef = useRef<HTMLDivElement>(null);
  const whatsappNumber = cleanContact(material.contactWhatsapp);
  const phoneNumber = cleanContact(material.contactPhone);
  const fallbackContact = '';
  const hasWhatsapp = Boolean(whatsappNumber);
  const hasPhone = Boolean(phoneNumber);
  const canChooseContact = hasWhatsapp && hasPhone;

  const [target, setTarget] = useState<MaterialTarget>('social');
  const [model, setModel] = useState<PosterModel>('premium');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(material.image);
  const [imagePosition, setImagePosition] = useState(50);
  const [contactChannel, setContactChannel] = useState<ContactChannel>(() =>
    hasWhatsapp || (!hasPhone && Boolean(fallbackContact)) ? 'whatsapp' : 'phone'
  );
  const size = useMemo(() => sizesByTarget[target][0], [target]);
  const allSizes = sizesByTarget[target];
  const featureItems = material.compactFeatures.split(' - ').filter(Boolean).slice(0, 4);
  const previewKey = `${target}-${model}-${size.widthMm}x${size.heightMm}`;
  const isCampaign = model === 'premium' || model === 'agency';

  const displayContact =
    contactChannel === 'whatsapp'
      ? whatsappNumber || phoneNumber || '(84) 99999-9999'
      : phoneNumber || whatsappNumber || '(84) 99999-9999';
  const showWhatsappIcon = contactChannel === 'whatsapp' && (hasWhatsapp || !hasPhone);

  useEffect(() => {
    previewStageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [previewKey]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(material.publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function downloadPdf(mode: PdfMode) {
    const node = document.getElementById('printable-poster');
    if (!node || downloading) return;

    setDownloading(true);

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const rect = node.getBoundingClientRect();
      const maxEdge = mode === 'print' ? 5600 : 3200;
      const maxRatio = mode === 'print' ? 4 : 2.5;
      const pixelRatio = Math.min(maxRatio, maxEdge / Math.max(rect.width, rect.height, 1));

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: '#ffffff',
        preferredFontFormat: 'woff2'
      });

      const orientation = size.widthMm >= size.heightMm ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [size.widthMm, size.heightMm],
        compress: true
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, size.widthMm, size.heightMm, undefined, mode === 'print' ? 'SLOW' : 'FAST');
      const fileName = `potilar-${target}-${mode}-${size.widthMm}x${size.heightMm}mm.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error(error);
      window.alert('Nao foi possivel gerar o PDF. Tente novamente em alguns segundos.');
    } finally {
      setDownloading(false);
    }
  }

  function uploadPreviewImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setImagePosition(50);
  }

  const campaignSpecs = material.specs.length
    ? material.specs
    : featureItems.map((item) => ({ id: 'area' as const, value: item, label: '' }));

  return (
    <main className="poster-tool">
      <aside className="poster-options no-print">
        <p className="poster-eyebrow">Primeiro escolha</p>
        <h2>Onde vai colocar?</h2>

        <div className="poster-placement-list">
          {targets.map((item) => {
            const Icon = item.icon;
            const active = target === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTarget(item.id);
                  if (item.id === 'window' || item.id === 'social') {
                    setModel('premium');
                  } else if (model !== 'premium' && model !== 'agency') {
                    setModel('classic');
                  }
                }}
                className={`placement-button ${active ? 'active' : ''}`}
              >
                <Icon aria-hidden className="placement-icon" />
                <span>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                  <small>{item.recommendation}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="poster-models">
          <p>Modelo visual</p>
          <button type="button" className={model === 'classic' ? 'active' : ''} onClick={() => setModel('classic')}>
            A. Classic sem foto
            <span>Fachada / portao</span>
          </button>
          <button type="button" className={model === 'premium' ? 'active' : ''} onClick={() => setModel('premium')}>
            B. Premium com foto
            <span>Campanha PotiLar</span>
          </button>
          <button type="button" className={model === 'agency' ? 'active' : ''} onClick={() => setModel('agency')}>
            C. Imobiliaria com foto
            <span>Mesmo layout, mais QR</span>
          </button>
        </div>

        {!isCampaign && (canChooseContact || hasWhatsapp || hasPhone) && (
          <div className="poster-models contact-channel">
            <p>Contato no cartaz</p>
            {canChooseContact ? (
              <>
                <button
                  type="button"
                  className={contactChannel === 'whatsapp' ? 'active' : ''}
                  onClick={() => setContactChannel('whatsapp')}
                >
                  WhatsApp
                  <span>{whatsappNumber}</span>
                </button>
                <button
                  type="button"
                  className={contactChannel === 'phone' ? 'active' : ''}
                  onClick={() => setContactChannel('phone')}
                >
                  Telefone
                  <span>{phoneNumber}</span>
                </button>
              </>
            ) : (
              <p className="contact-channel-note">
                {showWhatsappIcon ? 'WhatsApp' : 'Telefone'}: <strong>{displayContact}</strong>
              </p>
            )}
          </div>
        )}

        <div className="photo-card">
          <p>Foto do material</p>
          <div className="photo-options">
            {(material.images?.length ? material.images : material.image ? [material.image] : []).slice(0, 8).map((image) => (
              <button
                key={image}
                type="button"
                className={selectedImage === image ? 'active' : ''}
                onClick={() => {
                  setSelectedImage(image);
                  setImagePosition(50);
                }}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
          <label className="upload-photo-button">
            Subir foto
            <input type="file" accept="image/*" onChange={uploadPreviewImage} />
          </label>
          <label className="photo-position">
            Enquadramento
            <input
              type="range"
              min="0"
              max="100"
              value={imagePosition}
              onChange={(event) => setImagePosition(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="size-card">
          <span>Tamanho recomendado</span>
          <strong>{size.label}</strong>
          <div>
            {allSizes.map((item) => (
              <small key={item.label}>{item.label}</small>
            ))}
          </div>
        </div>

        <div className="download-card">
          <span>Baixar material</span>
          <button type="button" onClick={() => downloadPdf('domestic')} className="download-button" disabled={downloading}>
            {downloading ? <Loader2 aria-hidden className="download-spin" /> : <Download aria-hidden />}
            PDF domestico
          </button>
          <button type="button" onClick={() => downloadPdf('print')} className="download-button download-button--print" disabled={downloading}>
            {downloading ? <Loader2 aria-hidden className="download-spin" /> : <Printer aria-hidden />}
            PDF para grafica
          </button>
          <p>Para lona, use uma foto principal em alta qualidade. Recomendado: minimo 2000 px de largura.</p>
        </div>
        <button type="button" onClick={copyLink} className="copy-button">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? 'Link copiado' : 'Copiar link do anuncio'}
        </button>
      </aside>

      <section className="preview-panel">
        <header className="preview-header no-print">
          <div>
            <strong>Preview gerado</strong>
            <span>{size.label}</span>
          </div>
        </header>

        <div ref={previewStageRef} className="preview-stage">
          <div
            key={previewKey}
            className={`poster-preview poster-preview--${target}`}
            style={
              {
                '--poster-ratio': `${size.widthMm} / ${size.heightMm}`
              } as React.CSSProperties
            }
          >
            <article
              id="printable-poster"
              className={`property-poster property-poster--${target} property-poster--${model}${isCampaign ? ' property-poster--campaign' : ''}`}
              style={
                {
                  '--print-width': `${size.widthMm}mm`,
                  '--print-height': `${size.heightMm}mm`
                } as React.CSSProperties
              }
            >
              {model === 'classic' && (
                <>
                  <header className="model-head">{material.intent}</header>
                  <div className="model-price">{material.price}</div>
                  <section className="classic-main">
                    <p>Escaneie e veja todas as fotos e video</p>
                    <div className="qr-wrap">
                      <ListingQrCode value={material.publicUrl} size={280} />
                    </div>
                  </section>
                  <div className="model-whatsapp">
                    {showWhatsappIcon ? (
                      <WhatsAppGlyph className="wa-icon" />
                    ) : (
                      <Phone aria-hidden className="wa-icon" />
                    )}
                    <strong>{displayContact}</strong>
                  </div>
                  <footer className="model-brand">
                    <img src="/images/logobanner2.png" alt="PotiLar - Imoveis no Rio Grande do Norte" />
                  </footer>
                </>
              )}

              {isCampaign && (
                <>
                  <div className="campaign-hero">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Imovel anunciado" style={{ objectPosition: `${imagePosition}% center` }} />
                    ) : (
                      <span>Foto do imovel</span>
                    )}
                    <div className="campaign-hero-shade" />
                    <div className="campaign-hero-top">
                      <span className="campaign-intent">{material.intent}</span>
                      <span className="campaign-place">
                        <MapPin aria-hidden />
                        {material.location}
                      </span>
                    </div>
                    <div className="campaign-hero-copy">
                      <h2>{material.headline}</h2>
                      <p>{material.subtitle}</p>
                      <i className="campaign-underline" aria-hidden />
                    </div>
                  </div>

                  <div className="campaign-body">
                    {campaignSpecs.length ? (
                      <ul className="campaign-specs">
                        {campaignSpecs.map((spec) => {
                          const Icon = getSpecIcon(spec.id);
                          return (
                            <li key={`${spec.id}-${spec.value}-${spec.label}`}>
                              <Icon aria-hidden />
                              <span>
                                <strong>{spec.value}</strong>
                                {spec.label ? ` ${spec.label}` : ''}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}

                    <div className="campaign-mid">
                      <div className="campaign-price">
                        <strong>{material.price}</strong>
                        <span>{material.priceCaption}</span>
                      </div>
                      <div className="campaign-qr">
                        <div className="campaign-qr-frame">
                          <ListingQrCode value={material.publicUrl} size={model === 'agency' ? 420 : 360} />
                        </div>
                        <div className="campaign-qr-copy">
                          <p>Escaneie e veja todas as fotos, planta e vídeo deste imóvel.</p>
                          <ScanArrow />
                        </div>
                      </div>
                    </div>

                    <div className="campaign-foot">
                      {(hasWhatsapp || hasPhone) && (
                        <span className="campaign-wa">
                          <WhatsAppGlyph />
                          {formatWhatsappPoster(whatsappNumber || phoneNumber)}
                          <ChevronRight aria-hidden />
                        </span>
                      )}
                      <div className="campaign-logo">
                        <img src="/images/logobanner2.png" alt="PotiLar" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
