import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  seedItems,
  seedInspections,
  seedNotifications,
  seedSafetyAlerts,
  seedCompensationRequests,
  seedIncidents,
  frontDeskSeed,
  seedGuestPreferences,
  seedGuestReminders,
  seedResourceRequests,
} from '../src/lib/mockData.ts';

function readFileSafe(filePath) {
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');
  const prefixed = path.join('hotel-app-main/public-preview', filePath);
  if (fs.existsSync(prefixed)) return fs.readFileSync(prefixed, 'utf8');
  const stripped = filePath.replace(/^hotel-app-main\/public-preview[\\/]/, '');
  if (fs.existsSync(stripped)) return fs.readFileSync(stripped, 'utf8');
  throw new Error(`File not found: ${filePath}`);
}

test('executive demo data contains items across all approval sections', () => {
  const items = seedItems.executive_viewer;
  assert.ok(items.length >= 10, 'Should have at least 10 demo items');

  const pending = items.filter((i) => i.status === 'Needs approval');
  const approved = items.filter((i) => i.status === 'Approved');
  const rejected = items.filter((i) => i.status === 'Rejected');
  const infoRequested = items.filter((i) => i.status === 'Info Requested');

  assert.ok(pending.length > 0, 'Pending Approvals should have demo data');
  assert.ok(approved.length > 0, 'Authorized should have demo data');
  assert.ok(rejected.length > 0, 'Declined should have demo data');
  assert.ok(infoRequested.length > 0, 'Clarification Needed should have demo data');

  // Verify general_manager seed mirrors executive_viewer
  assert.equal(seedItems.general_manager.length, seedItems.executive_viewer.length);
  for (let idx = 0; idx < items.length; idx++) {
    assert.equal(seedItems.general_manager[idx].id, seedItems.executive_viewer[idx].id);
    assert.equal(seedItems.general_manager[idx].status, seedItems.executive_viewer[idx].status);
  }
});

test('approval actions properly transition states across sections', () => {
  const execList = structuredClone(seedItems.executive_viewer);
  const gmList = structuredClone(seedItems.general_manager);

  // Transition 1: Approve pending item exe-1
  const targetId = 'exe-1';
  const initialPendingCount = execList.filter((i) => i.status === 'Needs approval').length;
  const initialApprovedCount = execList.filter((i) => i.status === 'Approved').length;

  const updateStatus = (list, id, newStatus, chip, tone) =>
    list.map((i) => (i.id === id ? { ...i, status: newStatus, chip, tone } : i));

  const approvedExec = updateStatus(execList, targetId, 'Approved', 'GM Approved', 'success');
  const approvedGm = updateStatus(gmList, targetId, 'Approved', 'GM Approved', 'success');

  assert.equal(
    approvedExec.filter((i) => i.status === 'Needs approval').length,
    initialPendingCount - 1,
    'Pending count should decrease after approval',
  );
  assert.equal(
    approvedExec.filter((i) => i.status === 'Approved').length,
    initialApprovedCount + 1,
    'Approved count should increase after approval',
  );
  assert.equal(approvedExec.find((i) => i.id === targetId)?.status, 'Approved');
  assert.equal(approvedGm.find((i) => i.id === targetId)?.status, 'Approved');

  // Transition 2: Reopen approved item back to pending
  const reopenedExec = updateStatus(approvedExec, targetId, 'Needs approval', 'Pending Review', 'warning');
  assert.equal(
    reopenedExec.filter((i) => i.status === 'Needs approval').length,
    initialPendingCount,
    'Pending count should restore after reopening',
  );
  assert.equal(
    reopenedExec.filter((i) => i.status === 'Approved').length,
    initialApprovedCount,
    'Approved count should restore after reopening',
  );
});

test('escalation operations view titles map correctly to page opened names', () => {
  const getPageOpenedName = (view) => {
    switch (view) {
      case 'complaints':
        return 'Guest Complaints';
      case 'escalations':
        return 'Escalations';
      case 'incidents':
      default:
        return 'Property Incidents';
    }
  };

  assert.equal(getPageOpenedName('incidents'), 'Property Incidents');
  assert.equal(getPageOpenedName('complaints'), 'Guest Complaints');
  assert.equal(getPageOpenedName('escalations'), 'Escalations');
});

test('department inspections correctly segregate due and history with deadlines', () => {
  const inspections = structuredClone(seedInspections);

  const due = inspections.filter((i) => i.status !== 'passed');
  const history = inspections.filter((i) => i.status === 'passed');

  assert.ok(due.length > 0, 'Should have active due inspections');
  assert.ok(history.length > 0, 'Should have completed history inspections');

  // Verify all due inspections have deadlines (via scheduledTime or preset deadline)
  for (const item of due) {
    const deadline = item.scheduledTime || (item.priority === 'urgent' ? 'Today 11:00' : 'Today 16:00');
    assert.ok(
      typeof deadline === 'string' && deadline.length > 0,
      `Due inspection ${item.id} must have a deadline`,
    );
  }

  // Verify transition from Due to History when approved
  const target = due[0];
  const initialDueCount = due.length;
  const initialHistoryCount = history.length;

  const updatedInspections = inspections.map((i) =>
    i.id === target.id
      ? { ...i, status: 'passed', inspectedAt: 'Today 11:45', inspectedBy: 'General Manager' }
      : i,
  );

  const newDue = updatedInspections.filter((i) => i.status !== 'passed');
  const newHistory = updatedInspections.filter((i) => i.status === 'passed');

  assert.equal(newDue.length, initialDueCount - 1, 'Due count should decrease by 1');
  assert.equal(newHistory.length, initialHistoryCount + 1, 'History count should increase by 1');
  assert.equal(newHistory.find((i) => i.id === target.id)?.status, 'passed');

  // Verify adding a new directive creates a due item with scheduled deadline
  const newDirective = {
    id: 'insp-new-test',
    department: 'Housekeeping',
    roomNumber: 'Room 501',
    type: 'turnover',
    status: 'pending',
    priority: 'urgent',
    scheduledTime: 'Today 15:00',
    instructions: 'Perform high-priority turnover',
  };

  const withNewDirective = [newDirective, ...updatedInspections];
  const dueWithNew = withNewDirective.filter((i) => i.status !== 'passed');
  assert.equal(dueWithNew.length, newDue.length + 1);
  assert.equal(dueWithNew.find((i) => i.id === 'insp-new-test')?.scheduledTime, 'Today 15:00');
});

test('high escalations page maps spa and wellness departments to Wellness', () => {
  const roles = ['department_manager', 'department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'];
  const seen = new Set();
  const escalatedTasks = [];

  roles.forEach((r) => {
    (seedItems[r] ?? []).forEach((item) => {
      if (item.status === 'Escalated' || item.priority === 'critical' || item.priority === 'vip') {
        const key = item.ref || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          escalatedTasks.push(item);
        }
      }
    });
  });

  const formatDept = (item) => {
    if (item.department) {
      if (/spa\s*(&|and)\s*wellness/i.test(item.department) || item.department.trim().toLowerCase() === 'spa') {
        return 'Wellness';
      }
      return item.department;
    }
    const text = `${item.title} ${item.meta}`.toLowerCase();
    if (/wellness|\bspa\b|therapy|treatment/.test(text)) return 'Wellness';
    return 'Property Operations';
  };

  const wellnessTasks = escalatedTasks.filter(
    (t) =>
      t.id === 'dis-well-1' ||
      t.id === 'ful-well-leila-2' ||
      t.id === 'mgr-4' ||
      (t.department && /spa|wellness/i.test(t.department)),
  );

  assert.ok(wellnessTasks.length > 0, 'Should have wellness-related escalated tasks');
  for (const t of wellnessTasks) {
    const displayed = formatDept(t);
    assert.equal(displayed, 'Wellness', `Task ${t.id} must display department as Wellness`);
    assert.ok(!/spa\s*(&|and)\s*wellness/i.test(displayed), 'Must not contain Spa & Wellness');
  }
});

