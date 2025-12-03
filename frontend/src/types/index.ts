export enum InspectionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum ResultStatus {
  FULFILLED = 'FULFILLED',
  NOT_FULFILLED = 'NOT_FULFILLED',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export interface ChecklistItem {
  id: number;
  description: string;
  orderIndex: number;
  desiredPhotoUrl?: string;
}

export interface Checklist {
  id: number;
  name: string;
  description: string;
  items: ChecklistItem[];
}

export interface Result {
  id?: number;
  checklistItem: ChecklistItem;
  status: ResultStatus;
  comment: string;
  photoUrl?: string;
}

export interface Inspection {
  id: number;
  facilityName: string;
  inspectionDate: string;
  responsibleEmployee: string;
  status: InspectionStatus;
  checklist: Checklist | null;
  results: Result[];
}

export interface Statistics {
  planned: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  enabled: boolean;
}
