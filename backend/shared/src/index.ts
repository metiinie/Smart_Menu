import { z } from 'zod';

// -----------------------------------------------------------------------------
// 1. Enums
// -----------------------------------------------------------------------------
export enum OrderStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
}

export enum Role {
  ADMIN = 'ADMIN',
  KITCHEN = 'KITCHEN',
}

export enum LocalOrderStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

// -----------------------------------------------------------------------------
// 2. Base Zod Schemas
// -----------------------------------------------------------------------------
export const RoleSchema = z.nativeEnum(Role);
export const OrderStatusSchema = z.nativeEnum(OrderStatus);

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  isAvailable: z.boolean(),
  isFasting: z.boolean(),
  imageUrl: z.string().optional(),
  categoryId: z.string().uuid(),
  categoryName: z.string().optional(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sortOrder: z.number().int(),
  branchId: z.string().uuid(),
  imageUrl: z.string().optional(),
});

// -----------------------------------------------------------------------------
// 3. Shared DTOs (Data Transfer Objects) mapping to validation schemas
// -----------------------------------------------------------------------------

// --- Orders ---
export const OrderItemDtoSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  note: z.string().optional(),
});

export const CreateOrderDtoSchema = z.object({
  tableId: z.string().uuid(),
  sessionId: z.string().uuid(),
  customerRef: z.string().min(1),
  items: z.array(OrderItemDtoSchema).min(1),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
export type OrderItemDto = z.infer<typeof OrderItemDtoSchema>;

// --- Menu ---
export const MenuCategoryDtoSchema = z.object({
  category: CategorySchema,
  items: z.array(MenuItemSchema),
});

export const MenuResponseDtoSchema = z.array(MenuCategoryDtoSchema);

export type MenuCategoryDto = z.infer<typeof MenuCategoryDtoSchema>;

export type MenuResponseDto = z.infer<typeof MenuResponseDtoSchema>;

// --- Auth ---
export const PinLoginDtoSchema = z.object({
  pin: z.string().min(4),
});

export type PinLoginDto = z.infer<typeof PinLoginDtoSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    role: RoleSchema,
  }),
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

// -----------------------------------------------------------------------------
// 4. Legacy / Domain Interfaces
// -----------------------------------------------------------------------------
export interface Branch {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
}

export interface DiningTable {
  id: string;
  branchId: string;
  tableNumber: number;
  qrCode: string;
}

export interface TableSession {
  id: string;
  tableId: string;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

export type Category = z.infer<typeof CategorySchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;

export interface Order {
  id: string;
  tableId: string;
  sessionId: string;
  status: OrderStatus | string;
  displayNumber: string;
  totalPrice: number | any;
  createdAt: string | Date | any;
  updatedAt: string | Date | any;
  items?: OrderItemDetail[];
  table?: { tableNumber: number };
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface OrderItemDetail extends OrderItem {
  menuItem: { name: string; imageUrl?: string };
}

export interface StaffUser {
  id: string;
  name: string;
  role: Role;
  branchId: string;
}

// Cart (frontend-only)
export interface CartItem {
  menuItemId: string;
  name: string;
  priceAtAdd: number;
  quantity: number;
  imageUrl?: string;
  note?: string;
}

export interface LocalOrder {
  id: string; // local uuid
  branchId: string;
  tableId: string;
  sessionId: string;
  customerRef: string;
  items: CartItem[];
  totalPrice: number;
  status: LocalOrderStatus;
  serverOrderId?: string;
  error?: string;
  timestamp: number;
}