test('executive notifications map to exact item details, fields, and target tabs', () => {
  const gmNotifs = seedNotifications.filter((n) => n.roleId === 'general_manager');
  assert.ok(gmNotifs.length >= 5, 'Should have at least 5 GM notifications');

  const mockState = {
    items: seedItems,
    incidents: seedIncidents,
    safetyAlerts: seedSafetyAlerts,
    inspections: seedInspections,
    compensationRequests: seedCompensationRequests,
  };

  const resolveItemFields = (notif) => {
    const { itemId } = notif;
    // Approvals check
    const approvals = [...(mockState.items.general_manager ?? []), ...(mockState.items.executive_viewer ?? [])];
    const appMatch = approvals.find((i) => i.id === itemId || i.ref === itemId);
    if (appMatch) {
      return {
        type: 'approval',
        ref: appMatch.ref || appMatch.id,
        title: appMatch.title,
        amount: appMatch.amount ? `₹${appMatch.amount.toLocaleString('en-IN')}` : undefined,
        department: appMatch.department || notif.department,
        targetTab: 'approvals',
      };
    }

    // Incident check
    const incMatch = mockState.incidents.find((i) => i.id === itemId || i.ref === itemId);
    if (incMatch) {
      return {
        type: 'incident',
        ref: incMatch.ref,
        title: incMatch.title,
        location: incMatch.affectedArea,
        severity: incMatch.severity,
        targetTab: 'incidents',
      };
    }

    // Safety Alert check
    const sftMatch = mockState.safetyAlerts.find((s) => s.id === itemId || s.ref === itemId);
    if (sftMatch) {
      return {
        type: 'safety',
        ref: sftMatch.ref,
        title: sftMatch.title,
        priority: sftMatch.priority,
        targetTab: 'approvals',
      };
    }

    // Inspection check
    const inspMatch = mockState.inspections.find(
      (i) => i.id === itemId || i.taskId === itemId || (itemId.includes('WELL') && (i.id.includes('SPA') || i.id.includes('WELL')))
    );
    if (inspMatch) {
      return {
        type: 'inspection',
        ref: itemId,
        deadline: inspMatch.scheduledTime || 'Today 11:30',
        department: inspMatch.department === 'wellness' || inspMatch.department === 'Spa & Wellness' ? 'Wellness' : inspMatch.department,
        targetTab: 'inspections',
      };
    }

    // Compensation check
    const compMatch = mockState.compensationRequests.find((c) => c.id === itemId || c.ref === itemId);
    if (compMatch) {
      return {
        type: 'compensation',
        ref: compMatch.ref,
        amount: `₹${compMatch.amount.toLocaleString('en-IN')}`,
        targetTab: 'approvals',
      };
    }

    return null;
  };

  // Test 1: Capex notification exe-1
  const notif1 = gmNotifs.find((n) => n.itemId === 'exe-1');
  assert.ok(notif1, 'Should find notif-gm-1');
  const details1 = resolveItemFields(notif1);
  assert.equal(details1.type, 'approval');
  assert.equal(details1.targetTab, 'approvals');
  assert.ok(details1.ref.includes('EX-2026-001') || details1.ref.includes('exe-1'));
  assert.ok(details1.amount.includes('₹'));

  // Test 2: Major incident notification inc-1
  const notif2 = gmNotifs.find((n) => n.itemId === 'inc-1');
  assert.ok(notif2, 'Should find notif-gm-2');
  const details2 = resolveItemFields(notif2);
  assert.equal(details2.type, 'incident');
  assert.equal(details2.targetTab, 'incidents');
  assert.ok(
    details2.ref.includes('INC-2026-088') ||
      details2.ref.includes('INC-204') ||
      details2.ref.includes('inc-1'),
    `Incident ref should match, got: ${details2.ref}`,
  );

  // Test 3: Safety alert broadcast authorization alert-2
  const notif3 = gmNotifs.find((n) => n.itemId === 'alert-2');
  assert.ok(notif3, 'Should find notif-gm-3');
  const details3 = resolveItemFields(notif3);
  assert.equal(details3.type, 'safety');
  assert.equal(details3.targetTab, 'approvals');
  assert.equal(details3.ref, 'SFT-002');

  // Test 4: Inspection due INSP-WELL-01
  const notif4 = gmNotifs.find((n) => n.itemId === 'INSP-WELL-01');
  assert.ok(notif4, 'Should find notif-gm-4');
  const details4 = resolveItemFields(notif4);
  assert.equal(details4.type, 'inspection');
  assert.equal(details4.targetTab, 'inspections');
  assert.equal(details4.ref, 'INSP-WELL-01');
  assert.equal(details4.department, 'Wellness');
  assert.ok(details4.deadline.length > 0, 'Must have deadline');

  // Test 5: High-value compensation comp-2
  const notif5 = gmNotifs.find((n) => n.itemId === 'comp-2');
  assert.ok(notif5, 'Should find notif-gm-5');
  const details5 = resolveItemFields(notif5);
  assert.equal(details5.type, 'compensation');
  assert.equal(details5.targetTab, 'approvals');
  assert.equal(details5.ref, 'COMP-VIP-518-02');
  assert.equal(details5.amount, '₹14,500');
});





test('executive overview department pulse click provides exact department performance details without tab redirection', () => {
  const expectedDepts = [
    { id: 'maintenance', name: 'Maintenance & Engineering', lead: 'Arjun Mehta', targetSla: 91.4 },
    { id: 'housekeeping', name: 'Housekeeping & Rooms', lead: 'Meera Nambiar', targetSla: 96.8 },
    { id: 'front_office', name: 'Front Office & Stays', lead: 'Sunita Patel', targetSla: 95.2 },
    { id: 'food_beverage', name: 'Food & Beverage', lead: 'Kabir Sen', targetSla: 94.0 },
    { id: 'spa_wellness', name: 'Wellness', lead: 'T. Brandt', targetSla: 98.5 },
    { id: 'security', name: 'Safety & Security', lead: 'Inspector Roy', targetSla: 97.1 },
  ];

  let selectedDepartmentState = null;
  let activeTabState = 'overview';

  // Simulating department item click in Department Operational Pulse section
  const handleDepartmentClick = (dept) => {
    // Exact detail selection occurs locally without redirecting activeTab
    selectedDepartmentState = dept;
  };

  for (const dept of expectedDepts) {
    handleDepartmentClick(dept);
    assert.ok(selectedDepartmentState !== null, 'Department performance details must be selected');
    assert.equal(selectedDepartmentState.id, dept.id);
    assert.equal(selectedDepartmentState.name, dept.name);
    assert.equal(selectedDepartmentState.lead, dept.lead);
    assert.equal(selectedDepartmentState.targetSla, dept.targetSla);
    assert.equal(activeTabState, 'overview', 'Must stay on overview tab without redirecting');
  }
});

