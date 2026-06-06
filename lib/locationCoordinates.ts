const CITY_COORDINATES: Record<string, [number, number]> = {
  'natal': [-5.7793, -35.2009],
  'parnamirim': [-5.9156, -35.2628],
  'macaiba': [-5.8586, -35.3525],
  'sao goncalo do amarante': [-5.7933, -35.3294],
  'ceara-mirim': [-5.6389, -35.4258],
  'ceara mirim': [-5.6389, -35.4258],
  'extremoz': [-5.7058, -35.3078],
  'sao jose de mipibu': [-6.0778, -35.2424],
  'sao jose do mipibu': [-6.0778, -35.2424],
  'monte alegre': [-6.0706, -35.3285],
  'vera cruz': [-6.0438, -35.4338],
  'goianinha': [-6.2664, -35.2133],
  'lagoa salgada': [-6.1185, -35.4867],
  'ares': [-6.1999, -35.1603],
  'arês': [-6.1999, -35.1603],
  'brejinho': [-6.1898, -35.3568],
  'senador eloi de souza': [-6.0361, -35.6995],
  'santo antonio': [-6.3119, -35.4735],
  'santo antônio': [-6.3119, -35.4735],
  'bento fernandes': [-5.7029, -35.8323],
  'ielmo marinho': [-5.8242, -35.5535],
  'sao paulo do potengi': [-5.895, -35.7628],
  'sao pauloo do potengi': [-5.895, -35.7628],
  'são paulo do potengi': [-5.895, -35.7628],
  'sao tome': [-5.9722, -36.0753],
  'são tomé': [-5.9722, -36.0753],
  'tangara': [-6.1992, -35.8014],
  'tangará': [-6.1992, -35.8014],
  'santa cruz': [-6.2294, -36.0228],
  'currais novos': [-6.2608, -36.5178],
  'caico': [-6.4597, -37.0978],
  'caicó': [-6.4597, -37.0978],
  'mossoro': [-5.1875, -37.3442],
  'mossoró': [-5.1875, -37.3442],
  'acari': [-6.4356, -36.6408],
  'apodi': [-5.6647, -37.7989],
  'assu': [-5.5767, -36.9086],
  'açu': [-5.5767, -36.9086],
  'areia branca': [-4.9561, -37.1369],
  'touros': [-5.1989, -35.4608],
  'sao miguel do gostoso': [-5.1231, -35.6358],
  'são miguel do gostoso': [-5.1231, -35.6358],
  'tibau do sul': [-6.1919, -35.0864],
  'nísia floresta': [-6.0911, -35.2089],
  'nisia floresta': [-6.0911, -35.2089],
  'canguaretama': [-6.38, -35.1289],
  'nova cruz': [-6.4781, -35.4339]
};

const DEFAULT_COORDINATES: [number, number] = [-5.7945, -35.211];

const NEIGHBORHOOD_COORDINATES: Array<{
  city: string;
  names: string[];
  coordinates: [number, number];
}> = [
  {
    city: 'parnamirim',
    names: ['nova parnamirim'],
    coordinates: [-5.8819, -35.2063]
  },
  {
    city: 'parnamirim',
    names: ['cohabinal'],
    coordinates: [-5.9115, -35.2712]
  },
  {
    city: 'parnamirim',
    names: ['centro'],
    coordinates: [-5.9156, -35.2628]
  },
  {
    city: 'parnamirim',
    names: ['emaus', 'emaús'],
    coordinates: [-5.8792, -35.2475]
  },
  {
    city: 'parnamirim',
    names: ['parque industrial'],
    coordinates: [-5.8957, -35.2361]
  },
  {
    city: 'parnamirim',
    names: ['rosa dos ventos'],
    coordinates: [-5.9259, -35.2667]
  },
  {
    city: 'parnamirim',
    names: ['liberdade'],
    coordinates: [-5.9251, -35.2761]
  },
  {
    city: 'parnamirim',
    names: ['passagem de areia'],
    coordinates: [-5.9202, -35.2491]
  },
  {
    city: 'parnamirim',
    names: ['cajupiranga'],
    coordinates: [-5.9664, -35.1928]
  },
  {
    city: 'parnamirim',
    names: ['pium'],
    coordinates: [-5.9811, -35.1536]
  },
  {
    city: 'parnamirim',
    names: ['monte castelo'],
    coordinates: [-5.9368, -35.2544]
  },
  {
    city: 'parnamirim',
    names: ['vila peri', 'vila do peri'],
    coordinates: [-5.9048, -35.2889]
  },
  {
    city: 'parnamirim',
    names: ['bela parnamirim'],
    coordinates: [-5.9089, -35.2558]
  },
  {
    city: 'parnamirim',
    names: ['jardim petropolis', 'jardim petrópolis'],
    coordinates: [-5.8998, -35.2412]
  },
  {
    city: 'parnamirim',
    names: ['santos reis'],
    coordinates: [-5.9288, -35.2588]
  },
  {
    city: 'natal',
    names: ['ponta negra'],
    coordinates: [-5.8796, -35.1744]
  },
  {
    city: 'natal',
    names: ['capim macio'],
    coordinates: [-5.8476, -35.2048]
  },
  {
    city: 'natal',
    names: ['lagoa nova'],
    coordinates: [-5.8166, -35.2107]
  },
  {
    city: 'natal',
    names: ['tirol'],
    coordinates: [-5.7947, -35.2024]
  },
  {
    city: 'natal',
    names: ['petropolis', 'petrópolis'],
    coordinates: [-5.7832, -35.1985]
  },
  {
    city: 'natal',
    names: ['alecrim'],
    coordinates: [-5.7959, -35.2189]
  },
  {
    city: 'natal',
    names: ['neopolis', 'neópolis'],
    coordinates: [-5.8567, -35.2109]
  }
];

