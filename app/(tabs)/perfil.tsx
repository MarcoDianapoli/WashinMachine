import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Modal, FlatList, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Vehiculo } from '@/types';
import { useApp } from '@/store';

interface MakeResult { Make_ID: number; Make_Name: string }
interface ModelResult { Model_ID: number; Model_Name: string }
interface WikiImage {
  id: number; titulo: string; url: string; ancho: number; alto: number;
  autor: string; licencia: string; paginaUrl: string; atribucion: string;
  dataUri?: string;
}
interface WikiResult { exito: boolean; total: number; imagenes: WikiImage[]; mensaje?: string }

const ITEMS_PER_PAGE = 50;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const SEARCH_TIMEOUT = 10000;

const TYPE_EMOJI: Record<string, string> = {
  Sedan: '\u{1F697}', SUV: '\u{1F699}',
  'Pickup Truck': '\u{1F6FB}', Truck: '\u{1F6FB}',
  Coupe: '\u{1F3CE}', Hatchback: '\u{1F697}',
  Convertible: '\u{1F698}', Wagon: '\u{1F697}',
  Minivan: '\u{1F690}', Van: '\u{1F690}',
  Motorcycle: '\u{1F3CD}', Trailer: '\u{1F69B}',
};
const DEFAULT_EMOJI = '\u{1F697}';

const WIKI_API = 'https://commons.wikimedia.org/w/api.php';
const searchCache = new Map<string, WikiResult>();

