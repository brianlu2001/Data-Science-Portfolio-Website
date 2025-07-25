import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table for portfolio items
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  simplifiedDescription: text("simplified_description").notNull(),
  fullDescription: text("full_description").notNull(),
  technologies: text("technologies").array().notNull().default([]),
  category: varchar("category", { length: 100 }),
  imageUrl: varchar("image_url"),
  projectUrl: varchar("project_url"),
  githubUrl: varchar("github_url"),
  sortOrder: serial("sort_order"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site settings table
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  linkedinUrl: varchar("linkedin_url"),
  bio: text("bio"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  files: many(projectFiles),
}));

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
}));

// Analytics tables
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 255 }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const projectClicks = pgTable("project_clicks", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id).notNull(),
  clickType: varchar("click_type", { length: 50 }).notNull(), // 'view', 'report', 'github'
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const projectClicksRelations = relations(projectClicks, ({ one }) => ({
  project: one(projects, {
    fields: [projectClicks.projectId],
    references: [projects.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

// Zod schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  projectUrl: z.string().optional(),
});

export const updateProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertProjectData = z.infer<typeof insertProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type InsertSiteSettingsData = z.infer<typeof insertSiteSettingsSchema>;

// Analytics types
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
export type ProjectClick = typeof projectClicks.$inferSelect;
export type InsertProjectClick = typeof projectClicks.$inferInsert;
