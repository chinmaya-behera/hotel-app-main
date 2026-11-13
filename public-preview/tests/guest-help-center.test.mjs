import test from 'node:test';
import assert from 'node:assert/strict';
import { HelpCenterService } from '../src/server/modules/guest/help/HelpCenterService.ts';
import {
  HELP_TOPICS,
  FLOW_NODES,
} from '../src/server/modules/guest/help/HelpCenterData.ts';
import {
  BotMessageService,
  DEFAULT_BOT_MESSAGES,
} from '../src/server/modules/guest/help/BotMessageConfig.ts';
import {
  HotelKnowledgeBase,
  HOTEL_KNOWLEDGE_ENTRIES,
  isRouteAllowed,
} from '../src/server/modules/guest/help/HotelKnowledgeBase.ts';
import {
  LocalGroundedEngine,
  levenshteinDistance,
  AssistantEngineProvider,
} from '../src/server/modules/guest/help/QuestionUnderstandingEngine.ts';

test.beforeEach(() => {
  HelpCenterService.clearTestData();
});

// =========================================================================
// REGRESSION SUITE: GUEST-HELP-01 COMPATIBILITY
// =========================================================================

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

// =========================================================================
// GUEST-HELP-02: SMART HOTEL SUPPORT CHAT & CUSTOMIZABLE KNOWLEDGE BASE
// =========================================================================

test('GUEST-HELP-02: 9. Customizable bot messages load from centralized configuration', () => {
  const config = BotMessageService.getConfig();
  assert.ok(config.welcomeMessageTemplate.includes('Room {room}'));
  assert.ok(config.fallbackMessage);
  assert.ok(config.outOfScopeMessage.includes('The Grand ADP'));
  assert.ok(config.actionButtonLabels.maintenance);
  assert.ok(config.actionButtonLabels.dining);
  assert.ok(config.errorMessages.emptyQuestion);
});

test('GUEST-HELP-02: 10. Dynamic customization and reset of bot messages', () => {
  const customWelcome = 'Welcome to Grand Azure Luxury Concierge!';
  BotMessageService.updateConfig({ genericWelcomeMessage: customWelcome });

  assert.equal(BotMessageService.getConfig().genericWelcomeMessage, customWelcome);

  BotMessageService.resetToDefaults();
  assert.equal(BotMessageService.getConfig().genericWelcomeMessage, DEFAULT_BOT_MESSAGES.genericWelcomeMessage);
});

test('GUEST-HELP-02: 11. Knowledge base covers all 14 mandatory categories strictly grounded in project data', () => {
  const allEntries = HotelKnowledgeBase.getAllEntries();
  assert.ok(allEntries.length >= 14);

  const categories = new Set(allEntries.map((e) => e.category));
  const expectedCategories = [
    'hotel_overview',
    'facilities',
    'dining',
    'food_ordering',
    'wellness',
    'housekeeping',
    'maintenance',
    'stay_info',
    'checkin_checkout',
    'policies',
    'billing',
    'portal_guide',
    'front_desk',
    'other_services',
  ];

  for (const exp of expectedCategories) {
    assert.ok(categories.has(exp), `Category ${exp} missing from knowledge base`);
  }

  for (const entry of allEntries) {
    assert.ok(entry.id, 'Entry missing id');
    assert.ok(entry.title, 'Entry missing title');
    assert.ok(entry.question, 'Entry missing question');
    assert.ok(entry.answer, 'Entry missing answer');
    assert.ok(entry.keywords.length > 0, `Entry ${entry.id} missing keywords`);
    assert.ok(entry.aliases.length > 0, `Entry ${entry.id} missing aliases`);
    assert.ok(entry.source, `Entry ${entry.id} missing source`);
    assert.equal(entry.isActive, true);

    if (entry.suggestedAction) {
      assert.ok(isRouteAllowed(entry.suggestedAction.targetTab, entry.suggestedAction.targetSubtab),
        `Entry ${entry.id} action ${entry.suggestedAction.targetTab} not in allowlist`);
    }
  }
});

