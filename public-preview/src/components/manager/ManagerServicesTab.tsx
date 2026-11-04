'use client';

import { useState } from 'react';
import {
  Sparkles,
  Plus,
  Layers,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Search,
  Filter,
  Tag,
  Eye,
  Check,
  X,
  UtensilsCrossed,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { HotelServiceItem } from '@/types/demo';
import { AdminDiningTab } from '@/components/admin/AdminDiningTab';

export function ManagerServicesTab() {
  const { state, createHotelService } = useDemo();
  const [viewMode, setViewMode] = useState<'services' | 'dining'>('services');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Housekeeping');
  const [category, setCategory] = useState('housekeeping');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [availableForGuest, setAvailableForGuest] = useState(true);
  const [requiresSpecialist, setRequiresSpecialist] = useState(false);

  const services = state.hotelServices ?? [];

  const filtered = services.filter((s) => {
    if (selectedDept !== 'all' && s.department.toLowerCase() !== selectedDept.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createHotelService({
      name: name.trim(),
      department,
      category,
      description: description.trim(),
      price: Number(price) || 0,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      availableForGuest,
      requiresSpecialist,
    });

    // Reset
    setName('');
    setDescription('');
    setPrice(0);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* View Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-ink-900 border border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setViewMode('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'services'
              ? 'bg-amber-400 text-ink-950 shadow-md'
              : 'text-mist-400 hover:text-white'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Hotel Services &amp; Facilities</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('dining')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'dining'
              ? 'bg-amber-400 text-ink-950 shadow-md'
              : 'text-mist-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>Dining &amp; Kitchen Menu (F&amp;B)</span>
        </button>
      </div>

      {viewMode === 'dining' ? (
        <AdminDiningTab />
      ) : (
        <>
          {/* Top action header */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">
                  Service Catalog &amp; Department Mapping
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-mist-400 mt-1">
                Configure hotel services offered in the Guest Portal and route automatically to fulfillment queues
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Service</span>
            </button>
          </div>

          {/* Filter strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services by title, department or keyword..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-ink-900/80 border border-white/10 text-xs text-white placeholder-mist-400 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="h-4 w-4 text-mist-400 shrink-0 hidden sm:block" />
              {['all', 'Housekeeping', 'Maintenance', 'Spa & Wellness', 'Front Desk'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedDept === dept
                      ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                      : 'bg-ink-900/80 border border-white/10 text-mist-300 hover:text-white'
                  }`}
                >
                  {dept === 'all' ? 'All Departments' : dept}
                </button>
              ))}
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:border-amber-400/30 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300 text-[10px] font-bold border border-amber-400/20 uppercase tracking-wider">
                      {service.department}
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {service.price > 0 ? `₹${service.price}` : 'Complimentary'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                      {service.name}
                    </h3>
                    <p className="text-xs text-mist-300 mt-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.08] mt-4 flex items-center justify-between text-xs text-mist-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-mist-500" />
                    <span>~{service.estimatedMinutes || 30} mins SLA</span>
                  </div>

                  {service.availableForGuest ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Guest Portal
                    </span>
                  ) : (
                    <span className="text-[11px] text-mist-500">Internal Only</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Creation Modal */}
          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl text-white space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                      <Plus className="h-4 w-4" />
                    </span>
                    <h3 className="text-base font-bold font-display">Create Hotel Service</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-xl text-mist-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-mist-300 font-semibold mb-1">Service Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. In-Room Espresso Machine Setup"
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-mist-300 font-semibold mb-1">Target Department *</label>
                      <select
                        value={department}
                        onChange={(e) => {
                          setDepartment(e.target.value);
                          if (e.target.value === 'Housekeeping') setCategory('housekeeping');
                          else if (e.target.value === 'Maintenance') setCategory('maintenance');
                          else if (e.target.value === 'Dining') setCategory('room_service');
                          else if (e.target.value === 'Spa & Wellness') setCategory('spa');
                          else setCategory('concierge');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                      >
                        <option value="Housekeeping">Housekeeping</option>
                        <option value="Maintenance">Maintenance &amp; Engineering</option>
                        <option value="Dining">In-Room Dining (F&amp;B)</option>
                        <option value="Spa &amp; Wellness">Spa &amp; Wellness</option>
                        <option value="Front Desk">Front Desk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-mist-300 font-semibold mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-mist-300 font-semibold mb-1">Estimated Minutes SLA</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-mist-300 font-semibold mb-1">Service Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed scope of service, deliverables, and requirements..."
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-mist-200">
                      <input
                        type="checkbox"
                        checked={availableForGuest}
                        onChange={(e) => setAvailableForGuest(e.target.checked)}
                        className="rounded border-white/20 bg-ink-950 text-amber-400 focus:ring-0"
                      />
                      <span>Available in Guest Portal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-mist-200">
                      <input
                        type="checkbox"
                        checked={requiresSpecialist}
                        onChange={(e) => setRequiresSpecialist(e.target.checked)}
                        className="rounded border-white/20 bg-ink-950 text-amber-400 focus:ring-0"
                      />
                      <span>Requires Specialist Staff</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 shadow-md shadow-amber-400/20"
                    >
                      Publish Service
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
