import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ClipboardList, Clock, DollarSign, Users,
  Shield, Bell, Moon, Sun, Plus, Search, CheckCircle2,
  ChevronRight, MapPin, QrCode, Lock, Unlock,
  Sparkles, X, AlertTriangle, ExternalLink,
  CreditCard, Edit, Trash2, Tag, Check, ArrowRight
} from 'lucide-react';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { CustomerAcceptanceView } from './components/CustomerAcceptanceView.tsx';

// Status labels & color map for CleanOps 10 lifecycle stages
const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Mới tiếp nhận', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800' },
  confirmed: { label: 'Đã báo giá & xác nhận', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  assigned: { label: 'Đã phân công', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  in_progress: { label: 'Đang thực hiện', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  lead_checked: { label: 'Tổ trưởng đã kiểm tra', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' },
  pending_acceptance: { label: 'Chờ khách nghiệm thu (OTP)', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
  acceptance_failed: { label: 'Khách yêu cầu khắc phục', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
  fixing: { label: 'Đang khắc phục', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800' },
  completed: { label: 'Đã nghiệm thu / Hoàn thành', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  cancelled: { label: 'Đã hủy đơn', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' },
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'attendance' | 'financials' | 'payroll' | 'staff' | 'audit'>('dashboard');

  // Active current user state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Core data states
  const [stats, setStats] = useState<any>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrollsList, setPayrollsList] = useState<any[]>([]);
  const [financialsList, setFinancialsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Full Management Edit Modals
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [showAcceptancePortalToken, setShowAcceptancePortalToken] = useState<string | null>(null);
  
  // Checklist inline addition
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistNotes, setNewChecklistNotes] = useState('');

  // Customer Management
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Service Management
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Staff Management
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Payroll Management
  const [showNewPayrollModal, setShowNewPayrollModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<any>(null);

  // Financial Management
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // Attendance Management
  const [showNewAttendanceModal, setShowNewAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [showAdjustAttendanceModal, setShowAdjustAttendanceModal] = useState<any>(null);
  const [attendanceAdjustReason, setAttendanceAdjustReason] = useState('');
  const [attendanceAdjustStatus, setAttendanceAdjustStatus] = useState('adjusted');

  // In-app Delete Confirmation Dialog & Toast States (Replaces window.confirm/alert for iframe compatibility)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter states
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [orderSearchText, setOrderSearchText] = useState<string>('');

  // GPS loading
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchInitialData = async () => {
    try {
      const [uRes, allURes, statsRes, ordRes, custRes, srvRes, areaRes, teamsRes, attRes, leavesRes, payRes, finRes, audRes, notifRes] = await Promise.all([
        fetch('/api/me').then(r => r.json()),
        fetch('/api/users/all').then(r => r.json()),
        fetch('/api/reports/dashboard-stats').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/services').then(r => r.json()),
        fetch('/api/areas').then(r => r.json()),
        fetch('/api/teams').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
        fetch('/api/payrolls').then(r => r.json()),
        fetch('/api/financials').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
      ]);

      setCurrentUser(uRes);
      setAllUsers(allURes);
      setStats(statsRes);
      setOrdersList(ordRes);
      setCustomersList(custRes);
      setServicesList(srvRes);
      setAreasList(areaRes);
      setTeamsList(teamsRes);
      setAttendances(attRes);
      setLeaves(leavesRes);
      setPayrollsList(payRes);
      setFinancialsList(finRes);
      setAuditLogsList(audRes);
      setNotificationsList(notifRes);

      // If an order is already selected, re-fetch it
      if (selectedOrder?.id) {
        handleOrderSelect(selectedOrder.id);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const switchRole = async (userId: number) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        const [ordRes, payRes] = await Promise.all([
          fetch('/api/orders').then(r => r.json()),
          fetch('/api/payrolls').then(r => r.json()),
        ]);
        setOrdersList(ordRes);
        setPayrollsList(payRes);
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const handleOrderSelect = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      setSelectedOrder(json);
    } catch (err) {
      console.error('Failed to load order details:', err);
    }
  };

  const handleStatusChange = async (orderId: number, nextStatus: string, note: string = '') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus, note }),
      });
      if (res.ok) {
        fetchInitialData();
        handleOrderSelect(orderId);
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReasonInput.trim()) return;
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReasonInput }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        setCancelReasonInput('');
        fetchInitialData();
        handleOrderSelect(selectedOrder.id);
      } else {
        const err = await res.json();
        showToast(err.error, 'error');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    }
  };

  const handleGPSCheckIn = async (checkType: 'in' | 'out') => {
    setGpsLoading(true);
    setGpsMessage(null);

    if (!navigator.geolocation) {
      handleFallbackGPSCheckIn(checkType);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        try {
          const res = await fetch('/api/attendance/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              checkType,
              method: 'gps',
              latitude: lat,
              longitude: lng,
              locationName: `Tọa độ GPS (${lat}, ${lng})`,
            }),
          });
          if (res.ok) {
            setGpsMessage(`Đã chấm công ${checkType === 'in' ? 'VÀO CA' : 'RA CA'} thành công tại (${lat}, ${lng})`);
            const updated = await fetch('/api/attendance').then(r => r.json());
            setAttendances(updated);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.warn('Geolocation fallback:', error);
        handleFallbackGPSCheckIn(checkType);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleFallbackGPSCheckIn = async (checkType: 'in' | 'out') => {
    try {
      const lat = '10.795100';
      const lng = '106.721800';
      const res = await fetch('/api/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType,
          method: 'gps',
          latitude: lat,
          longitude: lng,
          locationName: 'Landmark 81, P.22, Bình Thạnh, TP.HCM',
        }),
      });
      if (res.ok) {
        setGpsMessage(`Đã chấm công ${checkType === 'in' ? 'VÀO CA' : 'RA CA'} thành công với vị trí công trình.`);
        const updated = await fetch('/api/attendance').then(r => r.json());
        setAttendances(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: number, isCompleted: boolean) => {
    try {
      await fetch(`/api/checklists/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (selectedOrder) {
        handleOrderSelect(selectedOrder.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!selectedOrder || !newChecklistTitle.trim()) return;
    try {
      await fetch(`/api/orders/${selectedOrder.id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemTitle: newChecklistTitle, notes: newChecklistNotes }),
      });
      setNewChecklistTitle('');
      setNewChecklistNotes('');
      handleOrderSelect(selectedOrder.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChecklistItem = (itemId: number) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Xóa hạng mục checklist',
      description: 'Hạng mục kiểm tra này sẽ bị xóa khỏi đơn hàng.',
      confirmText: 'Xóa hạng mục',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/checklists/${itemId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Đã xóa hạng mục checklist');
            if (selectedOrder) handleOrderSelect(selectedOrder.id);
          } else {
            showToast('Không thể xóa hạng mục', 'error');
          }
        } catch (e) {
          showToast('Lỗi kết nối khi xóa', 'error');
        }
      },
    });
  };

  const handleToggleLockPayroll = async (payrollId: number, currentlyLocked: boolean) => {
    try {
      await fetch(`/api/payrolls/${payrollId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lock: !currentlyLocked }),
      });
      const updated = await fetch('/api/payrolls').then(r => r.json());
      setPayrollsList(updated);
      showToast(currentlyLocked ? 'Đã mở khóa bảng lương' : 'Đã khóa bảng lương thành công');
    } catch (e) {
      showToast('Lỗi khi thao tác khóa bảng lương', 'error');
    }
  };

  const handleApproveStaff = async (userId: number) => {
    try {
      await fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      showToast('Đã duyệt nhân sự vào làm việc');
      fetchInitialData();
    } catch (e) {
      showToast('Lỗi khi duyệt nhân viên', 'error');
    }
  };

  const handleAdjustAttendance = async () => {
    if (!showAdjustAttendanceModal) return;
    try {
      await fetch(`/api/attendance/${showAdjustAttendanceModal.id}/adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: attendanceAdjustStatus,
          adjustedReason: attendanceAdjustReason || 'Quản lý điều chỉnh thời gian/tọa độ hợp lệ',
        }),
      });
      setShowAdjustAttendanceModal(null);
      setAttendanceAdjustReason('');
      showToast('Đã lưu điều chỉnh chấm công');
      const updated = await fetch('/api/attendance').then(r => r.json());
      setAttendances(updated);
      fetchInitialData();
    } catch (e) {
      showToast('Lỗi khi điều chỉnh chấm công', 'error');
    }
  };

  const handleDeleteTransaction = (transId: number) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Xác nhận xóa giao dịch tài chính',
      description: 'Hành động này sẽ xóa giao dịch khỏi sổ quỹ và lưu vết kiểm toán.',
      confirmText: 'Xóa giao dịch',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/financials/${transId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Đã xóa giao dịch tài chính thành công');
            fetchInitialData();
          } else {
            showToast('Không thể xóa giao dịch', 'error');
          }
        } catch (e) {
          showToast('Lỗi kết nối khi xóa', 'error');
        }
      },
    });
  };

  const handleDeleteOrder = (orderId: number) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Xóa vĩnh viễn đơn hàng',
      description: 'Tất cả checklist, phân công nhân sự và nhật ký liên quan đến đơn hàng này sẽ được xóa sạch khỏi hệ thống.',
      confirmText: 'Xóa vĩnh viễn đơn',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Đã xóa đơn hàng thành công');
            if (selectedOrder?.id === orderId) {
              setSelectedOrder(null);
            }
            fetchInitialData();
          } else {
            const err = await res.json();
            showToast(err.error || 'Xóa đơn hàng thất bại', 'error');
          }
        } catch (e) {
          showToast('Lỗi khi xóa đơn hàng', 'error');
        }
      },
    });
  };

  const handleDeleteStaff = (userId: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      title: `Xóa tài khoản nhân viên "${name}"`,
      description: 'Toàn bộ tài khoản và hồ sơ nhân sự này sẽ bị xóa khỏi hệ thống.',
      confirmText: 'Xóa tài khoản',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast(`Đã xóa nhân viên ${name} thành công`);
            fetchInitialData();
          } else {
            const err = await res.json();
            showToast(err.error || 'Xóa nhân viên thất bại', 'error');
          }
        } catch (e) {
          showToast('Lỗi khi xóa nhân viên', 'error');
        }
      },
    });
  };

  const handleDeleteAttendance = (attId: number) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Xóa lượt chấm công',
      description: 'Bản ghi chấm công này sẽ bị xóa vĩnh viễn và lưu nhật ký kiểm toán.',
      confirmText: 'Xóa chấm công',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/attendance/${attId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Đã xóa lượt chấm công thành công');
            fetchInitialData();
          } else {
            showToast('Không thể xóa chấm công', 'error');
          }
        } catch (e) {
          showToast('Lỗi khi xóa chấm công', 'error');
        }
      },
    });
  };

  const handleDeleteCustomer = (custId: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      title: `Xóa khách hàng "${name}"`,
      description: 'Hồ sơ khách hàng sẽ bị gỡ bỏ khỏi hệ thống CRM.',
      confirmText: 'Xóa khách hàng',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/customers/${custId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast(`Đã xóa khách hàng ${name}`);
            fetchInitialData();
          } else {
            const err = await res.json();
            showToast(err.error || 'Không thể xóa khách hàng', 'error');
          }
        } catch (e) {
          showToast('Lỗi khi xóa khách hàng', 'error');
        }
      },
    });
  };

  const handleDeleteService = (srvId: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      title: `Xóa gói dịch vụ "${name}"`,
      description: 'Nếu dịch vụ đã có đơn hàng lịch sử, hệ thống sẽ tự động chuyển sang trạng thái Ngừng kinh doanh.',
      confirmText: 'Xóa dịch vụ',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/services/${srvId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.message) {
            showToast(data.message, 'info');
          } else {
            showToast(`Đã xóa gói dịch vụ ${name}`);
          }
          fetchInitialData();
        } catch (e) {
          showToast('Lỗi khi xóa dịch vụ', 'error');
        }
      },
    });
  };

  const handleDeletePayroll = (payId: number) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Xóa phiếu lương',
      description: 'Phiếu lương này sẽ bị xóa khỏi kỳ quyết toán này.',
      confirmText: 'Xóa phiếu lương',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/payrolls/${payId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Đã xóa phiếu lương thành công');
            fetchInitialData();
          } else {
            showToast('Không thể xóa phiếu lương', 'error');
          }
        } catch (e) {
          showToast('Lỗi khi xóa phiếu lương', 'error');
        }
      },
    });
  };

  // Filter orders
  const filteredOrders = ordersList.filter((ord) => {
    const matchStatus = orderFilterStatus === 'all' || ord.status === orderFilterStatus;
    const matchSearch =
      !orderSearchText.trim() ||
      ord.orderNumber.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      ord.customer?.name?.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      ord.address.toLowerCase().includes(orderSearchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* -------------------------------------------------------------------------------- */}
      {/* TOP BAR CONTRACT: Brand Wordmark — 5 Single-Line Links — Primary Actions */}
      {/* -------------------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              CleanOps
            </span>
          </div>

          {/* Zone 2: Single-line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
              { id: 'orders', label: 'Đơn hàng & Điều phối', icon: ClipboardList },
              { id: 'attendance', label: 'Chấm công GPS', icon: Clock },
              { id: 'financials', label: 'Thu chi & Công nợ', icon: DollarSign },
              { id: 'payroll', label: 'Bảng lương', icon: CreditCard },
              { id: 'staff', label: 'Nhân sự & CRM', icon: Users },
              { id: 'audit', label: 'Kiểm toán & Log', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Quick Role Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Demo Role Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-medium">
              <span className="text-slate-400 px-1.5 font-normal">Vai trò:</span>
              <button
                onClick={() => switchRole(1)}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  currentUser?.role === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                👑 Quản lý
              </button>
              <button
                onClick={() => switchRole(2)}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  currentUser?.role === 'lead'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📋 Tổ trưởng
              </button>
              <button
                onClick={() => switchRole(4)}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  currentUser?.role === 'worker'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🧹 Công nhân
              </button>
            </div>

            {/* Notification trigger */}
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4" />
              {notificationsList.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* PWA In-App Install Prompt */}
            <PWAInstallButton />

            {/* Primary Action Button */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo đơn mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation scroller */}
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'dashboard', label: 'Tổng quan' },
            { id: 'orders', label: 'Đơn hàng' },
            { id: 'attendance', label: 'Chấm công' },
            { id: 'financials', label: 'Thu chi' },
            { id: 'payroll', label: 'Lương' },
            { id: 'staff', label: 'Nhân sự & Dịch vụ' },
            { id: 'audit', label: 'Kiểm toán' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* -------------------------------------------------------------------------------- */}
      {/* NOTIFICATION DRAWER */}
      {/* -------------------------------------------------------------------------------- */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full p-5 shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thông báo nội bộ CleanOps</h3>
              </div>
              <button onClick={() => setShowNotifDrawer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {notificationsList.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MAIN VIEWPORT */}
      {/* -------------------------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* User Scope Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
              alt={currentUser?.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.name}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {currentUser?.role === 'admin' ? 'Quản lý / Điều phối' : currentUser?.role === 'lead' ? 'Tổ trưởng' : 'Công nhân'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser?.role === 'admin'
                  ? 'Toàn quyền chỉnh sửa: Đơn hàng, Giá dịch vụ, Khách hàng, Bảng lương, Nhân sự & Tài chính'
                  : currentUser?.role === 'lead'
                  ? 'Phạm vi: Nhóm & đơn hàng được phân công phụ trách'
                  : 'Phạm vi: Xem lịch cá nhân, tự chấm công GPS & phiếu lương'}
              </p>
            </div>
          </div>

          {/* Quick GPS Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGPSCheckIn('in')}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Chấm công VÀO CA</span>
            </button>
            <button
              onClick={() => handleGPSCheckIn('out')}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chấm công RA CA</span>
            </button>
          </div>
        </div>

        {gpsMessage && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {gpsMessage}
            </span>
            <button onClick={() => setGpsMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 1: TỔNG QUAN (DASHBOARD - 12 METRICS FROM SRS FR-01) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* 12 Key Indicators Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { title: 'Nhân viên hoạt động', value: stats.activeEmployees, unit: 'người', sub: 'Quy mô 10-30 người', trend: 'up' },
                { title: 'Đang làm việc hôm nay', value: stats.workingToday, unit: 'người', sub: 'Chấm công GPS hợp lệ', trend: 'up' },
                { title: 'Tổng đơn hàng', value: stats.totalOrders, unit: 'đơn', sub: 'Tháng 11/2026', trend: 'neutral' },
                { title: 'Đang thực hiện', value: stats.inProgressOrders, unit: 'đơn', sub: 'Tại công trình', trend: 'neutral' },
                { title: 'Chờ khách nghiệm thu', value: stats.pendingAcceptance, unit: 'đơn', sub: 'Đã gửi link OTP', trend: 'up' },
                { title: 'Đơn cần khắc phục', value: stats.fixingOrders, unit: 'đơn', sub: 'Khách báo lỗi BR-05', trend: 'alert' },
                { title: 'Đã hoàn thành', value: stats.completedOrders, unit: 'đơn', sub: 'Nghiệm thu 100%', trend: 'up' },
                { title: 'Doanh thu thu vào', value: (stats.totalRevenue / 1000000).toFixed(1), unit: 'tr đ', sub: 'Tiền cọc + thanh toán', trend: 'up' },
                { title: 'Chi phí trực tiếp', value: (stats.totalExpense / 1000000).toFixed(1), unit: 'tr đ', sub: 'Vật tư, máy móc, xe', trend: 'neutral' },
                { title: 'Lợi nhuận gộp đơn', value: (stats.grossProfit / 1000000).toFixed(1), unit: 'tr đ', sub: 'Doanh thu - chi phí', trend: 'up' },
                { title: 'Quỹ lương tháng', value: (stats.totalPayroll / 1000000).toFixed(1), unit: 'tr đ', sub: 'Lương nhân sự', trend: 'neutral' },
                { title: 'Công nợ chưa thu', value: (stats.totalDebt / 1000000).toFixed(1), unit: 'tr đ', sub: 'Cần nhắc thanh toán', trend: 'alert' },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <span className="text-[11px] font-medium text-slate-500 leading-tight">{kpi.title}</span>
                  <div className="my-2">
                    <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                      {kpi.value}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">{kpi.unit}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${kpi.trend === 'alert' ? 'text-rose-600' : 'text-slate-400'}`}>
                    {kpi.sub}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Action Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Highlight: Customer Acceptance link ready */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-purple-300" />
                  <span className="text-xs uppercase tracking-wider font-bold text-purple-200">Cổng nghiệm thu trực tuyến</span>
                </div>
                <h3 className="text-base font-bold mb-1">Đơn Landmark 81 đang chờ khách nghiệm thu</h3>
                <p className="text-xs text-purple-200 leading-relaxed mb-4">
                  Khách hàng nhận link và mã OTP để kiểm tra ảnh trước/sau, đánh giá đạt/chưa đạt và ký chữ ký số cảm ứng.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAcceptancePortalToken('token-landmark-002')}
                    className="px-3.5 py-2 bg-white text-purple-900 rounded-xl text-xs font-bold hover:bg-purple-50 transition-colors flex items-center gap-1.5"
                  >
                    <span>Mở thử cổng nghiệm thu OTP</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Highlight: Active job in progress */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-900 to-slate-900 text-white relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  <span className="text-xs uppercase tracking-wider font-bold text-sky-200">Công trình đang thi công</span>
                </div>
                <h3 className="text-base font-bold mb-1">Biệt thự Thảo Điền (Đội Cơ Động 1)</h3>
                <p className="text-xs text-sky-200 leading-relaxed mb-4">
                  Trần Văn Hùng (Tổ trưởng) cùng 2 nhân viên đang hoàn tất checklist vệ sinh sàn đá và kính.
                </p>
                <button
                  onClick={() => { setActiveTab('orders'); handleOrderSelect(1); }}
                  className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>Xem tiến độ checklist</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đơn hàng theo dõi gần đây</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tiến độ 10 trạng thái theo quy trình vận hành SRS</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-sky-600 font-semibold hover:underline"
                >
                  Xem tất cả đơn →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium pb-2">
                      <th className="py-2.5 px-3">Mã đơn</th>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Dịch vụ</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ordersList.slice(0, 5).map((o) => {
                      const st = ORDER_STATUS_MAP[o.status] || ORDER_STATUS_MAP.new;
                      return (
                        <tr
                          key={o.id}
                          onClick={() => { setActiveTab('orders'); handleOrderSelect(o.id); }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-sky-600">{o.orderNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{o.customer?.name}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{o.service?.name}</td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(o.scheduledStart).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.bg} ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {Number(o.adjustedAmount || o.baseAmount).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 2: ĐƠN HÀNG & ĐIỀU PHỐI (ORDERS & LIFECYCLE) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Controls Bar: Search & Status Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên khách hàng, địa chỉ..."
                  value={orderSearchText}
                  onChange={(e) => setOrderSearchText(e.target.value)}
                  className="w-full text-xs bg-transparent border-0 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Status Segmented Filter */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs py-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'new', label: 'Mới' },
                  { id: 'assigned', label: 'Đã phân công' },
                  { id: 'in_progress', label: 'Đang làm' },
                  { id: 'pending_acceptance', label: 'Chờ nghiệm thu' },
                  { id: 'fixing', label: 'Khắc phục' },
                  { id: 'completed', label: 'Hoàn thành' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilterStatus(f.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      orderFilterStatus === f.id
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Orders List + Order Detail Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Order Cards List */}
              <div className="lg:col-span-5 space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                  </div>
                ) : (
                  filteredOrders.map((ord) => {
                    const st = ORDER_STATUS_MAP[ord.status] || ORDER_STATUS_MAP.new;
                    const isSelected = selectedOrder?.id === ord.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => handleOrderSelect(ord.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-sky-600">{ord.orderNumber}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{ord.customer?.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-2.5">{ord.address}</p>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                          <span>{ord.service?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                              {Number(ord.adjustedAmount || ord.baseAmount).toLocaleString('vi-VN')} đ
                            </span>
                            {currentUser?.role === 'admin' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOrder(ord.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Xóa đơn hàng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Order Detail View */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                {selectedOrder ? (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-sky-600">{selectedOrder.orderNumber}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ORDER_STATUS_MAP[selectedOrder.status]?.bg} ${ORDER_STATUS_MAP[selectedOrder.status]?.color}`}>
                            {ORDER_STATUS_MAP[selectedOrder.status]?.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedOrder.customer?.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.address}</p>
                      </div>

                      {/* Action buttons based on Role & State */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Manager Full Edit Button */}
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => setShowEditOrderModal(true)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-lg border border-sky-200 dark:border-sky-800 font-semibold transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa đơn</span>
                          </button>
                        )}

                        {/* Manager Delete Order Button */}
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteOrder(selectedOrder.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg border border-rose-200 dark:border-rose-800 font-semibold transition-colors"
                            title="Xóa vĩnh viễn đơn hàng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa đơn</span>
                          </button>
                        )}

                        {/* Cancel button (Admin only, mandatory reason) */}
                        {currentUser?.role === 'admin' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
                          >
                            Hủy đơn
                          </button>
                        )}

                        {/* Customer Acceptance Portal Link button */}
                        <button
                          onClick={() => setShowAcceptancePortalToken(selectedOrder.acceptanceToken)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Link Nghiệm thu</span>
                        </button>
                      </div>
                    </div>

                    {/* Operational Lifecycle Progress Bar */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Tiến trình vận hành</span>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {selectedOrder.status === 'new' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder.id, 'confirmed', 'Đã xác nhận và báo giá cho khách')}
                            className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Xác nhận & Báo giá →
                          </button>
                        )}
                        {selectedOrder.status === 'confirmed' && (
                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Phân công nhân sự →
                          </button>
                        )}
                        {selectedOrder.status === 'assigned' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder.id, 'in_progress', 'Bắt đầu triển khai tại công trình')}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Bắt đầu thực hiện →
                          </button>
                        )}
                        {selectedOrder.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder.id, 'lead_checked', 'Tổ trưởng đã đối chiếu checklist xong')}
                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Tổ trưởng kiểm tra xong →
                          </button>
                        )}
                        {selectedOrder.status === 'lead_checked' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder.id, 'pending_acceptance', 'Tạo link & OTP gửi cho khách')}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Gửi khách nghiệm thu OTP →
                          </button>
                        )}
                        {selectedOrder.status === 'acceptance_failed' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder.id, 'fixing', 'Đội ngũ đang tiến hành khắc phục')}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Bắt đầu khắc phục →
                          </button>
                        )}
                        {selectedOrder.status === 'fixing' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder.id, 'pending_acceptance', 'Đã khắc phục xong, gửi lại OTP')}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Gửi nghiệm thu lại →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Personnel Assigned */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Nhân sự thực hiện</span>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="text-xs text-sky-600 font-semibold hover:underline"
                          >
                            + Phân công thêm
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedOrder.assignedStaff?.map((st: any) => (
                          <div key={st.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{st.name}</p>
                              <span className="text-[10px] text-slate-500">{st.roleInOrder === 'leader' ? 'Tổ trưởng phụ trách' : 'Nhân viên thực hiện'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checklists with Photographic Evidence and Edit/Add/Delete */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Checklist kiểm soát chất lượng (QC)</span>
                        <span className="text-[11px] text-slate-500">
                          {selectedOrder.checklists?.filter((c: any) => c.isCompleted).length} / {selectedOrder.checklists?.length} hoàn thành
                        </span>
                      </div>
                      
                      {/* Inline Add Checklist Item (SRS FR-09 customizable per order) */}
                      {currentUser?.role === 'admin' && (
                        <div className="p-3 mb-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            placeholder="Thêm hạng mục việc cần làm (VD: Tẩy ố gương, giặt thảm...)"
                            value={newChecklistTitle}
                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                            className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={handleAddChecklistItem}
                            disabled={!newChecklistTitle.trim()}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          >
                            + Thêm hạng mục
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        {selectedOrder.checklists?.map((item: any) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                                  className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                                />
                                <div>
                                  <p className={`text-xs font-medium ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                    {item.itemTitle}
                                  </p>
                                  {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
                                </div>
                              </label>

                              <div className="flex items-center gap-2">
                                {item.customerApproved !== null && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                    item.customerApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    Khách: {item.customerApproved ? 'Đạt' : 'Chưa đạt'}
                                  </span>
                                )}

                                {currentUser?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteChecklistItem(item.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                    title="Xóa hạng mục"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Photo attachments */}
                            {(item.beforePhotoUrl || item.afterPhotoUrl) && (
                              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                {item.beforePhotoUrl && (
                                  <div>
                                    <span className="text-[10px] text-slate-400 block mb-1">Ảnh trước khi làm</span>
                                    <img src={item.beforePhotoUrl} alt="Trước" className="h-16 w-full object-cover rounded-lg" />
                                  </div>
                                )}
                                {item.afterPhotoUrl && (
                                  <div>
                                    <span className="text-[10px] text-emerald-600 block mb-1">Ảnh sau khi làm</span>
                                    <img src={item.afterPhotoUrl} alt="Sau" className="h-16 w-full object-cover rounded-lg" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Audit History */}
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Nhật ký trạng thái (Audit Trail)</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedOrder.history?.map((h: any) => (
                          <div key={h.id} className="text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{h.note}</p>
                              <span className="text-[10px] text-slate-400">{h.fromStatus} → {h.toStatus}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(h.changedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Chọn một đơn hàng bên trái để xem chi tiết tiến độ, checklist và điều phối.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 3: CHẤM CÔNG GPS & LỊCH LÀM (ATTENDANCE & LEAVE) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bảng ghi nhận chấm công GPS</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Vị trí ghi nhận tại thời điểm chấm công theo quy định SRS FR-07 & BR-09</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">Tổng cộng: {attendances.length} lượt</span>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => setShowNewAttendanceModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Chấm công bổ sung</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Nhân sự</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3">Địa điểm / Tọa độ</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      {currentUser?.role === 'admin' && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{att.userName}</p>
                          <span className="text-[10px] text-slate-400">{att.userRole}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.checkType === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {att.checkType === 'in' ? 'VÀO CA' : 'RA CA'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {new Date(att.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-semibold text-slate-500">
                          {att.method}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {att.locationName || `Lat: ${att.latitude}, Lng: ${att.longitude}`}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {att.status === 'valid' ? 'Hợp lệ' : att.status}
                          </span>
                        </td>
                        {currentUser?.role === 'admin' && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingAttendance(att)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Chỉnh sửa bản ghi chấm công"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAttendance(att.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"
                                title="Xóa bản ghi chấm công"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave Requests Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đơn xin nghỉ phép & Vắng mặt</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nhân viên gửi yêu cầu trên app · Quản lý và Tổ trưởng xác nhận</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leaves.map((l) => (
                  <div key={l.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{l.userName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">Lý do: {l.reason}</p>
                      <p className="text-[11px] text-slate-400">
                        Thời gian: {new Date(l.startDate).toLocaleDateString('vi-VN')} → {new Date(l.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {currentUser?.role === 'admin' && l.status === 'pending' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={async () => {
                            await fetch(`/api/leaves/${l.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'approved' }),
                            });
                            fetchInitialData();
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Duyệt nghỉ phép
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 4: THU CHI & CÔNG NỢ (FINANCIALS - FR-11) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Quản lý Dòng tiền & Công nợ</h3>
                <p className="text-xs text-slate-500 mt-0.5">Doanh thu, chi phí vật tư máy móc, đặt cọc và đối soát công nợ</p>
              </div>
              <button
                onClick={() => setShowNewTransactionModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận thu / chi</span>
              </button>
            </div>

            {/* Financial Transactions Ledger with Edit & Delete */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Hạng mục</th>
                      <th className="py-2.5 px-3">Đơn hàng / Khách hàng</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3 text-right">Số tiền</th>
                      {currentUser?.role === 'admin' && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {financialsList.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {new Date(f.transactionDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.type === 'revenue' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {f.type === 'revenue' ? '+ THU VÀO' : '- CHI PHÍ'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                          {f.category}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {f.orderNumber || f.customerName || 'Chi phí chung công ty'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {f.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                          f.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {f.type === 'revenue' ? '+' : '-'}{Number(f.amount).toLocaleString('vi-VN')} đ
                        </td>
                        {currentUser?.role === 'admin' && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingTransaction(f)}
                                className="p-1 text-slate-400 hover:text-sky-600"
                                title="Sửa giao dịch"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(f.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Xóa giao dịch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 5: BẢNG LƯƠNG (PAYROLL - FR-10) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Bảng lương & Quyết toán kỳ Tháng 11/2026</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentUser?.role === 'admin'
                    ? 'Quản lý có quyền tạo phiếu lương, chỉnh sửa ngày công, phụ cấp, thưởng, phạt, khóa sổ và xóa phiếu lương'
                    : 'Nhân viên: Chỉ hiển thị phiếu lương cá nhân của bạn (Bảo mật quyền riêng tư)'}
                </p>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setShowNewPayrollModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tạo phiếu lương mới</span>
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Nhân sự</th>
                      <th className="py-2.5 px-3">Ngày công</th>
                      <th className="py-2.5 px-3">Tăng ca</th>
                      <th className="py-2.5 px-3">Lương cơ bản</th>
                      <th className="py-2.5 px-3">Phụ cấp & Thưởng</th>
                      <th className="py-2.5 px-3">Khấu trừ</th>
                      <th className="py-2.5 px-3 text-right">Tổng thực lĩnh</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      {currentUser?.role === 'admin' && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payrollsList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{p.userName}</p>
                          <span className="text-[10px] text-slate-400">{p.bankName} - {p.bankAccount}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">{p.workDays} ngày</td>
                        <td className="py-3 px-3 font-mono">{p.overtimeHours} giờ</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {Number(p.baseSalary).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-600">
                          +{(Number(p.allowance) + Number(p.bonus)).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 font-mono text-rose-600">
                          -{Number(p.deductions || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sky-600 text-sm tabular-nums">
                          {Number(p.totalSalary).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'locked' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status === 'locked' ? 'ĐÃ KHÓA' : 'DỰ THẢO'}
                          </span>
                        </td>
                        {currentUser?.role === 'admin' && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingPayroll(p)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Chỉnh sửa bảng lương"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleLockPayroll(p.id, p.status === 'locked')}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  p.status === 'locked'
                                    ? 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    : 'text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950'
                                }`}
                                title={p.status === 'locked' ? 'Mở khóa bảng lương' : 'Khóa bảng lương'}
                              >
                                {p.status === 'locked' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeletePayroll(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"
                                title="Xóa phiếu lương"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 6: NHÂN SỰ & CRM & DỊCH VỤ (STAFF, CRM & SERVICES CATALOG) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Services & Pricing Catalog Section (Full Manager Edit) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bảng giá & Danh mục dịch vụ chuẩn (SRS FR-04)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Giá mẫu niêm yết và checklist mặc định được tự động gắn khi tạo đơn hàng mới</p>
                </div>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowNewServiceModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm dịch vụ</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {servicesList.map((srv) => (
                  <div key={srv.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-sky-600">{srv.code}</span>
                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingService(srv)}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded-md"
                              title="Sửa dịch vụ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(srv.id, srv.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                              title="Xóa dịch vụ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{srv.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{srv.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Đơn vị: {srv.unit}</span>
                      <span className="text-xs font-bold font-mono text-sky-600 tabular-nums">
                        {Number(srv.basePrice).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff list with Edit / Create */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Danh sách nhân sự & Tài khoản (SRS FR-02)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quản lý lương, ngân hàng, hình thức hợp đồng và phê duyệt tài khoản</p>
                </div>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowNewStaffModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm nhân sự & tài khoản</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allUsers.map((u) => (
                  <div key={u.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.phone}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold mt-1 inline-block">
                            {u.role === 'admin' ? 'Quản lý' : u.role === 'lead' ? 'Tổ trưởng' : 'Công nhân'}
                          </span>
                        </div>
                      </div>

                      {currentUser?.role === 'admin' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingStaff(u)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded-md"
                            title="Sửa hồ sơ nhân sự"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteStaff(u.id, u.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                              title="Xóa tài khoản nhân sự"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <span className={`text-[10px] font-bold ${u.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {u.status === 'active' ? 'Đang hoạt động' : 'Chờ duyệt'}
                      </span>
                      {currentUser?.role === 'admin' && u.status === 'pending' && (
                        <button
                          onClick={() => handleApproveStaff(u.id)}
                          className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700"
                        >
                          Duyệt vào làm
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customers list with Edit / Create */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Danh mục khách hàng & Đối soát công nợ (SRS FR-03)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cảnh báo trùng số điện thoại theo quy định SRS FR-03</p>
                </div>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowNewCustomerModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm khách hàng</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Mã KH</th>
                      <th className="py-2.5 px-3">Tên khách hàng</th>
                      <th className="py-2.5 px-3">Điện thoại</th>
                      <th className="py-2.5 px-3">Địa chỉ công trình</th>
                      <th className="py-2.5 px-3 text-right">Tổng chi tiêu</th>
                      <th className="py-2.5 px-3 text-right">Công nợ hiện tại</th>
                      {currentUser?.role === 'admin' && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customersList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-sky-600">{c.code}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{c.phone}</td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{c.address}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                          {Number(c.totalSpent).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                          {Number(c.currentDebt).toLocaleString('vi-VN')} đ
                        </td>
                        {currentUser?.role === 'admin' && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingCustomer(c)}
                                className="p-1 text-slate-400 hover:text-sky-600 rounded-md"
                                title="Chỉnh sửa khách hàng"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id, c.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                                title="Xóa khách hàng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------------ */}
        {/* TAB 7: KIỂM TOÁN & LOG (AUDIT TRAIL - FR-14) */}
        {/* ------------------------------------------------------------------------------ */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Nhật ký kiểm toán hệ thống (Audit Logs)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưu trữ bất biến mọi hành động quan trọng: Hủy đơn, sửa giá, điều chỉnh chấm công, khóa bảng lương (SRS BR-08, BR-09, NFR-06)
                </p>
              </div>

              <div className="space-y-2">
                {auditLogsList.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sky-600">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">
                      Bởi <strong>{log.userName || 'Hệ thống'}</strong> trên đối tượng <strong>{log.targetType} #{log.targetId}</strong>
                    </p>
                    {log.reason && (
                      <p className="text-slate-500 text-[11px] mt-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        Lý do ghi nhận: {log.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: FULL ORDER EDIT (MANAGER EDIT EVERYTHING) */}
      {/* -------------------------------------------------------------------------------- */}
      {showEditOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chỉnh sửa toàn bộ đơn hàng #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setShowEditOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const payload = {
                  customerId: formData.get('customerId'),
                  serviceId: formData.get('serviceId'),
                  address: formData.get('address'),
                  areaId: formData.get('areaId'),
                  scheduledStart: formData.get('scheduledStart'),
                  scheduledEnd: formData.get('scheduledEnd'),
                  baseAmount: formData.get('baseAmount'),
                  adjustedAmount: formData.get('adjustedAmount'),
                  adjustmentReason: formData.get('adjustmentReason'),
                  status: formData.get('status'),
                  paymentStatus: formData.get('paymentStatus'),
                  notes: formData.get('notes'),
                  specialRequests: formData.get('specialRequests'),
                };

                const res = await fetch(`/api/orders/${selectedOrder.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  setShowEditOrderModal(false);
                  fetchInitialData();
                  handleOrderSelect(selectedOrder.id);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Khách hàng</label>
                  <select name="customerId" defaultValue={selectedOrder.customerId} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {customersList.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Dịch vụ vệ sinh</label>
                  <select name="serviceId" defaultValue={selectedOrder.serviceId} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {servicesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ thi công</label>
                <input
                  type="text"
                  name="address"
                  required
                  defaultValue={selectedOrder.address}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái vòng đời</label>
                  <select name="status" defaultValue={selectedOrder.status} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {Object.entries(ORDER_STATUS_MAP).map(([val, opt]) => (
                      <option key={val} value={val}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái thanh toán</label>
                  <select name="paymentStatus" defaultValue={selectedOrder.paymentStatus} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="unpaid">Chưa thanh toán</option>
                    <option value="partial">Thanh toán một phần (Đã cọc)</option>
                    <option value="paid">Đã thanh toán đủ 100%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    name="scheduledStart"
                    defaultValue={selectedOrder.scheduledStart ? new Date(selectedOrder.scheduledStart).toISOString().slice(0, 16) : ''}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    name="scheduledEnd"
                    defaultValue={selectedOrder.scheduledEnd ? new Date(selectedOrder.scheduledEnd).toISOString().slice(0, 16) : ''}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giá gốc niêm yết (đ)</label>
                  <input
                    type="number"
                    name="baseAmount"
                    defaultValue={Number(selectedOrder.baseAmount)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giá chốt sau điều chỉnh (đ)</label>
                  <input
                    type="number"
                    name="adjustedAmount"
                    defaultValue={Number(selectedOrder.adjustedAmount || selectedOrder.baseAmount)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lý do điều chỉnh giá / nội dung (SRS BR-09)</label>
                <input
                  type="text"
                  name="adjustmentReason"
                  defaultValue={selectedOrder.adjustmentReason || ''}
                  placeholder="Ví dụ: Giảm 10% khách hàng thân thiết, diện tích thực tế tăng..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú & Yêu cầu đặc biệt</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={selectedOrder.notes || ''}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditOrderModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu thay đổi đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: EDIT CUSTOMER */}
      {/* -------------------------------------------------------------------------------- */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Chỉnh sửa khách hàng {editingCustomer.code}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch(`/api/customers/${editingCustomer.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    address: formData.get('address'),
                    contactPerson: formData.get('contactPerson'),
                    currentDebt: formData.get('currentDebt'),
                    notes: formData.get('notes'),
                  }),
                });
                setEditingCustomer(null);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tên khách hàng</label>
                <input name="name" defaultValue={editingCustomer.name} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Điện thoại</label>
                  <input name="phone" defaultValue={editingCustomer.phone} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Công nợ hiện tại (đ)</label>
                  <input name="currentDebt" type="number" defaultValue={Number(editingCustomer.currentDebt || 0)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-rose-600" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ</label>
                <input name="address" defaultValue={editingCustomer.address} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                <input name="notes" defaultValue={editingCustomer.notes || ''} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: EDIT SERVICE */}
      {/* -------------------------------------------------------------------------------- */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Chỉnh sửa dịch vụ {editingService.code}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch(`/api/services/${editingService.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    category: formData.get('category'),
                    unit: formData.get('unit'),
                    basePrice: formData.get('basePrice'),
                    description: formData.get('description'),
                  }),
                });
                setEditingService(null);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tên dịch vụ</label>
                <input name="name" defaultValue={editingService.name} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Đơn vị tính</label>
                  <input name="unit" defaultValue={editingService.unit} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giá niêm yết (đ)</label>
                  <input name="basePrice" type="number" defaultValue={Number(editingService.basePrice)} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-sky-600" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả công việc</label>
                <textarea name="description" rows={2} defaultValue={editingService.description || ''} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingService(null)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Lưu dịch vụ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: EDIT STAFF PROFILE */}
      {/* -------------------------------------------------------------------------------- */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Chỉnh sửa nhân sự: {editingStaff.name}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch(`/api/users/${editingStaff.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    role: formData.get('role'),
                    status: formData.get('status'),
                    salaryType: formData.get('salaryType'),
                    baseRate: formData.get('baseRate'),
                    bankAccount: formData.get('bankAccount'),
                    bankName: formData.get('bankName'),
                    notes: formData.get('notes'),
                  }),
                });
                setEditingStaff(null);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Họ tên nhân viên</label>
                <input name="name" defaultValue={editingStaff.name} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Điện thoại</label>
                  <input name="phone" defaultValue={editingStaff.phone} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Vai trò</label>
                  <select name="role" defaultValue={editingStaff.role} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="worker">Công nhân</option>
                    <option value="lead">Tổ trưởng</option>
                    <option value="admin">Quản lý / Điều phối</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Hình thức lương</label>
                  <select name="salaryType" defaultValue={editingStaff.salaryType || 'daily'} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="daily">Lương ngày / công nhật</option>
                    <option value="monthly">Lương tháng cố định</option>
                    <option value="per_order">Lương theo đơn hàng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mức lương cơ bản (đ)</label>
                  <input name="baseRate" type="number" defaultValue={Number(editingStaff.baseRate || 350000)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ngân hàng</label>
                  <input name="bankName" defaultValue={editingStaff.bankName || ''} placeholder="Vietcombank, MB..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Số tài khoản</label>
                  <input name="bankAccount" defaultValue={editingStaff.bankAccount || ''} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingStaff(null)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Lưu hồ sơ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: EDIT PAYROLL ITEM (SRS BR-09 AUDIT) */}
      {/* -------------------------------------------------------------------------------- */}
      {editingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Chỉnh sửa bảng lương: {editingPayroll.userName}</h3>
            <p className="text-xs text-slate-500 mb-4">Mọi sửa đổi về công, tăng ca và thưởng phạt sẽ được ghi vào nhật ký kiểm toán BR-09.</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const workDays = Number(formData.get('workDays'));
                const overtimeHours = Number(formData.get('overtimeHours'));
                const baseSalary = Number(formData.get('baseSalary'));
                const allowance = Number(formData.get('allowance'));
                const bonus = Number(formData.get('bonus'));
                const deductions = Number(formData.get('deductions'));
                const totalSalary = baseSalary + allowance + bonus - deductions;

                await fetch(`/api/payrolls/${editingPayroll.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workDays,
                    overtimeHours,
                    baseSalary,
                    allowance,
                    bonus,
                    deductions,
                    totalSalary,
                    notes: formData.get('notes'),
                  }),
                });
                setEditingPayroll(null);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày công</label>
                  <input name="workDays" type="number" step="0.5" defaultValue={Number(editingPayroll.workDays)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giờ tăng ca</label>
                  <input name="overtimeHours" type="number" step="0.5" defaultValue={Number(editingPayroll.overtimeHours)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lương cơ bản / công nhật (đ)</label>
                <input name="baseSalary" type="number" defaultValue={Number(editingPayroll.baseSalary)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phụ cấp ăn ở, xe (đ)</label>
                  <input name="allowance" type="number" defaultValue={Number(editingPayroll.allowance || 0)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-emerald-600" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thưởng chuyên cần (đ)</label>
                  <input name="bonus" type="number" defaultValue={Number(editingPayroll.bonus || 0)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-emerald-600" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Khấu trừ / Phạt vi phạm (đ)</label>
                <input name="deductions" type="number" defaultValue={Number(editingPayroll.deductions || 0)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-rose-600" />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú & Lý do điều chỉnh</label>
                <input name="notes" defaultValue={editingPayroll.notes || ''} placeholder="Lý do điều chỉnh..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingPayroll(null)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Lưu bảng lương</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: RECORD OR EDIT FINANCIAL TRANSACTION */}
      {/* -------------------------------------------------------------------------------- */}
      {(showNewTransactionModal || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {editingTransaction ? 'Chỉnh sửa giao dịch tài chính' : 'Ghi nhận giao dịch Thu / Chi mới'}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const payload = {
                  type: formData.get('type'),
                  category: formData.get('category'),
                  amount: formData.get('amount'),
                  paymentMethod: formData.get('paymentMethod'),
                  orderId: formData.get('orderId') || null,
                  notes: formData.get('notes'),
                };

                if (editingTransaction) {
                  await fetch(`/api/financials/${editingTransaction.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                } else {
                  await fetch('/api/financials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                }
                setShowNewTransactionModal(false);
                setEditingTransaction(null);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Loại dòng tiền</label>
                  <select name="type" defaultValue={editingTransaction?.type || 'revenue'} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="revenue">+ Thu vào (Tiền cọc / Quyết toán)</option>
                    <option value="expense">- Chi ra (Vật tư, máy móc, xăng xe)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phương thức</label>
                  <select name="paymentMethod" defaultValue={editingTransaction?.paymentMethod || 'bank_transfer'} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                    <option value="cash">Tiền mặt tại công trình</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Hạng mục thu / chi</label>
                <input
                  name="category"
                  defaultValue={editingTransaction?.category || 'deposit'}
                  placeholder="Đặt cọc, thanh toán cuối, mua nước lau sàn, Grab..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Số tiền giao dịch (đ)</label>
                <input
                  name="amount"
                  type="number"
                  defaultValue={Number(editingTransaction?.amount || 500000)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Gắn vào đơn hàng (nếu có)</label>
                <select name="orderId" defaultValue={editingTransaction?.orderId || ''} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <option value="">-- Không gắn vào đơn cụ thể (Chi phí chung) --</option>
                  {ordersList.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú giao dịch</label>
                <input
                  name="notes"
                  defaultValue={editingTransaction?.notes || ''}
                  placeholder="Số chứng từ, nội dung thanh toán..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowNewTransactionModal(false); setEditingTransaction(null); }}
                  className="px-3.5 py-2 text-slate-500"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: ADJUST ATTENDANCE RECORD (BR-09 AUDIT) */}
      {/* -------------------------------------------------------------------------------- */}
      {showAdjustAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Điều chỉnh chấm công: {showAdjustAttendanceModal.userName}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Theo quy tắc BR-09, mọi điều chỉnh công cần có người thực hiện, thời gian và lý do xác đáng.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái chấm công</label>
                <select
                  value={attendanceAdjustStatus}
                  onChange={(e) => setAttendanceAdjustStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="valid">Hợp lệ</option>
                  <option value="adjusted">Đã điều chỉnh hợp lệ</option>
                  <option value="flagged">Nghi ngờ / Cần giải trình</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lý do điều chỉnh (Bắt buộc theo BR-09)</label>
                <textarea
                  rows={2}
                  value={attendanceAdjustReason}
                  onChange={(e) => setAttendanceAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Nhân viên quên bấm nút tại công trình, tổ trưởng đã xác nhận có mặt..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowAdjustAttendanceModal(null)} className="px-3.5 py-2 text-slate-500 text-xs">
                Hủy
              </button>
              <button
                onClick={handleAdjustAttendance}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
              >
                Lưu điều chỉnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CUSTOMER ACCEPTANCE PORTAL PREVIEW */}
      {/* -------------------------------------------------------------------------------- */}
      {showAcceptancePortalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <CustomerAcceptanceView
              token={showAcceptancePortalToken}
              onClose={() => {
                setShowAcceptancePortalToken(null);
                fetchInitialData();
              }}
            />
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CANCEL ORDER (BR-04 MANDATORY REASON) */}
      {/* -------------------------------------------------------------------------------- */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Xác nhận hủy đơn hàng</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Theo quy định BR-04 trong SRS, chỉ Quản lý có quyền hủy đơn và <strong>bắt buộc phải ghi rõ lý do</strong> vào biên bản kiểm toán.
            </p>
            <textarea
              rows={3}
              placeholder="Nhập lý do hủy đơn chi tiết..."
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-4 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReasonInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW ORDER */}
      {/* -------------------------------------------------------------------------------- */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tạo đơn hàng dịch vụ mới</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const payload = {
                  customerId: formData.get('customerId'),
                  serviceId: formData.get('serviceId'),
                  address: formData.get('address'),
                  areaId: formData.get('areaId'),
                  scheduledStart: formData.get('scheduledStart'),
                  scheduledEnd: formData.get('scheduledEnd'),
                  baseAmount: formData.get('baseAmount'),
                  adjustedAmount: formData.get('adjustedAmount'),
                  adjustmentReason: formData.get('adjustmentReason'),
                  notes: formData.get('notes'),
                };

                const res = await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  setShowNewOrderModal(false);
                  fetchInitialData();
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Khách hàng</label>
                <select name="customerId" required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {customersList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Dịch vụ vệ sinh</label>
                <select name="serviceId" required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {servicesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {Number(s.basePrice).toLocaleString('vi-VN')} đ/{s.unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ thi công</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Số nhà, tên đường, khu vực..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Bắt đầu dự kiến</label>
                  <input
                    type="datetime-local"
                    name="scheduledStart"
                    required
                    defaultValue="2026-11-12T08:00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Kết thúc dự kiến</label>
                  <input
                    type="datetime-local"
                    name="scheduledEnd"
                    required
                    defaultValue="2026-11-12T17:00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giá trị báo giá (đ)</label>
                  <input
                    type="number"
                    name="baseAmount"
                    required
                    defaultValue={2500000}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giá chốt sau điều chỉnh (đ)</label>
                  <input
                    type="number"
                    name="adjustedAmount"
                    defaultValue={2500000}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú & Yêu cầu đặc biệt</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ví dụ: Cần bọc giày, máy chà sàn, hóa chất thân thiện..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: ASSIGN STAFF TO ORDER */}
      {/* -------------------------------------------------------------------------------- */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Phân công nhân sự cho đơn {selectedOrder.orderNumber}</h3>
            <p className="text-xs text-slate-500 mb-4">Chọn các nhân viên và tổ phụ trách thực hiện công trình.</p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
              {allUsers.filter(u => u.status === 'active').map(u => {
                const isChecked = selectedStaffIds.includes(u.id);
                return (
                  <label key={u.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStaffIds([...selectedStaffIds, u.id]);
                          else setSelectedStaffIds(selectedStaffIds.filter(id => id !== u.id));
                        }}
                        className="rounded text-sky-600"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</p>
                        <span className="text-[10px] text-slate-500">{u.role}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowAssignModal(false)} className="px-3.5 py-2 text-xs text-slate-500">
                Hủy
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/orders/${selectedOrder.id}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userIds: selectedStaffIds }),
                  });
                  setShowAssignModal(false);
                  fetchInitialData();
                  handleOrderSelect(selectedOrder.id);
                }}
                disabled={selectedStaffIds.length === 0}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Lưu phân công
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW CUSTOMER */}
      {/* -------------------------------------------------------------------------------- */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Thêm khách hàng mới</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    address: formData.get('address'),
                    customerType: formData.get('customerType'),
                    contactPerson: formData.get('contactPerson'),
                    notes: formData.get('notes'),
                  }),
                });
                if (res.ok) {
                  setShowNewCustomerModal(false);
                  fetchInitialData();
                } else {
                  const err = await res.json();
                  showToast(err.message || err.error, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tên khách hàng</label>
                <input name="name" required placeholder="Tên cá nhân hoặc công ty..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Điện thoại</label>
                  <input name="phone" required placeholder="090..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Loại khách</label>
                  <select name="customerType" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="individual">Cá nhân / Hộ gia đình</option>
                    <option value="business">Doanh nghiệp / Văn phòng</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ thi công</label>
                <input name="address" required placeholder="Số nhà, đường, phường, quận..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewCustomerModal(false)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Tạo khách hàng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW SERVICE */}
      {/* -------------------------------------------------------------------------------- */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Thêm dịch vụ & Bảng giá mới</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch('/api/services', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    code: formData.get('code'),
                    name: formData.get('name'),
                    category: formData.get('category'),
                    unit: formData.get('unit'),
                    basePrice: formData.get('basePrice'),
                    description: formData.get('description'),
                  }),
                });
                setShowNewServiceModal(false);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mã dịch vụ</label>
                  <input name="code" required placeholder="VESINH-..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono uppercase" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nhóm danh mục</label>
                  <select name="category" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="home">Nhà ở & Căn hộ</option>
                    <option value="construction">Sau xây dựng</option>
                    <option value="office">Văn phòng / Tạp vụ</option>
                    <option value="specialized">Chuyên sâu (Sofa/Kính)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tên dịch vụ</label>
                <input name="name" required placeholder="Tên gói dịch vụ..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Đơn vị tính</label>
                  <input name="unit" required placeholder="m², căn, bộ, giờ..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giá niêm yết (đ)</label>
                  <input name="basePrice" type="number" required placeholder="1200000" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả tóm tắt</label>
                <textarea name="description" rows={2} placeholder="Quy trình, tiêu chuẩn..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewServiceModal(false)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Tạo dịch vụ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW STAFF */}
      {/* -------------------------------------------------------------------------------- */}
      {showNewStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Thêm hồ sơ nhân viên mới</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    role: formData.get('role'),
                    salaryType: formData.get('salaryType'),
                    baseRate: formData.get('baseRate'),
                    bankName: formData.get('bankName'),
                    bankAccount: formData.get('bankAccount'),
                    notes: formData.get('notes'),
                  }),
                });
                setShowNewStaffModal(false);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Họ tên nhân viên</label>
                <input name="name" required placeholder="Nguyễn Văn A..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Điện thoại</label>
                  <input name="phone" required placeholder="09..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Vai trò</label>
                  <select name="role" defaultValue="worker" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="worker">Công nhân</option>
                    <option value="lead">Tổ trưởng</option>
                    <option value="admin">Quản lý / Điều phối</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Hình thức lương</label>
                  <select name="salaryType" defaultValue="daily" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="daily">Lương ngày / công nhật</option>
                    <option value="monthly">Lương tháng cố định</option>
                    <option value="per_order">Lương theo đơn hàng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mức lương cơ bản (đ)</label>
                  <input name="baseRate" type="number" defaultValue={350000} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewStaffModal(false)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Lưu hồ sơ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: MANUAL ADD ATTENDANCE RECORD */}
      {/* -------------------------------------------------------------------------------- */}
      {showNewAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Chấm công bổ sung (Quản lý)</h3>
            <p className="text-xs text-slate-500 mb-4">Ghi nhận lượt chấm công bù cho nhân viên khi quên máy hoặc có sự cố thiết bị.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch('/api/attendance/manual', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: formData.get('userId'),
                    orderId: formData.get('orderId') || null,
                    checkType: formData.get('checkType'),
                    timestamp: formData.get('timestamp'),
                    locationName: formData.get('locationName'),
                    status: 'valid',
                    adjustedReason: formData.get('adjustedReason') || 'Quản lý chấm công bù',
                  }),
                });
                setShowNewAttendanceModal(false);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nhân sự chấm công</label>
                <select name="userId" required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Loại chấm công</label>
                  <select name="checkType" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="in">VÀO CA (Check-in)</option>
                    <option value="out">RA CA (Check-out)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thời gian</label>
                  <input
                    type="datetime-local"
                    name="timestamp"
                    required
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Đơn hàng liên kết (nếu có)</label>
                <select name="orderId" className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <option value="">-- Không gắn vào đơn cụ thể --</option>
                  {ordersList.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa điểm / Công trình</label>
                <input
                  type="text"
                  name="locationName"
                  placeholder="Công trình Thảo Điền, Landmark 81..."
                  required
                  defaultValue="Công trình khách hàng CleanOps"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lý do chấm công bổ sung (BR-09)</label>
                <input
                  type="text"
                  name="adjustedReason"
                  placeholder="Điện thoại hết pin, tổ trưởng xác nhận..."
                  required
                  defaultValue="Tổ trưởng xác nhận nhân viên có mặt làm việc"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewAttendanceModal(false)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Lưu chấm công</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: EDIT ATTENDANCE RECORD */}
      {/* -------------------------------------------------------------------------------- */}
      {editingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Chỉnh sửa bản ghi chấm công #{editingAttendance.id}</h3>
            <p className="text-xs text-slate-500 mb-4">Cập nhật thời gian, vị trí hoặc trạng thái của nhân sự {editingAttendance.userName}.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch(`/api/attendance/${editingAttendance.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: formData.get('userId'),
                    checkType: formData.get('checkType'),
                    timestamp: formData.get('timestamp'),
                    locationName: formData.get('locationName'),
                    status: formData.get('status'),
                    adjustedReason: formData.get('adjustedReason'),
                  }),
                });
                setEditingAttendance(null);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nhân sự</label>
                <select name="userId" defaultValue={editingAttendance.userId} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Loại chấm công</label>
                  <select name="checkType" defaultValue={editingAttendance.checkType} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="in">VÀO CA (Check-in)</option>
                    <option value="out">RA CA (Check-out)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
                  <select name="status" defaultValue={editingAttendance.status || 'valid'} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="valid">Hợp lệ</option>
                    <option value="adjusted">Đã điều chỉnh</option>
                    <option value="flagged">Nghi ngờ / Cần kiểm tra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thời gian ghi nhận</label>
                <input
                  type="datetime-local"
                  name="timestamp"
                  required
                  defaultValue={editingAttendance.timestamp ? new Date(editingAttendance.timestamp).toISOString().slice(0, 16) : ''}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa điểm / Vị trí</label>
                <input
                  type="text"
                  name="locationName"
                  defaultValue={editingAttendance.locationName || ''}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lý do điều chỉnh (BR-09)</label>
                <input
                  type="text"
                  name="adjustedReason"
                  defaultValue={editingAttendance.adjustedReason || ''}
                  placeholder="Lý do điều chỉnh thông tin..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingAttendance(null)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Cập nhật chấm công</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW PAYROLL SLIP */}
      {/* -------------------------------------------------------------------------------- */}
      {showNewPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Tạo phiếu lương mới</h3>
            <p className="text-xs text-slate-500 mb-4">Khởi tạo phiếu lương kỳ Tháng 11/2026 cho nhân sự.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await fetch('/api/payrolls', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: formData.get('userId'),
                    periodMonth: formData.get('periodMonth'),
                    workDays: formData.get('workDays'),
                    overtimeHours: formData.get('overtimeHours'),
                    baseSalary: formData.get('baseSalary'),
                    allowance: formData.get('allowance'),
                    bonus: formData.get('bonus'),
                    deductions: formData.get('deductions'),
                    notes: formData.get('notes'),
                  }),
                });
                setShowNewPayrollModal(false);
                fetchInitialData();
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nhân viên</label>
                  <select name="userId" required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Kỳ lương</label>
                  <input name="periodMonth" defaultValue="2026-11" required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày công</label>
                  <input name="workDays" type="number" step="0.5" defaultValue={24} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Giờ tăng ca</label>
                  <input name="overtimeHours" type="number" step="0.5" defaultValue={0} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lương cơ bản / công nhật (đ)</label>
                <input name="baseSalary" type="number" defaultValue={7500000} required className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phụ cấp (đ)</label>
                  <input name="allowance" type="number" defaultValue={500000} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-emerald-600" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thưởng KPI (đ)</label>
                  <input name="bonus" type="number" defaultValue={300000} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-emerald-600" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Khấu trừ vi phạm (đ)</label>
                <input name="deductions" type="number" defaultValue={0} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-rose-600" />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                <input name="notes" placeholder="Ghi chú bảng lương..." className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowNewPayrollModal(false)} className="px-3.5 py-2 text-slate-500">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold">Tạo phiếu lương</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* IN-APP CONFIRMATION MODAL (NEVER BLOCKED BY IFRAME SANDBOX) */}
      {/* -------------------------------------------------------------------------------- */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{deleteDialog.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{deleteDialog.description}</p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = deleteDialog.onConfirm;
                  setDeleteDialog(null);
                  await action();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                {deleteDialog.confirmText || 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* IN-APP TOAST NOTIFICATION (NEVER BLOCKED BY IFRAME SANDBOX) */}
      {/* -------------------------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 bg-slate-900 text-white text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className={`w-2.5 h-2.5 rounded-full ${toastMessage.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
