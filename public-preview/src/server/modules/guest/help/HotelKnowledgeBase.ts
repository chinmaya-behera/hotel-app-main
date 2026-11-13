/**
 * Hotel Knowledge Base (GUEST-HELP-02 Phase 4)
 *
 * Centralized, structured repository of verified hotel facts, facilities,
 * policies, service hours, and Guest Portal direct navigation actions.
 * Covers all 14 mandatory categories strictly grounded in project data.
 */

import { BotMessageService } from './BotMessageConfig.ts';

export type KnowledgeCategory =
  | 'hotel_overview'
  | 'facilities'
  | 'dining'
  | 'food_ordering'
  | 'wellness'
  | 'housekeeping'
  | 'maintenance'
  | 'stay_info'
  | 'checkin_checkout'
  | 'policies'
  | 'billing'
  | 'portal_guide'
  | 'front_desk'
  | 'other_services';

export interface VerifiedPortalAction {
  label: string;
  targetTab: string;
  targetSubtab?: string;
  prefillCategory?: string;
  actionType?: 'navigate' | 'tour';
}

export interface HotelKnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  topic: string;
  title: string;
  question: string;
  answer: string;
  keywords: string[];
  aliases: string[];
  suggestedAction?: VerifiedPortalAction;
  suggestedFollowUps?: string[];
  source: string;
  isActive: boolean;
}

/**
 * Verified Route Allowlist (Phase 6 Strict Guard)
 * Rejects any arbitrary URL or unverified route to guarantee navigation safety.
 */
export const VERIFIED_ROUTE_ALLOWLIST: Record<string, string[]> = {
  services: ['maintenance', 'housekeeping', 'dining', 'spa', 'front_desk', 'dnd', 'concierge'],
  activity: [],
  profile: ['folio', 'stay'],
  home: [],
  notifications: [],
};

/**
 * Validates a targetTab and optional targetSubtab against the verified route allowlist.
 */
export function isRouteAllowed(targetTab: string, targetSubtab?: string): boolean {
  if (!targetTab || typeof targetTab !== 'string') return false;
  const cleanTab = targetTab.trim().toLowerCase();

  if (!(cleanTab in VERIFIED_ROUTE_ALLOWLIST)) {
    return false;
  }

  if (targetSubtab) {
    const cleanSubtab = targetSubtab.trim().toLowerCase();
    const allowedSubtabs = VERIFIED_ROUTE_ALLOWLIST[cleanTab];
    if (allowedSubtabs.length > 0 && !allowedSubtabs.includes(cleanSubtab)) {
      return false;
    }
  }

  return true;
}

/**
 * 14 Verified Knowledge Base Categories with Structured Entries
 */
