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
    donorCode: 'X7kQ2mPv9Rt4',
    donorName: 'Maria G.',
    amount: 5_000,
    timestamp: now - 22 * MIN,
    note: 'Para los filtros de agua en la vereda Alto Bonito.',
  },
  {
    id: 'demo-don-2',
    donorCode: 'bN3wTz8HcX5k',
    donorName: 'James T.',
    amount: 25_000,
    timestamp: now - 2 * HOUR,
    note: 'Donación mensual — que las linternas sigan encendidas.',
  },
  {
    id: 'demo-don-3',
    donorCode: 'Qm7Rp4Ks2Vn9',
    donorName: 'Priya S.',
    amount: 10_000,
    timestamp: now - 5 * HOUR,
  },
  {
    id: 'demo-don-4',
    donorCode: 'F2xLw9Jd6Gy3',
    donorName: 'Tom B.',
    amount: 7_500,
    timestamp: now - 9 * HOUR,
    note: 'De parte de nuestro grupo de la iglesia en Dayton.',
  },
  {
    id: 'demo-don-5',
    donorCode: 'Hv5cN8aE3Zu7',
    donorName: 'Elena R.',
    amount: 50_000,
    timestamp: now - 26 * HOUR,
    note: 'En memoria de mi abuela, que amaba las montañas.',
  },
  {
    id: 'demo-don-6',
    donorCode: 'Kd9sW4qM1Yf6',
    donorName: 'David K.',
    amount: 15_000,
    timestamp: now - 2 * DAY,
  },
  {
    id: 'demo-don-7',
    donorCode: 'Zt3Gj6Vx8Pb2',
    donorName: 'Ana M.',
    amount: 30_000,
    timestamp: now - 3 * DAY,
    note: 'Materiales para el techo de la escuela, si es posible.',
  },
];

export const demoTransfers: Transfer[] = [
  {
    id: 'demo-tr-1',
    amount: 120_000,
    timestamp: now - 1 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    purpose: 'Filtros de agua + mercados básicos para 14 familias, vereda Alto Bonito',
  },
  {
    id: 'demo-tr-2',
    amount: 85_000,
    timestamp: now - 8 * HOUR,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    purpose: 'Tejas de zinc y madera — dos viviendas reparadas',
    proofUrl: '/how-step-3.jpg',
  },
  {
    id: 'demo-tr-3',
    amount: 240_000,
    timestamp: now - 30 * HOUR,
    recipient: 'Fundación Mano Andina (aliado local)',
    purpose: 'Cobijas, colchonetas y kits de cocina después de la réplica',
  },
  {
    id: 'demo-tr-4',
    amount: 60_000,
    timestamp: now - 3 * DAY,
    recipient: 'Carlos Mendoza (coordinador de campo)',
    purpose: 'Combustible + alquiler de camión para el viaje de suministros a la montaña',
    proofUrl: '/how-step-3.jpg',
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
  {
    id: 'demo-med-6',
    cloudinaryUrl: '/quake-5.jpg',
    thumbnailUrl: '/quake-5.jpg',
    caption: 'Sismograma del choque principal de M7.4 registrado el 10 de agosto de 2026.',
    timestamp: now - 3 * DAY,
    updateId: 'demo-upd-3',
  },
];