const LARGE_SUV_MODELS = /\b(suburban|tahoe|yukon|expedition|navigator|escalade|armada|sequoia|land.cruiser|prado|fj.cruiser|montero|pajero|wrangler.unlimited|gls|x7|q7|q8|cayenne|bentayga|cullinan|ghost|phantom|urus|levante|grecale)\b/i;
const SUV_MODELS = /\b(cr-v|rav4|escape|tucson|sportage|forester|cx-5|cx-9|cx-30|cx-50|cx-90|highlander|pilot|pathfinder|murano|rogue|x-trail|qashqai|equinox|traverse|blazer|explorer|edge|territory|endeavour|kuga|ecosport|santa.?fe|kona|venue|telluride|sorento|sportage|niro|seltos|ev6|id\.4|id\.5|enyaq|model.y|model.x|x5|x3|x1|x6|q5|q3|gle|glc|glb|gla|touareg|tiguan|taos|atlas|compass|cherokee|grand.cherokee|wrangler|renegade|fiat.500x|duster|sandero.stepway|captur|kadjar|arkana|austral|t-cross|t-roc|taigo|tracker|trailblazer|trax|encore|envision|xterra|4runner|outlander|eclipse.cross|xceed|ceed|stonic|wrx|crosstrek|forester|outback|ascent|levorg|xv|hr-v|zr-v|vezel|passport|mux|mu-x|sw4|etron|q4|q6|gt|eqb|eqc|eqe|eqs|ix|ix3|ix5|i4|i5|i7|xc40|xc60|xc90|x60|x90|q2|bmwx)\d*\b/i;
const SEDAN_MODELS = /\b(civic|corolla|sentra|altima|accord|camry|malibu|fusion|focus|fiesta|elantra|sonata|azera|avante|optima|k5|rio|forte|mazda3|mazda6|323|626|subaru.impreza|legacy|galant|lancer|mirage|versa|sunny|tiida|almera|leaf|prius|corona|carina|premio|allion|belta|vios|yaris.sedan|city|grace|brio.sedan|vento|jetta|passat|jetta|golf.sedan|fabia|rapid|octavia|superb|laguna|megane.sedan|fluence|duster.sedan|logan|symbol|clio.sedan|talisman|c-class|e-class|s-class|cla|clk|3-series|5-series|7-series|2-series|4-series|a3.sedan|a4|a5.sportback|a6|a8|s60|s90|v60|s80|ct4|ct5|ct6|ats|xts|tsx|rlx|rl|tlx|ilx|integra|legend|laurel|skyline|teana|cefiro|victoria|crown|mark.x|sail|cavalier|onix|prisma|classic|astra|vectra|insignia|monza|cobalt|cruze|malibu|impala|caprice|fusion)\b/i;
const HATCHBACK_MODELS = /\b(golf|yaris|fit|jazz|fiesta|focus|mazda2|mazda3|swift|baleno|celerio|ignis|spark|matiz|aveo|sonic|polo|ibiza|leon|clio|megane|208|308|508|c3|c4|micra|note|pulse|kwid|tiago|nano|alto|splash|agile|onix.hatch|prisma.hatch|fiesta.hatch|focus.hatch|corsa|astra|vectra.hatch|insignia.hatch|i20|i10|i30|rio.hatch|forte5|ceed|proceed|xceed|swift.sport|vitara)\b/i;
const COUPE_MODELS = /\b(mustang|camaro|charger|challenger|corvette|supra|gt86|gr86|brz|fr-s|mx-5|miata|s2000|nsx|rc-f|lc500|rc350|370z|350z|z4|m2|m4|i8|tt|r8|a5.coupe|s5.coupe|e-class.coupe|c-class.coupe|clc|4-series|6-series|8-series|porsche.911|porsche.718|cayman|boxster|458|488|f8|roma|portofino|huracan|aventador|urus|golf.gti|golf.r|civic.type.r|focus.rs|megane.rs|i30.n|veloster|elantra.coupe|ford.gt|viper|db11|vantage|dbs|continental.gt|supra)\b/i;
const WAGON_MODELS = /\b(outback|levorg|passat.variant|golf.variant|octavia.combi|superb.combi|focus.wagon|mazda6.wagon|3-series.touring|5-series.touring|e-class.wagon|c-class.wagon|volvo.v60|volvo.v90|regal.tourx|insignia.sports.tourer|cla.shooting.brake|a4.avant|a6.avant|clase.golf.familiar|ibiza.st|leon.st)\b/i;
const CONVERTIBLE_MODELS = /\b(mx-5|miata|z4|boxster|cayman|718|porsche.911|camaro.convertible|mustang.convertible|corvette.convertible|audi.tt|bmw.4-series.convertible|bmw.2-series.convertible|mazda.mx-5|fiat.124.spider|abarth.124|mercedes.slc|mercedes.slk|mercedes.e-class.convertible|mercedes.c-class.convertible|volkswagen.eos|volkswagen.golf.cabrio|mini.convertible|smart.cabrio|lotus.elise|lotus.exige|lamborghini.huracan|lamborghini.aventador|ferrari.488|ferrari.roma|mclaren.720s|mclaren.artura)\b/i;
const MOTORCYCLE_MODELS = /\b(harley|harley-davidson|street.glide|road.glide|fat.boy|iron|sportster|nightster|softail|heritage|electra.glide|road.king|low.rider|dyna|wide.glide|breakout|v-rod|vrsc|gold.wing|shadow|rebel|grom|monkey|navi|dio|activa|sh|pcx|forza|silver.wing|cbr|cb|crf|xr|xl|vfr|st|nt|yamaha|yzf|r1|r6|r3|r7|mt-09|mt-07|mt-10|fz|vmax|bolt|star|stratoliner|roadliner|venture|super.tenere|tracer|niken|tricity|suzuki|gsx-r|gsx-s|gsx|hayabusa|bandit|v-strom|dl|dr|dr-z|rm|kawasaki|ninja|z900|z650|z400|z1000|versys|vulcan|kfx|klx|kz|bmw.motorrad|r.1200|r.1250|s.1000|k.1600|f.800|f.900|g.310|ducati|monster|multistrada|panigale|streetfighter|scrambler|supersport|hypermotard|diavel|triumph|bonneville|street.twin|speed.twin|tiger|rocket|thruxton|daytona|speed.triple|street.triple|scrambler|ktm|duke|adventure|rc|exc|sx|sxf|excf|husqvarna|vitpilen|svartpilen|norden|indian|scout|chief|challenger|springfield|victory|cross.country|cross.roads|high.ball|judge|gunner|vespa|primavera|sprint|gts|gtr|aprilia|tuono|rsv4|rs660|tuareg|shiver|dorsoduro|moto.guzzi|v7|v9|v85|brough.superior|cake|zero|livewire|energica|lightning|sym|kymco|genesis|vento|bajaj|tvss)\b/i;
const TRAILER_MODELS = /\b(trailer|cargo|utility.trailer|enclosed|dump.trailer|flatbed|tilt|equipment.trailer|car.hauler|boat.trailer|jet.ski.trailer|motorcycle.trailer|livestock|horse.trailer|stock.trailer|gooseneck|fifth.wheel|toy.hauler|travel.trailer|camper|rv|motorhome|fleetwood|winnebago|airstream|jayco|forest.river|keystone|thor|heartland|grand.design|lance|northwood|nuwa|outdoors.rv|starcraft|kz|venture|pilgrim|cougar|hideout|passport|mili|work.trailer|landscaping|landscape.trailer|log.splitter|tilt.deck|car.carrier|tow.dolly|adaptador|remolque)\b/i;
const PICKUP_MODELS = /\b(f-?\d{3}|ram\s|silverado|sierra|tacoma|tundra|frontier|ranger|hilux|hi-lux|d-max|navara|np300|colt|l200|triton|strada|s10|dakota|canyon|colorado|mitsubishi.l200|toyota.hilux|nissan.navara|ford.ranger|chevrolet.s10|chevrolet.colorado|gmc.canyon|ram.1500|ram.2500|ram.3500|cybertruck|ridgeline)\b/i;
const VAN_MODELS = /\b(odyssey|sienna|carnival|pacifica|grand.caravan|town.country|transit|express|promaster|nv200|nv|kombi|multivan|caddy|berlingo|partner|kangoo|doblo|scudo|jumpy|traveller|trafic|primastar|vivaro|move|safari|astro|e-life|e-delivery)\b/i;

