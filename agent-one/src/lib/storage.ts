import { Project, ChatSession, RepositoryType } from '@/types';

// RepositoryType を再エクスポート（他のモジュールからの利用を容易にするため）
export type { RepositoryType };

const STORAGE_KEYS = {
  PROJECTS: 'agent-one-projects',
  CURRENT_PROJECT: 'agent-one-current-project',
  SESSIONS: 'agent-one-sessions',
} as const;

export const storage = {
  getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  saveProjects(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  addProject(project: Project): void {
    const projects = this.getProjects();
    projects.push(project);
    this.saveProjects(projects);
  },

  updateProject(updatedProject: Project): void {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      projects[index] = updatedProject;
      this.saveProjects(projects);
    }
  },

  deleteProject(projectId: string): void {
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    this.saveProjects(projects);
    if (this.getCurrentProjectId() === projectId) {
      this.setCurrentProjectId(null);
    }
    this.deleteSessionsByProject(projectId);
  },

  getCurrentProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
  },

  setCurrentProjectId(projectId: string | null): void {
    if (typeof window === 'undefined') return;
    if (projectId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
    }
  },

  getSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSessions(sessions: ChatSession[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getSessionByProject(projectId: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.projectId === projectId) || null;
  },

  saveSession(session: ChatSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index !== -1) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    this.saveSessions(sessions);
  },

  deleteSessionsByProject(projectId: string): void {
    const sessions = this.getSessions().filter((s) => s.projectId !== projectId);
    this.saveSessions(sessions);
  },

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};
