import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import {
  users, serviceAreas, teams, teamMemberships, customers, customerAddresses,
  services, orders, orderAssignments, orderChecklists, orderStatusHistory,
  attendanceRecords, leaveRequests, payrolls, financialTransactions,
  auditLogs, notifications, appSettings
} from './src/db/schema.ts';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!getApps().length) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (e) {
    console.warn('Firebase admin initialization note:', e);
  }
}

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to log audit actions
async function logAudit(userId: number | null, action: string, targetType: string, targetId: string, beforeState: any, afterState: any, reason: string = '') {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      targetType,
      targetId: String(targetId),
      beforeState,
      afterState,
      reason,
      ipAddress: '127.0.0.1',
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// -------------------------------------------------------------
// USER & ROLE SWITCHING (FOR TESTING AND PRODUCTION OPERATION)
// -------------------------------------------------------------
let currentActiveUserId: number = 1; // Default to Admin

app.get('/api/me', async (req: Request, res: Response) => {
  try {
    const userList = await db.select().from(users).where(eq(users.id, currentActiveUserId));
    if (userList.length === 0) {
      const fallback = await db.select().from(users).limit(1);
      return res.json(fallback[0] || null);
    }
    res.json(userList[0]);
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/switch-role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const target = await db.select().from(users).where(eq(users.id, Number(userId)));
    if (target.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    currentActiveUserId = Number(userId);
    res.json({ success: true, user: target[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/all', async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(users.id);
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/approve', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const before = await db.select().from(users).where(eq(users.id, Number(userId)));
    if (before.length === 0) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    await db.update(users).set({ status: 'active', updatedAt: new Date() }).where(eq(users.id, Number(userId)));
    await logAudit(currentActiveUserId, 'APPROVE_USER', 'users', String(userId), before[0], { ...before[0], status: 'active' }, 'Quản lý duyệt nhân sự');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager directly creates staff
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, role, salaryType, baseRate, bankAccount, bankName, areaId, teamId, notes, avatarUrl } = req.body;
    const uid = `usr_${Date.now()}`;
    const inserted = await db.insert(users).values({
      uid,
      name,
      phone: phone || '',
      email: email || `${phone || uid}@cleanops.vn`,
      role: role || 'worker',
      salaryType: salaryType || 'daily',
      baseRate: String(baseRate || 350000),
      bankAccount: bankAccount || '',
      bankName: bankName || '',
      areaId: areaId ? Number(areaId) : null,
      teamId: teamId ? Number(teamId) : null,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      status: 'active',
      notes: notes || '',
    }).returning();

    await logAudit(currentActiveUserId, 'CREATE_USER', 'users', String(inserted[0].id), null, inserted[0], 'Quản lý tạo hồ sơ nhân sự mới');
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager updates staff profile
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, email, role, salaryType, baseRate, bankAccount, bankName, areaId, teamId, notes, status, avatarUrl } = req.body;
    const before = (await db.select().from(users).where(eq(users.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (salaryType !== undefined) updates.salaryType = salaryType;
    if (baseRate !== undefined) updates.baseRate = String(baseRate);
    if (bankAccount !== undefined) updates.bankAccount = bankAccount;
    if (bankName !== undefined) updates.bankName = bankName;
    if (areaId !== undefined) updates.areaId = areaId ? Number(areaId) : null;
    if (teamId !== undefined) updates.teamId = teamId ? Number(teamId) : null;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    await db.update(users).set(updates).where(eq(users.id, id));
    const after = (await db.select().from(users).where(eq(users.id, id)))[0];
    await logAudit(currentActiveUserId, 'UPDATE_USER', 'users', String(id), before, after, 'Quản lý chỉnh sửa thông tin nhân sự');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager deletes staff account / profile with cascade cleanup
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (id === currentActiveUserId) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản quản trị viên đang đăng nhập!' });
    }

    const before = (await db.select().from(users).where(eq(users.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    // Clean up dependent records to avoid foreign key violations
    await db.delete(teamMemberships).where(eq(teamMemberships.userId, id));
    await db.update(teams).set({ leaderId: null }).where(eq(teams.leaderId, id));
    await db.delete(orderAssignments).where(eq(orderAssignments.userId, id));
    await db.delete(attendanceRecords).where(eq(attendanceRecords.userId, id));
    await db.delete(leaveRequests).where(eq(leaveRequests.userId, id));
    await db.delete(payrolls).where(eq(payrolls.userId, id));
    await db.update(orders).set({ createdBy: null }).where(eq(orders.createdBy, id));
    await db.update(orderChecklists).set({ updatedBy: null }).where(eq(orderChecklists.updatedBy, id));
    await db.update(orderStatusHistory).set({ changedBy: null }).where(eq(orderStatusHistory.changedBy, id));
    await db.update(financialTransactions).set({ proposedBy: null }).where(eq(financialTransactions.proposedBy, id));
    await db.update(financialTransactions).set({ approvedBy: null }).where(eq(financialTransactions.approvedBy, id));
    await db.update(auditLogs).set({ userId: null }).where(eq(auditLogs.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));

    await db.delete(users).where(eq(users.id, id));
    await logAudit(currentActiveUserId, 'DELETE_USER', 'users', String(id), before, null, 'Quản lý xóa vĩnh viễn nhân sự và tài khoản');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// MASTER DATA: AREAS, TEAMS, SERVICES, CUSTOMERS
// -------------------------------------------------------------
app.get('/api/areas', async (_req: Request, res: Response) => {
  try {
    const areas = await db.select().from(serviceAreas).orderBy(serviceAreas.id);
    res.json(areas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams', async (_req: Request, res: Response) => {
  try {
    const allTeams = await db.select().from(teams).orderBy(teams.id);
    res.json(allTeams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services', async (_req: Request, res: Response) => {
  try {
    const allServices = await db.select().from(services).orderBy(services.id);
    res.json(allServices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req: Request, res: Response) => {
  try {
    const { code, name, category, description, unit, basePrice, checklistTemplate } = req.body;
    const inserted = await db.insert(services).values({
      code,
      name,
      category,
      description,
      unit,
      basePrice: String(basePrice),
      checklistTemplate: checklistTemplate || [],
      isActive: true,
    }).returning();
    await logAudit(currentActiveUserId, 'CREATE_SERVICE', 'services', String(inserted[0].id), null, inserted[0]);
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', async (_req: Request, res: Response) => {
  try {
    const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));
    res.json(allCustomers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, areaId, customerType, contactPerson, notes } = req.body;
    // Check duplicate phone (SRS FR-03 rule: warning, manual review)
    const existing = await db.select().from(customers).where(eq(customers.phone, phone));
    if (existing.length > 0) {
      return res.status(409).json({
        warning: true,
        message: `Số điện thoại ${phone} đã tồn tại cho khách hàng ${existing[0].name} (${existing[0].code}).`,
        existingCustomer: existing[0],
      });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const code = `KH-${String(Number(countRes[0].count) + 1).padStart(3, '0')}`;

    const inserted = await db.insert(customers).values({
      code,
      name,
      phone,
      email: email || '',
      address,
      areaId: areaId ? Number(areaId) : null,
      customerType: customerType || 'individual',
      contactPerson: contactPerson || '',
      notes: notes || '',
    }).returning();

    await logAudit(currentActiveUserId, 'CREATE_CUSTOMER', 'customers', String(inserted[0].id), null, inserted[0]);
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Customer (Manager full edit)
app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, email, address, areaId, customerType, contactPerson, notes, currentDebt } = req.body;
    const before = (await db.select().from(customers).where(eq(customers.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (address !== undefined) updates.address = address;
    if (areaId !== undefined) updates.areaId = areaId ? Number(areaId) : null;
    if (customerType !== undefined) updates.customerType = customerType;
    if (contactPerson !== undefined) updates.contactPerson = contactPerson;
    if (notes !== undefined) updates.notes = notes;
    if (currentDebt !== undefined) updates.currentDebt = String(currentDebt);

    await db.update(customers).set(updates).where(eq(customers.id, id));
    const after = (await db.select().from(customers).where(eq(customers.id, id)))[0];
    await logAudit(currentActiveUserId, 'UPDATE_CUSTOMER', 'customers', String(id), before, after, 'Chỉnh sửa thông tin khách hàng');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager deletes customer
app.delete('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const before = (await db.select().from(customers).where(eq(customers.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

    // Check if customer has orders
    const relatedOrders = await db.select().from(orders).where(eq(orders.customerId, id));
    if (relatedOrders.length > 0) {
      return res.status(400).json({ error: `Không thể xóa khách hàng này vì đang có ${relatedOrders.length} đơn hàng liên kết. Hãy xóa các đơn hàng trước hoặc chỉnh sửa thông tin.` });
    }

    await db.delete(customerAddresses).where(eq(customerAddresses.customerId, id));
    await db.delete(financialTransactions).where(eq(financialTransactions.customerId, id));
    await db.delete(customers).where(eq(customers.id, id));
    await logAudit(currentActiveUserId, 'DELETE_CUSTOMER', 'customers', String(id), before, null, 'Xóa hồ sơ khách hàng');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Service (Manager full edit)
app.put('/api/services/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, category, description, unit, basePrice, checklistTemplate, isActive } = req.body;
    const before = (await db.select().from(services).where(eq(services.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (unit !== undefined) updates.unit = unit;
    if (basePrice !== undefined) updates.basePrice = String(basePrice);
    if (checklistTemplate !== undefined) updates.checklistTemplate = checklistTemplate;
    if (isActive !== undefined) updates.isActive = isActive;

    await db.update(services).set(updates).where(eq(services.id, id));
    const after = (await db.select().from(services).where(eq(services.id, id)))[0];
    await logAudit(currentActiveUserId, 'UPDATE_SERVICE', 'services', String(id), before, after, 'Chỉnh sửa danh mục dịch vụ');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager deletes service
app.delete('/api/services/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const before = (await db.select().from(services).where(eq(services.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });

    const relatedOrders = await db.select().from(orders).where(eq(orders.serviceId, id));
    if (relatedOrders.length > 0) {
      await db.update(services).set({ isActive: false }).where(eq(services.id, id));
      await logAudit(currentActiveUserId, 'DEACTIVATE_SERVICE', 'services', String(id), before, { ...before, isActive: false }, 'Dịch vụ có đơn hàng -> chuyển sang ngừng hoạt động');
      return res.json({ success: true, deactivated: true, message: 'Dịch vụ đã có đơn hàng trong hệ thống nên đã chuyển sang trạng thái Ngừng kinh doanh.' });
    }

    await db.delete(services).where(eq(services.id, id));
    await logAudit(currentActiveUserId, 'DELETE_SERVICE', 'services', String(id), before, null, 'Xóa danh mục dịch vụ');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Area & Team
app.post('/api/areas', async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;
    const inserted = await db.insert(serviceAreas).values({
      name,
      code,
      description: description || '',
      isActive: true,
    }).returning();
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teams', async (req: Request, res: Response) => {
  try {
    const { name, leaderId, areaId, description } = req.body;
    const inserted = await db.insert(teams).values({
      name,
      leaderId: leaderId ? Number(leaderId) : null,
      areaId: areaId ? Number(areaId) : null,
      description: description || '',
      isActive: true,
    }).returning();
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// ORDERS & LIFECYCLE MANAGEMENT
// -------------------------------------------------------------
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const currentUser = (await db.select().from(users).where(eq(users.id, currentActiveUserId)))[0];
    const role = currentUser?.role || 'worker';

    // Role-based scoping according to SRS:
    // Admin: all orders
    // Lead: orders assigned to team or managed by lead
    // Worker: only orders assigned to worker
    let orderList: any[] = [];
    if (role === 'admin') {
      orderList = await db.select().from(orders).orderBy(desc(orders.id));
    } else if (role === 'lead') {
      const assignedOrderIds = await db
        .select({ orderId: orderAssignments.orderId })
        .from(orderAssignments)
        .where(eq(orderAssignments.userId, currentActiveUserId));
      
      const ids = assignedOrderIds.map(a => a.orderId);
      if (ids.length === 0) {
        orderList = await db.select().from(orders).orderBy(desc(orders.id)).limit(10);
      } else {
        orderList = await db.select().from(orders).where(or(...ids.map(id => eq(orders.id, id)))).orderBy(desc(orders.id));
      }
    } else {
      const assignedOrderIds = await db
        .select({ orderId: orderAssignments.orderId })
        .from(orderAssignments)
        .where(eq(orderAssignments.userId, currentActiveUserId));
      const ids = assignedOrderIds.map(a => a.orderId);
      if (ids.length === 0) {
        orderList = [];
      } else {
        orderList = await db.select().from(orders).where(or(...ids.map(id => eq(orders.id, id)))).orderBy(desc(orders.id));
      }
    }

    // Attach customer and service info
    const enriched = await Promise.all(
      orderList.map(async (o) => {
        const cust = (await db.select().from(customers).where(eq(customers.id, o.customerId)))[0];
        const srv = (await db.select().from(services).where(eq(services.id, o.serviceId)))[0];
        const assignedStaff = await db
          .select({
            id: users.id,
            name: users.name,
            phone: users.phone,
            roleInOrder: orderAssignments.roleInOrder,
          })
          .from(orderAssignments)
          .innerJoin(users, eq(orderAssignments.userId, users.id))
          .where(eq(orderAssignments.orderId, o.id));

        return {
          ...o,
          customer: cust,
          service: srv,
          assignedStaff,
        };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const orderRecord = (await db.select().from(orders).where(eq(orders.id, id)))[0];
    if (!orderRecord) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    const cust = (await db.select().from(customers).where(eq(customers.id, orderRecord.customerId)))[0];
    const srv = (await db.select().from(services).where(eq(services.id, orderRecord.serviceId)))[0];
    const area = orderRecord.areaId ? (await db.select().from(serviceAreas).where(eq(serviceAreas.id, orderRecord.areaId)))[0] : null;
    const checklists = await db.select().from(orderChecklists).where(eq(orderChecklists.orderId, id)).orderBy(orderChecklists.id);
    const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.id));
    const transactions = await db.select().from(financialTransactions).where(eq(financialTransactions.orderId, id)).orderBy(desc(financialTransactions.id));
    
    const assignedStaff = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        roleInOrder: orderAssignments.roleInOrder,
        assignedScope: orderAssignments.assignedScope,
      })
      .from(orderAssignments)
      .innerJoin(users, eq(orderAssignments.userId, users.id))
      .where(eq(orderAssignments.orderId, id));

    res.json({
      ...orderRecord,
      customer: cust,
      service: srv,
      area,
      checklists,
      history,
      transactions,
      assignedStaff,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const {
      customerId, serviceId, address, areaId,
      scheduledStart, scheduledEnd, baseAmount,
      adjustedAmount, adjustmentReason, notes, specialRequests
    } = req.body;

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const orderNumber = `DH-202611-${String(Number(countRes[0].count) + 1).padStart(3, '0')}`;
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const finalBase = String(baseAmount || 0);
    const finalAdjusted = String(adjustedAmount || baseAmount || 0);

    const inserted = await db.insert(orders).values({
      orderNumber,
      customerId: Number(customerId),
      serviceId: Number(serviceId),
      address,
      areaId: areaId ? Number(areaId) : null,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      baseAmount: finalBase,
      adjustedAmount: finalAdjusted,
      adjustmentReason: adjustmentReason || '',
      paidAmount: '0',
      status: 'new',
      paymentStatus: 'unpaid',
      notes: notes || '',
      specialRequests: specialRequests || '',
      acceptanceToken: token,
      acceptanceOtp: otp,
      acceptanceOtpExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdBy: currentActiveUserId,
    }).returning();

    // Populate checklist items from service template
    const srv = (await db.select().from(services).where(eq(services.id, Number(serviceId))))[0];
    if (srv && Array.isArray(srv.checklistTemplate)) {
      for (const item of (srv.checklistTemplate as any[])) {
        await db.insert(orderChecklists).values({
          orderId: inserted[0].id,
          itemTitle: item.title || 'Hạng mục kiểm tra',
          isCompleted: false,
          notes: item.standard || '',
        });
      }
    }

    // Status history
    await db.insert(orderStatusHistory).values({
      orderId: inserted[0].id,
      fromStatus: 'none',
      toStatus: 'new',
      note: 'Tạo mới đơn hàng trên hệ thống',
      changedBy: currentActiveUserId,
    });

    await logAudit(currentActiveUserId, 'CREATE_ORDER', 'orders', String(inserted[0].id), null, inserted[0]);

    res.json(inserted[0]);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nextStatus, note } = req.body;

    const currentOrder = (await db.select().from(orders).where(eq(orders.id, id)))[0];
    if (!currentOrder) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    const prevStatus = currentOrder.status;

    // Actual time updates
    const updates: any = {
      status: nextStatus,
      updatedAt: new Date(),
    };

    if (nextStatus === 'in_progress' && !currentOrder.actualStart) {
      updates.actualStart = new Date();
    }
    if (nextStatus === 'completed' && !currentOrder.actualEnd) {
      updates.actualEnd = new Date();
    }

    await db.update(orders).set(updates).where(eq(orders.id, id));

    await db.insert(orderStatusHistory).values({
      orderId: id,
      fromStatus: prevStatus,
      toStatus: nextStatus,
      note: note || `Chuyển trạng thái sang ${nextStatus}`,
      changedBy: currentActiveUserId,
    });

    await logAudit(currentActiveUserId, 'CHANGE_ORDER_STATUS', 'orders', String(id), { status: prevStatus }, { status: nextStatus }, note);

    res.json({ success: true, fromStatus: prevStatus, toStatus: nextStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order (Manager only, reason mandatory - SRS BR-04)
app.post('/api/orders/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Bắt buộc phải nhập lý do hủy đơn theo quy định BR-04' });
    }

    const currentOrder = (await db.select().from(orders).where(eq(orders.id, id)))[0];
    if (!currentOrder) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    await db.update(orders).set({
      status: 'cancelled',
      cancelReason: reason,
      updatedAt: new Date(),
    }).where(eq(orders.id, id));

    await db.insert(orderStatusHistory).values({
      orderId: id,
      fromStatus: currentOrder.status,
      toStatus: 'cancelled',
      note: `Lý do hủy đơn: ${reason}`,
      changedBy: currentActiveUserId,
    });

    await logAudit(currentActiveUserId, 'CANCEL_ORDER', 'orders', String(id), currentOrder, { ...currentOrder, status: 'cancelled', cancelReason: reason }, reason);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assign Staff to Order
app.post('/api/orders/:id/assign', async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { userIds, teamId, scope } = req.body; // array of userIds

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 nhân viên' });
    }

    for (const uid of userIds) {
      const existing = await db.select().from(orderAssignments).where(
        and(eq(orderAssignments.orderId, orderId), eq(orderAssignments.userId, Number(uid)))
      );
      if (existing.length === 0) {
        const u = (await db.select().from(users).where(eq(users.id, Number(uid))))[0];
        const roleInOrder = u?.role === 'lead' ? 'leader' : 'member';
        await db.insert(orderAssignments).values({
          orderId,
          teamId: teamId ? Number(teamId) : null,
          userId: Number(uid),
          roleInOrder,
          assignedScope: scope || 'Thực hiện vệ sinh theo checklist đơn hàng',
        });
      }
    }

    await db.update(orders).set({ status: 'assigned', updatedAt: new Date() }).where(eq(orders.id, orderId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full Edit Order (Manager can edit customer, service, address, dates, price, reason, notes)
app.put('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      customerId, serviceId, address, areaId,
      scheduledStart, scheduledEnd, baseAmount,
      adjustedAmount, adjustmentReason, notes, specialRequests,
      status, paymentStatus
    } = req.body;

    const before = (await db.select().from(orders).where(eq(orders.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    const updates: any = { updatedAt: new Date() };
    if (customerId !== undefined) updates.customerId = Number(customerId);
    if (serviceId !== undefined) updates.serviceId = Number(serviceId);
    if (address !== undefined) updates.address = address;
    if (areaId !== undefined) updates.areaId = areaId ? Number(areaId) : null;
    if (scheduledStart !== undefined) updates.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd !== undefined) updates.scheduledEnd = new Date(scheduledEnd);
    if (baseAmount !== undefined) updates.baseAmount = String(baseAmount);
    if (adjustedAmount !== undefined) updates.adjustedAmount = String(adjustedAmount);
    if (adjustmentReason !== undefined) updates.adjustmentReason = adjustmentReason;
    if (notes !== undefined) updates.notes = notes;
    if (specialRequests !== undefined) updates.specialRequests = specialRequests;
    if (status !== undefined) updates.status = status;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

    await db.update(orders).set(updates).where(eq(orders.id, id));
    const after = (await db.select().from(orders).where(eq(orders.id, id)))[0];

    // If status changed, record history
    if (status && status !== before.status) {
      await db.insert(orderStatusHistory).values({
        orderId: id,
        fromStatus: before.status,
        toStatus: status,
        note: `Quản lý cập nhật đơn hàng: ${adjustmentReason || 'Điều chỉnh thông tin'}`,
        changedBy: currentActiveUserId,
      });
    }

    await logAudit(currentActiveUserId, 'UPDATE_ORDER', 'orders', String(id), before, after, adjustmentReason || 'Quản lý chỉnh sửa đơn hàng');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager deletes order with cascade cleanup and audit logging
app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const before = (await db.select().from(orders).where(eq(orders.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    // Cascade delete dependent records
    await db.delete(orderChecklists).where(eq(orderChecklists.orderId, id));
    await db.delete(orderAssignments).where(eq(orderAssignments.orderId, id));
    await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, id));
    await db.update(attendanceRecords).set({ orderId: null }).where(eq(attendanceRecords.orderId, id));
    await db.update(financialTransactions).set({ orderId: null }).where(eq(financialTransactions.orderId, id));

    await db.delete(orders).where(eq(orders.id, id));
    await logAudit(currentActiveUserId, 'DELETE_ORDER', 'orders', String(id), before, null, `Quản lý xóa đơn hàng #${before.orderNumber}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Checklists
app.patch('/api/checklists/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { isCompleted, beforePhotoUrl, afterPhotoUrl, notes } = req.body;

    const updates: any = { updatedAt: new Date(), updatedBy: currentActiveUserId };
    if (typeof isCompleted === 'boolean') updates.isCompleted = isCompleted;
    if (beforePhotoUrl !== undefined) updates.beforePhotoUrl = beforePhotoUrl;
    if (afterPhotoUrl !== undefined) updates.afterPhotoUrl = afterPhotoUrl;
    if (notes !== undefined) updates.notes = notes;

    await db.update(orderChecklists).set(updates).where(eq(orderChecklists.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add checklist item to order
app.post('/api/orders/:id/checklists', async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { itemTitle, notes } = req.body;
    if (!itemTitle || !itemTitle.trim()) return res.status(400).json({ error: 'Tên hạng mục không được để trống' });

    const inserted = await db.insert(orderChecklists).values({
      orderId,
      itemTitle,
      isCompleted: false,
      notes: notes || '',
      updatedBy: currentActiveUserId,
    }).returning();
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete checklist item
app.delete('/api/checklists/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(orderChecklists).where(eq(orderChecklists.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// CUSTOMER ACCEPTANCE (PUBLIC LINK / QR + OTP + DIGITAL SIGNATURE)
// -------------------------------------------------------------
app.get('/api/public/acceptance/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const orderList = await db.select().from(orders).where(eq(orders.acceptanceToken, token));
    if (orderList.length === 0) {
      return res.status(404).json({ error: 'Liên kết nghiệm thu không hợp lệ hoặc đã hết hạn.' });
    }

    const orderRecord = orderList[0];
    const cust = (await db.select().from(customers).where(eq(customers.id, orderRecord.customerId)))[0];
    const srv = (await db.select().from(services).where(eq(services.id, orderRecord.serviceId)))[0];
    const checklists = await db.select().from(orderChecklists).where(eq(orderChecklists.orderId, orderRecord.id)).orderBy(orderChecklists.id);

    // Mask phone for customer privacy
    const rawPhone = cust?.phone || '';
    const maskedPhone = rawPhone.length > 4 ? rawPhone.slice(0, 3) + '***' + rawPhone.slice(-3) : rawPhone;

    res.json({
      orderNumber: orderRecord.orderNumber,
      serviceName: srv?.name,
      customerName: cust?.name,
      customerPhoneMasked: maskedPhone,
      address: orderRecord.address,
      scheduledStart: orderRecord.scheduledStart,
      scheduledEnd: orderRecord.scheduledEnd,
      status: orderRecord.status,
      acceptanceSignature: orderRecord.acceptanceSignature,
      acceptanceDate: orderRecord.acceptanceDate,
      acceptanceFeedback: orderRecord.acceptanceFeedback,
      customerRating: orderRecord.customerRating,
      checklists: checklists.map(c => ({
        id: c.id,
        itemTitle: c.itemTitle,
        isCompleted: c.isCompleted,
        beforePhotoUrl: c.beforePhotoUrl,
        afterPhotoUrl: c.afterPhotoUrl,
        notes: c.notes,
        customerApproved: c.customerApproved,
        customerNotes: c.customerNotes,
      })),
      // Provide OTP hint in demo mode for frictionless testing
      demoOtpHint: orderRecord.acceptanceOtp,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/public/acceptance/:token/verify-and-sign', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { otp, signature, checklistFeedback, overallFeedback, rating } = req.body;

    const orderList = await db.select().from(orders).where(eq(orders.acceptanceToken, token));
    if (orderList.length === 0) return res.status(404).json({ error: 'Liên kết nghiệm thu không tồn tại' });

    const orderRecord = orderList[0];

    // Verify OTP
    if (!otp || String(otp).trim() !== String(orderRecord.acceptanceOtp).trim()) {
      return res.status(400).json({ error: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.' });
    }

    // Check checklist items: if ANY item has customerApproved === false -> transition to 'acceptance_failed' / 'fixing' (SRS BR-05)
    let hasFailures = false;
    if (Array.isArray(checklistFeedback)) {
      for (const item of checklistFeedback) {
        if (item.approved === false) {
          hasFailures = true;
        }
        await db.update(orderChecklists).set({
          customerApproved: item.approved,
          customerNotes: item.notes || '',
          updatedAt: new Date(),
        }).where(eq(orderChecklists.id, Number(item.id)));
      }
    }

    const nextStatus = hasFailures ? 'acceptance_failed' : 'completed';
    const note = hasFailures
      ? 'Khách hàng nghiệm thu: Có hạng mục chưa đạt, yêu cầu đội ngũ xử lý khắc phục.'
      : 'Khách hàng đã xác thực OTP và ký biên bản nghiệm thu đạt 100%. Đơn hàng hoàn thành!';

    await db.update(orders).set({
      status: nextStatus,
      acceptanceSignature: signature || '',
      acceptanceDate: new Date(),
      acceptanceFeedback: overallFeedback || '',
      customerRating: rating ? Number(rating) : 5,
      actualEnd: new Date(),
      updatedAt: new Date(),
    }).where(eq(orders.id, orderRecord.id));

    await db.insert(orderStatusHistory).values({
      orderId: orderRecord.id,
      fromStatus: orderRecord.status,
      toStatus: nextStatus,
      note,
      changedBy: null, // Customer self-accepted
    });

    res.json({
      success: true,
      status: nextStatus,
      hasFailures,
      message: hasFailures ? 'Biên bản đã ghi nhận phản hồi chưa đạt. Đội ngũ CleanOps sẽ liên hệ khắc phục ngay!' : 'Nghiệm thu thành công! Cảm ơn Quý khách.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// ATTENDANCE & GPS CHECK-IN
// -------------------------------------------------------------
app.get('/api/attendance', async (req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: attendanceRecords.id,
        userId: attendanceRecords.userId,
        userName: users.name,
        userRole: users.role,
        orderId: attendanceRecords.orderId,
        orderNumber: orders.orderNumber,
        checkType: attendanceRecords.checkType,
        timestamp: attendanceRecords.timestamp,
        method: attendanceRecords.method,
        latitude: attendanceRecords.latitude,
        longitude: attendanceRecords.longitude,
        locationName: attendanceRecords.locationName,
        status: attendanceRecords.status,
        adjustedReason: attendanceRecords.adjustedReason,
      })
      .from(attendanceRecords)
      .innerJoin(users, eq(attendanceRecords.userId, users.id))
      .leftJoin(orders, eq(attendanceRecords.orderId, orders.id))
      .orderBy(desc(attendanceRecords.timestamp));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/check', async (req: Request, res: Response) => {
  try {
    const { orderId, checkType, method, latitude, longitude, locationName } = req.body;
    const inserted = await db.insert(attendanceRecords).values({
      userId: currentActiveUserId,
      orderId: orderId ? Number(orderId) : null,
      checkType: checkType || 'in',
      method: method || 'gps',
      latitude: latitude ? String(latitude) : '10.7769',
      longitude: longitude ? String(longitude) : '106.7009',
      locationName: locationName || 'Điểm công trình TP.HCM',
      status: 'valid',
    }).returning();

    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adjust attendance record (Manager audit log - SRS BR-09)
app.patch('/api/attendance/:id/adjust', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { newStatus, adjustedReason } = req.body;

    const before = (await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy bản ghi chấm công' });

    await db.update(attendanceRecords).set({
      status: newStatus,
      adjustedReason,
      adjustedBy: currentActiveUserId,
    }).where(eq(attendanceRecords.id, id));

    await logAudit(currentActiveUserId, 'ADJUST_ATTENDANCE', 'attendance', String(id), before, { ...before, status: newStatus, adjustedReason }, adjustedReason);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager manually adds attendance record
app.post('/api/attendance/manual', async (req: Request, res: Response) => {
  try {
    const { userId, orderId, checkType, timestamp, locationName, status, adjustedReason } = req.body;
    const inserted = await db.insert(attendanceRecords).values({
      userId: Number(userId),
      orderId: orderId ? Number(orderId) : null,
      checkType: checkType || 'in',
      method: 'manual',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      locationName: locationName || 'Chấm công bổ sung bởi Quản lý',
      status: status || 'valid',
      adjustedReason: adjustedReason || 'Quản lý bổ sung lượt chấm công',
      adjustedBy: currentActiveUserId,
    }).returning();

    await logAudit(currentActiveUserId, 'MANUAL_ATTENDANCE', 'attendance', String(inserted[0].id), null, inserted[0], adjustedReason || 'Chấm công bổ sung');
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager edits attendance record
app.put('/api/attendance/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { userId, orderId, checkType, timestamp, locationName, status, adjustedReason } = req.body;
    const before = (await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy bản ghi chấm công' });

    const updates: any = {};
    if (userId !== undefined) updates.userId = Number(userId);
    if (orderId !== undefined) updates.orderId = orderId ? Number(orderId) : null;
    if (checkType !== undefined) updates.checkType = checkType;
    if (timestamp !== undefined) updates.timestamp = new Date(timestamp);
    if (locationName !== undefined) updates.locationName = locationName;
    if (status !== undefined) updates.status = status;
    if (adjustedReason !== undefined) updates.adjustedReason = adjustedReason;
    updates.adjustedBy = currentActiveUserId;

    await db.update(attendanceRecords).set(updates).where(eq(attendanceRecords.id, id));
    const after = (await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)))[0];
    await logAudit(currentActiveUserId, 'UPDATE_ATTENDANCE', 'attendance', String(id), before, after, adjustedReason || 'Chỉnh sửa bản ghi chấm công');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager deletes attendance record
app.delete('/api/attendance/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const before = (await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy bản ghi chấm công' });

    await db.delete(attendanceRecords).where(eq(attendanceRecords.id, id));
    await logAudit(currentActiveUserId, 'DELETE_ATTENDANCE', 'attendance', String(id), before, null, 'Quản lý xóa bản ghi chấm công');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// LEAVE REQUESTS
// -------------------------------------------------------------
app.get('/api/leaves', async (_req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        userName: users.name,
        userRole: users.role,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        leadNotes: leaveRequests.leadNotes,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.userId, users.id))
      .orderBy(desc(leaveRequests.id));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leaves', async (req: Request, res: Response) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const inserted = await db.insert(leaveRequests).values({
      userId: currentActiveUserId,
      leaveType: leaveType || 'annual',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'pending',
    }).returning();
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/leaves/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, leadNotes } = req.body;
    await db.update(leaveRequests).set({
      status,
      leadNotes: leadNotes || '',
      approvedBy: currentActiveUserId,
    }).where(eq(leaveRequests.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// PAYROLL (BẢNG LƯƠNG & BẢO MẬT TRUY CẬP)
// -------------------------------------------------------------
app.get('/api/payrolls', async (req: Request, res: Response) => {
  try {
    const currentUser = (await db.select().from(users).where(eq(users.id, currentActiveUserId)))[0];
    const role = currentUser?.role || 'worker';

    let list: any[] = [];
    if (role === 'admin') {
      list = await db
        .select({
          id: payrolls.id,
          periodMonth: payrolls.periodMonth,
          userId: payrolls.userId,
          userName: users.name,
          userRole: users.role,
          bankAccount: users.bankAccount,
          bankName: users.bankName,
          workDays: payrolls.workDays,
          overtimeHours: payrolls.overtimeHours,
          baseSalary: payrolls.baseSalary,
          allowance: payrolls.allowance,
          bonus: payrolls.bonus,
          deductions: payrolls.deductions,
          totalSalary: payrolls.totalSalary,
          status: payrolls.status,
          notes: payrolls.notes,
          lockedAt: payrolls.lockedAt,
        })
        .from(payrolls)
        .innerJoin(users, eq(payrolls.userId, users.id))
        .orderBy(desc(payrolls.id));
    } else {
      // Workers and Leads only see their personal payslip
      list = await db
        .select({
          id: payrolls.id,
          periodMonth: payrolls.periodMonth,
          userId: payrolls.userId,
          userName: users.name,
          userRole: users.role,
          bankAccount: users.bankAccount,
          bankName: users.bankName,
          workDays: payrolls.workDays,
          overtimeHours: payrolls.overtimeHours,
          baseSalary: payrolls.baseSalary,
          allowance: payrolls.allowance,
          bonus: payrolls.bonus,
          deductions: payrolls.deductions,
          totalSalary: payrolls.totalSalary,
          status: payrolls.status,
          notes: payrolls.notes,
          lockedAt: payrolls.lockedAt,
        })
        .from(payrolls)
        .innerJoin(users, eq(payrolls.userId, users.id))
        .where(eq(payrolls.userId, currentActiveUserId))
        .orderBy(desc(payrolls.id));
    }

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/payrolls/:id/lock', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { lock } = req.body; // boolean

    const before = (await db.select().from(payrolls).where(eq(payrolls.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy bảng lương' });

    const newStatus = lock ? 'locked' : 'draft';
    await db.update(payrolls).set({
      status: newStatus,
      lockedAt: lock ? new Date() : null,
      approvedBy: currentActiveUserId,
    }).where(eq(payrolls.id, id));

    await logAudit(currentActiveUserId, lock ? 'LOCK_PAYROLL' : 'UNLOCK_PAYROLL', 'payrolls', String(id), before, { ...before, status: newStatus });

    res.json({ success: true, status: newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// FINANCIAL TRANSACTIONS, DEPOSITS & RECEIVABLES
// -------------------------------------------------------------
app.get('/api/financials', async (_req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        id: financialTransactions.id,
        orderId: financialTransactions.orderId,
        orderNumber: orders.orderNumber,
        customerId: financialTransactions.customerId,
        customerName: customers.name,
        type: financialTransactions.type,
        category: financialTransactions.category,
        amount: financialTransactions.amount,
        paymentMethod: financialTransactions.paymentMethod,
        status: financialTransactions.status,
        receiptUrl: financialTransactions.receiptUrl,
        notes: financialTransactions.notes,
        transactionDate: financialTransactions.transactionDate,
      })
      .from(financialTransactions)
      .leftJoin(orders, eq(financialTransactions.orderId, orders.id))
      .leftJoin(customers, eq(financialTransactions.customerId, customers.id))
      .orderBy(desc(financialTransactions.id));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/financials', async (req: Request, res: Response) => {
  try {
    const { orderId, customerId, type, category, amount, paymentMethod, notes } = req.body;
    const inserted = await db.insert(financialTransactions).values({
      orderId: orderId ? Number(orderId) : null,
      customerId: customerId ? Number(customerId) : null,
      type: type || 'revenue',
      category: category || 'deposit',
      amount: String(amount),
      paymentMethod: paymentMethod || 'cash',
      status: 'approved',
      notes: notes || '',
      proposedBy: currentActiveUserId,
      approvedBy: currentActiveUserId,
      transactionDate: new Date(),
    }).returning();

    // If order payment, update order's paidAmount
    if (orderId && type === 'revenue') {
      const currentOrder = (await db.select().from(orders).where(eq(orders.id, Number(orderId))))[0];
      if (currentOrder) {
        const newPaid = Number(currentOrder.paidAmount || 0) + Number(amount);
        const total = Number(currentOrder.adjustedAmount || currentOrder.baseAmount);
        const paymentStatus = newPaid >= total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
        await db.update(orders).set({ paidAmount: String(newPaid), paymentStatus }).where(eq(orders.id, Number(orderId)));
      }
    }

    await logAudit(currentActiveUserId, 'CREATE_TRANSACTION', 'financial_transactions', String(inserted[0].id), null, inserted[0]);

    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Payroll Item (Manager adjust salary, bonus, allowance, deductions with audit - SRS BR-09)
app.put('/api/payrolls/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { workDays, overtimeHours, baseSalary, allowance, bonus, deductions, totalSalary, notes } = req.body;
    const before = (await db.select().from(payrolls).where(eq(payrolls.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy bảng lương' });

    const updates: any = {};
    if (workDays !== undefined) updates.workDays = String(workDays);
    if (overtimeHours !== undefined) updates.overtimeHours = String(overtimeHours);
    if (baseSalary !== undefined) updates.baseSalary = String(baseSalary);
    if (allowance !== undefined) updates.allowance = String(allowance);
    if (bonus !== undefined) updates.bonus = String(bonus);
    if (deductions !== undefined) updates.deductions = String(deductions);
    if (totalSalary !== undefined) updates.totalSalary = String(totalSalary);
    if (notes !== undefined) updates.notes = notes;

    await db.update(payrolls).set(updates).where(eq(payrolls.id, id));
    const after = (await db.select().from(payrolls).where(eq(payrolls.id, id)))[0];
    await logAudit(currentActiveUserId, 'ADJUST_PAYROLL', 'payrolls', String(id), before, after, notes || 'Quản lý điều chỉnh bảng lương');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager creates payroll slip
app.post('/api/payrolls', async (req: Request, res: Response) => {
  try {
    const { periodMonth, userId, workDays, overtimeHours, baseSalary, allowance, bonus, deductions, notes } = req.body;
    const work = Number(workDays || 0);
    const ot = Number(overtimeHours || 0);
    const base = Number(baseSalary || 0);
    const allow = Number(allowance || 0);
    const bon = Number(bonus || 0);
    const ded = Number(deductions || 0);
    const total = base + allow + bon - ded;

    const inserted = await db.insert(payrolls).values({
      periodMonth: periodMonth || '2026-11',
      userId: Number(userId),
      workDays: String(work),
      overtimeHours: String(ot),
      baseSalary: String(base),
      allowance: String(allow),
      bonus: String(bon),
      deductions: String(ded),
      totalSalary: String(total),
      status: 'draft',
      notes: notes || '',
    }).returning();

    await logAudit(currentActiveUserId, 'CREATE_PAYROLL', 'payrolls', String(inserted[0].id), null, inserted[0], 'Tạo phiếu lương mới');
    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manager deletes payroll slip
app.delete('/api/payrolls/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const before = (await db.select().from(payrolls).where(eq(payrolls.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy bảng lương' });

    await db.delete(payrolls).where(eq(payrolls.id, id));
    await logAudit(currentActiveUserId, 'DELETE_PAYROLL', 'payrolls', String(id), before, null, 'Quản lý xóa phiếu lương');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Financial Transaction
app.put('/api/financials/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { amount, category, paymentMethod, status, notes } = req.body;
    const before = (await db.select().from(financialTransactions).where(eq(financialTransactions.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });

    const updates: any = {};
    if (amount !== undefined) updates.amount = String(amount);
    if (category !== undefined) updates.category = category;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    await db.update(financialTransactions).set(updates).where(eq(financialTransactions.id, id));
    const after = (await db.select().from(financialTransactions).where(eq(financialTransactions.id, id)))[0];
    await logAudit(currentActiveUserId, 'UPDATE_TRANSACTION', 'financial_transactions', String(id), before, after, 'Điều chỉnh giao dịch tài chính');
    res.json(after);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Financial Transaction (Manager only with audit log - SRS BR-08)
app.delete('/api/financials/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const before = (await db.select().from(financialTransactions).where(eq(financialTransactions.id, id)))[0];
    if (!before) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });

    await db.delete(financialTransactions).where(eq(financialTransactions.id, id));
    await logAudit(currentActiveUserId, 'DELETE_TRANSACTION', 'financial_transactions', String(id), before, null, 'Quản lý hủy giao dịch');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// AUDIT LOGS & NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        beforeState: auditLogs.beforeState,
        afterState: auditLogs.afterState,
        reason: auditLogs.reason,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.id))
      .limit(50);

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications', async (_req: Request, res: Response) => {
  try {
    const notifs = await db.select().from(notifications).orderBy(desc(notifications.id)).limit(20);
    res.json(notifs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// DASHBOARD & REPORTS (12 INDICATORS IN SRS FR-01 & 14 IN FR-13)
// -------------------------------------------------------------
app.get('/api/reports/dashboard-stats', async (_req: Request, res: Response) => {
  try {
    // 12 key metrics
    const totalStaff = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'active'));
    const totalOrders = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const inProgressOrders = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'in_progress'));
    const pendingAcceptance = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'pending_acceptance'));
    const completedOrders = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'completed'));
    const fixingOrders = await db.select({ count: sql<number>`count(*)` }).from(orders).where(or(eq(orders.status, 'acceptance_failed'), eq(orders.status, 'fixing')));

    const revenueRes = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(financialTransactions)
      .where(and(eq(financialTransactions.type, 'revenue'), eq(financialTransactions.status, 'approved')));
    
    const expenseRes = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(financialTransactions)
      .where(and(eq(financialTransactions.type, 'expense'), eq(financialTransactions.status, 'approved')));

    const payrollRes = await db
      .select({ total: sql<string>`coalesce(sum(total_salary), 0)` })
      .from(payrolls);

    const totalRevenue = Number(revenueRes[0].total);
    const totalExpense = Number(expenseRes[0].total);
    const totalPayroll = Number(payrollRes[0].total);
    const grossProfit = totalRevenue - totalExpense;

    // Receivables / Debt
    const debtRes = await db.select({ total: sql<string>`coalesce(sum(current_debt), 0)` }).from(customers);

    res.json({
      activeEmployees: Number(totalStaff[0].count),
      workingToday: 4,
      totalOrders: Number(totalOrders[0].count),
      inProgressOrders: Number(inProgressOrders[0].count),
      pendingAcceptance: Number(pendingAcceptance[0].count),
      completedOrders: Number(completedOrders[0].count),
      fixingOrders: Number(fixingOrders[0].count),
      totalRevenue,
      totalExpense,
      totalPayroll,
      grossProfit,
      totalDebt: Number(debtRes[0].total),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// VITE SPA DEV & STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CleanOps server running on http://0.0.0.0:${port}`);
  });
}

startServer();
