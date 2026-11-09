'use client';

import { useState, useRef } from 'react';
import {
  ShieldAlert,
  Radio,
  Camera,
  Upload,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  Eye,
  Trash2,
  ZoomIn,
  Users,
  Flame,
  FileText,
  Activity,
  History,
  X,
  Volume2,
  CheckCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { SafetyAlertRecord, SafetyAlertStatus, WorkItem } from '@/types/demo';
import { playSecurityChime, playPanicSiren } from './securityChime';

export function SecurityAlertsTab() {
  const {
    state,
    submitSecuritySafetyAlert,
    resolveSafetyAlert,
    acknowledgeSafetyAlert,
    addSecurityNote,
  } = useDemo();

  // Safety Alerts list from global state
  const alerts: SafetyAlertRecord[] = state.safetyAlerts ?? [];

  // Incidents from security responder
  const securityIncidents: WorkItem[] = state.items.security_responder ?? [];
  const activeIncidents = securityIncidents.filter((i) => i.status !== 'Resolved');

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'broadcast_active' | 'pending' | 'resolved'>('all');
  const [showComposer, setShowComposer] = useState(true);
  const [selectedAuditAlert, setSelectedAuditAlert] = useState<SafetyAlertRecord | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Form State for Sending Safety Alert
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('sec-1');
  const [title, setTitle] = useState('Critical Safety Alert: Panic alarm · Pool deck');
  const [priority, setPriority] = useState<SafetyAlertRecord['priority']>('critical');
  const [incidentType, setIncidentType] = useState<SafetyAlertRecord['incidentType']>('life_safety');
  const [location, setLocation] = useState('Pool Deck & Cabanas (West Wing), Level 1');
  const [broadcastScope, setBroadcastScope] = useState<SafetyAlertRecord['broadcastScope']>('hotel_wide');
  const [description, setDescription] = useState(
    'Panic alarm tripped near Cabana 4. Lifeguards and Security on scene. Securing water perimeter and redirecting guests toward indoor promenade.'
  );

  // Photo attachment state
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'
  );
  const [sentSuccessRef, setSentSuccessRef] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incident selection from dropdown: automatically pre-fill information & scene picture
  const handleIncidentSelect = (incId: string) => {
    setSelectedIncidentId(incId);

    if (incId === 'custom') {
      setTitle('');
      setLocation('Hotel Property / Campus');
      setPriority('urgent');
      setIncidentType('life_safety');
      setDescription('');
      setAttachedPhotoUrl(null);
      return;
    }

    const found = securityIncidents.find((i) => i.id === incId);
    if (found) {
      setTitle(`Safety Alert: ${found.title}`);
      setLocation(`${found.location || 'Hotel Property'}${found.floor !== undefined ? `, Level ${found.floor}` : ''}`);
      setPriority(found.priority === 'Critical' ? 'critical' : found.priority === 'Urgent' ? 'urgent' : 'warning');

      if (/smoke|fire|sensor/i.test(found.title)) {
        setIncidentType('fire_sensor');
      } else if (/access|perimeter|breach/i.test(found.title)) {
        setIncidentType('security_breach');
      } else {
        setIncidentType('life_safety');
      }

      setDescription(
        found.description ||
          `Security response dispatched to ${found.location}. Perimeter safety checks in progress. All staff stand by for further broadcast.`
      );

      // Pre-fill incident photo if available
      const incidentPhoto =
        found.incidentPhotoUrl ||
        found.photoUrl ||
        found.securityReport?.photoUrl ||
        (found.id === 'sec-1'
          ? 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'
          : found.id === 'sec-2'
          ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
          : null);

      setAttachedPhotoUrl(incidentPhoto);
    }
  };

  // Handle Photo File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Safety Alert
  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) return;

    submitSecuritySafetyAlert({
      title: title.trim(),
      priority,
      location: location.trim(),
      incidentType,
      description: description.trim(),
      broadcastScope,
      photoUrl: attachedPhotoUrl || undefined,
      incidentId: selectedIncidentId !== 'custom' ? selectedIncidentId : undefined,
    });

    // Play panic / security siren sound
    if (priority === 'critical') {
      playPanicSiren();
    } else {
      playSecurityChime();
    }

    // If tied to an active incident, log note to incident
    if (selectedIncidentId !== 'custom') {
      addSecurityNote(
        selectedIncidentId,
        `🚨 Safety Alert broadcast submitted to Front Desk & GM: "${title.trim()}" (Photo attached: ${
          attachedPhotoUrl ? 'Yes' : 'No'
        })`
      );
    }

    setSentSuccessRef(title.trim());
    setTimeout(() => setSentSuccessRef(null), 5000);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((item) => {
    if (filterType === 'broadcast_active') return item.status === 'broadcast_active';
    if (filterType === 'pending')
      return (
        item.status === 'draft_pending_validation' ||
        item.status === 'validated_pending_approval' ||
        item.status === 'approved_ready_broadcast'
      );
    if (filterType === 'resolved') return item.status === 'resolved' || item.status === 'rejected';
    return true;
  });

  const activeBroadcastCount = alerts.filter((a) => a.status === 'broadcast_active').length;
  const pendingCount = alerts.filter(
    (a) =>
      a.status === 'draft_pending_validation' ||
      a.status === 'validated_pending_approval' ||
      a.status === 'approved_ready_broadcast'
  ).length;

  const statusBadge = (status: SafetyAlertStatus) => {
    switch (status) {
      case 'broadcast_active':
        return <span className="dm-status urgent font-bold">🚨 BROADCAST ACTIVE</span>;
      case 'approved_ready_broadcast':
        return <span className="dm-status good font-bold">GM Approved · Ready to Broadcast</span>;
      case 'validated_pending_approval':
        return <span className="dm-status font-bold">Front Desk Validated · Awaiting GM</span>;
      case 'draft_pending_validation':
        return <span className="dm-status font-bold">Draft · Pending Front Desk Triage</span>;
      case 'resolved':
        return <span className="dm-status good font-bold">Stood Down / Resolved</span>;
      case 'rejected':
        return <span className="dm-status urgent font-bold">Broadcast Declined by GM</span>;
      default:
        return <span className="dm-status font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. SAFETY BROADCAST STATUS OVERVIEW ================= */}
      <section className="dm-panel">
        <div className="dm-panel-heading">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 shrink-0">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--dm-ink)]">Safety Alerts &amp; Incident Broadcast Center</h2>
              <p className="text-xs text-[var(--dm-muted)]">
                Broadcast operational safety alerts for current incidents with photo evidence to Front Desk, Duty Manager, and Guests.
              </p>
            </div>
          </div>

          <div className="dm-heading-actions">
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="dm-primary flex items-center gap-1.5 text-xs font-semibold"
            >
              <Send size={14} />
              <span>{showComposer ? 'Hide Composer' : '+ Send Incident Alert'}</span>
            </button>
          </div>
        </div>

        {/* Status Callout Bar */}
        <div className="p-4 bg-[var(--dm-surface)] border-t border-[var(--dm-line)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeBroadcastCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold text-[var(--dm-ink)]">
              {activeBroadcastCount > 0
                ? `${activeBroadcastCount} Hotel-Wide Active Emergency Broadcast in Progress`
                : 'Perimeter Normal · No Active Broadcast Alarms'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[var(--dm-muted)]">
            <span>
              Active Broadcasts: <strong className="text-[var(--dm-ink)]">{activeBroadcastCount}</strong>
            </span>
            <span>
              Pending Validation: <strong className="text-[var(--dm-ink)]">{pendingCount}</strong>
            </span>
            <span>
              Total Logged: <strong className="text-[var(--dm-ink)]">{alerts.length}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Confirmation Toast after sending */}
      {sentSuccessRef && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 shadow-md animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="text-xs">
            <strong className="block text-sm font-bold">Safety Alert Submitted Successfully!</strong>
            <span>
              &ldquo;{sentSuccessRef}&rdquo; has been routed to Front Desk Lead Maya Lin and Duty Manager Marcus Vance for broadcast validation.
            </span>
          </div>
        </div>
      )}

      {/* ================= 2. SEND CURRENT INCIDENT ALERT COMPOSER ================= */}
      {showComposer && (
        <section className="dm-panel border-2 border-rose-600/30 shadow-md">
          <div className="dm-panel-heading bg-rose-50/50">
            <div>
              <h3 className="text-sm font-bold text-[var(--dm-ink)] flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600" />
                <span>Send Safety Alert for Current Incident</span>
              </h3>
              <p className="text-xs text-[var(--dm-muted)]">
                Select an active incident, provide field directives, and attach photo evidence for instant triage and broadcast.
              </p>
            </div>
            <span className="dm-status urgent font-semibold text-[11px]">Priority Channel</span>
          </div>

          <form onSubmit={handleSubmitAlert} className="p-5 sm:p-6 space-y-5 bg-[var(--dm-paper)]">
            {/* Step 1: Select Current Incident */}
            <div className="p-4 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] space-y-3">
              <label className="block text-xs font-bold text-[var(--dm-ink)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity size={14} className="text-rose-600" />
                  <span>1. Choose Current Incident to Alert:</span>
                </span>
                <span className="text-[11px] font-normal text-[var(--dm-muted)]">
                  {activeIncidents.length} active security incidents
                </span>
              </label>

              <select
                value={selectedIncidentId}
                onChange={(e) => handleIncidentSelect(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <optgroup label="Live Active Incidents">
                  {activeIncidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.id.toUpperCase()} • {inc.title} ({inc.priority || 'Normal'}) - {inc.location || 'Campus'}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other Options">
                  <option value="custom">+ Unlisted Custom Emergency / Safety Advisory</option>
                </optgroup>
              </select>
            </div>

            {/* Step 2: Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Alert Title */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-[var(--dm-ink)] flex items-center gap-1">
                  <span>Alert Headline / Title</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Safety Alert: Panic alarm · Pool deck"
                  className="w-full p-2.5 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] font-medium"
                />
              </div>

              {/* Severity / Priority */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--dm-ink)]">Alert Severity Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SafetyAlertRecord['priority'])}
                  className="w-full p-2.5 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] font-medium"
                >
                  <option value="critical">🔴 Critical (Immediate Life-Safety Hazard)</option>
                  <option value="urgent">🟠 Urgent (High Operational Hazard)</option>
                  <option value="warning">🔵 Warning / Precautionary Advisory</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--dm-ink)]">Incident Category</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as SafetyAlertRecord['incidentType'])}
                  className="w-full p-2.5 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] font-medium"
                >
                  <option value="life_safety">Life Safety / Medical Emergency</option>
                  <option value="fire_sensor">Fire Alarm / Smoke Sensor</option>
                  <option value="security_breach">Security Perimeter Breach</option>
                  <option value="hvac_leak">Water Leak / Mechanical Hazard</option>
                  <option value="weather">Severe Coastal Weather</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--dm-ink)] flex items-center gap-1">
                  <MapPin size={13} className="text-sky-600" />
                  <span>Location / Impacted Zone</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pool Deck & Cabanas (West Wing), Level 1"
                  className="w-full p-2.5 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] font-medium"
                />
              </div>

              {/* Broadcast Audience Scope */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--dm-ink)] flex items-center gap-1">
                  <Users size={13} className="text-indigo-600" />
                  <span>Broadcast Audience Scope</span>
                </label>
                <select
                  value={broadcastScope}
                  onChange={(e) => setBroadcastScope(e.target.value as SafetyAlertRecord['broadcastScope'])}
                  className="w-full p-2.5 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] font-medium"
                >
                  <option value="hotel_wide">Property-Wide (All Guests &amp; Staff Consoles)</option>
                  <option value="all_staff">All Hotel Operations Staff (Front Desk, Housekeeping, Dispatch, Security)</option>
                  <option value="security_only">Security Team &amp; Duty Manager Only</option>
                </select>
              </div>

              {/* Description & Directives */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-[var(--dm-ink)] flex items-center gap-1">
                  <FileText size={13} className="text-amber-600" />
                  <span>Incident Information, Field Observations &amp; Directives</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe incident status, immediate actions taken, and instructions for staff/guests..."
                  className="w-full p-3 rounded-xl border border-[var(--dm-line)] bg-white text-[var(--dm-ink)] font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* Step 3: PICTURE ATTACHMENT SECTION (User Requested Feature) */}
            <div className="p-4 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-[var(--dm-ink)] flex items-center gap-2">
                  <Camera size={16} className="text-rose-600" />
                  <span>Incident Picture / Visual Evidence:</span>
                  <span className="text-[11px] font-normal text-rose-600">(Recommended)</span>
                </label>
                {attachedPhotoUrl && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} /> 1 Picture Attached
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {attachedPhotoUrl ? (
                /* Picture Preview Card */
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-white border border-[var(--dm-line)] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-20 h-16 rounded-lg overflow-hidden border border-[var(--dm-line)] group cursor-pointer shrink-0 shadow-sm"
                      onClick={() =>
                        setLightboxPhoto({
                          url: attachedPhotoUrl,
                          title: `Incident Scene Photo • ${title || 'Attached Evidence'}`,
                        })
                      }
                    >
                      <img
                        src={attachedPhotoUrl}
                        alt="Attached scene evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn size={16} className="text-white" />
                      </div>
                    </div>

                    <div>
                      <strong className="text-xs text-[var(--dm-ink)] block font-semibold">
                        Scene Visual Evidence Attached
                      </strong>
                      <span className="text-[11px] text-[var(--dm-muted)]">
                        Click thumbnail to inspect full-size photo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxPhoto({
                          url: attachedPhotoUrl,
                          title: `Incident Scene Photo • ${title || 'Attached Evidence'}`,
                        })
                      }
                      className="dm-small-button flex items-center gap-1 text-xs"
                    >
                      <Eye size={13} />
                      <span>View Enlarge</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="dm-small-button flex items-center gap-1 text-xs"
                    >
                      <Upload size={13} />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedPhotoUrl(null)}
                      className="dm-small-button text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1 text-xs"
                      title="Remove picture"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No Picture: Upload Box */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer p-6 rounded-xl border-2 border-dashed border-[var(--dm-line)] hover:border-rose-400 bg-white/70 hover:bg-white text-center transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Camera size={20} />
                  </div>
                  <strong className="text-xs font-semibold text-[var(--dm-ink)] block">
                    Upload or Capture Incident Photo
                  </strong>
                  <p className="text-[11px] text-[var(--dm-muted)] mt-0.5">
                    Click to select JPG/PNG from device or snap a photo of the incident area
                  </p>
                </div>
              )}
            </div>

            {/* Broadcast Notice & Submission */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[var(--dm-line)]">
              <span className="text-[11px] text-[var(--dm-muted)] flex items-center gap-1">
                <Radio size={13} className="text-rose-600 shrink-0" />
                <span>Alert triggers Front Desk triage and General Manager broadcast sign-off.</span>
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleIncidentSelect(selectedIncidentId)}
                  className="dm-secondary text-xs px-3 py-2 rounded-xl"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="dm-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md bg-rose-700 hover:bg-rose-800 border-rose-700 text-white cursor-pointer"
                >
                  <Send size={14} />
                  <span>Send &amp; Broadcast Safety Alert</span>
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* ================= 3. ACTIVE & SENT SAFETY ALERTS FEED ================= */}
      <section className="dm-panel">
        <div className="dm-panel-heading">
          <div>
            <h3 className="text-sm font-bold text-[var(--dm-ink)] flex items-center gap-2">
              <Radio size={16} className="text-rose-600" />
              <span>Safety Alerts Log &amp; Broadcast Feed ({alerts.length})</span>
            </h3>
            <p className="text-xs text-[var(--dm-muted)]">
              Real-time property safety alerts, active guest announcements, and operational stand-downs.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                filterType === 'all'
                  ? 'bg-[var(--dm-ink)] text-white shadow-sm'
                  : 'bg-[var(--dm-surface)] border border-[var(--dm-line)] text-[var(--dm-ink)] hover:bg-white'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilterType('broadcast_active')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                filterType === 'broadcast_active'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-[var(--dm-surface)] border border-[var(--dm-line)] text-[var(--dm-ink)] hover:bg-white'
              }`}
            >
              Active Broadcasts ({activeBroadcastCount})
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                filterType === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[var(--dm-surface)] border border-[var(--dm-line)] text-[var(--dm-ink)] hover:bg-white'
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setFilterType('resolved')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                filterType === 'resolved'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-[var(--dm-surface)] border border-[var(--dm-line)] text-[var(--dm-ink)] hover:bg-white'
              }`}
            >
              Resolved / Stood Down
            </button>
          </div>
        </div>

        {/* Alerts Cards List */}
        <div className="p-5 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--dm-line)] text-xs text-[var(--dm-muted)]">
              No safety alerts found matching the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isBroadcast = alert.status === 'broadcast_active';
              const isAcked = (alert.acknowledgedBy ?? []).includes('security_responder');

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 bg-white ${
                    isBroadcast
                      ? 'border-rose-400 bg-rose-50/20 shadow-md ring-1 ring-rose-300'
                      : 'border-[var(--dm-line)] shadow-sm'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(alert.status)}
                        <span className="font-mono text-xs font-bold text-[var(--dm-muted)] bg-[var(--dm-surface)] px-2 py-0.5 rounded border border-[var(--dm-line)]">
                          {alert.ref}
                        </span>
                        <span className="text-[11px] text-[var(--dm-muted)]">
                          Reported by <strong className="text-[var(--dm-ink)]">{alert.reportedBy}</strong> · {alert.reportedAt}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--dm-ink)]">{alert.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          alert.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : alert.priority === 'urgent'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {alert.priority}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--dm-surface)] border border-[var(--dm-line)] text-[var(--dm-ink)]">
                        {alert.broadcastScope === 'hotel_wide'
                          ? 'Property-Wide'
                          : alert.broadcastScope === 'all_staff'
                          ? 'All Staff'
                          : 'Security Team'}
                      </span>
                    </div>
                  </div>

                  {/* Body: Description */}
                  <p className="text-xs text-[var(--dm-ink)] leading-relaxed">{alert.description}</p>

                  {/* Visual Evidence / Photo if attached */}
                  {alert.photoUrl && (
                    <div className="p-3 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-16 h-12 rounded-lg overflow-hidden border border-[var(--dm-line)] cursor-pointer group shadow-sm shrink-0"
                          onClick={() =>
                            setLightboxPhoto({
                              url: alert.photoUrl!,
                              title: `${alert.ref} • ${alert.title}`,
                            })
                          }
                        >
                          <img
                            src={alert.photoUrl}
                            alt="Incident evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn size={14} className="text-white" />
                          </div>
                        </div>

                        <div>
                          <strong className="text-xs text-[var(--dm-ink)] block font-semibold flex items-center gap-1.5">
                            <Camera size={13} className="text-rose-600" />
                            <span>Incident Photo Evidence</span>
                          </strong>
                          <span className="text-[11px] text-[var(--dm-muted)]">
                            Captured by Security Responder
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setLightboxPhoto({
                            url: alert.photoUrl!,
                            title: `${alert.ref} • ${alert.title}`,
                          })
                        }
                        className="dm-small-button flex items-center gap-1 text-xs shrink-0"
                      >
                        <Eye size={12} />
                        <span>View Photo</span>
                      </button>
                    </div>
                  )}

                  {/* Location & Metadata info */}
                  <div className="pt-2 border-t border-[var(--dm-line)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--dm-muted)]">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={14} className="text-sky-600 shrink-0" />
                      <span className="truncate">
                        Zone: <strong className="text-[var(--dm-ink)]">{alert.location}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditAlert(alert)}
                        className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
                      >
                        <History size={12} />
                        <span>Audit Trail ({alert.auditHistory?.length ?? 0})</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--dm-line)]">
                    <div className="text-[11px] text-[var(--dm-muted)]">
                      {alert.validatedBy ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Validated by Front Desk ({alert.validatedBy})
                        </span>
                      ) : (
                        <span>⏳ Awaiting Front Desk Coordinator validation</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isBroadcast && !isAcked && (
                        <button
                          type="button"
                          onClick={() => acknowledgeSafetyAlert(alert.id, 'security_responder')}
                          className="dm-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck size={14} />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {isBroadcast && (
                        <button
                          type="button"
                          onClick={() =>
                            resolveSafetyAlert(alert.id, 'Stand down ordered by Senior Officer Roy')
                          }
                          className="dm-secondary text-xs px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50"
                        >
                          Stand Down / Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ================= 4. ENLARGED PHOTO LIGHTBOX MODAL ================= */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl p-2 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 text-white flex items-center justify-between border-b border-white/10 text-xs">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5 truncate">
                <Camera size={14} /> {lightboxPhoto.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-2 flex items-center justify-center bg-black/50">
              <img
                src={lightboxPhoto.url}
                alt="Enlarged incident evidence"
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. AUDIT TRAIL MODAL ================= */}
      {selectedAuditAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedAuditAlert(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white border border-[var(--dm-line)] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--dm-line)] pb-3">
              <h3 className="text-sm font-bold text-[var(--dm-ink)] flex items-center gap-2">
                <History size={16} className="text-sky-600" />
                <span>Audit History: {selectedAuditAlert.ref}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAuditAlert(null)}
                className="text-[var(--dm-muted)] hover:text-[var(--dm-ink)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedAuditAlert.auditHistory?.map((step, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-[var(--dm-ink)]">{step.actor}</strong>
                    <span className="text-[10px] text-[var(--dm-muted)]">{step.at}</span>
                  </div>
                  <p className="text-[var(--dm-ink)] text-[11px]">{step.action}</p>
                  {step.notes && (
                    <p className="text-amber-800 text-[10px] italic bg-amber-50 p-1.5 rounded border border-amber-200">
                      &ldquo;{step.notes}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--dm-line)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditAlert(null)}
                className="dm-secondary text-xs px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