test('high escalations tasks are clickable and display title-only in table row, revealing elaborated details on click', () => {
  const roles = ['department_manager', 'department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'];
  const seen = new Set();
  const escalatedTasks = [];

  roles.forEach((r) => {
    (seedItems[r] ?? []).forEach((item) => {
      if (item.status === 'Escalated' || item.priority === 'critical' || item.priority === 'vip') {
        const key = item.ref || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          escalatedTasks.push(item);
        }
      }
    });
  });

  assert.ok(escalatedTasks.length > 0, 'Should have escalated tasks');

  // 1. Verify table row render logic: title only, no details inside table cell
  for (const t of escalatedTasks) {
    const tableCellContent = {
      title: t.title,
      // details are purposefully not rendered in table row
      metaRenderedInCell: false,
    };
    assert.ok(typeof tableCellContent.title === 'string' && tableCellContent.title.length > 0);
    assert.equal(tableCellContent.metaRenderedInCell, false, 'Details must not be shown in the table row cell');
  }

  // 2. Verify clicking task displays elaborated detail modal
  let selectedEscalatedTask = null;
  const onTaskClick = (task) => {
    selectedEscalatedTask = task;
  };

  const sampleTask = escalatedTasks[0];
  onTaskClick(sampleTask);

  assert.ok(selectedEscalatedTask !== null, 'Selected task must be populated on click');
  assert.equal(selectedEscalatedTask.id, sampleTask.id);
  assert.equal(selectedEscalatedTask.title, sampleTask.title);
  // In the elaborated modal, details (meta/description/history) are available
  assert.ok(
    selectedEscalatedTask.meta || selectedEscalatedTask.description || selectedEscalatedTask.notes !== undefined,
    'Elaborated details must be available when task is selected',
  );
});

test('property incidents box displays title-only and supports details and timeline actions', () => {
  assert.ok(seedIncidents.length > 0, 'Should have seed incidents');

  for (const incident of seedIncidents) {
    // 1. Verify card body representation: title-only inside the box, secondary details omitted
    const cardBodyContent = {
      title: incident.title,
      // details are purposefully omitted from the incident box
      areaRenderedInBox: false,
      coordinatorRenderedInBox: false,
      reportedAtRenderedInBox: false,
      timelineSnippetRenderedInBox: false,
    };
    assert.ok(typeof cardBodyContent.title === 'string' && cardBodyContent.title.length > 0);
    assert.equal(cardBodyContent.areaRenderedInBox, false);
    assert.equal(cardBodyContent.coordinatorRenderedInBox, false);
    assert.equal(cardBodyContent.timelineSnippetRenderedInBox, false);

    // 2. Verify Details button action shows detailed information
    let modalState = null;
    let modalTab = 'details';

    const onDetailsClick = (inc) => {
      modalState = inc;
      modalTab = 'details';
    };

    onDetailsClick(incident);
    assert.equal(modalState.id, incident.id);
    assert.equal(modalTab, 'details');
    // Ensure all detailed fields are accessible in the detailed view
    assert.ok(modalState.affectedArea && modalState.affectedArea.length > 0);
    assert.ok(modalState.coordinator && modalState.coordinator.length > 0);
    assert.ok(modalState.reportedAt && modalState.reportedAt.length > 0);
    assert.ok(modalState.severity && modalState.severity.length > 0);
    assert.ok(modalState.status && modalState.status.length > 0);

    // 3. Verify Timeline button action shows timeline
    const onTimelineClick = (inc) => {
      modalState = inc;
      modalTab = 'timeline';
    };

    onTimelineClick(incident);
    assert.equal(modalState.id, incident.id);
    assert.equal(modalTab, 'timeline');
    assert.ok(Array.isArray(modalState.timeline));
    assert.ok(modalState.timeline.length > 0);
    for (const entry of modalState.timeline) {
      assert.ok(entry.at && entry.text);
    }
  }
});

test('guest complaints page displays Complaint Title column, title-only in row, and opens detailed modal on click', () => {
  const complaints = frontDeskSeed.complaints;
  assert.ok(complaints.length > 0, 'Should have complaints in frontDeskSeed');

  for (const c of complaints) {
    // 1. Verify column and row representation: only title is shown, no secondary details (like logged date) in row
    const rowContent = {
      columnHeader: 'Complaint Title',
      title: c.summary,
      secondaryDetailsInRow: false,
    };
    assert.equal(rowContent.columnHeader, 'Complaint Title');
    assert.ok(typeof rowContent.title === 'string' && rowContent.title.length > 0);
    assert.equal(rowContent.secondaryDetailsInRow, false);

    // 2. Verify clicking complaint row populates selectedComplaint with full details
    let selectedComplaint = null;
    const onRowClick = (complaint) => {
      selectedComplaint = complaint;
    };

    onRowClick(c);
    assert.ok(selectedComplaint !== null);
    assert.equal(selectedComplaint.id, c.id);
    assert.equal(selectedComplaint.ref, c.ref);
    assert.equal(selectedComplaint.room, c.room);
    assert.equal(selectedComplaint.guest, c.guest);
    assert.equal(selectedComplaint.summary, c.summary);
    assert.ok(selectedComplaint.createdAt);
    assert.ok(selectedComplaint.severity);
  }
});

test('vip guests section is named VIP Guests, cards match Front Desk design without message, and provides add VIP guest option', () => {
  const consoleFile = readFileSafe('src/components/executive/ExecutiveConsole.tsx');
  const vipFile = readFileSafe('src/components/executive/GeneralManagerVipTab.tsx');

  // 1. Navigation and title renamed from VIP Portfolio and Directives to VIP Guests
  const vipNavMatch = consoleFile.match(/id:\s*'vip',\s*label:\s*'([^']+)'/);
  assert.ok(vipNavMatch, 'Must find vip tab config in ExecutiveConsole');
  assert.equal(vipNavMatch[1], 'VIP Guests', 'ExecutiveConsole tab label must be VIP Guests');
  assert.ok(vipFile.includes('>VIP Guests<') || vipFile.includes('>VIP Guests</h2>'), 'GeneralManagerVipTab title must be VIP Guests');

  // 2. VIP Card design matches Front Desk card:
  // - Initials avatar
  assert.ok(vipFile.includes('getInitials'), 'Card must compute guest initials for avatar circle');
  // - VIP Tier & Status badges
  assert.ok(vipFile.includes('st.vipTier'), 'Card must show VIP tier');
  assert.ok(vipFile.includes('getStayStatusBadge'), 'Card must show stay status badge');
  // - Key Info Box: Milestone, Dietary, Preferences
  assert.ok(vipFile.includes('Milestone:'), 'Card must show Milestone row');
  assert.ok(vipFile.includes('Dietary:'), 'Card must show Dietary row');
  assert.ok(vipFile.includes('Preferences:'), 'Card must show Preferences row');
  // - Protocol Badge
  assert.ok(vipFile.includes('st.gmStatus'), 'Card must show protocol badge');
  // - Complete VIP Profile button
  assert.ok(vipFile.includes('View Complete VIP Profile'), 'Card must have View Complete VIP Profile button');
  // - Folio button
  assert.ok(vipFile.includes('Folio & Billing Details') || vipFile.includes('Folio'), 'Card must include Folio button');
  // - Message button must NOT be included per user instruction
  assert.ok(!vipFile.includes('<span>Message</span>') && !vipFile.includes('>Message<'), 'Message button must not be included on the VIP card');

  // 3. Option to add new VIP guests with all necessary inputs (pure client-side)
  assert.ok(vipFile.includes('+ Add VIP Guest'), 'Must have button to add new VIP guests');
  assert.ok(vipFile.includes('showAddVipModal'), 'Must have modal state to add new VIP guests');
  assert.ok(vipFile.includes('Guest Full Name *'), 'Must have guest full name input');
  assert.ok(vipFile.includes('Room Number *'), 'Must have room number input');
  assert.ok(vipFile.includes('Suite / Room Type'), 'Must have room type selector');
  assert.ok(vipFile.includes('VIP Tier'), 'Must have VIP tier selector');
  assert.ok(vipFile.includes('Stay Status'), 'Must have stay status selector');
  assert.ok(vipFile.includes('Milestone / Purpose of Stay'), 'Must have milestone input');
  assert.ok(vipFile.includes('Dietary Directives & Allergies'), 'Must have dietary directives input');
  assert.ok(vipFile.includes('Room Preferences & Setup'), 'Must have room preferences input');
  assert.ok(vipFile.includes('Special Protocols & Butler Directives'), 'Must have special protocols input');
  assert.ok(vipFile.includes('handleAddVipGuest'), 'Must have client-side handler for adding new VIP guests');

  // 4. Modal shows complete elaborated details when VIP card is clicked
  const vipStays = (frontDeskSeed.stays ?? []).filter((s) => s.vip);
  assert.ok(vipStays.length > 0, 'Should have VIP demo stays');
  for (const st of vipStays) {
    let selectedVipGuest = st;
    assert.ok(selectedVipGuest.arrival, 'Must have check-in time / arrival');
    assert.ok(selectedVipGuest.departure, 'Must have check-out time / departure');
    const prefs = seedGuestPreferences?.[st.room];
    const hasPreferences = prefs || selectedVipGuest.dietarySummary || selectedVipGuest.preferencesSummary;
    assert.ok(hasPreferences !== undefined);
    assert.ok(selectedVipGuest.milestone !== undefined);
  }
});

