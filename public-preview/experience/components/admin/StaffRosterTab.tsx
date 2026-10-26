'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { roles, roleById } from '@/lib/roles';
import { PERMISSION_RULES } from '@/lib/mockData';
import { money } from '@/lib/utils';
import type { RoleId, StaffAccount } from '@/types/demo';

export function StaffRosterTab() {
  const { state, toggleStaffStatus, updateStaffRole, addStaffAccount } = useDemo();
  const staff = state.staffAccounts ?? [];

  // Search & filter state
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  // New staff form state
  const [newEmployeeId, setNewEmployeeId] = useState(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<RoleId>('task_fulfiller');
  const [newDept, setNewDept] = useState('Housekeeping');
  const [newScope, setNewScope] = useState('Floors 1–5');
  const [newShift, setNewShift] = useState<StaffAccount['shift']>('Day');
  const [newFinancialLimit, setNewFinancialLimit] = useState(0);

  // Unique departments for filter
  const departments = useMemo(() => {
    return Array.from(new Set(staff.map((s) => s.department)));
  }, [staff]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.employeeId.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q);

      const matchesDept = deptFilter === 'all' || s.department === deptFilter;
      const matchesRole = roleFilter === 'all' || s.roleId === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesQuery && matchesDept && matchesRole && matchesStatus;
    });
  }, [staff, query, deptFilter, roleFilter, statusFilter]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    addStaffAccount({
      employeeId: newEmployeeId,
      name: newName.trim(),
      email: newEmail.trim(),
      roleId: newRole,
      department: newDept,
      floorZone: newScope,
      shift: newShift,
      status: 'active',
      financialLimit: newFinancialLimit,
    });

    // Reset & close
    setNewName('');
    setNewEmail('');
    setNewEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    updateStaffRole(
      editingStaff.id,
      editingStaff.roleId,
      editingStaff.department,
      editingStaff.floorZone,
      editingStaff.shift,
    );
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-400" />
            Staff Accounts & RBAC Governance
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Manage employee identities, profile grants, department/floor scopes, and shift entitlements in accordance with ER_DIAGRAMS Domain 1 and least-privilege RBAC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant={showMatrix ? 'subtle' : 'ghost'}
            iconLeft={ShieldCheck}
            onClick={() => setShowMatrix(!showMatrix)}
          >
            {showMatrix ? 'Hide Permission Matrix' : 'View RBAC Matrix'}
          </Button>

          <Button
            size="sm"
            variant="accent"
            iconLeft={UserPlus}
            onClick={() => setAddModalOpen(true)}
          >
            Add Staff Account
          </Button>
        </div>
      </div>

      {/* Understandable Role-Permission Matrix Section */}
      {showMatrix && (
        <div className="rounded-3xl border border-white/10 bg-ink-900/95 p-6 backdrop-blur-xl shadow-2xl space-y-4 animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-300" />
                Architectural Role-Permission Matrix (SECURITY.md & ER_DIAGRAMS)
              </h3>
              <p className="text-xs text-mist-300 mt-0.5">
                Every action requires an applicable grant. Frontline runners have no folio access; only Finance can execute refunds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMatrix(false)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-mist-400">
                  <th className="p-3 font-semibold w-72">Operational Capability / Action</th>
                  <th className="p-3 font-semibold">Category</th>
                  {roles.map((r) => (
                    <th key={r.id} className="p-2 text-center font-bold text-[11px] whitespace-nowrap">
                      <span className="block text-white">{r.short}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-mist-300">
                {PERMISSION_RULES.map((rule) => (
                  <tr key={rule.key} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <strong className="block text-white font-medium">{rule.label}</strong>
                      <span className="text-[11px] text-mist-400 block mt-0.5">{rule.description}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-mist-300">
                        {rule.category}
                      </span>
                    </td>
                    {roles.map((r) => {
                      const isAllowed = rule.allowedRoles.includes(r.id);
                      return (
                        <td key={r.id} className="p-2 text-center">
                          {isAllowed ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.02] text-mist-600">
                              ·
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, employee ID, or email…"
            className="w-full rounded-xl border border-white/10 bg-ink-950/70 py-2 pl-10 pr-4 text-xs text-white placeholder:text-mist-500 focus:outline-none focus:border-amber-400/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Departments ({staff.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Profiles (9 roles)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-mist-400">
                <th className="p-4 font-semibold">Employee ID</th>
                <th className="p-4 font-semibold">Staff Member</th>
                <th className="p-4 font-semibold">Assigned Profile</th>
                <th className="p-4 font-semibold">Department & Scope</th>
                <th className="p-4 font-semibold">Shift</th>
                <th className="p-4 font-semibold">Financial Limit</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-mist-300">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-mist-400">
                    No staff accounts match your current filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((emp) => {
                  const roleMeta = roleById[emp.roleId];
                  const Icon = roleMeta?.icon ?? Users;
                  const isActive = emp.status === 'active';

                  return (
                    <tr key={emp.id} className="hover:bg-white/[0.02] transition">
                      {/* Employee ID */}
                      <td className="p-4 font-mono font-bold text-amber-300 text-xs">
                        {emp.employeeId}
                      </td>

                      {/* Staff Member */}
                      <td className="p-4">
                        <span className="font-bold text-white block text-sm">{emp.name}</span>
                        <span className="text-[11px] text-mist-400 block">{emp.email}</span>
                      </td>

                      {/* Assigned Profile */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white">
                          <Icon className="h-3.5 w-3.5 text-amber-300" />
                          <span>{roleMeta?.short ?? emp.roleId}</span>
                        </span>
                      </td>

                      {/* Department & Scope */}
                      <td className="p-4">
                        <span className="font-medium text-white block">{emp.department}</span>
                        <span className="text-[11px] text-mist-400 block">{emp.floorZone}</span>
                      </td>

                      {/* Shift */}
                      <td className="p-4">
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-mist-300">
                          {emp.shift} Shift
                        </span>
                      </td>

                      {/* Financial Limit */}
                      <td className="p-4">
                        {emp.financialLimit > 0 ? (
                          <span className="font-bold text-emerald-400">
                            {money(emp.financialLimit)}
                          </span>
                        ) : (
                          <span className="text-mist-500 font-mono text-[11px]">₹0 (None)</span>
                        )}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStaffStatus(emp.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition ${
                            isActive
                              ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/20'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                          }`}
                          title={isActive ? 'Click to deactivate staff member' : 'Click to reactivate staff member'}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingStaff(emp)}
                          className="text-xs"
                        >
                          Edit Scope
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Account Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-ink-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-amber-300" />
                  Provision New Staff Account
                </h3>
                <p className="text-xs text-mist-300 mt-0.5">
                  Creates an authorized employee identity in accordance with ER_DIAGRAMS Domain 1.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sen"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@thegrandadp.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Role / Profile Grant</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as RoleId)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Floor Scope</label>
                  <input
                    type="text"
                    required
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Shift</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as StaffAccount['shift'])}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Rotating">Rotating</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Financial Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newFinancialLimit}
                    onChange={(e) => setNewFinancialLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="subtle" size="md" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" iconLeft={Check}>
                  Provision Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Scope Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-ink-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-amber-300" />
                  Edit Role & Scopes: {editingStaff.name}
                </h3>
                <p className="text-xs text-mist-300 mt-0.5">
                  Modify profile grants, department bindings, or shift schedule ({editingStaff.employeeId}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-mist-300 block mb-1">Role / Profile Grant</label>
                <select
                  value={editingStaff.roleId}
                  onChange={(e) => setEditingStaff({ ...editingStaff, roleId: e.target.value as RoleId })}
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={editingStaff.department}
                  onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Floor Zone Scope</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.floorZone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, floorZone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Assigned Shift</label>
                  <select
                    value={editingStaff.shift}
                    onChange={(e) => setEditingStaff({ ...editingStaff, shift: e.target.value as StaffAccount['shift'] })}
                    className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Rotating">Rotating</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="subtle" size="md" onClick={() => setEditingStaff(null)}>
                  Cancel
                </Button>
                <Button variant="accent" size="md" type="submit" iconLeft={Check}>
                  Save Scopes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
