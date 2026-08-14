/**
 * Verified public-record context for the mission story (live ground-zero
 * spec §1, §3, §21).
 *
 * These are NOT LAPA field reports and are never styled as such. They are
 * the public record of what happened — taken from named, reputable sources
 * (SGC/USGS, UNGRD, Asocapitales, AP, BBC, UN) — so a donor can follow the
 * real timeline from Day 1 while LAPA's own purchases, deliveries and field
 * photos begin flowing in from the finance + volunteer consoles.
 *
 * Rules for anyone editing this file:
 *   - Only add events that actually happened, with a named source.
 *   - Keep each entry short. One fact per entry.
 *   - Never present context entries as LAPA activity.
 *   - Photos must be freely licensed and carry their credit line.
 */

export interface ContextMilestone {
  /** Mission day (1 = 10 Aug 2026). */
  day: number;
  /** Optional time of day shown before the title, e.g. "7:34 a.m." */
  time?: string;
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
  /** Named source shown on the card. */
  sourceName: string;
  sourceUrl: string;
  /** Optional photo from /public with its required credit line. */
  photo?: string;
  photoCredit?: string;
}

export const CONTEXT_MILESTONES: ContextMilestone[] = [
  {
    day: 1,
    time: '7:34 a.m.',
    titleEn: 'The earthquake hits.',
    titleEs: 'El terremoto golpea.',
    bodyEn:
      'Magnitude 7.4, epicenter near San José del Palmar, Chocó — the strongest earthquake in Colombia in over a decade. Felt in 32 departmental capitals.',
    bodyEs:
      'Magnitud 7,4, epicentro cerca de San José del Palmar, Chocó — el terremoto más fuerte en Colombia en más de una década. Se sintió en 32 capitales de departamento.',
    sourceName: 'USGS · Servicio Geológico Colombiano',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Colombia_earthquake',
    photo: '/quake-map.jpg',
    photoCredit: 'USGS ShakeMap, dominio público / public domain',
  },
  {
    day: 1,
    titleEn: 'National disaster declared.',
    titleEs: 'Se declara desastre nacional.',
    bodyEn:
      'The government activates the national response system. Buildings collapse in Pereira, Cali and Quibdó; 16 people are trapped in the Megacable station in Pereira. Airports suspend operations, including Matecaña in Pereira.',
    bodyEs:
      'El Gobierno activa el sistema nacional de respuesta. Se caen edificios en Pereira, Cali y Quibdó; 16 personas quedan atrapadas en la estación del Megacable de Pereira. Aeropuertos suspenden operaciones, incluido el Matecaña de Pereira.',
    sourceName: 'El Colombiano · BBC',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Colombia_earthquake',
  },
  {
    day: 1,
    titleEn: 'The pueblo organizes.',
    titleEs: 'El pueblo se organiza.',
    bodyEn:
      'Cities open centros de acopio the same day: Plazoleta Jairo Varela in Cali, seven community cafés in Pereira, Cruz Roja points in Bogotá. Water, blankets, non-perishable food and hygiene kits are what is needed most.',
    bodyEs:
      'Las ciudades abren centros de acopio ese mismo día: la Plazoleta Jairo Varela en Cali, siete cafés comunitarios en Pereira, puntos de la Cruz Roja en Bogotá. Lo que más se necesita: agua, cobijas, alimentos no perecederos y kits de higiene.',
    sourceName: 'Asocapitales',
    sourceUrl: 'https://www.asocapitales.co/actualidad/noticias/ciudades-seguras/ciudades-capitales-activan-centros-de-acopio-para-apoyar-las',
  },
  {
    day: 2,
    titleEn: 'Search and rescue through the night.',
    titleEs: 'Búsqueda y rescate durante la noche.',
    bodyEn:
      'Rescue teams work the collapsed buildings without pause. The UNGRD reports 176 dead, over 2,500 injured and 1,136 homes destroyed — numbers still climbing. The UN begins assessing needs on the ground.',
    bodyEs:
      'Los equipos de rescate trabajan los edificios colapsados sin pausa. La UNGRD reporta 176 fallecidos, más de 2.500 heridos y 1.136 viviendas destruidas — cifras aún en aumento. La ONU empieza a evaluar necesidades en el terreno.',
    sourceName: 'UNGRD · ONU',
    sourceUrl: 'https://news.un.org/es/story/2026/08/1541792',
    photo: '/manizales-noche.jpg',
    photoCredit: 'World Central Kitchen, CC BY 4.0',
  },
  {
    day: 3,
    titleEn: '"Lo perdimos todo."',
    titleEs: '"Lo perdimos todo."',
    bodyEn:
      'Survivors describe losing everything as Colombia begins three days of national mourning. A woman is pulled alive from the rubble after 36 hours. The government announces the "Fondo Milagro" for reconstruction; the European Union pledges €2 million.',
    bodyEs:
      'Los sobrevivientes cuentan que lo perdieron todo mientras Colombia inicia tres días de duelo nacional. Una mujer es rescatada con vida tras 36 horas bajo los escombros. El Gobierno anuncia el "Fondo Milagro" para la reconstrucción; la Unión Europea promete 2 millones de euros.',
    sourceName: 'AP · BBC · Euronews',
    sourceUrl: 'https://www.courant.com/2026/08/14/lo-perdimos-todo-qu-viene-para-los-miles-de-damnificados-del-terremoto-en-colombia/',
  },
  {
    day: 4,
    titleEn: 'Albergues fill up; water is the emergency.',
    titleEs: 'Los albergues se llenan; el agua es la emergencia.',
    bodyEn:
      'In Pereira, volunteers deliver hygiene kits to families relocated in shelters — five or six albergues are operating and at least one is already at full capacity. In Roldanillo, about 60% of communities have no drinking water. Quindío reports over 10,000 homes affected.',
    bodyEs:
      'En Pereira, voluntarios entregan kits de higiene a familias reubicadas en albergues — operan cinco o seis albergues y al menos uno ya está a plena capacidad. En Roldanillo, cerca del 60% de las comunidades no tiene agua potable. Quindío reporta más de 10.000 viviendas afectadas.',
    sourceName: 'AP · Project HOPE · Infobae',
    sourceUrl: 'https://www.expressnews.com/news/world/article/lo-perdimos-todo-que-viene-para-los-miles-de-22388477.php',
    photo: '/how-step-4.jpg',
    photoCredit: 'World Central Kitchen, CC BY 4.0',
  },
  {
    day: 4,
    titleEn: 'The diaspora moves too.',
    titleEs: 'La diáspora también se mueve.',
    bodyEn:
      'In Doral, Florida, volunteers pack food, first-aid kits and camping gear bound for Cali. "We\'re out here helping Colombia, especially Cali. That\'s our city."',
    bodyEs:
      'En Doral, Florida, voluntarios empacan comida, botiquines y equipo de campamento con destino a Cali. "Estamos aquí ayudando a Colombia, especialmente a Cali. Esa es nuestra ciudad."',
    sourceName: 'CBS News Miami',
    sourceUrl: 'https://www.cbsnews.com/miami/news/colombia-earthquake-aid-donations-south-florida-gem/',
  },
  {
    day: 5,
    titleEn: 'Hope in the rubble.',
    titleEs: 'Esperanza entre los escombros.',
    bodyEn:
      'Rescue teams detect apparent signs of life in collapsed buildings and keep digging. Official figures reach 287 dead, nearly 4,000 injured and over 25,000 families affected. Cleanup and debris removal begin in Cali and Pereira.',
    bodyEs:
      'Los equipos de rescate detectan aparentes señales de vida en edificios colapsados y siguen excavando. Las cifras oficiales llegan a 287 fallecidos, cerca de 4.000 heridos y más de 25.000 familias afectadas. En Cali y Pereira comienza la remoción de escombros.',
    sourceName: 'AP · UNGRD',
    sourceUrl: 'https://www.expressnews.com/news/world/article/lo-perdimos-todo-que-viene-para-los-miles-de-22388477.php',
    photo: '/quake-6.jpg',
    photoCredit: 'World Central Kitchen, CC BY 4.0',
  },
];
