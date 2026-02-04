const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb`;

interface MongoResponse<T = unknown> {
  data?: T;
  error?: string;
}

interface MongoOperation {
  collection: string;
  operation: 'find' | 'findOne' | 'insertOne' | 'insertMany' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany' | 'aggregate';
  filter?: Record<string, unknown>;
  document?: Record<string, unknown>;
  documents?: Record<string, unknown>[];
  update?: Record<string, unknown>;
  pipeline?: Record<string, unknown>[];
  options?: Record<string, unknown>;
}

export async function mongoQuery<T = unknown>(
  operation: MongoOperation,
  token: string
): Promise<T> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(operation),
  });

  const result: MongoResponse<T> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'MongoDB operation failed');
  }

  return result.data as T;
}

// Type-safe collection helpers
export const collections = {
  projects: 'projects',
  dailyLogs: 'daily_logs',
  tasks: 'tasks',
  notes: 'notes',
  apiRequests: 'api_requests',
  snippets: 'snippets',
} as const;

export type CollectionName = typeof collections[keyof typeof collections];

// Document types
export interface Project {
  _id?: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  techStack: string[];
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  _id?: string;
  userId: string;
  projectId?: string;
  date: string;
  workCompleted: string;
  blockers: string;
  nextSteps: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id?: string;
  userId: string;
  projectId?: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id?: string;
  userId: string;
  projectId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiRequest {
  _id?: string;
  userId: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snippet {
  _id?: string;
  userId: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
