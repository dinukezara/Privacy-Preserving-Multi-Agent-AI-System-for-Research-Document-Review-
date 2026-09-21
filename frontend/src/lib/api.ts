const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type PaperStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected";

export interface Paper {
  _id: string;
  title: string;
  authors: string[];
  abstract: string;
  status: PaperStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaperInput {
  title: string;
  authors?: string[];
  abstract?: string;
  status?: PaperStatus;
}

export interface ReviewInput {
  title: string;
  authors?: string[];
  abstract?: string;
  full_text: string;
  tier: string;
  document_type?: "paper" | "thesis" | "presentation";
}

export interface ReviewResult {
  _id: string;
  title: string;
  paper_id: string;
  critiques: Array<{
    agent_name: string;
    status: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    score?: number;
  }>;
  consolidated_summary: string;
  weighted_score: number;
  recommendation: string;
  tier: string;
}

export interface ReviewSummary {
  _id: string;
  title: string;
  tier: string;
  weightedScore: number;
  recommendation: string;
  createdAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  institution: string;
  role: string;
  website: string;
  bio: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("scholarlens-token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options?.headers },
    cache: "no-store",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const getPapers = () => request<Paper[]>("/api/papers");

export const createPaper = (paper: PaperInput) =>
  request<Paper>("/api/papers", {
    method: "POST",
    body: JSON.stringify(paper),
  });

export const updatePaper = (id: string, paper: Partial<PaperInput>) =>
  request<Paper>(`/api/papers/${id}`, {
    method: "PUT",
    body: JSON.stringify(paper),
  });

export const deletePaper = (id: string) =>
  request<{ message: string }>(`/api/papers/${id}`, { method: "DELETE" });

export const runReview = (review: ReviewInput) =>
  request<ReviewResult>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(review),
  });

export const getReview = (id: string) =>
  request<ReviewResult>(`/api/reviews/${id}`);

export const getMyReviews = () => request<ReviewSummary[]>("/api/reviews");

export const signUp = (input: { name: string; email: string; institution: string; password: string }) =>
  request<AuthResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify(input) });

export const signIn = (input: { email: string; password: string }) =>
  request<AuthResponse>("/api/auth/signin", { method: "POST", body: JSON.stringify(input) });

export const getCurrentUser = () => request<UserProfile>("/api/auth/me");

export const updateProfile = (input: Partial<Pick<UserProfile, "name" | "institution" | "role" | "website" | "bio">>) =>
  request<UserProfile>("/api/auth/me", { method: "PUT", body: JSON.stringify(input) });