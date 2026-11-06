'use client';

import { useState, useEffect } from 'react';
import {
  PackageSearch,
  Search,
  Plus,
  ShieldAlert,
  ImageOff,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  FileQuestion,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Camera,
  X,
  Send,
  HelpCircle,
  Tag,
  ShieldCheck,
  Building,
  MessageSquare,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestEmptyState, GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps, GuestLostFoundSubtab } from '@/components/guest/types';
import type { LostItemStatus } from '@/types/demo';

const ITEM_CATEGORIES = [
  'Electronics & Gadgets',
  'Wallets, Purses & Bags',
  'Jewelry & Watches',
  'Clothing & Accessories',
  'Keys, Access Cards & IDs',
  'Travel Documents & Passports',
  'Eyewear & Sunglasses',
  'Personal Accessories & Toys',
  'Other Items',
];

const PRESET_LOCATIONS = [
  'Hotel Lobby / Reception',
  'Grand Restaurant & Terrace',
  'Lapis Lounge & Bar',
  'Infinity Pool & Cabanas',
  'Fitness Center & Spa',
  'Guest Floor Corridors / Elevators',
  'In-room / Suite',
  'Valet / Parking Deck',
  'Conference & Banquet Halls',
  'Outside / Hotel Perimeter',
];

const STATUS_CONFIG: Record<LostItemStatus, { label: string; tone: string; desc: string }> = {
  Reported: {
    label: 'Reported',
    tone: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    desc: 'Logged in system and queued for Front Desk & Security investigation',
  },
  'Under Investigation': {
    label: 'Under Investigation',
    tone: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    desc: 'Security cross-referencing recent turn-ins and CCTV logs',
  },
  'Item Found': {
    label: 'Item Found',
    tone: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    desc: 'Potential match found and safely secured in Front Desk safe',
  },
  'Verification Pending': {
    label: 'Verification Pending',
    tone: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
    desc: 'Awaiting guest identification and verification details at Front Desk',
  },
  'Returned to Guest': {
    label: 'Returned to Guest',
    tone: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    desc: 'Successfully verified and returned to guest',
  },
  Closed: {
    label: 'Case Closed',
    tone: 'bg-mist-600/20 text-mist-300 border-mist-500/30',
    desc: 'Case resolved or closed by hotel management',
  },
};


const FOUND_ITEM_FALLBACK_IMAGES: Record<string, string> = {
  lf1: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
  lf2: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  lf3: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80',
  lf4: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
};

