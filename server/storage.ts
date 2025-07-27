import {
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
} from "../shared/schema";
import { pool } from "./db";

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
    totalViews: number;
    totalClicks: number;
    topPages: Array<{ page: string; views: number }>;
    topProjects: Array<{ projectTitle: string; clicks: number }>;
  }>;
}

class PostgreSQLStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || undefined;
    } finally {
      client.release();
    }
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) 
        DO UPDATE SET
          email = $2,
          first_name = $3,
          last_name = $4,
          profile_image_url = $5,
          updated_at = NOW()
        RETURNING *
      `, [user.id, user.email, user.firstName, user.lastName, user.profileImageUrl]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          title,
          simplified_description,
          full_description,
          technologies,
          category,
          image_url,
          project_url,
          github_url,
          sort_order,
          created_at,
          updated_at
        FROM projects 
        ORDER BY sort_order DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        simplifiedDescription: row.simplified_description,
        fullDescription: row.full_description,
        technologies: row.technologies || [],
        category: row.category,
        imageUrl: row.image_url,
        projectUrl: row.project_url,
        githubUrl: row.github_url,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          title,
          simplified_description,
          full_description,
          technologies,
          category,
          image_url,
          project_url,
          github_url,
          sort_order,
          created_at,
          updated_at
        FROM projects 
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        simplifiedDescription: row.simplified_description,
        fullDescription: row.full_description,
        technologies: row.technologies || [],
        category: row.category,
        imageUrl: row.image_url,
        projectUrl: row.project_url,
        githubUrl: row.github_url,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO projects (
          title,
          simplified_description,
          full_description,
          technologies,
          category,
          image_url,
          project_url,
          github_url,
          sort_order,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [
        project.title,
        project.simplifiedDescription,
        project.fullDescription,
        JSON.stringify(project.technologies || []),
        project.category,
        project.imageUrl,
        project.projectUrl,
        project.githubUrl,
        project.sortOrder
      ]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        simplifiedDescription: row.simplified_description,
        fullDescription: row.full_description,
        technologies: row.technologies || [],
        category: row.category,
        imageUrl: row.image_url,
        projectUrl: row.project_url,
        githubUrl: row.github_url,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const client = await pool.connect();
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (project.title !== undefined) {
        setParts.push(`title = $${paramIndex++}`);
        values.push(project.title);
      }
      if (project.simplifiedDescription !== undefined) {
        setParts.push(`simplified_description = $${paramIndex++}`);
        values.push(project.simplifiedDescription);
      }
      if (project.fullDescription !== undefined) {
        setParts.push(`full_description = $${paramIndex++}`);
        values.push(project.fullDescription);
      }
      if (project.technologies !== undefined) {
        setParts.push(`technologies = $${paramIndex++}`);
        values.push(JSON.stringify(project.technologies));
      }
      if (project.category !== undefined) {
        setParts.push(`category = $${paramIndex++}`);
        values.push(project.category);
      }
      if (project.imageUrl !== undefined) {
        setParts.push(`image_url = $${paramIndex++}`);
        values.push(project.imageUrl);
      }
      if (project.projectUrl !== undefined) {
        setParts.push(`project_url = $${paramIndex++}`);
        values.push(project.projectUrl);
      }
      if (project.githubUrl !== undefined) {
        setParts.push(`github_url = $${paramIndex++}`);
        values.push(project.githubUrl);
      }
      if (project.sortOrder !== undefined) {
        setParts.push(`sort_order = $${paramIndex++}`);
        values.push(project.sortOrder);
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(`
        UPDATE projects 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Project with id ${id} not found`);
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        simplifiedDescription: row.simplified_description,
        fullDescription: row.full_description,
        technologies: row.technologies || [],
        category: row.category,
        imageUrl: row.image_url,
        projectUrl: row.project_url,
        githubUrl: row.github_url,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async deleteProject(id: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM projects WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // Project files operations
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          project_id,
          file_name,
          file_url,
          file_type,
          created_at
        FROM project_files 
        WHERE project_id = $1
        ORDER BY created_at ASC
      `, [projectId]);
      
      return result.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        fileName: row.file_name,
        fileUrl: row.file_url,
        fileType: row.file_type,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO project_files (
          project_id,
          file_name,
          file_url,
          file_type,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [file.projectId, file.fileName, file.fileUrl, file.fileType]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        projectId: row.project_id,
        fileName: row.file_name,
        fileUrl: row.file_url,
        fileType: row.file_type,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  }

  async deleteProjectFile(id: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM project_files WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // Site settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          contact_email,
          contact_phone,
          bio,
          linkedin_url,
          updated_at
        FROM site_settings
        WHERE id = 1
      `);
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        bio: row.bio,
        linkedinUrl: row.linkedin_url,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async upsertSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO site_settings (
          id,
          contact_email,
          contact_phone,
          bio,
          linkedin_url,
          updated_at
        ) VALUES (1, $1, $2, $3, $4, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          contact_email = $1,
          contact_phone = $2,
          bio = $3,
          linkedin_url = $4,
          updated_at = NOW()
        RETURNING *
      `, [settings.contactEmail, settings.contactPhone, settings.bio, settings.linkedinUrl]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        bio: row.bio,
        linkedinUrl: row.linkedin_url,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  // Analytics operations
  async recordPageView(pageView: InsertPageView): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO page_views (page, timestamp)
        VALUES ($1, $2)
      `, [pageView.page, pageView.timestamp]);
    } finally {
      client.release();
    }
  }

  async recordProjectClick(projectClick: InsertProjectClick): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO project_clicks (project_id, click_type, timestamp)
        VALUES ($1, $2, $3)
      `, [projectClick.projectId, projectClick.clickType, projectClick.timestamp]);
    } finally {
      client.release();
    }
  }

  async getPageViews(startDate: Date, endDate: Date): Promise<PageView[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, page, user_agent, ip_address, timestamp
        FROM page_views
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC
      `, [startDate, endDate]);
      
      return result.rows.map(row => ({
        id: row.id,
        page: row.page,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        timestamp: row.timestamp
      }));
    } finally {
      client.release();
    }
  }

  async getProjectClicks(startDate: Date, endDate: Date): Promise<(ProjectClick & { projectTitle: string })[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          pc.id,
          pc.project_id,
          pc.click_type,
          pc.user_agent,
          pc.ip_address,
          pc.timestamp,
          p.title as project_title
        FROM project_clicks pc
        JOIN projects p ON pc.project_id = p.id
        WHERE pc.timestamp BETWEEN $1 AND $2
        ORDER BY pc.timestamp DESC
      `, [startDate, endDate]);
      
      return result.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        clickType: row.click_type,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        timestamp: row.timestamp,
        projectTitle: row.project_title
      }));
    } finally {
      client.release();
    }
  }

  async getAnalyticsSummary(startDate: Date, endDate: Date): Promise<{
    totalViews: number;
    totalClicks: number;
    topPages: Array<{ page: string; views: number }>;
    topProjects: Array<{ projectTitle: string; clicks: number }>;
  }> {
    const client = await pool.connect();
    try {
      // Get total views
      const viewsResult = await client.query(`
        SELECT COUNT(*) as total
        FROM page_views
        WHERE timestamp BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      // Get total clicks
      const clicksResult = await client.query(`
        SELECT COUNT(*) as total
        FROM project_clicks
        WHERE timestamp BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      // Get top pages
      const topPagesResult = await client.query(`
        SELECT page, COUNT(*) as views
        FROM page_views
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `, [startDate, endDate]);
      
      // Get top projects
      const topProjectsResult = await client.query(`
        SELECT 
          p.title as project_title,
          COUNT(*) as clicks
        FROM project_clicks pc
        JOIN projects p ON pc.project_id = p.id
        WHERE pc.timestamp BETWEEN $1 AND $2
        GROUP BY p.title
        ORDER BY clicks DESC
        LIMIT 10
      `, [startDate, endDate]);
      
      return {
        totalViews: parseInt(viewsResult.rows[0].total),
        totalClicks: parseInt(clicksResult.rows[0].total),
        topPages: topPagesResult.rows.map(row => ({
          page: row.page,
          views: parseInt(row.views)
        })),
        topProjects: topProjectsResult.rows.map(row => ({
          projectTitle: row.project_title,
          clicks: parseInt(row.clicks)
        }))
      };
    } finally {
      client.release();
    }
  }
}

export const storage = new PostgreSQLStorage();
