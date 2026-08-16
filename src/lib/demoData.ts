/**
 * Realistic demo data so every surface renders fully before Firebase is
 * connected (firebaseReady === false). Photos are real imagery from the
 * 10 Aug 2026 M7.4 Chocó earthquake response (see public/PHOTO_CREDITS.md),
 * served from /public as Cloudinary placeholders (design.md §11).
 */
import type {
  Donation,
  Transfer,
  ImpactUpdate,
  MediaItem,
  GlobalStats,
} from './types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();

/** Matches the hero numbers in home.md: $48,250 in / $41,780 out / 312 families. */
export const demoStats: GlobalStats = {
  totalIn: 4_825_000,
  totalOut: 4_178_000,
  familiesHelped: 312,
  updatedAt: now - 4 * MIN,
};

export const demoDonations: Donation[] = [
  {
    id: 'demo-don-1',
    donorCode: '482913',
    donorName: 'Maria G.',
    amount: 5_000,
    timestamp: now - 22 * MIN,
    note: 'Para los filtros de agua en la vereda Alto Bonito.',
  },
  {
    id: 'demo-don-2',
    donorCode: '107654',
    donorName: 'James T.',
    amount: 25_000,
    timestamp: now - 2 * HOUR,
    note: 'Donación mensual — que las linternas sigan encendidas.',
  },
  {
    id: 'demo-don-3',
    donorCode: '938201',
    donorName: 'Priya S.',
    amount: 10_000,
    timestamp: now - 5 * HOUR,
  },
  {
    id: 'demo-don-4',
    donorCode: '550127',
    donorName: 'Tom B.',
    amount: 7_500,
    timestamp: now - 9 * HOUR,
    note: 'De parte de nuestro grupo de la iglesia en Dayton.',
  },
  {
    id: 'demo-don-5',
    donorCode: '764308',
    donorName: 'Elena R.',
    amount: 50_000,
    timestamp: now - 26 * HOUR,
    note: 'En memoria de mi abuela, que amaba las montañas.',
  },
];

export const demoTransfers: Transfer[] = [
  {
    id: 'demo-tr-1',
    amount: 12_000,
    timestamp: now - 1 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Acuafiltros Quibdó',
    purpose: 'Agua potable para un punto de atención — Quibdó, Chocó',
  },
  {
    id: 'demo-tr-2',
    amount: 2_500,
    timestamp: now - 4 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Farmacia La Central',
    purpose: 'Pañales para bebés — refugio en Istmina',
  },
  {
    id: 'demo-tr-3',
    amount: 18_500,
    timestamp: now - 7 * HOUR,
    recipient: 'Fundación Mano Andina (aliado local)',
    vendor: 'Colchones El Descanso',
    purpose: 'Colchones para familias desplazadas — vereda Alto Bonito',
  },
  {
    id: 'demo-tr-4',
    amount: 6_000,
    timestamp: now - 12 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Restaurante Doña Mary',
    purpose: 'Almuerzos para trabajadores de rescate — Pereira',
  },
  {
    id: 'demo-tr-5',
    amount: 26_000,
    timestamp: now - 20 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Mercado Popular Salento',
    purpose: 'Mercado básico para una familia — vereda La Cumbre',
  },
  {
    id: 'demo-tr-6',
    amount: 9_000,
    timestamp: now - 28 * HOUR,
    recipient: 'Fundación Mano Andina (aliado local)',
    vendor: 'Veterinaria San Roque',
    purpose: 'Medicamentos para perros y gatos afectados — San José del Palmar',
  },
  {
    id: 'demo-tr-7',
    amount: 7_500,
    timestamp: now - 32 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Almacén El Telar',
    purpose: 'Cobijas — refugio de Quibdó',
  },
  {
    id: 'demo-tr-8',
    amount: 11_000,
    timestamp: now - 40 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Farmacia La Central',
    purpose: 'Fórmula infantil — refugio en Istmina',
  },
  {
    id: 'demo-tr-9',
    amount: 42_000,
    timestamp: now - 2 * DAY,
    recipient: 'Fundación Mano Andina (aliado local)',
    vendor: 'Droguería Cruz Verde',
    purpose: 'Insumos médicos — puesto de salud El Mirador',
  },
  {
    id: 'demo-tr-10',
    amount: 15_000,
    timestamp: now - 54 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Aseo Total',
    purpose: 'Kits de higiene — vereda El Mirador',
  },
  {
    id: 'demo-tr-11',
    amount: 22_000,
    timestamp: now - 60 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Transportes La Montaña',
    purpose: 'Transporte de suministros — vía a Alto Bonito',
    proofUrl: '/how-step-3.jpg',
  },
  {
    id: 'demo-tr-12',
    amount: 65_000,
    timestamp: now - 36 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    vendor: 'Ferretería El Pino',
    purpose: 'Materiales para reparación temporal — Salento',
  },
];

