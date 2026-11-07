'use client';

import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Send,
  Plus,
  CheckCircle2,
  Check,
  Play,
  Film,
  Image as ImageIcon,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Clock,
  Eye,
  Paperclip,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { frontDeskIncidentsSeed, type FDIncident, type FDIncidentMedia } from '@/lib/mockData';

export function IncidentsPanel() {
  const [incidents, setIncidents] = useState<FDIncident[]>(frontDeskIncidentsSeed);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(
    'ATTENTION GUESTS: Elevator maintenance testing underway on Floors 2–3. North Elevators operating normally.',
  );
  const [broadcastSentTime, setBroadcastSentTime] = useState<string | null>(null);

  // Selected incident for Detail View Modal
  const [selectedIncident, setSelectedIncident] = useState<FDIncident | null>(null);

  // Selected media for full Lightbox zoom / video playback
  const [lightboxMediaIndex, setLightboxMediaIndex] = useState<number | null>(null);

  // Form states for new incident
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState<FDIncident['source']>('Guest Report');
  const [newReporter, setNewReporter] = useState('');
  const [newRoom, setNewRoom] = useState('305');
  const [newLocation, setNewLocation] = useState('Floor 3 Corridor');
  const [newSeverity, setNewSeverity] = useState<FDIncident['severity']>('medium');
  const [newDescription, setNewDescription] = useState('');
  const [dispatchNow, setDispatchNow] = useState(true);
  const [stagedMedia, setStagedMedia] = useState<FDIncidentMedia[]>([]);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    return true;
  });

  const handleOpenDetails = (inc: FDIncident) => {
    setSelectedIncident(inc);
    setLightboxMediaIndex(null);
  };

  const handleCloseDetails = () => {
    setSelectedIncident(null);
    setLightboxMediaIndex(null);
  };

  const handleAddSampleMedia = (type: 'photo_leak' | 'photo_damage' | 'video_clip') => {
    const id = `new-med-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    if (type === 'photo_leak') {
      setStagedMedia((prev) => [
        ...prev,
        {
          id,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
          thumbUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80',
          title: 'Water Seepage Evidence',
          caption: 'Liquid pooling around corridor carpet threshold.',
          fileSize: '1.9 MB',
          timestamp: 'Just now',
          submittedBy: newReporter.trim() || newSource,
        },
      ]);
    } else if (type === 'photo_damage') {
      setStagedMedia((prev) => [
        ...prev,
        {
          id,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
          thumbUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80',
          title: 'Damaged Latch Mechanism',
          caption: 'Close-up of broken lock latch and loose screws.',
          fileSize: '2.1 MB',
          timestamp: 'Just now',
          submittedBy: newReporter.trim() || newSource,
        },
      ]);
    } else if (type === 'video_clip') {
      setStagedMedia((prev) => [
        ...prev,
        {
          id,
          type: 'video',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
          title: 'Video Clip Recording',
          caption: 'Video footage showing leak dripping into bucket.',
          duration: '0:15',
          fileSize: '4.8 MB',
          timestamp: 'Just now',
          submittedBy: newReporter.trim() || newSource,
        },
      ]);
    }
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const reporterName = newReporter.trim() || (newRoom ? `Guest (Room ${newRoom})` : newSource);

    const item: FDIncident = {
      id: `inc-${Date.now()}`,
      ref: `INC-${Math.floor(210 + Math.random() * 790)}`,
      title: newTitle.trim(),
      source: newSource,
      reportedBy: reporterName,
      room: newRoom.trim() || undefined,
      location: newLocation.trim(),
      severity: newSeverity,
      status: dispatchNow ? 'dispatched_security' : 'active',
      description: newDescription.trim(),
      reportedAt: 'Today, Just now',
      securityOfficer: dispatchNow ? 'Security Dispatch (Patrol Unit 1)' : undefined,
      broadcastSent: false,
      media: stagedMedia.length > 0 ? stagedMedia : undefined,
    };

    setIncidents([item, ...incidents]);
    setShowLogModal(false);
    setNewTitle('');
    setNewReporter('');
    setNewDescription('');
    setStagedMedia([]);
  };

  const handleDispatchSecurity = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'dispatched_security' as const,
              securityOfficer: 'Officer Ramesh K. (Patrol Unit 2)',
            }
          : i,
      ),
    );
    if (selectedIncident?.id === id) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              status: 'dispatched_security' as const,
              securityOfficer: 'Officer Ramesh K. (Patrol Unit 2)',
            }
          : null,
      );
    }
  };

  const handleResolve = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'resolved' as const } : i)),
    );
    if (selectedIncident?.id === id) {
      setSelectedIncident((prev) => (prev ? { ...prev, status: 'resolved' as const } : null));
    }
  };

  const getSeverityBadge = (sev: FDIncident['severity']) => {
    switch (sev) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="h-2.5 w-2.5" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-2.5 w-2.5" /> Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <ShieldAlert className="h-2.5 w-2.5" /> Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Banner Alert if emergency broadcast active */}
      {broadcastSentTime && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
            <span><strong>Active Safety Broadcast:</strong> &ldquo;{broadcastMessage}&rdquo;</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBroadcastSentTime(null)}
            className="text-rose-300 hover:text-white text-xs h-7 py-0"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Top Header Controls: Minimal & Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm">
              Security Incidents &amp; Dispatches
            </h3>
            <p className="text-[11px] text-mist-400">
              Click any incident to inspect details and view submitted photos or videos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="subtle"
            iconLeft={Radio}
            onClick={() => setShowBroadcastModal(true)}
            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/15 text-xs h-7 py-0"
          >
            Broadcast
          </Button>
          <Button
            size="sm"
            variant="accent"
            iconLeft={Plus}
            onClick={() => {
              setStagedMedia([]);
              setShowLogModal(true);
            }}
            className="text-xs h-7 py-0"
          >
            + Log Incident
          </Button>
        </div>
      </div>

      {/* Incidents Board (Minimal & Compressed Row Cards) */}
      <Panel
        title="Active Incidents"
        hint="Click an incident row to view submitter details, photos, and video evidence."
        icon={ShieldAlert}
      >
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-mist-400">Filter:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-black/30 border border-white/10 text-xs">
            {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-0.5 rounded-md font-medium capitalize transition text-xs ${
                  filterSeverity === sev ? 'accent-soft' : 'text-mist-400 hover:text-white'
                }`}
              >
                {sev === 'all' ? `All (${incidents.length})` : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Incident Rows */}
        <div className="space-y-2">
          {filteredIncidents.map((inc) => {
            const mediaList = inc.media ?? [];
            const photoCount = mediaList.filter((m) => m.type === 'image').length;
            const videoCount = mediaList.filter((m) => m.type === 'video').length;

            return (
              <div
                key={inc.id}
                onClick={() => handleOpenDetails(inc)}
                className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs"
              >
                {/* Left: Ref, Title, Severity, Submitter, and Media Pill */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-cyan-300 font-bold text-[11px] bg-cyan-500/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                      {inc.ref}
                    </span>
                    <span className="font-bold text-white text-xs truncate">{inc.title}</span>
                    {getSeverityBadge(inc.severity)}
                    <Badge
                      tone={
                        inc.status === 'resolved'
                          ? 'success'
                          : inc.status === 'dispatched_security'
                            ? 'info'
                            : 'warning'
                      }
                    >
                      {inc.status === 'dispatched_security'
                        ? 'Dispatched'
                        : inc.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-cyan-300" />
                      <span>{inc.reportedBy || inc.source}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-mist-500" />
                      <span>{inc.location}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-mist-500" />
                      <span>{inc.reportedAt}</span>
                    </span>

                    {/* Media indicator badge */}
                    {mediaList.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">
                        <Camera className="h-3 w-3" />
                        <span>
                          {photoCount > 0 && `${photoCount} Photo${photoCount > 1 ? 's' : ''}`}
                          {photoCount > 0 && videoCount > 0 && ', '}
                          {videoCount > 0 && `${videoCount} Video${videoCount > 1 ? 's' : ''}`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {inc.status === 'active' && (
                    <Button
                      size="sm"
                      variant="accent"
                      iconLeft={Send}
                      onClick={(e) => handleDispatchSecurity(inc.id, e)}
                      className="text-xs h-7 py-0"
                    >
                      Dispatch
                    </Button>
                  )}
                  {inc.status === 'dispatched_security' && (
                    <Button
                      size="sm"
                      variant="subtle"
                      iconLeft={Check}
                      onClick={(e) => handleResolve(inc.id, e)}
                      className="text-xs h-7 py-0 text-emerald-300 border-emerald-500/30"
                    >
                      Resolve
                    </Button>
                  )}
                  {inc.status === 'resolved' && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    iconRight={Eye}
                    onClick={() => handleOpenDetails(inc)}
                    className="text-xs h-7 py-0 text-mist-300 hover:text-white"
                  >
                    Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* =========================================================================
          INCIDENT DETAILS & SUBMITTED PHOTOS/VIDEOS MODAL
          Opens when user clicks on an incident
         ========================================================================= */}
      {selectedIncident && (
        <Modal
          title={`Incident Details: ${selectedIncident.ref}`}
          description={`${selectedIncident.title} · Reported by ${selectedIncident.reportedBy || selectedIncident.source}`}
          onClose={handleCloseDetails}
        >
          <div className="space-y-4 text-xs">
            {/* Top Overview Card */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded">
                    {selectedIncident.ref}
                  </span>
                  {getSeverityBadge(selectedIncident.severity)}
                  <Badge
                    tone={
                      selectedIncident.status === 'resolved'
                        ? 'success'
                        : selectedIncident.status === 'dispatched_security'
                          ? 'info'
                          : 'warning'
                    }
                  >
                    {selectedIncident.status === 'dispatched_security'
                      ? 'Dispatched to Security'
                      : selectedIncident.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIncident.status === 'active' && (
                    <Button
                      size="sm"
                      variant="accent"
                      iconLeft={Send}
                      onClick={() => handleDispatchSecurity(selectedIncident.id)}
                      className="text-xs h-7 py-0"
                    >
                      Dispatch Security
                    </Button>
                  )}
                  {selectedIncident.status === 'dispatched_security' && (
                    <Button
                      size="sm"
                      variant="subtle"
                      iconLeft={Check}
                      onClick={() => handleResolve(selectedIncident.id)}
                      className="text-xs h-7 py-0 text-emerald-300 border-emerald-500/30"
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-mist-200 leading-relaxed text-xs">
                {selectedIncident.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/5 text-[11px] text-mist-400">
                <div>
                  <span className="text-mist-500 block">Reported By:</span>
                  <strong className="text-white">{selectedIncident.reportedBy || selectedIncident.source}</strong>
                </div>
                <div>
                  <span className="text-mist-500 block">Location:</span>
                  <strong className="text-white">{selectedIncident.location}</strong>
                </div>
                <div>
                  <span className="text-mist-500 block">Reported At:</span>
                  <span className="text-white">{selectedIncident.reportedAt}</span>
                </div>
                <div>
                  <span className="text-mist-500 block">Assigned Security:</span>
                  <span className="text-cyan-300">{selectedIncident.securityOfficer || 'Not Dispatched'}</span>
                </div>
              </div>
            </div>

            {/* Submitted Photos & Videos Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-amber-300" />
                  <span>Submitted Photo &amp; Video Evidence:</span>
                </h4>
                <span className="text-[10px] text-mist-400">
                  {selectedIncident.media?.length ?? 0} item(s) attached
                </span>
              </div>

              {(!selectedIncident.media || selectedIncident.media.length === 0) ? (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center text-mist-400 text-xs">
                  No photos or videos submitted for this incident.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedIncident.media.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLightboxMediaIndex(idx)}
                      className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400/50 bg-black/40 text-left transition-all aspect-video flex flex-col justify-end p-2 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.thumbUrl || item.url}
                          alt={item.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <img
                            src={item.thumbUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80'}
                            alt={item.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105 brightness-75"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-cyan-500 text-ink-950 flex items-center justify-center shadow-lg">
                              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                      <div className="absolute top-1.5 left-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.type === 'video'
                              ? 'bg-rose-500 text-white'
                              : 'bg-black/60 text-white border border-white/20'
                          }`}
                        >
                          {item.type === 'video' ? `▶ VIDEO ${item.duration || ''}` : '📷 PHOTO'}
                        </span>
                      </div>

                      <div className="relative z-10">
                        <p className="text-[11px] font-bold text-white truncate group-hover:text-cyan-300">
                          {item.title}
                        </p>
                        <p className="text-[9px] text-mist-300 truncate opacity-80">
                          {item.submittedBy || 'Submitted Evidence'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" size="sm" onClick={handleCloseDetails}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MEDIA LIGHTBOX VIEWER (OPENS WHEN USER CLICKS A PHOTO OR VIDEO)
         ========================================================================= */}
      {selectedIncident && lightboxMediaIndex !== null && selectedIncident.media?.[lightboxMediaIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-ink-950 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/[0.03]">
              <div className="space-y-0.5 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    {selectedIncident.ref}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">
                    {selectedIncident.media[lightboxMediaIndex].title}
                  </h4>
                  <Badge tone={selectedIncident.media[lightboxMediaIndex].type === 'video' ? 'danger' : 'accent'}>
                    {selectedIncident.media[lightboxMediaIndex].type === 'video' ? 'VIDEO' : 'PHOTO'}
                  </Badge>
                </div>
                <p className="text-xs text-mist-400 truncate">
                  Submitted by <strong className="text-white">{selectedIncident.media[lightboxMediaIndex].submittedBy || selectedIncident.reportedBy}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-mist-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {lightboxMediaIndex + 1} / {selectedIncident.media.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxMediaIndex(null)}
                  className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Close media viewer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Media Canvas */}
            <div className="relative flex-1 bg-black/80 flex items-center justify-center min-h-[300px] sm:min-h-[420px] max-h-[60vh] overflow-hidden p-2">
              {selectedIncident.media[lightboxMediaIndex].type === 'image' ? (
                <img
                  src={selectedIncident.media[lightboxMediaIndex].url}
                  alt={selectedIncident.media[lightboxMediaIndex].title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <video
                    key={selectedIncident.media[lightboxMediaIndex].url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-lg shadow-2xl bg-black"
                    poster={selectedIncident.media[lightboxMediaIndex].thumbUrl}
                  >
                    <source src={selectedIncident.media[lightboxMediaIndex].url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Prev / Next Arrows */}
              {selectedIncident.media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxMediaIndex(
                        (lightboxMediaIndex - 1 + selectedIncident.media!.length) %
                          selectedIncident.media!.length,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition shadow-lg"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxMediaIndex((lightboxMediaIndex + 1) % selectedIncident.media!.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition shadow-lg"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Caption */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3 text-xs text-mist-300">
              <p className="truncate">
                <strong className="text-white">Caption:</strong> {selectedIncident.media[lightboxMediaIndex].caption || selectedIncident.media[lightboxMediaIndex].title}
              </p>
              <button
                type="button"
                onClick={() => setLightboxMediaIndex(null)}
                className="text-xs text-cyan-300 hover:text-white shrink-0"
              >
                Back to Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOG INCIDENT MODAL (MINIMAL WITH PHOTO / VIDEO ATTACHMENT)
         ========================================================================= */}
      {showLogModal && (
        <Modal
          title="Log Security Incident"
          description="Record guest safety report or patrol observation with optional photo/video evidence."
          onClose={() => setShowLogModal(false)}
        >
          <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Incident Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Balcony glass sliding door latch loose"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as FDIncident['source'])}
                  className="field w-full text-xs"
                >
                  <option value="Guest Report">Guest Report</option>
                  <option value="Front Desk Patrol">Front Desk Patrol</option>
                  <option value="Housekeeping Alert">Housekeeping Alert</option>
                  <option value="Security Dispatch">Security Dispatch</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Reported By</label>
                <input
                  type="text"
                  placeholder="e.g. Elena Rostova or Concierge"
                  value={newReporter}
                  onChange={(e) => setNewReporter(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Room (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 402"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 402 Balcony"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as FDIncident['severity'])}
                  className="field w-full text-xs"
                >
                  <option value="low">Low (General Concern)</option>
                  <option value="medium">Medium (Safety / Repair)</option>
                  <option value="high">High (Immediate Response)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Description</label>
              <textarea
                required
                rows={2}
                placeholder="Detail observations or immediate action needed."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            {/* Quick Attach Evidence Media */}
            <div className="p-2.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[11px] flex items-center gap-1">
                  <Paperclip className="h-3 w-3 text-cyan-300" />
                  <span>Attach Evidence ({stagedMedia.length} attached):</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAddSampleMedia('photo_leak')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-mist-200"
                  >
                    + Leak Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleMedia('photo_damage')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-mist-200"
                  >
                    + Damage Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleMedia('video_clip')}
                    className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[10px] text-rose-300"
                  >
                    + Video Clip
                  </button>
                </div>
              </div>

              {stagedMedia.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stagedMedia.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white"
                    >
                      {m.type === 'video' ? '▶' : '📷'} {m.title}
                      <button
                        type="button"
                        onClick={() => setStagedMedia((prev) => prev.filter((x) => x.id !== m.id))}
                        className="text-mist-400 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-mist-200 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={dispatchNow}
                onChange={(e) => setDispatchNow(e.target.checked)}
                className="rounded border-white/20 bg-ink-900 text-cyan-400"
              />
              <span>Immediately dispatch Security Operator on-duty patrol team</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" size="sm" type="button" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" type="submit" iconLeft={Send}>
                Log &amp; Dispatch
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency Broadcast Alert Modal */}
      {showBroadcastModal && (
        <Modal
          title="Emergency Broadcast"
          description="Send emergency advisory to guest devices."
          onClose={() => setShowBroadcastModal(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setBroadcastSentTime('Broadcast active');
              setShowBroadcastModal(false);
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Broadcast Text</label>
              <textarea
                rows={2}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="field w-full text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" size="sm" type="button" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white">
                Send Broadcast
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