test('GUEST-HELP-02: 12. Free-text questions resolve accurately across all 14 categories', () => {
  const service = new HelpCenterService();

  // 1. Hotel Overview & Address
  const address = service.resolveQuestion('Where is the hotel located?');
  assert.equal(address.isResolved, true);
  assert.equal(address.category, 'hotel_overview');
  assert.ok(address.node.message.includes('100 Ocean Promenade'));

  // 2. Available Facilities & Amenities (Pool / Gym)
  const pool = service.resolveQuestion('Where is the swimming pool located?');
  assert.equal(pool.isResolved, true);
  assert.equal(pool.category, 'facilities');
  assert.ok(pool.node.message.includes('Infinity Pool'));

  // 3. Restaurant & Dining
  const rest = service.resolveQuestion('What restaurants are available in the hotel?');
  assert.equal(rest.isResolved, true);
  assert.equal(rest.category, 'dining');
  assert.ok(rest.node.message.includes('Skyline Lounge'));

  // 4. Food Ordering & Menu
  const order = service.resolveQuestion('Where can I order food to my room?');
  assert.equal(order.isResolved, true);
  assert.equal(order.category, 'food_ordering');
  assert.equal(order.suggestedAction?.targetTab, 'services');
  assert.equal(order.suggestedAction?.targetSubtab, 'dining');

  // Dietary
  const vegan = service.resolveQuestion('Do you have vegan or gluten free food?');
  assert.equal(vegan.isResolved, true);
  assert.equal(vegan.category, 'food_ordering');

  // 5. Wellness Services
  const spa = service.resolveQuestion('What spa treatments are offered?');
  assert.equal(spa.isResolved, true);
  assert.equal(spa.category, 'wellness');
  assert.equal(spa.suggestedAction?.targetSubtab, 'spa');

  // 6. Housekeeping
  const towels = service.resolveQuestion('How do I request fresh towels?');
  assert.equal(towels.isResolved, true);
  assert.equal(towels.category, 'housekeeping');
  assert.equal(towels.suggestedAction?.targetSubtab, 'housekeeping');

  // 7. Maintenance
  const ac = service.resolveQuestion('How can I report an AC problem?');
  assert.equal(ac.isResolved, true);
  assert.equal(ac.category, 'maintenance');
  assert.equal(ac.suggestedAction?.targetSubtab, 'maintenance');

  // 8. Room & Stay Info (DND)
  const dnd = service.resolveQuestion('How can I turn on DND?');
  assert.equal(dnd.isResolved, true);
  assert.equal(dnd.category, 'stay_info');
  assert.equal(dnd.suggestedAction?.targetSubtab, 'dnd');

  // 9. Check-in & Checkout
  const checkout = service.resolveQuestion('What time is checkout?');
  assert.equal(checkout.isResolved, true);
  assert.equal(checkout.category, 'checkin_checkout');
  assert.ok(checkout.node.message.includes('11:00 AM'));

  // Express checkout
  const express = service.resolveQuestion('How to do express checkout online?');
  assert.equal(express.isResolved, true);
  assert.equal(express.category, 'checkin_checkout');

  // 10. Hotel Policies (Smoking & Pets)
  const smoking = service.resolveQuestion('Can I smoke on the room balcony?');
  assert.equal(smoking.isResolved, true);
  assert.equal(smoking.category, 'policies');
  assert.ok(smoking.node.message.includes('100% smoke-free'));

  const pets = service.resolveQuestion('Are pets allowed in the hotel?');
  assert.equal(pets.isResolved, true);
  assert.equal(pets.category, 'policies');
  assert.ok(pets.node.message.includes('service animals'));

  // 11. Billing
  const billing = service.resolveQuestion('Where can I see my current room bill charges?');
  assert.equal(billing.isResolved, true);
  assert.equal(billing.category, 'billing');
  assert.equal(billing.suggestedAction?.targetSubtab, 'folio');

  // 12. Guest Portal Guide
  const activity = service.resolveQuestion('Where can I see my current requests?');
  assert.equal(activity.isResolved, true);
  assert.equal(activity.category, 'portal_guide');
  assert.equal(activity.suggestedAction?.targetTab, 'activity');

  const tour = service.resolveQuestion('How does this guest app work?');
  assert.equal(tour.isResolved, true);
  assert.equal(tour.category, 'portal_guide');
  assert.equal(tour.suggestedAction?.actionType, 'tour');

  // 13. Front Desk
  const fd = service.resolveQuestion('I want to contact reception');
  assert.equal(fd.isResolved, true);
  assert.equal(fd.category, 'front_desk');
  assert.equal(fd.suggestedAction?.targetSubtab, 'front_desk');

  // 14. Other Services (Luggage, Wakeup, Lost & Found)
  const luggage = service.resolveQuestion('Can I store luggage after checkout?');
  assert.equal(luggage.isResolved, true);
  assert.equal(luggage.category, 'other_services');
  assert.ok(luggage.node.message.includes('Bellhop'));

  const wakeup = service.resolveQuestion('Can I schedule a wake-up call?');
  assert.equal(wakeup.isResolved, true);
  assert.equal(wakeup.category, 'other_services');

  const lost = service.resolveQuestion('I lost my wallet, where is lost and found?');
  assert.equal(lost.isResolved, true);
  assert.equal(lost.category, 'other_services');
});

