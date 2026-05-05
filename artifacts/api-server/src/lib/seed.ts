import {
  db,
  partnersTable,
  mobilitiesTable,
  activitiesTable,
  mediaTable,
  settingsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import type {
  InsertPartner,
  InsertMobility,
  InsertActivity,
  InsertMedia,
  InsertSettings,
} from "@workspace/db";
import { logger } from "./logger.js";

const PARTNERS: InsertPartner[] = [
  {
    name: "IES Manuel Martín González",
    city: "Guía de Isora",
    country: "España",
    lat: 28.1559,
    lng: -16.7708,
    isCoordinator: true,
    oid: "E10107444",
    webUrl: "https://www.iesmanuelmartingonzalez.es",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Karatay Mehmet-Hanife Yapici Anadolu Lisesi",
    city: "Karatay, Konya",
    country: "Turquía",
    lat: 37.8746,
    lng: 32.4932,
    isCoordinator: false,
    oid: "E10089272",
    webUrl: "http://yapicianadolulisesi.meb.k12.tr",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Valmiera State Gymnasium",
    city: "Valmiera",
    country: "Letonia",
    lat: 57.5415,
    lng: 25.4263,
    isCoordinator: false,
    oid: "E10013059",
    webUrl: "https://vvg.lv",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Liceul Teoretic «Traian Vuia» Faget",
    city: "Faget",
    country: "Rumanía",
    lat: 45.8553,
    lng: 22.1882,
    isCoordinator: false,
    oid: "E10119734",
    webUrl: "https://www.liceulfaget.ro",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Escola Secundária de Emídio Navarro",
    city: "Viseu",
    country: "Portugal",
    lat: 40.6566,
    lng: -7.9122,
    isCoordinator: false,
    oid: "E10082426",
    webUrl: "https://www.esenviseu.net",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "«Sv. Kliment Ohridski» High School",
    city: "Ohrid",
    country: "Macedonia",
    lat: 41.1171,
    lng: 20.8016,
    isCoordinator: false,
    oid: "E10079266",
    webUrl: "http://gimnazijaohrid.edu.mk",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
];

const INITIAL_SETTINGS: Omit<InsertSettings, "updatedAt"> = {
  siteTitle: "IES Manuel Martín González",
  projectName: "The small big changes",
  projectDescription:
    "Proyecto Erasmus+ KA220-SCH sobre concienciación social y medioambiental entre 6 centros educativos europeos. «Los pequeños grandes cambios. Concienciación social y ambiental.»",
  heroTitle: "Pequeños cambios, grandes transformaciones",
  heroSubtitle:
    "Proyecto Erasmus+ SEA · IES Manuel Martín González · Guía de Isora, Tenerife",
  email: "erasmus@iesmmg.es",
  phone: null,
  address: "Guía de Isora, S/C de Tenerife, España",
  socialInstagram: null,
  socialTwitter: null,
  socialFacebook: null,
};

type MobilitySpec = {
  partnerIdx: number;
  workPackage: string;
  theme: string;
  startDate: string;
  endDate: string;
  description: string;
};

const MOBILITY_SPECS: MobilitySpec[] = [
  {
    partnerIdx: 0,
    workPackage: "WP2",
    theme: "Uso del Plástico",
    startDate: "2025-11-10",
    endDate: "2025-11-14",
    description:
      "Primera movilidad física en Tenerife, España. El alumnado investiga el impacto del plástico en el medioambiente, realiza una limpieza de litoral, visita una planta de reciclaje y trabaja con impresión 3D para reutilizar materiales.",
  },
  {
    partnerIdx: 1,
    workPackage: "WP3",
    theme: "Teléfono y Tecnología",
    startDate: "2026-03-09",
    endDate: "2026-03-13",
    description:
      "Movilidad en Konya, Turquía. Los participantes reflexionan sobre el impacto medioambiental del consumo tecnológico, visitan el Centro Científico de Konya, el Valle de las Mariposas y talleres de reciclaje informático.",
  },
  {
    partnerIdx: 2,
    workPackage: "WP4",
    theme: "Agua y Madera",
    startDate: "2026-05-18",
    endDate: "2026-05-22",
    description:
      "Movilidad en Valmiera, Letonia. El alumnado explora el uso sostenible del agua y la madera, visita bosques urbanos, conoce la rivera del Gauja y aprende sobre la certificación FSC y la gestión forestal sostenible.",
  },
  {
    partnerIdx: 3,
    workPackage: "WP5",
    theme: "Fast Fashion",
    startDate: "2026-11-16",
    endDate: "2026-11-20",
    description:
      "Movilidad en Faget, Rumanía. Se trabaja el impacto de la moda rápida y el consumo excesivo de ropa. El alumnado participa en talleres de reciclaje textil, visita una industria textil y crea sus propias prendas reutilizadas.",
  },
  {
    partnerIdx: 4,
    workPackage: "WP6",
    theme: "Energía y Medio Ambiente",
    startDate: "2027-02-22",
    endDate: "2027-02-26",
    description:
      "Movilidad en Viseu, Portugal. Taller en la Universidad Politécnica de Viseu sobre tipos de energía y sus implicaciones ambientales. Visita a instalaciones de energía renovable: presa de Aguieira, central de biomasa y parque eólico.",
  },
  {
    partnerIdx: 5,
    workPackage: "WP7",
    theme: "Dieta, Salud y Medioambiente",
    startDate: "2027-05-24",
    endDate: "2027-05-28",
    description:
      "Movilidad final en Ohrid, Macedonia. El alumnado descubre el impacto de los hábitos alimentarios en la salud y el medioambiente, elabora recetas saludables y listas de alimentos de kilómetro cero, y prepara campañas de concienciación.",
  },
];

const ACTIVITIES: InsertActivity[] = [
  {
    title: "Limpieza de litoral en Tenerife",
    description:
      "El alumnado europeo realiza una acción medioambiental en la costa de Tenerife: recoge plásticos del litoral, los clasifica por tipo y reflexiona sobre el impacto de los residuos plásticos en los ecosistemas marinos.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Workshop: Las islas de plástico y los microplásticos",
    description:
      "Taller en el que el alumnado estudia el problema de los microplásticos en el océano, su impacto en la fauna marina y en la salud humana, y elabora material publicitario para concienciar a su comunidad.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Impresión 3D con plástico reciclado",
    description:
      "Usando el FABLAB del IES MMG, el alumnado transforma plástico recogido en la limpieza litoral en filamento para impresoras 3D y fabrica objetos de servicio: macetas, llaveros y colgantes.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Taller: ¿Qué necesito para fabricar mi móvil?",
    description:
      "En Konya, Turquía, el alumnado investiga los materiales necesarios para fabricar un smartphone, los impactos ambientales de su extracción y producción, y los problemas del reciclaje de residuos electrónicos.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Visita al Valle de las Mariposas",
    description:
      "Excursión al mayor jardín de mariposas de Europa en Konya. El alumnado comprende la importancia de conservar la biodiversidad y los ecosistemas sensibles frente al cambio climático.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Visita: La vida de un bosque en Letonia",
    description:
      "En Valmiera, el alumnado explora un bosque letón, aprende sobre el uso sostenible de la madera y la certificación FSC, y reflexiona sobre la fragilidad de los ecosistemas forestales.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Taller Maderable: creación de llaveros y colgantes",
    description:
      "Taller de creatividad y emprendeduría en el que los participantes reutilizan restos vegetales para crear productos artesanales, fomentando el consumo responsable y la economía circular.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "«Efectos del Fast Fashion» en Rumanía",
    description:
      "En Faget, el alumnado debate sobre las consecuencias personales, sociales y medioambientales del consumo excesivo de ropa e inicia el proceso de creación de un plan de acción para sus centros.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Taller de reciclaje de ropa",
    description:
      "Los participantes aprenden técnicas de upcycling textil y transforman prendas en desuso en nuevas creaciones. La actividad fomenta la creatividad, la empleabilidad y la conciencia sobre el fast fashion.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Taller en la Universidad Politécnica de Viseu",
    description:
      "Conferencia universitaria sobre tipos de energía y sus implicaciones ambientales. El alumnado diferencia entre fuentes renovables y no renovables y comprende la relación entre consumo energético y cambio climático.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Visita al parque eólico y central de biomasa",
    description:
      "En Portugal, el alumnado visita instalaciones de energía renovable: una presa hidroeléctrica, una central de biomasa que gestiona residuos forestales, y un parque eólico.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Workshop: Alimentación e impacto medioambiental",
    description:
      "En Ohrid, Macedonia, el alumnado investiga el impacto de los hábitos alimentarios en la salud y el planeta, elabora listas de alimentos de kilómetro cero y un recetario de cocina saludable y sostenible.",
    imageUrl: null,
    mobilityId: null,
  },
];

const MEDIA: InsertMedia[] = [
  {
    url: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&auto=format&fit=crop",
    caption: "Limpieza de litoral: alumnos recogiendo plásticos en la costa de Tenerife.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    caption: "Taller de reciclaje de plástico con impresión 3D en el FABLAB del IES MMG.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop",
    caption: "Actividad medioambiental con alumnado de los 6 países participantes.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop",
    caption: "Presentación de proyectos de alumnado Erasmus+ durante la semana de movilidad.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop",
    caption: "Visita a instalaciones de energía renovable durante la movilidad en Portugal.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    caption: "Alumnado en actividad de campo en los bosques de Letonia.",
    mediaType: "image",
    mobilityId: null,
  },
];

export async function seedIfEmpty(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(settingsTable);

    if (count > 0) {
      logger.info({ count }, "Database already seeded, skipping");
      return;
    }

    logger.info("Seeding database with initial data…");

    await db.insert(settingsTable).values(INITIAL_SETTINGS).onConflictDoNothing();

    const insertedPartners = await db
      .insert(partnersTable)
      .values(PARTNERS)
      .returning();
    logger.info({ count: insertedPartners.length }, "Seeded partners");

    const mobilityRows: InsertMobility[] = MOBILITY_SPECS.map((spec) => ({
      partnerId: insertedPartners[spec.partnerIdx].id,
      workPackage: spec.workPackage,
      theme: spec.theme,
      startDate: spec.startDate,
      endDate: spec.endDate,
      description: spec.description,
      headerImageUrl: null,
    }));
    const insertedMobilities = await db
      .insert(mobilitiesTable)
      .values(mobilityRows)
      .returning();
    logger.info({ count: insertedMobilities.length }, "Seeded mobilities");

    const activityRows: InsertActivity[] = ACTIVITIES.map((a, i) => ({
      ...a,
      mobilityId:
        i < insertedMobilities.length ? insertedMobilities[Math.floor(i / 2)].id : null,
    }));
    const insertedActivities = await db
      .insert(activitiesTable)
      .values(activityRows)
      .returning();
    logger.info({ count: insertedActivities.length }, "Seeded activities");

    const insertedMedia = await db
      .insert(mediaTable)
      .values(MEDIA)
      .returning();
    logger.info({ count: insertedMedia.length }, "Seeded media");

    logger.info("Database seeding complete");
  } catch (err) {
    logger.error({ err }, "Failed to seed database");
  }
}
