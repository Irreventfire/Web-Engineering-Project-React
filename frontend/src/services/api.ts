import axios from 'axios';
import { Inspection, Checklist, ChecklistItem, Result, Statistics, User, UserRole } from '../types';

// Use environment variable or dynamically construct URL based on current host
// This allows the app to work when accessed from other devices on the network
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  `${window.location.protocol}//${window.location.hostname}:8080/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to include user ID in headers.
 * NOTE: This is a simplified demo implementation. In production,
 * use server-side session tokens or JWT for secure authentication.
 * The current approach using localStorage is vulnerable to client-side manipulation.
 */
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    config.headers['X-User-Id'] = user.id;
  }
  return config;
});

// Auth endpoints
export const login = (username: string, password: string) => 
  api.post<User>('/auth/login', { username, password });
export const register = (username: string, password: string, email: string) => 
  api.post<User>('/auth/register', { username, password, email });

// User management endpoints (admin only)
export const getUsers = () => api.get<User[]>('/users');
export const getUser = (id: number) => api.get<User>(`/users/${id}`);
export const createUser = (username: string, name: string, password: string, email: string, role: UserRole) =>
  api.post<User>('/users', { username, name, password, email, role });
export const updateUserRole = (id: number, role: UserRole) => 
  api.put<User>(`/users/${id}/role`, { role });
export const updateUserEnabled = (id: number, enabled: boolean) => 
  api.put<User>(`/users/${id}/enabled`, { enabled });
export const updateUser = (id: number, data: { name?: string; email?: string; username?: string }) => 
  api.put<User>(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// Inspection endpoints
export const getInspections = () => api.get<Inspection[]>('/inspections');
export const getInspection = (id: number) => api.get<Inspection>(`/inspections/${id}`);
export const getInspectionsByStatus = (status: string) => api.get<Inspection[]>(`/inspections/status/${status}`);
export const getStatistics = () => api.get<Statistics>('/inspections/statistics');
export const createInspection = (data: { facilityName: string; inspectionDate: string; responsibleUserId: number; checklistId: number | null }) => 
  api.post<Inspection>('/inspections', data);
export const updateInspection = (id: number, data: { facilityName: string; inspectionDate: string; responsibleUserId: number; checklistId?: number | null }) => 
  api.put<Inspection>(`/inspections/${id}`, data);
export const updateInspectionStatus = (id: number, status: string) => api.put<Inspection>(`/inspections/${id}/status`, { status });
export const deleteInspection = (id: number) => api.delete(`/inspections/${id}`);

// Checklist endpoints
export const getChecklists = () => api.get<Checklist[]>('/checklists');
export const getChecklist = (id: number) => api.get<Checklist>(`/checklists/${id}`);
export const getChecklistItems = (id: number) => api.get<ChecklistItem[]>(`/checklists/${id}/items`);
export const createChecklist = (checklist: Partial<Checklist>) => api.post<Checklist>('/checklists', checklist);
export const addChecklistItem = (checklistId: number, item: Partial<ChecklistItem>) => api.post<ChecklistItem>(`/checklists/${checklistId}/items`, item);
export const updateChecklist = (id: number, checklist: Partial<Checklist>) => api.put<Checklist>(`/checklists/${id}`, checklist);
export const updateChecklistItem = (itemId: number, item: Partial<ChecklistItem>) => api.put<ChecklistItem>(`/checklists/items/${itemId}`, item);
export const deleteChecklist = (id: number) => api.delete(`/checklists/${id}`);
export const deleteChecklistItem = (itemId: number) => api.delete(`/checklists/items/${itemId}`);

// Result endpoints
export const getResultsByInspection = (inspectionId: number) => api.get<Result[]>(`/results/inspection/${inspectionId}`);
export const createResult = (inspectionId: number, result: Partial<Result>) => api.post<Result>(`/results/inspection/${inspectionId}`, result);
export const updateResult = (id: number, result: Partial<Result>) => api.put<Result>(`/results/${id}`, result);
export const deleteResult = (id: number) => api.delete(`/results/${id}`);

// File upload endpoint
export const uploadFile = async (file: File): Promise<{ url: string; filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ url: string; filename: string }>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