test('GUEST-HELP-02: 13. Layer 2: Typo and fuzzy distance matching resolves common misspellings', () => {
  const service = new HelpCenterService();

  // "checout" -> checkout
  const q1 = service.resolveQuestion('what time is checout departure');
  assert.equal(q1.isResolved, true);
  assert.equal(q1.category, 'checkin_checkout');

  // "towelz" -> towels
  const q2 = service.resolveQuestion('need extra towelz for bathroom');
  assert.equal(q2.isResolved, true);
  assert.equal(q2.category, 'housekeeping');

  // "a/c" -> ac
  const q3 = service.resolveQuestion('my a/c is not blowing cold air');
  assert.equal(q3.isResolved, true);
  assert.equal(q3.category, 'maintenance');

  // "restarant" -> restaurant
  const q4 = service.resolveQuestion('what restarant is open for dinner');
  assert.equal(q4.isResolved, true);
  assert.equal(q4.category, 'dining');

  // "brakfast" -> breakfast
  const q5 = service.resolveQuestion('when is brakfast buffet served');
  assert.equal(q5.isResolved, true);
  assert.equal(q5.category, 'dining');

  // "houskeeping" -> housekeeping
  const q6 = service.resolveQuestion('send houskeeping to clean room');
  assert.equal(q6.isResolved, true);
  assert.equal(q6.category, 'housekeeping');

  // "recption" -> reception
  const q7 = service.resolveQuestion('connect me to recption agent');
  assert.equal(q7.isResolved, true);
  assert.equal(q7.category, 'front_desk');

  // "swiming pol" -> swimming pool
  const q8 = service.resolveQuestion('hours for swiming pol');
  assert.equal(q8.isResolved, true);
  assert.equal(q8.category, 'facilities');

  // "massge" -> massage
  const q9 = service.resolveQuestion('book an ayurvedic massge');
  assert.equal(q9.isResolved, true);
  assert.equal(q9.category, 'wellness');

  // "wifii" -> wifi
  const q10 = service.resolveQuestion('how to connect to wifii');
  assert.equal(q10.isResolved, true);
  assert.equal(q10.category, 'stay_info');
});

test('GUEST-HELP-02: 14. Layer 3: Grounded AI engine interface (IAssistantEngine) with LocalGroundedEngine', async () => {
  const engine = new LocalGroundedEngine();
  const resolution = await engine.processQuestion('What is the hotel address?');

  assert.equal(resolution.isResolved, true);
  assert.equal(resolution.category, 'hotel_overview');
  assert.ok(resolution.answer.includes('100 Ocean Promenade'));
  assert.ok(resolution.suggestedFollowUps && resolution.suggestedFollowUps.length > 0);
  assert.equal(resolution.suggestedAction?.targetTab, 'home');
});

test('GUEST-HELP-02: 15. Fallback response for unsupported hotel amenities (casino, helicopter, water slide)', () => {
  const service = new HelpCenterService();

  const casino = service.resolveQuestion('Do you have a casino with slot machines?');
  assert.equal(casino.isResolved, false);
  assert.equal(casino.category, 'unconfigured');
  assert.ok(casino.node.message.includes('does not have a configured casino facility'));
  assert.equal(casino.suggestedAction?.targetSubtab, 'front_desk');

  const heli = service.resolveQuestion('Can a helicopter land on the hotel roof?');
  assert.equal(heli.isResolved, false);
  assert.equal(heli.category, 'unconfigured');
  assert.ok(heli.node.message.includes('does not have a configured helicopter facility'));
});

test('GUEST-HELP-02: 16. Out-of-scope question handling returns safe out-of-scope response', () => {
  const service = new HelpCenterService();

  const crypto = service.resolveQuestion('Which crypto or bitcoin should I invest in?');
  assert.equal(crypto.isResolved, false);
  assert.equal(crypto.category, 'out_of_scope');
  assert.ok(crypto.node.message.includes('specifically trained to assist with The Grand ADP'));
  assert.equal(crypto.suggestedAction?.targetSubtab, 'front_desk');

  const code = service.resolveQuestion('Write python code to solve math equation');
  assert.equal(code.isResolved, false);
  assert.equal(code.category, 'out_of_scope');
});