function typeFromModel(make: string, model: string, makeTypes?: string[]): string | null {
  const m = `${make} ${model}`.toLowerCase();
  if (TRAILER_MODELS.test(m)) return 'Trailer';
  if (MOTORCYCLE_MODELS.test(m)) return 'Motorcycle';
  if (LARGE_SUV_MODELS.test(m)) return 'Large SUV';
  if (SUV_MODELS.test(m)) return 'SUV';
  if (PICKUP_MODELS.test(m)) return 'Pickup Truck';
  if (VAN_MODELS.test(m)) return 'Minivan';
  if (HATCHBACK_MODELS.test(m)) return 'Hatchback';
  if (COUPE_MODELS.test(m)) return 'Coupe';
  if (CONVERTIBLE_MODELS.test(m)) return 'Convertible';
  if (WAGON_MODELS.test(m)) return 'Wagon';
  if (SEDAN_MODELS.test(m)) return 'Sedan';
  if (makeTypes && makeTypes.length > 0) {
    if (makeTypes.includes('Motorcycle')) return 'Motorcycle';
    if (makeTypes.includes('Trailer')) return 'Trailer';
    if (makeTypes.includes('Off Road Vehicle')) return 'Motorcycle';
    if (makeTypes.includes('Low Speed Vehicle (LSV)')) return 'Motorcycle';
    if (makeTypes.includes('Passenger Car')) return 'Sedan';
    if (makeTypes.includes('Multipurpose Passenger Vehicle (MPV)')) return 'SUV';
    if (makeTypes.includes('Truck')) return 'Pickup Truck';
  }
  return null;
}

function matchBodyClass(raw: string): string {
  const n = raw.toLowerCase();
  const patterns: [string, string][] = [
    ['pickup', 'Pickup Truck'], ['truck', 'Truck'],
    ['suv', 'SUV'], ['crossover', 'SUV'],
    ['sedan', 'Sedan'], ['coupe', 'Coupe'],
    ['hatchback', 'Hatchback'], ['convertible', 'Convertible'],
    ['wagon', 'Wagon'], ['minivan', 'Minivan'], ['van', 'Van'],
    ['motorcycle', 'Motorcycle'], ['trailer', 'Trailer'],
  ];
  for (const [kw, mapped] of patterns) {
    if (n.includes(kw)) return mapped;
  }
  return 'default';
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let bin = '';
  new Uint8Array(buf).forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

async function downloadAsDataUri(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AutoLavadoApp/1.0 (React Native)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
  return `data:${mime};base64,${arrayBufferToBase64(buf)}`;
}

async function searchWikimedia(make: string, model: string, year: string | null): Promise<WikiResult> {
  const searchTerm = year ? `"${make} ${model}" ${year}` : `"${make} ${model}"`;
  const url = `${WIKI_API}?action=query&format=json&formatversion=2&origin=*&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&prop=imageinfo&iiprop=url%7Cextmetadata%7Csize&iiurlwidth=400&gsrlimit=20`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
  let res: Response;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AutoLavadoApp/1.0 (React Native)' },
    });
  } catch (e: any) {
    clearTimeout(id);
    return { exito: false, mensaje: e?.name === 'AbortError' ? 'Tiempo agotado' : (e?.message ?? 'Error de red'), total: 0, imagenes: [] };
  }
  clearTimeout(id);

  if (!res.ok) return { exito: false, mensaje: `HTTP ${res.status}`, total: 0, imagenes: [] };

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch {
    return { exito: false, mensaje: `Respuesta inválida: "${text.slice(0, 80)}"`, total: 0, imagenes: [] };
  }

  if (data?.error) return { exito: false, mensaje: `API: ${data.error.info ?? ''}`, total: 0, imagenes: [] };

  const pages: any[] = data?.query?.pages;
  if (!pages || pages.length === 0) return { exito: false, mensaje: 'Sin resultados', total: 0, imagenes: [] };

  const imagenes: WikiImage[] = pages.map((p: any) => {
    const info = p?.imageinfo?.[0] ?? {};
    const meta = info.extmetadata ?? {};
    const autor = meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || 'Autor desconocido';
    const licencia = meta.LicenseShortName?.value || 'CC BY-SA';
    return {
      id: p.pageid,
      titulo: p.title.replace('File:', ''),
      url: info.thumburl ?? info.url,
      ancho: info.thumbwidth ?? info.width ?? 0,
      alto: info.thumbheight ?? info.height ?? 0,
      autor, licencia,
      paginaUrl: `https://commons.wikimedia.org/wiki/${p.title}`,
      atribucion: `${p.title.replace('File:', '')} | ${autor} | ${licencia}`,
    };
  });
  return { exito: true, total: imagenes.length, imagenes };
}