export function LostFoundSection({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const { state, submitGuestLostItemReport, submitGuestFoundItemClaim } = useDemo();

  const [activeTab, setActiveTab] = useState<GuestLostFoundSubtab>(
    (initialSubtab as GuestLostFoundSubtab) === 'lost' ? 'lost' : 'found',
  );

  useEffect(() => {
    if (initialSubtab === 'lost' || initialSubtab === 'found') {
      setActiveTab(initialSubtab);
    }
  }, [initialSubtab]);

  // Search & filter for found items
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Claim item modal state
  const [claimModalItem, setClaimModalItem] = useState<{ id: string; name: string; photo?: string } | null>(null);
  const [claimDescription, setClaimDescription] = useState('');

  // Report lost item form state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportItemName, setReportItemName] = useState('');
  const [reportCategory, setReportCategory] = useState(ITEM_CATEGORIES[0]);
  const [reportDescription, setReportDescription] = useState('');
  const [reportDateLost, setReportDateLost] = useState('Today');
  const [reportTimeLost, setReportTimeLost] = useState('Afternoon (12:00 - 16:00)');
  const [reportLastLocation, setReportLastLocation] = useState(PRESET_LOCATIONS[0]);
  const [reportAdditionalInfo, setReportAdditionalInfo] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Expandable items state
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // State data
  const rawFoundItems = state.lostFound ?? [];
  const guestReports = (state.guestLostReports ?? []).filter((r) => r.room === room);

  // Filter out sensitive found items for privacy and security
  const visibleFoundItems = rawFoundItems.filter((i) => !i.sensitive);
  const restrictedFoundCount = rawFoundItems.filter((i) => i.sensitive).length;

  // Search and category filter
  const filteredFoundItems = visibleFoundItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.foundLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'Electronics' && item.name.toLowerCase().includes('phone')) ||
      (selectedCategory === 'Watches' && item.name.toLowerCase().includes('watch')) ||
      (selectedCategory === 'Accessories' && !item.name.toLowerCase().includes('watch'));
    return matchesSearch && matchesCategory;
  });

  // Handle Photo Attachment
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Submit Lost Report
  function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportItemName.trim() || !reportDescription.trim()) return;

    const ref = submitGuestLostItemReport({
      room,
      guestName,
      itemName: reportItemName.trim(),
      category: reportCategory,
      description: reportDescription.trim(),
      dateLost: `${reportDateLost} · ${reportTimeLost}`,
      lastLocation: reportLastLocation,
      photoUrl: photoPreview || undefined,
      additionalInfo: reportAdditionalInfo.trim() || undefined,
    });

    setReportItemName('');
    setReportDescription('');
    setReportAdditionalInfo('');
    setPhotoPreview(null);
    setIsReportModalOpen(false);
    setActiveTab('lost');
    setExpandedReportId(ref);
    setSuccessToast(`Report lodged under Reference ${ref}. Duty staff notified.`);
    setTimeout(() => setSuccessToast(null), 6000);
  }

  // Submit Claim
  function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimModalItem || !claimDescription.trim()) return;

    const ref = submitGuestFoundItemClaim({
      room,
      guestName,
      itemId: claimModalItem.id,
      itemName: claimModalItem.name,
      message: claimDescription.trim(),
    });

    setClaimModalItem(null);
    setClaimDescription('');
    setSuccessToast(`Ownership claim submitted (${ref}). Front Desk will verify.`);
    setTimeout(() => setSuccessToast(null), 6000);
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Success Banner */}
      {successToast && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <p className="font-semibold text-emerald-300">Request Recorded</p>
            <p className="text-xs text-mist-200 mt-0.5">{successToast}</p>
          </div>
        </div>
      )}

      {/* Main Switcher: Enquire About Found Item vs Report Lost Item */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/30 border border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab('found')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'found'
              ? 'bg-amber-400 text-ink-950 shadow-md font-bold'
              : 'text-mist-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <PackageSearch className="h-4 w-4 shrink-0" />
          <span>Enquire Found Items</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono">
            {visibleFoundItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lost')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'lost'
              ? 'bg-amber-400 text-ink-950 shadow-md font-bold'
              : 'text-mist-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>Report a Lost Item</span>
          {guestReports.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono">
              {guestReports.length}
            </span>
          )}
        </button>
      </div>

      {/* SECTION A: ENQUIRE ABOUT A FOUND ITEM */}
      {activeTab === 'found' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="guest-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <PackageSearch className="h-4 w-4 text-amber-400" />
                  <span>Items Turned In to Front Desk</span>
                </h2>
                <p className="text-[11px] text-mist-400 mt-0.5">
                  Items cataloged by Housekeeping &amp; Security. Tap &quot;This is Mine&quot; to initiate ownership verification.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md self-start sm:self-auto shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Report Missing Item</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-mist-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search found items by name, color, or location..."
                className="guest-field w-full pl-10 pr-4 py-2.5 text-xs text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-mist-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          

          {/* Found Items Grid */}
          <div className="space-y-3">
            <GuestSectionHeader
              title="Recent Turn-Ins"
              hint={`${filteredFoundItems.length} items currently logged and awaiting collection`}
            />

            {filteredFoundItems.length === 0 ? (
              <GuestEmptyState
                icon={PackageSearch}
                title="No matching items found"
                hint="We haven't found an item matching your search. Please file a lost item report below so our team can alert you immediately if it turns up."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredFoundItems.map((item) => {
                  const isClaimedByMe = item.claimedRoom === room;
                  return (
                    <div
                      key={item.id}
                      className="guest-card overflow-hidden flex flex-col justify-between hover:border-amber-400/30 transition-all"
                    >
                      {/* Item Preview Header */}
                      <div className="guest-surface-2 relative h-40 sm:h-44 md:h-48 flex items-center justify-center overflow-hidden bg-black/40">
                        {item.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-mist-500">
                            <PackageSearch className="h-8 w-8" />
                            <span className="text-[10px]">Photo not uploaded</span>
                          </div>
                        )}

                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-medium text-amber-300 border border-white/10">
                          #{item.id}
                        </span>

                        {item.claimed && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-purple-500/80 backdrop-blur-sm text-[10px] font-semibold text-white">
                            {isClaimedByMe ? 'Claimed by you' : 'Claim in review'}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h3 className="text-xs font-bold text-white leading-snug">{item.name}</h3>
                          <div className="space-y-1 text-[11px] text-mist-300">
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                              <span>Found at: <strong className="text-white">{item.foundLocation}</strong></span>
                            </p>
                            <p className="flex items-center gap-1.5 text-mist-400">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Logged: {item.foundDate}</span>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-white/5">
                          {isClaimedByMe ? (
                            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                              <p className="text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Verification Pending</span>
                              </p>
                              <p className="text-[10px] text-mist-300 mt-0.5">
                                Present room key and photo ID at Front Desk to collect.
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={item.claimed}
                              onClick={() => setClaimModalItem({ id: item.id, name: item.name, photo: item.photo })}
                              className="w-full py-2 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>This is Mine · Claim Item</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B: REPORT A LOST ITEM & MY TRACKED REPORTS */}
      {activeTab === 'lost' && (
        <div className="space-y-5">
          {/* Hero Action Card */}
          <div className="guest-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-400" />
                  <span>Report Lost Belongings</span>
                </h2>
                <p className="text-[11px] text-mist-400 mt-0.5">
                  Lodge a formal lost property ticket. Security and Housekeeping will sweep the property and cross-reference inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md self-start sm:self-auto shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>File New Lost Report</span>
              </button>
            </div>
          </div>

          {/* My Tracked Reports */}
          <div className="space-y-3">
            <GuestSectionHeader
              title="Your Reported Items &amp; Claims"
              hint="Track real-time investigation stages, security notes, and collection status"
            />

            {guestReports.length === 0 ? (
              <GuestEmptyState
                icon={FileQuestion}
                title="No lost reports registered"
                hint="You haven't filed any lost property reports yet. If you have misplaced an item anywhere on the property, tap 'File New Lost Report' above."
              />
            ) : (
              <div className="space-y-3">
                {guestReports.map((report) => {
                  const statusInfo = STATUS_CONFIG[report.status] || STATUS_CONFIG.Reported;
                  const isExpanded = expandedReportId === report.ref;

                  return (
                    <div
                      key={report.id}
                      className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                    >
                      {/* Summary Row */}
                      <button
                        type="button"
                        onClick={() => setExpandedReportId(isExpanded ? null : report.ref)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300 shrink-0 mt-0.5">
                            <PackageSearch className="h-5 w-5" />
                          </span>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-amber-300 font-bold">{report.ref}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.tone}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white">{report.itemName}</h3>
                            <p className="text-[11px] text-mist-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {report.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {report.lastLocation}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {report.submittedAt}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-mist-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-mist-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Details & Timeline */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 text-xs">
                          {/* Item Description */}
                          <div className="p-3 rounded-xl bg-white/5 space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
                              Item Description &amp; Details
                            </p>
                            <p className="text-mist-200 leading-relaxed">{report.description}</p>
                            {report.additionalInfo && (
                              <p className="text-[11px] text-mist-400 pt-1 border-t border-white/5">
                                <strong className="text-mist-300">Additional details:</strong> {report.additionalInfo}
                              </p>
                            )}
                          </div>

                          {/* Photo preview if attached */}
                          {report.photoUrl && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
                                Attached Photo
                              </p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={report.photoUrl}
                                alt={report.itemName}
                                className="h-32 w-auto max-w-full rounded-xl object-cover border border-white/10"
                              />
                            </div>
                          )}

                          {/* Status Description Box */}
                          <div className={`p-3 rounded-xl border ${statusInfo.tone} flex items-start gap-2.5`}>
                            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-white">Current Status: {statusInfo.label}</p>
                              <p className="text-[11px] text-mist-200 mt-0.5">{statusInfo.desc}</p>
                            </div>
                          </div>

                          {/* Verification Guidance */}
                          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 space-y-1">
                            <p className="font-semibold flex items-center gap-1.5 text-sky-300">
                              <ShieldCheck className="h-4 w-4 shrink-0" />
                              <span>Ownership Verification Procedure</span>
                            </p>
                            <p className="text-[11px] text-mist-300 leading-relaxed">
                              When matching property is turned in, Front Desk coordinator Meera Nambiar or Duty Manager Marcus Vance will inspect the item. Please visit the Front Desk with valid photo ID (matching your booking name <strong>{guestName}</strong>) to complete pickup.
                            </p>
                          </div>

                          {/* Audit Timeline */}
                          {report.history && report.history.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
                                Investigation &amp; Custody Timeline
                              </p>
                              <ol className="relative border-l border-white/10 ml-3 space-y-3">
                                {report.history.map((h, i) => (
                                  <li key={i} className="mb-2 ml-4">
                                    <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-amber-400 bg-ink-950" />
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white text-[11px]">{h.status}</span>
                                      <span className="text-[10px] text-mist-400 font-mono">{h.at}</span>
                                    </div>
                                    {h.note && <p className="text-[11px] text-mist-300 mt-0.5">{h.note}</p>}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: REPORT A LOST ITEM SHEET */}
      {isReportModalOpen && (
        <GuestSheet
          title="Report a Lost Item"
          onClose={() => setIsReportModalOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportItemName.trim() || !reportDescription.trim()}
                onClick={handleSubmitReport}
                className="flex-2 py-3 px-4 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Submit to Front Desk</span>
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
            {/* Auto-Linked Room & Guest Info */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-mist-400 font-medium">Guest &amp; Room Details (Auto-linked)</p>
                <p className="text-white font-bold">{guestName} · Room {room}</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-emerald-400/10 text-emerald-300 font-semibold text-[10px] border border-emerald-400/20">
                Verified Stay
              </span>
            </div>

            {/* Item Name */}
            <div className="space-y-1">
              <label htmlFor="lf-name" className="text-mist-300 font-semibold block">
                Item Name / Title <span className="text-amber-400">*</span>
              </label>
              <input
                id="lf-name"
                type="text"
                required
                value={reportItemName}
                onChange={(e) => setReportItemName(e.target.value)}
                placeholder="e.g. Silver iPad Pro with black folio cover"
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label htmlFor="lf-cat" className="text-mist-300 font-semibold block">
                Category <span className="text-amber-400">*</span>
              </label>
              <select
                id="lf-cat"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-ink-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Lost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="lf-date" className="text-mist-300 font-semibold block">
                  Date Lost
                </label>
                <input
                  id="lf-date"
                  type="text"
                  value={reportDateLost}
                  onChange={(e) => setReportDateLost(e.target.value)}
                  placeholder="e.g. Today or Nov 1"
                  className="guest-field w-full px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="lf-time" className="text-mist-300 font-semibold block">
                  Approx. Time
                </label>
                <input
                  id="lf-time"
                  type="text"
                  value={reportTimeLost}
                  onChange={(e) => setReportTimeLost(e.target.value)}
                  placeholder="e.g. 14:00 - 16:00"
                  className="guest-field w-full px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Last Known Location */}
            <div className="space-y-1">
              <label htmlFor="lf-loc" className="text-mist-300 font-semibold block">
                Last Known Location
              </label>
              <select
                id="lf-loc"
                value={reportLastLocation}
                onChange={(e) => setReportLastLocation(e.target.value)}
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-ink-900 text-white">
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1">
              <label htmlFor="lf-desc" className="text-mist-300 font-semibold block">
                Detailed Description &amp; Distinctive Marks <span className="text-amber-400">*</span>
              </label>
              <textarea
                id="lf-desc"
                required
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Include color, model number, brand, stickers, scratches, case details, or lock screen wallpaper..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Additional Info */}
            <div className="space-y-1">
              <label htmlFor="lf-add" className="text-mist-300 font-semibold block">
                Additional Information (Optional)
              </label>
              <input
                id="lf-add"
                type="text"
                value={reportAdditionalInfo}
                onChange={(e) => setReportAdditionalInfo(e.target.value)}
                placeholder="Alternate phone number, flight departure time, urgency..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Photo Attachment */}
            <div className="space-y-1.5">
              <span className="text-mist-300 font-semibold block">Attach Photo (Optional)</span>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="h-28 w-auto object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer text-mist-300 hover:text-white transition-colors">
                  <Camera className="h-4 w-4 text-amber-400" />
                  <span>Upload Reference Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </form>
        </GuestSheet>
      )}

      {/* MODAL 2: CLAIM FOUND ITEM SHEET */}
      {claimModalItem && (
        <GuestSheet
          title="Verify &amp; Claim Item"
          onClose={() => setClaimModalItem(null)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setClaimModalItem(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!claimDescription.trim()}
                onClick={handleSubmitClaim}
                className="flex-2 py-3 px-4 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Submit Claim</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              {claimModalItem.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={claimModalItem.photo}
                  alt={claimModalItem.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-amber-400/20 text-amber-300">
                  <PackageSearch className="h-6 w-6" />
                </span>
              )}
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold">Item #{claimModalItem.id}</span>
                <p className="text-white font-bold">{claimModalItem.name}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Security Ownership Verification</span>
              </p>
              <p className="text-[11px] text-mist-300 mt-1 leading-relaxed">
                To prevent wrongful collection, describe any secret or unique identifiers (e.g. lock code, contents, engraving, or specific markings).
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="claim-desc" className="text-mist-300 font-semibold block">
                Proof of Ownership / Identifying Details <span className="text-amber-400">*</span>
              </label>
              <textarea
                id="claim-desc"
                required
                rows={3}
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="e.g. The phone has a lock screen showing two golden retrievers, and a small hairline scratch on the top-right corner..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>

            <p className="text-[11px] text-mist-400">
              Upon submission, Front Desk will be alerted. You can proceed to the Front Desk at your convenience with your photo ID to retrieve the item.
            </p>
          </div>
        </GuestSheet>
      )}
    </div>
  );
}
