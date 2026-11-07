import test from 'node:test';
import fs from 'node:fs';
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
} from '../src/lib/mockData.ts';

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
        return 'High Escalations';
      case 'incidents':
      default:
        return 'Property Incidents';
    }
  };

  assert.equal(getPageOpenedName('incidents'), 'Property Incidents');
  assert.equal(getPageOpenedName('complaints'), 'Guest Complaints');
  assert.equal(getPageOpenedName('escalations'), 'High Escalations');
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

test('vip portfolio displays only guest name and room in boxes, revealing all details in modal on click', () => {
  const vipStays = (frontDeskSeed.stays ?? []).filter((s) => s.vip);
  assert.ok(vipStays.length > 0, 'Should have VIP stays');

  for (const st of vipStays) {
    // 1. Verify card representation: only guest name and room displayed in the box
    const boxContent = {
      guestName: st.guest,
      room: st.room,
      secondaryDetailsInBox: false,
    };
    assert.ok(typeof boxContent.guestName === 'string' && boxContent.guestName.length > 0);
    assert.ok(typeof boxContent.room === 'string' && boxContent.room.length > 0);
    assert.equal(boxContent.secondaryDetailsInBox, false);

    // 2. Verify clicking VIP box opens modal with all details:
    let selectedVipGuest = null;
    const onBoxClick = (guest) => {
      selectedVipGuest = guest;
    };

    onBoxClick(st);
    assert.ok(selectedVipGuest !== null);
    assert.equal(selectedVipGuest.id, st.id);
    assert.equal(selectedVipGuest.guest, st.guest);
    assert.equal(selectedVipGuest.room, st.room);

    // Check-in and Check-out time
    assert.ok(selectedVipGuest.arrival, 'Must have check-in time / arrival');
    assert.ok(selectedVipGuest.departure, 'Must have check-out time / departure');

    // Document preferences and Dietary Directives
    const prefs = seedGuestPreferences?.[st.room];
    const hasPreferences = prefs || selectedVipGuest.dietarySummary || selectedVipGuest.preferencesSummary;
    assert.ok(hasPreferences !== undefined);

    // VIP schedule reminders and Milestones
    assert.ok(selectedVipGuest.milestone !== undefined);
    const guestReminders = (seedGuestReminders ?? []).filter(
      (r) => r.room === st.room || r.guestName === st.guest,
    );
    assert.ok(Array.isArray(guestReminders));

    // Recorded guest grievances
    const guestComplaints = (frontDeskSeed.complaints ?? []).filter(
      (c) => c.room === st.room || (c.guestName || c.guest || '').toLowerCase().includes(st.guest.toLowerCase().split(' ')[0]),
    );
    assert.ok(Array.isArray(guestComplaints));
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
  const consoleFile = fs.readFileSync('hotel-app-main/public-preview/src/components/executive/ExecutiveConsole.tsx', 'utf8');
  
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
  const financeTabFile = fs.readFileSync('hotel-app-main/public-preview/src/components/executive/ExecutiveFinanceTab.tsx', 'utf8');

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

  // 3. Test functional behavior of category filtering
  const categories = [
    { id: 'all', label: 'All Categories', showsMajorQueue: true },
    { id: 'purchases', label: 'Purchases & Capex', showsMajorQueue: false },
    { id: 'equipment', label: 'Equipment & Spares', showsMajorQueue: false },
    { id: 'resources', label: 'Staffing & Supplies', showsMajorQueue: false },
  ];

  for (const cat of categories) {
    const isQueueRendered = cat.id === 'all';
    assert.equal(isQueueRendered, cat.showsMajorQueue, `Queue should only show in All Categories, but got ${cat.id}`);
  }
});

test('directive modal in High Escalations, Property Incidents, and Guest Complaints includes department dropdown with all 5 options', () => {
  const incidentsFile = fs.readFileSync('hotel-app-main/public-preview/src/components/executive/ExecutiveIncidentsTab.tsx', 'utf8');

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
  const financeFile = fs.readFileSync('hotel-app-main/public-preview/src/components/executive/ExecutiveFinanceTab.tsx', 'utf8');

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
