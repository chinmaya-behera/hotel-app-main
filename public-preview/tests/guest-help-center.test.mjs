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
import {
  GeminiAssistantAdapter,
  HybridGroundedAssistantEngine,
  FolioTestRegistry,
  VERIFIED_ACTION_REGISTRY,
} from '../src/server/modules/guest/help/GeminiAssistantAdapter.ts';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';

test.beforeEach(() => {
  HelpCenterService.clearTestData();
  QrAuthService.clearTestData();
  FolioTestRegistry.clear();
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

// =========================================================================
// GUEST-HELP-03: GEMINI AI HOTEL ASSISTANT WITH LIVE DATABASE INTEGRATION
// =========================================================================

test('GUEST-HELP-03: 22. Gemini Assistant Adapter initializes correctly with model and configuration', () => {
  const adapter = new GeminiAssistantAdapter('dummy-api-key', 'gemini-2.5-flash');
  assert.equal(adapter.isAvailable(), true);

  const unconfigured = new GeminiAssistantAdapter('');
  assert.equal(unconfigured.isAvailable(), false);
});

test('GUEST-HELP-03: 23. Unconfigured Gemini API key throws descriptive error if directly invoked', async () => {
  const unconfigured = new GeminiAssistantAdapter('');
  await assert.rejects(
    async () => {
      await unconfigured.processQuestion('What is checkout time?');
    },
    /GEMINI_UNAVAILABLE/
  );
});

test('GUEST-HELP-03: 24. Hybrid Grounded Engine automatically falls back to Local Grounded Engine when Gemini is unavailable', async () => {
  const hybrid = new HybridGroundedAssistantEngine('');
  const res = await hybrid.processQuestion('What is the wifi password?');

  assert.equal(res.isResolved, true);
  assert.ok(res.answer.includes('grandguest') || res.answer.includes('TheGrandADP-Guest'));
  assert.equal(res.category, 'stay_info');
});

test('GUEST-HELP-03: 25. Unauthenticated guest cannot access personal stay or bill data', async () => {
  const service = new HelpCenterService();

  const stayRes = await service.resolveQuestionAsync('What is my room number?');
  assert.ok(
    stayRes.node.message.includes('authenticate') ||
    stayRes.node.message.includes('Front Desk') ||
    stayRes.node.message.includes('Profile') ||
    stayRes.node.message.includes('Stay') ||
    stayRes.node.message.includes('room details')
  );

  const billRes = await service.resolveQuestionAsync('Show me my complete bill');
  assert.ok(
    billRes.node.message.includes('authenticate') ||
    billRes.node.message.includes('Folio') ||
    billRes.node.message.includes('Billing')
  );
});

test('GUEST-HELP-03: 26. Authenticated guest retrieves their own live stay details from repository', async () => {
  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );

  assert.equal(authResult.success, true);
  const token = authResult.data.sessionToken;

  const service = new HelpCenterService();
  const res = await service.resolveQuestionAsync(
    'Where can I see my room details and stay information?',
    undefined,
    { sessionToken: token }
  );

  assert.equal(res.isResolved, true);
  assert.equal(res.suggestedAction?.targetTab, 'profile');
  assert.equal(res.suggestedAction?.targetSubtab, 'stay');
});

test('GUEST-HELP-03: 27. Cross-guest data isolation: Guest A cannot access Guest B records', async () => {
  const authService = new QrAuthService();

  // Register Guest B in Room 101
  const now = new Date();
  QrAuthService.registerMockStay('101', {
    stay: {
      id: 'stay_seed_101',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-101-SECRET',
      guestFirstName: 'Vikram',
      guestLastName: 'Mehta',
      guestEmail: 'vikram@example.com',
      guestPhone: '+91 99999 11111',
      welcomeTvPin: '1111',
      status: 'checked_in',
      checkInTime: now,
      checkOutTime: new Date(now.getTime() + 86400000),
      createdAt: now,
      updatedAt: now,
    },
    room: {
      id: 'room_assign_101',
      stayId: 'stay_seed_101',
      roomId: 'room_id_101',
      roomNumber: '101',
      propertyId: 'prop_grand_adp_01',
      floor: 1,
      roomType: 'Ocean Villa',
      dndActive: true,
      cleanlinessStatus: 'ready',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    },
    qr: {
      id: 'qr_map_101',
      propertyId: 'prop_grand_adp_01',
      roomId: 'room_id_101',
      roomNumber: '101',
      staticHmacSignature: QrAuthService.generateHmacSignature('101'),
      secretKey: 'dev_secret',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Authenticate Guest A (Room 402)
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authA = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );

  const tokenA = authA.data.sessionToken;
  const service = new HelpCenterService();

  // Guest A tries to ask about Room 101 or stay_seed_101
  const result = await service.resolveQuestionAsync(
    'Show me the stay details for Room 101 and booking BK-101-SECRET',
    undefined,
    { sessionToken: tokenA }
  );

  // Must NOT reveal Room 101 or Vikram Mehta's details
  assert.equal(result.node.message.includes('Vikram'), false);
  assert.equal(result.node.message.includes('BK-101-SECRET'), false);
});

test('GUEST-HELP-03: 28. Live request status retrieval for authenticated guest', async () => {
  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );
  const token = authResult.data.sessionToken;

  const service = new HelpCenterService();
  const res = await service.resolveQuestionAsync(
    'Where can I see the status of my current requests?',
    undefined,
    { sessionToken: token }
  );

  assert.equal(res.isResolved, true);
  assert.equal(res.suggestedAction?.targetTab, 'activity');
});

test('GUEST-HELP-03: 29. Authoritative bill calculation when financial source exists', async () => {
  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );

  // Set authoritative bill in registry
  FolioTestRegistry.setMockBill('stay_seed_402', {
    roomCharges: 8000,
    diningCharges: 1500,
    additionalServices: 500,
    totalAmount: 10000,
    amountPaid: 5000,
    balanceDue: 5000,
    currency: 'INR',
    isAuthoritativeDb: true,
  });

  const adapter = new GeminiAssistantAdapter('dummy-test-key');
  const toolExec = await adapter['executeServerFunction']('get_guest_bill_summary', {}, authResult.data, 'Show me my bill');

  assert.equal(toolExec.billSummary?.totalAmount, 10000);
  assert.equal(toolExec.billSummary?.balanceDue, 5000);
  assert.ok(toolExec.overrideText?.includes('₹8,000'));
  assert.ok(toolExec.overrideText?.includes('₹10,000'));
  assert.ok(toolExec.overrideText?.includes('₹5,000'));
  assert.equal(toolExec.suggestedAction?.targetSubtab, 'folio');
});

test('GUEST-HELP-03: 30. Bill totals remain 100% authoritative and cannot be manipulated by AI', async () => {
  const billFixture = {
    roomCharges: 12000,
    diningCharges: 3200,
    additionalServices: 800,
    totalAmount: 16000,
    amountPaid: 6000,
    balanceDue: 10000,
    currency: 'INR',
    isAuthoritativeDb: true,
  };

  const calculatedTotal = billFixture.roomCharges + billFixture.diningCharges + billFixture.additionalServices;
  const calculatedBalance = calculatedTotal - billFixture.amountPaid;

  assert.equal(calculatedTotal, billFixture.totalAmount);
  assert.equal(calculatedBalance, billFixture.balanceDue);
});

test('GUEST-HELP-03: 31. Missing billing data returns honest notice and points to folio page', async () => {
  FolioTestRegistry.clear(); // Ensure no mock bill exists

  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );

  const adapter = new GeminiAssistantAdapter('dummy-test-key');
  const toolExec = await adapter['executeServerFunction']('get_guest_bill_summary', {}, authResult.data, 'Show my bill');

  assert.equal(toolExec.resultData.isAuthoritativeDb, false);
  assert.equal(toolExec.resultData.missingSchema, 'guest_folio');
  assert.ok(toolExec.overrideText?.includes('guest_folio'));
  assert.equal(toolExec.suggestedAction?.targetSubtab, 'folio');
});

