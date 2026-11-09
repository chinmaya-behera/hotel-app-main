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
      const prio = (found.priority || '').toLowerCase();
      setPriority(prio === 'critical' ? 'critical' : prio === 'urgent' ? 'urgent' : 'warning');

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
    <div className="space-y-6" style={{ color: 'var(--dm-ink)' }}>
      {/* ================= 1. SAFETY BROADCAST STATUS OVERVIEW ================= */}
      <section className="dm-panel" style={{ background: 'var(--dm-paper)', borderColor: 'var(--dm-line)' }}>
        <div className="dm-panel-heading">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(156, 64, 51, 0.12)', border: '1px solid rgba(156, 64, 51, 0.25)', color: 'var(--dm-danger, #9c4033)' }}
            >
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--dm-ink)' }}>
                Safety Alerts &amp; Incident Broadcast Center
              </h2>
              <p className="text-xs" style={{ color: 'var(--dm-muted)' }}>
                Broadcast operational safety alerts for current incidents with photo evidence to Front Desk, Duty Manager, and Guests.
              </p>
            </div>
          </div>

          <div className="dm-heading-actions">
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="dm-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Send size={14} />
              <span>{showComposer ? 'Hide Composer' : '+ Send Incident Alert'}</span>
            </button>
          </div>
        </div>

        {/* Status Callout Bar */}
        <div
          className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ background: 'var(--dm-surface)', borderTop: '1px solid var(--dm-line)', color: 'var(--dm-ink)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeBroadcastCount > 0 ? 'bg-rose-600 animate-ping' : 'bg-emerald-600'
              }`}
            />
            <span className="font-semibold" style={{ color: 'var(--dm-ink)' }}>
              {activeBroadcastCount > 0
                ? `${activeBroadcastCount} Hotel-Wide Active Emergency Broadcast in Progress`
                : 'Perimeter Normal · No Active Broadcast Alarms'}
            </span>
          </div>

          <div className="flex items-center gap-4" style={{ color: 'var(--dm-muted)' }}>
            <span>
              Active Broadcasts: <strong style={{ color: 'var(--dm-ink)' }}>{activeBroadcastCount}</strong>
            </span>
            <span>
              Pending Validation: <strong style={{ color: 'var(--dm-ink)' }}>{pendingCount}</strong>
            </span>
            <span>
              Total Logged: <strong style={{ color: 'var(--dm-ink)' }}>{alerts.length}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Confirmation Toast after sending */}
      {sentSuccessRef && (
        <div
          className="p-4 rounded-xl flex items-center gap-3 shadow-md animate-in fade-in"
          style={{ background: 'var(--warm-highlight)', border: '1px solid var(--dm-line)', color: 'var(--dm-ink)' }}
        >
          <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
          <div className="text-xs">
            <strong className="block text-sm font-bold" style={{ color: 'var(--dm-ink)' }}>
              Safety Alert Submitted Successfully!
            </strong>
            <span style={{ color: 'var(--dm-muted)' }}>
              &ldquo;{sentSuccessRef}&rdquo; has been routed to Front Desk Lead Maya Lin and Duty Manager Marcus Vance for broadcast validation.
            </span>
          </div>
        </div>
      )}

      {/* ================= 2. SEND CURRENT INCIDENT ALERT COMPOSER ================= */}
      {showComposer && (
        <section
          className="dm-panel shadow-md"
          style={{ background: 'var(--dm-paper)', borderColor: 'var(--dm-line)' }}
        >
          <div
            className="dm-panel-heading"
            style={{ background: 'var(--warm-soft)', borderBottom: '1px solid var(--dm-line)' }}
          >
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--dm-ink)' }}>
                <ShieldAlert size={16} style={{ color: 'var(--dm-danger, #9c4033)' }} />
                <span>Send Safety Alert for Current Incident</span>
              </h3>
              <p className="text-xs" style={{ color: 'var(--dm-muted)' }}>
                Select an active incident, provide field directives, and attach photo evidence for instant triage and broadcast.
              </p>
            </div>
            <span className="dm-status urgent font-semibold text-[11px]">Priority Channel</span>
          </div>

          <form
            onSubmit={handleSubmitAlert}
            className="p-5 sm:p-6 space-y-5"
            style={{ background: 'var(--dm-paper)' }}
          >
            {/* Step 1: Select Current Incident */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: 'var(--warm-soft)', border: '1px solid var(--dm-line)' }}
            >
              <label className="block text-xs font-bold flex items-center justify-between" style={{ color: 'var(--dm-ink)' }}>
                <span className="flex items-center gap-1.5">
                  <Activity size={14} style={{ color: 'var(--dm-danger, #9c4033)' }} />
                  <span>1. Choose Current Incident to Alert:</span>
                </span>
                <span className="text-[11px] font-normal" style={{ color: 'var(--dm-muted)' }}>
                  {activeIncidents.length} active security incidents
                </span>
              </label>

              <select
                value={selectedIncidentId}
                onChange={(e) => handleIncidentSelect(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl cursor-pointer"
                style={{
                  background: 'var(--dm-paper)',
                  color: 'var(--dm-ink)',
                  border: '1px solid var(--dm-line)',
                }}
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
                <label className="font-bold flex items-center gap-1" style={{ color: 'var(--dm-ink)' }}>
                  <span>Alert Headline / Title</span>
                  <span style={{ color: 'var(--dm-danger, #9c4033)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Safety Alert: Panic alarm · Pool deck"
                  className="w-full p-2.5 rounded-xl font-medium"
                  style={{
                    background: 'var(--dm-surface)',
                    color: 'var(--dm-ink)',
                    border: '1px solid var(--dm-line)',
                  }}
                />
              </div>

              {/* Severity / Priority */}
              <div className="space-y-1.5">
                <label className="font-bold" style={{ color: 'var(--dm-ink)' }}>Alert Severity Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SafetyAlertRecord['priority'])}
                  className="w-full p-2.5 rounded-xl font-medium cursor-pointer"
                  style={{
                    background: 'var(--dm-surface)',
                    color: 'var(--dm-ink)',
                    border: '1px solid var(--dm-line)',
                  }}
                >
                  <option value="critical">🔴 Critical (Immediate Life-Safety Hazard)</option>
                  <option value="urgent">🟠 Urgent (High Operational Hazard)</option>
                  <option value="warning">🔵 Warning / Precautionary Advisory</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-bold" style={{ color: 'var(--dm-ink)' }}>Incident Category</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as SafetyAlertRecord['incidentType'])}
                  className="w-full p-2.5 rounded-xl font-medium cursor-pointer"
                  style={{
                    background: 'var(--dm-surface)',
                    color: 'var(--dm-ink)',
                    border: '1px solid var(--dm-line)',
                  }}
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
                <label className="font-bold flex items-center gap-1" style={{ color: 'var(--dm-ink)' }}>
                  <MapPin size={13} style={{ color: 'var(--dm-muted)' }} />
                  <span>Location / Impacted Zone</span>
                  <span style={{ color: 'var(--dm-danger, #9c4033)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pool Deck & Cabanas (West Wing), Level 1"
                  className="w-full p-2.5 rounded-xl font-medium"
                  style={{
                    background: 'var(--dm-surface)',
                    color: 'var(--dm-ink)',
                    border: '1px solid var(--dm-line)',
                  }}
                />
              </div>

              {/* Broadcast Audience Scope */}
              <div className="space-y-1.5">
                <label className="font-bold flex items-center gap-1" style={{ color: 'var(--dm-ink)' }}>
                  <Users size={13} style={{ color: 'var(--dm-muted)' }} />
                  <span>Broadcast Audience Scope</span>
                </label>
                <select
                  value={broadcastScope}
                  onChange={(e) => setBroadcastScope(e.target.value as SafetyAlertRecord['broadcastScope'])}
                  className="w-full p-2.5 rounded-xl font-medium cursor-pointer"
                  style={{
                    background: 'var(--dm-surface)',
                    color: 'var(--dm-ink)',
                    border: '1px solid var(--dm-line)',
                  }}
                >
                  <option value="hotel_wide">Property-Wide (All Guests &amp; Staff Consoles)</option>
                  <option value="all_staff">All Hotel Operations Staff (Front Desk, Housekeeping, Dispatch, Security)</option>
                  <option value="security_only">Security Team &amp; Duty Manager Only</option>
                </select>
              </div>

              {/* Description & Directives */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold flex items-center gap-1" style={{ color: 'var(--dm-ink)' }}>
                  <FileText size={13} style={{ color: 'var(--dm-muted)' }} />
                  <span>Incident Information, Field Observations &amp; Directives</span>
                  <span style={{ color: 'var(--dm-danger, #9c4033)' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe incident status, immediate actions taken, and instructions for staff/guests..."
                  className="w-full p-3 rounded-xl font-medium leading-relaxed"
                  style={{
                    background: 'var(--dm-surface)',
                    color: 'var(--dm-ink)',
                    border: '1px solid var(--dm-line)',
                  }}
                />
              </div>
            </div>

            {/* Step 3: PICTURE ATTACHMENT SECTION (User Requested Feature) */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: 'var(--warm-soft)', border: '1px solid var(--dm-line)' }}
            >
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs flex items-center gap-2" style={{ color: 'var(--dm-ink)' }}>
                  <Camera size={16} style={{ color: 'var(--dm-danger, #9c4033)' }} />
                  <span>Incident Picture / Visual Evidence:</span>
                  <span className="text-[11px] font-normal" style={{ color: 'var(--dm-muted)' }}>(Recommended)</span>
                </label>
                {attachedPhotoUrl && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'var(--dm-surface)', border: '1px solid var(--dm-line)', color: 'var(--dm-ink)' }}
                  >
                    <CheckCircle2 size={12} className="text-emerald-700" /> 1 Picture Attached
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
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl shadow-sm"
                  style={{ background: 'var(--dm-paper)', border: '1px solid var(--dm-line)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-20 h-16 rounded-lg overflow-hidden group cursor-pointer shrink-0 shadow-sm"
                      style={{ border: '1px solid var(--dm-line)' }}
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
                        <ZoomIn size={16} style={{ color: '#ffffff' }} />
                      </div>
                    </div>

                    <div>
                      <strong className="text-xs block font-semibold" style={{ color: 'var(--dm-ink)' }}>
                        Scene Visual Evidence Attached
                      </strong>
                      <span className="text-[11px]" style={{ color: 'var(--dm-muted)' }}>
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
                      className="dm-small-button flex items-center gap-1 text-xs"
                      style={{ color: 'var(--dm-danger, #9c4033)' }}
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
                  className="cursor-pointer p-6 rounded-xl border-2 border-dashed text-center transition-all group"
                  style={{
                    background: 'var(--dm-paper)',
                    borderColor: 'var(--dm-line)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                    style={{ background: 'var(--dm-surface)', color: 'var(--dm-danger, #9c4033)' }}
                  >
                    <Camera size={20} />
                  </div>
                  <strong className="text-xs font-semibold block" style={{ color: 'var(--dm-ink)' }}>
                    Upload or Capture Incident Photo
                  </strong>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--dm-muted)' }}>
                    Click to select JPG/PNG from device or snap a photo of the incident area
                  </p>
                </div>
              )}
            </div>

            {/* Broadcast Notice & Submission */}
            <div
              className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{ borderTop: '1px solid var(--dm-line)' }}
            >
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--dm-muted)' }}>
                <Radio size={13} style={{ color: 'var(--dm-danger, #9c4033)' }} className="shrink-0" />
                <span>Alert triggers Front Desk triage and General Manager broadcast sign-off.</span>
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleIncidentSelect(selectedIncidentId)}
                  className="dm-secondary text-xs px-3 py-2 rounded-xl cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="dm-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
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
      <section className="dm-panel" style={{ background: 'var(--dm-paper)', borderColor: 'var(--dm-line)' }}>
        <div className="dm-panel-heading">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--dm-ink)' }}>
              <Radio size={16} style={{ color: 'var(--dm-danger, #9c4033)' }} />
              <span>Safety Alerts Log &amp; Broadcast Feed ({alerts.length})</span>
            </h3>
            <p className="text-xs" style={{ color: 'var(--dm-muted)' }}>
              Real-time property safety alerts, active guest announcements, and operational stand-downs.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className="dm-small-button text-xs cursor-pointer"
              style={{
                background: filterType === 'all' ? 'var(--dm-surface)' : 'transparent',
                fontWeight: filterType === 'all' ? '700' : '500',
                color: 'var(--dm-ink)',
                borderColor: filterType === 'all' ? 'var(--dm-line)' : 'transparent',
              }}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilterType('broadcast_active')}
              className="dm-small-button text-xs cursor-pointer"
              style={{
                background: filterType === 'broadcast_active' ? 'var(--dm-surface)' : 'transparent',
                fontWeight: filterType === 'broadcast_active' ? '700' : '500',
                color: 'var(--dm-ink)',
                borderColor: filterType === 'broadcast_active' ? 'var(--dm-line)' : 'transparent',
              }}
            >
              Active Broadcasts ({activeBroadcastCount})
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className="dm-small-button text-xs cursor-pointer"
              style={{
                background: filterType === 'pending' ? 'var(--dm-surface)' : 'transparent',
                fontWeight: filterType === 'pending' ? '700' : '500',
                color: 'var(--dm-ink)',
                borderColor: filterType === 'pending' ? 'var(--dm-line)' : 'transparent',
              }}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setFilterType('resolved')}
              className="dm-small-button text-xs cursor-pointer"
              style={{
                background: filterType === 'resolved' ? 'var(--dm-surface)' : 'transparent',
                fontWeight: filterType === 'resolved' ? '700' : '500',
                color: 'var(--dm-ink)',
                borderColor: filterType === 'resolved' ? 'var(--dm-line)' : 'transparent',
              }}
            >
              Resolved / Stood Down
            </button>
          </div>
        </div>

        {/* Alerts Cards List */}
        <div className="p-5 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div
              className="p-8 text-center rounded-2xl border border-dashed text-xs"
              style={{ borderColor: 'var(--dm-line)', color: 'var(--dm-muted)' }}
            >
              No safety alerts found matching the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isBroadcast = alert.status === 'broadcast_active';
              const isAcked = (alert.acknowledgedBy ?? []).includes('security_responder');

              return (
                <div
                  key={alert.id}
                  className="p-5 rounded-2xl transition-all space-y-4 shadow-sm"
                  style={{
                    background: isBroadcast ? 'var(--warm-soft)' : 'var(--dm-paper)',
                    border: isBroadcast ? '1.5px solid var(--dm-danger, #9c4033)' : '1px solid var(--dm-line)',
                    color: 'var(--dm-ink)',
                  }}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(alert.status)}
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            background: 'var(--dm-surface)',
                            border: '1px solid var(--dm-line)',
                            color: 'var(--dm-ink)',
                          }}
                        >
                          {alert.ref}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--dm-muted)' }}>
                          Reported by <strong style={{ color: 'var(--dm-ink)' }}>{alert.reportedBy}</strong> · {alert.reportedAt}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold" style={{ color: 'var(--dm-ink)' }}>{alert.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          background:
                            alert.priority === 'critical'
                              ? 'rgba(156, 64, 51, 0.12)'
                              : alert.priority === 'urgent'
                              ? 'rgba(128, 87, 30, 0.14)'
                              : 'var(--dm-surface)',
                          color:
                            alert.priority === 'critical'
                              ? 'var(--dm-danger, #9c4033)'
                              : alert.priority === 'urgent'
                              ? 'var(--dm-warning, #80571e)'
                              : 'var(--dm-ink)',
                          border: '1px solid var(--dm-line)',
                        }}
                      >
                        {alert.priority}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: 'var(--dm-surface)',
                          border: '1px solid var(--dm-line)',
                          color: 'var(--dm-ink)',
                        }}
                      >
                        {alert.broadcastScope === 'hotel_wide'
                          ? 'Property-Wide'
                          : alert.broadcastScope === 'all_staff'
                          ? 'All Staff'
                          : 'Security Team'}
                      </span>
                    </div>
                  </div>

                  {/* Body: Description */}
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--dm-ink)' }}>{alert.description}</p>

                  {/* Visual Evidence / Photo if attached */}
                  {alert.photoUrl && (
                    <div
                      className="p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                      style={{ background: 'var(--dm-surface)', border: '1px solid var(--dm-line)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-16 h-12 rounded-lg overflow-hidden cursor-pointer group shadow-sm shrink-0"
                          style={{ border: '1px solid var(--dm-line)' }}
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
                            <ZoomIn size={14} style={{ color: '#ffffff' }} />
                          </div>
                        </div>

                        <div>
                          <strong className="text-xs block font-semibold flex items-center gap-1.5" style={{ color: 'var(--dm-ink)' }}>
                            <Camera size={13} style={{ color: 'var(--dm-danger, #9c4033)' }} />
                            <span>Incident Photo Evidence</span>
                          </strong>
                          <span className="text-[11px]" style={{ color: 'var(--dm-muted)' }}>
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
                        className="dm-small-button flex items-center gap-1 text-xs shrink-0 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>View Photo</span>
                      </button>
                    </div>
                  )}

                  {/* Location & Metadata info */}
                  <div
                    className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
                    style={{ borderTop: '1px solid var(--dm-line)', color: 'var(--dm-muted)' }}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={14} className="shrink-0" style={{ color: 'var(--dm-muted)' }} />
                      <span className="truncate">
                        Zone: <strong style={{ color: 'var(--dm-ink)' }}>{alert.location}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditAlert(alert)}
                        className="dm-text-button text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        style={{ color: 'var(--dm-ink)' }}
                      >
                        <History size={12} />
                        <span>Audit Trail ({alert.auditHistory?.length ?? 0})</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div
                    className="pt-2 flex flex-wrap items-center justify-between gap-2"
                    style={{ borderTop: '1px solid var(--dm-line)' }}
                  >
                    <div className="text-[11px]" style={{ color: 'var(--dm-muted)' }}>
                      {alert.validatedBy ? (
                        <span className="font-semibold flex items-center gap-1 text-emerald-800">
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
                          className="dm-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold cursor-pointer"
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
                          className="dm-secondary text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                          style={{ color: 'var(--dm-danger, #9c4033)' }}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150"
          style={{ background: 'rgba(27, 25, 24, 0.75)' }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl p-3"
            style={{ background: 'var(--dm-paper)', border: '1px solid var(--dm-line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-3 flex items-center justify-between text-xs"
              style={{ borderBottom: '1px solid var(--dm-line)', color: 'var(--dm-ink)' }}
            >
              <span className="font-semibold flex items-center gap-1.5 truncate" style={{ color: 'var(--dm-ink)' }}>
                <Camera size={14} style={{ color: 'var(--dm-danger, #9c4033)' }} /> {lightboxPhoto.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="dm-secondary text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-2 flex items-center justify-center" style={{ background: 'var(--dm-surface)' }}>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
          style={{ background: 'rgba(27, 25, 24, 0.5)' }}
          onClick={() => setSelectedAuditAlert(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--dm-paper)', border: '1px solid var(--dm-line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--dm-line)' }}
            >
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--dm-ink)' }}>
                <History size={16} />
                <span>Audit History: {selectedAuditAlert.ref}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAuditAlert(null)}
                className="cursor-pointer"
                style={{ color: 'var(--dm-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedAuditAlert.auditHistory?.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl text-xs space-y-1"
                  style={{ background: 'var(--warm-soft)', border: '1px solid var(--dm-line)' }}
                >
                  <div className="flex items-center justify-between">
                    <strong style={{ color: 'var(--dm-ink)' }}>{step.actor}</strong>
                    <span className="text-[10px]" style={{ color: 'var(--dm-muted)' }}>{step.at}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--dm-ink)' }}>{step.action}</p>
                  {step.notes && (
                    <p
                      className="text-[10px] italic p-1.5 rounded"
                      style={{ background: 'var(--dm-surface)', color: 'var(--dm-ink)', border: '1px solid var(--dm-line)' }}
                    >
                      &ldquo;{step.notes}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end" style={{ borderTop: '1px solid var(--dm-line)' }}>
              <button
                type="button"
                onClick={() => setSelectedAuditAlert(null)}
                className="dm-secondary text-xs px-4 py-2 rounded-xl cursor-pointer"
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
