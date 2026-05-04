import { db, partnersTable, mobilitiesTable, activitiesTable, mediaTable, settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger.js";

const PARTNERS = [
  { name: "IES Manuel Martín González", city: "Guía de Isora", country: "España", lat: 28.1235, lng: -16.7749, isCoordinator: true, logoUrl: null, description: "Centro coordinador del proyecto Erasmus+ SEA en Tenerife, España." },
  { name: "Gazi Üniversitesi Mesleki", city: "Ankara", country: "Turquía", lat: 39.9208, lng: 32.8541, isCoordinator: false, logoUrl: null, description: "Instituto vocacional de Ankara, Turquía." },
  { name: "Rīgas Valsts 1. ģimnāzija", city: "Riga", country: "Letonia", lat: 56.9496, lng: 24.1052, isCoordinator: false, logoUrl: null, description: "Gimnasio estatal en Riga, Letonia." },
  { name: "Colegiul Tehnic Mihai Viteazul", city: "Ploiești", country: "Rumanía", lat: 44.9365, lng: 26.0367, isCoordinator: false, logoUrl: null, description: "Colegio técnico en Ploiești, Rumanía." },
  { name: "Agrupamento de Escolas de Penacova", city: "Penacova", country: "Portugal", lat: 40.2769, lng: -8.2786, isCoordinator: false, logoUrl: null, description: "Escuelas públicas en Penacova, Portugal." },
  { name: "SOU Braќa Miladinovci", city: "Skopie", country: "Macedonia", lat: 41.9973, lng: 21.4280, isCoordinator: false, logoUrl: null, description: "Centro de educación secundaria en Skopie, Macedonia del Norte." },
];

const MOBILITIES = [
  { partnerIdx: 0, workPackage: "WP2", theme: "Lanzamiento del Proyecto", startDate: "2024-11-01", endDate: "2024-11-05", description: "Reunión de lanzamiento del proyecto SEA en Guía de Isora, España.", headerImageUrl: null },
  { partnerIdx: 5, workPackage: "WP3", theme: "Biodiversidad y Ecosistemas", startDate: "2025-03-10", endDate: "2025-03-14", description: "Primera movilidad de alumnos en Macedonia: biodiversidad.", headerImageUrl: null },
  { partnerIdx: 2, workPackage: "WP4", theme: "Energías Renovables", startDate: "2025-06-02", endDate: "2025-06-06", description: "Taller sobre energías renovables en Riga.", headerImageUrl: null },
  { partnerIdx: 3, workPackage: "WP5", theme: "Economía Circular", startDate: "2025-10-13", endDate: "2025-10-17", description: "Visita de estudio sobre economía circular en Ploiești.", headerImageUrl: null },
  { partnerIdx: 4, workPackage: "WP6", theme: "Cambio Climático", startDate: "2026-02-09", endDate: "2026-02-13", description: "Seminario sobre cambio climático en Portugal.", headerImageUrl: null },
  { partnerIdx: 1, workPackage: "WP7", theme: "Cierre y Difusión", startDate: "2026-05-04", endDate: "2026-05-08", description: "Reunión final y difusión de resultados en Ankara.", headerImageUrl: null },
];

const ACTIVITIES = [
  { title: "Reunión de coordinación inicial", description: "Primer encuentro entre los coordinadores de los 6 países para planificar el proyecto.", imageUrl: null },
  { title: "Taller de biodiversidad", description: "Los alumnos exploran y catalogan la flora y fauna local.", imageUrl: null },
  { title: "Visita a instalaciones de energía solar", description: "Excursión a un parque fotovoltaico para comprender la generación de energía limpia.", imageUrl: null },
  { title: "Debate sobre economía circular", description: "Charla-debate con expertos sobre el modelo de economía circular en Europa.", imageUrl: null },
  { title: "Plantación de árboles", description: "Acción de reforestación con participación de alumnos de los 6 países.", imageUrl: null },
  { title: "Exposición final de proyectos", description: "Los estudiantes presentan sus proyectos medioambientales a la comunidad.", imageUrl: null },
  { title: "Creación del sitio web del proyecto", description: "Diseño y publicación de la plataforma web Erasmus+ SEA.", imageUrl: null },
];

const MEDIA = [
  { title: "Foto de equipo - Kick-off Meeting", url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop", type: "image" as const, description: "Foto del grupo durante la reunión de lanzamiento." },
  { title: "Actividad exterior - Biodiversidad", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop", type: "image" as const, description: "Alumnos en actividad de campo sobre biodiversidad." },
  { title: "Taller de energía solar", url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop", type: "image" as const, description: "Visita a instalaciones de energía renovable." },
  { title: "Reunión de socios - Portugal", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop", type: "image" as const, description: "Encuentro internacional en Penacova, Portugal." },
  { title: "Exposición de proyectos", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop", type: "image" as const, description: "Presentación final de proyectos de los alumnos." },
];

export async function seedIfEmpty(): Promise<void> {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(partnersTable);

    if (count > 0) {
      logger.info({ count }, "Database already seeded, skipping");
      return;
    }

    logger.info("Seeding database with initial data...");

    // Settings
    await db.insert(settingsTable).values({
      siteTitle: "IES Manuel Martín González",
      projectName: "The small big changes",
      projectDescription: "Proyecto Erasmus+ KA229 sobre medioambiente y sostenibilidad entre 6 centros educativos europeos.",
      heroTitle: "Pequeños cambios, grandes transformaciones",
      heroSubtitle: "Proyecto Erasmus+ SEA · IES Manuel Martín González · Guía de Isora, Tenerife",
      contactEmail: "erasmus@iesmmg.es",
      footerText: "© 2024–2027 IES Manuel Martín González · Proyecto Erasmus+ SEA",
    }).onConflictDoNothing();

    // Partners
    const insertedPartners = await db.insert(partnersTable).values(PARTNERS).returning();
    logger.info({ count: insertedPartners.length }, "Seeded partners");

    // Mobilities (linked to inserted partner IDs)
    const mobilityValues = MOBILITIES.map((m) => ({
      partnerId: insertedPartners[m.partnerIdx].id,
      workPackage: m.workPackage,
      theme: m.theme,
      startDate: m.startDate,
      endDate: m.endDate,
      description: m.description,
      headerImageUrl: m.headerImageUrl,
    }));
    const insertedMobilities = await db.insert(mobilitiesTable).values(mobilityValues).returning();
    logger.info({ count: insertedMobilities.length }, "Seeded mobilities");

    // Activities (first 3 linked to mobilities, rest unlinked)
    const activityValues = ACTIVITIES.map((a, i) => ({
      title: a.title,
      description: a.description,
      imageUrl: a.imageUrl,
      mobilityId: i < insertedMobilities.length ? insertedMobilities[i].id : null,
    }));
    const insertedActivities = await db.insert(activitiesTable).values(activityValues).returning();
    logger.info({ count: insertedActivities.length }, "Seeded activities");

    // Media
    const insertedMedia = await db.insert(mediaTable).values(MEDIA).returning();
    logger.info({ count: insertedMedia.length }, "Seeded media");

    logger.info("Database seeding complete");
  } catch (err) {
    logger.error({ err }, "Failed to seed database");
  }
}
