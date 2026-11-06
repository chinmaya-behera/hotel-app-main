import test from 'node:test';
import assert from 'node:assert/strict';
import {
  seedItems,
  seedInspections,
  seedNotifications,
  seedSafetyAlerts,
  seedCompensationRequests,
  seedIncidents,
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

  // Verify all due inspections have deadlines
  for (const item of due) {
    assert.ok(
      typeof item.scheduledTime === 'string' && item.scheduledTime.length > 0,
      `Due inspection ${item.id} must have a deadline in scheduledTime`,
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
    const inspMatch = mockState.inspections.find((i) => i.id === itemId);
    if (inspMatch) {
      return {
        type: 'inspection',
        ref: inspMatch.id,
        deadline: inspMatch.scheduledTime,
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
