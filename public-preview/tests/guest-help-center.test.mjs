import test from 'node:test';
import assert from 'node:assert/strict';
import { HelpCenterService } from '../src/server/modules/guest/help/HelpCenterService.ts';
import {
  HELP_TOPICS,
  FLOW_NODES,
} from '../src/server/modules/guest/help/HelpCenterData.ts';

test.beforeEach(() => {
  HelpCenterService.clearTestData();
});

test('GUEST-HELP-01: 1. Service provides all 8 verified primary support topics', () => {
  const service = new HelpCenterService();
  const topics = service.getTopics();

  assert.equal(topics.length, 8);
  const topicIds = topics.map((t) => t.id);
  assert.deepEqual(topicIds, [
    'maintenance',
    'housekeeping',
    'dining',
    'wellness',
    'stay_info',
    'billing_checkout',
    'portal_help',
    'front_desk',
  ]);

  for (const topic of topics) {
    assert.ok(topic.title, `Topic ${topic.id} missing title`);
    assert.ok(topic.description, `Topic ${topic.id} missing description`);
    assert.ok(topic.icon, `Topic ${topic.id} missing icon`);
    assert.ok(topic.rootNodeId, `Topic ${topic.id} missing rootNodeId`);
    assert.ok(FLOW_NODES[topic.rootNodeId], `Topic rootNodeId ${topic.rootNodeId} must exist in FLOW_NODES`);
  }
});

test('GUEST-HELP-01: 2. Flow nodes have valid hierarchical navigation and verified portal actions', () => {
  const service = new HelpCenterService();

  // Root node check
  const root = service.getFlowNode('node_root');
  assert.equal(root.id, 'node_root');
  assert.equal(root.canGoBack, false);
  assert.equal(root.choices?.length, 8);

  // Maintenance flow
  const maintNode = service.getFlowNode('node_maint_root');
  assert.equal(maintNode.canGoBack, true);
  assert.equal(maintNode.parentNodeId, 'node_root');
  assert.ok(maintNode.choices && maintNode.choices.length >= 4);

  // AC Leaf node
  const acNode = service.getFlowNode('node_maint_ac');
  assert.ok(acNode.action);
  assert.equal(acNode.action.targetTab, 'services');
  assert.equal(acNode.action.targetSubtab, 'maintenance');
  assert.equal(acNode.action.prefillCategory, 'Air Conditioning');

  // Housekeeping Towels Leaf node
  const towelsNode = service.getFlowNode('node_hk_towels');
  assert.ok(towelsNode.action);
  assert.equal(towelsNode.action.targetTab, 'services');
  assert.equal(towelsNode.action.targetSubtab, 'housekeeping');

  // Dining Menu Leaf node
  const diningNode = service.getFlowNode('node_dining_menu');
  assert.ok(diningNode.action);
  assert.equal(diningNode.action.targetTab, 'services');
  assert.equal(diningNode.action.targetSubtab, 'dining');

  // Spa Leaf node
  const spaNode = service.getFlowNode('node_spa_treatments');
  assert.ok(spaNode.action);
  assert.equal(spaNode.action.targetTab, 'services');
  assert.equal(spaNode.action.targetSubtab, 'spa');

  // DND Leaf node
  const dndNode = service.getFlowNode('node_stay_dnd');
  assert.ok(dndNode.action);
  assert.equal(dndNode.action.targetTab, 'services');
  assert.equal(dndNode.action.targetSubtab, 'dnd');

  // Folio Leaf node
  const folioNode = service.getFlowNode('node_folio_charges');
  assert.ok(folioNode.action);
  assert.equal(folioNode.action.targetTab, 'profile');
  assert.equal(folioNode.action.targetSubtab, 'folio');

  // Portal Activity Leaf node
  const activityNode = service.getFlowNode('node_portal_activity');
  assert.ok(activityNode.action);
  assert.equal(activityNode.action.targetTab, 'activity');

  // Portal Interactive Tour Leaf node
  const tourNode = service.getFlowNode('node_portal_tour');
  assert.ok(tourNode.action);
  assert.equal(tourNode.action.targetTab, 'home');
  assert.equal(tourNode.action.actionType, 'tour');

  // Front Desk Leaf node
  const fdNode = service.getFlowNode('node_fd_message');
  assert.ok(fdNode.action);
  assert.equal(fdNode.action.targetTab, 'services');
  assert.equal(fdNode.action.targetSubtab, 'front_desk');
});

test('GUEST-HELP-01: 3. Unknown flow node gracefully falls back to node_root', () => {
  const service = new HelpCenterService();
  const node = service.getFlowNode('non_existent_node_999');
  assert.equal(node.id, 'node_root');
});

