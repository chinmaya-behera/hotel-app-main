export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  rootNodeId: string;
}

export interface HelpOptionChoice {
  id: string;
  label: string;
  description?: string;
  nextNodeId?: string;
  icon?: string;
}

export interface HelpPortalAction {
  label: string;
  targetTab: string;
  targetSubtab?: string;
  prefillCategory?: string;
  actionType?: 'navigate' | 'tour';
}

export interface HelpFlowNode {
  id: string;
  topicId: string;
  title: string;
  message: string;
  choices?: HelpOptionChoice[];
  action?: HelpPortalAction;
  canGoBack?: boolean;
  parentNodeId?: string;
}

export interface HelpFeedbackRecord {
  id: string;
  flowId?: string;
  query?: string;
  helpful: boolean;
  comment?: string;
  createdAt: string;
}

/**
 * 8 Primary Help Topics for The Grand ADP Guest Portal
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'maintenance',
    title: 'Maintenance & Repairs',
    description: 'AC, plumbing, electrical, TV, or Wi-Fi room issues',
    icon: 'Wrench',
    badge: 'Fast response',
    rootNodeId: 'node_maint_root',
  },
  {
    id: 'housekeeping',
    title: 'Housekeeping & Linens',
    description: 'Room cleaning, extra towels, toiletries, or turn-down',
    icon: 'Sparkles',
    badge: 'Popular',
    rootNodeId: 'node_hk_root',
  },
  {
    id: 'dining',
    title: 'Food & In-Room Dining',
    description: 'Menus, breakfast hours, custom orders, or order status',
    icon: 'Utensils',
    badge: '24/7 Service',
    rootNodeId: 'node_dining_root',
  },
  {
    id: 'wellness',
    title: 'Spa & Wellness',
    description: 'Massages, treatments, pool, gym, and sauna hours',
    icon: 'HeartPulse',
    rootNodeId: 'node_spa_root',
  },
  {
    id: 'stay_info',
    title: 'Room & Stay Information',
    description: 'Digital DND, Wi-Fi details, check-out time, house rules',
    icon: 'Info',
    rootNodeId: 'node_stay_root',
  },
  {
    id: 'billing_checkout',
    title: 'Folio, Billing & Checkout',
    description: 'View current charges, download invoice, express check-out',
    icon: 'Receipt',
    rootNodeId: 'node_folio_root',
  },
  {
    id: 'portal_help',
    title: 'Guest Portal Guide',
    description: 'Track requests, manage alerts, or take the interactive tour',
    icon: 'HelpCircle',
    rootNodeId: 'node_portal_root',
  },
  {
    id: 'front_desk',
    title: 'Contact Front Desk',
    description: 'Direct messaging, receptionist call, or urgent assistance',
    icon: 'PhoneCall',
    badge: '24/7 Desk',
    rootNodeId: 'node_fd_root',
  },
];

/**
 * Comprehensive guided flow node tree
 */