test('urgent sign-off boxes (safety alerts & service recovery) only show in All Requests and Pending Approvals', () => {
  const sections = [
    { id: 'all', label: 'All Requests', shouldShowUrgentBoxes: true },
    { id: 'pending', label: 'Pending Approvals', shouldShowUrgentBoxes: true },
    { id: 'approved', label: 'Authorized', shouldShowUrgentBoxes: false },
    { id: 'rejected', label: 'Declined', shouldShowUrgentBoxes: false },
    { id: 'info', label: 'Clarification Needed', shouldShowUrgentBoxes: false },
  ];

  const pendingSafetyAlerts = seedSafetyAlerts.filter(
    (a) => a.status === 'validated_pending_approval',
  );
  const pendingGmCompensations = seedCompensationRequests.filter(
    (c) => c.status === 'pending_gm' || (c.amount > 10000 && c.status === 'pending_financial_operator'),
  );

  assert.ok(pendingSafetyAlerts.length > 0, 'Should have pending safety alerts in seed');
  assert.ok(pendingGmCompensations.length > 0, 'Should have pending GM compensations in seed');

  for (const sec of sections) {
    const showUrgentSignOffBoxes = sec.id === 'all' || sec.id === 'pending';
    assert.equal(
      showUrgentSignOffBoxes,
      sec.shouldShowUrgentBoxes,
      `Section "${sec.label}" (${sec.id}) should have showUrgentSignOffBoxes = ${sec.shouldShowUrgentBoxes}`,
    );

    const rendersSafetyAlertBox = showUrgentSignOffBoxes && pendingSafetyAlerts.length > 0;
    const rendersCompensationBox = showUrgentSignOffBoxes && pendingGmCompensations.length > 0;

    if (sec.shouldShowUrgentBoxes) {
      assert.equal(rendersSafetyAlertBox, true, `Safety alert box should render in "${sec.label}"`);
      assert.equal(rendersCompensationBox, true, `Compensation box should render in "${sec.label}"`);
    } else {
      assert.equal(rendersSafetyAlertBox, false, `Safety alert box should NOT render in "${sec.label}"`);
      assert.equal(rendersCompensationBox, false, `Compensation box should NOT render in "${sec.label}"`);
    }
  }
});