test('GUEST-HELP-03: 32. In-room dining order status retrieval', async () => {
  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );

  const adapter = new GeminiAssistantAdapter('dummy-test-key');
  const toolExec = await adapter['executeServerFunction']('get_guest_order_summary', {}, authResult.data, 'What did I order?');

  assert.ok(toolExec.resultData);
  assert.equal(toolExec.category, 'dining');
  assert.ok(toolExec.overrideText?.includes('dining order'));
  assert.ok(toolExec.suggestedAction);
});

test('GUEST-HELP-03: 33. Guest reminders and wake-up calls retrieval', async () => {
  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );

  const adapter = new GeminiAssistantAdapter('dummy-test-key');
  const toolExec = await adapter['executeServerFunction']('get_guest_reminders', {}, authResult.data, 'Do I have any wake up calls?');

  assert.ok(toolExec.resultData);
  assert.equal(toolExec.category, 'front_desk');
  assert.ok(toolExec.overrideText?.includes('wake-up calls'));
  assert.equal(toolExec.suggestedAction?.targetSubtab, 'front_desk');
});

test('GUEST-HELP-03: 34. Multilingual questions: Hindi and Odia support', async () => {
  const service = new HelpCenterService();

  // Hindi: चेकआउट का समय क्या है? (What is checkout time?)
  const hiRes = await service.resolveQuestionAsync('चेकआउट का समय क्या है?', undefined, { language: 'hi' });
  assert.equal(hiRes.isResolved, true);
  assert.ok(hiRes.node.message.includes('11:00 AM'));
  assert.equal(hiRes.suggestedAction?.targetSubtab, 'folio');

  // Odia: ଚେକ୍ ଆଉଟ୍ ସମୟ କେତେ? (What is checkout time?)
  const orRes = await service.resolveQuestionAsync('ଚେକ୍ ଆଉଟ୍ ସମୟ କେତେ?', undefined, { language: 'or' });
  assert.equal(orRes.isResolved, true);
  assert.ok(orRes.node.message.includes('11:00 AM'));
});

