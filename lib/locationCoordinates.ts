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
  'nova cruz': [-6.4781, -35.4339],
  // Interior / Serido / Oeste (centros municipais aproximados)
  'santana do matos': [-5.9469, -36.6503],
  'santana do serido': [-6.7709, -36.734],
  'pau dos ferros': [-6.1125, -38.2063],
  'angicos': [-5.6666, -36.6009],
  'umarizal': [-5.9855, -37.8186],
  'equador': [-6.9445, -36.7178],
  'patu': [-6.1006, -37.6385],
  'pendencias': [-5.2572, -36.7182],
  'joao camara': [-5.535, -35.8151],
  'macau': [-5.1131, -36.6351],
  'afonso bezerra': [-5.4989, -36.5089],
  'agua nova': [-6.1967, -38.2933],
  'alexandria': [-6.4167, -38.0167],
  'almino afonso': [-6.15, -37.75],
  'alto do rodrigues': [-5.2833, -36.7667],
  'antonio martins': [-6.2167, -37.8833],
  'arez': [-5.7333, -36.2333],
  'campo grande': [-5.85, -35.5667],
  'baia formosa': [-6.3667, -35.15],
  'barauna': [-4.915, -37.1386],
  'barcelona': [-5.9522, -35.9289],
  'bodo': [-5.9506, -36.4008],
  'bom jesus': [-6.0167, -35.5833],
  'caicara do norte': [-5.1833, -36.05],
  'caicara do rio do vento': [-5.75, -35.4333],
  'campo redondo': [-6.2667, -35.9667],
  'caraubas': [-5.7778, -36.4833],
  'carnauba dos dantas': [-6.55, -36.6167],
  'carnaubais': [-5.35, -36.8333],
  'cerro cora': [-6.045, -35.7167],
  'coronel ezequiel': [-6.2833, -35.2833],
  'coronel joao pessoa': [-6.2667, -38.3833],
  'cruzeta': [-6.5167, -36.7833],
  'doutor severiano': [-6.0833, -38.3667],
  'encanto': [-6.1167, -38.3167],
  'espirito santo': [-6.4667, -35.3167],
  'felipe guerra': [-5.6333, -37.6833],
  'fernando pedroza': [-5.4333, -36.3833],
  'florania': [-6.1667, -36.8667],
  'francisco dantas': [-6.0833, -38.1167],
  'frutuoso gomes': [-6.1333, -37.8333],
  'galinhos': [-5.0833, -36.2667],
  'governador dix sept rosado': [-5.4583, -37.5208],
  'grossos': [-4.9667, -37.15],
  'guamare': [-5.1, -36.3167],
  'ipanguacu': [-5.5, -36.85],
  'ipueira': [-6.1333, -37.15],
  'itaja': [-5.65, -36.8667],
  'itau': [-5.8333, -37.9833],
  'jacana': [-6.4333, -36.7833],
  'jandaira': [-5.35, -36.1333],
  'janduis': [-6.0167, -37.8833],
  'januario cicco': [-6.1333, -35.5167],
  'japi': [-6.4833, -35.9333],
  'jardim de angicos': [-5.6667, -36.2833],
  'jardim de piranhas': [-6.3833, -37.35],
  'jardim do serido': [-6.5833, -36.7667],
  'joao dias': [-6.2667, -37.8],
  'jose da penha': [-6.3167, -38.2667],
  'jucurutu': [-6.0333, -37.0167],
  'jundia': [-5.9333, -35.5667],
  'lagoa d anta': [-6.1, -35.7833],
  'lagoa de pedras': [-6.1833, -35.45],
  'lagoa de velhos': [-6.0167, -35.8667],
  'lagoa nova': [-6.1, -36.4833],
  'lajes': [-5.7667, -36.25],
  'lajes pintadas': [-6.1167, -36.1167],
  'lucrecia': [-5.9833, -37.8167],
  'luis gomes': [-6.4167, -38.3833],
  'major sales': [-6.4, -38.3333],
  'marcelino vieira': [-6.2833, -38.1333],
  'martins': [-5.5167, -37.9167],
  'maxaranguape': [-5.5117, -35.8194],
  'messias targino': [-6.0833, -35.65],
  'montanhas': [-6.0833, -35.35],
  'monte das gameleiras': [-6.4333, -35.7833],
  'olho d agua do borges': [-5.9833, -37.1333],
  'ouro branco': [-6.7, -36.95],
  'parana': [-6.45, -38.3],
  'parau': [-6.4667, -35.8667],
  'parazinho': [-5.2167, -35.8667],
  'parelhas': [-6.6833, -36.65],
  'rio do fogo': [-5.2667, -35.3833],
  'passa e fica': [-6.4333, -35.6167],
  'passagem': [-6.2833, -35.2167],
  'santa maria': [-5.85, -35.6833],
  'pedra grande': [-5.1667, -36.1167],
  'pedra preta': [-5.5167, -36.1167],
  'pedro avelino': [-5.45, -36.3833],
  'pedro velho': [-6.4333, -35.2167],
  'piloes': [-6.2667, -38.05],
  'poco branco': [-5.6167, -35.4],
  'portalegre': [-6.0333, -38.0167],
  'porto do mangue': [-5.0667, -36.7833],
  'serra caiada': [-6.1167, -35.7167],
  'pureza': [-5.4667, -35.5667],
  'rafael fernandes': [-6.2, -38.1167],
  'rafael godeiro': [-6.0667, -38.1167],
  'riacho da cruz': [-5.9333, -38.1333],
  'riacho de santana': [-6.4667, -38.3167],
  'riachuelo': [-5.4667, -35.8167],
  'rodolfo fernandes': [-5.7833, -38.0833],
  'tibau': [-4.8333, -37.0833],
  'ruy barbosa': [-5.8833, -35.9167],
  'sao bento do norte': [-5.1833, -36.0833],
  'sao bento do trairi': [-6.45, -36.0833],
  'sao fernando': [-6.3833, -37.1833],
  'sao francisco do oeste': [-5.9833, -38.05],
  'sao joao do sabugi': [-6.75, -36.8],
  'sao jose do campestre': [-6.3167, -35.7167],
  'sao jose do serido': [-6.4167, -36.8833],
  'sao miguel': [-6.2167, -38.4833],
  'sao pedro': [-5.8833, -35.6333],
  'sao rafael': [-6.95, -36.9],
  'sao vicente': [-6.2167, -36.6833],
  'senador georgino avelino': [-6.15, -35.4833],
  'serra de sao bento': [-6.3833, -35.7],
  'serra do mel': [-5.1167, -37.05],
  'serra negra do norte': [-6.6167, -37.3833],
  'serrinha': [-6.2833, -35.4833],
  'serrinha dos pintos': [-6.1167, -37.9667],
  'severiano melo': [-5.7833, -37.95],
  'sitio novo': [-6.0833, -35.2167],
  'taboleiro grande': [-5.8833, -35.9167],
  'taipu': [-5.6167, -35.6],
  'tenente ananias': [-6.4667, -38.1667],
  'tenente laurentino cruz': [-6.15, -36.7167],
  'timbauba dos batistas': [-6.7, -37.25],
  'triunfo potiguar': [-5.8667, -36.2],
  'upanema': [-5.6833, -37.2667],
  'varzea': [-6.35, -35.8833],
  'venha ver': [-6.3167, -36.7167],
  'vicosa': [-5.9833, -37.9667],
  'vila flor': [-6.3167, -35.0833]
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

  const cityCoords = resolveCityCoordinates(fullText, location.split(',')[0]?.trim() || location);
  if (cityCoords) {
    return cityCoords;
  }

  return DEFAULT_COORDINATES;
}

function resolveCityCoordinates(fullText: string, primaryCity?: string): [number, number] | null {
  const sorted = Object.entries(CITY_COORDINATES).sort(([a], [b]) => b.length - a.length);
  const primary = primaryCity ? normalize(primaryCity) : '';

  if (primary) {
    for (const [city, coordinates] of sorted) {
      const cityNorm = normalize(city);
      if (primary === cityNorm) {
        return coordinates;
      }
    }
  }

  for (const [city, coordinates] of sorted) {
    if (fullText.includes(normalize(city))) {
      return coordinates;
    }
  }

  return null;
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