export const HOTEL_KNOWLEDGE_ENTRIES: HotelKnowledgeEntry[] = [
  // ==========================================
  // 1. HOTEL OVERVIEW & ADDRESS
  // ==========================================
  {
    id: 'kb_hotel_address',
    category: 'hotel_overview',
    topic: 'Hotel Overview & Address',
    title: 'The Grand ADP Address & Overview',
    question: 'Where is the hotel located and what is its address?',
    answer: 'The Grand ADP (Grand Azure Resort & Residences) is located at 100 Ocean Promenade, Azure Coastline. We are a luxury 5-star seaside retreat offering coastal panoramic views, holistic wellness, and personalized in-room concierge services.',
    keywords: ['address', 'location', 'direction', 'map', 'situated', 'resort name', 'hotel name', 'promenade', 'where is the hotel'],
    aliases: ['where are you located', 'hotel address', 'what is the hotel address', 'how to reach the hotel'],
    suggestedAction: {
      label: 'Take Interactive Tour',
      targetTab: 'home',
      actionType: 'tour',
    },
    suggestedFollowUps: [
      'What facilities are available?',
      'How do I contact Front Desk?',
      'What are the check-in and checkout timings?',
    ],
    source: 'HotelWebsite.tsx:HeroSection',
    isActive: true,
  },

  // ==========================================
  // 2. AVAILABLE FACILITIES & AMENITIES
  // ==========================================
  {
    id: 'kb_fac_pool',
    category: 'facilities',
    topic: 'Swimming Pool & Fitness',
    title: 'Pool & Gym Facilities',
    question: 'Where is the swimming pool and gym located, and what are the timings?',
    answer: 'Our open-air Infinity Pool is on Level 2 (open daily from 06:00 AM to 08:00 PM). The 24/7 Fitness Center is also on Level 2, accessible anytime using your room key card. Fresh pool towels and bottled water are provided at the wellness desk.',
    keywords: ['pool', 'swimming', 'swim', 'gym', 'fitness', 'workout', 'treadmill', 'weights', 'exercise'],
    aliases: ['pool hours', 'gym timings', 'is the pool open', 'where is the fitness center'],
    suggestedAction: {
      label: 'View Wellness & Pool',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    suggestedFollowUps: [
      'What spa treatments are offered?',
      'Where is breakfast served?',
      'Can I request extra towels?',
    ],
    source: 'SpaSection.tsx:PoolAmenities',
    isActive: true,
  },
  {
    id: 'kb_fac_wifi',
    category: 'stay_info',
    topic: 'Guest Wi-Fi',
    title: 'High-Speed Wi-Fi Access',
    question: 'How do I connect to hotel Wi-Fi and what is the password?',
    answer: 'Complimentary high-speed fiber Wi-Fi is available property-wide. Connect to "TheGrandADP-Guest" (or "GrandADP_Guest"), enter your 3-digit room number, and use password: "grandguest". Speeds reach up to 300 Mbps.',
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'password', 'connect', 'speed', 'broadband', 'wlan'],
    aliases: ['what is the wifi password', 'how to connect to wifi', 'internet access', 'wifi code'],
    suggestedAction: {
      label: 'View Stay & Wi-Fi Details',
      targetTab: 'profile',
      targetSubtab: 'stay',
    },
    suggestedFollowUps: [
      'How to report TV or Wi-Fi issue?',
      'Where can I see my room details?',
    ],
    source: 'HelpCenterData.ts:node_stay_wifi',
    isActive: true,
  },
  {
    id: 'kb_fac_parking',
    category: 'facilities',
    topic: 'Valet & Parking',
    title: 'Guest Valet Parking',
    question: 'Is parking available at the hotel?',
    answer: 'Yes, complimentary 24/7 valet parking is provided for all registered resident guests at the main hotel entrance portico. Please show your room keycard to the valet concierge upon arrival or departure.',
    keywords: ['parking', 'park', 'valet', 'car park', 'vehicle', 'garage'],
    aliases: ['where do I park', 'is parking free', 'valet parking service'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'Can concierge arrange airport transfer?',
      'What is checkout time?',
    ],
    source: 'HotelWebsite.tsx:ServicesList',
    isActive: true,
  },

  // ==========================================
  // 3. RESTAURANT & DINING INFORMATION
  // ==========================================
  {
    id: 'kb_dining_restaurants',
    category: 'dining',
    topic: 'Hotel Dining Venues',
    title: 'Restaurants & Dining Venues',
    question: 'What restaurants and dining options are available at the hotel?',
    answer: 'The Grand ADP features two premier dining venues: "Fine Dining & Skyline Lounge" (Level 30 panoramic ocean lounge, open 05:00 PM – 11:30 PM) and "Azure All-Day Bistro" (Ground Floor, open 06:30 AM – 11:00 PM). In-room dining is also available 24 hours a day.',
    keywords: ['restaurant', 'dining', 'skyline', 'bistro', 'eat', 'lounge', 'food venue'],
    aliases: ['what restaurants do you have', 'where to eat in hotel', 'dining options'],
    suggestedAction: {
      label: 'Browse Dining Options',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    suggestedFollowUps: [
      'What time is breakfast served?',
      'How do I order room service?',
      'Do you have vegetarian or vegan options?',
    ],
    source: 'DiningSection.tsx:Overview',
    isActive: true,
  },
  {
    id: 'kb_dining_breakfast',
    category: 'dining',
    topic: 'Breakfast Timings & Buffet',
    title: 'Breakfast Hours & Buffet Location',
    question: 'What time is breakfast served and where is it located?',
    answer: 'Complimentary buffet breakfast is served daily from 06:30 AM to 10:30 AM at the Azure All-Day Bistro (Ground Floor). You can also order hot breakfast items, freshly pressed juices, and artisanal coffee delivered to your room via In-Room Dining.',
    keywords: ['breakfast', 'morning buffet', 'buffet hours', 'breakfast time', 'morning meal', 'continental breakfast', 'eggs', 'coffee'],
    aliases: ['when is breakfast', 'what time is breakfast', 'where is breakfast buffet'],
    suggestedAction: {
      label: 'View Dining Menu',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    suggestedFollowUps: [
      'How to order food to my room?',
      'What is checkout time?',
    ],
    source: 'HelpCenterData.ts:node_dining_breakfast',
    isActive: true,
  },

  // ==========================================
  // 4. MENU AND FOOD-ORDERING INSTRUCTIONS
  // ==========================================
  {
    id: 'kb_food_order_guide',
    category: 'food_ordering',
    topic: 'In-Room Food Ordering',
    title: 'How to Order In-Room Dining',
    question: 'How do I order food to my room?',
    answer: 'You can order gourmet dining 24/7 directly through the Guest Portal: Go to the "Services" tab, select "Dining", choose your favorite dishes and beverages, add custom chef notes (e.g. spice level or allergies), and tap "Place Order". All orders are charged to your room folio with an estimated 25–35 minute delivery.',
    keywords: ['order food', 'room service', 'in room dining', 'menu', 'pizza', 'pasta', 'dinner', 'lunch', 'hungry', 'curry', 'biryani', 'dessert'],
    aliases: ['where can I order food', 'how to order dinner', 'can I get room service', 'show food menu'],
    suggestedAction: {
      label: 'View Menu / Place Order',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    suggestedFollowUps: [
      'Where can I track my food order?',
      'How do I view my current food bill?',
    ],
    source: 'DiningSection.tsx:OrderWorkflow',
    isActive: true,
  },
  {
    id: 'kb_food_dietary',
    category: 'food_ordering',
    topic: 'Special Dietary Requests',
    title: 'Dietary & Allergy Options',
    question: 'Do you offer vegan, gluten-free, or Jain food options?',
    answer: 'Yes! Our executive chef caters to special dietary requirements including Jain, vegan, vegetarian, gluten-free, halal, and nut-allergy preparations. When placing an order under Services > Dining, specify your dietary instructions in the item notes, or contact Front Desk.',
    keywords: ['vegan', 'gluten free', 'jain', 'halal', 'vegetarian', 'allergy', 'allergies', 'dietary', 'dairy free', 'custom meal'],
    aliases: ['do you have vegan food', 'jain meal options', 'gluten free dishes', 'allergy safe food'],
    suggestedAction: {
      label: 'Request Custom Dining',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    suggestedFollowUps: [
      'View In-Room Dining Menu',
      'Contact Front Desk for special requests',
    ],
    source: 'HelpCenterData.ts:node_dining_dietary',
    isActive: true,
  },

  // ==========================================
  // 5. WELLNESS SERVICES
  // ==========================================
  {
    id: 'kb_wellness_spa',
    category: 'wellness',
    topic: 'The Grand Wellness & Spa',
    title: 'Spa Treatments & Bookings',
    question: 'What spa services are offered and how can I book?',
    answer: 'The Grand Wellness & Spa (Suite 202, Level 2) is open daily from 08:00 AM to 09:00 PM. We offer signature deep-tissue therapies, Swedish aromatherapy, Ayurvedic herbal wraps, rejuvenating facials, and private steam/sauna sessions. Advance booking via the portal is recommended.',
    keywords: ['spa', 'wellness', 'massage', 'facial', 'ayurveda', 'sauna', 'steam', 'scrub', 'relaxation', 'therapist'],
    aliases: ['book a massage', 'how much is the spa', 'where is the spa', 'spa opening hours'],
    suggestedAction: {
      label: 'Book Spa & Wellness',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    suggestedFollowUps: [
      'What are the pool and gym hours?',
      'Can I bill spa treatments to my room?',
    ],
    source: 'SpaSection.tsx:TreatmentList',
    isActive: true,
  },

  // ==========================================
  // 6. HOUSEKEEPING SERVICES
  // ==========================================
  {
    id: 'kb_hk_towels_linens',
    category: 'housekeeping',
    topic: 'Towels, Pillows & Linens',
    title: 'Request Fresh Towels & Extra Linens',
    question: 'How do I request fresh towels or extra pillows?',
    answer: 'You can request Egyptian cotton bath towels, hand towels, plush bathrobes, extra hypoallergenic pillows, or fresh bed linens directly on the Guest Portal: Go to Services > Housekeeping, select your items, and our attendant will deliver them to your door within 10–15 minutes.',
    keywords: ['towel', 'towels', 'linen', 'linens', 'pillow', 'blanket', 'duvet', 'bedsheet', 'bathrobe', 'robe'],
    aliases: ['need clean towels', 'send more pillows', 'extra blanket please', 'how to request fresh towels'],
    suggestedAction: {
      label: 'Open Housekeeping Request',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Towels & Linens',
    },
    suggestedFollowUps: [
      'How to request full room cleaning?',
      'Where can I track my housekeeping request?',
    ],
    source: 'HelpCenterData.ts:node_hk_towels',
    isActive: true,
  },
  {
    id: 'kb_hk_cleaning',
    category: 'housekeeping',
    topic: 'Room Cleaning Service',
    title: 'Daily Room Cleaning & Turn-Down',
    question: 'When is room cleaning conducted and can I schedule a cleaning?',
    answer: 'Standard housekeeping is carried out daily between 09:00 AM and 03:00 PM, with evening turn-down service between 06:00 PM and 09:00 PM. To schedule immediate room refresh or specify a convenient time, navigate to Services > Housekeeping.',
    keywords: ['clean', 'cleaning', 'sweep', 'mop', 'housekeeping', 'turndown', 'turn down', 'tidy', 'make bed', 'dirty room'],
    aliases: ['please clean my room', 'when does housekeeping come', 'how to get room cleaned'],
    suggestedAction: {
      label: 'Schedule Room Cleaning',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Room Cleaning',
    },
    suggestedFollowUps: [
      'How do I turn on Do Not Disturb?',
      'How to request fresh toiletries?',
    ],
    source: 'HelpCenterData.ts:node_hk_cleaning',
    isActive: true,
  },
  {
    id: 'kb_hk_toiletries',
    category: 'housekeeping',
    topic: 'Toiletries & Dental Kit',
    title: 'Bath Amenities & Vanity Packs',
    question: 'How can I get extra shampoo, soap, or a dental kit?',
    answer: 'Complimentary luxury toiletries—including dental kits (toothbrush & toothpaste), shaving kits, shower gel, shampoo, conditioner, combs, and sewing kits—can be requested anytime via Services > Housekeeping.',
    keywords: ['soap', 'shampoo', 'conditioner', 'dental kit', 'toothbrush', 'paste', 'shaving', 'razor', 'toiletries', 'body wash', 'lotion', 'comb'],
    aliases: ['need toothbrush', 'send more soap', 'bathroom amenities', 'extra shampoo'],
    suggestedAction: {
      label: 'Request Bath Amenities',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Toiletries',
    },
    suggestedFollowUps: [
      'Request fresh towels',
      'Track my housekeeping request',
    ],
    source: 'HelpCenterData.ts:node_hk_toiletries',
    isActive: true,
  },

  // ==========================================
  // 7. MAINTENANCE SUPPORT
  // ==========================================
  {
    id: 'kb_maint_ac',
    category: 'maintenance',
    topic: 'Air Conditioning & Temperature',
    title: 'AC / Climate Control Assistance',
    question: 'How can I report an AC problem or adjust room temperature?',
    answer: 'Our in-house HVAC engineering team is available 24/7. Standard room comfort is pre-set to 21°C (70°F). If your unit is blowing warm air, not cooling, or making noise, open a maintenance ticket under Services > Maintenance, and a technician will visit within 15 minutes.',
    keywords: ['ac', 'air condition', 'air conditioning', 'cooling', 'hvac', 'thermostat', 'hot', 'cold', 'temperature', 'fan', 'air conditioner'],
    aliases: ['ac not working', 'room is too hot', 'room is freezing', 'fix the air conditioning', 'how to report an ac problem'],
    suggestedAction: {
      label: 'Create Maintenance Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Air Conditioning',
    },
    suggestedFollowUps: [
      'How do I track my repair ticket?',
      'Can I message Front Desk directly?',
    ],
    source: 'HelpCenterData.ts:node_maint_ac',
    isActive: true,
  },
  {
    id: 'kb_maint_plumbing_electric',
    category: 'maintenance',
    topic: 'Plumbing & Electrical Repairs',
    title: 'Plumbing, Water, and Electrical Repairs',
    question: 'How do I report a plumbing leak, hot water issue, or broken light?',
    answer: 'For water leaks, low shower pressure, lack of hot water, blown light bulbs, or faulty electrical sockets, submit an immediate ticket under Services > Maintenance. Our engineering response team is dispatched immediately.',
    keywords: ['plumbing', 'leak', 'toilet', 'tap', 'sink', 'shower', 'hot water', 'drain', 'light', 'bulb', 'lamp', 'electricity', 'outlet', 'plug', 'power'],
    aliases: ['toilet is clogged', 'no hot water in shower', 'lights not working', 'water leaking in bathroom'],
    suggestedAction: {
      label: 'Create Maintenance Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Plumbing',
    },
    suggestedFollowUps: [
      'Track My Request in Activity',
      'Contact Front Desk for urgent issue',
    ],
    source: 'HelpCenterData.ts:node_maint_plumb',
    isActive: true,
  },
  {
    id: 'kb_maint_tv',
    category: 'maintenance',
    topic: 'TV & Media Remote',
    title: 'TV, Remote & Streaming Support',
    question: 'My TV or remote is not working. How can I get help?',
    answer: 'Your room features a 55" 4K Smart TV with casting capability. If your remote batteries are low or you need assistance connecting devices, submit an entertainment ticket under Services > Maintenance > TV / Wi-Fi, and our tech specialist will assist.',
    keywords: ['tv', 'television', 'remote', 'channel', 'screen', 'casting', 'hdmi', 'cable', 'smart tv'],
    aliases: ['tv remote not working', 'how to turn on tv', 'cannot watch tv', 'tv channels'],
    suggestedAction: {
      label: 'Create Maintenance Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'TV / Wi-Fi',
    },
    suggestedFollowUps: [
      'What is the Wi-Fi password?',
      'Message Front Desk',
    ],
    source: 'HelpCenterData.ts:node_maint_tv',
    isActive: true,
  },

  // ==========================================
  // 8. ROOM AND STAY INFORMATION
  // ==========================================
  {
    id: 'kb_stay_dnd',
    category: 'stay_info',
    topic: 'Digital Do Not Disturb (DND)',
    title: 'Digital Do Not Disturb (DND)',
    question: 'How can I turn on Do Not Disturb (DND)?',
    answer: 'You can toggle your digital privacy guard at any time from your smartphone: Open the Guest Portal, navigate to Services > DND, and toggle "Do Not Disturb" on. Our housekeeping, butler, and staff teams are immediately alerted not to knock or ring the door chime.',
    keywords: ['dnd', 'do not disturb', 'privacy', 'quiet', 'do not enter', 'dont disturb', 'sleeping', 'door sign'],
    aliases: ['how to enable dnd', 'how can I turn on dnd', 'turn on do not disturb', 'want privacy'],
    suggestedAction: {
      label: 'Open DND Settings',
      targetTab: 'services',
      targetSubtab: 'dnd',
    },
    suggestedFollowUps: [
      'When is daily housekeeping?',
      'How to request room cleaning later?',
    ],
    source: 'HelpCenterData.ts:node_stay_dnd',
    isActive: true,
  },
  {
    id: 'kb_stay_room_details',
    category: 'stay_info',
    topic: 'Stay Information & Profile',
    title: 'Room Number, Dates & Guest Details',
    question: 'Where can I see my room details and stay information?',
    answer: 'Your check-in date, scheduled departure, registered guest names, room category, and Wi-Fi credentials can be viewed anytime under the "Profile" > "Stay" tab in your Guest Portal.',
    keywords: ['stay details', 'room number', 'guest count', 'reservation', 'booking details', 'dates', 'arrival date'],
    aliases: ['where are my stay details', 'show my booking info', 'check my room details'],
    suggestedAction: {
      label: 'Open Stay Details',
      targetTab: 'profile',
      targetSubtab: 'stay',
    },
    suggestedFollowUps: [
      'What time is checkout?',
      'View Folio & Billing',
    ],
    source: 'HelpCenterData.ts:node_stay_summary',
    isActive: true,
  },

  // ==========================================
  // 9. CHECK-IN AND CHECKOUT INFORMATION
  // ==========================================
  {
    id: 'kb_checkin_checkout',
    category: 'checkin_checkout',
    topic: 'Check-in & Checkout Times',
    title: 'Standard Check-in and Checkout Timings',
    question: 'What time is check-in and checkout?',
    answer: 'Standard check-in begins at 14:00 (2:00 PM). Standard checkout is at 11:00 AM. If you require a late departure or luggage hold, you can request an extension via Front Desk or complete express digital checkout directly under Profile > Folio.',
    keywords: ['checkout', 'check out', 'check-out', 'check in', 'checkin', 'departure', 'timing', 'time', 'hours', 'late checkout'],
    aliases: ['what time is checkout', 'what time is check-in', 'when do I have to leave', 'can I get late checkout'],
    suggestedAction: {
      label: 'View Stay / Checkout Details',
      targetTab: 'profile',
      targetSubtab: 'folio',
    },
    suggestedFollowUps: [
      'How do I complete express checkout?',
      'Can I store luggage after checkout?',
      'How do I view my current bill?',
    ],
    source: 'HelpCenterData.ts:node_stay_checkout',
    isActive: true,
  },
  {
    id: 'kb_express_checkout',
    category: 'checkin_checkout',
    topic: 'Express Digital Checkout',
    title: 'Express Digital Checkout via Portal',
    question: 'How do I do digital express checkout without waiting in line?',
    answer: 'Skip the Front Desk queue with Express Digital Checkout: Open the Guest Portal, navigate to Profile > Folio, review your itemized charges, confirm your payment method, and tap "Express Checkout". Simply leave your physical key card inside the room upon departure.',
    keywords: ['express checkout', 'digital checkout', 'leave room', 'settle bill', 'departure process', 'skip line'],
    aliases: ['how to do express checkout', 'checkout online', 'can I check out on my phone'],
    suggestedAction: {
      label: 'View Stay / Checkout Details',
      targetTab: 'profile',
      targetSubtab: 'folio',
    },
    suggestedFollowUps: [
      'View Folio & Charges',
      'Request luggage collection',
    ],
    source: 'HelpCenterData.ts:node_folio_express',
    isActive: true,
  },

  // ==========================================
  // 10. HOTEL POLICIES AND RULES
  // ==========================================
  {
    id: 'kb_policy_smoking',
    category: 'policies',
    topic: 'Smoking Policy',
    title: '100% Smoke-Free Property Policy',
    question: 'Is smoking allowed in the rooms or on balconies?',
    answer: 'The Grand ADP is a 100% smoke-free property. Smoking, vaping, or e-cigarettes are strictly prohibited inside all guest rooms, bathrooms, and balcony suites. A dedicated outdoor smoking pavilion is located in the ground-floor botanical garden.',
    keywords: ['smoke', 'smoking', 'cigarette', 'vape', 'vaping', 'cigar', 'designated smoking area'],
    aliases: ['can I smoke in the room', 'is smoking permitted on balcony', 'smoking area location'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'What are the quiet hours?',
      'What are hotel rules?',
    ],
    source: 'HotelWebsite.tsx:Policies',
    isActive: true,
  },
  {
    id: 'kb_policy_quiet_hours',
    category: 'policies',
    topic: 'Quiet Hours & Visitors',
    title: 'Quiet Hours and Visitor Guidelines',
    question: 'What are the hotel quiet hours and visitor policies?',
    answer: 'To ensure restful tranquility for all guests, quiet hours are observed nightly between 10:00 PM and 07:00 AM. Non-registered visitors must check in at the Front Desk before entering residential corridors and must depart by 10:00 PM.',
    keywords: ['quiet hours', 'noise', 'visitors', 'guests policy', 'party', 'silence', 'night time'],
    aliases: ['what time are quiet hours', 'can friends visit my room', 'noise rules'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'How to turn on DND?',
      'Contact Front Desk',
    ],
    source: 'HotelWebsite.tsx:Policies',
    isActive: true,
  },
  {
    id: 'kb_policy_pets',
    category: 'policies',
    topic: 'Pet Policy',
    title: 'Pet Policy Notice',
    question: 'Are pets allowed in the hotel?',
    answer: 'Pets are currently not permitted on property, with the exception of certified service animals registered in advance with Front Desk. For specialized pet boarding recommendations nearby, please speak with our concierge.',
    keywords: ['pet', 'pets', 'dog', 'cat', 'animal', 'service dog', 'puppy'],
    aliases: ['are pets allowed', 'can I bring my dog', 'pet friendly'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'Contact Concierge for local pet boarding',
      'View other hotel policies',
    ],
    source: 'HotelWebsite.tsx:Policies',
    isActive: true,
  },

  // ==========================================
  // 11. BILLING AND CHECKOUT GUIDANCE
  // ==========================================
  {
    id: 'kb_billing_folio',
    category: 'billing',
    topic: 'Folio, Charges & Tax Invoices',
    title: 'View Itemized Room Folio and Billing',
    question: 'How do I see my current room bill and charges?',
    answer: 'Your digital room folio updates in real time whenever food orders, spa treatments, or incidentals are posted. Navigate to "Profile" > "Folio" to review itemized receipts, applicable taxes (GST), and download your official invoice statement.',
    keywords: ['bill', 'billing', 'folio', 'invoice', 'receipt', 'charge', 'charges', 'statement', 'cost', 'tariff', 'tax', 'gst'],
    aliases: ['show my folio bill charges', 'how much do I owe', 'where is my room bill', 'view my charges'],
    suggestedAction: {
      label: 'View Folio & Billing',
      targetTab: 'profile',
      targetSubtab: 'folio',
    },
    suggestedFollowUps: [
      'How to dispute a charge?',
      'Complete express checkout',
    ],
    source: 'HelpCenterData.ts:node_folio_charges',
    isActive: true,
  },

  // ==========================================
  // 12. GUEST PORTAL INSTRUCTIONS
  // ==========================================
  {
    id: 'kb_portal_activity',
    category: 'portal_guide',
    topic: 'Tracking Service Requests',
    title: 'Track Active Requests & Status',
    question: 'Where can I see the status of my current requests?',
    answer: 'You can check real-time SLA timers, fulfillment updates, and status for all your submitted housekeeping, maintenance, and dining orders under the "Activity" tab in your portal navigation.',
    keywords: ['status', 'my request', 'track', 'tracking', 'order status', 'request status', 'where is my', 'progress', 'sla'],
    aliases: ['where can I see my current requests', 'track my order', 'is my request finished', 'check maintenance ticket'],
    suggestedAction: {
      label: 'Track My Requests',
      targetTab: 'activity',
    },
    suggestedFollowUps: [
      'Create Maintenance Request',
      'Open Housekeeping Request',
    ],
    source: 'HelpCenterData.ts:node_portal_activity',
    isActive: true,
  },
  {
    id: 'kb_portal_tour',
    category: 'portal_guide',
    topic: 'Interactive App Tour',
    title: 'Portal Interactive Tour',
    question: 'How does this guest app work?',
    answer: 'The Grand ADP Guest Portal gives you instant control over your stay: order 24/7 dining, request room services, toggle digital DND, track requests live, and view your billing folio. Launch our interactive walkthrough anytime from the Home tab.',
    keywords: ['tour', 'guide', 'walkthrough', 'portal', 'app', 'how app works', 'app features', 'instructions', 'help tour'],
    aliases: ['how does this guest app work', 'how does this portal work', 'how does the app work', 'take interactive tour', 'show app guide'],
    suggestedAction: {
      label: 'Take Interactive Tour',
      targetTab: 'home',
      actionType: 'tour',
    },
    suggestedFollowUps: [
      'View My Activity',
      'Explore Dining Menu',
    ],
    source: 'HelpCenterData.ts:node_portal_tour',
    isActive: true,
  },

  // ==========================================
  // 13. FRONT DESK CONTACT INFORMATION
  // ==========================================
  {
    id: 'kb_fd_contact',
    category: 'front_desk',
    topic: 'Contact Front Desk 24/7',
    title: '24/7 Front Desk Messaging & Call',
    question: 'How do I contact Front Desk reception?',
    answer: 'Our Front Desk and Concierge teams are available 24 hours a day, 365 days a year. You can message the on-duty manager instantly via the portal under Services > Front Desk, or dial "0" / "Front Desk" from your in-room telephone. For external calls, dial +91 11 4000 8800.',
    keywords: ['front desk', 'reception', 'receptionist', 'call desk', 'operator', 'agent', 'concierge', 'speak to someone', 'talk to person', 'human', 'duty manager', 'phone'],
    aliases: ['i want to contact reception', 'how to call front desk', 'speak to reception', 'talk to a human'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'View Hotel Overview & Address',
      'Ask about luggage storage',
    ],
    source: 'HelpCenterData.ts:node_fd_message',
    isActive: true,
  },

  // ==========================================
  // 14. OTHER CONFIGURED HOTEL SERVICES
  // ==========================================
  {
    id: 'kb_service_luggage',
    category: 'other_services',
    topic: 'Luggage Storage & Bellhop',
    title: 'Luggage Assistance & Storage',
    question: 'Can I store my luggage before check-in or after checkout?',
    answer: 'Yes! Complimentary secure luggage storage is available 24/7 at the Bellhop Concierge desk in the lobby. If you need a bellhop attendant to assist carrying luggage to or from your suite, message Front Desk or dial 0.',
    keywords: ['luggage', 'baggage', 'bags', 'bellhop', 'porter', 'storage', 'store bags', 'hold luggage'],
    aliases: ['can I leave my bags', 'luggage storage after checkout', 'bellboy assistance'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'What time is checkout?',
      'Airport transfer arrangements',
    ],
    source: 'HelpCenterData.ts:node_fd_concierge',
    isActive: true,
  },
  {
    id: 'kb_service_wakeup',
    category: 'other_services',
    topic: 'Wake-Up Call Service',
    title: 'Automated & Personalized Wake-Up Call',
    question: 'How do I schedule a wake-up call?',
    answer: 'You can schedule a personalized morning wake-up call anytime by messaging Front Desk via Services > Front Desk or dialing extension 0 from your in-room phone with your desired wake-up time.',
    keywords: ['wake up', 'wakeup', 'wake-up call', 'alarm', 'morning call'],
    aliases: ['set an alarm', 'can I get a wakeup call', 'schedule wake up call'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'Breakfast buffet hours',
      'Manage DND status',
    ],
    source: 'HelpCenterData.ts:node_fd_message',
    isActive: true,
  },
  {
    id: 'kb_service_lost_found',
    category: 'other_services',
    topic: 'Lost & Found',
    title: 'Lost & Found Services',
    question: 'I lost an item. Where is Lost and Found?',
    answer: 'All misplaced items found in guest suites or public areas are logged with our 24/7 Security and Front Desk departments. Please message Front Desk with a description of the item, and our team will check the log immediately.',
    keywords: ['lost', 'found', 'misplaced', 'lost item', 'forgot', 'left behind'],
    aliases: ['lost my wallet', 'where is lost and found', 'left something in room'],
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    suggestedFollowUps: [
      'Message Front Desk',
      'Track my requests',
    ],
    source: 'HelpCenterData.ts:node_fd_message',
    isActive: true,
  },
];

/**
 * Knowledge Base Query Helper
 */
export class HotelKnowledgeBase {
  private static entries: HotelKnowledgeEntry[] = [...HOTEL_KNOWLEDGE_ENTRIES];

  public static getAllEntries(): HotelKnowledgeEntry[] {
    return this.entries.filter((e) => e.isActive);
  }

  public static getEntryById(id: string): HotelKnowledgeEntry | undefined {
    return this.entries.find((e) => e.id === id && e.isActive);
  }

  public static getEntriesByCategory(category: KnowledgeCategory): HotelKnowledgeEntry[] {
    return this.entries.filter((e) => e.category === category && e.isActive);
  }

  public static addOrUpdateEntry(entry: HotelKnowledgeEntry): void {
    const idx = this.entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      this.entries[idx] = { ...entry };
    } else {
      this.entries.push({ ...entry });
    }
  }

  public static resetToDefaults(): void {
    this.entries = [...HOTEL_KNOWLEDGE_ENTRIES];
  }
}