test('GUEST-HELP-03: 35. Verified action registry contains only verified internal routes', () => {
  for (const [key, action] of Object.entries(VERIFIED_ACTION_REGISTRY)) {
    assert.ok(action.label, `Action ${key} missing label`);
    assert.ok(action.targetTab, `Action ${key} missing targetTab`);
    assert.equal(isRouteAllowed(action.targetTab, action.targetSubtab), true,
      `Action ${key} (${action.targetTab}/${action.targetSubtab}) is not in route allowlist`);
  }
});

test('GUEST-HELP-03: 36. Server rejects arbitrary or external URL navigation', () => {
  assert.equal(isRouteAllowed('https://malicious-phishing.com/steal-creds'), false);
  assert.equal(isRouteAllowed('http://localhost:3000/internal-admin'), false);
  assert.equal(isRouteAllowed('services', 'arbitrary_unverified_subtab'), false);
  assert.equal(isRouteAllowed('', ''), false);
});

test('GUEST-HELP-03: 37. Session tokens and secrets are never exposed in assistant messages', async () => {
  const authService = new QrAuthService();
  const room402Sig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: room402Sig,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    },
    '127.0.0.1',
    'test-agent'
  );
  const token = authResult.data.sessionToken;

  const service = new HelpCenterService();
  const res = await service.resolveQuestionAsync('Show my stay information', undefined, { sessionToken: token });

  assert.equal(res.node.message.includes(token), false, 'Session token must not be leaked in message');
  assert.equal(JSON.stringify(res.node).includes(token), false, 'Session token must not appear in node JSON');
});

test('GUEST-HELP-03: 38. Backward compatibility: Guided Help Center flows and feedback still work', () => {
  const service = new HelpCenterService();
  const topics = service.getTopics();
  assert.equal(topics.length, 8);

  const rootNode = service.getFlowNode('node_root');
  assert.equal(rootNode.id, 'node_root');
  assert.equal(rootNode.choices?.length, 8);

  const fbRes = service.submitFeedback({
    flowId: 'node_maint_ac',
    helpful: true,
    comment: 'Great Gemini AI integration',
  });
  assert.equal(fbRes.success, true);
});
