'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, BedDouble, Flower2, Package, UtensilsCrossed, Wrench, X } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { departmentId, isOpen, managerDepartment, managerTasks, type ManagerDepartmentId } from '@/lib/manager-domain';
import { hotelDate } from '@/lib/manager-performance';
import type { ManagerStockItem, CustomDiningRequest } from '@/types/demo';

export const DESK_LABELS: Record<ManagerDepartmentId, string> = {
  housekeeping: 'Room readiness',
  wellness: 'Guest medical cases',
  engineering: 'Maintenance plan',
  'food-beverages': 'Dining & kitchen menu',
};

export function DepartmentDesk({ summary = false, onOpen, onInspect }: { summary?: boolean; onOpen: () => void; onInspect: () => void }) {
  const { state, departmentManagerCommand, reviewCustomDishRequest, updateCustomDiningStatus } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const operations = state.managerOperations;
  const [roomFilter, setRoomFilter] = useState('attention');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuLimit, setMenuLimit] = useState(6);
  const [showPast, setShowPast] = useState(false);
  const [modal, setModal] = useState<ManagerStockItem | null>(null);
  const [customDishAction, setCustomDishAction] = useState<{
    item: CustomDiningRequest;
    action: 'quote' | 'reject' | 'clarify';
  } | null>(null);
  const [quotePrice, setQuotePrice] = useState<number>(650);
  const [quotePrepTime, setQuotePrepTime] = useState<string>('30-40 mins');
  const [quoteNote, setQuoteNote] = useState<string>('Freshly prepared by Executive Chef Anand.');
  const dialog = useRef<HTMLDialogElement>(null);
  if (!operations) return null;

  const stock = operations.stock.filter(item => departmentId(item.department) === department.id);
  const rooms = state.frontDesk.rooms;
  const assets = operations.assets;
  const today = hotelDate(Date.now());
  const tasks = managerTasks(state, department.id);
  const pendingCustomCount = (state.customDiningRequests ?? []).filter(c => ['Submitted', 'Under Kitchen Review'].includes(c.status)).length;
  const summaryText = department.id === 'housekeeping'
    ? `${rooms.filter(r => r.readiness === 'ready').length} rooms ready · ${rooms.filter(r => r.dnd || state.guestPreferences?.[r.no]?.dnd).length} do not disturb`
    : department.id === 'wellness'
      ? `${(operations.medicalCases ?? []).filter(c => c.status !== 'closed').length} active medical cases`
      : department.id === 'engineering'
        ? `${assets.filter(a => a.nextDue <= today).length} services due · ${assets.filter(a => a.workOrderRef).length} linked work orders`
        : `${(state.diningMenu ?? []).filter(item => item.isAvailable).length} menu items available · ${pendingCustomCount} custom dish request${pendingCustomCount === 1 ? '' : 's'}`;

  const DeskIcon = department.id === 'housekeeping' ? BedDouble : department.id === 'wellness' ? Flower2 : department.id === 'engineering' ? Wrench : UtensilsCrossed;
  if (summary) return <section className="dm-panel dm-desk-summary"><div className="dm-desk-card-label"><span className="dm-attention-icon"><DeskIcon size={21}/></span><span>Department tools</span></div><h2>{DESK_LABELS[department.id]}</h2><p>{summaryText}</p><div className="dm-desk-card-detail">{department.id === 'housekeeping' ? 'Prepare arrivals, check room status and coordinate your supplies.' : department.id === 'wellness' ? 'Track case urgency, chronological notes and guest follow-up reminders.' : department.id === 'engineering' ? 'Stay ahead of service dates and keep work orders moving.' : 'Manage dining and kitchen dishes, prices, ingredients and listed allergens.'}</div><button className="dm-primary" onClick={onOpen}>Open department desk <ArrowRight size={16}/></button></section>;

  const openModal = (next: NonNullable<typeof modal>) => { setModal(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setModal(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) || '').trim();
    const ok = modal && departmentManagerCommand({ type: 'stock-count', stockId: modal.id, quantity: Number(field('quantity')) });
    if (ok) close();
  };
  const selectedRooms = rooms.filter(room => {
    if (roomFilter === 'all') return true;
    if (roomFilter === 'dnd') return room.dnd || state.guestPreferences?.[room.no]?.dnd;
    if (roomFilter === 'arrivals') return state.frontDesk.stays.some(stay => stay.room === room.no && stay.status === 'expected');
    return room.readiness !== 'ready';
  });
  const menu = (state.diningMenu ?? []).filter(item => `${item.name} ${item.category} ${item.allergens.join(' ')}`.toLowerCase().includes(menuSearch.toLowerCase()));

  return <div className="dm-desk">
    {department.id === 'housekeeping' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>Room readiness</h2><p>Prioritize arrivals, respect do-not-disturb requests and send cleaning to dispatch.</p></div><select aria-label="Room readiness filter" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}><option value="attention">Needs attention</option><option value="arrivals">Expected arrivals</option><option value="dnd">Do not disturb</option><option value="all">All rooms</option></select></div>
      <div className="dm-room-grid">{selectedRooms.map(room => {
        const dnd = room.dnd || state.guestPreferences?.[room.no]?.dnd;
        const arrival = state.frontDesk.stays.find(stay => stay.room === room.no && stay.status === 'expected');
        const existing = tasks.some(t => t.room === room.no && t.category === 'housekeeping' && isOpen(t.status));
        const canClean = !dnd && ['dirty', 'inspection_failed'].includes(room.readiness) && !existing;
        return <article className="dm-room" key={room.no}>
          <div><strong>{room.no}</strong><span className="dm-status">{room.readiness.replaceAll('_', ' ')}</span></div>
          <p>Floor {room.floor} · {room.occupied ? 'Occupied' : 'Vacant'}</p>
          <small>{dnd ? 'Do not disturb · entry paused' : arrival ? `${arrival.vip ? 'VIP · ' : ''}Expected arrival` : 'No arrival flag'}</small>
          {room.readiness === 'inspection_pending' ? <button className="dm-text-button" onClick={onInspect}>Open inspections</button> : <button className="dm-small-button" disabled={!canClean} onClick={() => departmentManagerCommand({ type: 'room-cleaning', room: room.no })}>{existing ? 'Cleaning already queued' : dnd ? 'Entry paused' : room.readiness === 'out_of_order' ? 'Engineering clearance needed' : 'Request cleaning'}</button>}
        </article>;
      })}</div>{selectedRooms.length === 0 && <p className="dm-empty">No rooms match this view.</p>}
    </section>}

    {department.id === 'engineering' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>Preventive maintenance</h2><p>Create one linked work order per asset. Record service after the work is completed.</p></div></div>
      {assets.toSorted((a, b) => a.nextDue.localeCompare(b.nextDue)).map(asset => {
        const work = asset.workOrderRef ? tasks.find(task => task.ref === asset.workOrderRef) : undefined;
        const complete = work && ['completed', 'resolved'].includes(work.status.toLowerCase());
        return <article className="dm-record" key={asset.id}>
          <div className="dm-record-title"><h3>{asset.name}</h3><span className="dm-status">{asset.nextDue < today ? 'Overdue' : asset.nextDue === today ? 'Due today' : `Due ${asset.nextDue}`}</span></div>
          <p>{asset.location} · Every {asset.intervalDays} days</p><small>{asset.lastServiced ? `Last serviced ${new Date(asset.lastServiced).toLocaleDateString('en-IN')}` : 'No service recorded in this demo'}</small>
          <div className="dm-record-actions">{complete ? <button className="dm-small-button" onClick={() => departmentManagerCommand({ type: 'asset-service', assetId: asset.id })}>Record service & next due date</button> : <button className="dm-small-button" disabled={!!work && isOpen(work.status)} onClick={() => departmentManagerCommand({ type: 'asset-work-order', assetId: asset.id })}>{work && isOpen(work.status) ? `Work order · ${work.status}` : 'Create maintenance work order'}</button>}</div>
        </article>;
      })}
    </section>}

    {department.id !== 'food-beverages' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>{department.id === 'housekeeping' ? 'Linen & supplies' : department.id === 'wellness' ? 'Treatment supplies' : 'Spare parts'}</h2><p>Record counts and request the quantity needed to reach each target. Requests do not change stock.</p></div><Package size={19}/></div>
      <div className="dm-table-wrap"><table className="dm-table"><thead><tr><th>Item</th><th>On hand / target</th><th>Shortfall</th><th>Actions</th></tr></thead><tbody>{stock.map(item => {
        const pending = state.resourceRequests?.some(request => request.id === item.requisitionId && request.status === 'pending');
        return <tr key={item.id}><td><strong>{item.name}</strong><small>{item.unit}{item.lastCountedAt ? ` · Counted ${new Date(item.lastCountedAt).toLocaleDateString('en-IN')}` : ' · Sample opening count'}</small></td><td>{item.onHand} / {item.par}</td><td>{Math.max(0, item.par - item.onHand)} {item.unit}</td><td><div className="dm-record-actions"><button className="dm-text-button" onClick={() => openModal(item)}>Update count</button><button className="dm-small-button" disabled={pending || item.onHand >= item.par} onClick={() => departmentManagerCommand({ type: 'replenish', stockId: item.id })}>{pending ? 'Request pending' : 'Request stock'}</button></div></td></tr>;
      })}</tbody></table></div>
    </section>}

    {department.id === 'food-beverages' && <>
      <section className="dm-panel">
        <div className="dm-panel-heading"><div><h2>Custom Food Requests &amp; Quotes</h2><p>Review bespoke dishes requested by guests, provide price &amp; preparation quotes, or request clarification.</p></div></div>
        {(state.customDiningRequests ?? []).length === 0 ? (
          <p className="dm-empty">No custom food requests received yet.</p>
        ) : (
          <div className="dm-room-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {(state.customDiningRequests ?? []).map(req => {
              const isPendingReview = req.status === 'Submitted' || req.status === 'Under Kitchen Review';
              const isCooking = req.status === 'In Preparation';
              const isOutForDelivery = req.status === 'Out for Delivery';
              return (
                <article className="dm-room" key={req.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{req.dishName || `${req.cuisine} Dish`}</strong>
                    <span className="dm-status">{req.status}</span>
                  </div>
                  <p>Room {req.room} · {req.guestName} · {req.ref}</p>
                  <small>
                    {req.cuisine} · {req.dietaryPreference} · Spice: {req.spiceLevel} · Servings: {req.servings}
                    {req.allergiesToAvoid ? ` · Avoid: ${req.allergiesToAvoid}` : ''}
                  </small>
                  <p style={{ fontSize: '0.78rem', opacity: 0.9 }}>{req.description}</p>
                  {req.quotedPrice !== undefined && (
                    <small style={{ color: '#fbbf24', fontWeight: 600 }}>
                      Quoted: ₹{req.quotedPrice.toLocaleString('en-IN')} · Est. {req.quotedPrepTime || '35 mins'}
                      {req.guestQuoteApproved ? ' · Guest Approved' : ''}
                    </small>
                  )}
                  <div className="dm-record-actions" style={{ marginTop: 'auto', paddingTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {isPendingReview && (
                      <>
                        <button
                          className="dm-small-button"
                          onClick={() => {
                            setCustomDishAction({ item: req, action: 'quote' });
                            setQuotePrice(650);
                            setQuotePrepTime('30-40 mins');
                            setQuoteNote('Freshly prepared by Executive Chef Anand.');
                          }}
                        >
                          Provide Quote
                        </button>
                        <button
                          className="dm-text-button"
                          onClick={() => {
                            setCustomDishAction({ item: req, action: 'clarify' });
                            setQuoteNote('Please specify if you prefer white or brown rice with this preparation.');
                          }}
                        >
                          Clarify
                        </button>
                        <button
                          className="dm-text-button"
                          style={{ color: '#f87171' }}
                          onClick={() => {
                            setCustomDishAction({ item: req, action: 'reject' });
                            setQuoteNote('Ingredients currently unavailable during this shift.');
                          }}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {isCooking && (
                      <button
                        className="dm-small-button"
                        onClick={() => updateCustomDiningStatus(req.id, 'Out for Delivery')}
                      >
                        Dispatch (Out for Delivery)
                      </button>
                    )}
                    {isOutForDelivery && (
                      <button
                        className="dm-small-button"
                        onClick={() => updateCustomDiningStatus(req.id, 'Delivered')}
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>}

    {customDishAction && (
      <dialog
        className="dm-dialog"
        open
        style={{ display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}
      >
        <div className="dm-dialog-heading">
          <h2>
            {customDishAction.action === 'quote'
              ? `Quote Price for ${customDishAction.item.dishName || customDishAction.item.cuisine + ' Dish'}`
              : customDishAction.action === 'clarify'
              ? `Ask Clarification for ${customDishAction.item.ref}`
              : `Decline Request ${customDishAction.item.ref}`}
          </h2>
          <button className="dm-icon-button" type="button" onClick={() => setCustomDishAction(null)} aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
          <p className="dm-dialog-description">
            Guest: {customDishAction.item.guestName} · Room {customDishAction.item.room} · Servings: {customDishAction.item.servings}
          </p>
          {customDishAction.action === 'quote' && (
            <>
              <label className="dm-field">
                Quoted Price (₹)
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(Number(e.target.value))}
                  required
                />
              </label>
              <label className="dm-field">
                Estimated Preparation Time
                <input
                  type="text"
                  value={quotePrepTime}
                  onChange={(e) => setQuotePrepTime(e.target.value)}
                  placeholder="e.g. 30-40 mins"
                  required
                />
              </label>
            </>
          )}
          <label className="dm-field">
            {customDishAction.action === 'quote' ? 'Kitchen Note for Guest' : customDishAction.action === 'clarify' ? 'Clarification Question' : 'Reason for Declining'}
            <textarea
              rows={3}
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="dm-dialog-actions">
          <button className="dm-secondary" type="button" onClick={() => setCustomDishAction(null)}>
            Cancel
          </button>
          <button
            className="dm-primary"
            type="button"
            onClick={() => {
              reviewCustomDishRequest(customDishAction.item.id, customDishAction.action, {
                price: customDishAction.action === 'quote' ? quotePrice : undefined,
                prepTime: customDishAction.action === 'quote' ? quotePrepTime : undefined,
                kitchenNote: quoteNote,
              });
              setCustomDishAction(null);
            }}
          >
            {customDishAction.action === 'quote' ? 'Send Quote to Guest' : customDishAction.action === 'clarify' ? 'Send Question' : 'Decline Request'}
          </button>
        </div>
      </dialog>
    )}

    <dialog ref={dialog} className="dm-dialog" onClose={() => setModal(null)} aria-labelledby="department-desk-dialog-title"><form onSubmit={submit} key={modal?.id}>
      <div className="dm-dialog-heading"><h2 id="department-desk-dialog-title">Update stock count</h2><button className="dm-icon-button" type="button" onClick={close} aria-label="Close department action"><X size={19}/></button></div>
      {modal && <><p className="dm-dialog-description">{modal.name} · Target {modal.par} {modal.unit}</p><label className="dm-field">Count on hand ({modal.unit})<input name="quantity" type="number" min="0" max="1000000" step={['sets', 'pieces', 'bottles'].includes(modal.unit) ? '1' : '0.1'} required defaultValue={modal.onHand}/></label></>}
      <div className="dm-dialog-actions"><button className="dm-secondary" type="button" onClick={close}>Cancel</button><button className="dm-primary" type="submit">Save count</button></div>
    </form></dialog>
  </div>;
}
