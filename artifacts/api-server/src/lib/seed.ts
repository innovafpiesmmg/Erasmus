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
    oid: "E10208682",
    webUrl: "https://www.iesmanuelmartingonzalez.es",
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Karatay Mehmet-Hanife Yapici",
    city: "Konya",
    country: "Turquía",
    lat: 37.8746,
    lng: 32.4932,
    isCoordinator: false,
    oid: null,
    webUrl: null,
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Rīgas Valsts 1. ģimnāzija",
    city: "Riga",
    country: "Letonia",
    lat: 56.9496,
    lng: 24.1052,
    isCoordinator: false,
    oid: null,
    webUrl: null,
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Colegiul Tehnic Mihai Viteazul",
    city: "Ploiești",
    country: "Rumanía",
    lat: 44.9365,
    lng: 26.0367,
    isCoordinator: false,
    oid: null,
    webUrl: null,
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "Agrupamento de Escolas de Penacova",
    city: "Penacova",
    country: "Portugal",
    lat: 40.2769,
    lng: -8.2786,
    isCoordinator: false,
    oid: null,
    webUrl: null,
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
  {
    name: "SOU Braќa Miladinovci",
    city: "Skopie",
    country: "Macedonia",
    lat: 41.9973,
    lng: 21.428,
    isCoordinator: false,
    oid: null,
    webUrl: null,
    logoUrl: null,
    socialInstagram: null,
    socialTwitter: null,
  },
];

const INITIAL_SETTINGS: Omit<InsertSettings, "updatedAt"> = {
  siteTitle: "IES Manuel Martín González",
  projectName: "The small big changes",
  projectDescription:
    "Proyecto Erasmus+ KA229 sobre medioambiente y sostenibilidad entre 6 centros educativos europeos.",
  heroTitle: "Pequeños cambios, grandes transformaciones",
  heroSubtitle:
    "Proyecto Erasmus+ SEA · IES Manuel Martín González · Guía de Isora, Tenerife",
  email: "erasmus@iesmmg.es",
  phone: null,
  address: "Calle Ernesto Olive, s/n, 38680 Guía de Isora, S/C de Tenerife",
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
      "Movilidad en España: investigación sobre el uso sostenible del plástico y alternativas ecológicas.",
  },
  {
    partnerIdx: 5,
    workPackage: "WP3",
    theme: "Biodiversidad y Ecosistemas",
    startDate: "2025-03-10",
    endDate: "2025-03-14",
    description:
      "Primera movilidad de alumnos en Macedonia: biodiversidad y ecosistemas locales.",
  },
  {
    partnerIdx: 2,
    workPackage: "WP4",
    theme: "Energías Renovables",
    startDate: "2025-06-02",
    endDate: "2025-06-06",
    description: "Taller sobre energías renovables en Riga.",
  },
  {
    partnerIdx: 3,
    workPackage: "WP5",
    theme: "Economía Circular",
    startDate: "2025-10-13",
    endDate: "2025-10-17",
    description: "Visita de estudio sobre economía circular en Ploiești.",
  },
  {
    partnerIdx: 4,
    workPackage: "WP6",
    theme: "Cambio Climático",
    startDate: "2026-02-09",
    endDate: "2026-02-13",
    description: "Seminario sobre cambio climático en Portugal.",
  },
  {
    partnerIdx: 1,
    workPackage: "WP7",
    theme: "Cierre y Difusión",
    startDate: "2026-05-04",
    endDate: "2026-05-08",
    description: "Reunión final y difusión de resultados en Konya.",
  },
];

const ACTIVITIES: InsertActivity[] = [
  {
    title: "Reunión de coordinación inicial",
    description:
      "Primer encuentro entre los coordinadores de los 6 países para planificar el proyecto.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Taller de biodiversidad",
    description: "Los alumnos exploran y catalogan la flora y fauna local.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Visita a instalaciones de energía solar",
    description:
      "Excursión a un parque fotovoltaico para comprender la generación de energía limpia.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Debate sobre economía circular",
    description:
      "Charla-debate con expertos sobre el modelo de economía circular en Europa.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Plantación de árboles",
    description:
      "Acción de reforestación con participación de alumnos de los 6 países.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Exposición final de proyectos",
    description:
      "Los estudiantes presentan sus proyectos medioambientales a la comunidad.",
    imageUrl: null,
    mobilityId: null,
  },
  {
    title: "Creación del sitio web del proyecto",
    description: "Diseño y publicación de la plataforma web Erasmus+ SEA.",
    imageUrl: null,
    mobilityId: null,
  },
];

const MEDIA: InsertMedia[] = [
  {
    url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop",
    caption: "Foto del grupo durante la reunión de lanzamiento.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    caption: "Alumnos en actividad de campo sobre biodiversidad.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop",
    caption: "Visita a instalaciones de energía renovable.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    caption: "Encuentro internacional en Penacova, Portugal.",
    mediaType: "image",
    mobilityId: null,
  },
  {
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop",
    caption: "Presentación final de proyectos de los alumnos.",
    mediaType: "image",
    mobilityId: null,
  },
];

export async function seedIfEmpty(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(partnersTable);

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
        i < insertedMobilities.length ? insertedMobilities[i].id : null,
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
