export interface EventCategoryItem {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  image: string;
  startingPrice: number;
  popular?: boolean;
  suggestedVenues: string[];
}

export interface DecorThemeOption {
  id: string;
  name: string;
  desc: string;
  image: string;
  palette: string[]; // Color hex values for preview dots
  addedPrice: number;
}

export interface CateringStyleOption {
  id: string;
  name: string;
  desc: string;
  pricePerPlate: number;
}

export interface EventAddOnOption {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export const DEFAULT_EVENTS_CARD_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80';

export const EVENT_CATEGORIES: EventCategoryItem[] = [
  {
    id: 'birthday',
    name: 'Birthday Celebration',
    tagline: 'Make birthdays unforgettable',
    desc: 'Themed balloon styling, designer party cake, banquet sound system & personalized birthday dining.',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    startingPrice: 15000,
    popular: true,
    suggestedVenues: ['Grand Ballroom', 'Poolside Pavilion', 'Skyline Terrace', 'Private Suite'],
  },
  {
    id: 'wedding',
    name: 'Wedding & Sangeet',
    tagline: 'The royal wedding of your dreams',
    desc: 'Opulent mandap & stage decor, crystal chandeliers, royal multi-cuisine banquet & bridal concierge.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    startingPrice: 150000,
    popular: true,
    suggestedVenues: ['Grand Imperial Ballroom', 'Royal Palms Lawn', 'Palace Banquet Hall'],
  },
  {
    id: 'anniversary',
    name: 'Anniversary Gala',
    tagline: 'Celebrate enduring love',
    desc: 'Romantic candlelight setup, champagne toast, bespoke floral canopy & violinist accompaniment.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    startingPrice: 18000,
    popular: true,
    suggestedVenues: ['Skyline Terrace', 'Poolside Lawn', 'Grand Imperial Ballroom'],
  },
  {
    id: 'engagement',
    name: 'Engagement Ceremony & Proposal',
    tagline: 'A sparkling beginning to forever',
    desc: 'Bespoke ring ceremony backdrop, floral photo walls, welcome mocktails & elegant appetizers.',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    startingPrice: 45000,
    suggestedVenues: ['Crystal Banquet Hall', 'Skyline Terrace', 'Grand Ballroom'],
  },
  {
    id: 'pooja',
    name: 'Pooja & Religious Ceremonies',
    tagline: 'Sacred blessings in tranquility',
    desc: 'Traditional marigold rangoli, havan setup, brass oil lamps, priest coordination & satvik feast.',
    image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
    startingPrice: 20000,
    suggestedVenues: ['Temple Courtyard', 'Heritage Banquet Hall', 'Garden Pavilion'],
  },
  {
    id: 'baby_shower',
    name: 'Baby Shower & Mom-to-Be',
    tagline: 'Shower love on the new arrival',
    desc: 'Pastel balloon clouds, custom welcome board, mom-to-be throne, dessert table & high tea.',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80',
    startingPrice: 22000,
    popular: true,
    suggestedVenues: ['Crystal Banquet Suite', 'Skyline Rooftop Terrace', 'Poolside Pavilion'],
  },
  {
    id: 'corporate_events',
    name: 'Corporate Events & Summits',
    tagline: 'Professional excellence & banqueting',
    desc: 'High-definition 4K AV projectors, seamless conference Wi-Fi, executive luncheons & gala dinners.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    startingPrice: 35000,
    popular: true,
    suggestedVenues: ['Executive Conference Center', 'Grand Ballroom', 'Boardroom Suite'],
  },
  {
    id: 'family_functions',
    name: 'Family Functions & Reunions',
    tagline: 'Cherished moments with family',
    desc: 'Multi-generational banquets, interactive live food stations, photo memory booths & music setups.',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    startingPrice: 25000,
    suggestedVenues: ['Grand Ballroom', 'Poolside Pavilion', 'Dining Banquet Hall'],
  },
  {
    id: 'social_events',
    name: 'Social Events & Cocktail Soirée',
    tagline: 'Glamorous evenings & chic gatherings',
    desc: 'Cocktail lounge setups, mixologist bar stations, ambient intelligent uplighting & finger food canapés.',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
    startingPrice: 30000,
    suggestedVenues: ['Skyline Rooftop Lounge', 'Poolside Deck', 'Crystal Lounge'],
  },
];

/** Event-Specific Visual Decoration Themes with Color Palettes */
export const EVENT_SPECIFIC_THEMES: Record<string, DecorThemeOption[]> = {
  birthday: [
    {
      id: 'bday_glam',
      name: 'Elegant Birthday Glamour',
      desc: 'Gold, black & champagne luxury styling, velvet table runners, crystal chandeliers & warm ambient lighting.',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
      palette: ['#EAB308', '#0F172A', '#F8FAFC', '#FBBF24'],
      addedPrice: 12000,
    },
    {
      id: 'bday_balloon',
      name: 'Balloon Canopy & Shimmer Arch',
      desc: 'Organic balloon garland, metallic shimmer sequin backdrop, custom neon sign & confetti pedestals.',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
      palette: ['#EC4899', '#8B5CF6', '#F59E0B', '#38BDF8'],
      addedPrice: 9000,
    },
    {
      id: 'bday_pastel',
      name: 'Pastel Dream & Fairy Lights',
      desc: 'Blush pink, mint & lavender silk drapes, magical fairy light canopy, floating orbs & acrylic pedestals.',
      image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80',
      palette: ['#F472B6', '#C084FC', '#67E8F9', '#FEF08A'],
      addedPrice: 10000,
    },
    {
      id: 'bday_floral',
      name: 'Floral Garden Birthday',
      desc: 'Botanical foliage, peach & white English garden roses, rustic flower cart & circular floral ring.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
      palette: ['#10B981', '#F43F5E', '#FED7AA', '#FFFFFF'],
      addedPrice: 14000,
    },
    {
      id: 'bday_luxury',
      name: 'Luxury Milestone Gala',
      desc: 'Giant marquee light-up age numbers, VIP red carpet entry, mirrored dance floor & champagne tower.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      palette: ['#D97706', '#1E1B4B', '#F1F5F9', '#B45309'],
      addedPrice: 18000,
    },
    {
      id: 'bday_kids',
      name: 'Kids Cartoon & Adventure Party',
      desc: 'Themed animated character backdrops, interactive game area, balloon sculptures & colorful party props.',
      image: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=600&q=80',
      palette: ['#EF4444', '#3B82F6', '#FBBF24', '#10B981'],
      addedPrice: 11000,
    },
    {
      id: 'bday_surprise',
      name: 'Intimate Surprise Suite Setup',
      desc: 'Romantic candlelight, helium ceiling balloons with photo cards, rose petals & personalized celebration cake.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
      palette: ['#BE123C', '#F43F5E', '#FDE047', '#18181B'],
      addedPrice: 8000,
    },
  ],

  wedding: [
    {
      id: 'wed_royal',
      name: 'Royal Palace Mandap Grandeur',
      desc: 'Hand-carved pillars, crimson silk drapes, antique brass urulis, traditional floral chandeliers & royal throne.',
      image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
      palette: ['#991B1B', '#D97706', '#FEF08A', '#78350F'],
      addedPrice: 45000,
    },
    {
      id: 'wed_floral',
      name: 'Grand Floral Extravaganza',
      desc: 'Lush imported Dutch roses, cascading white orchids, hydrangea stage wall & flower petal aisle runner.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      palette: ['#FB7185', '#F43F5E', '#FFFFFF', '#15803D'],
      addedPrice: 60000,
    },
    {
      id: 'wed_crystal',
      name: 'Luxury Crystal & Starlight Canopy',
      desc: 'Swarovski crystal hangings, starlight ceiling canopy, mirrored ramp & warm golden illumination.',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
      palette: ['#F8FAFC', '#E2E8F0', '#F59E0B', '#0F172A'],
      addedPrice: 50000,
    },
    {
      id: 'wed_minimal',
      name: 'Minimal Modern Contemporary Wedding',
      desc: 'Clean geometric arches, acrylic pedestals, sage & champagne dried florals & architectural lighting.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
      palette: ['#84CC16', '#E2E8F0', '#FCD34D', '#334155'],
      addedPrice: 35000,
    },
    {
      id: 'wed_garden',
      name: 'Romantic Lawn & Garden Wedding',
      desc: 'Open-air canopy with fairy light trees, rustic wooden pergola, botanical greens & hanging glass lanterns.',
      image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80',
      palette: ['#047857', '#FED7AA', '#FFFFFF', '#92400E'],
      addedPrice: 40000,
    },
    {
      id: 'wed_sangeet',
      name: 'Vibrant Sangeet & Mehendi Mela',
      desc: 'Festive Rajasthani umbrellas, colorful dhol stage, marigold arches, neon dance floor & cozy diwan seating.',
      image: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=600&q=80',
      palette: ['#D946EF', '#F97316', '#FACC15', '#06B6D4'],
      addedPrice: 38000,
    },
  ],

  anniversary: [
    {
      id: 'anniv_candle',
      name: 'Romantic Candlelight & Roses',
      desc: '100+ pillar candles, floating lanterns, red rose petal carpet & intimate curtained cabana.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
      palette: ['#BE123C', '#F43F5E', '#FDE047', '#1E293B'],
      addedPrice: 15000,
    },
    {
      id: 'anniv_floral',
      name: 'Bespoke Floral Romance',
      desc: 'Peach garden roses, white Casablanca lilies, champagne sheer drapes & golden candelabras.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
      palette: ['#FB7185', '#FDE68A', '#F8FAFC', '#B45309'],
      addedPrice: 14000,
    },
    {
      id: 'anniv_gold',
      name: 'Luxury Silver & Golden Jubilee',
      desc: 'Gilded arch, metallic gold charger plates, crystal stemware, custom years-together monogram & photo easel.',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
      palette: ['#EAB308', '#CA8A04', '#F1F5F9', '#0F172A'],
      addedPrice: 16000,
    },
    {
      id: 'anniv_classic',
      name: 'Classic Red & White Harmony',
      desc: 'Heart-shaped red rose floral wall, draped white satin, personalized memory cards & violin serenader.',
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
      palette: ['#991B1B', '#FFFFFF', '#F87171', '#334155'],
      addedPrice: 13000,
    },
    {
      id: 'anniv_garden',
      name: 'Moonlit Terrace Romance',
      desc: 'Open rooftop skyline table, illuminated fairy canopy, acoustic jazz ambient sound & vintage wine cart.',
      image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
      palette: ['#065F46', '#FDE047', '#E0E7FF', '#111827'],
      addedPrice: 15000,
    },
  ],

  engagement: [
    {
      id: 'eng_rose_neon',
      name: 'Romantic Rose & Neon "Forever"',
      desc: 'Giant LED neon "Marry Me" or "Forever" sign, circular red rose floral ring & candlelit walkway.',
      image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80',
      palette: ['#E11D48', '#FDA4AF', '#FACC15', '#09090B'],
      addedPrice: 20000,
    },
    {
      id: 'eng_floral_arch',
      name: 'Floral Elegance & Crystal Arch',
      desc: 'Full circular floral arch with hydrangeas & roses, glass hurricane candle holders & acrylic plinths.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
      palette: ['#EC4899', '#FDE68A', '#FFFFFF', '#64748B'],
      addedPrice: 18000,
    },
    {
      id: 'eng_skyline',
      name: 'Luxury Skyline Sunset Proposal',
      desc: 'Private rooftop glass deck, panoramic twilight view, acoustic guitarist & chilled champagne setup.',
      image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80',
      palette: ['#EA580C', '#FBBF24', '#6366F1', '#030712'],
      addedPrice: 25000,
    },
    {
      id: 'eng_gazebo',
      name: 'Candlelight Gazebo Romance',
      desc: 'Private draped poolside gazebo, cold pyro spark fountains upon ring reveal & velvet ring pedestal.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
      palette: ['#BE123C', '#FEF08A', '#F8FAFC', '#18181B'],
      addedPrice: 22000,
    },
  ],

  pooja: [
    {
      id: 'pooja_temple',
      name: 'Traditional Temple Sanctum',
      desc: 'Sacred brass nilavilakku lamps, fresh marigold torans, raw silk backdrop & traditional rangoli design.',
      image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80',
      palette: ['#D97706', '#DC2626', '#FEF08A', '#78350F'],
      addedPrice: 12000,
    },
    {
      id: 'pooja_marigold',
      name: 'Fresh Marigold & Mogra Radiance',
      desc: 'Golden marigold garlands, fragrant jasmine/mogra strings, brass urlis with floating lotus & incense.',
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80',
      palette: ['#EAB308', '#FFFFFF', '#F97316', '#15803D'],
      addedPrice: 10000,
    },
    {
      id: 'pooja_vedic',
      name: 'Simple & Serene Vedic Elegance',
      desc: 'Pure white linen floor seating with silk bolsters, copper havan kund, sacred banana leaves & wooden bajots.',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      palette: ['#FFFFFF', '#EA580C', '#FEF3C7', '#B45309'],
      addedPrice: 8000,
    },
    {
      id: 'pooja_grand',
      name: 'Grand Festive Altar Celebration',
      desc: 'Carved temple mandap backdrop, velvet floor gaddis, brass bell canopy, elaborate floral altar & diya wall.',
      image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80',
      palette: ['#B91C1C', '#EAB308', '#7C2D12', '#FDE047'],
      addedPrice: 16000,
    },
  ],

  baby_shower: [
    {
      id: 'baby_pastel',
      name: 'Pastel Dream Floral & Cloud',
      desc: 'Blush pink, baby blue & ivory organic balloon clouds, acrylic welcome board & fresh baby-breath florals.',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
      palette: ['#F472B6', '#60A5FA', '#FEF3C7', '#FFFFFF'],
      addedPrice: 12000,
    },
    {
      id: 'baby_teddy',
      name: 'Teddy Bear & Whimsical Cloud',
      desc: 'Life-sized plush teddy bears, caramel & beige balloon garland, custom wooden signage & cozy crib display.',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80',
      palette: ['#B45309', '#FDE68A', '#FEF3C7', '#78350F'],
      addedPrice: 14000,
    },
    {
      id: 'baby_botanical',
      name: 'Botanical Sage & "Baby in Bloom"',
      desc: 'Eucalyptus foliage, sage green & gold accents, "Baby in Bloom" neon sign & wicker peacock chair for mom-to-be.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      palette: ['#059669', '#FDE047', '#E5E7EB', '#064E3B'],
      addedPrice: 13000,
    },
    {
      id: 'baby_prince',
      name: 'Royal Prince & Princess Suite',
      desc: 'Royal blue & blush pink velvet backdrop, golden crowns, personalized cake pedestal & royal throne seating.',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
      palette: ['#1D4ED8', '#F43F5E', '#EAB308', '#FFFFFF'],
      addedPrice: 15000,
    },
  ],

  corporate_events: [
    {
      id: 'corp_formal',
      name: 'Executive Business Formal',
      desc: 'Navy & charcoal stage, executive speaking podium with hotel branding, crystal water stations & leather seating.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      palette: ['#1E3A8A', '#334155', '#94A3B8', '#0F172A'],
      addedPrice: 15000,
    },
    {
      id: 'corp_hitech',
      name: 'Modern High-Tech Conference & LED Wall',
      desc: 'Ultra-wide 4K P2.5 LED video wall, intelligent spotlighting, digital registration kiosks & high-speed Wi-Fi.',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80',
      palette: ['#0284C7', '#0EA5E9', '#0369A1', '#0F172A'],
      addedPrice: 28000,
    },
    {
      id: 'corp_launch',
      name: 'Product Launch & Keynote Experience',
      desc: 'Spotlight runway stage, concealed product reveal pedestal, concert-grade acoustic sound & press backdrop wall.',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
      palette: ['#000000', '#06B6D4', '#E2E8F0', '#18181B'],
      addedPrice: 32000,
    },
    {
      id: 'corp_lounge',
      name: 'Executive Networking Lounge & Cocktail',
      desc: 'High-top cocktail tables, contemporary lounge sofas, warm ambient uplighting & passed hors d\'oeuvres stations.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      palette: ['#D97706', '#1E293B', '#F8FAFC', '#78350F'],
      addedPrice: 18000,
    },
  ],

  family_functions: [
    {
      id: 'fam_heritage',
      name: 'Heritage Grand Banquet',
      desc: 'Warm brass and marigold decor, cluster round tables with lazy susans, memory photo wall & live dessert bar.',
      image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
      palette: ['#B45309', '#DC2626', '#FEF08A', '#78350F'],
      addedPrice: 12000,
    },
    {
      id: 'fam_lawn',
      name: 'Lawn & Poolside Fiesta',
      desc: 'Fairy lights criss-crossing over lawn, wooden pergolas, colorful garden flowers & live street food counters.',
      image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80',
      palette: ['#059669', '#F59E0B', '#38BDF8', '#FFFFFF'],
      addedPrice: 14000,
    },
    {
      id: 'fam_cozy',
      name: 'Intimate Family Reunion Salon',
      desc: 'Comfortable plush sofa clusters, ambient jazz background music, digital slideshow screen & private bar.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
      palette: ['#D97706', '#1E293B', '#F8FAFC', '#475569'],
      addedPrice: 10000,
    },
  ],

  social_events: [
    {
      id: 'soc_gatsby',
      name: 'Gatsby Glamour & Art Deco',
      desc: 'Black, metallic gold & emerald luxury geometric patterns, retro champagne tower & feather centerpieces.',
      image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      palette: ['#D97706', '#064E3B', '#000000', '#F8FAFC'],
      addedPrice: 20000,
    },
    {
      id: 'soc_neon',
      name: 'Neon Glow & Ibiza Lounge',
      desc: 'Intelligent laser lighting, glowing cocktail tables, DJ riser with subwoofer & custom cocktail lounge setup.',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      palette: ['#D946EF', '#06B6D4', '#8B5CF6', '#09090B'],
      addedPrice: 22000,
    },
    {
      id: 'soc_sunset',
      name: 'Sunset Rooftop Soirée',
      desc: 'Rooftop terrace overlooking city skyline, candle hurricane lanterns, lounge daybeds & live acoustic duo.',
      image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
      palette: ['#EA580C', '#FDE047', '#38BDF8', '#111827'],
      addedPrice: 18000,
    },
  ],
};

/** Fallback general themes when a category doesn't have custom ones */
export const DECOR_THEMES: DecorThemeOption[] = [
  {
    id: 'floral_crystal',
    name: 'Grand Floral & Crystal Royalty',
    desc: 'Lush imported roses, cascading orchids, crystal chandeliers & warm ambient illumination.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    palette: ['#FB7185', '#F59E0B', '#F8FAFC', '#1E293B'],
    addedPrice: 15000,
  },
  {
    id: 'heritage_marigold',
    name: 'Royal Heritage Marigold & Brass',
    desc: 'Fragrant marigold garlands, sacred brass diyas, traditional earthen urns & raw silk drapes.',
    image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80',
    palette: ['#D97706', '#DC2626', '#FEF08A', '#78350F'],
    addedPrice: 10000,
  },
  {
    id: 'pastel_chic',
    name: 'Pastel Chic & Fairy Lights',
    desc: 'Blush pink, champagne florals, magical fairy light canopy & minimalist acrylic pedestals.',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
    palette: ['#F472B6', '#C084FC', '#67E8F9', '#FEF08A'],
    addedPrice: 12000,
  },
  {
    id: 'contemporary_neon',
    name: 'Contemporary Glamour & Neon LED',
    desc: 'Custom neon statement signs, intelligent uplighting, mirrored dance floor & party effects.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    palette: ['#D946EF', '#06B6D4', '#8B5CF6', '#09090B'],
    addedPrice: 14000,
  },
];

export const CATERING_STYLES: CateringStyleOption[] = [
  {
    id: 'veg_gourmet',
    name: 'Royal Vegetarian Gourmet',
    desc: 'Curated regional Indian delicacies, live chaat counter, tandoori starters & artisanal mithai.',
    pricePerPlate: 1200,
  },
  {
    id: 'multi_cuisine',
    name: 'Grand Multi-Cuisine Buffet',
    desc: 'Pan-Asian, Continental, Mughlai roasts, pasta stations, salad bar & decadent desserts.',
    pricePerPlate: 1650,
  },
  {
    id: 'cocktail_canapes',
    name: 'Cocktail Soirée Canapés & Live Stations',
    desc: 'Artisanal sliders, dim sums, sushi bar, tapas, mocktails & passed hors d’oeuvres.',
    pricePerPlate: 1450,
  },
  {
    id: 'plated_5course',
    name: 'Luxury 5-Course Plated Banquet',
    desc: 'Executive chef tasting menu, personalized menu cards & white-glove table service.',
    pricePerPlate: 2200,
  },
];

export const EVENT_ADDONS: EventAddOnOption[] = [
  {
    id: 'photography',
    name: 'Professional Photographer & 4K Video',
    desc: 'Dedicated event photographer, candid photo album, edited digital stills & highlight reel.',
    price: 15000,
  },
  {
    id: 'sound_dj',
    name: 'DJ & Sound System with Laser Lighting',
    desc: 'Professional sound console, wireless microphones, party lighting & DJ setup.',
    price: 18000,
  },
  {
    id: 'designer_cake',
    name: 'Custom Multi-Tier Designer Cake',
    desc: 'Handcrafted luxury celebration cake designed with your theme and flavor choice.',
    price: 4500,
  },
  {
    id: 'welcome_favors',
    name: 'Personalized Guest Welcome Hampers',
    desc: 'Curated gift boxes with artisanal chocolates, dry fruits & personalized cards.',
    price: 6000,
  },
  {
    id: 'valet_shuttle',
    name: 'Valet Concierge & Guest Luxury Shuttle',
    desc: 'Priority guest parking, valet team & luxury vehicle campus transfers.',
    price: 10000,
  },
  {
    id: 'event_butler',
    name: 'Dedicated Event Butler & Coordinator',
    desc: 'Personal manager to oversee timings, guest hospitality and service flow.',
    price: 8000,
  },
];

export const VENUE_OPTIONS = [
  'Grand Imperial Ballroom (Cap: 400)',
  'Poolside Lawn & Pavilion (Cap: 250)',
  'Skyline Rooftop Terrace (Cap: 150)',
  'Crystal Banquet Suite (Cap: 80)',
  'In-Suite Private Celebration (Cap: 20)',
];

export const seedEventsConfig = {
  enabled: true,
  cardImage: DEFAULT_EVENTS_CARD_IMAGE,
  subtitle: 'Plan your special moments with us.',
  categories: EVENT_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    startingPrice: c.startingPrice,
    available: true,
  })),
};
