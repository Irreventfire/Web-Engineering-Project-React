import axios from 'axios';
import { Inspection, Checklist, ChecklistItem, Result, Statistics, User, UserRole } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include user ID in requests
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
export const updateUserRole = (id: number, role: UserRole) => 
  api.put<User>(`/users/${id}/role`, { role });
export const updateUserEnabled = (id: number, enabled: boolean) => 
  api.put<User>(`/users/${id}/enabled`, { enabled });
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// Inspection endpoints
export const getInspections = () => api.get<Inspection[]>('/inspections');
export const getInspection = (id: number) => api.get<Inspection>(`/inspections/${id}`);
export const getInspectionsByStatus = (status: string) => api.get<Inspection[]>(`/inspections/status/${status}`);
export const getStatistics = () => api.get<Statistics>('/inspections/statistics');
export const createInspection = (inspection: Partial<Inspection>) => api.post<Inspection>('/inspections', inspection);
export const updateInspection = (id: number, inspection: Partial<Inspection>) => api.put<Inspection>(`/inspections/${id}`, inspection);
export const updateInspectionStatus = (id: number, status: string) => api.put<Inspection>(`/inspections/${id}/status`, { status });
export const deleteInspection = (id: number) => api.delete(`/inspections/${id}`);

// Checklist endpoints
export const getChecklists = () => api.get<Checklist[]>('/checklists');
export const getChecklist = (id: number) => api.get<Checklist>(`/checklists/${id}`);
export const getChecklistItems = (id: number) => api.get<ChecklistItem[]>(`/checklists/${id}/items`);
export const createChecklist = (checklist: Partial<Checklist>) => api.post<Checklist>('/checklists', checklist);
export const addChecklistItem = (checklistId: number, item: Partial<ChecklistItem>) => api.post<ChecklistItem>(`/checklists/${checklistId}/items`, item);
export const updateChecklist = (id: number, checklist: Partial<Checklist>) => api.put<Checklist>(`/checklists/${id}`, checklist);
export const deleteChecklist = (id: number) => api.delete(`/checklists/${id}`);
export const deleteChecklistItem = (itemId: number) => api.delete(`/checklists/items/${itemId}`);

// Result endpoints
export const getResultsByInspection = (inspectionId: number) => api.get<Result[]>(`/results/inspection/${inspectionId}`);
export const createResult = (inspectionId: number, result: Partial<Result>) => api.post<Result>(`/results/inspection/${inspectionId}`, result);
export const updateResult = (id: number, result: Partial<Result>) => api.put<Result>(`/results/${id}`, result);
export const deleteResult = (id: number) => api.delete(`/results/${id}`);

export default api;
