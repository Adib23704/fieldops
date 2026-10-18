export type UserRole = 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';

export type OrderStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'PENDING_PARTS'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type ItemType = 'PART' | 'LABOR';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  skillCategories: string[];
  isActive: boolean;
}

export interface Customer {
  id: number;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  postalCode: string | null;
  createdAt: string;
  _count?: {
    workOrders: number;
  };
  workOrders?: Array<{
    id: number;
    orderNumber: string;
    title: string;
    status: OrderStatus;
    priority: OrderPriority;
    totalAmount: number | string;
    createdAt: string;
  }>;
}

export interface WorkOrderItem {
  id: number;
  workOrderId: number;
  type: ItemType;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  createdAt: string;
}

export interface WorkOrderStatusHistory {
  id: number;
  workOrderId: number;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedById: number;
  reason: string | null;
  createdAt: string;
  changedBy?: {
    id: number;
    fullName: string;
    role: UserRole;
  };
}

export interface WorkOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  technicianId: number | null;
  createdById: number;
  title: string;
  description: string;
  category: string;
  status: OrderStatus;
  priority: OrderPriority;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  technician?: User | null;
  createdBy?: User;
  items?: WorkOrderItem[];
  statusHistory?: WorkOrderStatusHistory[];
  _count?: {
    items: number;
  };
}

export interface SuggestedTech {
  id: number;
  fullName: string;
  role: string;
  skillCategories: string[];
  activeOrdersCount: number;
}

export interface TriageResult {
  triageLogId?: number;
  predictedUrgency: OrderPriority;
  predictedCategory: string;
  confidenceScore: number;
  extractedSymptoms: string[];
  reasoningSummary: string;
  suggestedTechnician: SuggestedTech | null;
  usedFallback: boolean;
}

export interface TriageMetrics {
  totalTriageCount: number;
  fallbackFrequency: number;
  humanEvaluatedCount: number;
  dispatcherAgreementRate: number;
}

export interface AiTriageLog {
  id: number;
  workOrderId: number | null;
  rawPromptText?: string;
  inputDescription?: string;
  inputCategoryHint?: string | null;
  predictedUrgency: OrderPriority;
  predictedCategory: string;
  confidenceScore: number | string;
  extractedSymptoms: string[];
  reasoningSummary: string;
  suggestedTechId: number | null;
  usedFallback: boolean;
  dispatcherOverrideUrgency?: OrderPriority | null;
  dispatcherAgreed?: boolean | null;
  overrideUrgency?: OrderPriority | null;
  evaluatedAt?: string | null;
  createdAt: string;
  suggestedTech?: {
    id: number;
    fullName: string;
    role?: string;
  } | null;
}