test('GUEST-HELP-01: 4. Free-text resolution matches maintenance keywords accurately', () => {
  const service = new HelpCenterService();

  const acQuery = service.resolveQuestion('my AC is not working and room is too warm');
  assert.equal(acQuery.isResolved, true);
  assert.equal(acQuery.matchedTopic, 'maintenance');
  assert.equal(acQuery.node.id, 'node_maint_ac');
  assert.equal(acQuery.suggestedAction?.targetTab, 'services');
  assert.equal(acQuery.suggestedAction?.targetSubtab, 'maintenance');

  const plumbingQuery = service.resolveQuestion('bathroom toilet is leaking water');
  assert.equal(plumbingQuery.isResolved, true);
  assert.equal(plumbingQuery.matchedTopic, 'maintenance');
  assert.equal(plumbingQuery.node.id, 'node_maint_plumb');
});

test('GUEST-HELP-01: 5. Free-text resolution matches housekeeping and amenities', () => {
  const service = new HelpCenterService();

  const towelQuery = service.resolveQuestion('can I get fresh towels and extra pillows?');
  assert.equal(towelQuery.isResolved, true);
  assert.equal(towelQuery.matchedTopic, 'housekeeping');
  assert.equal(towelQuery.node.id, 'node_hk_towels');

  const cleanQuery = service.resolveQuestion('please clean my room');
  assert.equal(cleanQuery.isResolved, true);
  assert.equal(cleanQuery.matchedTopic, 'housekeeping');
  assert.equal(cleanQuery.node.id, 'node_hk_cleaning');

  const toiletriesQuery = service.resolveQuestion('need dental kit and soap');
  assert.equal(toiletriesQuery.isResolved, true);
  assert.equal(toiletriesQuery.matchedTopic, 'housekeeping');
  assert.equal(toiletriesQuery.node.id, 'node_hk_toiletries');
});

test('GUEST-HELP-01: 6. Free-text resolution matches dining, stay info, and billing', () => {
  const service = new HelpCenterService();

  const diningQuery = service.resolveQuestion('i want to order food to room');
  assert.equal(diningQuery.isResolved, true);
  assert.equal(diningQuery.matchedTopic, 'dining');
  assert.equal(diningQuery.suggestedAction?.targetSubtab, 'dining');

  const wifiQuery = service.resolveQuestion('what is the wifi password');
  assert.equal(wifiQuery.isResolved, true);
  assert.equal(wifiQuery.matchedTopic, 'stay_info');
  assert.equal(wifiQuery.node.id, 'node_stay_wifi');

  const dndQuery = service.resolveQuestion('how do I turn on do not disturb');
  assert.equal(dndQuery.isResolved, true);
  assert.equal(dndQuery.matchedTopic, 'stay_info');
  assert.equal(dndQuery.suggestedAction?.targetSubtab, 'dnd');

  const billQuery = service.resolveQuestion('show my folio bill charges');
  assert.equal(billQuery.isResolved, true);
  assert.equal(billQuery.matchedTopic, 'billing_checkout');
  assert.equal(billQuery.suggestedAction?.targetSubtab, 'folio');

  const deskQuery = service.resolveQuestion('can i speak to front desk agent');
  assert.equal(deskQuery.isResolved, true);
  assert.equal(deskQuery.matchedTopic, 'front_desk');
  assert.equal(deskQuery.suggestedAction?.targetSubtab, 'front_desk');
});

test('GUEST-HELP-01: 7. Unmatched random question returns polite fallback with Front Desk option', () => {
  const service = new HelpCenterService();
  const fallback = service.resolveQuestion('where can I find Martian spacecraft docking?');

  assert.equal(fallback.isResolved, false);
  assert.equal(fallback.confidence, 'low');
  assert.equal(fallback.node.id, 'node_fallback');
  assert.ok(fallback.node.message.includes('Martian spacecraft docking'));
  assert.equal(fallback.suggestedAction?.targetTab, 'services');
  assert.equal(fallback.suggestedAction?.targetSubtab, 'front_desk');
  assert.ok(fallback.node.choices && fallback.node.choices.length > 0);
});

test('GUEST-HELP-01: 8. Feedback submission stores ratings and comments accurately', () => {
  const service = new HelpCenterService();

  const res1 = service.submitFeedback({
    flowId: 'node_maint_ac',
    helpful: true,
  });
  assert.equal(res1.success, true);
  assert.ok(res1.id.startsWith('fb_'));

  const res2 = service.submitFeedback({
    flowId: 'node_fallback',
    query: 'lost my jacket',
    helpful: false,
    comment: 'Need quicker connection to human',
  });
  assert.equal(res2.success, true);

  const records = service.getFeedbackRecords();
  assert.equal(records.length, 2);
  assert.equal(records[0].flowId, 'node_maint_ac');
  assert.equal(records[0].helpful, true);
  assert.equal(records[1].helpful, false);
  assert.equal(records[1].comment, 'Need quicker connection to human');
});
