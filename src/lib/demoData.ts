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
    note: 'For the water filters in vereda Alto Bonito.',
  },
  {
    id: 'demo-don-2',
    donorCode: 'bN3wTz8HcX5k',
    donorName: 'James T.',
    amount: 25_000,
    timestamp: now - 2 * HOUR,
    note: 'Monthly gift — keep the lanterns lit.',
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
    note: 'From our church small group in Dayton.',
  },
  {
    id: 'demo-don-5',
    donorCode: 'Hv5cN8aE3Zu7',
    donorName: 'Elena R.',
    amount: 50_000,
    timestamp: now - 26 * HOUR,
    note: 'In memory of my grandmother, who loved the mountains.',
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
    note: 'Roof materials for the schoolhouse, if possible.',
  },
];

export const demoTransfers: Transfer[] = [
  {
    id: 'demo-tr-1',
    amount: 120_000,
    timestamp: now - 1 * HOUR,
    recipient: 'Carlos Mendoza (field coordinator)',
    purpose: 'Water filters + food staples for 14 families, vereda Alto Bonito',
  },
  {
    id: 'demo-tr-2',
    amount: 85_000,
    timestamp: now - 8 * HOUR,
    recipient: 'Carlos Mendoza (field coordinator)',
    purpose: 'Roofing sheets and lumber — two repaired homes',
    proofUrl: '/how-step-3.jpg',
  },
  {
    id: 'demo-tr-3',
    amount: 240_000,
    timestamp: now - 30 * HOUR,
    recipient: 'Fundación Mano Andina (local partner)',
    purpose: 'Blankets, mattresses and kitchen kits after the aftershock',
  },
  {
    id: 'demo-tr-4',
    amount: 60_000,
    timestamp: now - 3 * DAY,
    recipient: 'Carlos Mendoza (field coordinator)',
    purpose: 'Fuel + truck hire for the mountain supply run',
    proofUrl: '/how-step-3.jpg',
  },
];

export const demoUpdates: ImpactUpdate[] = [
  {
    id: 'demo-upd-1',
    title: 'Water filters installed in Alto Bonito',
    body: 'Fourteen families now have safe drinking water again. Carlos walked the filters up the last 3km on horseback — the road is still cut by the slide.',
    metrics: { 'water filters': 14, families: 14, 'km on horseback': 3 },
    timestamp: now - 3 * HOUR,
    mediaIds: ['demo-med-2'],
  },
  {
    id: 'demo-upd-2',
    title: 'Two roofs sealed before the rains',
    body: 'The Gutiérrez and Palacios homes are dry again. Roofing sheets bought in Salento and carried up the same afternoon.',
    metrics: { 'homes repaired': 2, 'roofing sheets': 18 },
    timestamp: now - 20 * HOUR,
    mediaIds: ['demo-med-3'],
  },
  {
    id: 'demo-upd-3',
    title: 'Supply run reaches three veredas',
    body: 'Rice, water and blankets delivered to Alto Bonito, La Cumbre and El Mirador. Photos matched to the gifts that paid for them below.',
    metrics: { veredas: 3, families: 41, 'supply baskets': 41 },
    timestamp: now - 2 * DAY,
    mediaIds: ['demo-med-1', 'demo-med-4'],
  },
];

export const demoMedia: MediaItem[] = [
  {
    id: 'demo-med-1',
    cloudinaryUrl: '/quake-1.jpg',
    thumbnailUrl: '/quake-1.jpg',
    caption: 'Rescue teams clearing rubble of a collapsed building in Pereira, 12 Aug 2026.',
    timestamp: now - 6 * HOUR,
    updateId: 'demo-upd-3',
  },
  {
    id: 'demo-med-2',
    cloudinaryUrl: '/quake-2.jpg',
    thumbnailUrl: '/quake-2.jpg',
    caption: 'Search and rescue underway in the rubble, Pereira.',
    timestamp: now - 7 * HOUR,
    donationId: 'demo-don-1',
    updateId: 'demo-upd-1',
  },
  {
    id: 'demo-med-3',
    cloudinaryUrl: '/quake-3.jpg',
    thumbnailUrl: '/quake-3.jpg',
    caption: 'Building damage in Manizales after the M7.4 quake.',
    timestamp: now - 12 * HOUR,
  },
  {
    id: 'demo-med-4',
    cloudinaryUrl: '/quake-map.jpg',
    thumbnailUrl: '/quake-map.jpg',
    caption: 'USGS ShakeMap: MMI VIII near the epicenter at San José del Palmar, Chocó.',
    timestamp: now - 26 * HOUR,
    updateId: 'demo-upd-3',
  },
  {
    id: 'demo-med-5',
    cloudinaryUrl: '/quake-4.jpg',
    thumbnailUrl: '/quake-4.jpg',
    caption: 'Debris from a collapsed building after the 2026 Colombia earthquake.',
    timestamp: now - 2 * DAY,
    donationId: 'demo-don-5',
  },
  {
    id: 'demo-med-6',
    cloudinaryUrl: '/quake-5.jpg',
    thumbnailUrl: '/quake-5.jpg',
    caption: 'Seismogram of the M7.4 mainshock recorded on 10 Aug 2026.',
    timestamp: now - 3 * DAY,
    updateId: 'demo-upd-3',
  },
];
