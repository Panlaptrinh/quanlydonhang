import { pgTable, serial, text, integer, timestamp, boolean, jsonb, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table (synced with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  phone: text('phone').notNull().default(''),
  name: text('name').notNull(),
  role: text('role').notNull().default('worker'), // 'admin' | 'lead' | 'worker'
  avatarUrl: text('avatar_url').default(''),
  status: text('status').notNull().default('pending'), // 'pending' | 'active' | 'suspended'
  areaId: integer('area_id'),
  teamId: integer('team_id'),
  salaryType: text('salary_type').default('monthly'), // 'monthly' | 'daily' | 'per_order'
  baseRate: numeric('base_rate', { precision: 12, scale: 2 }).default('0'),
  bankAccount: text('bank_account').default(''),
  bankName: text('bank_name').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Service Areas
export const serviceAreas = pgTable('service_areas', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description').default(''),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Teams
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  leaderId: integer('leader_id').references(() => users.id),
  areaId: integer('area_id').references(() => serviceAreas.id),
  description: text('description').default(''),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Team Memberships
export const teamMemberships = pgTable('team_memberships', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// 5. Customers
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  address: text('address').notNull(),
  areaId: integer('area_id').references(() => serviceAreas.id),
  customerType: text('customer_type').notNull().default('individual'), // 'individual' | 'business'
  contactPerson: text('contact_person').default(''),
  notes: text('notes').default(''),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).default('0'),
  currentDebt: numeric('current_debt', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Customer Additional Addresses
export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  title: text('title').notNull(), // e.g. "Văn phòng chi nhánh", "Biệt thự nghỉ dưỡng"
  addressLine: text('address_line').notNull(),
  areaId: integer('area_id').references(() => serviceAreas.id),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Services & Pricing Catalog
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'home' | 'construction' | 'office' | 'specialized'
  description: text('description').default(''),
  unit: text('unit').notNull().default('m²'), // 'm²', 'gói', 'giờ', 'cái'
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull().default('0'),
  checklistTemplate: jsonb('checklist_template').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Orders (Vòng đời đơn hàng)
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  serviceId: integer('service_id').references(() => services.id).notNull(),
  address: text('address').notNull(),
  areaId: integer('area_id').references(() => serviceAreas.id),
  scheduledStart: timestamp('scheduled_start').notNull(),
  scheduledEnd: timestamp('scheduled_end').notNull(),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  baseAmount: numeric('base_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  adjustedAmount: numeric('adjusted_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  adjustmentReason: text('adjustment_reason').default(''),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('new'), 
  // 'new' | 'confirmed' | 'assigned' | 'in_progress' | 'lead_checked' | 'pending_acceptance' | 'acceptance_failed' | 'fixing' | 'completed' | 'cancelled'
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'unpaid' | 'partial' | 'paid'
  cancelReason: text('cancel_reason').default(''),
  notes: text('notes').default(''),
  specialRequests: text('special_requests').default(''),
  // Nghiệm thu khách hàng qua Link / OTP
  acceptanceToken: text('acceptance_token').unique(),
  acceptanceOtp: text('acceptance_otp'),
  acceptanceOtpExpiresAt: timestamp('acceptance_otp_expires_at'),
  acceptanceSignature: text('acceptance_signature'),
  acceptanceDate: timestamp('acceptance_date'),
  acceptanceFeedback: text('acceptance_feedback').default(''),
  customerRating: integer('customer_rating'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 9. Order Assignments
export const orderAssignments = pgTable('order_assignments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  teamId: integer('team_id').references(() => teams.id),
  userId: integer('user_id').references(() => users.id).notNull(),
  roleInOrder: text('role_in_order').notNull().default('member'), // 'leader' | 'member'
  assignedScope: text('assigned_scope').default(''),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

// 10. Order Checklists
export const orderChecklists = pgTable('order_checklists', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  itemTitle: text('item_title').notNull(),
  isCompleted: boolean('is_completed').default(false),
  beforePhotoUrl: text('before_photo_url').default(''),
  afterPhotoUrl: text('after_photo_url').default(''),
  notes: text('notes').default(''),
  customerApproved: boolean('customer_approved'),
  customerNotes: text('customer_notes').default(''),
  updatedBy: integer('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Order Status History (Audit trail vòng đời đơn)
export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  fromStatus: text('from_status').notNull(),
  toStatus: text('to_status').notNull(),
  note: text('note').default(''),
  changedBy: integer('changed_by').references(() => users.id),
  changedAt: timestamp('changed_at').defaultNow(),
});

// 12. Attendance Records (Chấm công)
export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  orderId: integer('order_id').references(() => orders.id),
  checkType: text('check_type').notNull(), // 'in' | 'out'
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  method: text('method').notNull().default('self'), // 'self' | 'lead_confirm' | 'qr' | 'gps' | 'manual'
  latitude: text('latitude').default(''),
  longitude: text('longitude').default(''),
  locationName: text('location_name').default(''),
  status: text('status').notNull().default('valid'), // 'valid' | 'flagged' | 'adjusted'
  adjustedReason: text('adjusted_reason').default(''),
  adjustedBy: integer('adjusted_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Leave Requests (Xin nghỉ phép)
export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  leaveType: text('leave_type').notNull().default('annual'), // 'sick' | 'annual' | 'unpaid'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  leadNotes: text('lead_notes').default(''),
  approvedBy: integer('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Payrolls (Tính lương & khóa sổ)
export const payrolls = pgTable('payrolls', {
  id: serial('id').primaryKey(),
  periodMonth: text('period_month').notNull(), // 'YYYY-MM'
  userId: integer('user_id').references(() => users.id).notNull(),
  workDays: numeric('work_days', { precision: 5, scale: 2 }).default('0'),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default('0'),
  baseSalary: numeric('base_salary', { precision: 12, scale: 2 }).default('0'),
  allowance: numeric('allowance', { precision: 12, scale: 2 }).default('0'),
  bonus: numeric('bonus', { precision: 12, scale: 2 }).default('0'),
  deductions: numeric('deductions', { precision: 12, scale: 2 }).default('0'),
  totalSalary: numeric('total_salary', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('draft'), // 'draft' | 'approved' | 'locked'
  approvedBy: integer('approved_by').references(() => users.id),
  lockedAt: timestamp('locked_at'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Financial Transactions (Doanh thu & Chi phí)
export const financialTransactions = pgTable('financial_transactions', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  customerId: integer('customer_id').references(() => customers.id),
  type: text('type').notNull(), // 'revenue' | 'expense'
  category: text('category').notNull(), 
  // Revenue: 'deposit' | 'final_payment' | 'other_revenue'
  // Expense: 'labor' | 'supplies' | 'transport' | 'equipment' | 'meal_allowance' | 'other'
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull().default('cash'), // 'cash' | 'bank_transfer'
  status: text('status').notNull().default('approved'), // 'pending_approval' | 'approved' | 'rejected'
  receiptUrl: text('receipt_url').default(''),
  notes: text('notes').default(''),
  proposedBy: integer('proposed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  transactionDate: timestamp('transaction_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 16. Audit Logs (Bảo mật & truy vết kiểm toán)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  reason: text('reason').default(''),
  ipAddress: text('ip_address').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. In-App Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  targetRole: text('target_role'), // 'all' | 'admin' | 'lead' | 'worker'
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link').default(''),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Company & App Settings
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: jsonb('setting_value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  area: one(serviceAreas, { fields: [users.areaId], references: [serviceAreas.id] }),
  attendances: many(attendanceRecords),
  payrolls: many(payrolls),
  assignments: many(orderAssignments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  service: one(services, { fields: [orders.serviceId], references: [services.id] }),
  area: one(serviceAreas, { fields: [orders.areaId], references: [serviceAreas.id] }),
  assignments: many(orderAssignments),
  checklists: many(orderChecklists),
  statusHistory: many(orderStatusHistory),
  transactions: many(financialTransactions),
}));