export const demoUpdates: ImpactUpdate[] = [
  {
    id: 'demo-upd-1',
    title: 'Filtros de agua instalados en Alto Bonito',
    body: 'Catorce familias vuelven a tener agua potable. Carlos subió los filtros a caballo los últimos 3 km — la vía sigue cortada por el derrumbe.',
    metrics: { 'filtros de agua': 14, familias: 14, 'km a caballo': 3 },
    timestamp: now - 3 * HOUR,
    mediaIds: ['demo-med-2'],
  },
  {
    id: 'demo-upd-2',
    title: 'Dos techos sellados antes de las lluvias',
    body: 'Las casas de los Gutiérrez y los Palacios están secas de nuevo. Las tejas se compraron en Salento y se subieron esa misma tarde.',
    metrics: { 'viviendas reparadas': 2, 'tejas de zinc': 18 },
    timestamp: now - 20 * HOUR,
    mediaIds: ['demo-med-3'],
  },
  {
    id: 'demo-upd-3',
    title: 'El viaje de suministros llega a tres veredas',
    body: 'Arroz, agua y cobijas entregados en Alto Bonito, La Cumbre y El Mirador. Abajo están las fotos vinculadas a las donaciones que las pagaron.',
    metrics: { veredas: 3, familias: 41, mercados: 41 },
    timestamp: now - 2 * DAY,
    mediaIds: ['demo-med-1', 'demo-med-4'],
  },
];

export const demoMedia: MediaItem[] = [
  {
    id: 'demo-med-1',
    cloudinaryUrl: '/quake-1.jpg',
    thumbnailUrl: '/quake-1.jpg',
    caption: 'Equipos de rescate retirando escombros de un edificio colapsado en Pereira, 12 de agosto de 2026.',
    timestamp: now - 6 * HOUR,
    updateId: 'demo-upd-3',
  },
  {
    id: 'demo-med-2',
    cloudinaryUrl: '/quake-2.jpg',
    thumbnailUrl: '/quake-2.jpg',
    caption: 'Búsqueda y rescate en marcha entre los escombros, Pereira.',
    timestamp: now - 7 * HOUR,
    donationId: 'demo-don-1',
    updateId: 'demo-upd-1',
  },
  {
    id: 'demo-med-3',
    cloudinaryUrl: '/quake-3.jpg',
    thumbnailUrl: '/quake-3.jpg',
    caption: 'Daños en edificios de Manizales tras el sismo de M7.4.',
    timestamp: now - 12 * HOUR,
  },
  {
    id: 'demo-med-4',
    cloudinaryUrl: '/quake-map.jpg',
    thumbnailUrl: '/quake-map.jpg',
    caption: 'Mapa de intensidad del USGS: MMI VIII cerca del epicentro en San José del Palmar, Chocó.',
    timestamp: now - 26 * HOUR,
    updateId: 'demo-upd-3',
  },
  {
    id: 'demo-med-5',
    cloudinaryUrl: '/quake-4.jpg',
    thumbnailUrl: '/quake-4.jpg',
    caption: 'Escombros de un edificio colapsado tras el terremoto de Colombia de 2026.',
    timestamp: now - 2 * DAY,
    donationId: 'demo-don-5',
  },
];
