'use client';

import { useState } from 'react';
import {
  PackageSearch,
  EyeOff,
  CheckCircle2,
  Search,
  Plus,
  ShieldCheck,
  UserCheck,
  Clock,
  Archive,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { LostFoundManager } from '@/components/staff/LostFoundManager';
import { useDemo } from '@/lib/store';
import { lostFoundSeed } from '@/lib/mockData';
import type { LostFoundItem } from '@/types/demo';

export type LostItemLifecycleStatus =
  | 'Logged / Published'
  | 'Claim Pending Verification'
  | 'Verified & Returned to Guest'
  | 'Archived';

interface GuestClaim {
  id: string;
  itemId: string;
  itemName: string;
  guestName: string;
  room: string;
  claimedDate: string;
  status: 'pending_verification' | 'released';
  idType: string;
}

const INITIAL_CLAIMS: GuestClaim[] = [
  {
    id: 'cl-1',
    itemId: 'lf1',
    itemName: 'Phone charger (USB-C)',
    guestName: 'Hannah Weiss',
    room: '127',
    claimedDate: 'Today, 09:45',
    status: 'pending_verification',
    idType: 'National ID Verified in PMS',
  },
  {
    id: 'cl-2',
    itemId: 'lf2',
    itemName: 'Sunglasses, tortoiseshell frame',
    guestName: 'Carlos Rossi',
    room: '305',
    claimedDate: 'Today, 11:10',
    status: 'pending_verification',
    idType: 'Passport Verification Required',
  },
];

const INITIAL_STATUS_MAP: Record<string, LostItemLifecycleStatus> = {
  lf1: 'Claim Pending Verification',
  lf2: 'Claim Pending Verification',
  lf3: 'Logged / Published',
};

export function FrontDeskLostFoundPanel({ onOpenRequests }: { onOpenRequests?: () => void }) {
  const { state } = useDemo();
  const [activeTab, setActiveTab] = useState<'claims' | 'all_items' | 'publish'>('claims');
  const [search, setSearch] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState<'all' | 'non_sensitive' | 'sensitive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [claims, setClaims] = useState<GuestClaim[]>(INITIAL_CLAIMS);
  const [itemStatuses, setItemStatuses] = useState<Record<string, LostItemLifecycleStatus>>(INITIAL_STATUS_MAP);
  const [releaseClaimId, setReleaseClaimId] = useState<string | null>(null);

  const rawItems = state.lostFound ?? lostFoundSeed;

  const categories = ['All', 'Electronics', 'Accessories', 'Valuables', 'Other'];

  const filteredItems = rawItems.filter((item) => {
    // Sensitivity filter
    if (sensitivityFilter === 'non_sensitive' && item.sensitive) return false;
    if (sensitivityFilter === 'sensitive' && !item.sensitive) return false;

    // Category filter
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.foundLocation.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (itemId: string, newStatus: LostItemLifecycleStatus) => {
    setItemStatuses((prev) => ({
      ...prev,
      [itemId]: newStatus,
    }));
  };

  const handleRelease = (id: string) => {
    const claim = claims.find((c) => c.id === id);
    if (claim) {
      setItemStatuses((prev) => ({
        ...prev,
        [claim.itemId]: 'Verified & Returned to Guest',
      }));
    }
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'released' as const } : c)),
    );
    setReleaseClaimId(null);
  };

  const releasingClaim = claims.find((c) => c.id === releaseClaimId);
  const pendingClaimsCount = claims.filter((c) => c.status === 'pending_verification').length;

  const getStatusBadgeTone = (st: LostItemLifecycleStatus) => {
    switch (st) {
      case 'Logged / Published':
        return 'info';
      case 'Claim Pending Verification':
        return 'warning';
      case 'Verified & Returned to Guest':
        return 'success';
      case 'Archived':
        return 'neutral';
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Main Sub-Tabs: Claim Requests | All Items | Publish Item */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'claims'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Claim Requests ({pendingClaimsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all_items')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'all_items'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            <PackageSearch className="h-3.5 w-3.5" />
            <span>All Items ({rawItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'publish'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Publish Item (New Lost Item to be Added)</span>
          </button>
        </div>

        {activeTab === 'all_items' && (
          <div className="relative w-48 sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              placeholder="Search items, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field text-xs w-full py-1.5 pl-8"
            />
          </div>
        )}
      </div>

      {/* Sub-tab 1: Claim Requests */}
      {activeTab === 'claims' && (
        <Panel
          title="Guest Claim Inquiries"
          hint="Verify guest identity documents before handing over lost property"
          icon={UserCheck}
        >
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{claim.guestName}</span>
                    <Badge tone="neutral">Room {claim.room}</Badge>
                    <Badge tone={claim.status === 'released' ? 'success' : 'warning'}>
                      {claim.status === 'released' ? 'Handed Over' : 'Pending ID Check'}
                    </Badge>
                  </div>
                  <p className="text-mist-200">
                    Claiming item: <strong className="text-white">{claim.itemName}</strong>
                  </p>
                  <p className="text-[11px] text-mist-400">
                    {claim.claimedDate} · Protocol: {claim.idType}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {claim.status === 'pending_verification' ? (
                    <Button
                      size="sm"
                      variant="accent"
                      iconLeft={ShieldCheck}
                      onClick={() => setReleaseClaimId(claim.id)}
                    >
                      Verify ID &amp; Release
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Item Handed Over
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Sub-tab 2: All Items (with filter toggle for Non-Sensitive vs. Sensitive & Lifecycle Status changer) */}
      {activeTab === 'all_items' && (
        <Panel
          title="Turned-In Property Inventory"
          hint="Items stored in Front Desk Safe or Linen Room. Sensitive items require Duty Manager approval."
          icon={PackageSearch}
        >
          {/* Controls: Sensitivity toggle pills & category pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
            {/* Filter Toggle: Non-Sensitive vs. Sensitive */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-mist-400">Visibility:</span>
              <div className="inline-flex p-0.5 rounded-lg bg-black/30 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setSensitivityFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sensitivityFilter === 'all' ? 'accent-soft' : 'text-mist-400 hover:text-white'
                  }`}
                >
                  All ({rawItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSensitivityFilter('non_sensitive')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sensitivityFilter === 'non_sensitive' ? 'accent-soft' : 'text-mist-400 hover:text-white'
                  }`}
                >
                  Non-Sensitive ({rawItems.filter((i) => !i.sensitive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSensitivityFilter('sensitive')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sensitivityFilter === 'sensitive' ? 'accent-soft' : 'text-mist-400 hover:text-white'
                  }`}
                >
                  Sensitive Vault ({rawItems.filter((i) => i.sensitive).length})
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    selectedCategory === cat
                      ? 'chip-accent'
                      : 'border border-white/10 text-mist-300 hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid with Lifecycle Status Dropdown Selector */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const currentStatus = itemStatuses[item.id] || 'Logged / Published';
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between gap-3 text-xs hover:border-white/20 transition-all shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-white/5 relative flex items-center justify-center">
                      {item.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
                      ) : item.sensitive ? (
                        <EyeOff className="h-6 w-6 text-amber-300" />
                      ) : (
                        <PackageSearch className="h-6 w-6 text-mist-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-xs truncate">{item.name}</span>
                        <Badge tone={item.sensitive ? 'warning' : 'success'}>
                          {item.sensitive ? 'Restricted' : 'Visible'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-mist-300 truncate">Found: {item.foundLocation}</p>
                      <p className="text-[10px] text-mist-400">
                        {item.foundDate} · {item.category}
                      </p>
                    </div>
                  </div>

                  {/* Status row: Current Badge + Status changer selector */}
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-mist-400 font-medium">Status:</span>
                      <Badge tone={getStatusBadgeTone(currentStatus)}>
                        {currentStatus}
                      </Badge>
                    </div>

                    {/* Change Status Dropdown: Logged / Published -> Claim Pending Verification -> Verified & Returned -> Archived */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-mist-400 shrink-0">Set status:</span>
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as LostItemLifecycleStatus)
                        }
                        className="field text-[11px] py-1 px-2 w-full rounded-lg bg-black/40 border-white/10 text-mist-200"
                      >
                        <option value="Logged / Published">Logged / Published</option>
                        <option value="Claim Pending Verification">Claim Pending Verification</option>
                        <option value="Verified & Returned to Guest">Verified &amp; Returned to Guest</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Sub-tab 3: Publish Item (New Lost Item to be Added) */}
      {activeTab === 'publish' && (
        <LostFoundManager
          title="Publish Item (New Lost Item to be Added)"
          hint="Catalog and publish found items into property inventory. Sensitive items are safely withheld from guest view."
          icon={PackageSearch}
        />
      )}

      {/* ID Verification & Release Modal */}
      {releasingClaim && (
        <Modal
          title={`Confirm Release · ${releasingClaim.itemName}`}
          description={`Recipient: ${releasingClaim.guestName} · Room ${releasingClaim.room}`}
          onClose={() => setReleaseClaimId(null)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="subtle" onClick={() => setReleaseClaimId(null)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                iconLeft={ShieldCheck}
                onClick={() => handleRelease(releasingClaim.id)}
              >
                Confirm ID Checked &amp; Hand Over
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-mist-200">
              Front Desk staff has physically inspected the guest&apos;s government-issued ID matching the registered name <strong>{releasingClaim.guestName}</strong>.
            </p>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <p className="font-semibold">Release Sign-off Check:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                <li>Physical identity verified against room registration</li>
                <li>Item description acknowledged by the guest</li>
                <li>Lifecycle status transitioned to Verified &amp; Returned to Guest</li>
                <li>Audit entry logged into Front Desk handover register</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