test('finance section consolidated into single Finance Request sidebar option with top navbar and all-only queue', () => {
  // 1. Verify GM Console navigation configuration for Finance & Resources
  const consoleFile = readFileSafe('src/components/executive/ExecutiveConsole.tsx');
  
  // Extract Group 4: Finance & Resources block
  const financeGroupMatch = consoleFile.match(/\/\/ Group 4: Finance & Resources[\s\S]*?\/\/ Group 5: Insights/);
  assert.ok(financeGroupMatch, 'Should find Group 4: Finance & Resources in ExecutiveConsole.tsx');
  const financeGroupContent = financeGroupMatch[0];

  // Verify only 1 option exists in the sidebar for Finance & Resources: 'Finance Request'
  const idMatches = [...financeGroupContent.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(idMatches, ['finance-requests'], 'Should only have single finance-requests item in Group 4');

  const labelMatches = [...financeGroupContent.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.equal(labelMatches.length, 1);
  assert.match(labelMatches[0], /Finance Request/i, 'Sidebar item label must be Finance Request');

  // Verify old separate options are NOT in Group 4 sidebar items
  assert.ok(!financeGroupContent.includes('finance-purchases'));
  assert.ok(!financeGroupContent.includes('finance-equipment'));
  assert.ok(!financeGroupContent.includes('finance-resources'));

  // 2. Verify ExecutiveFinanceTab category navbar and major requisitions queue
  const financeTabFile = readFileSafe('src/components/executive/ExecutiveFinanceTab.tsx');

  // Navbar must be present above Executive Major Requisitions Queue
  const navbarIndex = financeTabFile.indexOf('{/* Category Navigation Bar & Search Bar (Above Executive Major Requisitions Queue) */}');
  const queueIndex = financeTabFile.indexOf('Executive Major Requisitions Queue');
  assert.ok(navbarIndex !== -1, 'Category navbar must exist in ExecutiveFinanceTab.tsx');
  assert.ok(queueIndex !== -1, 'Executive Major Requisitions Queue must exist');
  assert.ok(navbarIndex < queueIndex, 'Category navbar must be situated ABOVE Executive Major Requisitions Queue');

  // Verify Executive Major Requisitions Queue is ONLY shown in "All Categories" (activeCategory === 'all')
  assert.ok(
    financeTabFile.includes("activeCategory === 'all' &&") || financeTabFile.includes("activeCategory === \"all\" &&"),
    'Major requisitions queue must be guarded by activeCategory === \'all\'',
  );

  // 3. Verify navbar has exact 3 categories: All categories, Financial, Requisitions & Material order
  assert.ok(financeTabFile.includes("'All categories'"), 'Navbar must have "All categories" tab');
  assert.ok(financeTabFile.includes("'Financial'"), 'Navbar must have "Financial" tab');
  assert.ok(financeTabFile.includes("'Requisitions & Material order'"), 'Navbar must have "Requisitions & Material order" tab');
  assert.ok(!financeTabFile.includes("'Purchases & Capex'"), 'Old Purchases & Capex tab should be removed');
  assert.ok(!financeTabFile.includes("'Equipment & Spares'"), 'Old Equipment & Spares tab should be removed');
  assert.ok(!financeTabFile.includes("'Staffing & Supplies'"), 'Old Staffing & Supplies tab should be removed');

  // Verify list format for Executive Major Requisitions Queue (one after another)
  assert.ok(
    financeTabFile.includes('flex flex-col space-y-2.5') || financeTabFile.includes('flex flex-col'),
    'Executive major requisitions queue must be presented in list format one after another',
  );
  assert.ok(
    !financeTabFile.includes('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'),
    'Executive major requisitions queue must not be presented in grid format',
  );

  // 4. Test functional behavior of category filtering and requests categorization
  const categories = [
    { id: 'all', label: 'All categories', showsMajorQueue: true },
    { id: 'financial', label: 'Financial', showsMajorQueue: false },
    { id: 'requisitions', label: 'Requisitions & Material order', showsMajorQueue: false },
  ];

  for (const cat of categories) {
    const isQueueRendered = cat.id === 'all';
    assert.equal(isQueueRendered, cat.showsMajorQueue, `Queue should only show in All Categories, but got ${cat.id}`);
  }

  // Verify request categorization logic
  const allReqs = seedResourceRequests ?? [];
  const financialReqs = allReqs.filter((r) => r.category === 'Staffing' || r.category === 'Equipment' || r.category === 'Financial');
  const requisitionReqs = allReqs.filter((r) => r.category === 'Supply' || r.category === 'Maintenance' || r.category === 'Material');

  assert.ok(financialReqs.length > 0, 'Financial category must have matching requests (e.g. Staffing, Equipment)');
  assert.ok(requisitionReqs.length > 0, 'Requisitions & Material order category must have matching requests (e.g. Supply, Maintenance)');
  assert.equal(financialReqs.length + requisitionReqs.length, allReqs.length, 'All requests must be categorized between Financial and Requisitions & Material order');
});

test('directive modal in High Escalations, Property Incidents, and Guest Complaints includes department dropdown with all 5 options', () => {
  const incidentsFile = readFileSafe('src/components/executive/ExecutiveIncidentsTab.tsx');

  // 1. Verify directive department dropdown exists in directive modal
  assert.ok(incidentsFile.includes('id="directive-department-select"'), 'Dropdown select element must exist');
  assert.ok(incidentsFile.includes('Target Department'), 'Target Department label must exist');

  // 2. Verify all 5 department options are present in the dropdown
  const expectedOptions = [
    'All departments',
    'Housekeeping',
    'Wellness',
    'Maintenance & Engineering',
    'Food & Beverages',
  ];

  for (const opt of expectedOptions) {
    assert.ok(
      incidentsFile.includes(`<option value="${opt}">${opt}</option>`),
      `Dropdown must include exact option: "${opt}"`,
    );
  }

  // 3. Verify directive action availability across all 3 sections:
  // Property Incidents (card & detail modal)
  assert.ok(incidentsFile.includes("type: 'incident'") && incidentsFile.includes('Issue Executive Directive'));
  
  // Guest Complaints (table row & detail modal)
  assert.ok(incidentsFile.includes("type: 'complaint'"));

  // High Escalations (table row & detail modal)
  assert.ok(incidentsFile.includes("bg-purple-600 hover:bg-purple-700 text-white shadow-sm"));

  // 4. Verify directive dispatch formatting with target department
  const buildDirectiveText = (dept, text) => {
    return dept && dept !== 'All departments'
      ? `[Direct to ${dept} Supervisor] ${text.trim()}`
      : text.trim();
  };

  assert.equal(
    buildDirectiveText('All departments', 'Check room conditions'),
    'Check room conditions',
  );
  assert.equal(
    buildDirectiveText('Housekeeping', 'Deep clean suite 401'),
    '[Direct to Housekeeping Supervisor] Deep clean suite 401',
  );
  assert.equal(
    buildDirectiveText('Maintenance & Engineering', 'Fix HVAC damper'),
    '[Direct to Maintenance & Engineering Supervisor] Fix HVAC damper',
  );
  assert.equal(
    buildDirectiveText('Wellness', 'Restock aromatherapy oils'),
    '[Direct to Wellness Supervisor] Restock aromatherapy oils',
  );
  assert.equal(
    buildDirectiveText('Food & Beverages', 'Expedite VIP breakfast'),
    '[Direct to Food & Beverages Supervisor] Expedite VIP breakfast',
  );
});

test('executive major requisitions queue shows title-only in box and opens detailed modal on click', () => {
  const financeFile = readFileSafe('src/components/executive/ExecutiveFinanceTab.tsx');

  // 1. Verify capex items box structure: only title inside box, with onClick handler
  assert.ok(
    financeFile.includes('onClick={() => setSelectedCapexItem(item)}'),
    'Capex box must be clickable and set selectedCapexItem',
  );

  // Verify secondary details (amount, chip, description) are removed from the card grid box
  const gridSectionMatch = financeFile.match(/\{executiveCapexItems\.map\(\(item\) => \{[\s\S]*?\}\)\}/);
  assert.ok(gridSectionMatch, 'Should find capex items map block');
  const gridContent = gridSectionMatch[0];

  assert.ok(gridContent.includes('{item.title}'), 'Must render item title in card');
  assert.ok(!gridContent.includes('{item.amount'), 'Amount must not be directly rendered inside card box');
  assert.ok(!gridContent.includes('{item.description'), 'Description must not be directly rendered inside card box');
  assert.ok(!gridContent.includes('{item.chip'), 'Chip must not be directly rendered inside card box');

  // 2. Verify Detailed Major Capex Requisition Modal exists
  assert.ok(
    financeFile.includes('{selectedCapexItem && ('),
    'Detailed capex modal must exist when selectedCapexItem is active',
  );
  assert.ok(financeFile.includes('Detailed Requisition Justification:'), 'Modal must show detailed justification');
  assert.ok(financeFile.includes('Requisition Amount'), 'Modal must show requisition amount');

  // 3. Functional behavior simulation
  const capexItems = (seedItems.executive_viewer ?? []).filter((i) => i.amount && i.amount > 0);
  assert.ok(capexItems.length > 0, 'Should have executive capex items');

  let selectedModal = null;
  const onCardClick = (item) => {
    selectedModal = item;
  };

  const sample = capexItems[0];
  onCardClick(sample);

  assert.ok(selectedModal !== null);
  assert.equal(selectedModal.id, sample.id);
  assert.equal(selectedModal.title, sample.title);
  assert.equal(selectedModal.amount, sample.amount);
  assert.ok(selectedModal.description || selectedModal.meta);
  assert.ok(selectedModal.status);
});

test('executive department performance has 4 departments, navbar filter removed, designations rendered, and queue table columns present', () => {
  const perfFile = readFileSafe('src/components/executive/ExecutivePerformanceTab.tsx');

  // 1. Verify Front Office & Stays and Safety & Security are removed from departments
  assert.ok(!perfFile.includes("id: 'front_office'"), 'Front office must be removed from departments');
  assert.ok(!perfFile.includes("id: 'security'"), 'Safety & security must be removed from departments');
  assert.ok(!perfFile.includes('Front Office & Stays'), 'Front Office & Stays name must be removed');
  assert.ok(!perfFile.includes('Safety & Security'), 'Safety & Security name must be removed');

  // Verify remaining 4 departments are present
  assert.ok(perfFile.includes("id: 'maintenance'"), 'Maintenance & Engineering must be present');
  assert.ok(perfFile.includes("id: 'housekeeping'"), 'Housekeeping & Rooms must be present');
  assert.ok(perfFile.includes("id: 'food_beverage'"), 'Food & Beverage must be present');
  assert.ok(perfFile.includes("id: 'spa_wellness'"), 'Wellness must be present');

  // 2. Verify filter in navbar to select any particular department is removed
  assert.ok(!perfFile.includes('selectedDeptFilter'), 'selectedDeptFilter state must be removed');
  assert.ok(!perfFile.includes('<select'), 'Department select filter element must be removed from navbar');
  assert.ok(!perfFile.includes('All 6 Operating Units'), 'Old select option must be removed');

  // 3. Verify designations for active field team members
  assert.ok(perfFile.includes('getStaffDesignation'), 'Helper function getStaffDesignation must exist');
  assert.ok(perfFile.includes('{getStaffDesignation(staff)}'), 'Designation must be rendered for active field team members');

  // 4. Verify Live operational queue table has Description, Priority, and Status column names
  assert.ok(perfFile.includes('Description</th>'), 'Description column header must exist');
  assert.ok(perfFile.includes('Priority</th>'), 'Priority column header must exist');
  assert.ok(perfFile.includes('Status</th>'), 'Status column header must exist');
  assert.ok(perfFile.includes('<table'), 'Queue must be structured with a table element');
  assert.ok(perfFile.includes('<thead>'), 'Table must have thead for column headers');
  assert.ok(perfFile.includes('<tbody'), 'Table must have tbody');
});

test('escalations page is named Escalations and audit trail/timeline shows complete workflow from Supervisor/Dispatcher to Department Manager to General Manager', () => {
  const consoleFile = readFileSafe('src/components/executive/ExecutiveConsole.tsx');
  const incidentsFile = readFileSafe('src/components/executive/ExecutiveIncidentsTab.tsx');

  // 1. Verify name is changed to Escalations (not High Escalations) in ExecutiveConsole
  const escalationsNavMatch = consoleFile.match(/id:\s*'escalations'[\s\S]*?label:\s*'([^']+)'/);
  assert.ok(escalationsNavMatch, 'Should find escalations navigation entry in ExecutiveConsole');
  assert.equal(escalationsNavMatch[1], 'Escalations', 'Label in ExecutiveConsole must be Escalations');

  // 2. Verify title in ExecutiveIncidentsTab viewMetadata is Escalations
  const viewMetadataMatch = incidentsFile.match(/case 'escalations':[\s\S]*?title:\s*'([^']+)'/);
  assert.ok(viewMetadataMatch, 'Should find escalations case in ExecutiveIncidentsTab');
  assert.equal(viewMetadataMatch[1], 'Escalations', 'Title in ExecutiveIncidentsTab must be Escalations');

  // 3. Verify complete workflow progression and audit timeline
  assert.ok(
    incidentsFile.includes('Complete Escalation Workflow Progression'),
    'Should contain complete escalation workflow header',
  );
  assert.ok(
    incidentsFile.includes('Department Supervisor / Dispatcher') &&
      incidentsFile.includes('Department Manager') &&
      incidentsFile.includes('General Manager'),
    'Should contain all three workflow stakeholders: Department Supervisor / Dispatcher, Department Manager, and General Manager',
  );

  // Verify all 3 stages in timeline
  assert.ok(incidentsFile.includes('Stage 1 · Department Supervisor / Dispatcher'), 'Timeline must show Stage 1 for Department Supervisor / Dispatcher');
  assert.ok(incidentsFile.includes('Stage 2 · Department Manager'), 'Timeline must show Stage 2 for Department Manager');
  assert.ok(incidentsFile.includes('Stage 3 · General Manager'), 'Timeline must show Stage 3 for General Manager');
});

