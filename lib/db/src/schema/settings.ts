import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  siteTitle: text("site_title").notNull().default("IES Manuel Martín González"),
  projectName: text("project_name").notNull().default("The small big changes"),
  projectDescription: text("project_description").notNull().default("Proyecto Erasmus+ SEA"),
  heroTitle: text("hero_title").notNull().default("Erasmus+ en IES Manuel Martín González"),
  heroSubtitle: text("hero_subtitle").notNull().default("Conectando Europa a través de la educación y la sostenibilidad"),
  email: text("email").notNull().default("info@iesmanuelmartingonzalez.es"),
  phone: text("phone"),
  address: text("address"),
  socialInstagram: text("social_instagram"),
  socialTwitter: text("social_twitter"),
  socialFacebook: text("social_facebook"),
  projectStartYear: text("project_start_year").notNull().default("2025"),
  projectEndYear: text("project_end_year").notNull().default("2027"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
