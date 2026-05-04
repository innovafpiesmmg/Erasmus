import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mobilitiesTable } from "./mobilities";

export const mediaTable = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption"),
  mediaType: text("media_type").notNull().default("image"),
  mobilityId: integer("mobility_id").references(() => mobilitiesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMediaSchema = createInsertSchema(mediaTable).omit({ id: true, createdAt: true });
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof mediaTable.$inferSelect;
