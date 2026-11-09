'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  FileCheck2,
  Filter,
  Flame,
  Layers,
  MessageSquareWarning,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Stamp,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Eye,
  X,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, IncidentRecord, ComplaintCase, StaffAccount } from '@/types/demo';


export interface DepartmentPerformanceMetric {
  id: string;
  name: string;
  icon: any;
  head: string;
  leadEmpId: string;
  slaPercent: number;
  avgResolutionMinutes: number;
  guestSatisfactionScore: number;
  staffOnDutyCount: number;
  totalStaffCount: number;
  activeTasks: number;
  overdueTasksCount: number;
  openEscalations: number;
  status: 'warning' | 'optimal';
  trend: string;
  spending: string;
  weeklyTrend: number[];
  keyFocusAreas: string[];
  staffMembers: StaffAccount[];
  tasks: WorkItem[];
}

interface ExecutiveOverviewTabProps {
  permissionMode: 'viewer' | 'approver';
  onNavigateTab: (tabId: string, filter?: Record<string, string>) => void;
  onOpenApprovalDetail?: (item: WorkItem) => void;
}

export function ExecutiveOverviewTab({
  permissionMode,
  onNavigateTab,
  onOpenApprovalDetail,
}: ExecutiveOverviewTabProps) {
  const { state } = useDemo();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'ytd'>('today');
  const [selectedDeptPerformance, setSelectedDeptPerformance] = useState<DepartmentPerformanceMetric | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDeptPerformance(null);
      }
    };
    if (selectedDeptPerformance) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedDeptPerformance]);

  // Executive pending approvals
  const executiveItems = [
    ...(state.items.general_manager ?? []),
    ...(state.items.executive_viewer ?? []),
  ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
  const pendingApprovals = executiveItems.filter((i) => i.status === 'Needs approval');
  const approvedItems = executiveItems.filter((i) => i.status === 'Approved');
  const rejectedItems = executiveItems.filter((i) => i.status === 'Rejected');

  // Incidents
  const incidents = state.incidents ?? [];
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalIncidents = activeIncidents.filter(
    (i) => i.severity === 'critical' || i.severity === 'major',
  );

  // Complaints
  const complaints = state.frontDesk?.complaints ?? [];
  const unresolvedComplaints = complaints.filter((c) => !c.compApplied);

  // Safety Broadcasts
  const activeBroadcastAlerts = (state.safetyAlerts ?? []).filter(
    (a) => a.status === 'broadcast_active',
  );
  const pendingBroadcastAlerts = (state.safetyAlerts ?? []).filter(
    (a) => a.status === 'validated_pending_approval',
  );

  // High priority requests across departments
  const allTasks: WorkItem[] = useMemo(() => {
    const list: WorkItem[] = [];
    const roles = ['task_fulfiller', 'department_dispatcher', 'department_manager', 'front_desk_coordinator'] as const;
    const seen = new Set<string>();
    roles.forEach((r) => {
      (state.items[r] ?? []).forEach((item) => {
        const key = item.ref || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(item);
        }
      });
    });
    return list;
  }, [state.items]);

  const highPriorityTasks = allTasks.filter(
    (t) => t.priority === 'critical' || t.priority === 'vip' || t.priority === 'urgent',
  );

  // Financial values
  const totalCapexPending = pendingApprovals.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalApprovedMTD = approvedItems.reduce((acc, curr) => acc + (curr.amount || 0), 0) + 141000;

  // Department health dataset with rich operational details
  const departmentMetrics: DepartmentPerformanceMetric[] = useMemo(() => {
    const allStaff = state.staffAccounts ?? [];

    const getStaffForDept = (deptQuery: string, fallback: StaffAccount[]) => {
      const matched = allStaff.filter((s) => s.department?.toLowerCase().includes(deptQuery.toLowerCase()));
      return matched.length > 0 ? matched : fallback;
    };

    const getTasksForDept = (deptQuery: string, fallback: WorkItem[]) => {
      const matched = allTasks.filter(
        (t) =>
          t.department?.toLowerCase().includes(deptQuery.toLowerCase()) ||
          t.category?.toLowerCase().includes(deptQuery.toLowerCase())
      );
      return matched.length > 0 ? matched : fallback;
    };

    return [
      {
        id: 'maintenance',
        name: 'Maintenance & Engineering',
        icon: Wrench,
        head: 'Arjun Mehta',
        leadEmpId: 'EMP-0104',
        slaPercent: 91.4,
        avgResolutionMinutes: 18,
        guestSatisfactionScore: 4.6,
        staffOnDutyCount: 3,
        totalStaffCount: 4,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('maintenance')).length || 7,
        overdueTasksCount: 2,
        openEscalations: incidents.filter((i) => i.department?.toLowerCase().includes('maintenance')).length || 1,
        status: 'warning',
        trend: '+2.1%',
        spending: '₹1,13,000',
        weeklyTrend: [88, 89, 90, 92, 91, 93, 91.4],
        keyFocusAreas: ['HVAC & Chillers', 'Service Elevators', 'Plumbing & Pressure Lines', 'Substation & Genset'],
        staffMembers: getStaffForDept('maintenance', [
          {
            id: 'st-mnt-1',
            employeeId: 'EMP-0104',
            name: 'Arjun Mehta',
            email: 'a.mehta@thegrandadp.com',
            roleId: 'department_dispatcher_supervisor',
            department: 'Maintenance & Engineering',
            floorZone: 'All floors',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'on_duty',
          },
          {
            id: 'st-mnt-2',
            employeeId: 'EMP-0114',
            name: 'Devendra Rao',
            email: 'd.rao@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Maintenance & Engineering',
            floorZone: 'Basement & Plant Rooms',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'on_duty',
          },
          {
            id: 'st-mnt-3',
            employeeId: 'EMP-0118',
            name: 'Rohan Joshi',
            email: 'r.joshi@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Maintenance & Engineering',
            floorZone: 'Tower A Floors 1–6',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'on_duty',
          },
          {
            id: 'st-mnt-4',
            employeeId: 'EMP-0122',
            name: 'Karan Verma',
            email: 'k.verma@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Maintenance & Engineering',
            floorZone: 'Tower B & Service Shafts',
            shift: 'Evening',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'off_duty',
          },
        ]),
        tasks: getTasksForDept('maintenance', [
          {
            id: 'wo-mnt-1',
            ref: 'WO-MNT-401',
            title: 'HVAC Chiller Unit 3 Pressure Calibration',
            department: 'Maintenance & Engineering',
            category: 'maintenance',
            priority: 'urgent',
            status: 'In Progress',
            meta: 'Basement Plant Room · Tech: Devendra Rao',
          },
          {
            id: 'wo-mnt-2',
            ref: 'WO-MNT-402',
            title: 'Service Elevator 2 Inverter Diagnostics',
            department: 'Maintenance & Engineering',
            category: 'maintenance',
            priority: 'critical',
            status: 'Awaiting Parts',
            meta: 'East Core Shaft · Otis Vendor Dispatch',
          },
          {
            id: 'wo-mnt-3',
            ref: 'WO-MNT-403',
            title: 'Hot Water Heat Pump Circuit Breaker Audit',
            department: 'Maintenance & Engineering',
            category: 'maintenance',
            priority: 'normal',
            status: 'Scheduled',
            meta: 'Service Level 1 · Routine PM',
          },
        ]),
      },
      {
        id: 'housekeeping',
        name: 'Housekeeping & Rooms',
        icon: Layers,
        head: 'Meera Nambiar',
        leadEmpId: 'EMP-0105',
        slaPercent: 96.8,
        avgResolutionMinutes: 12,
        guestSatisfactionScore: 4.8,
        staffOnDutyCount: 4,
        totalStaffCount: 5,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('housekeeping')).length || 14,
        overdueTasksCount: 0,
        openEscalations: 0,
        status: 'optimal',
        trend: '+0.8%',
        spending: '₹35,000',
        weeklyTrend: [95, 96, 94, 97, 98, 96, 96.8],
        keyFocusAreas: ['VIP Room Turn-Down', 'Linen Inventory Audit', 'Sanitization Protocol', 'Deep Clean Rotation'],
        staffMembers: getStaffForDept('housekeeping', [
          {
            id: 'st-hk-1',
            employeeId: 'EMP-0105',
            name: 'Meera Nambiar',
            email: 'm.nambiar@thegrandadp.com',
            roleId: 'department_dispatcher_supervisor',
            department: 'Housekeeping',
            floorZone: 'Floors 1–5',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-05',
            availability: 'on_duty',
          },
          {
            id: 'st-hk-2',
            employeeId: 'EMP-0103',
            name: 'Vikram Singh',
            email: 'v.singh@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Housekeeping',
            floorZone: 'Floors 1–5',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-09-01',
            availability: 'on_duty',
          },
          {
            id: 'st-hk-3',
            employeeId: 'EMP-0109',
            name: 'Leila Chen',
            email: 'l.chen@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Housekeeping',
            floorZone: 'Floors 4–6 VIP Wings',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-12',
            availability: 'on_duty',
          },
          {
            id: 'st-hk-4',
            employeeId: 'EMP-0115',
            name: 'Priya Nair',
            email: 'p.nair@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Housekeeping',
            floorZone: 'Floors 1–3',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-15',
            availability: 'on_duty',
          },
          {
            id: 'st-hk-5',
            employeeId: 'EMP-0125',
            name: 'Sunil Jadhav',
            email: 's.jadhav@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Housekeeping',
            floorZone: 'Linen Master Depot',
            shift: 'Evening',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-20',
            availability: 'off_duty',
          },
        ]),
        tasks: getTasksForDept('housekeeping', [
          {
            id: 'wo-hk-1',
            ref: 'HK-2026-91',
            title: 'VIP Turndown Service Suite 518',
            department: 'Housekeeping',
            category: 'housekeeping',
            priority: 'vip',
            status: 'In Progress',
            meta: 'Room 518 · Butler Escort Requested',
          },
          {
            id: 'wo-hk-2',
            ref: 'HK-2026-88',
            title: 'Express Deep Clean & Linen Refresh Suite 402',
            department: 'Housekeeping',
            category: 'housekeeping',
            priority: 'urgent',
            status: 'Assigned',
            meta: 'Room 402 · Post AC Leak Restoration',
          },
          {
            id: 'wo-hk-3',
            ref: 'HK-2026-84',
            title: 'Presidential Suite Departure Turnover',
            department: 'Housekeeping',
            category: 'housekeeping',
            priority: 'normal',
            status: 'Completed',
            meta: 'Suite 601 · Inspected by Meera Nambiar',
          },
        ]),
      },
      {
        id: 'front_office',
        name: 'Front Office & Stays',
        icon: Building2,
        head: 'Sunita Patel',
        leadEmpId: 'EMP-0102',
        slaPercent: 95.2,
        avgResolutionMinutes: 6,
        guestSatisfactionScore: 4.7,
        staffOnDutyCount: 2,
        totalStaffCount: 3,
        activeTasks: (state.frontDesk?.stays ?? []).filter((s) => s.status === 'in_house').length || 6,
        overdueTasksCount: 0,
        openEscalations: unresolvedComplaints.length,
        status: 'optimal',
        trend: '+1.4%',
        spending: '₹28,000',
        weeklyTrend: [93, 94, 96, 95, 94, 95, 95.2],
        keyFocusAreas: ['Express VIP Check-Ins', 'Luggage Transit Velocity', 'Guest Preference Profiling', 'Billing Accuracy'],
        staffMembers: getStaffForDept('front', [
          {
            id: 'st-fo-1',
            employeeId: 'EMP-0102',
            name: 'Sunita Patel',
            email: 's.patel@thegrandadp.com',
            roleId: 'front_desk_coordinator',
            department: 'Front Office',
            floorZone: 'Lobby & Reception',
            shift: 'Day',
            status: 'active',
            financialLimit: 4000,
            createdAt: '2026-08-15',
            availability: 'on_duty',
          },
          {
            id: 'st-fo-2',
            employeeId: 'EMP-0106',
            name: 'Marcus Vance',
            email: 'm.vance@thegrandadp.com',
            roleId: 'front_desk_coordinator',
            department: 'Front Office',
            floorZone: 'Duty Manager Desk',
            shift: 'Day',
            status: 'active',
            financialLimit: 16000,
            createdAt: '2026-08-15',
            availability: 'on_duty',
          },
          {
            id: 'st-fo-3',
            employeeId: 'EMP-0116',
            name: 'Rahul Kapoor',
            email: 'r.kapoor@thegrandadp.com',
            roleId: 'front_desk_coordinator',
            department: 'Front Office',
            floorZone: 'Concierge Desk',
            shift: 'Evening',
            status: 'active',
            financialLimit: 2000,
            createdAt: '2026-08-25',
            availability: 'off_duty',
          },
        ]),
        tasks: getTasksForDept('front', [
          {
            id: 'wo-fo-1',
            ref: 'FO-2026-102',
            title: 'Express VIP Check-in & Keycard Provisioning',
            department: 'Front Office',
            category: 'front_desk',
            priority: 'vip',
            status: 'In Progress',
            meta: 'Suite 518 · Guest: Amb. K. Sharma',
          },
          {
            id: 'wo-fo-2',
            ref: 'FO-2026-105',
            title: 'Luggage Transit Escort to Suite 314',
            department: 'Front Office',
            category: 'front_desk',
            priority: 'normal',
            status: 'Assigned',
            meta: 'Bell Captain Dispatch',
          },
          {
            id: 'wo-fo-3',
            ref: 'FO-2026-098',
            title: 'Guest Service Feedback Resolution',
            department: 'Front Office',
            category: 'concierge',
            priority: 'urgent',
            status: 'Resolved',
            meta: 'Handled by Marcus Vance',
          },
        ]),
      },
      {
        id: 'food_beverage',
        name: 'Food & Beverage',
        icon: Sparkles,
        head: 'Kabir Sen',
        leadEmpId: 'EMP-0113',
        slaPercent: 94.0,
        avgResolutionMinutes: 14,
        guestSatisfactionScore: 4.9,
        staffOnDutyCount: 3,
        totalStaffCount: 4,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('beverage') || t.department?.toLowerCase().includes('f&b')).length || 5,
        overdueTasksCount: 1,
        openEscalations: 0,
        status: 'optimal',
        trend: '-0.5%',
        spending: '₹35,000',
        weeklyTrend: [92, 93, 95, 94, 96, 95, 94.0],
        keyFocusAreas: ['In-Room Dining Speed', 'Breakfast Buffet Restock', 'Banquet Line Coordination', 'Kitchen HACCP Standards'],
        staffMembers: getStaffForDept('beverage', [
          {
            id: 'st-fb-1',
            employeeId: 'EMP-0113',
            name: 'Kabir Sen',
            email: 'k.sen@thegrandadp.com',
            roleId: 'department_manager',
            department: 'Food & Beverage',
            floorZone: 'Restaurants & Kitchens',
            shift: 'Day',
            status: 'active',
            financialLimit: 12000,
            createdAt: '2026-08-01',
            availability: 'on_duty',
          },
          {
            id: 'st-fb-2',
            employeeId: 'EMP-0117',
            name: 'Sameer Khan',
            email: 's.khan@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Food & Beverage',
            floorZone: 'In-Room Dining Hub',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-05',
            availability: 'on_duty',
          },
          {
            id: 'st-fb-3',
            employeeId: 'EMP-0120',
            name: 'Neha Gupta',
            email: 'n.gupta@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Food & Beverage',
            floorZone: 'Banquet Hall & Bar',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'on_duty',
          },
          {
            id: 'st-fb-4',
            employeeId: 'EMP-0124',
            name: 'Rohit Pillai',
            email: 'r.pillai@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Food & Beverage',
            floorZone: 'Main Kitchen Service',
            shift: 'Evening',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-20',
            availability: 'off_duty',
          },
        ]),
        tasks: getTasksForDept('beverage', [
          {
            id: 'wo-fb-1',
            ref: 'FB-2026-311',
            title: 'In-Room Dining Order #502 Express Delivery',
            department: 'Food & Beverage',
            category: 'room_service',
            priority: 'urgent',
            status: 'Dispatched',
            meta: 'Room 502 · Express Breakfast Combo',
          },
          {
            id: 'wo-fb-2',
            ref: 'FB-2026-308',
            title: 'Banquet Hall A Executive Breakfast Setup',
            department: 'Food & Beverage',
            category: 'room_service',
            priority: 'normal',
            status: 'In Progress',
            meta: 'Grand Ballroom · 45 Pax Corporate Session',
          },
          {
            id: 'wo-fb-3',
            ref: 'FB-2026-299',
            title: 'Main Kitchen Cold Line Temperature Audit',
            department: 'Food & Beverage',
            category: 'room_service',
            priority: 'normal',
            status: 'Completed',
            meta: 'Inspected & Passed 3.8°C',
          },
        ]),
      },
      {
        id: 'spa_wellness',
        name: 'Wellness',
        icon: Star,
        head: 'T. Brandt',
        leadEmpId: 'EMP-0110',
        slaPercent: 98.5,
        avgResolutionMinutes: 8,
        guestSatisfactionScore: 4.95,
        staffOnDutyCount: 2,
        totalStaffCount: 2,
        activeTasks: 3,
        overdueTasksCount: 0,
        openEscalations: 0,
        status: 'optimal',
        trend: '+0.3%',
        spending: '₹12,500',
        weeklyTrend: [97, 98, 99, 98, 97, 99, 98.5],
        keyFocusAreas: ['Ayurvedic Treatment Suites', 'Hydrotherapy Pool Sanitation', 'Fitness Studio Checks', 'Locker Room Cleanliness'],
        staffMembers: getStaffForDept('wellness', [
          {
            id: 'st-wel-1',
            employeeId: 'EMP-0110',
            name: 'T. Brandt',
            email: 't.brandt@thegrandadp.com',
            roleId: 'department_manager',
            department: 'Wellness',
            floorZone: 'Spa & Wellness Level 2',
            shift: 'Day',
            status: 'active',
            financialLimit: 8000,
            createdAt: '2026-08-01',
            availability: 'on_duty',
          },
          {
            id: 'st-wel-2',
            employeeId: 'EMP-0111',
            name: 'Ananya Sharma',
            email: 'a.sharma@thegrandadp.com',
            roleId: 'task_fulfiller',
            department: 'Wellness',
            floorZone: 'Spa Treatment Suites',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'on_duty',
          },
        ]),
        tasks: getTasksForDept('wellness', [
          {
            id: 'wo-wel-1',
            ref: 'WEL-2026-51',
            title: 'Hydrotherapy Pool Quality & Temp Check',
            department: 'Wellness',
            category: 'spa',
            priority: 'normal',
            status: 'In Progress',
            meta: 'Level 2 Spa Deck · Chlorination 1.8ppm',
          },
          {
            id: 'wo-wel-2',
            ref: 'WEL-2026-52',
            title: 'Ayurvedic Treatment Room 2 Preparation',
            department: 'Wellness',
            category: 'spa',
            priority: 'vip',
            status: 'Ready',
            meta: 'Suite B · Guest Appointment 11:30',
          },
          {
            id: 'wo-wel-3',
            ref: 'WEL-2026-49',
            title: 'Fitness Studio Equipment Sanitation Audit',
            department: 'Wellness',
            category: 'spa',
            priority: 'normal',
            status: 'Completed',
            meta: 'All cardiovascular machines sanitized',
          },
        ]),
      },
      {
        id: 'security',
        name: 'Safety & Security',
        icon: ShieldAlert,
        head: 'Inspector Roy',
        leadEmpId: 'EMP-0108',
        slaPercent: 97.1,
        avgResolutionMinutes: 4,
        guestSatisfactionScore: 4.8,
        staffOnDutyCount: 2,
        totalStaffCount: 2,
        activeTasks: (state.items.security_responder ?? []).filter((s) => s.status !== 'Resolved').length || 2,
        overdueTasksCount: 0,
        openEscalations: 1,
        status: 'optimal',
        trend: '0.0%',
        spending: '₹18,000',
        weeklyTrend: [96, 97, 98, 96, 97, 98, 97.1],
        keyFocusAreas: ['Perimeter Patrols', 'Keycard Access Logging', 'Emergency Response Readiness', 'CCTV Grid Coverage'],
        staffMembers: getStaffForDept('security', [
          {
            id: 'st-sec-1',
            employeeId: 'EMP-0108',
            name: 'Inspector Roy',
            email: 'r.roy@thegrandadp.com',
            roleId: 'security_responder',
            department: 'Safety & Security',
            floorZone: 'Property-wide Security Hub',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-01',
            availability: 'on_duty',
          },
          {
            id: 'st-sec-2',
            employeeId: 'EMP-0112',
            name: 'Balram Yadav',
            email: 'b.yadav@thegrandadp.com',
            roleId: 'security_responder',
            department: 'Safety & Security',
            floorZone: 'Perimeter & Gates',
            shift: 'Day',
            status: 'active',
            financialLimit: 0,
            createdAt: '2026-08-10',
            availability: 'on_duty',
          },
        ]),
        tasks: getTasksForDept('security', [
          {
            id: 'wo-sec-1',
            ref: 'SEC-2026-21',
            title: 'Service Core B Keycard Access Audit',
            department: 'Safety & Security',
            category: 'safety',
            priority: 'normal',
            status: 'In Progress',
            meta: 'Core B Stairwell · Log validation',
          },
          {
            id: 'wo-sec-2',
            ref: 'SEC-2026-22',
            title: 'East Wing Perimeter Security Patrol',
            department: 'Safety & Security',
            category: 'safety',
            priority: 'normal',
            status: 'Assigned',
            meta: 'East Garden perimeter & Service Entry',
          },
        ]),
      },
    ];
  }, [allTasks, incidents, state.frontDesk?.stays, unresolvedComplaints.length, state.items.security_responder, state.staffAccounts]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Timeframe & Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-white/5 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-300 grid place-items-center border border-amber-500/30">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-navy-950 dark:text-white">
                Executive Operations Command
              </h2>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  permissionMode === 'approver'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
                }`}
              >
                {permissionMode === 'approver' ? 'Approver Authority' : 'Viewer Audit Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-mist-400">
              Live property metrics, SLA benchmarks, and beyond-manager approval authorizations.
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-black/5 dark:bg-ink-950/80">
          {(['today', 'week', 'month', 'ytd'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                timeframe === t
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              {t === 'today' ? 'Today' : t === 'week' ? '7 Days' : t === 'month' ? '30 Days' : 'YTD'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Broadcasts & Alert Bar */}
      {(activeBroadcastAlerts.length > 0 || pendingBroadcastAlerts.length > 0) && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-400 animate-pulse">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <span className="font-bold text-white block">
                {activeBroadcastAlerts.length > 0
                  ? `LIVE SAFETY BROADCAST: ${activeBroadcastAlerts[0].title}`
                  : `SAFETY BROADCAST PENDING GM SIGN-OFF: ${pendingBroadcastAlerts[0].title}`}
              </span>
              <span className="text-mist-300 text-[11px]">
                {activeBroadcastAlerts.length > 0
                  ? `Active across all roles (${activeBroadcastAlerts[0].location}) · Validated by Front Desk`
                  : `Validated by Front Desk Lead · Awaiting GM authorization to broadcast property-wide`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab(pendingBroadcastAlerts.length > 0 ? 'approvals' : 'incidents')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 self-start sm:self-auto"
          >
            {pendingBroadcastAlerts.length > 0 ? 'Review & Authorize' : 'Inspect Alert'}
          </button>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Departments */}
        <button
          type="button"
          onClick={() => onNavigateTab('performance')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Departments</span>
            <Building2 className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">6</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
            <ShieldCheck className="h-3 w-3" /> All active on-grid
          </div>
        </button>

        {/* KPI 2: Overall Operational SLA */}
        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Property SLA</span>
            <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">95.4%</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
            <ArrowUpRight className="h-3 w-3" /> +1.2% vs target (94%)
          </div>
        </button>

        {/* KPI 3: Pending Approvals */}
        <button
          type="button"
          onClick={() => onNavigateTab('approvals-pending')}
          className={`text-left p-4 rounded-3xl border transition group shadow-md hover:shadow-xl ${
            pendingApprovals.length > 0
              ? 'border-amber-500/40 bg-amber-500/[0.08]'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <Stamp className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-navy-950 dark:text-white">
              {pendingApprovals.length}
            </div>
            <span className="text-xs font-bold text-amber-500">
              ₹{(totalCapexPending / 1000).toFixed(0)}k req
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {pendingApprovals.length > 0 ? 'Requires executive sign-off' : 'All decisions cleared'}
          </div>
        </button>

        {/* KPI 4: High Priority Tasks */}
        <button
          type="button"
          onClick={() => onNavigateTab('escalations')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-purple-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">High Priority</span>
            <Flame className="h-4 w-4 text-purple-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {highPriorityTasks.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            <Clock className="h-3 w-3" /> VIP & Critical tracked
          </div>
        </button>

        {/* KPI 5: Critical Incidents */}
        <button
          type="button"
          onClick={() => onNavigateTab('incidents')}
          className={`text-left p-4 rounded-3xl border transition group shadow-md hover:shadow-xl ${
            criticalIncidents.length > 0
              ? 'border-rose-500/40 bg-rose-500/[0.08]'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Incidents</span>
            <ShieldAlert className="h-4 w-4 text-rose-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {criticalIncidents.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
            {criticalIncidents.length > 0 ? 'Water seepage & lift fault' : 'No critical alerts'}
          </div>
        </button>

        {/* KPI 6: Unresolved Guest Complaints */}
        <button
          type="button"
          onClick={() => onNavigateTab('complaints')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Guest Recovery</span>
            <MessageSquareWarning className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {unresolvedComplaints.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {unresolvedComplaints.length > 0 ? 'VIP 518 Noise comp pending' : 'Zero outstanding'}
          </div>
        </button>
      </div>

      {/* Main Grid: Interactive Analytics + Operational Attention Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Department Performance & Throughput Charts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Performance Comparison Card */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Department Operational Pulse & SLA Benchmarks
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Real-time SLA adherence across all six operating units. Click a department to inspect.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('performance')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Inspect All <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Department Progress Bars */}
            <div className="space-y-3.5">
              {departmentMetrics.map((dept) => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptPerformance(dept)}
                    className="p-3.5 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-white/10 hover:border-amber-500/40 hover:shadow-md transition cursor-pointer group"
                    title={`Click to view ${dept.name} exact performance details`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-xl bg-white/10 dark:bg-white/5 grid place-items-center text-navy-950 dark:text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-navy-950 dark:text-white">
                            {dept.name}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-mist-500 ml-2">
                            Lead: {dept.head} · {dept.activeTasks} open tasks
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="text-xs font-mono font-bold text-navy-950 dark:text-white">
                          {dept.slaPercent}%
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dept.slaPercent >= 95
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {dept.slaPercent >= 95 ? 'Target Met' : 'Attention'}
                        </span>
                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-[11px]">Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-200 dark:bg-ink-950 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dept.slaPercent >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${dept.slaPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Charts Grid: Throughput & Capex Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Approval Decisions Trend */}
            <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-400" />
                  Executive Decision Volume
                </h4>
                <span className="text-xs font-mono text-slate-400 dark:text-mist-400">
                  Total: {executiveItems.length}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-300">
                    {pendingApprovals.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                    Pending
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-300">
                    {approvedItems.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-300/70 mt-0.5">
                    Authorized
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-xl font-black text-rose-600 dark:text-rose-300">
                    {rejectedItems.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-rose-600/80 dark:text-rose-300/70 mt-0.5">
                    Declined
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-slate-500 dark:text-mist-400 flex items-center justify-between">
                <span>Avg Decision Latency</span>
                <span className="font-mono font-bold text-navy-950 dark:text-white">
                  1.4 hours
                </span>
              </div>
            </div>

            {/* Financial Delegation Meter */}
            <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  Executive Financial Ceiling
                </h4>
                <span className="text-xs font-mono text-emerald-500 font-bold">
                  Limit: ₹2,00,000
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-mist-400">Month-to-Date Committed</span>
                  <span className="font-mono font-bold text-navy-950 dark:text-white">
                    ₹{totalApprovedMTD.toLocaleString('en-IN')} (70.5%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-ink-950 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                    style={{ width: '70.5%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-mist-500 mt-1.5">
                  <span>Duty Mgr Limit: ₹16,000</span>
                  <span>Remaining Room: ₹59,000</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                Any capex requisition exceeding ₹2,00,000 routes automatically to the Board of Directors.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Attention Panel (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-rose-500" />
                  Operational Attention Queue
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Critical items awaiting executive action or escalation review.
                </p>
              </div>
            </div>

            {/* Attention Items List */}
            <div className="space-y-3">
              {/* Item 1: Goodwill Comp Room 402 */}
              {executiveItems.find((i) => i.id === 'exe-1' && i.status === 'Needs approval') && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] hover:bg-amber-500/[0.1] transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      Approval Over Limit
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-500">₹28,000</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy-950 dark:text-white">
                      Goodwill Credit · Room 402
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                      Duty Manager Marcus Vance escalated beyond ₹16,000 threshold following AC leak water damage.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 dark:text-mist-500">Ref: EX-2026-001</span>
                    <button
                      type="button"
                      onClick={() => {
                        const item = executiveItems.find((i) => i.id === 'exe-1');
                        if (item && onOpenApprovalDetail) onOpenApprovalDetail(item);
                        else onNavigateTab('approvals');
                      }}
                      className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      Review Requisition <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Item 2: Otis Lift 2 Controller Capex */}
              {executiveItems.find((i) => i.id === 'exe-3' && i.status === 'Needs approval') && (
                <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] hover:bg-purple-500/[0.1] transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
                      Capex Authorization
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-500">₹48,000</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy-950 dark:text-white">
                      Freight Lift #2 Controller Board
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                      Otis contractor proposal for logic board replacement. Core service elevator down.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 dark:text-mist-500">Engineering · Quote Valid 14d</span>
                    <button
                      type="button"
                      onClick={() => {
                        const item = executiveItems.find((i) => i.id === 'exe-3');
                        if (item && onOpenApprovalDetail) onOpenApprovalDetail(item);
                        else onNavigateTab('approvals');
                      }}
                      className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      Authorize Capex <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Item 3: Active Incident Seepage */}
              {incidents[0] && (
                <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] hover:bg-rose-500/[0.1] transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300">
                      Major Property Incident
                    </span>
                    <span className="text-xs font-mono text-rose-500 font-bold">{incidents[0].reportedAt}</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy-950 dark:text-white">
                      {incidents[0].title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                      {incidents[0].affectedArea} · Lead: {incidents[0].coordinator}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 dark:text-mist-500">Ref: {incidents[0].ref}</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('incidents')}
                      className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      Issue Directive <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Executive Shortcuts */}
          <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
              Executive Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition"
              >
                <div className="text-xs font-bold text-navy-950 dark:text-white">CSV Export</div>
                <div className="text-[10px] text-slate-500 dark:text-mist-400 mt-0.5">Turnaround & SLA</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition"
              >
                <div className="text-xs font-bold text-navy-950 dark:text-white">Audit Ledger</div>
                <div className="text-[10px] text-slate-500 dark:text-mist-400 mt-0.5">Immutable records</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    
      {/* Exact Department Performance Details Modal */}
      {selectedDeptPerformance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedDeptPerformance(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 grid place-items-center border border-amber-500/30">
                  <selectedDeptPerformance.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {selectedDeptPerformance.name} — Performance Details
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedDeptPerformance.slaPercent >= 94
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {selectedDeptPerformance.slaPercent >= 94 ? 'Target Met (≥94%)' : 'Attention Needed (<94%)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Lead: <span className="font-semibold text-navy-950 dark:text-white">{selectedDeptPerformance.head}</span> ({selectedDeptPerformance.leadEmpId}) · Shift Saturation: {selectedDeptPerformance.staffOnDutyCount} of {selectedDeptPerformance.totalStaffCount} On Duty
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDeptPerformance(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 4 Primary KPI metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Metric 1: SLA Adherence */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-mist-500 block">
                    SLA Adherence
                  </span>
                  <div className="text-xl font-black font-mono text-navy-950 dark:text-white mt-1">
                    {selectedDeptPerformance.slaPercent}%
                  </div>
                  <div className="text-[11px] text-emerald-500 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {selectedDeptPerformance.trend} vs last wk
                  </div>
                </div>

                {/* Metric 2: Turnaround Velocity */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-mist-500 block">
                    Avg Turnaround
                  </span>
                  <div className="text-xl font-black font-mono text-navy-950 dark:text-white mt-1 flex items-center gap-1">
                    <Timer className="h-4 w-4 text-amber-500" />
                    {selectedDeptPerformance.avgResolutionMinutes} min
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5">
                    Benchmark: &lt; 20 min
                  </div>
                </div>

                {/* Metric 3: Guest Rating */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-mist-500 block">
                    Guest Score
                  </span>
                  <div className="text-xl font-black font-mono text-navy-950 dark:text-white mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    {selectedDeptPerformance.guestSatisfactionScore} / 5
                  </div>
                  <div className="text-[11px] text-emerald-500 dark:text-emerald-400 font-semibold mt-0.5">
                    Top quartile
                  </div>
                </div>

                {/* Metric 4: Active Workload */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-mist-500 block">
                    Active Tasks
                  </span>
                  <div className="text-xl font-black font-mono text-navy-950 dark:text-white mt-1">
                    {selectedDeptPerformance.activeTasks}
                  </div>
                  <div
                    className={`text-[11px] font-semibold mt-0.5 ${
                      selectedDeptPerformance.overdueTasksCount > 0 ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'
                    }`}
                  >
                    {selectedDeptPerformance.overdueTasksCount > 0
                      ? `${selectedDeptPerformance.overdueTasksCount} overdue`
                      : 'Zero overdue'}
                  </div>
                </div>
              </div>

              {/* 7-Day Performance Trend Bar / Visual Benchmark */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-navy-950 dark:text-white">
                      7-Day SLA Benchmark History
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-mist-400">
                    Property Target: 94.0%
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, idx) => {
                    const val = selectedDeptPerformance.weeklyTrend[idx] || 95;
                    const isAbove = val >= 94;
                    return (
                      <div key={day} className="text-center space-y-1.5">
                        <div className="h-16 flex items-end justify-center">
                          <div
                            className={`w-full max-w-[28px] rounded-lg transition-all ${
                              isAbove ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ height: `${Math.max(20, (val - 70) * 3.3)}%` }}
                            title={`${day}: ${val}%`}
                          />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-navy-950 dark:text-white">
                          {val}%
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-mist-500">
                          {day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Focus & Equipment Areas */}
              {selectedDeptPerformance.keyFocusAreas && selectedDeptPerformance.keyFocusAreas.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-mist-500 block">
                    Operational Focus Areas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeptPerformance.keyFocusAreas.map((focus) => (
                      <span
                        key={focus}
                        className="text-xs px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Operational Queue for this department */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-amber-500" />
                    Live Operational Queue ({selectedDeptPerformance.tasks.length})
                  </h4>
                  <span className="text-[11px] text-slate-400 dark:text-mist-500">
                    Open work items tracked
                  </span>
                </div>

                {selectedDeptPerformance.tasks.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 dark:text-mist-500 rounded-2xl border border-slate-200 dark:border-white/10">
                    All queue items cleared. No pending tasks for this department.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedDeptPerformance.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-xs hover:border-amber-500/30 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-navy-950 dark:text-white flex items-center gap-2">
                            <span>{task.title}</span>
                            {task.priority === 'critical' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                CRITICAL
                              </span>
                            )}
                            {task.priority === 'vip' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-500 border border-purple-500/30">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-mist-500">
                            {task.ref || task.id} · {task.room ? `Room ${task.room} · ` : ''}{task.meta || task.category || 'General Operations'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300">
                            {task.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Staff Roster in this Department */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-500" />
                    Field Team & Shift Coverage ({selectedDeptPerformance.staffMembers.length})
                  </h4>
                  <span className="text-[11px] text-emerald-500 font-semibold">
                    {selectedDeptPerformance.staffOnDutyCount} of {selectedDeptPerformance.totalStaffCount} Active on Duty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedDeptPerformance.staffMembers.map((staff) => (
                    <div
                      key={staff.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-navy-950 dark:text-white">
                          {staff.name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-mist-500 font-mono">
                          {staff.employeeId} · Shift: {staff.shift || 'Day'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-mist-500">
                          Zone: {staff.floorZone || 'Assigned Property'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            staff.availability === 'on_duty'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                          }`}
                        >
                          {staff.availability === 'on_duty' ? 'On Duty' : 'Off Shift'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Monthly CapEx & Opex: <strong className="text-navy-950 dark:text-white">{selectedDeptPerformance.spending}</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const deptName = selectedDeptPerformance.name;
                    setSelectedDeptPerformance(null);
                    onNavigateTab('performance', { department: deptName });
                  }}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  Global Performance Tab <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptPerformance(null)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