export default function PerfilScreen() {
  const { setTamanoVehiculo, tamanoVehiculo, setCliente, cliente: storedCliente } = useApp();
  const [nombre, setNombre] = useState(storedCliente?.nombre ?? '');
  const [telefono, setTelefono] = useState(storedCliente?.telefono ?? '');
  const [personaRecoge, setPersonaRecoge] = useState(storedCliente?.personaRecoge ?? '');
  const [direccion, setDireccion] = useState(storedCliente?.direccion ?? '');
  const [notas, setNotas] = useState(storedCliente?.notas ?? '');
  const [vehiculo, setVehiculo] = useState<Vehiculo>(storedCliente?.vehiculo ?? { placa: '', marca: '', modelo: '', color: '' });

  const [makes, setMakes] = useState<MakeResult[]>([]);
  const [models, setModels] = useState<ModelResult[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [searching, setSearching] = useState(false);
  const [wikiResult, setWikiResult] = useState<WikiResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ dataUri: string; attribution: string } | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingImage, setLoadingImage] = useState(false);
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showUploaded, setShowUploaded] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; mode: 'marca' | 'modelo' | 'año' }>({ visible: false, mode: 'marca' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [makeTypes, setMakeTypes] = useState<string[]>([]);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [manualMarca, setManualMarca] = useState(false);
  const [manualModelo, setManualModelo] = useState(false);

  useEffect(() => {
    if (storedCliente) {
      setNombre(storedCliente.nombre);
      setTelefono(storedCliente.telefono);
      setPersonaRecoge(storedCliente.personaRecoge ?? '');
      setDireccion(storedCliente.direccion ?? '');
      setNotas(storedCliente.notas ?? '');
      setVehiculo(storedCliente.vehiculo);
      if (storedCliente.vehiculo.anio) {
        setSelectedYear(storedCliente.vehiculo.anio);
      }
      if (storedCliente.vehiculo.imagenUri) {
        const uri = storedCliente.vehiculo.imagenUri;
        if (uri.startsWith('file:')) {
          setUploadedImage(uri);
          setShowUploaded(true);
        } else {
          setSelectedImage({ dataUri: uri, attribution: '' });
        }
      }
      if (storedCliente.vehiculo.tipoVehiculo) {
        setVehicleType(storedCliente.vehiculo.tipoVehiculo);
      }
    }
  }, [storedCliente]);

  useEffect(() => { setTamanoVehiculo(vehicleType); }, [vehicleType, setTamanoVehiculo]);

  useEffect(() => {
    if (makeTypes.length > 0 && vehiculo.marca && vehiculo.modelo && !vehicleType) {
      const detected = typeFromModel(vehiculo.marca, vehiculo.modelo, makeTypes);
      if (detected) setVehicleType(detected);
    }
  }, [makeTypes]);

  useEffect(() => {
    setLoadingMakes(true);
    fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json')
      .then((r) => r.json())
      .then((d) => {
        const seen = new Set<number>();
        const unique = ((d.Results ?? []) as MakeResult[]).filter((m) => {
          if (seen.has(m.Make_ID)) return false;
          seen.add(m.Make_ID);
          return true;
        });
        unique.sort((a, b) => a.Make_Name.localeCompare(b.Make_Name));
        setMakes(unique);
      })
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las marcas'))
      .finally(() => setLoadingMakes(false));
  }, []);

  const fetchMakeTypes = useCallback((makeName: string) => {
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMake/${encodeURIComponent(makeName)}?format=json`)
      .then((r) => r.json())
      .then((d) => {
        const types: string[] = (d.Results ?? []).map((r: any) => r.VehicleTypeName).filter(Boolean);
        const unique = [...new Set(types)];
        setMakeTypes(unique);
      })
      .catch(() => {});
  }, []);

  const fetchModels = useCallback((makeId: number, year: string | null) => {
    setLoadingModels(true);
    setModalConfig({ visible: true, mode: 'modelo' });
    setSearch('');
    setPage(1);
    const url = year
      ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`
      : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/${makeId}?format=json`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const seen = new Set<number>();
        const unique = ((d.Results ?? []) as ModelResult[]).filter((md) => {
          if (seen.has(md.Model_ID)) return false;
          seen.add(md.Model_ID);
          return true;
        });
        unique.sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));
        setModels(unique);
      })
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los modelos'))
      .finally(() => setLoadingModels(false));
  }, []);

  const downloadAndShow = useCallback(async (imgs: WikiImage[], idx: number) => {
    const img = imgs[idx];
    if (!img) return;
    setCurrentIdx(idx);
    setImageLoadFailed(false);
    if (img.dataUri) {
      setSelectedImage({ dataUri: img.dataUri, attribution: img.atribucion });
      return;
    }
    setLoadingImage(true);
    try {
      const dataUri = await downloadAsDataUri(img.url);
      img.dataUri = dataUri;
      setSelectedImage({ dataUri, attribution: img.atribucion });
    } catch {
      setImageLoadFailed(true);
    }
    setLoadingImage(false);
  }, []);

  const fetchImages = useCallback(async (make: string, model: string, year: string | null) => {
    const key = `${year ?? ''}|${make}|${model}`.toLowerCase();
    const cached = searchCache.get(key);
    if (cached) { setWikiResult(cached); await downloadAndShow(cached.imagenes, 0); return; }
    setSearching(true);
    setImageLoadFailed(false);
    const res = await searchWikimedia(make, model, year);
    searchCache.set(key, res);
    setWikiResult(res);
    setSearching(false);
    if (res.exito && res.imagenes.length > 0) await downloadAndShow(res.imagenes, 0);
  }, [downloadAndShow]);

  const goNext = useCallback(() => {
    if (!wikiResult || !wikiResult.exito) return;
    const next = (currentIdx + 1) % wikiResult.imagenes.length;
    downloadAndShow(wikiResult.imagenes, next);
  }, [wikiResult, currentIdx, downloadAndShow]);

  const goPrev = useCallback(() => {
    if (!wikiResult || !wikiResult.exito) return;
    const prev = (currentIdx - 1 + wikiResult.imagenes.length) % wikiResult.imagenes.length;
    downloadAndShow(wikiResult.imagenes, prev);
  }, [wikiResult, currentIdx, downloadAndShow]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir una foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setUploadedImage(result.assets[0].uri);
      setShowUploaded(true);
    }
  }, []);

  const removeUploaded = useCallback(() => {
    setShowUploaded(false);
  }, []);

  const triggerSearch = useCallback((make: string, model: string, year: string | null) => {
    if (!make || !model) { setWikiResult(null); setSelectedImage(null); setVehicleType(null); return; }
    setVehicleType(typeFromModel(make, model, makeTypes));
    setSelectedImage(null);
    setCurrentIdx(0);
    fetchImages(make, model, year);
  }, [fetchImages, makeTypes]);

  const setMakeManually = useCallback((text: string) => {
    setVehiculo((prev) => ({ ...prev, marca: text }));
    setSelectedMakeId(null);
    setModels([]);
    setMakeTypes([]);
    setSelectedImage(null); setWikiResult(null); setVehicleType(null);
    setManualMarca(false);
    fetchMakeTypes(text);
  }, [fetchMakeTypes]);

  const setModelManually = useCallback((make: string, text: string) => {
    setVehiculo((prev) => ({ ...prev, modelo: text }));
    setManualModelo(false);
    triggerSearch(make, text, selectedYear);
  }, [selectedYear, triggerSearch]);

  const openModal = useCallback((mode: 'marca' | 'modelo' | 'año') => {
    if (mode === 'modelo' && !selectedMakeId) return;
    setSearch('');
    setPage(1);
    if (mode === 'modelo') fetchModels(selectedMakeId!, selectedYear);
    else setModalConfig({ visible: true, mode });
  }, [selectedMakeId, selectedYear, fetchModels]);

  const closeModal = useCallback(() => setModalConfig((p) => ({ ...p, visible: false })), []);

  const selectMake = useCallback((m: MakeResult) => {
    setVehiculo((prev) => ({ ...prev, marca: m.Make_Name, modelo: '' }));
    setSelectedMakeId(m.Make_ID);
    setMakeTypes([]);
    setSelectedImage(null); setWikiResult(null); setVehicleType(null);
    fetchModels(m.Make_ID, selectedYear);
    fetchMakeTypes(m.Make_Name);
  }, [selectedYear, fetchModels, fetchMakeTypes]);

  const selectYear = useCallback((year: string) => {
    setSelectedYear(year);
    if (selectedMakeId) fetchModels(selectedMakeId, year);
    setModalConfig((p) => ({ ...p, visible: false }));
  }, [selectedMakeId, fetchModels]);

  const selectModel = useCallback((m: ModelResult) => {
    setVehiculo((prev) => ({ ...prev, modelo: m.Model_Name }));
    setModalConfig((p) => ({ ...p, visible: false }));
    triggerSearch(vehiculo.marca, m.Model_Name, selectedYear);
  }, [vehiculo.marca, selectedYear, triggerSearch]);

  const filteredItems = useMemo(() => {
    const items = modalConfig.mode === 'marca' ? makes : modalConfig.mode === 'año' ? YEARS : models;
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => {
      if (typeof i === 'string') return i.includes(q);
      return (i as MakeResult).Make_Name?.toLowerCase().includes(q);
    });
  }, [search, makes, models, modalConfig.mode]);

  const paginated = useMemo(() => filteredItems.slice(0, page * ITEMS_PER_PAGE), [filteredItems, page]);

  const emoji = vehicleType ? TYPE_EMOJI[matchBodyClass(vehicleType)] || DEFAULT_EMOJI : DEFAULT_EMOJI;
  const loading = modalConfig.mode === 'marca' ? loadingMakes : loadingModels;

  const guardar = () => {
    const vehiculoActualizado: Vehiculo = {
      ...vehiculo,
      anio: selectedYear ?? undefined,
      imagenUri: showUploaded && uploadedImage ? uploadedImage : selectedImage?.dataUri ?? undefined,
      tipoVehiculo: vehicleType ?? undefined,
    };
    setCliente({ nombre, telefono, vehiculo: vehiculoActualizado, personaRecoge, direccion, notas });
    Alert.alert('Datos guardados', 'Tu información se ha actualizado correctamente.');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Datos personales</Text>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput style={styles.input} placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
        <Text style={styles.label}>Número de contacto</Text>
        <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
        <Text style={styles.label}>Persona que puede recoger el vehículo</Text>
        <TextInput style={styles.input} placeholder="Nombre de la persona (opcional)" value={personaRecoge} onChangeText={setPersonaRecoge} />
        <Text style={styles.label}>Dirección</Text>
        <TextInput style={styles.input} placeholder="Dirección (opcional)" value={direccion} onChangeText={setDireccion} />
        <Text style={styles.label}>Notas</Text>
        <TextInput style={styles.input} placeholder="Notas o preferencias (opcional)" value={notas} onChangeText={setNotas} multiline numberOfLines={3} />

        <Text style={styles.sectionTitle}>Vehículo</Text>

        <View style={styles.imageContainer}>
          {showUploaded && uploadedImage ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: uploadedImage }} style={styles.vehicleImage} resizeMode="contain" />
              <Text style={styles.uploadHint}>Foto subida por ti</Text>
            </View>
          ) : searching || loadingImage ? (
            <ActivityIndicator size="large" color="#dc2626" />
          ) : selectedImage && !imageLoadFailed ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: selectedImage.dataUri }} style={styles.vehicleImage} resizeMode="contain" />
              <Text style={styles.attribution}>{selectedImage.attribution}</Text>
            </View>
          ) : (
            <Text style={styles.vehicleEmoji}>{emoji}</Text>
          )}
          {imageLoadFailed && (
            <Text style={styles.errorText}>No se pudo cargar la imagen. {vehicleType && `Tipo: ${vehicleType}`}</Text>
          )}
        </View>

        {showUploaded && uploadedImage ? (
          <TouchableOpacity style={styles.uploadBtn} onPress={removeUploaded}>
            <Text style={styles.uploadBtnText}>Usar foto de Wikimedia</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.uploadBtnOutline} onPress={pickImage}>
            <Text style={styles.uploadBtnOutlineText}>Subir mi propia foto</Text>
          </TouchableOpacity>
        )}

        {wikiResult && wikiResult.exito && wikiResult.total > 1 && (
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
              <Text style={styles.navBtnText}>◀ Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.navCount}>{currentIdx + 1} / {wikiResult.total}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={goNext}>
              <Text style={styles.navBtnText}>Siguiente ▶</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Placa</Text>
        <TextInput style={styles.input} placeholder="ABC-1234" value={vehiculo.placa} onChangeText={(t) => setVehiculo((p) => ({ ...p, placa: t }))} />

        {vehiculo.marca && vehiculo.modelo && (
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Tipo</Text>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenValue}>{vehicleType || 'No detectado'}</Text>
              {vehicleType && (
              <View style={[styles.sizeBadge, tamanoVehiculo === 'chico' ? styles.sizeChico : tamanoVehiculo === 'moto' ? styles.sizeMoto : tamanoVehiculo === 'mediano' ? styles.sizeMediano : tamanoVehiculo === 'trailer' ? styles.sizeTrailer : styles.sizeGrande]}>
                <Text style={styles.sizeBadgeText}>
                  {tamanoVehiculo === 'moto' ? '🏍️ Moto' : tamanoVehiculo === 'trailer' ? '🚛 Trailer' : tamanoVehiculo === 'chico' ? 'S — Chico' : tamanoVehiculo === 'mediano' ? 'M — Mediano' : 'L — Grande'}
                </Text>
              </View>
              )}
            </View>
          </View>
        )}

        <Text style={styles.label}>Marca</Text>
        {manualMarca ? (
          <View style={styles.manualRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Escribe la marca" value={vehiculo.marca} onChangeText={(t) => setVehiculo((p) => ({ ...p, marca: t }))} autoFocus />
            <TouchableOpacity style={styles.manualConfirm} onPress={() => setMakeManually(vehiculo.marca)}><Text style={styles.manualConfirmText}>OK</Text></TouchableOpacity>
            <TouchableOpacity style={styles.manualCancel} onPress={() => { setManualMarca(false); setVehiculo((p) => ({ ...p, marca: '' })); }}><Text style={styles.manualCancelText}>Cancelar</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pickerField} onPress={() => openModal('marca')}>
            <Text style={[styles.pickerText, !vehiculo.marca && styles.placeholder]}>
              {vehiculo.marca || 'Selecciona una marca'}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Año</Text>
        <TouchableOpacity style={styles.pickerField} onPress={() => openModal('año')}>
          <Text style={[styles.pickerText, !selectedYear && styles.placeholder]}>
            {selectedYear || 'Selecciona un año (opcional)'}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Modelo</Text>
        {manualModelo || (vehiculo.marca && !selectedMakeId) ? (
          <View style={styles.manualRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Escribe el modelo" value={vehiculo.modelo} onChangeText={(t) => setVehiculo((p) => ({ ...p, modelo: t }))} autoFocus />
            <TouchableOpacity style={styles.manualConfirm} onPress={() => setModelManually(vehiculo.marca, vehiculo.modelo)}><Text style={styles.manualConfirmText}>OK</Text></TouchableOpacity>
            <TouchableOpacity style={styles.manualCancel} onPress={() => { setManualModelo(false); setVehiculo((p) => ({ ...p, modelo: '' })); }}><Text style={styles.manualCancelText}>Cancelar</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.pickerField, !selectedMakeId && styles.pickerDisabled]} onPress={() => openModal('modelo')} disabled={!selectedMakeId}>
            <Text style={[styles.pickerText, !vehiculo.modelo && styles.placeholder]}>
              {vehiculo.modelo || (selectedMakeId ? 'Selecciona un modelo' : 'Primero elige una marca')}
            </Text>
            <Text style={[styles.arrow, !selectedMakeId && styles.arrowDisabled]}>▼</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Color</Text>
        <TextInput style={styles.input} placeholder="Color del vehículo" value={vehiculo.color} onChangeText={(t) => setVehiculo((p) => ({ ...p, color: t }))} />

        <TouchableOpacity style={styles.button} onPress={guardar}>
          <Text style={styles.buttonText}>Guardar datos</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalConfig.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalConfig.mode === 'marca' ? 'Seleccionar marca' : modalConfig.mode === 'año' ? 'Seleccionar año' : 'Seleccionar modelo'}
              </Text>
              <TouchableOpacity onPress={closeModal}><Text style={styles.modalClose}>Cerrar</Text></TouchableOpacity>
            </View>
            {modalConfig.mode !== 'año' && <TextInput style={styles.searchInput} placeholder="Buscar..." value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} />}
            {loading && modalConfig.mode !== 'año' ? (
              <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                key={modalConfig.mode}
                data={paginated}
                keyExtractor={(item) => modalConfig.mode === 'marca' ? `mk-${(item as MakeResult).Make_ID}` : modalConfig.mode === 'año' ? `yr-${item}` : `md-${(item as ModelResult).Model_ID}`}
                renderItem={({ item }) => {
                  if (modalConfig.mode === 'año') return <TouchableOpacity style={styles.modalItem} onPress={() => selectYear(item as string)}><Text style={styles.modalItemText}>{item as string}</Text></TouchableOpacity>;
                  const name = modalConfig.mode === 'marca' ? (item as MakeResult).Make_Name : (item as ModelResult).Model_Name;
                  return <TouchableOpacity style={styles.modalItem} onPress={() => modalConfig.mode === 'marca' ? selectMake(item as MakeResult) : selectModel(item as ModelResult)}><Text style={styles.modalItemText}>{name}</Text></TouchableOpacity>;
                }}
                onEndReached={() => setPage((p) => p + 1)}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={<Text style={styles.emptyText}>Sin resultados</Text>}
                ListFooterComponent={
                  modalConfig.mode !== 'año' ? (
                    <TouchableOpacity style={styles.manualOption} onPress={() => { closeModal(); modalConfig.mode === 'marca' ? setManualMarca(true) : setManualModelo(true); }}>
                      <Text style={styles.manualOptionText}>✏️ No encuentro lo que busco — Escribir manualmente</Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 8, color: '#333' },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ddd' },
  pickerField: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerDisabled: { opacity: 0.5 },
  pickerText: { fontSize: 16, color: '#333' },
  placeholder: { color: '#aaa' },
  arrow: { fontSize: 12, color: '#666' },
  arrowDisabled: { color: '#ccc' },
  button: { backgroundColor: '#dc2626', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  generateBtn: { backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  generateBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  changeBtn: { alignItems: 'center', marginBottom: 16 },
  changeBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 0 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalClose: { fontSize: 16, color: '#dc2626', fontWeight: '600' },
  searchInput: { backgroundColor: '#f5f5f5', margin: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, fontSize: 16 },
  modalItem: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemText: { fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  imageContainer: { alignItems: 'center', marginBottom: 12, minHeight: 160, justifyContent: 'center', width: '100%' },
  imageWrapper: { width: '100%', alignItems: 'center' },
  vehicleImage: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#f0f0f0' },
  vehicleEmoji: { fontSize: 72, textAlign: 'center' },
  resumenCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  resumenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  resumenLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', width: 50 },
  resumenValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  typeLabel: { fontSize: 13, color: '#666', textTransform: 'capitalize', fontWeight: '600' },
  sizeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  sizeChico: { backgroundColor: '#fee2e2' },
  sizeMediano: { backgroundColor: '#fecaca' },
  sizeGrande: { backgroundColor: '#fef3c7' },
  sizeMoto: { backgroundColor: '#fce7f3' },
  sizeTrailer: { backgroundColor: '#fca5a5' },
  sizeBadgeText: { fontSize: 11, fontWeight: '700' },
  attribution: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 },
  errorText: { fontSize: 13, color: '#dc2626', textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, gap: 16 },
  navBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#dc2626', borderRadius: 8 },
  navBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  navCount: { fontSize: 14, color: '#666', fontWeight: '600' },
  uploadHint: { fontSize: 11, color: '#999', marginTop: 4 },
  manualOption: { padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 8 },
  manualOptionText: { fontSize: 15, color: '#dc2626', fontWeight: '600', textAlign: 'center' },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  manualConfirm: { backgroundColor: '#dc2626', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  manualConfirmText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  manualCancel: { paddingVertical: 10, paddingHorizontal: 12 },
  manualCancelText: { color: '#999', fontSize: 14 },
  uploadBtn: { alignItems: 'center', marginBottom: 16 },
  uploadBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  uploadBtnOutline: { borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16, borderStyle: 'dashed' },
  uploadBtnOutlineText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
});