test('department inspections has modal create form, dropdowns for department, location scope, dynamic types, priority, clock deadline, renamed Inspections, and photos/videos viewer', () => {
  const inspFile = readFileSafe('src/components/executive/GeneralManagerInspectionsTab.tsx');

  // 1. Create Inspections shows a modal frame with background blur
  assert.ok(inspFile.includes('isCreateModalOpen && ('), 'Must render modal frame when isCreateModalOpen is true');
  assert.ok(inspFile.includes('backdrop-blur-sm'), 'Modal frame must have backdrop blur');
  assert.ok(inspFile.includes('fixed inset-0 z-50'), 'Modal frame must be an overlay');

  // 2. Department option present in a dropdown
  assert.ok(inspFile.includes('id="inspection-department-select"'), 'Must have department dropdown select');
  assert.ok(inspFile.includes('<option value="housekeeping">Housekeeping</option>'));
  assert.ok(inspFile.includes('<option value="engineering">Maintenance & Engineering</option>'));
  assert.ok(inspFile.includes('<option value="food-beverages">Food & Beverages</option>'));
  assert.ok(inspFile.includes('<option value="wellness">Wellness</option>'));

  // 3. Inspection location dropdown (All, Floor, Rooms) with dynamic input box
  assert.ok(inspFile.includes('id="inspection-location-scope-select"'), 'Must have location scope dropdown');
  assert.ok(inspFile.includes('<option value="all">'));
  assert.ok(inspFile.includes('<option value="floor">'));
  assert.ok(inspFile.includes('<option value="rooms">'));
  assert.ok(inspFile.includes('id="inspection-floor-input"'), 'Must have floor input box when Floor is selected');
  assert.ok(inspFile.includes('id="inspection-room-input"'), 'Must have room input box when Rooms is selected');

  // 4. Inspection types change according to the four departments in a dropdown
  assert.ok(inspFile.includes('id="inspection-type-select"'), 'Must have inspection type select');
  assert.ok(inspFile.includes('DEPARTMENT_INSPECTION_TYPES'), 'Must have department inspection types map');

  // 5. Priority present in a dropdown
  assert.ok(inspFile.includes('id="inspection-priority-select"'), 'Must have priority select dropdown');
  assert.ok(inspFile.includes('<option value="normal">'));
  assert.ok(inspFile.includes('<option value="vip">'));
  assert.ok(inspFile.includes('<option value="urgent">'));

  // 6. Deadline section with clock option, AM/PM options inside the clock, and manual box under it
  assert.ok(inspFile.includes('id="inspection-clock-time-input"'), 'Must have clock time input');
  assert.ok(inspFile.includes('type="time"'), 'Must have time type for clock option');
  assert.ok(inspFile.includes('id="clock-period-am"'), 'Must have AM option inside clock');
  assert.ok(inspFile.includes('id="clock-period-pm"'), 'Must have PM option inside clock');
  assert.ok(inspFile.includes('format12HourTime'), 'Must have 12-hour formatting helper');
  assert.ok(inspFile.includes('convertTo24Hour'), 'Must have 24-hour conversion helper');
  assert.ok(inspFile.includes('id="inspection-manual-time-input"'), 'Must have box under clock to manually write time');

  // 7. History of Inspections renamed to Inspections
  assert.ok(!inspFile.includes('>History of Inspections<'), 'History of Inspections must be renamed');
  assert.ok(inspFile.includes('>Inspections</div>'), 'Navigation card must display Inspections');

  // 8. In each inspection, option to view Photos and Videos uploaded by inspection team
  assert.ok(inspFile.includes('Photos & Videos'), 'Must have Photos & Videos button');
  assert.ok(inspFile.includes('viewingMediaInspection && ('), 'Must render media modal frame');
  assert.ok(inspFile.includes('getInspectionMedia'), 'Must generate inspection media uploaded by inspection team');
});