export const KNOWN_CITY_NAMES = [
  'Acari',
  'Assú',
  'Afonso Bezerra',
  'Água Nova',
  'Alexandria',
  'Almino Afonso',
  'Alto do Rodrigues',
  'Angicos',
  'Antônio Martins',
  'Apodi',
  'Areia Branca',
  'Arez',
  'Campo Grande',
  'Baía Formosa',
  'Baraúna',
  'Barcelona',
  'Bento Fernandes',
  'Bodó',
  'Bom Jesus',
  'Brejinho',
  'Caiçara do Norte',
  'Caiçara do Rio do Vento',
  'Caicó',
  'Campo Redondo',
  'Canguaretama',
  'Caraúbas',
  'Carnaúba dos Dantas',
  'Carnaubais',
  'Ceará-Mirim',
  'Cerro Corá',
  'Coronel Ezequiel',
  'Coronel João Pessoa',
  'Cruzeta',
  'Currais Novos',
  'Doutor Severiano',
  'Parnamirim',
  'Encanto',
  'Equador',
  'Espírito Santo',
  'Extremoz',
  'Felipe Guerra',
  'Fernando Pedroza',
  'Florânia',
  'Francisco Dantas',
  'Frutuoso Gomes',
  'Galinhos',
  'Goianinha',
  'Governador Dix-Sept Rosado',
  'Grossos',
  'Guamaré',
  'Ielmo Marinho',
  'Ipanguaçu',
  'Ipueira',
  'Itajá',
  'Itaú',
  'Jaçanã',
  'Jandaíra',
  'Janduís',
  'Januário Cicco',
  'Japi',
  'Jardim de Angicos',
  'Jardim de Piranhas',
  'Jardim do Seridó',
  'João Câmara',
  'João Dias',
  'José da Penha',
  'Jucurutu',
  'Jundiá',
  "Lagoa d'Anta",
  'Lagoa de Pedras',
  'Lagoa de Velhos',
  'Lagoa Nova',
  'Lagoa Salgada',
  'Lajes',
  'Lajes Pintadas',
  'Lucrécia',
  'Luís Gomes',
  'Macaíba',
  'Macau',
  'Major Sales',
  'Marcelino Vieira',
  'Martins',
  'Maxaranguape',
  'Messias Targino',
  'Montanhas',
  'Monte Alegre',
  'Monte das Gameleiras',
  'Mossoró',
  'Natal',
  'Nísia Floresta',
  'Nova Cruz',
  "Olho d'Água do Borges",
  'Ouro Branco',
  'Paraná',
  'Paraú',
  'Parazinho',
  'Parelhas',
  'Rio do Fogo',
  'Passa e Fica',
  'Passagem',
  'Patu',
  'Santa Maria',
  'Pau dos Ferros',
  'Pedra Grande',
  'Pedra Preta',
  'Pedro Avelino',
  'Pedro Velho',
  'Pendências',
  'Pilões',
  'Poço Branco',
  'Portalegre',
  'Porto do Mangue',
  'Serra Caiada',
  'Pureza',
  'Rafael Fernandes',
  'Rafael Godeiro',
  'Riacho da Cruz',
  'Riacho de Santana',
  'Riachuelo',
  'Rodolfo Fernandes',
  'Tibau',
  'Ruy Barbosa',
  'Santa Cruz',
  'Santana do Matos',
  'Santana do Seridó',
  'Santo Antônio',
  'São Bento do Norte',
  'São Bento do Trairí',
  'São Fernando',
  'São Francisco do Oeste',
  'São Gonçalo do Amarante',
  'São João do Sabugi',
  'São José de Mipibu',
  'São José do Campestre',
  'São José do Seridó',
  'São Miguel',
  'São Miguel do Gostoso',
  'São Paulo do Potengi',
  'São Pedro',
  'São Rafael',
  'São Tomé',
  'São Vicente',
  'Senador Elói de Souza',
  'Senador Georgino Avelino',
  'Serra de São Bento',
  'Serra do Mel',
  'Serra Negra do Norte',
  'Serrinha',
  'Serrinha dos Pintos',
  'Severiano Melo',
  'Sítio Novo',
  'Taboleiro Grande',
  'Taipu',
  'Tangará',
  'Tenente Ananias',
  'Tenente Laurentino Cruz',
  'Tibau do Sul',
  'Timbaúba dos Batistas',
  'Touros',
  'Triunfo Potiguar',
  'Umarizal',
  'Upanema',
  'Várzea',
  'Venha-Ver',
  'Vera Cruz',
  'Viçosa',
  'Vila Flor'
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\brn\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CITY_NAME_CORRECTIONS: Array<[string, string]> = [
  ['sao pauloo do potengi', 'São Paulo do Potengi'],
  ['sao paulo do potengi', 'São Paulo do Potengi']
];

export function normalizeKnownCityName(value: string) {
  const normalizedValue = normalize(value);
  const correction = CITY_NAME_CORRECTIONS.find(([match]) => normalizedValue.includes(match));
  return correction ? correction[1] : value;
}

export function getLocationReview(value: string) {
  const trimmed = value.trim();
  const correctedValue = normalizeKnownCityName(trimmed);
  const normalizedValue = normalize(trimmed);
  const normalizedCorrectedValue = normalize(correctedValue);
  const hasKnownCity = Object.keys(CITY_COORDINATES).some((city) => normalizedCorrectedValue.includes(normalize(city)));
  const hasSuspiciousRepeatedLetter = /\b[a-z]*([a-z])\1{2,}[a-z]*\b/i.test(normalizedValue);
  const wasCorrected = normalizedValue !== normalizedCorrectedValue;

  return {
    correctedValue,
    hasKnownCity,
    requiresConfirmation: trimmed.length > 0 && (!hasKnownCity || hasSuspiciousRepeatedLetter),
    wasCorrected,
    message: wasCorrected
      ? `Encontramos uma possivel correcao: ${correctedValue}.`
      : hasKnownCity
        ? ''
        : 'Nao reconhecemos essa cidade no mapa. Revise o nome ou confirme se esta correto.'
  };
}

const CITY_CENTER_TOLERANCE = 0.015;

function matchesNeighborhoodName(text: string, name: string) {
  const normalizedText = normalize(text);
  const normalizedName = normalize(name);

  if (!normalizedName || normalizedName.length < 3) return false;
  if (normalizedText.includes(normalizedName)) return true;

  const tokens = normalizedName.split(' ').filter((token) => token.length >= 4);
  return tokens.length > 0 && tokens.every((token) => normalizedText.includes(token));
}

function resolveNeighborhoodCoordinates(
  locationText: string,
  searchTexts: string[]
): [number, number] | null {
  const combined = normalize([locationText, ...searchTexts].filter(Boolean).join(' '));

  for (const item of NEIGHBORHOOD_COORDINATES) {
    const cityNorm = normalize(item.city);
    const hasCity = normalize(locationText).includes(cityNorm) || combined.includes(cityNorm);

    if (!hasCity) continue;

    const hasNeighborhood = item.names.some((name) =>
      searchTexts.some((text) => matchesNeighborhoodName(text, name))
    );

    if (hasNeighborhood) {
      return item.coordinates;
    }
  }

  for (const item of NEIGHBORHOOD_COORDINATES) {
    const hasNeighborhood = item.names.some((name) => matchesNeighborhoodName(combined, name));
    if (hasNeighborhood) {
      return item.coordinates;
    }
  }

  return null;
}

export function resolveListingCoordinates(...parts: Array<string | null | undefined>): [number, number] {
  const location = parts[0]?.trim() ?? '';
  const structuredParts = parts.slice(1).filter(Boolean).map((part) => String(part));
  const fullText = normalize(parts.filter(Boolean).join(' '));

  const neighborhoodCoords = resolveNeighborhoodCoordinates(location, structuredParts);
  if (neighborhoodCoords) {
    return neighborhoodCoords;
  }

  for (const item of NEIGHBORHOOD_COORDINATES) {
    const hasCity = fullText.includes(normalize(item.city));
    const hasNeighborhood = item.names.some((name) => fullText.includes(normalize(name)));

    if (hasCity && hasNeighborhood) {
      return item.coordinates;
    }
  }

  for (const [city, coordinates] of Object.entries(CITY_COORDINATES)) {
    if (fullText.includes(normalize(city))) {
      return coordinates;
    }
  }

  return DEFAULT_COORDINATES;
}

export function isDefaultListingCoordinate(lat: number, lng: number) {
  return Math.abs(lat - DEFAULT_COORDINATES[0]) < 0.0001 && Math.abs(lng - DEFAULT_COORDINATES[1]) < 0.0001;
}

/** Coordenadas genericas de centro de ciudad (no son pin exacto do imovel). */
export function isKnownCityCenterCoordinate(lat: number, lng: number) {
  if (isDefaultListingCoordinate(lat, lng)) return true;

  return Object.values(CITY_COORDINATES).some(
    ([cityLat, cityLng]) =>
      Math.abs(lat - cityLat) < CITY_CENTER_TOLERANCE && Math.abs(lng - cityLng) < CITY_CENTER_TOLERANCE
  );
}