test('GUEST-HELP-02: 17. Zero hallucination: answers strictly grounded in verified data', () => {
  const service = new HelpCenterService();

  const checkoutRes = service.resolveQuestion('What time is checkout?');
  assert.ok(checkoutRes.node.message.includes('11:00 AM'));
  assert.ok(checkoutRes.node.message.includes('14:00 (2:00 PM)'));

  const breakfastRes = service.resolveQuestion('What time is breakfast?');
  assert.ok(breakfastRes.node.message.includes('06:30 AM to 10:30 AM'));
  assert.ok(breakfastRes.node.message.includes('Azure All-Day Bistro'));

  const poolRes = service.resolveQuestion('What are pool hours?');
  assert.ok(poolRes.node.message.includes('06:00 AM to 08:00 PM'));
  assert.ok(poolRes.node.message.includes('Level 2'));
});

test('GUEST-HELP-02: 18. Route allowlist validation strictly permits internal tabs and blocks arbitrary URLs', () => {
  // Valid internal routes
  assert.equal(isRouteAllowed('services', 'maintenance'), true);
  assert.equal(isRouteAllowed('services', 'housekeeping'), true);
  assert.equal(isRouteAllowed('services', 'dining'), true);
  assert.equal(isRouteAllowed('services', 'spa'), true);
  assert.equal(isRouteAllowed('services', 'dnd'), true);
  assert.equal(isRouteAllowed('services', 'front_desk'), true);
  assert.equal(isRouteAllowed('activity'), true);
  assert.equal(isRouteAllowed('profile', 'folio'), true);
  assert.equal(isRouteAllowed('home'), true);

  // Invalid / external / arbitrary routes
  assert.equal(isRouteAllowed('https://evil-phishing-site.com'), false);
  assert.equal(isRouteAllowed('admin', 'secrets'), false);
  assert.equal(isRouteAllowed('services', 'unknown_malicious_subtab'), false);
  assert.equal(isRouteAllowed('javascript:alert(1)'), false);
});

test('GUEST-HELP-02: 19. Direct portal actions map to verified destinations', () => {
  const service = new HelpCenterService();

  const qMaint = service.resolveQuestion('AC is not cooling');
  assert.equal(qMaint.suggestedAction?.targetTab, 'services');
  assert.equal(qMaint.suggestedAction?.targetSubtab, 'maintenance');

  const qHk = service.resolveQuestion('Need clean towels');
  assert.equal(qHk.suggestedAction?.targetTab, 'services');
  assert.equal(qHk.suggestedAction?.targetSubtab, 'housekeeping');

  const qDining = service.resolveQuestion('Want to order food');
  assert.equal(qDining.suggestedAction?.targetTab, 'services');
  assert.equal(qDining.suggestedAction?.targetSubtab, 'dining');

  const qDnd = service.resolveQuestion('Turn on do not disturb');
  assert.equal(qDnd.suggestedAction?.targetTab, 'services');
  assert.equal(qDnd.suggestedAction?.targetSubtab, 'dnd');

  const qBill = service.resolveQuestion('Check my bill');
  assert.equal(qBill.suggestedAction?.targetTab, 'profile');
  assert.equal(qBill.suggestedAction?.targetSubtab, 'folio');

  const qTrack = service.resolveQuestion('Track my request status');
  assert.equal(qTrack.suggestedAction?.targetTab, 'activity');
});

test('GUEST-HELP-02: 20. Input validation handles empty strings, whitespace, and long queries gracefully', () => {
  const service = new HelpCenterService();

  const empty = service.resolveQuestion('');
  assert.equal(empty.isResolved, false);
  assert.ok(empty.node.message.includes('enter a question'));

  const whitespace = service.resolveQuestion('     ');
  assert.equal(whitespace.isResolved, false);
  assert.ok(whitespace.node.message.includes('enter a question'));

  const longQuery = 'a'.repeat(505);
  const tooLong = service.resolveQuestion(longQuery);
  assert.equal(tooLong.isResolved, false);
  assert.ok(tooLong.node.message.includes('500 characters'));
});

test('GUEST-HELP-02: 21. Levenshtein helper computes exact edit distance', () => {
  assert.equal(levenshteinDistance('checkout', 'checout'), 1);
  assert.equal(levenshteinDistance('towels', 'towelz'), 1);
  assert.equal(levenshteinDistance('restaurant', 'restarant'), 1);
  assert.equal(levenshteinDistance('same', 'same'), 0);
  assert.equal(levenshteinDistance('', 'test'), 4);
});