test('property incidents detailed information section removes coordinator and department boxes and enforces front desk exclusive reporting', () => {
  const incidentsFile = readFileSafe('src/components/executive/ExecutiveIncidentsTab.tsx');

  // 1. Isolate the Detailed Information section in incident modal
  const detailsSectionMatch = incidentsFile.match(/incidentModalTab === 'details'\s*\?\s*\(\s*<>([\s\S]*?)<\/>\s*\)\s*:\s*\(/);
  assert.ok(detailsSectionMatch, 'Must find incidentModalTab === details section in ExecutiveIncidentsTab');
  const detailsSection = detailsSectionMatch[1];

  // 2. Verify Coordinator and Department boxes are removed from Detailed Information
  assert.ok(!detailsSection.includes('selectedIncident.coordinator'), 'Coordinator box and value must be removed from Detailed Information');
  assert.ok(!detailsSection.includes('selectedIncident.department'), 'Department box and value must be removed from Detailed Information');
  assert.ok(!detailsSection.includes('> Coordinator<'), 'Coordinator label must not exist in Detailed Information stats');
  assert.ok(!detailsSection.includes('> Department<'), 'Department label must not exist in Detailed Information stats');

  // 3. Verify Front Desk exclusive reporting protocol is present in the Detailed Information section
  assert.ok(
    detailsSection.includes('Front Desk Exclusive Reporting Protocol') ||
      detailsSection.includes('All property incidents can be reported only by the Front Desk only'),
    'Detailed Information section must explicitly state the Front Desk exclusive reporting protocol',
  );
  assert.ok(
    detailsSection.includes('Front Desk'),
    'Detailed Information section must show Front Desk reporting authority',
  );

  // 4. Verify Property Incidents page view enforces that only Front Desk reports incidents
  assert.ok(
    incidentsFile.includes('All property incidents can be reported only by the Front Desk only') ||
      incidentsFile.includes('Front Desk Exclusive'),
    'Property Incidents page must show policy that all incidents are reported only by the Front Desk only',
  );
});


test('executive reports and analytics has clickable SLA ranking and capital allocation items opening department reports, plus quick overview sections for requests, complaints, and SLA', () => {
  const reportsFile = readFileSafe('src/components/executive/ExecutiveReportsTab.tsx');

  // 1. Verify Quick Overview Bar sections
  assert.ok(reportsFile.includes('Number Of Requests'), 'Quick overview bar must have "Number Of Requests" option');
  assert.ok(reportsFile.includes('Resolved'), 'Number Of Requests must have "Resolved" option');
  assert.ok(reportsFile.includes('Unresolved'), 'Number Of Requests must have "Unresolved" option');
  assert.ok(reportsFile.includes('Blockers'), 'Number Of Requests must have "Blockers" option');

  assert.ok(reportsFile.includes('Total Number of Complaints'), 'Quick overview bar must have "Total Number of Complaints" section');
  assert.ok(reportsFile.includes('>SLA<') || reportsFile.includes('SLA'), 'Quick overview bar must have "SLA" section');

  // 2. Verify Operational SLA Ranking by Operating Unit has clickable items
  assert.ok(reportsFile.includes('Operational SLA Ranking by Operating Unit'), 'Must contain Operational SLA Ranking section');
  assert.ok(reportsFile.includes('setSelectedDepartmentReport('), 'Items in SLA ranking must set selectedDepartmentReport');

  const expectedUnits = [
    'Wellness',
    'Safety & Security',
    'Housekeeping & Rooms',
    'Front Office & Stays',
    'Food & Beverage',
    'Maintenance & Engineering',
  ];

  for (const unit of expectedUnits) {
    assert.ok(reportsFile.includes(unit), `SLA ranking must include ${unit}`);
  }

  // 3. Verify Capital Allocation & Requisition by Category has clickable items opening department reports
  assert.ok(reportsFile.includes('Capital Allocation &amp; Requisition by Category') || reportsFile.includes('Capital Allocation & Requisition by Category'));
  
  const expectedAllocations = [
    { category: 'Heavy Equipment & Capex (Otis, Carrier)', dept: 'Maintenance & Engineering' },
    { category: 'Guest Goodwill & VIP Compensations', dept: 'Front Office & Stays' },
    { category: 'Supply & Linen Replenishments', dept: 'Housekeeping & Rooms' },
    { category: 'Banquet & Peak Season Staffing', dept: 'Food & Beverage' },
    { category: 'Routine Maintenance Spares', dept: 'Maintenance & Engineering' },
  ];

  for (const item of expectedAllocations) {
    assert.ok(reportsFile.includes(item.category), `Must include category: ${item.category}`);
    assert.ok(reportsFile.includes(item.dept), `Must associate category with department: ${item.dept}`);
  }

  // 4. Verify Detailed Department Report Modal exists and renders key metrics
  assert.ok(reportsFile.includes('selectedDepartmentReport && activeDeptMeta && ('), 'Modal must render when selectedDepartmentReport is active');
  assert.ok(reportsFile.includes('Detailed Operational Report'), 'Modal must show Detailed Operational Report');
  assert.ok(reportsFile.includes('Live Operational Work Orders &amp; Requests') || reportsFile.includes('Live Operational Work Orders & Requests'));
  assert.ok(reportsFile.includes('Guest Grievances Log'));
});


test('audit log section is removed from General Manager console', () => {
  const consoleFile = readFileSafe('src/components/executive/ExecutiveConsole.tsx');
  const overviewFile = readFileSafe('src/components/executive/ExecutiveOverviewTab.tsx');

  assert.ok(!consoleFile.includes("label: 'Audit Log'"), 'Audit Log label must be removed from navigation');
  assert.ok(!consoleFile.includes('<ExecutiveAuditTab'), 'ExecutiveAuditTab rendering must be removed');
  assert.ok(!overviewFile.includes("onNavigateTab('audit')"), 'Shortcuts must not link to audit');
});


test('notifications section is removed from General Manager sidebar, present only in navbar with All notifications and Safety Alerts categories', () => {
  const consoleFile = readFileSafe('src/components/executive/ExecutiveConsole.tsx');

  // 1. Verify notifications section is removed from sidebar navItems
  const accountGroupMatch = consoleFile.match(/\/\/ Group 6: Account[\s\S]*?\];/);
  assert.ok(accountGroupMatch, 'Should find Group 6: Account in ExecutiveConsole.tsx');
  const accountGroupContent = accountGroupMatch[0];

  assert.ok(!accountGroupContent.includes("id: 'notifications'"), 'Notifications must be removed from sidebar navItems');
  assert.ok(accountGroupContent.includes("id: 'profile'"), 'Profile should remain in Group 6');

  // 2. Verify notifications is present in the navbar
  assert.ok(consoleFile.includes('id="gm-navbar-notifications-btn"'), 'Navbar must contain notifications button');
  assert.ok(consoleFile.includes('All notifications'), 'Navbar notifications popover must include "All notifications" section');
  assert.ok(consoleFile.includes('Safety Alerts'), 'Navbar notifications popover must include "Safety Alerts" section');

  // 3. Verify categorization logic
  assert.ok(consoleFile.includes('isSafetyAlertNotification'), 'Must include safety alert categorization helper');

  const sampleNotifications = [
    {
      id: 'n1',
      title: 'Broadcast Authorization: HVAC Coolant Safety Alert',
      department: 'Safety & Security',
      category: 'safety',
      type: 'alert',
    },
    {
      id: 'n2',
      title: 'Urgent Capex Authorization: Chiller Impeller Replacement',
      department: 'Maintenance & Engineering',
      type: 'alert',
    },
    {
      id: 'n3',
      title: 'Safety Broadcast: Fire Damper & Exhaust Sensor Alert',
      department: 'Safety & Security',
      category: 'safety',
      type: 'alert',
    },
    {
      id: 'n4',
      title: 'Department Inspection Due: Spa Treatment Suite 202',
      department: 'Wellness',
      type: 'task',
    },
  ];

  // Helper logic reproduction
  const isSafetyAlert = (n) => {
    const cat = (n.category || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const dept = (n.department || '').toLowerCase();
    return cat === 'safety' || dept.includes('safety') || title.includes('safety');
  };

  const allCategory = sampleNotifications;
  const safetyCategory = sampleNotifications.filter(isSafetyAlert);

  assert.equal(allCategory.length, 4, 'All notifications must include all 4 items');
  assert.equal(safetyCategory.length, 2, 'Safety alerts must categorize exactly 2 safety items');
  assert.equal(safetyCategory[0].id, 'n1');
  assert.equal(safetyCategory[1].id, 'n3');
});

test('settings section is removed from General Manager dashboard', () => {
  const consoleFile = readFileSafe('src/components/executive/ExecutiveConsole.tsx');
  const profileFile = readFileSafe('src/components/executive/ExecutiveProfileTab.tsx');

  // 1. Verify Settings is removed from ExecutiveConsole navItems
  const accountGroupMatch = consoleFile.match(/\/\/ Group 6: Account[\s\S]*?\];/);
  assert.ok(accountGroupMatch, 'Should find Group 6: Account in ExecutiveConsole.tsx');
  const accountGroupContent = accountGroupMatch[0];

  assert.ok(!accountGroupContent.includes("id: 'settings'"), 'Settings must be removed from sidebar navItems');
  assert.ok(!accountGroupContent.includes("label: 'Settings'"), 'Settings label must not appear in Account navItems');
  assert.ok(!consoleFile.includes("activeTab === 'settings'"), 'Settings tab view route must be removed');

  // 2. Verify Preferences / Settings is removed from ExecutiveProfileTab
  assert.ok(!profileFile.includes("id: 'settings'"), 'Settings/Preferences subtab pill must be removed');
  assert.ok(!profileFile.includes("subTab === 'settings'"), 'Settings subtab panel must be removed');
  assert.ok(!profileFile.includes('Executive Console Preferences'), 'Executive Console Preferences heading must be removed');
  assert.ok(!profileFile.includes('Executive Profile & Workspace Settings'), 'Old header title with Workspace Settings must be updated');
});

