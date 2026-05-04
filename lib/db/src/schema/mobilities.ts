import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { partnersTable } from "./partners";

export const mobilitiesTable = pgTable("mobilities", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partnersTable.id, { onDelete: "cascade" }),
  workPackage: text("work_package").notNull(),
  theme: text("theme").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  headerImageUrl: text("header_image_url"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMobilitySchema = createInsertSchema(mobilitiesTable).omit({ id: true, createdAt: true });
export type InsertMobility = z.infer<typeof insertMobilitySchema>;
export type Mobility = typeof mobilitiesTable.$inferSelect;
