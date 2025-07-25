import {
  users,
  projects,
  projectFiles,
  siteSettings,
  pageViews,
  projectClicks,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectFile,
  type InsertProjectFile,
  type SiteSettings,
  type InsertSiteSettings,
  type PageView,
  type InsertPageView,
  type ProjectClick,
  type InsertProjectClick,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Project files
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  deleteProjectFile(id: number): Promise<void>;
  
  // Site settings
  getSiteSettings(): Promise<SiteSettings | undefined>;
  upsertSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  
  // Analytics
  recordPageView(pageView: InsertPageView): Promise<void>;
  recordProjectClick(projectClick: InsertProjectClick): Promise<void>;
  getPageViews(startDate: Date, endDate: Date): Promise<PageView[]>;
  getProjectClicks(startDate: Date, endDate: Date): Promise<(ProjectClick & { projectTitle: string })[]>;
  getAnalyticsSummary(startDate: Date, endDate: Date): Promise<{
    totalPageViews: number;
    totalProjectClicks: number;
    topProjects: { projectId: number; projectTitle: string; clicks: number }[];
    dailyStats: { date: string; pageViews: number; projectClicks: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(projects.sortOrder);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project files
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));
  }

  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db
      .insert(projectFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async deleteProjectFile(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }

  // Site settings
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db
      .select()
      .from(siteSettings)
      .orderBy(desc(siteSettings.updatedAt))
      .limit(1);
    return settings;
  }

  async upsertSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newSettings] = await db
        .insert(siteSettings)
        .values(settings)
        .returning();
      return newSettings;
    }
  }

  // Analytics methods
  async recordPageView(pageView: InsertPageView): Promise<void> {
    await db.insert(pageViews).values(pageView);
  }

  async recordProjectClick(projectClick: InsertProjectClick): Promise<void> {
    await db.insert(projectClicks).values(projectClick);
  }

  async getPageViews(startDate: Date, endDate: Date): Promise<PageView[]> {
    return await db
      .select()
      .from(pageViews)
      .where(
        and(
          gte(pageViews.timestamp, startDate),
          lte(pageViews.timestamp, endDate)
        )
      )
      .orderBy(desc(pageViews.timestamp));
  }

  async getProjectClicks(startDate: Date, endDate: Date): Promise<(ProjectClick & { projectTitle: string })[]> {
    return await db
      .select({
        id: projectClicks.id,
        projectId: projectClicks.projectId,
        clickType: projectClicks.clickType,
        userAgent: projectClicks.userAgent,
        ipAddress: projectClicks.ipAddress,
        timestamp: projectClicks.timestamp,
        projectTitle: projects.title,
      })
      .from(projectClicks)
      .innerJoin(projects, eq(projectClicks.projectId, projects.id))
      .where(
        and(
          gte(projectClicks.timestamp, startDate),
          lte(projectClicks.timestamp, endDate)
        )
      )
      .orderBy(desc(projectClicks.timestamp));
  }

  async getAnalyticsSummary(startDate: Date, endDate: Date): Promise<{
    totalPageViews: number;
    totalProjectClicks: number;
    topProjects: { projectId: number; projectTitle: string; clicks: number }[];
    dailyStats: { date: string; pageViews: number; projectClicks: number }[];
  }> {
    // Get total page views
    const pageViewsResult = await db
      .select({ count: count() })
      .from(pageViews)
      .where(
        and(
          gte(pageViews.timestamp, startDate),
          lte(pageViews.timestamp, endDate)
        )
      );

    // Get total project clicks
    const projectClicksResult = await db
      .select({ count: count() })
      .from(projectClicks)
      .where(
        and(
          gte(projectClicks.timestamp, startDate),
          lte(projectClicks.timestamp, endDate)
        )
      );

    // Get top projects by clicks
    const topProjectsResult = await db
      .select({
        projectId: projectClicks.projectId,
        projectTitle: projects.title,
        clicks: count(),
      })
      .from(projectClicks)
      .innerJoin(projects, eq(projectClicks.projectId, projects.id))
      .where(
        and(
          gte(projectClicks.timestamp, startDate),
          lte(projectClicks.timestamp, endDate)
        )
      )
      .groupBy(projectClicks.projectId, projects.title)
      .orderBy(desc(count()))
      .limit(10);

    // Get daily stats
    const dailyPageViews = await db
      .select({
        date: sql`DATE(${pageViews.timestamp})::text`,
        count: count(),
      })
      .from(pageViews)
      .where(
        and(
          gte(pageViews.timestamp, startDate),
          lte(pageViews.timestamp, endDate)
        )
      )
      .groupBy(sql`DATE(${pageViews.timestamp})`)
      .orderBy(sql`DATE(${pageViews.timestamp})`);

    const dailyProjectClicks = await db
      .select({
        date: sql`DATE(${projectClicks.timestamp})::text`,
        count: count(),
      })
      .from(projectClicks)
      .where(
        and(
          gte(projectClicks.timestamp, startDate),
          lte(projectClicks.timestamp, endDate)
        )
      )
      .groupBy(sql`DATE(${projectClicks.timestamp})`)
      .orderBy(sql`DATE(${projectClicks.timestamp})`);

    // Combine daily stats
    const dailyStatsMap = new Map<string, { pageViews: number; projectClicks: number }>();
    
    dailyPageViews.forEach(({ date, count }) => {
      dailyStatsMap.set(String(date), { pageViews: Number(count), projectClicks: 0 });
    });
    
    dailyProjectClicks.forEach(({ date, count }) => {
      const dateStr = String(date);
      const existing = dailyStatsMap.get(dateStr) || { pageViews: 0, projectClicks: 0 };
      dailyStatsMap.set(dateStr, { ...existing, projectClicks: Number(count) });
    });

    const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, stats]) => ({
      date,
      pageViews: stats.pageViews,
      projectClicks: stats.projectClicks,
    }));

    return {
      totalPageViews: Number(pageViewsResult[0]?.count || 0),
      totalProjectClicks: Number(projectClicksResult[0]?.count || 0),
      topProjects: topProjectsResult.map(p => ({
        projectId: p.projectId,
        projectTitle: p.projectTitle,
        clicks: Number(p.clicks),
      })),
      dailyStats,
    };
  }
}

export const storage = new DatabaseStorage();
