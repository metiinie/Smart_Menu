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

export const IngredientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  detail: z.string().optional().nullable(),
});

export const AllergenSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  present: z.boolean(),
});

export const DietaryTagSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
});

export const NutritionRowSchema = z.object({
  id: z.string().uuid().optional(),
  nutrient: z.string().min(1),
  amount: z.string().min(1),
  dailyValue: z.string().optional().nullable(),
  sub: z.boolean().default(false),
});

export const NutritionSectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  rows: z.array(NutritionRowSchema).default([]),
});

export const ModifierOptionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  price: z.number().min(0).default(0),
});

export const ModifierGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  isRequired: z.boolean().default(false),
  minSelections: z.number().int().default(0),
  maxSelections: z.number().int().optional().nullable(),
  options: z.array(ModifierOptionSchema).default([]),
});

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  isAvailable: z.boolean(),
  isFasting: z.boolean(),
  imageUrl: z.string().optional().nullable(),
  model3dUrl: z.string().optional().nullable(),
  categoryId: z.string().uuid(),
  categoryName: z.string().optional(),
  
  ingredients: z.array(IngredientSchema).optional(),
  allergens: z.array(AllergenSchema).optional(),
  dietaryTags: z.array(DietaryTagSchema).optional(),
  nutritionSections: z.array(NutritionSectionSchema).optional(),
  modifierGroups: z.array(ModifierGroupSchema).optional(),
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
  cartItemId?: string;
  menuItemId: string;
  name: string;
  priceAtAdd: number; // Base price + options price sum
  quantity: number;
  imageUrl?: string | null;
  note?: string;
  options?: { optionName: string; optionPrice: number }[];
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