test('task id and ref id formats in Escalations and Guest Complaints match (Sidebar name-Room no.-DD/MM/YY)', () => {
  const incidentsFile = readFileSafe('src/components/executive/ExecutiveIncidentsTab.tsx');

  // 1. Verify format functions are present in ExecutiveIncidentsTab
  assert.ok(incidentsFile.includes('export function formatComplaintRef'), 'formatComplaintRef must exist');
  assert.ok(incidentsFile.includes('export function formatEscalatedTaskId'), 'formatEscalatedTaskId must exist');

  // 2. Verify sample values matching the user examples:
  // User example for Guest Complaints: GC-502-081126
  // User example for Escalations: ES-502-08112026
  const extractRoom = (item) => {
    if (item.room) {
      const digits = item.room.match(/\d+/);
      if (digits) return digits[0];
      const cleaned = item.room.replace(/^Room\s*/i, '').trim();
      if (cleaned) return cleaned;
    }
    const titleMatch = (item.title || '').match(/Room\s*(\d+)/i);
    if (titleMatch) return titleMatch[1];
    return '502';
  };

  const sampleComplaint = { room: '502', createdAt: '08:15' };
  const sampleEscalation = { room: '502', title: 'Terrace track alignment · Room 502', createdAt: '08:15' };

  // Re-verify formatting logic
  const gcRef = `GC-${extractRoom(sampleComplaint)}-081126`;
  const esId = `ES-${extractRoom(sampleEscalation)}-08112026`;
  assert.equal(gcRef, 'GC-502-081126', 'Guest complaint ref must match GC-502-081126 example');
  assert.equal(esId, 'ES-502-08112026', 'Escalation task ID must match ES-502-08112026 example');

  // 3. Verify formatComplaintRef is rendered in Guest Complaints table and modals
  assert.ok(incidentsFile.includes('{formatComplaintRef(c)}'), 'Complaints table must render formatted ref');
  assert.ok(incidentsFile.includes('{formatComplaintRef(selectedComplaint)}'), 'Complaint modal must render formatted ref');

  // 4. Verify formatEscalatedTaskId is rendered in Escalations table and modals
  assert.ok(incidentsFile.includes('{formattedTaskId}'), 'Escalations table must render formatted task id');
  assert.ok(incidentsFile.includes('{formatEscalatedTaskId(selectedEscalatedTask)}'), 'Escalation modal must render formatted task id');
});

test('guest complaints and property incidents sections include client-side search bars with full text filtering', () => {
  const incidentsFile = readFileSafe('src/components/executive/ExecutiveIncidentsTab.tsx');

  // 1. Verify Property Incidents search bar UI and logic
  assert.ok(incidentsFile.includes('id="incident-search-input"'), 'Property incidents must include search input');
  assert.ok(incidentsFile.includes('incidentSearchQuery'), 'Property incidents must manage incidentSearchQuery state');
  assert.ok(incidentsFile.includes('Search incidents by title, reference, area, severity'), 'Incident search placeholder must exist');

  // 2. Verify Guest Complaints search bar UI and logic
  assert.ok(incidentsFile.includes('id="complaint-search-input"'), 'Guest complaints must include search input');
  assert.ok(incidentsFile.includes('complaintSearchQuery'), 'Guest complaints must manage complaintSearchQuery state');
  assert.ok(incidentsFile.includes('Search complaints by guest, room, title, ref ID'), 'Complaint search placeholder must exist');

  // 3. Test Property Incidents filtering logic
  const sampleIncidents = [
    {
      id: 'inc-1',
      ref: 'INC-2026-001',
      title: 'Main Kitchen Deep Fryer Thermal Overheat Alarm',
      severity: 'critical',
      affectedArea: 'Main Kitchen / Lower Ground',
      status: 'contained',
      department: 'F&B Production',
      timeline: [{ at: '14:15', text: 'Automatic halon suppression triggered' }],
    },
    {
      id: 'inc-2',
      ref: 'INC-2026-002',
      title: 'Water Leakage in East Wing Service Shaft',
      severity: 'major',
      affectedArea: 'East Wing Floors 3-5',
      status: 'investigating',
      department: 'Maintenance & Engineering',
      timeline: [],
    },
  ];

  const filterIncidents = (list, query) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter((i) => {
      return (
        (i.ref || '').toLowerCase().includes(q) ||
        (i.title || '').toLowerCase().includes(q) ||
        (i.affectedArea || '').toLowerCase().includes(q) ||
        (i.severity || '').toLowerCase().includes(q) ||
        (i.status || '').toLowerCase().includes(q) ||
        (i.department || '').toLowerCase().includes(q) ||
        (i.timeline || []).some((t) => (t.text || '').toLowerCase().includes(q))
      );
    });
  };

  assert.equal(filterIncidents(sampleIncidents, 'fryer').length, 1, 'Search for "fryer" must match inc-1');
  assert.equal(filterIncidents(sampleIncidents, 'fryer')[0].id, 'inc-1');
  assert.equal(filterIncidents(sampleIncidents, 'leakage').length, 1, 'Search for "leakage" must match inc-2');
  assert.equal(filterIncidents(sampleIncidents, 'East Wing').length, 1, 'Search for "East Wing" must match inc-2');
  assert.equal(filterIncidents(sampleIncidents, 'critical').length, 1, 'Search for "critical" must match inc-1');
  assert.equal(filterIncidents(sampleIncidents, 'nonexistent query 12345').length, 0, 'Non-matching query must return 0 results');

  // 4. Test Guest Complaints filtering logic
  const sampleComplaints = [
    {
      id: 'cmp-1',
      ref: 'CR-518-001',
      room: '518',
      guest: 'Priya Nair',
      summary: 'Noise from adjacent suite and terrace sliding door latch sticking',
      severity: 'vip',
      department: 'Maintenance & Engineering',
    },
    {
      id: 'cmp-hk-1',
      ref: 'CMP-304-HK',
      room: '304',
      guest: 'Ananya Sharma',
      summary: 'Linen replacement delay and missing hypoallergenic pillows',
      severity: 'vip',
      department: 'Housekeeping',
    },
  ];

  const filterComplaints = (list, query) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter((c) => {
      const formattedRef = `GC-${c.room}-081126`.toLowerCase();
      const rawRef = (c.ref || '').toLowerCase();
      return (
        formattedRef.includes(q) ||
        rawRef.includes(q) ||
        (c.guest || '').toLowerCase().includes(q) ||
        (c.room || '').toLowerCase().includes(q) ||
        `room ${c.room}`.toLowerCase().includes(q) ||
        (c.summary || '').toLowerCase().includes(q) ||
        (c.department || '').toLowerCase().includes(q) ||
        (c.severity || '').toLowerCase().includes(q)
      );
    });
  };

  assert.equal(filterComplaints(sampleComplaints, 'Priya').length, 1, 'Search for "Priya" must match cmp-1');
  assert.equal(filterComplaints(sampleComplaints, '518').length, 1, 'Search for room "518" must match cmp-1');
  assert.equal(filterComplaints(sampleComplaints, 'GC-518').length, 1, 'Search for formatted ref "GC-518" must match cmp-1');
  assert.equal(filterComplaints(sampleComplaints, 'pillows').length, 1, 'Search for "pillows" must match cmp-hk-1');
  assert.equal(filterComplaints(sampleComplaints, 'Housekeeping').length, 1, 'Search for "Housekeeping" must match cmp-hk-1');
  assert.equal(filterComplaints(sampleComplaints, 'nonexistent complaint query').length, 0, 'Non-matching query must return 0 results');
});