export const FLOW_NODES: Record<string, HelpFlowNode> = {
  // ==========================================
  // ROOT WELCOME NODE
  // ==========================================
  node_root: {
    id: 'node_root',
    topicId: 'root',
    title: 'Welcome to Grand ADP Support',
    message: 'Hello! I am your 24/7 Grand ADP Guest Assistant. How can we assist you with your room and stay today? Choose a category below or type your question.',
    choices: HELP_TOPICS.map((topic) => ({
      id: topic.id,
      label: topic.title,
      description: topic.description,
      nextNodeId: topic.rootNodeId,
      icon: topic.icon,
    })),
    canGoBack: false,
  },

  // ==========================================
  // 1. MAINTENANCE & REPAIRS
  // ==========================================
  node_maint_root: {
    id: 'node_maint_root',
    topicId: 'maintenance',
    title: 'Maintenance & Repairs',
    message: 'What kind of maintenance or repair issue can our engineering team fix for you?',
    choices: [
      { id: 'maint_ac', label: 'Air Conditioning / Heating', description: 'Too hot, cold, or noisy AC unit', nextNodeId: 'node_maint_ac' },
      { id: 'maint_plumb', label: 'Plumbing & Water Issues', description: 'Low pressure, leak, or hot water issue', nextNodeId: 'node_maint_plumb' },
      { id: 'maint_elec', label: 'Lighting & Power Outlets', description: 'Light fixture out, outlet not working', nextNodeId: 'node_maint_elec' },
      { id: 'maint_tv', label: 'TV, Media & Wi-Fi', description: 'Television remote, streaming, or connection', nextNodeId: 'node_maint_tv' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_maint_ac: {
    id: 'node_maint_ac',
    topicId: 'maintenance',
    title: 'AC / Climate Control',
    message: 'Our HVAC technicians are available 24/7. Standard room temperature is set to 21°C (70°F). Would you like to submit a priority request for our engineer to inspect your unit?',
    action: {
      label: 'Open AC Maintenance Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Air Conditioning',
    },
    canGoBack: true,
    parentNodeId: 'node_maint_root',
  },
  node_maint_plumb: {
    id: 'node_maint_plumb',
    topicId: 'maintenance',
    title: 'Plumbing & Hot Water',
    message: 'We apologize for the inconvenience. Our on-duty plumbing team handles bathroom, tap, and hot water service within 15–20 minutes.',
    action: {
      label: 'Open Plumbing Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Plumbing',
    },
    canGoBack: true,
    parentNodeId: 'node_maint_root',
  },
  node_maint_elec: {
    id: 'node_maint_elec',
    topicId: 'maintenance',
    title: 'Lighting & Electrical',
    message: 'You can request replacement bulbs, lamp repairs, or electrical outlet inspections. Our engineering team will arrive promptly.',
    action: {
      label: 'Open Electrical Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Electrical / Lighting',
    },
    canGoBack: true,
    parentNodeId: 'node_maint_root',
  },
  node_maint_tv: {
    id: 'node_maint_tv',
    topicId: 'maintenance',
    title: 'TV & Connectivity',
    message: 'Need help pairing your device, replacing TV remote batteries, or troubleshooting internet speed? Our tech team can assist immediately.',
    action: {
      label: 'Open Electronics Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'TV / Wi-Fi',
    },
    canGoBack: true,
    parentNodeId: 'node_maint_root',
  },

  // ==========================================
  // 2. HOUSEKEEPING & LINENS
  // ==========================================
  node_hk_root: {
    id: 'node_hk_root',
    topicId: 'housekeeping',
    title: 'Housekeeping & Linens',
    message: 'What housekeeping services or in-room amenities do you need?',
    choices: [
      { id: 'hk_cleaning', label: 'Room Cleaning & Turn-Down', description: 'Scheduled or immediate refresh', nextNodeId: 'node_hk_cleaning' },
      { id: 'hk_towels', label: 'Fresh Towels & Linens', description: 'Bath towels, extra pillows, duvet', nextNodeId: 'node_hk_towels' },
      { id: 'hk_toiletries', label: 'Toiletries & Dental Kit', description: 'Shampoo, conditioner, soap, shaving kit', nextNodeId: 'node_hk_toiletries' },
      { id: 'hk_trash', label: 'Trash Collection', description: 'Bin clearing and tidy up', nextNodeId: 'node_hk_trash' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_hk_cleaning: {
    id: 'node_hk_cleaning',
    topicId: 'housekeeping',
    title: 'Room Cleaning Service',
    message: 'Standard daily housekeeping is conducted between 9:00 AM and 3:00 PM. You can schedule an immediate refresh or choose a preferred time slot.',
    action: {
      label: 'Schedule Room Cleaning',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Room Cleaning',
    },
    canGoBack: true,
    parentNodeId: 'node_hk_root',
  },
  node_hk_towels: {
    id: 'node_hk_towels',
    topicId: 'housekeeping',
    title: 'Towels & Linens',
    message: 'We provide plush Egyptian cotton bath sheets, hand towels, bathrobes, and extra pillows upon request. Delivered in 10–15 minutes.',
    action: {
      label: 'Request Towels & Linens',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Towels & Linens',
    },
    canGoBack: true,
    parentNodeId: 'node_hk_root',
  },
  node_hk_toiletries: {
    id: 'node_hk_toiletries',
    topicId: 'housekeeping',
    title: 'Toiletries & Amenities',
    message: 'Need additional luxury bath amenities, shaving kits, toothbrushes, vanity packs, or sewing sets? Tap below to select your items.',
    action: {
      label: 'Request Bath Amenities',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Toiletries',
    },
    canGoBack: true,
    parentNodeId: 'node_hk_root',
  },
  node_hk_trash: {
    id: 'node_hk_trash',
    topicId: 'housekeeping',
    title: 'Trash Collection',
    message: 'Our housekeeping attendant will come by to empty bins and remove discarded packaging immediately.',
    action: {
      label: 'Request Trash Collection',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Trash Pickup',
    },
    canGoBack: true,
    parentNodeId: 'node_hk_root',
  },

  // ==========================================
  // 3. FOOD & IN-ROOM DINING
  // ==========================================
  node_dining_root: {
    id: 'node_dining_root',
    topicId: 'dining',
    title: 'Food & In-Room Dining',
    message: 'Our executive culinary team is at your service 24 hours a day. How can we delight your palate?',
    choices: [
      { id: 'dining_menu', label: 'Browse In-Room Dining Menu', description: 'Over 40 gourmet dishes & beverages', nextNodeId: 'node_dining_menu' },
      { id: 'dining_breakfast', label: 'Breakfast Hours & Buffet', description: 'Morning timings and dining locations', nextNodeId: 'node_dining_breakfast' },
      { id: 'dining_dietary', label: 'Custom Dish & Dietary Needs', description: 'Gluten-free, vegan, Jain, or allergen requests', nextNodeId: 'node_dining_dietary' },
      { id: 'dining_status', label: 'Track Existing Food Order', description: 'Kitchen preparation and delivery status', nextNodeId: 'node_dining_status' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_dining_menu: {
    id: 'node_dining_menu',
    topicId: 'dining',
    title: 'In-Room Dining Menu',
    message: 'Explore our full menu featuring Indian specialties, Continental mains, woodfired pizzas, desserts, and signature beverages. Average delivery time is 25–35 minutes.',
    action: {
      label: 'Open In-Room Dining Menu',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    canGoBack: true,
    parentNodeId: 'node_dining_root',
  },
  node_dining_breakfast: {
    id: 'node_dining_breakfast',
    topicId: 'dining',
    title: 'Breakfast Timings',
    message: 'Complimentary buffet breakfast is served daily from 6:30 AM to 10:30 AM at "The Palm Court" (1st Floor). You can also order breakfast to your room from our In-Room Dining menu.',
    action: {
      label: 'View Dining Options',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    canGoBack: true,
    parentNodeId: 'node_dining_root',
  },
  node_dining_dietary: {
    id: 'node_dining_dietary',
    topicId: 'dining',
    title: 'Special Dietary Requests',
    message: 'Our chefs cater to all special dietary requirements including gluten-free, vegan, kosher, and allergen-safe meals. You can send custom cooking instructions directly to our kitchen.',
    action: {
      label: 'Request Custom Dish',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    canGoBack: true,
    parentNodeId: 'node_dining_root',
  },
  node_dining_status: {
    id: 'node_dining_status',
    topicId: 'dining',
    title: 'Order Status',
    message: 'You can check real-time progress for all active dining orders and service tickets in the My Activity section.',
    action: {
      label: 'Track My Activity',
      targetTab: 'activity',
    },
    canGoBack: true,
    parentNodeId: 'node_dining_root',
  },

  // ==========================================
  // 4. SPA & WELLNESS
  // ==========================================
  node_spa_root: {
    id: 'node_spa_root',
    topicId: 'wellness',
    title: 'Spa & Wellness',
    message: 'Indulge in holistic rejuvenation at the "Aura Spa & Wellness Center". What would you like to know?',
    choices: [
      { id: 'spa_treatments', label: 'Spa Treatments & Massages', description: 'Swedish, Deep Tissue, Ayurvedic rituals', nextNodeId: 'node_spa_treatments' },
      { id: 'spa_pool', label: 'Pool & Fitness Center Timings', description: 'Infinity pool and 24/7 fitness gym', nextNodeId: 'node_spa_pool' },
      { id: 'spa_sauna', label: 'Sauna & Steam Bath', description: 'Complimentary for resident guests', nextNodeId: 'node_spa_sauna' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_spa_treatments: {
    id: 'node_spa_treatments',
    topicId: 'wellness',
    title: 'Spa Treatments',
    message: 'Aura Spa is open daily from 8:00 AM to 9:00 PM. Prior booking is recommended for single and couples therapeutic treatments.',
    action: {
      label: 'Explore Spa & Wellness',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    canGoBack: true,
    parentNodeId: 'node_spa_root',
  },
  node_spa_pool: {
    id: 'node_spa_pool',
    topicId: 'wellness',
    title: 'Pool & Gym Facilities',
    message: '• Infinity Pool (Level 3): 6:00 AM – 8:00 PM daily.\n• Fitness Studio (Level 3): Open 24/7 with room key card access.\nTowels and bottled water are provided at the wellness desk.',
    action: {
      label: 'View Wellness Services',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    canGoBack: true,
    parentNodeId: 'node_spa_root',
  },
  node_spa_sauna: {
    id: 'node_spa_sauna',
    topicId: 'wellness',
    title: 'Sauna & Steam Room',
    message: 'The steam and cedar sauna are located inside the Aura Spa locker rooms, open 7:00 AM – 9:00 PM. No advance booking required.',
    action: {
      label: 'View Spa Services',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    canGoBack: true,
    parentNodeId: 'node_spa_root',
  },

  // ==========================================
  // 5. ROOM & STAY INFORMATION
  // ==========================================
  node_stay_root: {
    id: 'node_stay_root',
    topicId: 'stay_info',
    title: 'Room & Stay Information',
    message: 'Here you can access essential room features, check-out details, and hotel policies.',
    choices: [
      { id: 'stay_dnd', label: 'Digital Do Not Disturb (DND)', description: 'Turn on/off digital privacy guard', nextNodeId: 'node_stay_dnd' },
      { id: 'stay_wifi', label: 'Wi-Fi Connection & Details', description: 'Network credentials and support', nextNodeId: 'node_stay_wifi' },
      { id: 'stay_checkout', label: 'Check-out Policy & Late Departure', description: 'Check-out hours and luggage hold', nextNodeId: 'node_stay_checkout' },
      { id: 'stay_summary', label: 'View Full Stay Information', description: 'Dates, guest count, and room specs', nextNodeId: 'node_stay_summary' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_stay_dnd: {
    id: 'node_stay_dnd',
    topicId: 'stay_info',
    title: 'Digital Do Not Disturb',
    message: 'Activating Digital DND alerts our housekeeping, butler, and front desk teams not to ring your chime or knock on your door until you turn it off.',
    action: {
      label: 'Manage DND Status',
      targetTab: 'services',
      targetSubtab: 'dnd',
    },
    canGoBack: true,
    parentNodeId: 'node_stay_root',
  },
  node_stay_wifi: {
    id: 'node_stay_wifi',
    topicId: 'stay_info',
    title: 'High-Speed Guest Wi-Fi',
    message: '• Network: TheGrandADP-Guest\n• Room: Enter your 3-digit room number\n• Password: grandguest\nEnjoy unlimited high-speed fiber internet up to 300 Mbps.',
    action: {
      label: 'View Profile & Stay',
      targetTab: 'profile',
      targetSubtab: 'stay',
    },
    canGoBack: true,
    parentNodeId: 'node_stay_root',
  },
  node_stay_checkout: {
    id: 'node_stay_checkout',
    topicId: 'stay_info',
    title: 'Check-out Policy',
    message: 'Standard check-out time is 11:00 AM. If you require a complimentary 1-hour extension or wish to store luggage after departure, our Front Desk will gladly assist.',
    action: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    canGoBack: true,
    parentNodeId: 'node_stay_root',
  },
  node_stay_summary: {
    id: 'node_stay_summary',
    topicId: 'stay_info',
    title: 'Stay Summary',
    message: 'Review your check-in date, scheduled departure, room category, and registered guest information in your Profile.',
    action: {
      label: 'Open Stay Details',
      targetTab: 'profile',
      targetSubtab: 'stay',
    },
    canGoBack: true,
    parentNodeId: 'node_stay_root',
  },

  // ==========================================
  // 6. FOLIO, BILLING & CHECKOUT
  // ==========================================
  node_folio_root: {
    id: 'node_folio_root',
    topicId: 'billing_checkout',
    title: 'Folio, Billing & Checkout',
    message: 'Review itemized room charges, dining tabs, taxes, and complete express digital check-out.',
    choices: [
      { id: 'folio_charges', label: 'View Itemized Folio & Charges', description: 'Review real-time room bill', nextNodeId: 'node_folio_charges' },
      { id: 'folio_express', label: 'Express Digital Checkout', description: 'Settle bill and depart seamlessly', nextNodeId: 'node_folio_express' },
      { id: 'folio_dispute', label: 'Query a Charge or Tariff', description: 'Speak to billing specialist', nextNodeId: 'node_folio_dispute' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_folio_charges: {
    id: 'node_folio_charges',
    topicId: 'billing_checkout',
    title: 'Itemized Folio',
    message: 'Your digital folio updates in real time whenever dining, mini-bar, spa, or incidental charges occur. You can inspect all items directly.',
    action: {
      label: 'View Folio & Billing',
      targetTab: 'profile',
      targetSubtab: 'folio',
    },
    canGoBack: true,
    parentNodeId: 'node_folio_root',
  },
  node_folio_express: {
    id: 'node_folio_express',
    topicId: 'billing_checkout',
    title: 'Express Checkout',
    message: 'Avoid lines at the front desk! You can review your final balance, confirm payment, and leave your key card in the room upon departure.',
    action: {
      label: 'Review Bill & Checkout',
      targetTab: 'profile',
      targetSubtab: 'folio',
    },
    canGoBack: true,
    parentNodeId: 'node_folio_root',
  },
  node_folio_dispute: {
    id: 'node_folio_dispute',
    topicId: 'billing_checkout',
    title: 'Billing Inquiry',
    message: 'If you notice an unexpected charge or need corporate tax invoice GST details, our Front Desk billing team is here to assist.',
    action: {
      label: 'Message Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    canGoBack: true,
    parentNodeId: 'node_folio_root',
  },

  // ==========================================
  // 7. GUEST PORTAL GUIDE
  // ==========================================
  node_portal_root: {
    id: 'node_portal_root',
    topicId: 'portal_help',
    title: 'Guest Portal Guide',
    message: 'Need help finding features or tracking your active requests in the portal?',
    choices: [
      { id: 'portal_activity', label: 'Track My Active Requests', description: 'Live status of housekeeping and dining', nextNodeId: 'node_portal_activity' },
      { id: 'portal_notifications', label: 'Notifications & Hotel Alerts', description: 'Broadcasts and direct messages', nextNodeId: 'node_portal_notifications' },
      { id: 'portal_tour', label: 'Take App Interactive Tour', description: 'Guided walkthrough of portal buttons', nextNodeId: 'node_portal_tour' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_portal_activity: {
    id: 'node_portal_activity',
    topicId: 'portal_help',
    title: 'Track Service Requests',
    message: 'The My Activity section shows real-time progress for all your submitted service requests, wakeup alarms, and custom orders.',
    action: {
      label: 'Go to My Activity',
      targetTab: 'activity',
    },
    canGoBack: true,
    parentNodeId: 'node_portal_root',
  },
  node_portal_notifications: {
    id: 'node_portal_notifications',
    topicId: 'portal_help',
    title: 'Notifications Hub',
    message: 'Stay informed on safety advisories, event announcements, and concierge messages in the Notifications Hub.',
    action: {
      label: 'View Notifications Hub',
      targetTab: 'notifications',
    },
    canGoBack: true,
    parentNodeId: 'node_portal_root',
  },
  node_portal_tour: {
    id: 'node_portal_tour',
    topicId: 'portal_help',
    title: 'Interactive App Tour',
    message: 'We can walk you through the top features of our digital portal, including service orders, quick shortcuts, and folio management.',
    action: {
      label: 'Start Interactive Tour',
      targetTab: 'home',
      actionType: 'tour',
    },
    canGoBack: true,
    parentNodeId: 'node_portal_root',
  },

  // ==========================================
  // 8. CONTACT FRONT DESK
  // ==========================================
  node_fd_root: {
    id: 'node_fd_root',
    topicId: 'front_desk',
    title: 'Contact Front Desk',
    message: 'Our Front Desk and Concierge teams are available 24 hours a day to assist with any special requirements, bookings, or inquiries.',
    choices: [
      { id: 'fd_message', label: 'Send Direct Message to Desk', description: 'Live chat with on-duty duty manager', nextNodeId: 'node_fd_message' },
      { id: 'fd_call', label: 'Call Reception / Extension', description: 'Dial 0 from room telephone', nextNodeId: 'node_fd_call' },
      { id: 'fd_concierge', label: 'Luggage & Concierge Services', description: 'Airport transfers, cab booking, city tours', nextNodeId: 'node_fd_concierge' },
    ],
    canGoBack: true,
    parentNodeId: 'node_root',
  },
  node_fd_message: {
    id: 'node_fd_message',
    topicId: 'front_desk',
    title: 'Message Front Desk',
    message: 'Type a message directly to our Front Desk desk agents. We respond within 2 minutes for all stay inquiries.',
    action: {
      label: 'Open Front Desk Chat',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    canGoBack: true,
    parentNodeId: 'node_fd_root',
  },
  node_fd_call: {
    id: 'node_fd_call',
    topicId: 'front_desk',
    title: 'Phone Reception',
    message: 'You can pick up your in-room landline telephone and press "0" or "Front Desk". For external calls or WhatsApp concierge, please contact +91 11 4000 8800.',
    action: {
      label: 'Message Front Desk Instead',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    canGoBack: true,
    parentNodeId: 'node_fd_root',
  },
  node_fd_concierge: {
    id: 'node_fd_concierge',
    topicId: 'front_desk',
    title: 'Concierge & Travel',
    message: 'Our Concierge desk can arrange luxury airport shuttles, taxi bookings, local city sightseeing tours, and restaurant reservations.',
    action: {
      label: 'Open Concierge Services',
      targetTab: 'services',
      targetSubtab: 'concierge',
    },
    canGoBack: true,
    parentNodeId: 'node_fd_root',
  },
};

/**
 * Keyword / Alias resolution rules for natural language questions
 */
export interface KeywordResolutionRule {
  keywords: string[];
  nodeId: string;
  topicId: string;
  suggestedAction: HelpPortalAction;
  matchScore: number;
}

export const KEYWORD_RULES: KeywordResolutionRule[] = [
  // AC / HVAC / Temperature
  {
    keywords: ['ac', 'air condition', 'air conditioning', 'cooling', 'hvac', 'thermostat', 'hot in room', 'cold in room', 'heating', 'temperature'],
    nodeId: 'node_maint_ac',
    topicId: 'maintenance',
    suggestedAction: {
      label: 'Open AC Maintenance Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Air Conditioning',
    },
    matchScore: 10,
  },
  // Plumbing / Water / Leaks
  {
    keywords: ['leak', 'plumb', 'plumbing', 'toilet', 'tap', 'sink', 'shower', 'drain', 'water', 'hot water', 'flush', 'clogged'],
    nodeId: 'node_maint_plumb',
    topicId: 'maintenance',
    suggestedAction: {
      label: 'Open Plumbing Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Plumbing',
    },
    matchScore: 10,
  },
  // Lighting / Electrical
  {
    keywords: ['light', 'bulb', 'lamp', 'electricity', 'socket', 'plug', 'switch', 'dark', 'power outlet'],
    nodeId: 'node_maint_elec',
    topicId: 'maintenance',
    suggestedAction: {
      label: 'Open Electrical Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'Electrical / Lighting',
    },
    matchScore: 10,
  },
  // TV / Electronics / Remote
  {
    keywords: ['tv', 'television', 'remote', 'channel', 'hdmi', 'streaming', 'netflix', 'cable'],
    nodeId: 'node_maint_tv',
    topicId: 'maintenance',
    suggestedAction: {
      label: 'Open Electronics Request',
      targetTab: 'services',
      targetSubtab: 'maintenance',
      prefillCategory: 'TV / Wi-Fi',
    },
    matchScore: 10,
  },
  // Towels & Linens
  {
    keywords: ['towel', 'towels', 'bathrobe', 'linen', 'linens', 'bedsheet', 'sheet', 'pillow', 'blanket', 'duvet'],
    nodeId: 'node_hk_towels',
    topicId: 'housekeeping',
    suggestedAction: {
      label: 'Request Towels & Linens',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Towels & Linens',
    },
    matchScore: 10,
  },
  // Room Cleaning
  {
    keywords: ['clean', 'cleaning', 'sweep', 'mop', 'housekeeping', 'make bed', 'tidy', 'dirty room'],
    nodeId: 'node_hk_cleaning',
    topicId: 'housekeeping',
    suggestedAction: {
      label: 'Schedule Room Cleaning',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Room Cleaning',
    },
    matchScore: 10,
  },
  // Toiletries
  {
    keywords: ['toiletries', 'soap', 'shampoo', 'conditioner', 'body wash', 'lotion', 'dental kit', 'toothbrush', 'paste', 'shaving', 'razor', 'comb'],
    nodeId: 'node_hk_toiletries',
    topicId: 'housekeeping',
    suggestedAction: {
      label: 'Request Bath Amenities',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Toiletries',
    },
    matchScore: 10,
  },
  // Trash / Garbage
  {
    keywords: ['trash', 'garbage', 'rubbish', 'bin', 'dustbin', 'waste'],
    nodeId: 'node_hk_trash',
    topicId: 'housekeeping',
    suggestedAction: {
      label: 'Request Trash Collection',
      targetTab: 'services',
      targetSubtab: 'housekeeping',
      prefillCategory: 'Trash Pickup',
    },
    matchScore: 10,
  },
  // Food & Dining / Menu
  {
    keywords: ['food', 'dining', 'dinner', 'lunch', 'eat', 'hungry', 'menu', 'meal', 'order food', 'room service', 'pizza', 'curry', 'drink', 'beverage', 'water bottle'],
    nodeId: 'node_dining_menu',
    topicId: 'dining',
    suggestedAction: {
      label: 'Open In-Room Dining Menu',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    matchScore: 10,
  },
  // Breakfast
  {
    keywords: ['breakfast', 'morning buffet', 'buffet time', 'breakfast hour'],
    nodeId: 'node_dining_breakfast',
    topicId: 'dining',
    suggestedAction: {
      label: 'View Dining Options',
      targetTab: 'services',
      targetSubtab: 'dining',
    },
    matchScore: 10,
  },
  // Spa & Treatments
  {
    keywords: ['spa', 'massage', 'facial', 'ayurveda', 'treatment', 'wellness', 'relaxation'],
    nodeId: 'node_spa_treatments',
    topicId: 'wellness',
    suggestedAction: {
      label: 'Explore Spa & Wellness',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    matchScore: 10,
  },
  // Pool & Gym
  {
    keywords: ['pool', 'swimming', 'swim', 'gym', 'fitness', 'workout', 'exercise', 'treadmill'],
    nodeId: 'node_spa_pool',
    topicId: 'wellness',
    suggestedAction: {
      label: 'View Wellness Services',
      targetTab: 'services',
      targetSubtab: 'spa',
    },
    matchScore: 10,
  },
  // Wi-Fi
  {
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'password', 'connect', 'speed'],
    nodeId: 'node_stay_wifi',
    topicId: 'stay_info',
    suggestedAction: {
      label: 'View Profile & Stay',
      targetTab: 'profile',
      targetSubtab: 'stay',
    },
    matchScore: 10,
  },
  // DND / Do Not Disturb
  {
    keywords: ['dnd', 'do not disturb', 'privacy', 'quiet', 'do not enter', 'dont disturb'],
    nodeId: 'node_stay_dnd',
    topicId: 'stay_info',
    suggestedAction: {
      label: 'Manage DND Status',
      targetTab: 'services',
      targetSubtab: 'dnd',
    },
    matchScore: 10,
  },
  // Checkout & Departure
  {
    keywords: ['checkout', 'check out', 'check-out', 'departure', 'leave', 'late checkout', 'extend stay', 'luggage'],
    nodeId: 'node_stay_checkout',
    topicId: 'stay_info',
    suggestedAction: {
      label: 'Contact Front Desk',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    matchScore: 10,
  },
  // Bill / Folio / Invoice
  {
    keywords: ['bill', 'billing', 'folio', 'invoice', 'receipt', 'charge', 'charges', 'statement', 'cost', 'tariff', 'tax', 'gst'],
    nodeId: 'node_folio_charges',
    topicId: 'billing_checkout',
    suggestedAction: {
      label: 'View Folio & Billing',
      targetTab: 'profile',
      targetSubtab: 'folio',
    },
    matchScore: 10,
  },
  // Request tracking
  {
    keywords: ['status', 'my request', 'track', 'tracking', 'order status', 'request status', 'where is my'],
    nodeId: 'node_portal_activity',
    topicId: 'portal_help',
    suggestedAction: {
      label: 'Go to My Activity',
      targetTab: 'activity',
    },
    matchScore: 10,
  },
  // Notifications & alerts
  {
    keywords: ['notification', 'notifications', 'alert', 'alerts', 'announcement', 'emergency', 'broadcast'],
    nodeId: 'node_portal_notifications',
    topicId: 'portal_help',
    suggestedAction: {
      label: 'View Notifications Hub',
      targetTab: 'notifications',
    },
    matchScore: 10,
  },
  // Front Desk / Reception / Speak to human
  {
    keywords: ['front desk', 'reception', 'receptionist', 'call desk', 'operator', 'agent', 'concierge', 'speak to someone', 'talk to person', 'human'],
    nodeId: 'node_fd_message',
    topicId: 'front_desk',
    suggestedAction: {
      label: 'Open Front Desk Chat',
      targetTab: 'services',
      targetSubtab: 'front_desk',
    },
    matchScore: 10,
  },
];
