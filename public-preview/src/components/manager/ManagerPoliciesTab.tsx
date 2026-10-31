'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building,
  CheckCircle2,
  ChevronRight,
  Edit2,
  FileCheck,
  FileText,
  Lock,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { DepartmentServicePolicy } from '@/types/demo';

export function ManagerPoliciesTab() {
  const { state, saveDepartmentServicePolicy, notify } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal state
  const [editingPolicy, setEditingPolicy] = useState<DepartmentServicePolicy | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: 'Operations & Duty Desk',
    category: 'Service Instruction' as DepartmentServicePolicy['category'],
    scope: 'Department-wide',
    content: '',
    authorityLimit: '₹10,000 (Department Manager ceiling)',
    escalationTarget: 'General Manager (via Executive Desk)',
  });

  const departmentPolicies = state.departmentPolicies ?? [];

  const filteredPolicies = useMemo(() => {
    return departmentPolicies.filter((policy) => {
      if (selectedDept !== 'all' && !policy.department.toLowerCase().includes(selectedDept.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'all' && policy.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = policy.title.toLowerCase().includes(q);
        const matchContent = policy.content.toLowerCase().includes(q);
        const matchDept = policy.department.toLowerCase().includes(q);
        const matchOwner = policy.policyOwner.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchDept && !matchOwner) return false;
      }
      return true;
    });
  }, [departmentPolicies, selectedDept, selectedCategory, searchQuery]);

  const handleOpenEdit = (policy: DepartmentServicePolicy) => {
    if (!policy.isManagerLevel) {
      notify('General Manager policies are property-wide and locked. Only Department policies can be modified.');
      return;
    }
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      department: policy.department,
      category: policy.category,
      scope: policy.scope,
      content: policy.content,
      authorityLimit: policy.authorityLimit || '',
      escalationTarget: policy.escalationTarget || '',
    });
  };

  const handleSavePolicy = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      notify('Please provide both policy title and operational instructions.');
      return;
    }

    saveDepartmentServicePolicy({
      id: editingPolicy ? editingPolicy.id : undefined,
      title: formData.title.trim(),
      department: formData.department,
      category: formData.category,
      scope: formData.scope,
      policyOwner: 'Marcus Vance (Department Manager)',
      content: formData.content.trim(),
      authorityLimit: formData.authorityLimit.trim(),
      escalationTarget: formData.escalationTarget.trim(),
      isManagerLevel: true,
    });

    notify(
      editingPolicy
        ? `Policy updated: "${formData.title}" — broadcast to department roles`
        : `New department policy established: "${formData.title}"`,
    );

    setEditingPolicy(null);
    setIsCreateModalOpen(false);
    setFormData({
      title: '',
      department: 'Operations & Duty Desk',
      category: 'Service Instruction',
      scope: 'Department-wide',
      content: '',
      authorityLimit: '₹10,000 (Department Manager ceiling)',
      escalationTarget: 'General Manager (via Executive Desk)',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-300">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Department Service Policies & Guidance</h2>
          </div>
          <p className="text-xs text-mist-400 mt-1">
            Department-specific service instructions, authority discretion limits, and escalation rules visible across staff consoles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingPolicy(null);
              setFormData({
                title: '',
                department: 'Operations & Duty Desk',
                category: 'Service Instruction',
                scope: 'Department-wide',
                content: '',
                authorityLimit: '₹10,000 (Department Manager ceiling)',
                escalationTarget: 'General Manager (via Executive Desk)',
              });
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Department Policy</span>
          </button>
        </div>
      </div>

      {/* Authority Notice Card */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 mt-0.5">
            <Shield className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-purple-200">
              Department Policy Scope & Ownership Governance
            </h4>
            <p className="text-mist-300 leading-relaxed">
              As Department Manager, policies defined here govern local frontline procedures and authority limits up to{' '}
              <strong className="text-white">₹10,000</strong>. General Manager property-wide policies are displayed for compliance reference and cannot be overwritten. All saved policies automatically propagate to frontline dispatcher and fulfiller policy sections.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by keyword, title, owner, or instruction..."
            className="w-full h-8 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950">All Departments</option>
            <option value="Operations" className="bg-ink-950">Operations & Duty Desk</option>
            <option value="Housekeeping" className="bg-ink-950">Housekeeping & Suites</option>
            <option value="Maintenance" className="bg-ink-950">Maintenance & Engineering</option>
            <option value="Food" className="bg-ink-950">Food & Beverage</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950">All Categories</option>
            <option value="Service Instruction" className="bg-ink-950">Service Instruction</option>
            <option value="Authority Guidance" className="bg-ink-950">Authority Guidance</option>
            <option value="Escalation Protocol" className="bg-ink-950">Escalation Protocol</option>
            <option value="Quality Standard" className="bg-ink-950">Quality Standard</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPolicies.map((policy) => {
          const isDeptManagerOwner = policy.isManagerLevel;

          return (
            <div
              key={policy.id}
              className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4 hover:border-white/20 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Pills */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {policy.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-mist-300 bg-white/[0.04] border border-white/10">
                      {policy.department}
                    </span>
                  </div>

                  {isDeptManagerOwner ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                      <UserCheck className="h-3 w-3" /> Dept Manager
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 shrink-0">
                      <Lock className="h-3 w-3" /> GM Standard
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white font-display">
                  {policy.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-mist-300 leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
                  {policy.content}
                </p>

                {/* Scope & Authority Limits */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
                    <span className="text-[10px] font-bold text-mist-500 uppercase block">Authority Ceiling</span>
                    <span className="font-mono text-amber-300 font-semibold mt-0.5 block truncate">
                      {policy.authorityLimit || 'Standard SOP'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
                    <span className="text-[10px] font-bold text-mist-500 uppercase block">Escalation Pathway</span>
                    <span className="text-mist-200 font-semibold mt-0.5 block truncate">
                      {policy.escalationTarget || 'Duty Manager Desk'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] text-mist-400">
                <span className="truncate max-w-[200px]">Owner: {policy.policyOwner}</span>
                {isDeptManagerOwner ? (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(policy)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-mist-200 hover:text-white font-semibold transition border border-white/10"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Directive</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-mist-500 italic">Hotel SOP (Read-only)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Policy Modal */}
      {(isCreateModalOpen || editingPolicy) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  {editingPolicy ? 'Edit Department Service Policy' : 'Create Department Service Policy'}
                </h3>
                <p className="text-xs text-mist-400">
                  Manager: Marcus Vance · Scope: Departmental Operations
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingPolicy(null);
                }}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Policy Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. VIP Urgent Amenities Escalation"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                    Target Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Operations & Duty Desk" className="bg-ink-950">Operations & Duty Desk</option>
                    <option value="Housekeeping & Suites" className="bg-ink-950">Housekeeping & Suites</option>
                    <option value="Maintenance & Engineering" className="bg-ink-950">Maintenance & Engineering</option>
                    <option value="Food & Beverage" className="bg-ink-950">Food & Beverage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Service Instruction" className="bg-ink-950">Service Instruction</option>
                    <option value="Authority Guidance" className="bg-ink-950">Authority Guidance</option>
                    <option value="Escalation Protocol" className="bg-ink-950">Escalation Protocol</option>
                    <option value="Quality Standard" className="bg-ink-950">Quality Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Policy Content & Instructions *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  placeholder="Explicit operational steps, standards, and compliance expectations..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                    Discretion / Authority Ceiling
                  </label>
                  <input
                    type="text"
                    value={formData.authorityLimit}
                    onChange={(e) => setFormData({ ...formData, authorityLimit: e.target.value })}
                    placeholder="e.g. ₹10,000 (Department Manager ceiling)"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                    Escalation Target
                  </label>
                  <input
                    type="text"
                    value={formData.escalationTarget}
                    onChange={(e) => setFormData({ ...formData, escalationTarget: e.target.value })}
                    placeholder="e.g. General Manager (via Executive Desk)"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingPolicy(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicy}
                className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
              >
                {editingPolicy ? 'Update Directive' : 'Publish Department Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
