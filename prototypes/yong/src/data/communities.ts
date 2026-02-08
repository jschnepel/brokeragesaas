// Comprehensive Community Data for all 34 neighborhoods
// Uses defaults from communityDefaults.ts, overrides only what's unique

import {
  type CommunityData,
  DEFAULT_AIRPORTS,
  DEFAULT_ECONOMIC_STATS,
  DEFAULT_EMPLOYERS,
  DEFAULT_QUALITY_OF_LIFE,
  DEFAULT_GALLERY,
  DEFAULT_LISTINGS,
  GOLF_LIFESTYLE_FEATURES,
  NORTH_SCOTTSDALE_SCHOOLS,
  CENTRAL_SCOTTSDALE_SCHOOLS,
  PARADISE_VALLEY_SCHOOLS,
  CAREFREE_SCHOOLS,
  NORTH_SCOTTSDALE_RESTAURANTS,
  PARADISE_VALLEY_RESTAURANTS,
  CAREFREE_RESTAURANTS,
  NORTH_SCOTTSDALE_DISTANCES,
  CENTRAL_SCOTTSDALE_DISTANCES,
  PARADISE_VALLEY_DISTANCES,
  CAREFREE_DISTANCES,
  generateMetrics,
  generateDemographics,
} from './communityDefaults';

// ============================================
// NORTH SCOTTSDALE COMMUNITIES
// ============================================

const DESERT_MOUNTAIN: CommunityData = {
  id: 'desert-mountain',
  name: 'Desert Mountain',
  city: 'Scottsdale',
  region: 'north-scottsdale',
  tagline: 'Six Jack Nicklaus Golf Courses',
  description: 'Desert Mountain is the crown jewel of North Scottsdale luxury, spanning 8,300 acres with six Jack Nicklaus-designed golf courses. This exclusive community offers unparalleled amenities, stunning high-desert terrain, and homes ranging from villas to $20M+ estates.',
  narrative: `Desert Mountain is not merely a golf community—it is a masterfully curated dialogue between world-class design and the ancient Sonoran landscape that has established itself as one of the most significant residential developments in American golf history. Spanning 8,300 pristine acres in the high Sonoran Desert at elevations ranging from 2,500 to 4,500 feet, this legendary enclave represents the absolute pinnacle of Arizona luxury living, where the air is noticeably cooler, the views stretch endlessly across the Valley of the Sun, and the lifestyle is nothing short of extraordinary.

Founded in 1986 by Lyle Anderson, Desert Mountain was conceived as the ultimate expression of desert golf living. The community's crown jewel is its unprecedented collection of six Jack Nicklaus Signature golf courses—Renegade, Outlaw, Geronimo, Apache, Cochise, and Chiricahua—each masterfully carved into the rugged terrain with a distinct personality that reflects the dramatic landscape. The Renegade course, which opened in 1987, quickly established itself as one of the most challenging and scenic courses in the Southwest, while the Chiricahua course, completed in 2002, showcases Nicklaus's evolved design philosophy with breathtaking bunkering and strategic shot values. Together, these courses offer more Nicklaus-designed holes than any other community on Earth, a distinction that draws passionate golfers from around the world.

Desert Mountain holds a unique place in golf history as the birthplace of the legendary Skins Game, which was hosted here for its inaugural year in 1983 and continued through multiple years, bringing golf legends like Arnold Palmer, Jack Nicklaus, Gary Player, and Lee Trevino to compete amid the spectacular desert scenery. This heritage of championship golf continues today through the club's extensive tournament schedule and the countless memorable rounds played across its six courses. The Desert Mountain Club has been consistently recognized among the top private clubs in America, earning Platinum Club status and numerous accolades for its exceptional course conditions, service, and member amenities.

The club experience extends far beyond the fairways through seven distinctive clubhouses, each offering its own character and culinary program. From the elegant fine dining at the Apache Clubhouse to the casual camaraderie at Cochise's welcoming spaces, members find their preferred atmosphere while enjoying cuisine prepared by an award-winning culinary team. The club's commitment to personalized service means staff members know residents by name, anticipate their preferences, and create the sense of a private resort that happens to be home.

For those whose passions extend beyond golf, Desert Mountain offers an equally impressive array of amenities. The Jim Flick Performance Center provides state-of-the-art instruction and club fitting with the latest technology. The tennis and pickleball complex features multiple courts with programs for all skill levels. Miles of hiking and biking trails wind through pristine desert, connecting neighborhoods while offering access to the natural beauty that makes this location so special. The spa and fitness center rivals those of five-star resorts, while the swimming pools and social spaces create gathering places for the community's active social calendar.

Residences within Desert Mountain range from beautifully appointed villas ideal for those seeking a lock-and-leave lifestyle to sprawling custom estates exceeding 15,000 square feet with every conceivable luxury. Architectural styles harmonize with the desert environment, incorporating natural materials, indoor-outdoor living spaces, and design elements that celebrate the surrounding beauty. Many homes feature private pools with infinity edges that seem to merge with the desert horizon, outdoor kitchens for al fresco entertaining, and guest casitas for extended visits from family and friends. The community's carefully planned development ensures privacy between residences while preserving the natural desert washes, rock outcroppings, and mature saguaro cacti that define the landscape.`,
  heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,500' - 4,500'",
  zipCode: '85262',
  coordinates: [33.7950, -111.8250],
  stats: {
    avgPrice: '$3.4M',
    priceRange: '$800K - $20M+',
    avgPpsf: '$685',
    avgDom: 48,
    inventory: 72,
    trend: '+14%',
  },
  metrics: generateMetrics('$3.4M', 48, '$685', '+14%'),
  features: ['Six Golf Courses', '8,300 Acres', 'High Desert Elevation', 'World-Class Amenities', 'Jack Nicklaus Design', 'Guard-Gated'],
  amenities: ['Desert Mountain Club', 'Seven Clubhouses', 'Tennis Complex', 'Fitness Center', 'Hiking Trails', 'Spa Services'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics('$3.4M'),
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: NORTH_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: NORTH_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Six Jack Nicklaus Courses',
    description: `Desert Mountain's collection of six Jack Nicklaus Signature golf courses represents the largest concentration of Nicklaus-designed holes anywhere on Earth—an unprecedented achievement that has defined luxury golf community development for nearly four decades. Each course possesses its own distinct character while sharing the Golden Bear's hallmark design philosophy of strategic options, dramatic bunkering, and seamless integration with the natural landscape.

The Renegade course, which opened in 1987, established the standard with its bold elevation changes and challenging desert carries that reward accurate shot-making. Outlaw followed with a more playable design while maintaining the dramatic scenery, making it a member favorite for regular play. Geronimo's higher elevation provides cooler temperatures and some of the most spectacular views in the community, with panoramas stretching across the Valley of the Sun. Apache demands precision with its tight fairways and well-defended greens, while Cochise offers a more forgiving layout perfect for social rounds with guests. The Chiricahua course, completed in 2002, represents the culmination of Nicklaus's evolved design philosophy with its artistic bunkering and strategic shot values.

The Desert Mountain Club supports these magnificent courses with seven clubhouses, each offering its own dining experiences, social spaces, and member amenities. The Jim Flick Performance Center provides tour-level instruction and club fitting, while the practice facilities include multiple ranges, short game areas, and putting greens designed to replicate on-course conditions. With 108 holes of championship golf, multiple dining venues, spa services, fitness facilities, tennis and pickleball courts, and miles of hiking trails, Desert Mountain delivers a lifestyle that simply cannot be replicated elsewhere. The club has earned Platinum Club status and consistent recognition among America's top private clubs, a testament to its unwavering commitment to excellence in every detail.`,
    stats: [
      { value: '6', label: 'Championship Courses' },
      { value: '7', label: 'Clubhouses' },
      { value: '8,300', label: 'Acres' },
      { value: 'Top 50', label: 'Private Club' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
};

const SILVERLEAF: CommunityData = {
  id: 'silverleaf',
  name: 'Silverleaf',
  city: 'Scottsdale',
  region: 'north-scottsdale',
  tagline: 'The Ultimate in Arizona Luxury',
  description: 'Silverleaf at DC Ranch represents the pinnacle of Arizona luxury living. This ultra-exclusive enclave features the finest custom estates, a Tom Weiskopf championship course, and amenities rivaling the world\'s best private clubs.',
  narrative: `Silverleaf transcends the conventional definition of a luxury community to occupy a realm entirely its own—an exclusive sanctuary where Arizona's most accomplished and discerning residents have chosen to call home. Within the carefully curated boundaries of this ultra-premium enclave at DC Ranch, some of the most significant residential architecture in the American Southwest has emerged, creating a collection of estates that would be remarkable in any setting but proves extraordinary against the backdrop of pristine Sonoran Desert and the majestic McDowell Mountains.

Developed by DMB Associates and opened in 1999, Silverleaf was conceived from its inception as the definitive expression of Arizona luxury. Every aspect of the community has been curated to perfection, from the meticulously maintained streetscapes to the 50,000-square-foot clubhouse that anchors the social experience. The Tom Weiskopf-designed championship golf course winds through dramatic desert terrain, its fairways carved between ancient saguaros and granite boulders that have stood for millennia. The course consistently ranks among the finest private courses in Arizona and provides the centerpiece for a lifestyle that balances active recreation with refined relaxation.

The Silverleaf Club delivers a member experience that rivals the world's finest private clubs and resorts. The magnificent clubhouse features multiple dining venues ranging from casual fare at the Grill to sophisticated cuisine at the signature restaurant, where an award-winning culinary team creates memorable experiences for intimate dinners and grand celebrations alike. The spa and wellness center offers comprehensive services from therapeutic massage to advanced aesthetic treatments, while the fitness facilities include the latest equipment, personal training, and group exercise programs. Tennis, swimming, and an active social calendar round out the amenities, creating a genuine resort experience that members enjoy without leaving their neighborhood.

Custom estates within Silverleaf represent the collaborative vision of Arizona's most celebrated architects, builders, and designers. Names like Candelaria Design, Drewett Works, and PHX Architecture appear throughout the community, their distinctive styles united by a commitment to celebrating the desert environment through inspired design. Homes here range from approximately 5,000 square feet to sprawling compounds exceeding 15,000 square feet, with lot sizes ensuring the privacy and setbacks that this level of buyer expects. Recent transactions have established new benchmarks for Arizona luxury real estate, with the community recording a $26.1 million sale that demonstrated the enduring appeal of Silverleaf's uncompromising vision.

The architectural diversity within Silverleaf reflects evolved tastes while maintaining a cohesive desert aesthetic. Contemporary masterpieces featuring walls of glass and clean horizontal lines stand alongside Tuscan-inspired villas and refined desert haciendas. What unites them is the quality of execution—the precision of the stonework, the seamless integration of indoor and outdoor spaces, the thoughtful orientation to capture mountain views and cool evening breezes. These are not merely houses but works of art that happen to be habitable, each one a testament to what becomes possible when budget is secondary to vision.

Security within Silverleaf is among the most sophisticated in residential real estate, with manned gates, 24-hour patrols, and technology-enhanced monitoring that provides residents genuine peace of mind. The community's relatively compact footprint and established resident base create a sense of genuine community, where neighbors become friends and the club serves as an extension of home.`,
  heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,800'",
  zipCode: '85255',
  coordinates: [33.6950, -111.8450],
  stats: {
    avgPrice: '$6.2M',
    priceRange: '$3M - $25M+',
    avgPpsf: '$985',
    avgDom: 62,
    inventory: 18,
    trend: '+15%',
  },
  metrics: generateMetrics('$6.2M', 62, '$985', '+15%'),
  features: ['Ultra-Exclusive', 'Tom Weiskopf Course', 'Guard-Gated', 'World-Class Club', 'Custom Estates', 'Concierge Service'],
  amenities: ['Silverleaf Club', 'Championship Golf', 'Spa & Wellness', 'Tennis', 'Fine Dining', 'Fitness Center'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics('$6.2M'),
  qualityOfLife: [
    { metric: 'Air Quality', value: 'Pristine', score: 98, icon: 'Wind', color: 'emerald' },
    { metric: 'Sunny Days', value: '299/yr', score: 82, icon: 'Sun', color: 'amber' },
    { metric: 'Crime Rate', value: 'Lowest', score: 99, icon: 'Shield', color: 'blue' },
    { metric: 'Healthcare', value: 'Excellent', score: 98, icon: 'Activity', color: 'rose' },
    { metric: 'Noise Level', value: 'Serene', score: 99, icon: 'VolumeX', color: 'indigo' },
    { metric: 'Light Pollution', value: 'Dark Sky', score: 96, icon: 'Moon', color: 'purple' },
  ],
  schools: NORTH_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: NORTH_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'Shield',
    title: 'The Silverleaf Club',
    description: `The Silverleaf Club stands as the definitive private club experience in Arizona, offering members an unparalleled lifestyle centered on a magnificent 50,000-square-foot clubhouse and the acclaimed Tom Weiskopf championship golf course. From its inception, the club was designed to rival the world's finest private clubs while maintaining the relaxed elegance that defines desert living at its best.

The Tom Weiskopf-designed golf course serves as the club's centerpiece, winding through dramatic desert terrain where ancient saguaros frame pristine fairways and granite boulders create natural hazards that have challenged golfers for over two decades. Weiskopf's design philosophy emphasizes strategic options and visual drama, rewarding thoughtful play while providing memorable experiences for golfers of all abilities. The course consistently earns recognition among Arizona's finest private layouts, with conditioning that reflects the club's commitment to excellence.

Beyond the fairways, the clubhouse delivers a comprehensive lifestyle experience rarely found outside destination resorts. The spa and wellness center offers a full menu of treatments from therapeutic massage to advanced skincare, complemented by state-of-the-art fitness facilities and personal training services. Multiple dining venues cater to every occasion, from casual lunches at the Grill to sophisticated wine dinners in the private dining room. The culinary team sources the finest ingredients to create seasonal menus that surprise and delight members throughout the year.

The club's tennis facilities include multiple courts with professional instruction, while the swimming complex provides a refreshing retreat during warm Arizona days. An active social calendar brings members together for wine tastings, cooking classes, holiday celebrations, and community events that foster genuine friendships. The concierge team anticipates member needs and ensures that every interaction reflects the club's commitment to personalized service. At Silverleaf Club, membership is not merely access to amenities—it is an invitation to a lifestyle defined by quality, community, and the pursuit of living well.`,
    stats: [
      { value: '1', label: 'Championship Course' },
      { value: '50,000', label: 'Sq Ft Clubhouse' },
      { value: 'Forbes', label: '5-Star Spa' },
      { value: '24/7', label: 'Concierge' },
    ],
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
  },
  listings: [
    { id: 1, price: "$12,500,000", ppsf: "$1,042", beds: 6, baths: 8, sqft: 12000, address: "10696 E Wingspan Way", status: "Active", lot: "2.5 Acres", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800" },
    { id: 2, price: "$8,750,000", ppsf: "$951", beds: 5, baths: 7, sqft: 9200, address: "20913 N 104th St", status: "Active", lot: "1.8 Acres", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" },
    { id: 3, price: "$7,200,000", ppsf: "$923", beds: 5, baths: 6, sqft: 7800, address: "10801 E Happy Valley Rd", status: "Coming Soon", lot: "1.5 Acres", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800" },
    ...DEFAULT_LISTINGS.slice(3),
  ],
};

const DC_RANCH: CommunityData = {
  id: 'dc-ranch',
  name: 'DC Ranch',
  city: 'Scottsdale',
  region: 'north-scottsdale',
  tagline: "Arizona's Premier Master-Planned Community",
  description: 'DC Ranch is a 4,200-acre master-planned community at the base of the McDowell Mountains. Known for its village-style design, exceptional amenities, and strong sense of community, DC Ranch offers everything from luxury condos to sprawling custom estates.',
  narrative: `DC Ranch represents the evolution of Arizona luxury living—a thoughtfully designed community where natural beauty, genuine connection, and exceptional amenities converge to create one of the most desirable addresses in the American Southwest. Spanning 4,200 acres at the base of the majestic McDowell Mountains, this master-planned community has established the standard for residential excellence since its founding, attracting families, professionals, and retirees who seek a lifestyle that balances privacy with community.

The land that would become DC Ranch has a rich history stretching back to 1885, when it operated as a working cattle ranch known as the Desert Camp Ranch—the "DC" that gives the community its name. That heritage of stewardship and connection to the land continues today through the community's commitment to preserving nearly 50% of the acreage as natural open space. Ancient saguaros, dramatic rock formations, and pristine desert washes have been protected throughout the development, creating a sense of living within the landscape rather than upon it.

At the heart of DC Ranch lies Market Street, a charming village center that has become the social hub for residents throughout the community and the surrounding area. This pedestrian-friendly gathering place features boutique shopping, award-winning restaurants, professional services, and community gathering spaces that host events throughout the year. The weekly farmers market brings neighbors together on Saturday mornings, while seasonal celebrations—from holiday tree lightings to summer concerts—create traditions that families treasure. Market Street captures the essence of what makes DC Ranch special: a genuine sense of community in an era when such connections have become increasingly rare.

The DC Ranch Community Council serves as the organizing force behind the community's active lifestyle programming. Fitness classes, social clubs, youth activities, and cultural events create opportunities for residents of all ages to connect with neighbors who share their interests. The community's network of trails links neighborhoods to each other and to the adjacent McDowell Sonoran Preserve, providing miles of paths for hiking, biking, and simply enjoying the natural beauty that surrounds every home.

Housing within DC Ranch spans an impressive range, from beautifully appointed condominiums and townhomes ideal for those seeking a simplified lifestyle, to expansive custom estates in prestigious enclaves like Country Club and Silverleaf. This diversity creates a community where young professionals, growing families, and established empty-nesters find homes that suit their current needs while maintaining the option to transition within the community as circumstances evolve. Architectural styles range from contemporary desert designs to Tuscan influences and refined Santa Fe interpretations, united by quality construction and harmonious integration with the natural environment.

The DC Ranch Country Club offers members access to a challenging Tom Lehman and John Fought-designed golf course that winds through the natural desert terrain at the base of the McDowells. The clubhouse provides dining options, fitness facilities, and social spaces that complement the golf experience. For families, the community's proximity to top-rated Scottsdale schools, safe neighborhood streets, and abundance of parks creates an ideal environment for raising children in an active, engaged community.`,
  heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,450'",
  zipCode: '85255',
  coordinates: [33.6850, -111.8550],
  stats: {
    avgPrice: '$2.1M',
    priceRange: '$600K - $15M',
    avgPpsf: '$485',
    avgDom: 38,
    inventory: 45,
    trend: '+12%',
  },
  metrics: generateMetrics('$2.1M', 38, '$485', '+12%'),
  features: ['Master-Planned', 'Market Street Village', 'McDowell Views', 'Top Schools', '4,200 Acres', 'Community Events'],
  amenities: ['DC Ranch Village', 'Country Club', 'Community Center', 'Parks & Trails', 'Tennis', 'Fitness'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics('$2.1M'),
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: NORTH_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: NORTH_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Market Street at DC Ranch',
    description: `Market Street at DC Ranch represents the rare achievement of creating a genuine town center within a master-planned community—a place where neighbors become friends, where Saturday mornings mean farmers market visits, and where the rhythms of daily life unfold in a walkable, welcoming environment that feels more like a charming small town than a shopping district.

Developed as the social and commercial heart of DC Ranch, Market Street brings together an carefully curated collection of boutiques, restaurants, and services that cater to residents' daily needs while providing destinations worth driving across town to visit. Award-winning restaurants range from casual café fare to sophisticated dining experiences, with patios that take advantage of Arizona's exceptional climate for most of the year. Specialty retailers offer everything from fashion and home décor to outdoor gear and children's toys, while professional services including salons, wellness providers, and financial advisors ensure residents need never venture far from home for quality service.

The weekly farmers market has become a beloved tradition, drawing residents from throughout DC Ranch and beyond to browse local produce, artisan foods, handcrafted goods, and specialty items while reconnecting with neighbors and friends. Musicians provide a soundtrack for the morning, while children explore and dogs socialize in this uniquely community-centered gathering. Seasonal events—from the holiday tree lighting to summer concert series—transform Market Street into a celebration space where traditions are created and memories are made.

Beyond its retail and dining offerings, Market Street serves as the face of DC Ranch's community values. The architecture blends desert contemporary with village charm, creating spaces that invite lingering over coffee, strolling between shops, and pausing to chat with familiar faces. Covered walkways provide shelter from summer sun, while fireplaces warm outdoor seating areas during cooler months. The thoughtful design ensures that Market Street remains vibrant throughout the day and across the seasons, a genuine neighborhood gathering place rather than a commercial afterthought.`,
    stats: [
      { value: '50+', label: 'Shops & Restaurants' },
      { value: 'Weekly', label: 'Farmers Market' },
      { value: '4,200', label: 'Acre Community' },
      { value: '50%', label: 'Open Space' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
};

const ESTANCIA: CommunityData = {
  id: 'estancia',
  name: 'Estancia',
  city: 'Scottsdale',
  region: 'north-scottsdale',
  tagline: 'Ultra-Exclusive Desert Sanctuary',
  description: "Estancia is one of Arizona's most exclusive and private golf communities, limited to just 595 homesites across 640 pristine acres. The Tom Fazio-designed course and ultra-luxury homes attract those seeking the pinnacle of desert living.",
  narrative: `Estancia exists in a category of its own—a sanctuary for those who seek exclusivity without compromise, where the concentration of wealth and achievement creates a community of remarkable individuals who have chosen to call this pristine corner of the Sonoran Desert home. Limited to just 595 homesites across 640 acres of untouched desert landscape, Estancia offers something increasingly rare in luxury real estate: genuine privacy, authentic community, and an environment where every detail has been considered with the discerning buyer in mind.

The community was established with a clear vision: to create the finest private golf club experience in Arizona while preserving the natural beauty that makes the Sonoran Desert so captivating. From the outset, development was guided by principles of restraint and respect for the land. Rather than maximizing density, the developers chose to limit homesites to 262 residences within the golf club community, ensuring generous spacing between properties and preserving the dramatic boulder formations, ancient saguaros, and natural washes that define the terrain. The result is a community that feels more like a nature preserve with homes than a traditional residential development.

The Tom Fazio-designed golf course is nothing short of a masterwork in desert golf architecture. Fazio, recognized as one of the world's foremost course designers, approached Estancia with a philosophy of minimal disturbance, routing the layout to follow the natural contours of the land while featuring the most dramatic rock formations as visual centerpieces. The course earned recognition as Golf Digest's "Best New Private Course" in 1996 and has consistently ranked among the top courses in Arizona ever since. Every hole presents a unique challenge and a breathtaking view, rewarding thoughtful play while providing a memorable experience even for those whose scores don't match their ambitions.

The Estancia Club delivers service levels typically found only at the world's finest resort destinations. The intimate membership ensures that staff members know every member by name, anticipate their preferences, and create personalized experiences that transform routine visits into genuine pleasures. The culinary program reflects this commitment to excellence, with an award-winning team sourcing the finest ingredients to create menus that surprise and delight throughout the year. The club's wine program has earned recognition from Wine Spectator, while the private wine cave provides members with an extraordinary venue for intimate gatherings and special celebrations.

Custom homes within Estancia represent the finest in contemporary desert architecture, designed by architects who understand how to create living spaces that celebrate rather than compete with the landscape. Floor-to-ceiling glass walls frame mountain views, disappearing corners blur the boundary between interior and exterior, and outdoor living rooms extend the footprint of homes into the desert air. Negative-edge pools seem to merge with the horizon, while native landscaping creates the impression that each residence has grown organically from the desert floor. These are not merely luxury homes—they are statements about what residential architecture can achieve when clients demand excellence and budgets support ambition.

The community's security provides genuine peace of mind, with sophisticated access control and discreet patrols ensuring that residents can enjoy their sanctuary without concern. Yet despite the privacy, Estancia fosters authentic community through member events, golf tournaments, and social gatherings that bring residents together in celebration of the exceptional lifestyle they share.`,
  heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,800'",
  zipCode: '85262',
  coordinates: [33.7350, -111.8450],
  stats: {
    avgPrice: '$4.8M',
    priceRange: '$2M - $15M',
    avgPpsf: '$785',
    avgDom: 65,
    inventory: 12,
    trend: '+11%',
  },
  metrics: generateMetrics('$4.8M', 65, '$785', '+11%'),
  features: ['Tom Fazio Course', 'Ultra-Private', '595 Homesites', 'Concierge Service', 'Wine Cave', 'Guard-Gated'],
  amenities: ['Private Golf Club', 'Spa & Wellness', 'Tennis', 'Wine Cave', 'Concierge', 'Fine Dining'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics('$4.8M'),
  qualityOfLife: [
    { metric: 'Air Quality', value: 'Pristine', score: 98, icon: 'Wind', color: 'emerald' },
    { metric: 'Sunny Days', value: '299/yr', score: 82, icon: 'Sun', color: 'amber' },
    { metric: 'Crime Rate', value: 'Lowest', score: 99, icon: 'Shield', color: 'blue' },
    { metric: 'Healthcare', value: 'Excellent', score: 98, icon: 'Activity', color: 'rose' },
    { metric: 'Noise Level', value: 'Serene', score: 99, icon: 'VolumeX', color: 'indigo' },
    { metric: 'Light Pollution', value: 'Dark Sky', score: 96, icon: 'Moon', color: 'purple' },
  ],
  schools: NORTH_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: NORTH_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Tom Fazio Championship Course',
    description: `The Tom Fazio-designed championship course at Estancia represents the pinnacle of desert golf architecture—a masterwork that earned recognition as Golf Digest's "Best New Private Course" upon its opening in 1996 and has consistently ranked among the finest courses in Arizona ever since. Fazio's genius lies in his philosophy of restraint, routing the layout to follow the natural contours of the land while featuring the most dramatic rock formations, ancient saguaros, and desert washes as visual centerpieces rather than obstacles to be moved or removed.

Each of the eighteen holes presents a unique challenge and a breathtaking view, with the course playing through terrain that ranges from intimate desert arroyos to elevated tees with panoramic mountain vistas. The conditioning reflects Estancia's commitment to excellence, with fairways and greens maintained to tour standards despite the challenges of the desert climate. Strategic bunkering rewards thoughtful play, while multiple tee positions ensure that the course offers appropriate challenge for golfers of all abilities. For those seeking to refine their games, the practice facilities include a full range, short game area, and putting green designed to replicate on-course conditions.

The intimate nature of the club—limited to 262 golf memberships—ensures that tee times are readily available and rounds unfold at a leisurely pace that honors the Scottish origins of the game. Members rarely wait, never feel rushed, and often complete their rounds having encountered only a few other groups on the course. This exclusivity, combined with the caliber of the golf experience, explains why Estancia memberships are rarely available and quickly claimed when they do appear.

Beyond the golf course, the club delivers comprehensive amenities including the elegant clubhouse with multiple dining venues, a spa and fitness center rivaling resort facilities, tennis courts, and an active social calendar. The private wine cave hosts intimate tastings and celebrations, while the culinary team creates seasonal menus showcasing the finest available ingredients. At Estancia, membership represents not merely access to exceptional golf but entry into a lifestyle defined by quality, privacy, and the company of accomplished individuals who share an appreciation for excellence.`,
    stats: [
      { value: '262', label: 'Golf Memberships' },
      { value: '640', label: 'Pristine Acres' },
      { value: 'Fazio', label: 'Designed Course' },
      { value: 'Top 10', label: 'Arizona Private' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
};

const MIRABEL: CommunityData = {
  id: 'mirabel',
  name: 'Mirabel',
  city: 'Scottsdale',
  region: 'north-scottsdale',
  tagline: 'Tom Fazio Masterpiece',
  description: "Mirabel is an intimate, ultra-luxury golf community featuring a Tom Fazio-designed course that winds through pristine Sonoran Desert. With only 215 homesites, Mirabel offers exclusivity, privacy, and world-class golf.",
  narrative: `Mirabel represents golf course living at its most refined and intimate—a community where exclusivity is not merely a marketing promise but a mathematical certainty. With just 215 homesites nestled across 640 acres of pristine Sonoran Desert, Mirabel offers a resident-to-acreage ratio that ensures genuine privacy, uncrowded golf, and an authentic sense of sanctuary that larger communities cannot replicate regardless of their marketing claims.

The community emerged from a clear vision: to create an intimate golf club experience where members know one another, where staff anticipate preferences without being asked, and where the daily rhythms of club life unfold with the easy familiarity of a private retreat. That vision has been realized with remarkable consistency since the community's founding, attracting residents who value substance over flash and genuine quality over superficial luxury.

The Tom Fazio-designed golf course is nothing less than a desert masterpiece, carved through boulder-strewn arroyos and framed by towering saguaros that have stood for centuries. Fazio approached the project with his signature philosophy of minimal disturbance, routing the layout to celebrate the natural terrain rather than reshape it. The result is eighteen holes that feel as though they have always existed within this landscape, with fairways that follow the natural drainage patterns and greens tucked into natural amphitheaters formed by the surrounding boulders and vegetation.

Every hole offers dramatic views—of distant mountain ranges, of the immediate desert beauty, of the play of light across the landscape as the sun tracks across the Arizona sky. Yet despite its visual drama, the course plays fairly for golfers of all abilities, with multiple tee positions allowing players to match the challenge to their games. The conditioning reflects Mirabel's commitment to excellence, with greens rolling true and fairways providing the lies that make Arizona winter golf so exceptional.

The intimate Mirabel Club embodies everything a private club should be. The clubhouse provides elegant but unpretentious gathering spaces, from the casual grill room to the more formal dining areas suitable for special occasions. The culinary team approaches each meal as an opportunity to exceed expectations, sourcing exceptional ingredients and preparing them with creativity and care. Wine storage allows members to maintain personal collections, while the bar pours with a generous hand for those lingering after successful rounds.

Club members develop genuine friendships through shared rounds, couples' events, and the organic connections that emerge when neighbors encounter each other regularly in a setting designed for relaxation and enjoyment. The staff know not just members' names but their stories—their grandchildren, their handicaps, their preferred tee times and post-round beverages. This level of personalized attention is possible precisely because Mirabel has resisted the temptation to grow, maintaining the intimate scale that makes the member experience so distinctive.

Custom homes within Mirabel showcase the finest in contemporary desert architecture, designed by architects who understand both the landscape and the expectations of buyers at this level. Generous setbacks ensure privacy between residences, while careful site planning preserves views and creates the impression that each home exists in splendid isolation despite the community's carefully maintained infrastructure and security.`,
  heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,650'",
  zipCode: '85262',
  coordinates: [33.7850, -111.8750],
  stats: {
    avgPrice: '$4.2M',
    priceRange: '$2M - $12M',
    avgPpsf: '$725',
    avgDom: 70,
    inventory: 8,
    trend: '+12%',
  },
  metrics: generateMetrics('$4.2M', 70, '$725', '+12%'),
  features: ['Tom Fazio Course', '215 Homesites', 'Ultra-Private', 'Concierge', 'Intimate Club', 'Guard-Gated'],
  amenities: ['Private Golf Club', 'Clubhouse', 'Spa', 'Fitness', 'Tennis', 'Fine Dining'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics('$4.2M'),
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: NORTH_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: NORTH_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Intimate Desert Golf',
    description: `Mirabel's Tom Fazio-designed golf course delivers an experience that simply cannot be replicated at larger communities—intimate, uncrowded golf through some of the most dramatic desert terrain in the Scottsdale area, where members routinely complete rounds without encountering more than a handful of other groups on the course. This is the benefit of limiting development to just 215 homesites: the mathematics of exclusivity work in members' favor every time they step to the first tee.

Fazio's design philosophy emphasizes natural integration over manufactured drama, and nowhere is this more evident than at Mirabel. The course winds through boulder-strewn arroyos and beneath the arms of ancient saguaros, following the natural contours of the desert rather than imposing artificial features. Each hole presents a distinct challenge and a memorable view, from elevated tees overlooking the valley to intimate green complexes tucked into natural amphitheaters. The bunkering is strategic rather than penal, rewarding thoughtful play while providing options for players of varying abilities.

The practice facilities support serious improvement, with a full driving range, dedicated short game area, and putting greens that replicate the speeds and breaks members encounter on the course. The professional staff provides instruction for players at all levels, from newcomers working on fundamentals to low handicappers fine-tuning their competitive games. Equipment fitting ensures members play clubs optimized for their swings, while the well-stocked golf shop caters to equipment and apparel needs.

Beyond the eighteenth green, the Mirabel Club provides everything members need to extend their days in comfort and style. The dining program reflects the same commitment to quality that characterizes every aspect of the community, with menus that evolve seasonally and a culinary team that takes genuine pride in each plate presented. Fitness facilities allow members to maintain their conditioning, while the spa offers recovery and relaxation. Yet it's the intangibles that truly distinguish Mirabel—the familiarity of staff who know your name and preferences, the friendships that develop through shared rounds and social events, and the quiet confidence that comes from belonging to something genuinely special.`,
    stats: [
      { value: '215', label: 'Total Homesites' },
      { value: '640', label: 'Pristine Acres' },
      { value: 'Fazio', label: 'Designed' },
      { value: 'Top 100', label: 'Private Course' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
};

// Create a helper function for generating communities with regional defaults
const createNorthScottsdaleCommunity = (
  overrides: Partial<CommunityData> & Pick<CommunityData, 'id' | 'name' | 'tagline' | 'description' | 'stats'>
): CommunityData => ({
  city: 'Scottsdale',
  region: 'north-scottsdale',
  narrative: overrides.description + '\n\nThis prestigious North Scottsdale community offers the quintessential Arizona luxury lifestyle, with world-class golf, dining, and natural beauty at your doorstep.',
  heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,500'",
  zipCode: '85262',
  coordinates: [33.7200, -111.8600],
  features: ['Golf Community', 'Mountain Views', 'Desert Setting', 'Guard-Gated'],
  amenities: ['Golf Club', 'Tennis', 'Fitness', 'Community Center'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics(overrides.stats.avgPrice),
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: NORTH_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: NORTH_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Sonoran Desert Living',
    description: 'Experience the best of North Scottsdale with pristine desert landscapes, championship golf, and a lifestyle that celebrates the beauty of the Southwest.',
    stats: [
      { value: '300+', label: 'Sunny Days' },
      { value: 'A+', label: 'Schools' },
      { value: 'Top', label: 'Golf Courses' },
      { value: '24/7', label: 'Security' },
    ],
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
  metrics: generateMetrics(overrides.stats.avgPrice, overrides.stats.avgDom, overrides.stats.avgPpsf, overrides.stats.trend),
  ...overrides,
});

// Additional North Scottsdale Communities using the helper
const TROON_NORTH = createNorthScottsdaleCommunity({
  id: 'troon-north',
  name: 'Troon North',
  tagline: 'Tom Weiskopf Desert Golf',
  description: "Troon North is home to two acclaimed Tom Weiskopf-designed golf courses—Monument and Pinnacle—consistently ranked among America's best. The community features custom homes with dramatic boulder outcroppings and mountain views.",
  narrative: `Troon North occupies a special place in the evolution of desert golf—the community where Tom Weiskopf proved that championship courses could be carved from the most challenging Sonoran terrain while enhancing rather than diminishing the natural beauty. The two courses here, Monument and Pinnacle, have consistently ranked among America's finest public-access layouts since their openings, establishing Troon North as a pilgrimage destination for serious golfers and a prestigious address for those fortunate enough to call it home.

The setting itself explains much of Troon North's appeal. Located in far North Scottsdale at the base of Pinnacle Peak, the community encompasses some of the most dramatic terrain in the Valley—massive granite boulder outcroppings, pristine desert washes, and panoramic mountain views that stretch to distant horizons. When developers first surveyed this land in the early 1990s, they recognized that conventional golf course development would destroy precisely the features that made the location so compelling. Tom Weiskopf embraced the challenge, creating two courses that work with rather than against the landscape.

The Monument course, which opened in 1990, announced Troon North's arrival on the national golf scene with immediate impact. Golf Digest and Golf Magazine ranked it among the best new courses in America, praising Weiskopf's routing through boulder-strewn terrain and his creative use of natural features as hazards and visual elements. The signature third hole, which plays through a narrow corridor of massive boulders to an elevated green, became one of the most photographed holes in American golf. The Pinnacle course followed in 1995, offering a somewhat more playable layout while maintaining the dramatic character that defines Troon North golf.

Both courses benefit from the Troon Golf management philosophy of maintaining public-access courses to private club standards. Conditioning is exceptional, pace of play is managed carefully, and service levels rival what members experience at exclusive private clubs. For residents of Troon North, preferred tee times and member programs provide the benefits of belonging to a private club while maintaining the option to host guests for memorable rounds.

The Four Seasons Resort Scottsdale at Troon North adds a dimension of resort luxury to the residential community. World-class dining, spa services, and the sophisticated ambiance of a Forbes Five-Star property are available just minutes from home, providing residents with options for special occasions, staycations, and entertaining out-of-town guests in appropriate style.

Custom homes within Troon North showcase the architectural possibilities of the desert environment. Hillside lots capture commanding views, while flat parcels provide easy living with private outdoor spaces. Boulder outcroppings become integrated features of estate designs, and native landscaping creates seamless transitions between residential properties and the surrounding desert. The diversity of architectural styles—from contemporary masterpieces to refined desert haciendas—reflects the individual tastes of residents united by appreciation for this exceptional location.`,
  stats: { avgPrice: '$2.6M', priceRange: '$1M - $8M', avgPpsf: '$565', avgDom: 50, inventory: 20, trend: '+10%' },
  features: ['Two Championship Courses', 'Boulder Terrain', 'Mountain Views', 'Custom Homes', 'Four Seasons Resort'],
  amenities: ['Troon North Golf Club', 'Four Seasons Resort', 'Spa', 'Fine Dining', 'Hiking Trails'],
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Monument & Pinnacle Courses',
    description: `The Monument and Pinnacle courses at Troon North represent Tom Weiskopf's finest work in desert golf architecture—two layouts that proved championship-caliber courses could be carved from challenging Sonoran terrain while enhancing rather than diminishing the natural beauty that makes North Scottsdale so compelling. Both courses have maintained their positions among America's finest public-access layouts for over three decades, a testament to the timeless quality of their design.

The Monument course, which opened in 1990, made an immediate impact on the national golf scene. Golf Digest and Golf Magazine ranked it among the best new courses in America, praising Weiskopf's creative routing through boulder-strewn terrain and his use of natural features as both hazards and visual elements. The signature third hole plays through a narrow corridor of massive granite boulders to an elevated green, creating one of the most photographed and memorable holes in American golf. Throughout the layout, dramatic elevation changes, strategic bunkering, and the ever-present desert vegetation create challenges that reward thoughtful play.

The Pinnacle course followed in 1995, offering a somewhat more accessible layout while maintaining the dramatic character that defines Troon North. Where Monument demands precision and punishes errant shots, Pinnacle provides more generous landing areas and recovery options—though both courses offer ample challenge from the back tees for accomplished players. The conditioning of both layouts reflects Troon Golf's commitment to maintaining public-access courses to private club standards, with greens rolling true and fairways providing the lies that make Arizona winter golf so exceptional.

For Troon North residents, membership programs provide preferred access, competitive rates, and the benefits of belonging to a prestigious golf community while maintaining the flexibility to host guests for memorable rounds. The proximity of the Four Seasons Resort adds dimension to the lifestyle, with world-class dining, spa services, and resort amenities available just minutes from home.`,
    stats: [
      { value: '2', label: 'Championship Courses' },
      { value: 'Top 100', label: 'Public Courses' },
      { value: 'Weiskopf', label: 'Designed' },
      { value: 'Four Seasons', label: 'Resort Adjacent' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
});

const GRAYHAWK = createNorthScottsdaleCommunity({
  id: 'grayhawk',
  name: 'Grayhawk',
  tagline: 'Vibrant Golf & Lifestyle Community',
  description: 'Grayhawk is a dynamic North Scottsdale community known for its two championship golf courses, lively town center, and diverse housing options. From luxury condos to custom estates, Grayhawk appeals to those seeking an active, amenity-rich lifestyle.',
  narrative: `Grayhawk captures what many consider the ideal North Scottsdale lifestyle—world-class golf, vibrant dining and entertainment, excellent schools, and a genuine sense of community, all within a master-planned environment that has aged gracefully since its development in the late 1990s. Unlike communities that focus exclusively on golf or estate-style living, Grayhawk embraces diversity, offering everything from lock-and-leave condominiums to custom estates on generous lots, making it accessible to young professionals, growing families, and established empty-nesters alike.

The community's two championship golf courses—Talon and Raptor—anchor the recreational lifestyle and provide the visual beauty that defines Grayhawk's character. Designed by Tom Fazio and David Graham respectively, these courses have hosted PGA Tour and LPGA events, establishing Grayhawk's credentials as a serious golf destination. The Talon course winds through dramatic desert terrain with signature boulder formations, while Raptor offers a more links-style experience with challenging wind and strategic bunkering. For residents and guests alike, both courses deliver memorable rounds in spectacular settings.

Yet golf represents only part of the Grayhawk experience. The vibrant town center has evolved into a genuine gathering place, with restaurants, retailers, and services creating the kind of walkable mixed-use environment that builds community. The legendary Phil's Grill serves as an unofficial clubhouse for the neighborhood, where golfers rehash rounds, families gather for casual dinners, and neighbors catch up over drinks on the patio. Live music, seasonal events, and simply running into familiar faces create the social fabric that transforms a development into a community.

Families are drawn to Grayhawk by the exceptional schools that serve the area. Grayhawk Elementary has earned consistent recognition for academic excellence, while the district's middle and high schools maintain the standards that parents expect in North Scottsdale. Safe streets, abundant parks, and a culture that values family activities create an environment where children thrive while parents appreciate the combination of convenience and community.

The diversity of housing options within Grayhawk means that residents can transition through life stages without leaving the community they love. Young professionals start in condominiums or townhomes, growing families move to larger single-family homes with yards and pools, and empty-nesters downsize to low-maintenance patio homes while maintaining the friendships and connections they've built over the years. Architectural styles range from contemporary desert designs to Mediterranean influences, with homes at every price point reflecting quality construction and thoughtful design.

The location amplifies Grayhawk's appeal, with easy access to the Loop 101 freeway connecting residents to employment centers, entertainment districts, and Phoenix Sky Harbor International Airport. The McDowell Sonoran Preserve provides miles of hiking and mountain biking trails just minutes away, while the restaurants and shopping of Kierland and Scottsdale Quarter are within easy reach for those seeking variety beyond the neighborhood's own offerings.`,
  stats: { avgPrice: '$1.4M', priceRange: '$500K - $5M', avgPpsf: '$395', avgDom: 32, inventory: 38, trend: '+10%' },
  features: ['Two Golf Courses', 'Town Center', 'Diverse Housing', 'Family-Friendly', 'Top Schools'],
  amenities: ['Grayhawk Golf Club', "Phil's Grill", 'Community Parks', 'Trails', 'Shopping'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Grayhawk Town Center',
    description: `Grayhawk's town center has evolved into something increasingly rare in master-planned communities—a genuine gathering place where residents naturally congregate, where running errands becomes an opportunity for social connection, and where the boundaries between commerce and community pleasantly blur. Anchored by the legendary Phil's Grill and surrounded by restaurants, retailers, and services, the town center creates the walkable, lively environment that builds neighborhoods into communities.

Phil's Grill deserves special mention as the unofficial clubhouse of Grayhawk, where golfers rehash rounds over cold drinks, families gather for casual dinners, and neighbors catch up on the spacious patio that seems to host half the community on pleasant evenings. The restaurant has become so synonymous with the Grayhawk experience that residents routinely bring visiting friends and family as an essential introduction to the neighborhood. Other dining options range from quick-service to upscale casual, providing variety for different occasions and cravings.

Beyond dining, the town center provides the services that simplify daily life—professional offices, fitness studios, specialty retailers, and personal services that reduce the need to venture beyond the neighborhood for routine needs. The walkable layout encourages residents to leave cars at home for errands, creating the casual encounters that build community. Children learn to navigate independence in a safe, familiar environment, while adults appreciate the convenience of having essential services within minutes of home.

Seasonal events transform the town center into a celebration space, with holiday gatherings, community festivals, and live entertainment creating traditions that families anticipate throughout the year. The combination of daily convenience and special-occasion programming establishes Grayhawk's town center as the genuine heart of the community—not merely a commercial amenity but an essential element of the lifestyle that distinguishes Grayhawk from less thoughtfully planned developments.`,
    stats: [
      { value: '2', label: 'Golf Courses' },
      { value: '20+', label: 'Restaurants' },
      { value: 'A+', label: 'Rated Schools' },
      { value: 'Active', label: 'Community' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

const DESERT_HIGHLANDS = createNorthScottsdaleCommunity({
  id: 'desert-highlands',
  name: 'Desert Highlands',
  tagline: 'Jack Nicklaus Signature Golf',
  description: "Desert Highlands is one of North Scottsdale's most prestigious golf communities, featuring a Jack Nicklaus Signature golf course consistently ranked among Arizona's best. Custom homes sit on generous lots with sweeping views of Pinnacle Peak.",
  narrative: `Desert Highlands holds a distinguished place in Arizona golf history as the community that introduced Jack Nicklaus Signature design to the state—a pioneering development that proved the Sonoran Desert could host championship golf while preserving the natural beauty that makes this landscape so compelling. Since its founding in 1983, Desert Highlands has maintained its position among Arizona's most prestigious private golf communities, attracting accomplished individuals and families who appreciate both its historic significance and its ongoing commitment to excellence.

The elevated location at approximately 3,500 feet provides cooler temperatures than the valley floor and positions homes for sweeping views of Pinnacle Peak—one of North Scottsdale's most iconic landmarks—and the surrounding mountain ranges. On clear days, which are abundant in the Arizona desert, views extend across the Valley of the Sun to the distant Sierra Estrella range. The high desert terrain creates a more varied landscape than typical Scottsdale communities, with boulder outcroppings, natural washes, and native vegetation providing visual interest and wildlife habitat.

The Jack Nicklaus Signature golf course remains the centerpiece of Desert Highlands life, offering members challenging and strategic play through terrain that Nicklaus himself helped select for its golf potential. The Golden Bear's design philosophy emphasizes strategic options and risk-reward decisions, rewarding players who think their way around the course while providing the dramatic views and memorable holes that make rounds unforgettable. Conditioning reflects the club's commitment to excellence, with pristine greens and manicured fairways that rival any private club in the Southwest.

The Desert Highlands Club extends beyond golf to provide comprehensive lifestyle amenities befitting the community's stature. The tennis program offers multiple courts with professional instruction and active member programs. Fitness facilities support residents' wellness goals with modern equipment and personal training. The dining program ranges from casual fare at the grill to sophisticated cuisine for special occasions, all prepared by a culinary team that understands the expectations of a discerning membership. Social events throughout the year bring members together in celebration of the shared lifestyle.

Custom homes within Desert Highlands reflect decades of architectural evolution while maintaining harmony with the desert environment. Early construction showcased the Southwestern styles popular in the 1980s, while more recent homes embrace contemporary design with clean lines and walls of glass that frame the spectacular views. Lot sizes provide genuine privacy between residences, while the community's gated security ensures peace of mind. Many homes feature private pools, outdoor living spaces designed for entertaining, and the thoughtful details that distinguish custom construction from production building.

The community's intimate scale—approximately 500 homesites—fosters genuine connections among residents who share an appreciation for quality golf, natural beauty, and the relaxed elegance that defines the best of Arizona living. Members develop friendships through shared rounds, club events, and the organic interactions that occur when neighbors value the same things.`,
  stats: { avgPrice: '$3.2M', priceRange: '$1.5M - $10M', avgPpsf: '$625', avgDom: 55, inventory: 15, trend: '+9%' },
  features: ['Jack Nicklaus Course', 'Pinnacle Peak Views', 'Guard-Gated', 'Custom Estates', 'Tennis Center'],
  amenities: ['Private Golf Club', 'Tennis Center', 'Fitness', 'Fine Dining', 'Spa'],
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Jack Nicklaus Signature Course',
    description: `The Jack Nicklaus Signature course at Desert Highlands carries historic significance as the first Nicklaus design in Arizona—the layout that demonstrated championship golf could be carved from Sonoran Desert terrain while preserving and celebrating the natural beauty that makes this landscape so compelling. When the course opened in 1984, it established Desert Highlands as a serious golf destination and launched the explosion of Nicklaus-designed courses throughout the region.

The Golden Bear approached this pioneering project with his characteristic attention to strategy and aesthetics. The routing takes full advantage of the elevated terrain, providing dramatic views of Pinnacle Peak, the surrounding mountain ranges, and the Valley of the Sun stretching toward the horizon. Each hole presents distinct character and challenge, from the strategic bunkering that guards greens to the natural desert hazards that punish errant shots while rewarding accuracy and thoughtful course management.

The course has evolved thoughtfully over the decades, with updates to conditioning and modest design refinements that keep the layout fresh while respecting its historic character. Greens roll true at speeds that challenge even accomplished players, while the variety of tee positions allows members to match the challenge to their games. The practice facilities support improvement with a full range, dedicated short game area, and putting greens that replicate on-course conditions.

For Desert Highlands members, golf is not merely recreation but a shared passion that creates community. Weekly games, couples' events, member-guest tournaments, and friendly wagers build relationships that extend beyond the course. The professional staff provides instruction for all skill levels, while the club's commitment to pace of play ensures rounds can be completed efficiently without feeling rushed. At Desert Highlands, members experience the golf lifestyle Jack Nicklaus envisioned when he first surveyed this spectacular terrain four decades ago.`,
    stats: [
      { value: 'First', label: 'Nicklaus in AZ' },
      { value: 'Top 10', label: 'AZ Private Course' },
      { value: '3,500\'', label: 'Elevation' },
      { value: '360°', label: 'Mountain Views' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
});

const WHISPER_ROCK = createNorthScottsdaleCommunity({
  id: 'whisper-rock',
  name: 'Whisper Rock',
  tagline: "Phil Mickelson's Home Course",
  description: "Whisper Rock is an elite golf community featuring two courses—Upper and Lower—designed by Phil Mickelson and Gary Stephenson. With only 325 homesites, this intimate community attracts serious golfers and those seeking privacy.",
  narrative: `Whisper Rock represents a unique chapter in Arizona golf—a community conceived by and for serious players, where the design philosophy reflects the vision of Phil Mickelson, one of golf's most decorated and thoughtful champions. With just 325 homesites spread across two Phil Mickelson-designed courses, Whisper Rock offers the kind of intimate, member-focused experience that larger communities simply cannot provide, attracting residents for whom golf is not merely recreation but a genuine passion.

The story of Whisper Rock begins with Mickelson's own search for a home course—a place where he could practice, play, and perfect his game away from the spotlight of the PGA Tour. Together with course architect Gary Stephenson, Mickelson created two layouts that reflect his understanding of what serious golfers want: strategic challenge, tour-quality conditioning, and an environment where every round provides opportunities for improvement. The Upper and Lower courses offer distinct experiences while sharing the philosophy that made Whisper Rock a destination for accomplished players.

The practice facilities at Whisper Rock deserve special mention as some of the finest in residential golf. Mickelson's own preparation routines influenced the design, which includes extensive short game areas, precisely contoured putting greens, and a range that allows players to work on every shot they'll encounter on the course. Serious golfers appreciate these facilities as genuinely functional practice spaces rather than afterthoughts, while the instruction program provides access to teachers who understand the needs of accomplished players seeking to refine their games.

The intimate scale of Whisper Rock creates a club experience unlike larger communities. Members genuinely know one another, developing friendships through shared rounds and competitive events. The staff learn preferences quickly, ensuring that each visit feels personalized and welcoming. Tee times are readily available, rounds unfold at comfortable paces, and the sense of belonging to something special permeates every interaction. This is not a club where members are anonymous—it is a genuine community united by shared passion for the game.

Custom homes within Whisper Rock reflect the expectations of accomplished buyers, with contemporary desert architecture predominating in recent construction. Generous lots provide privacy between residences, while careful site planning ensures views are preserved and the natural desert environment flows between homes. The gated security and sophisticated access control provide peace of mind, while the community's location in far North Scottsdale ensures the serene atmosphere that residents seek.

The demographic at Whisper Rock skews toward serious golfers—members who maintain single-digit handicaps, who compete in club tournaments, and who travel for bucket-list golf experiences. This creates a unique culture where improving one's game is not unusual but expected, where conversations naturally turn to swing mechanics and course management, and where the shared language of golf builds community in ways that transcend typical neighbor relationships.`,
  stats: { avgPrice: '$3.8M', priceRange: '$1.5M - $10M', avgPpsf: '$665', avgDom: 60, inventory: 10, trend: '+11%' },
  features: ['Phil Mickelson Courses', '325 Homesites', 'Elite Golf', 'Guard-Gated', 'Practice Facility'],
  amenities: ['Private Golf Club', 'Practice Facility', 'Clubhouse', 'Fitness', 'Member Events'],
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Upper & Lower Courses',
    description: `Whisper Rock's two Phil Mickelson-designed courses represent something genuinely unique in residential golf—layouts conceived by one of the game's greatest champions specifically to provide the playing and practice experience that serious golfers seek. Together with course architect Gary Stephenson, Mickelson created two distinct courses that share a common philosophy: strategic challenge, tour-quality conditioning, and the kind of thoughtful design details that only a player of his caliber would understand to include.

The Upper course offers the more dramatic of the two experiences, with elevation changes that provide panoramic views of the surrounding mountains and the Valley of the Sun. The routing takes advantage of natural terrain features while creating holes that reward strategic thinking and precise execution. The Lower course provides a somewhat different character, with its own challenges and memorable holes that complement rather than duplicate the Upper experience. Together, the thirty-six holes provide variety that keeps the golf fresh through season after season of play.

The practice facilities reflect Mickelson's understanding of what serious players need to improve. The short game areas include multiple bunkers, chipping zones with various lies and slopes, and dedicated practice greens that replicate on-course conditions. The putting green features subtle contours that help players develop touch and read-reading skills. The driving range allows work on every shot from wedges to driver, with targets at realistic distances and angles. For Whisper Rock members, practice is not an afterthought but an integral part of the golf experience.

The intimate membership—limited by the community's 325 homesites—ensures that tee times are readily available and rounds unfold at comfortable paces. Members develop genuine relationships through shared rounds, competitive events, and the natural camaraderie that emerges when accomplished golfers come together. The club culture emphasizes quality over quantity, creating an experience that larger communities cannot replicate regardless of their resources.`,
    stats: [
      { value: '2', label: 'Mickelson Courses' },
      { value: '325', label: 'Homesites' },
      { value: 'Tour', label: 'Quality Practice' },
      { value: 'Elite', label: 'Membership' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
});

const ANCALA = createNorthScottsdaleCommunity({
  id: 'ancala',
  name: 'Ancala',
  tagline: 'Prestigious Guard-Gated Golf Community',
  description: 'Ancala is an exclusive guard-gated community in North Scottsdale featuring custom luxury homes surrounding the Ancala Country Club. With stunning mountain views, mature desert landscaping, and a championship golf course, Ancala offers refined desert lifestyle.',
  narrative: `Ancala represents the refined elegance of established North Scottsdale golf communities—a guard-gated enclave where mature landscaping, quality custom homes, and the private Ancala Country Club combine to create a lifestyle that attracts discerning buyers seeking substance over flash. Developed in the late 1980s and 1990s, Ancala has matured into one of the most desirable addresses in the 85255 zip code, with towering native trees, established desert gardens, and an atmosphere of understated success that newer communities cannot replicate.

The Ancala Country Club provides the social and recreational centerpiece for community life, offering an 18-hole championship golf course that winds through the natural desert terrain with dramatic views of the McDowell Mountains. The course rewards strategic play while providing enjoyable rounds for golfers at all skill levels. The clubhouse features dining options ranging from casual post-round fare to more sophisticated cuisine for special occasions, while the active social calendar brings members together for tournaments, couples events, and celebrations throughout the year.

Tennis enthusiasts find excellent facilities at Ancala, with multiple courts supporting both recreational play and competitive programming. The fitness center provides modern equipment for maintaining conditioning, while the pool offers respite during warm Arizona months. The combination of golf, tennis, fitness, and dining creates a comprehensive club experience that rivals more expensive private clubs while maintaining the accessible atmosphere that members appreciate.

Custom homes throughout Ancala reflect the architectural preferences of multiple decades, from Southwestern adobe influences to more contemporary desert designs. Lot sizes provide genuine privacy between residences, while mature landscaping softens the desert and creates established neighborhoods with character that takes decades to develop. Many homes have been thoughtfully updated over the years, combining the quality construction of their original builds with contemporary amenities and finishes.

The guard-gated security provides peace of mind while maintaining the welcoming atmosphere that distinguishes established communities from fortress-style developments. The community's location provides convenient access to the shopping, dining, and services of North Scottsdale while maintaining the quiet residential character that residents prioritize.`,
  stats: { avgPrice: '$1.8M', priceRange: '$800K - $4M', avgPpsf: '$425', avgDom: 45, inventory: 18, trend: '+8%' },
  zipCode: '85255',
  features: ['Guard-Gated', 'Golf Course', 'Mountain Views', 'Custom Homes', 'Mature Landscaping'],
  amenities: ['Ancala Country Club', 'Tennis Courts', 'Fitness Center', 'Dining', 'Pool'],
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Ancala Country Club',
    description: `The Ancala Country Club provides a private club experience that balances quality amenities with accessible membership, creating a social and recreational hub that enhances daily life for community residents. The 18-hole championship course winds through natural desert terrain with dramatic McDowell Mountain views, offering strategic challenge and visual beauty in equal measure.

The golf experience at Ancala emphasizes enjoyment over pretension, with a membership culture that welcomes players at all skill levels while providing facilities and conditioning that satisfy accomplished golfers. Regular play is easy to arrange, pace is comfortable, and the relationships that develop through shared rounds extend beyond the course into genuine friendships. The practice facilities support improvement, while instruction is available for those seeking to refine their games.

Beyond golf, the club provides comprehensive amenities including tennis courts, fitness facilities, swimming pool, and dining options that range from casual to refined. The social calendar brings members together for tournaments, wine dinners, holiday celebrations, and community events that build the connections distinguishing a neighborhood from a genuine community. The clubhouse provides gathering spaces for both formal occasions and casual encounters.

The club's membership structure offers value relative to more exclusive private clubs while delivering quality that exceeds expectations. For Ancala residents, membership provides immediate social connections, regular recreation, and the sense of belonging that enhances the ownership experience.`,
    stats: [
      { value: '18', label: 'Hole Championship' },
      { value: 'Tennis', label: 'Courts' },
      { value: 'Full', label: 'Fitness Center' },
      { value: 'Established', label: '1980s' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
});

const TERRAVITA = createNorthScottsdaleCommunity({
  id: 'terravita',
  name: 'Terravita',
  tagline: 'Guard-Gated Golf & Tennis',
  description: 'Terravita is a guard-gated golf community in North Scottsdale offering a Billy Casper-designed course, extensive tennis facilities, and a range of home styles from patio homes to custom estates.',
  narrative: `Terravita has earned its reputation as one of North Scottsdale's premier active adult and active lifestyle communities, where the combination of a Billy Casper-designed golf course, extensive tennis facilities, and guard-gated security creates an environment that appeals to those seeking recreation, community, and the quality of life that careful planning provides. Since its development in the 1990s, Terravita has attracted residents who prioritize an active lifestyle and appreciate the thoughtful design that makes daily enjoyment effortless.

The Billy Casper and Greg Nash-designed golf course provides the community's recreational centerpiece, with 18 holes winding through pristine Sonoran Desert terrain. The layout balances playability with challenge, creating enjoyable rounds for members at all skill levels while rewarding the shot-making that accomplished players cultivate. The conditioning reflects the club's commitment to quality, with pristine greens and maintained fairways that enhance every round. The practice facilities support improvement, while instruction is available for those seeking to refine their games.

Tennis at Terravita exceeds what most residential communities offer, with multiple courts, professional instruction, and active programs that create opportunities for both competitive play and social recreation. The tennis community within Terravita is particularly vibrant, with regular groups, league play, and social events that bring players together. For those who appreciate the sport, Terravita provides one of the best tennis environments in North Scottsdale.

The diversity of housing options distinguishes Terravita from single-product communities. Patio homes provide lower-maintenance living for those who prefer to spend time on the course or courts rather than yard work, while larger custom homes offer the space and privacy that established families desire. This variety creates community across demographics while ensuring that buyers at various life stages can find appropriate homes.

The guard-gated security provides peace of mind while the community's North Scottsdale location offers convenient access to shopping, dining, and services. The elevation provides cooler temperatures than the Valley floor, while mountain views remind residents daily of the natural beauty that drew them to Arizona.`,
  stats: { avgPrice: '$1.3M', priceRange: '$600K - $3.5M', avgPpsf: '$385', avgDom: 42, inventory: 25, trend: '+7%' },
  features: ['Guard-Gated', 'Billy Casper Course', 'Tennis Complex', 'Desert Views', 'Diverse Housing'],
  amenities: ['Terravita Golf Club', 'Tennis Center', 'Fitness', 'Dining', 'Social Events'],
});

const WINDGATE_RANCH = createNorthScottsdaleCommunity({
  id: 'windgate-ranch',
  name: 'Windgate Ranch',
  tagline: 'Luxury Master-Planned Living',
  description: 'Windgate Ranch is a guard-gated master-planned community offering luxury homes with resort-style amenities. The community features multiple pools, parks, and a focus on family-friendly yet upscale living.',
  stats: { avgPrice: '$1.6M', priceRange: '$800K - $4M', avgPpsf: '$405', avgDom: 38, inventory: 20, trend: '+9%' },
  zipCode: '85255',
  features: ['Guard-Gated', 'Resort Amenities', 'Family-Friendly', 'Top Schools', 'Parks'],
  amenities: ['Community Center', 'Pools', 'Parks', 'Fitness Center', 'Events'],
});

const TROON_VILLAGE = createNorthScottsdaleCommunity({
  id: 'troon-village',
  name: 'Troon Village',
  tagline: 'Desert Living Near Troon',
  description: 'Troon Village encompasses the residential areas surrounding Troon North, offering a variety of homes from semi-custom to luxury estates. Residents enjoy proximity to world-class golf and the natural beauty of the high Sonoran Desert.',
  stats: { avgPrice: '$1.8M', priceRange: '$700K - $5M', avgPpsf: '$445', avgDom: 45, inventory: 30, trend: '+8%' },
  features: ['Golf Proximity', 'High Desert', 'Variety of Homes', 'Natural Setting', 'Mountain Views'],
  amenities: ['Troon North Access', 'Hiking', 'Community Amenities', 'Desert Trails'],
});

const LEGEND_TRAIL = createNorthScottsdaleCommunity({
  id: 'legend-trail',
  name: 'Legend Trail',
  tagline: 'Natural Desert Beauty & Golf',
  description: 'Legend Trail is a serene golf community in far North Scottsdale, known for its natural desert setting and the Rees Jones-designed Legend Trail Golf Club. Custom homes and patio homes offer mountain views and easy access to outdoor recreation.',
  stats: { avgPrice: '$950K', priceRange: '$500K - $2.5M', avgPpsf: '$340', avgDom: 40, inventory: 22, trend: '+6%' },
  features: ['Rees Jones Course', 'Desert Setting', 'Mountain Views', 'Hiking Access', 'Natural Beauty'],
  amenities: ['Legend Trail Golf Club', 'Community Center', 'Pool', 'Trails', 'Tennis'],
});

const MCDOWELL_MOUNTAIN_RANCH = createNorthScottsdaleCommunity({
  id: 'mcdowell-mountain-ranch',
  name: 'McDowell Mountain Ranch',
  tagline: 'Active Lifestyle at the Mountains',
  description: "McDowell Mountain Ranch is a master-planned community at the doorstep of the McDowell Sonoran Preserve. Perfect for outdoor enthusiasts, it offers miles of trails, community parks, and homes ranging from townhomes to custom estates.",
  narrative: `McDowell Mountain Ranch occupies what many consider the most desirable location in North Scottsdale for outdoor enthusiasts—directly adjacent to the McDowell Sonoran Preserve, the largest urban preserve in the United States. For residents who prioritize hiking, mountain biking, trail running, and horseback riding, no other community offers comparable access to world-class outdoor recreation literally at the doorstep. The miles of trails that extend from the community into the 30,000+ acre preserve create opportunities for daily adventure that most people experience only on vacation.

The master-planned community was developed with outdoor recreation as a core value, incorporating an extensive network of community trails that connect neighborhoods to each other and to the preserve trailheads. Morning runs, evening hikes, and weekend rides become routine pleasures rather than logistical challenges. The diversity of terrain—from relatively flat paths suitable for casual walks to challenging single-track that tests accomplished mountain bikers—ensures that residents at all fitness levels find appropriate routes.

Beyond the trails, McDowell Mountain Ranch provides comprehensive community amenities that support active family life. The aquatic center offers swimming for fitness and recreation, while tennis and basketball courts provide additional athletic outlets. Community parks feature playgrounds, picnic areas, and open space for informal recreation. The community center hosts programming and events that bring neighbors together, building the connections that transform a development into a genuine community.

Families are drawn to McDowell Mountain Ranch by the combination of outdoor lifestyle and excellent schools. The Scottsdale Unified School District schools serving the community maintain the high standards that parents expect in North Scottsdale. Safe streets and family-friendly neighborhoods allow children the freedom to explore that suburban environments should provide but increasingly fail to deliver. The culture within the community emphasizes active living, with children growing up on bikes and trails rather than screens.

Housing within McDowell Mountain Ranch spans a range that accommodates various budgets and life stages. Townhomes and smaller single-family homes provide accessible entry points, while larger homes and custom estates offer the space and amenities that established families desire. The architectural styles harmonize with the desert environment, creating neighborhoods that feel connected to rather than imposed upon the landscape. The community's relative youth means most homes feature contemporary construction standards and energy efficiency.

The North Scottsdale location provides convenient access to shopping, dining, and employment centers while maintaining the connection to nature that defines the McDowell Mountain Ranch lifestyle. The Loop 101 freeway simplifies commutes throughout the Valley, while the community's position away from major arterials preserves the peaceful atmosphere that residents seek.`,
  stats: { avgPrice: '$1.1M', priceRange: '$450K - $3.5M', avgPpsf: '$365', avgDom: 35, inventory: 35, trend: '+9%' },
  zipCode: '85255',
  features: ['Preserve Access', 'Hiking & Biking', 'Community Parks', 'Top Schools', 'Mountain Views'],
  amenities: ['Community Center', 'Aquatic Center', 'Tennis', 'Trails', 'Parks'],
  signatureAmenity: {
    icon: 'Mountain',
    title: 'McDowell Sonoran Preserve Access',
    description: `The McDowell Sonoran Preserve represents one of the most ambitious urban conservation projects in American history—over 30,000 acres of pristine Sonoran Desert permanently protected for public enjoyment and ecological preservation. For McDowell Mountain Ranch residents, this extraordinary resource lies literally at their doorsteps, with community trails connecting directly to preserve trailheads and creating daily access to world-class outdoor recreation.

The preserve's 225+ miles of trails accommodate hikers, mountain bikers, and equestrians across terrain that ranges from gentle desert paths to challenging summit ascents. Signature hikes include the Tom's Thumb Trail, known for its dramatic rock formation destination, and the Gateway Loop, which provides a representative sample of Sonoran Desert ecology in a manageable distance. The trail system continues to expand as the city acquires additional parcels and constructs new routes.

The ecological diversity within the preserve provides constantly changing scenery throughout the seasons. Spring brings spectacular wildflower displays following winter rains, while autumn offers comfortable temperatures for extended adventures. Wildlife abounds, with regular sightings of deer, javelina, coyotes, and the diverse bird species that make the Sonoran Desert North America's most biodiverse desert ecosystem. The dark skies away from urban light pollution reveal star displays that city dwellers rarely experience.

For McDowell Mountain Ranch residents, the preserve transforms outdoor recreation from occasional activity into daily opportunity. Morning runs before work, evening hikes to catch sunset, weekend explorations of new trails—the proximity makes adventure routine rather than exceptional. Children growing up in the community develop connections to nature that shape lifelong values, while adults maintain fitness and mental wellness through regular engagement with the natural world.`,
    stats: [
      { value: '30,000+', label: 'Preserve Acres' },
      { value: '225+', label: 'Miles of Trails' },
      { value: 'Direct', label: 'Trail Access' },
      { value: 'Year-Round', label: 'Recreation' },
    ],
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200',
  },
});

const PINNACLE_PEAK = createNorthScottsdaleCommunity({
  id: 'pinnacle-peak',
  name: 'Pinnacle Peak',
  tagline: 'Iconic Desert Landmark Living',
  description: "The Pinnacle Peak area encompasses the neighborhoods surrounding Scottsdale's most iconic landmark. Custom estates on large lots offer unparalleled views of the distinctive peak and surrounding Sonoran Desert.",
  stats: { avgPrice: '$2.8M', priceRange: '$1M - $10M', avgPpsf: '$545', avgDom: 58, inventory: 28, trend: '+8%' },
  features: ['Iconic Views', 'Large Lots', 'Custom Estates', 'Hiking Trails', 'Desert Privacy'],
  amenities: ['Pinnacle Peak Park', 'Trail Access', 'Pinnacle Peak Patio', 'Local Dining'],
});

const KIERLAND = createNorthScottsdaleCommunity({
  id: 'kierland',
  name: 'Kierland',
  tagline: 'Urban Village Meets Golf Resort',
  description: 'Kierland combines the best of resort living with urban convenience. Anchored by the Westin Kierland Resort, Kierland Commons shopping, and three nine-hole golf courses, this community offers a walkable, vibrant lifestyle unique to Scottsdale.',
  narrative: `Kierland represents a vision of suburban living that challenges the conventional isolation of residential developments—a genuine urban village where residents can walk to world-class shopping and dining, enjoy resort amenities, play golf, and experience the vibrancy of a mixed-use environment that most Scottsdale communities lack. Developed in the late 1990s and early 2000s, Kierland has matured into one of the most sought-after addresses in Central Scottsdale for those who value convenience, walkability, and lifestyle amenity.

The development centers on Kierland Commons, an open-air shopping and dining destination that has become one of Scottsdale's premier gathering places. More than 70 stores, restaurants, and entertainment venues create a genuine town center experience, with tree-lined streets, outdoor patios, and gathering spaces that encourage lingering rather than rushed transactions. For residents of the surrounding neighborhoods, Kierland Commons provides daily convenience—coffee shops for morning routines, restaurants for casual dinners, retailers for essential needs—all within walking distance.

The Westin Kierland Resort and Spa adds a dimension of luxury that elevates the community experience. This AAA Four Diamond property provides spa services, multiple dining venues, and the sophisticated atmosphere of a destination resort without requiring travel. The Agave, The Scotch Library, and other Westin dining options become neighborhood gathering places, while the spa offers wellness services that enhance daily life. For residents entertaining out-of-town guests, the Westin provides accommodations and experiences that impress.

The Kierland Golf Club features three nine-hole courses—Acacia, Ironwood, and Mesquite—that can be played in various 18-hole combinations, providing variety that keeps the golf fresh through years of regular play. The Scott Miller-designed layouts wind through attractive desert landscaping, offering playable challenge for golfers at all skill levels. The golf club's restaurant and facilities serve as additional social spaces for the community.

Housing options within the Kierland area span a range that accommodates different preferences and life stages. Luxury condominiums and townhomes appeal to those seeking low-maintenance living with maximum lifestyle convenience, while single-family homes provide space for families who need yards and room to spread out. The community's position along the Scottsdale Road corridor provides easy access to employment centers, making Kierland practical for professionals who value minimizing commute while maximizing lifestyle.

The location at the intersection of Scottsdale Road and Greenway-Hayden Loop provides connectivity that few residential areas can match. The Loop 101 freeway is nearby, Phoenix Sky Harbor International Airport is approximately 20 minutes away, and the amenities of North Scottsdale, Paradise Valley, and Old Town are all accessible within reasonable drives. For those seeking walkability, convenience, and the vibrant energy of a genuine neighborhood, Kierland delivers an experience unique in the Scottsdale market.`,
  stats: { avgPrice: '$1.2M', priceRange: '$400K - $3M', avgPpsf: '$385', avgDom: 28, inventory: 42, trend: '+7%' },
  zipCode: '85254',
  features: ['Walkable', 'Resort Community', 'Shopping & Dining', 'Golf', 'Urban Convenience'],
  amenities: ['Kierland Commons', 'Westin Resort', 'Kierland Golf Club', 'Spa', 'Restaurants'],
  keyDistances: CENTRAL_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Kierland Commons',
    description: `Kierland Commons has established itself as one of Scottsdale's premier open-air shopping and dining destinations—a genuine town center that provides the walkable, vibrant environment that most suburban communities lack. More than 70 stores, restaurants, and entertainment venues create variety for different occasions and preferences, all arranged along tree-lined streets with outdoor patios and gathering spaces that encourage lingering.

For residents of the surrounding Kierland neighborhoods, the Commons transforms daily errands into pleasant outings. Coffee shops provide morning ritual spaces, restaurants offer convenient dinner options when cooking loses its appeal, and retailers address needs from fashion to specialty goods without requiring drives across the Valley. The ability to walk to dinner, browse shops after, and stroll home captures an urban lifestyle within Scottsdale's suburban context.

The dining scene at Kierland Commons rivals dedicated restaurant districts, with options spanning from casual to sophisticated. True Food Kitchen, North Italia, Zinburger, and numerous other concepts provide cuisine variety for different cravings and occasions. Patios take advantage of Arizona's exceptional climate, making al fresco dining practical for most of the year. Weekend brunch, weeknight dinners, and special occasions all find appropriate venues within walking distance.

The retail mix balances national brands with unique concepts, creating the selection that draws shoppers from throughout the Valley while serving residents' regular needs. Seasonal events, live music, and community gatherings transform the Commons into celebration space, building the connections that distinguish genuine neighborhoods from isolated developments. The combination of convenience, variety, and atmosphere explains why Kierland Commons has become central to the lifestyle that draws residents to the surrounding community.`,
    stats: [
      { value: '70+', label: 'Shops & Restaurants' },
      { value: 'Walkable', label: 'Lifestyle' },
      { value: '3', label: 'Golf Courses' },
      { value: 'Westin', label: 'Resort' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

const BOULDERS = createNorthScottsdaleCommunity({
  id: 'boulders',
  name: 'The Boulders',
  tagline: 'Iconic Desert Resort Living',
  description: "The Boulders is one of Arizona's most iconic luxury communities, famous for its dramatic 12-million-year-old granite boulder formations. Home to the legendary Boulders Resort & Spa, this community offers world-class golf, stunning Sonoran Desert scenery.",
  narrative: `The Boulders exists in a landscape so dramatic, so otherworldly, that first-time visitors often find themselves reaching for cameras before they've even left their vehicles. The massive granite boulder formations that give this community its name have been sculpted by 12 million years of wind and weather into shapes that seem to defy gravity, creating a setting that photographers, artists, and architects have long recognized as among the most visually compelling in the American Southwest.

This extraordinary terrain became the foundation for one of Arizona's most celebrated resort destinations when The Boulders Resort & Spa opened in 1984, quickly establishing itself as a world-class destination that drew discerning travelers from around the globe. The resort's architecture—designed to nestle into the boulder formations rather than compete with them—set a standard for desert design that influenced countless subsequent developments. For residents of The Boulders community, this legendary resort serves as an extension of home, providing spa services, dining experiences, and recreational amenities that enhance daily life without requiring travel.

The two Jay Morrish-designed golf courses—North and South—wind through the boulder formations in layouts that golfers remember long after the scorecards have been forgotten. The routing required extraordinary sensitivity to the natural features, creating holes that play through, around, and beneath the massive rock formations. Both courses have earned recognition among Arizona's finest resort layouts, providing challenge and visual drama in equal measure. For residents, preferred access and member programs provide the benefits of belonging to a private club while maintaining the option to host guests for memorable rounds.

The Golden Door Spa at The Boulders has established itself as one of the premier spa destinations in the Southwest, offering treatments that draw upon the healing traditions of the Sonoran Desert alongside contemporary wellness approaches. The spa's architecture—featuring individual treatment casitas tucked among the boulders—creates an environment that enhances the therapeutic experience. Fitness facilities, pools, and wellness programming complement the spa services, supporting residents' health and relaxation goals.

Custom homes within The Boulders community have been designed by architects who understand the exceptional opportunity—and responsibility—that comes with building in this setting. The best examples integrate so seamlessly with the boulder formations that they seem to have emerged organically from the landscape, while still providing the amenities and comforts that luxury buyers expect. Natural materials, careful orientation, and respect for the existing terrain characterize successful Boulders architecture.

The location in the Carefree-Cave Creek corridor provides access to the charming downtowns of both communities while maintaining the sense of seclusion that the boulder formations create. The elevation at approximately 2,500 feet provides cooler temperatures than the Valley floor, while the dark sky conditions reveal spectacular stargazing opportunities. Wildlife remains abundant, and the community's integration with the natural landscape means that desert flora and fauna remain constant companions.`,
  stats: { avgPrice: '$2.4M', priceRange: '$1M - $8M', avgPpsf: '$520', avgDom: 52, inventory: 24, trend: '+10%' },
  zipCode: '85377',
  features: ['Resort Community', 'Boulder Formations', 'Two Golf Courses', 'Spa & Wellness', 'Natural Beauty'],
  amenities: ['Boulders Resort & Spa', 'Jay Morrish Golf', 'Tennis', 'Fine Dining', 'Hiking'],
  keyDistances: CAREFREE_DISTANCES,
  schools: CAREFREE_SCHOOLS,
  restaurants: CAREFREE_RESTAURANTS,
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Boulders Resort & Spa',
    description: `The Boulders Resort & Spa has defined Arizona luxury hospitality since 1984, when it opened amid the 12-million-year-old granite formations that create one of the most visually dramatic settings in the American Southwest. For community residents, this world-renowned resort functions as an extension of home—a place where spa treatments, fine dining, golf, and the simple pleasure of wandering through spectacular scenery are available without the inconvenience of travel.

The two Jay Morrish-designed golf courses—North and South—represent some of the most memorable resort golf in Arizona. The routing required extraordinary sensitivity to the natural features, creating holes that play through, around, and beneath the massive boulder formations. Golfers routinely cite specific holes that left lasting impressions—tee shots framed by towering rocks, approach shots to greens tucked into natural amphitheaters, putts made while hawks circle overhead. For serious golfers, the courses provide genuine challenge; for casual players, the visual drama compensates for any frustration with the scores.

The Golden Door Spa stands as one of the premier wellness destinations in the Southwest, offering a comprehensive menu of treatments that range from traditional massage to cutting-edge aesthetic services. The architecture—featuring individual treatment casitas tucked among the boulders—creates an environment that enhances the therapeutic experience. Residents can incorporate spa visits into their regular wellness routines, enjoying benefits that resort guests experience only during brief stays.

Dining at The Boulders ranges from casual poolside fare to sophisticated cuisine at Palo Verde, where the culinary team creates memorable experiences in a setting that fully embraces the natural beauty. Special occasions, date nights, and simply dining well without leaving the neighborhood—the resort provides options for every occasion and appetite.`,
    stats: [
      { value: '2', label: 'Golf Courses' },
      { value: 'Golden Door', label: 'Spa' },
      { value: '12M', label: 'Year Old Boulders' },
      { value: 'Iconic', label: 'Setting' },
    ],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
  },
});

const SCOTTSDALE_MOUNTAIN = createNorthScottsdaleCommunity({
  id: 'scottsdale-mountain',
  name: 'Scottsdale Mountain',
  tagline: 'Guard-Gated Mountain Retreat',
  description: 'Scottsdale Mountain is a guard-gated community offering custom homes with exceptional city light and mountain views. The elevated location provides a private retreat while maintaining easy access to North Scottsdale amenities.',
  stats: { avgPrice: '$1.5M', priceRange: '$700K - $3.5M', avgPpsf: '$385', avgDom: 42, inventory: 18, trend: '+7%' },
  zipCode: '85255',
  features: ['Guard-Gated', 'City Light Views', 'Mountain Setting', 'Custom Homes', 'Privacy'],
  amenities: ['Community Center', 'Pool', 'Tennis', 'Hiking Access', 'Social Events'],
});

const SINCUIDADOS = createNorthScottsdaleCommunity({
  id: 'sincuidados',
  name: 'Sincuidados',
  tagline: 'Without a Care in the World',
  description: 'Sincuidados, meaning "without cares" in Spanish, lives up to its name with a relaxed luxury lifestyle. This guard-gated community features custom homes on large desert lots with stunning Sonoran Desert and mountain views.',
  stats: { avgPrice: '$2.1M', priceRange: '$1M - $5M', avgPpsf: '$475', avgDom: 50, inventory: 12, trend: '+9%' },
  features: ['Guard-Gated', 'Desert Lots', 'Mountain Views', 'Custom Estates', 'Privacy'],
  amenities: ['Community Center', 'Pool', 'Tennis Courts', 'Natural Desert', 'Social Events'],
});

const PIMA_ACRES = createNorthScottsdaleCommunity({
  id: 'pima-acres',
  name: 'Pima Acres',
  tagline: 'Horse Property Paradise',
  description: 'Pima Acres is a prestigious equestrian community in North Scottsdale featuring large lots perfect for horse enthusiasts. Custom estates on multi-acre parcels offer the quintessential Arizona horse property lifestyle.',
  stats: { avgPrice: '$2.4M', priceRange: '$1.2M - $6M', avgPpsf: '$425', avgDom: 55, inventory: 15, trend: '+9%' },
  zipCode: '85255',
  features: ['Equestrian Zoning', 'Multi-Acre Lots', 'Horse Facilities', 'Custom Estates', 'Mountain Views'],
  amenities: ['Riding Trails', 'Horse Properties', 'Mountain Views', 'Privacy', 'Open Space'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Equestrian Paradise',
    description: 'Pima Acres offers the premier equestrian lifestyle in Scottsdale with multi-acre lots, horse facilities, and access to miles of riding trails through pristine Sonoran Desert.',
    stats: [
      { value: '2-5', label: 'Acre Lots' },
      { value: 'Horse', label: 'Zoning' },
      { value: 'Miles', label: 'Of Trails' },
      { value: 'Custom', label: 'Estates' },
    ],
    image: 'https://images.unsplash.com/photo-1534313314376-2847290e3181?auto=format&fit=crop&q=80&w=1200',
  },
});

const PINNACLE_PEAK_CC = createNorthScottsdaleCommunity({
  id: 'pinnacle-peak-country-club',
  name: 'Pinnacle Peak Country Club',
  tagline: 'Private Golf at Pinnacle Peak',
  description: 'Pinnacle Peak Country Club is an exclusive golf community nestled at the base of Pinnacle Peak. Custom homes surround the private championship course, offering golf-course living with spectacular mountain views.',
  stats: { avgPrice: '$2.2M', priceRange: '$1M - $5M', avgPpsf: '$485', avgDom: 52, inventory: 10, trend: '+7%' },
  features: ['Private Golf Course', 'Pinnacle Peak Views', 'Guard-Gated', 'Custom Homes', 'Tennis'],
  amenities: ['Country Club', 'Tennis', 'Fitness Center', 'Dining', 'Social Events'],
});

const PINNACLE_PEAK_HEIGHTS = createNorthScottsdaleCommunity({
  id: 'pinnacle-peak-heights',
  name: 'Pinnacle Peak Heights',
  tagline: 'Elevated Views Near the Peak',
  description: 'Pinnacle Peak Heights offers elevated homesites with commanding views of Pinnacle Peak and the surrounding Sonoran Desert. Custom estates on hillside lots provide dramatic vistas and exceptional privacy.',
  stats: { avgPrice: '$2.5M', priceRange: '$1.2M - $6M', avgPpsf: '$515', avgDom: 58, inventory: 8, trend: '+10%' },
  features: ['Hillside Lots', 'Panoramic Views', 'Custom Estates', 'High Desert', 'Privacy'],
  amenities: ['Pinnacle Peak Park', 'Hiking Trails', 'Natural Desert', 'Privacy', 'Views'],
});

const PINNACLE_PEAK_VISTAS = createNorthScottsdaleCommunity({
  id: 'pinnacle-peak-vistas',
  name: 'Pinnacle Peak Vistas',
  tagline: 'Desert Vistas & Mountain Views',
  description: 'Pinnacle Peak Vistas is a luxury community offering sweeping desert and mountain views. Semi-custom and custom homes on generous lots provide an ideal blend of privacy and accessibility to North Scottsdale amenities.',
  stats: { avgPrice: '$1.7M', priceRange: '$800K - $3.5M', avgPpsf: '$425', avgDom: 45, inventory: 14, trend: '+8%' },
  features: ['Desert Vistas', 'Mountain Views', 'Custom Homes', 'Generous Lots', 'Privacy'],
  amenities: ['Community Amenities', 'Trail Access', 'Natural Desert', 'Close to Dining'],
});

const CANYON_HEIGHTS = createNorthScottsdaleCommunity({
  id: 'canyon-heights',
  name: 'Canyon Heights',
  tagline: 'Elevated Desert Living',
  description: 'Canyon Heights offers stunning canyon and mountain views in North Scottsdale. Custom homes on generous lots provide privacy and unobstructed desert panoramas, making it a sought-after destination for those seeking natural beauty.',
  stats: { avgPrice: '$1.9M', priceRange: '$900K - $4.5M', avgPpsf: '$445', avgDom: 48, inventory: 12, trend: '+8%' },
  features: ['Canyon Views', 'Custom Homes', 'Large Lots', 'Natural Desert', 'Privacy'],
  amenities: ['Hiking Access', 'Mountain Views', 'Privacy', 'Close to Amenities'],
});

// ============================================
// CENTRAL SCOTTSDALE COMMUNITIES
// ============================================

const createCentralScottsdaleCommunity = (
  overrides: Partial<CommunityData> & Pick<CommunityData, 'id' | 'name' | 'tagline' | 'description' | 'stats'>
): CommunityData => ({
  city: 'Scottsdale',
  region: 'central-scottsdale',
  narrative: overrides.description + '\n\nCentral Scottsdale offers the best of both worlds—convenient access to Old Town\'s dining and entertainment with quieter residential neighborhoods.',
  heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  elevation: "1,250'",
  zipCode: '85254',
  coordinates: [33.5500, -111.9100],
  features: ['Central Location', 'Established', 'Convenient Access'],
  amenities: ['Shopping', 'Dining', 'Parks', 'Recreation'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics(overrides.stats.avgPrice),
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: CENTRAL_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: CENTRAL_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Central Scottsdale Living',
    description: 'Experience the convenience of Central Scottsdale with easy access to Old Town, shopping, dining, and entertainment while enjoying established residential neighborhoods.',
    stats: [
      { value: '10 min', label: 'To Old Town' },
      { value: '15 min', label: 'To Airport' },
      { value: 'A+', label: 'Schools' },
      { value: 'Central', label: 'Location' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
  metrics: generateMetrics(overrides.stats.avgPrice, overrides.stats.avgDom, overrides.stats.avgPpsf, overrides.stats.trend),
  ...overrides,
});

const CENTRAL_SCOTTSDALE = createCentralScottsdaleCommunity({
  id: 'central-scottsdale',
  name: 'Central Scottsdale',
  tagline: 'The Heart of Scottsdale',
  description: "Central Scottsdale offers the best of both worlds—convenient access to Old Town's dining and entertainment with quieter residential neighborhoods. A diverse mix of mid-century homes, new construction, and luxury estates.",
  stats: { avgPrice: '$1.2M', priceRange: '$400K - $4M', avgPpsf: '$385', avgDom: 32, inventory: 85, trend: '+6%' },
  zipCode: '85251',
  features: ['Central Location', 'Diverse Housing', 'Old Town Access', 'Established', 'Walkable Areas'],
  amenities: ['Indian Bend Wash', 'Greenbelt', 'Parks', 'Dining & Shopping', 'Entertainment'],
});

const SCOTTSDALE_RANCH = createCentralScottsdaleCommunity({
  id: 'scottsdale-ranch',
  name: 'Scottsdale Ranch',
  tagline: 'Lakefront & Golf Community',
  description: 'Scottsdale Ranch is a master-planned community featuring multiple lakes, a championship golf course, and a variety of home styles. Waterfront properties and golf course homes are particularly sought after in this established neighborhood.',
  stats: { avgPrice: '$1.1M', priceRange: '$500K - $3M', avgPpsf: '$355', avgDom: 35, inventory: 32, trend: '+7%' },
  zipCode: '85258',
  features: ['Lakefront Homes', 'Golf Course', 'Parks & Trails', 'Established', 'Waterfront'],
  amenities: ['Scottsdale Ranch Park', 'McCormick Ranch Golf', 'Lakes', 'Tennis', 'Paths'],
});

const STONEGATE = createCentralScottsdaleCommunity({
  id: 'stonegate',
  name: 'Stonegate',
  tagline: 'Family-Friendly North Scottsdale',
  description: 'Stonegate is a popular master-planned community in North Scottsdale known for its excellent schools, family amenities, and well-maintained common areas. A variety of floor plans cater to different family needs.',
  stats: { avgPrice: '$850K', priceRange: '$450K - $1.5M', avgPpsf: '$315', avgDom: 28, inventory: 28, trend: '+8%' },
  zipCode: '85255',
  features: ['Top Schools', 'Family-Friendly', 'Community Pools', 'Parks', 'Well-Maintained'],
  amenities: ['Community Center', 'Pools', 'Playgrounds', 'Sports Courts', 'Events'],
});

// ============================================
// SOUTH SCOTTSDALE COMMUNITIES
// ============================================

const createSouthScottsdaleCommunity = (
  overrides: Partial<CommunityData> & Pick<CommunityData, 'id' | 'name' | 'tagline' | 'description' | 'stats'>
): CommunityData => ({
  city: 'Scottsdale',
  region: 'south-scottsdale',
  narrative: overrides.description + '\n\nSouth Scottsdale offers established neighborhoods with convenient access to Old Town, the Greenbelt, and the best of Scottsdale living.',
  heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  elevation: "1,200'",
  zipCode: '85251',
  coordinates: [33.4942, -111.9261],
  features: ['Established', 'Convenient', 'Urban Access'],
  amenities: ['Dining', 'Shopping', 'Entertainment', 'Recreation'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics(overrides.stats.avgPrice),
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: CENTRAL_SCOTTSDALE_SCHOOLS,
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: CENTRAL_SCOTTSDALE_DISTANCES,
  signatureAmenity: {
    icon: 'TreePine',
    title: 'South Scottsdale Living',
    description: 'Established neighborhoods with convenient access to Old Town, the Greenbelt, and the vibrant heart of Scottsdale.',
    stats: [
      { value: '5 min', label: 'To Old Town' },
      { value: 'Walkable', label: 'Lifestyle' },
      { value: 'Greenbelt', label: 'Access' },
      { value: 'Vibrant', label: 'Community' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
  metrics: generateMetrics(overrides.stats.avgPrice, overrides.stats.avgDom, overrides.stats.avgPpsf, overrides.stats.trend),
  ...overrides,
});

const GAINEY_RANCH = createSouthScottsdaleCommunity({
  id: 'gainey-ranch',
  name: 'Gainey Ranch',
  tagline: 'Timeless Elegance Since 1984',
  description: "Gainey Ranch is one of Scottsdale's most prestigious addresses, featuring lush landscapes, three golf courses, and a range of properties from condos to grand estates. The community's mature trees and waterways create a unique desert oasis.",
  narrative: `Gainey Ranch occupies a unique position in Scottsdale's residential hierarchy—a community that combines the prestige of an established legacy address with the lush, resort-style environment that distinguishes it from the typical desert aesthetic. Since its development in 1984 on the historic Gainey family ranch land, this 560-acre community has matured into one of the most desirable addresses in Central Scottsdale, with towering trees, flowing waterways, and manicured grounds creating an oasis that feels worlds apart from the surrounding Sonoran Desert.

The landscape within Gainey Ranch provides its most distinctive feature. Where most Scottsdale communities celebrate the desert with saguaros and decomposed granite, Gainey Ranch created a green paradise with lawns, mature trees, and lakes that evoke resort destinations rather than desert living. Forty years of growth have produced a mature landscape that cannot be replicated—trees that provide genuine shade, established plantings that soften architectural lines, and an ecosystem that supports diverse wildlife including the waterfowl that make the community's lakes their home.

The three championship golf courses—Arroyo, Lakes, and Dunes—provide variety that keeps the golf experience fresh through season after season of play. Each course offers distinct character while maintaining the quality conditioning that the Gainey Ranch Golf Club is known for. The routing incorporates the community's waterways and mature landscaping, creating experiences that differ markedly from the desert golf found elsewhere in Scottsdale. For residents who play regularly, having three courses available means never growing bored with familiar holes.

The Hyatt Regency Scottsdale Resort and Spa at Gainey Ranch adds a dimension of resort luxury that enhances daily life for community residents. World-class dining, the Spa Avania, and the sophisticated ambiance of a major resort property are available just minutes—or a pleasant walk—from home. For entertaining out-of-town guests, celebrating special occasions, or simply enjoying amenities beyond those at home, the Hyatt provides options that few residential communities can match.

Housing options within Gainey Ranch span a remarkable range, from luxury condominiums in gated enclaves to estate homes exceeding $10 million that rank among the finest in Central Scottsdale. This diversity creates a community where buyers can find appropriate homes at various life stages while maintaining the prestigious Gainey Ranch address. The guard-gated security throughout the community provides peace of mind, while the active homeowners association maintains the standards that protect property values and quality of life.

The location provides exceptional convenience, with easy access to Old Town Scottsdale's dining and entertainment, Scottsdale Fashion Square shopping, and the employment centers of the Scottsdale corridor. Phoenix Sky Harbor International Airport is approximately 20 minutes away, making Gainey Ranch practical for residents who travel frequently.`,
  stats: { avgPrice: '$1.8M', priceRange: '$500K - $6M', avgPpsf: '$485', avgDom: 42, inventory: 35, trend: '+9%' },
  zipCode: '85258',
  features: ['Three Golf Courses', 'Lakes & Waterways', 'Guard-Gated', 'Hyatt Resort', 'Mature Landscaping'],
  amenities: ['Gainey Ranch Golf Club', 'Hyatt Regency', 'Tennis', 'Spa', 'Fine Dining'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Hyatt Regency Scottsdale',
    description: `The Hyatt Regency Scottsdale Resort and Spa at Gainey Ranch provides community residents with resort-caliber amenities literally in their neighborhood—a world-class property that enhances daily life without requiring the inconvenience of travel. For Gainey Ranch residents, the Hyatt functions as an extension of home, offering dining, spa services, recreation, and the sophisticated atmosphere of a major resort destination.

Spa Avania has earned recognition as one of the premier wellness destinations in the Scottsdale area, offering a comprehensive menu of treatments from therapeutic massage to advanced aesthetic services. The spa's contemporary design and professional staff create an environment that supports relaxation and rejuvenation. Residents can incorporate spa visits into their regular wellness routines.

The dining options at the Hyatt provide variety for different occasions and appetites. SWB, a Southwest Bistro offers farm-to-table cuisine in a sophisticated setting, while Alto Ristorante e Bar brings Italian traditions to the desert. The pools, fitness facilities, and recreational programming provide additional amenities that complement residents' own homes. The integration of this world-class resort into the community fabric distinguishes Gainey Ranch from competitors and contributes significantly to its enduring appeal.`,
    stats: [
      { value: '3', label: 'Golf Courses' },
      { value: 'Hyatt', label: 'Resort' },
      { value: 'Spa Avania', label: 'Wellness' },
      { value: '40 Yrs', label: 'Mature Landscape' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

const MCCORMICK_RANCH = createSouthScottsdaleCommunity({
  id: 'mccormick-ranch',
  name: 'McCormick Ranch',
  tagline: "Arizona's First Master-Planned Community",
  description: "McCormick Ranch, established in the 1970s, was Arizona's first master-planned community. Known for its lakes, golf courses, and bike paths, it offers a range of housing options and a convenient Central Scottsdale location.",
  narrative: `McCormick Ranch holds a distinctive place in Arizona history as the state's first master-planned community—the development that proved thoughtful planning could create residential environments superior to the haphazard growth that characterized so much Sun Belt development. When the Papaago Freeway (now Loop 101) was still distant future and Scottsdale was considered "far" from Phoenix, visionary developers transformed the historic McCormick cattle ranch into a planned community that would set standards for the countless developments that followed.

The lakes that give McCormick Ranch much of its character were integral to the original vision, providing water features that create both visual beauty and recreational opportunity. Fishing, paddle boarding, and simply enjoying the waterfront have become daily pleasures for residents who chose McCormick Ranch specifically for access to this unique amenity. The extensive system of paths and greenbelt areas connects neighborhoods and provides miles of routes for walking, jogging, and cycling—a commitment to active living that predated the current emphasis on walkability and connectivity.

The two golf courses—Pine and Palm at McCormick Ranch—provide convenient golf for residents while contributing to the community's visual character. The courses have matured over decades, with established trees and landscaping creating the sense of a traditional club rather than a desert layout. For residents who play regularly, having quality golf within the neighborhood simplifies the logistics of fitting rounds into busy schedules.

Housing within McCormick Ranch reflects the evolution of buyer preferences across five decades of development. Mid-century homes from the 1970s attract buyers seeking architectural character and larger lots, while newer construction provides contemporary amenities and energy efficiency. Condominiums and townhomes offer lower-maintenance options for those who prioritize flexibility, while single-family homes accommodate families who need space. This diversity creates opportunity for residents to transition through life stages without leaving the community they've come to appreciate.

The Central Scottsdale location provides exceptional convenience, with Old Town's restaurants and entertainment, Scottsdale Fashion Square shopping, and the employment corridors of the greater Scottsdale area all within easy reach. Phoenix Sky Harbor International Airport is approximately 15 minutes away, making McCormick Ranch practical for frequent travelers. The combination of established character, recreational amenities, and unmatched location explains why McCormick Ranch continues to attract buyers who appreciate value without sacrificing quality.`,
  stats: { avgPrice: '$1.1M', priceRange: '$400K - $3M', avgPpsf: '$365', avgDom: 30, inventory: 48, trend: '+7%' },
  zipCode: '85258',
  features: ['Lakes', 'Two Golf Courses', 'Bike Paths', 'Established', 'Diverse Housing'],
  amenities: ['McCormick Ranch Golf', 'Lakes', 'Greenbelt', 'Parks', 'Paths'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Lakes & Greenbelt System',
    description: `The lakes and greenbelt system that defines McCormick Ranch represents one of the most successful implementations of planned community recreation in Arizona—an interconnected network of waterways, paths, and open spaces that provides daily amenity and contributes to the community's distinctive character.

The lakes provide multiple recreational opportunities, from fishing and paddle boarding to simply enjoying waterfront views. Unlike the artificial ponds found in many developments, McCormick Ranch's lakes are large enough to support genuine activity and diverse enough to provide visual variety throughout the community. Waterfowl make their homes here, and the ecosystem that has developed over decades creates a living environment that enhances the residential experience.

The greenbelt pathway system connects neighborhoods throughout McCormick Ranch, providing miles of routes for walking, jogging, and cycling that separate pedestrians from vehicle traffic. Morning runners, evening strollers, and weekend cyclists share these paths, creating the casual encounters that build community. The paths connect to commercial areas as well, allowing residents to run errands or meet for coffee without driving.

Parks and gathering spaces throughout McCormick Ranch provide venues for community events, family celebrations, and the spontaneous play that children need. The investment in these amenities—made decades ago when the community was developed—has appreciated in value as subsequent generations have recognized that quality of life depends on more than square footage and finishes. McCormick Ranch proves that thoughtful planning creates lasting value.`,
    stats: [
      { value: '7', label: 'Community Lakes' },
      { value: 'Miles', label: 'Of Paths' },
      { value: '2', label: 'Golf Courses' },
      { value: '1st', label: 'Master-Planned in AZ' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

const OLD_TOWN = createSouthScottsdaleCommunity({
  id: 'old-town-scottsdale',
  name: 'Old Town Scottsdale',
  tagline: "The West's Most Western Town",
  description: "Old Town Scottsdale is the vibrant heart of the city, offering walkable access to world-class restaurants, galleries, and entertainment. Luxury condos, townhomes, and historic properties appeal to those seeking an urban desert lifestyle.",
  narrative: `Old Town Scottsdale represents something increasingly rare in the American Southwest—a walkable urban core where world-class restaurants, galleries, entertainment, and residential options converge to create a lifestyle defined by convenience, culture, and genuine vibrancy. Once marketed as "The West's Most Western Town" for its cowboy heritage and Western storefronts, Old Town has evolved into a sophisticated urban village while retaining enough historic character to remind residents and visitors of its frontier origins.

The art scene in Old Town Scottsdale rivals destinations many times its size. The Scottsdale Arts District contains over 100 galleries representing every style from traditional Southwestern and Western art to cutting-edge contemporary works. The Thursday evening ArtWalk has become a beloved tradition, drawing art enthusiasts who stroll from gallery to gallery enjoying wine, conversation, and the discovery of new artists. Major auction houses maintain Scottsdale presence, and the annual Scottsdale Art Auction has established the city as a significant player in the American art market. For collectors and those who simply appreciate beautiful things, Old Town provides constant stimulation.

Dining options span the full spectrum from casual spots perfect for lunch between galleries to sophisticated restaurants that would be destination-worthy in any major city. The concentration of quality restaurants within walking distance means residents can enjoy varied cuisines without driving—a luxury increasingly valued in an age of ride-sharing apps but appreciated most by those who can simply stroll home after an excellent meal. Seasonal outdoor patios take advantage of Arizona's climate, providing al fresco dining for most of the year.

The entertainment district provides nightlife options ranging from craft cocktail bars and wine lounges to high-energy clubs and live music venues. Whatever the preferred tempo, Old Town offers options within walking distance. This proximity transforms nights out from logistical challenges into spontaneous pleasures—decide on dinner, walk to a restaurant, extend the evening at a nearby bar, stroll home when the mood strikes.

Residential options within Old Town include luxury condominiums in new developments, historic properties from Scottsdale's earlier era, and everything in between. The urban format means most residences trade yards for walkability, an exchange that appeals to those who prefer restaurants to lawn mowers and gallery openings to garden maintenance. For buyers seeking low-maintenance living with maximum lifestyle amenity, Old Town delivers an experience unavailable elsewhere in the Valley.

The Civic Center Mall provides green space, public art, and venues for community events that bring residents together in celebration of their shared community. Scottsdale Fashion Square adds serious retail therapy to the walkable mix, while the nearby canal paths provide routes for exercise and relaxation. The combination creates an urban lifestyle unique in metropolitan Phoenix.`,
  stats: { avgPrice: '$950K', priceRange: '$300K - $5M', avgPpsf: '$525', avgDom: 35, inventory: 55, trend: '+5%' },
  features: ['Walkable', 'Arts & Culture', 'Dining & Nightlife', 'Urban Living', 'Historic'],
  amenities: ['Galleries', 'Restaurants', 'Entertainment District', 'Civic Center', 'Shopping'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Old Town Arts & Entertainment',
    description: `Old Town Scottsdale has established itself as one of the premier art destinations in the American West, with a concentration of galleries, auction houses, and creative energy that rivals cities many times its size. The Scottsdale Arts District alone contains over 100 galleries representing every style from traditional Southwestern and Western art to challenging contemporary works, creating a destination that rewards exploration and returns rewards to those who make regular visits.

The Thursday evening ArtWalk has become a beloved Scottsdale tradition, transforming the gallery district into a social occasion where art enthusiasts stroll from venue to venue, enjoying wine, conversation, and the discovery of new artists. The event draws residents and visitors alike, creating an atmosphere that makes art accessible and enjoyable rather than intimidating. For serious collectors, the galleries provide access to significant works from both established masters and emerging talents.

Beyond the visual arts, Old Town provides entertainment options spanning the full spectrum. Craft cocktail bars and wine lounges offer sophisticated evenings, while live music venues and high-energy clubs provide different tempos for different tastes. The theater scene includes both traditional venues and experimental spaces, while comedy clubs, jazz rooms, and specialty entertainment ensure variety. Whatever the preferred evening activity, Old Town offers options within walking distance.

The dining scene deserves its own recognition, with restaurants ranging from casual spots perfect for quick lunches to sophisticated destinations that would attract attention in any major city. The concentration of quality options within walkable distance means residents can enjoy varied cuisines without driving—a luxury that transforms dining from logistical challenge to spontaneous pleasure. Seasonal outdoor patios take advantage of Arizona's exceptional climate, providing al fresco enjoyment for most of the year.`,
    stats: [
      { value: '100+', label: 'Galleries' },
      { value: '200+', label: 'Restaurants' },
      { value: 'Walkable', label: 'Lifestyle' },
      { value: 'Weekly', label: 'Art Walk' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

// ============================================
// PARADISE VALLEY
// ============================================

const PARADISE_VALLEY: CommunityData = {
  id: 'paradise-valley',
  name: 'Paradise Valley',
  city: 'Paradise Valley',
  region: 'paradise-valley',
  tagline: 'The Beverly Hills of Arizona',
  description: "Paradise Valley is Arizona's most exclusive municipality, home to some of the state's finest estates. With a minimum one-acre lot requirement and no commercial development, Paradise Valley offers unparalleled privacy and luxury.",
  narrative: `Paradise Valley stands alone as Arizona's most prestigious address—an incorporated town that has maintained its character as a sanctuary of understated wealth and refined living since its founding in 1961, when residents voted to incorporate specifically to prevent the commercial development that was transforming surrounding communities. That founding vision has been preserved for over six decades, creating a community unlike any other in the American Southwest where privacy, natural beauty, and architectural excellence converge.

The statistics that define Paradise Valley are remarkable by any measure. With a median home value exceeding $4.2 million and some of the lowest population density in metropolitan Phoenix, this community of approximately 14,000 residents occupies prime real estate between Scottsdale and Phoenix, wrapped around the iconic Camelback Mountain that provides the backdrop for so many significant Arizona properties. The minimum one-acre lot requirement ensures genuine privacy between estates, while the complete prohibition of commercial development means residents enjoy a purely residential environment—no strip malls, no gas stations, no fast-food restaurants interrupting the tree-lined streets and mountain views.

The architectural diversity within Paradise Valley tells the story of Arizona's evolution as a destination for significant wealth. Mid-century modern masterpieces from the 1950s and 1960s—some designed by Frank Lloyd Wright and his Taliesin fellows—stand as historic treasures, their clean lines and organic integration with the landscape as compelling today as when they were built. Spanish colonial revival estates recall the romantic vision of the Arizona aristocracy, while contemporary architectural statements push boundaries with walls of glass, cantilevered structures, and designs that seem to defy gravity. What unites these diverse styles is scale, quality, and the confidence that comes from building in a community where neighbors appreciate rather than resist ambitious design.

World-renowned resorts dot the Paradise Valley landscape, providing residents with resort-caliber amenities without leaving their neighborhood. The Sanctuary on Camelback Mountain delivers spa services and fine dining in a setting consistently ranked among America's finest boutique resorts. Mountain Shadows has been reborn as a modern luxury destination with golf, pools, and the social scene that attracts sophisticated guests. The Hermosa Inn preserves the artistic legacy of cowboy artist Lon Megargee while providing intimate accommodations and excellent dining. The Omni Montelucia channels Andalusian elegance with its Joya Spa and Prado restaurant. These resorts enhance Paradise Valley living by providing options for entertaining guests, celebrating occasions, and enjoying resort experiences that are measured in minutes rather than hours of travel.

The community's location provides unmatched access to the best of the Scottsdale-Phoenix corridor. Old Town Scottsdale's galleries, restaurants, and entertainment are minutes away, as are the shopping destinations of Biltmore Fashion Park and Scottsdale Fashion Square. Phoenix Sky Harbor International Airport serves as a hub for major airlines, while Scottsdale Airport accommodates private aviation for those who prefer it. The hiking trails of Camelback Mountain and Mummy Mountain provide challenging recreation literally at residents' doorsteps, while the golf courses of Scottsdale and Phoenix offer nearly limitless options for those who play.

For families, Paradise Valley provides access to some of Arizona's finest schools while maintaining the safety and tranquility that parents prioritize. The community's dedicated police force ensures responsive service and maintains the security that significant homeowners expect. The result is an environment where children can explore independently while parents appreciate the combination of location, amenities, and the quality of life that justifies Paradise Valley's position at the top of Arizona's residential hierarchy.`,
  heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
  elevation: "1,400'",
  zipCode: '85253',
  coordinates: [33.5310, -111.9426],
  stats: {
    avgPrice: '$4.8M',
    priceRange: '$1.5M - $30M+',
    avgPpsf: '$765',
    avgDom: 68,
    inventory: 72,
    trend: '+12%',
  },
  metrics: generateMetrics('$4.8M', 68, '$765', '+12%'),
  features: ['1+ Acre Lots', 'No Commercial', 'Camelback Views', 'Resort Adjacent', 'Historic Estates', 'Ultimate Privacy'],
  amenities: ['Sanctuary Resort', 'Omni Montelucia', 'Mountain Shadows', 'Fine Dining', 'Spas'],
  lifestyleFeatures: [
    { icon: 'Mountain', title: 'Camelback Views', description: 'Stunning views of Camelback Mountain from estates throughout the town.', image: 'https://images.unsplash.com/photo-1545652985-5edd3ebc3437?auto=format&fit=crop&q=80&w=600' },
    { icon: 'Shield', title: 'Ultimate Privacy', description: 'Minimum one-acre lots and no commercial development ensure peace and privacy.', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600' },
    { icon: 'TreePine', title: 'Resort Living', description: 'World-class resorts including Sanctuary and Omni Montelucia within the town.', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600' },
    { icon: 'Zap', title: 'Historic Estates', description: 'Mid-century masterpieces alongside contemporary architectural statements.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600' },
  ],
  gallery: DEFAULT_GALLERY,
  demographics: {
    population: '14,500',
    medianAge: '54',
    collegeEducated: '82%',
    householdIncome: '$575K',
    homeOwnership: '92%',
    avgHomeValue: '$4.8M',
  },
  qualityOfLife: [
    { metric: 'Air Quality', value: 'Excellent', score: 94, icon: 'Wind', color: 'emerald' },
    { metric: 'Sunny Days', value: '299/yr', score: 82, icon: 'Sun', color: 'amber' },
    { metric: 'Crime Rate', value: 'Lowest', score: 99, icon: 'Shield', color: 'blue' },
    { metric: 'Healthcare', value: 'World-Class', score: 99, icon: 'Activity', color: 'rose' },
    { metric: 'Noise Level', value: 'Serene', score: 98, icon: 'VolumeX', color: 'indigo' },
    { metric: 'Light Pollution', value: 'Low', score: 88, icon: 'Moon', color: 'purple' },
  ],
  schools: PARADISE_VALLEY_SCHOOLS,
  restaurants: PARADISE_VALLEY_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: DEFAULT_AIRPORTS,
  keyDistances: PARADISE_VALLEY_DISTANCES,
  signatureAmenity: {
    icon: 'Mountain',
    title: 'Camelback Mountain',
    description: `Camelback Mountain defines Paradise Valley both literally and symbolically—the iconic landmark that rises from the desert floor to provide the backdrop for Arizona's most significant residential real estate. This distinctive formation, named for its resemblance to a kneeling camel, has become synonymous with Phoenix-area luxury, appearing in countless photographs, films, and marketing materials that capture the essence of Arizona living.

For Paradise Valley residents, Camelback Mountain provides more than scenery. Two challenging hiking trails—Echo Canyon and Cholla—offer strenuous climbs rewarded by panoramic views of the Valley of the Sun stretching to distant mountain ranges. These trails have become gathering places for the fitness-minded residents of Paradise Valley, where morning hikes provide both exercise and opportunity for social connection with neighbors who share the commitment to active living. The trails are demanding enough to provide genuine workout, yet accessible enough for regular use by those who maintain their conditioning.

The mountain's presence influences real estate values throughout Paradise Valley, with properties offering direct Camelback views commanding premium prices and attracting the most discerning buyers. The changing light across the mountain's face—from the pink glow of sunrise to the dramatic shadows of late afternoon to the silhouette against sunset skies—provides ever-changing beauty that residents never tire of observing. Many significant homes orient their primary living spaces to capture these views, with walls of glass framing the mountain as living art.

Beyond hiking, Camelback Mountain anchors a lifestyle defined by natural beauty and outdoor recreation. The Sanctuary on Camelback Mountain resort provides spa services, fine dining, and boutique accommodations that take full advantage of the setting. Mountain Shadows offers golf, swimming, and the social scene that sophisticated visitors seek. These resorts, along with several others within Paradise Valley's boundaries, provide residents with resort-caliber amenities literally in their neighborhood—no airport travel required for world-class relaxation and entertainment. The combination of the iconic mountain, the luxury resorts, and the purely residential character of the incorporated town creates an environment that fully justifies Paradise Valley's reputation as the Beverly Hills of Arizona.`,
    stats: [
      { value: '1+ Acre', label: 'Minimum Lots' },
      { value: 'No', label: 'Commercial' },
      { value: '5', label: 'Luxury Resorts' },
      { value: 'Dedicated', label: 'Police Force' },
    ],
    image: 'https://images.unsplash.com/photo-1545652985-5edd3ebc3437?auto=format&fit=crop&q=80&w=1200',
  },
  listings: [
    { id: 1, price: "$8,500,000", ppsf: "$895", beds: 6, baths: 8, sqft: 9500, address: "6001 E Naumann Dr", status: "Active", lot: "2.1 Acres", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800" },
    { id: 2, price: "$5,750,000", ppsf: "$765", beds: 5, baths: 6, sqft: 7500, address: "5825 E Mockingbird Ln", status: "Active", lot: "1.5 Acres", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" },
    { id: 3, price: "$12,900,000", ppsf: "$1,075", beds: 7, baths: 9, sqft: 12000, address: "4700 E Marston Dr", status: "Coming Soon", lot: "3.2 Acres", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800" },
    ...DEFAULT_LISTINGS.slice(3),
  ],
};

// ============================================
// CAREFREE & CAVE CREEK
// ============================================

const createCarefreeCommunity = (
  overrides: Partial<CommunityData> & Pick<CommunityData, 'id' | 'name' | 'city' | 'tagline' | 'description' | 'stats'>
): CommunityData => ({
  region: 'carefree-cave-creek',
  narrative: overrides.description + '\n\nThis unique community offers the best of desert living with Western charm, artistic culture, and stunning natural beauty.',
  heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
  elevation: "2,500'",
  zipCode: '85377',
  coordinates: [33.8220, -111.9180],
  features: ['Desert Setting', 'Western Heritage', 'Arts Community'],
  amenities: ['Local Dining', 'Art Galleries', 'Hiking', 'Events'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: generateDemographics(overrides.stats.avgPrice),
  qualityOfLife: [
    { metric: 'Air Quality', value: 'Pristine', score: 98, icon: 'Wind', color: 'emerald' },
    { metric: 'Sunny Days', value: '299/yr', score: 82, icon: 'Sun', color: 'amber' },
    { metric: 'Crime Rate', value: 'Very Low', score: 96, icon: 'Shield', color: 'blue' },
    { metric: 'Healthcare', value: 'Good', score: 85, icon: 'Activity', color: 'rose' },
    { metric: 'Noise Level', value: 'Serene', score: 99, icon: 'VolumeX', color: 'indigo' },
    { metric: 'Light Pollution', value: 'Dark Sky', score: 98, icon: 'Moon', color: 'purple' },
  ],
  schools: CAREFREE_SCHOOLS,
  restaurants: CAREFREE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: {
    private: { name: 'Scottsdale Airport (KSDL)', type: 'Private/Executive', distance: '25 min', details: 'FBO services available' },
    commercial: { name: 'Phoenix Sky Harbor (PHX)', type: 'International', distance: '45 min', details: 'Direct flights to 100+ destinations' },
  },
  keyDistances: CAREFREE_DISTANCES,
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Sonoran Desert Living',
    description: 'Experience authentic Arizona with pristine desert landscapes, dark skies, and a laid-back lifestyle that celebrates the natural beauty of the Southwest.',
    stats: [
      { value: 'Dark Sky', label: 'Community' },
      { value: 'Pristine', label: 'Air Quality' },
      { value: 'Western', label: 'Heritage' },
      { value: 'Artistic', label: 'Culture' },
    ],
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
  metrics: generateMetrics(overrides.stats.avgPrice, overrides.stats.avgDom, overrides.stats.avgPpsf, overrides.stats.trend),
  ...overrides,
});

const CAREFREE = createCarefreeCommunity({
  id: 'carefree',
  name: 'Carefree',
  city: 'Carefree',
  tagline: 'Where Time Stands Still',
  description: "Carefree is a charming town known for its unique sundial, Spanish-style architecture, and artistic community. Luxury estates and custom homes offer a relaxed, small-town atmosphere just minutes from world-class golf and dining.",
  narrative: `Carefree embodies its name with an authenticity that distinguishes this small town from the more developed communities of metropolitan Phoenix. Founded in the late 1950s by K.T. Palmer and Tom Darlington as a planned community emphasizing Spanish colonial architecture and artistic culture, Carefree has matured into one of Arizona's most charming destinations—a place where the pace slows, where neighbors know one another, and where the stunning Sonoran Desert setting remains the dominant feature of daily life.

The town's signature feature—one of the largest sundials in the Western Hemisphere—sits at the heart of the charming downtown, marking time in the most appropriate way for a community that invites residents to step back from the frenetic pace of modern life. The 90-foot-wide sundial has become the symbol of Carefree, appearing in photographs and marketing materials that capture the town's unique character. Surrounding the sundial, the downtown district features art galleries showcasing Southwestern and contemporary works, boutiques offering carefully curated merchandise, and restaurants ranging from casual cafes to sophisticated dining.

The artistic community within Carefree deserves special recognition, as the town has become a genuine destination for collectors and art enthusiasts. Galleries represent both emerging and established artists, with particular strength in bronze sculpture, Southwestern painting, and contemporary works that respond to the desert environment. The Carefree Fine Art & Wine Festival draws thousands of visitors twice annually, showcasing over 100 juried artists in a setting that perfectly complements the creative works. For residents who appreciate visual arts, Carefree provides the kind of cultural environment typically found only in much larger cities.

The Boulders Resort & Spa, located just north of downtown Carefree, provides world-class amenities for residents and visitors alike. This iconic destination, built among 12-million-year-old granite boulder formations, offers two championship golf courses, the celebrated Golden Door Spa, and dining experiences that draw guests from around the world. For Carefree residents, the Boulders provides resort living without the inconvenience of travel—spa treatments, golf rounds, and special occasion dinners are measured in minutes rather than hours.

Custom homes and estates throughout Carefree reflect the architectural vision that has guided the town since its founding. Spanish colonial influences remain prominent, with stucco walls, tile roofs, and courtyards that respond appropriately to the desert climate. Contemporary interpretations have emerged in recent decades, with architects finding new ways to celebrate the natural setting while providing the amenities that luxury buyers expect. Lot sizes are generous, providing genuine privacy and room for the pools, outdoor living spaces, and desert landscaping that define Arizona estate living.

The elevation at approximately 2,500 feet provides modestly cooler temperatures than the Valley floor, while the dark sky ordinance protects spectacular stargazing opportunities that urban areas have lost to light pollution. Wildlife remains abundant, with residents routinely observing javelina, coyotes, roadrunners, and the diverse bird species that make the Sonoran Desert North America's most biodiverse desert ecosystem.`,
  stats: { avgPrice: '$1.8M', priceRange: '$600K - $8M', avgPpsf: '$425', avgDom: 55, inventory: 38, trend: '+8%' },
  features: ['Small Town Charm', 'Arts Community', 'Spanish Architecture', 'Desert Setting', 'Sundial Plaza'],
  amenities: ['Sundial Plaza', 'Art Galleries', 'Boutique Shopping', 'Fine Dining', 'Events'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Carefree Sundial',
    description: `The Carefree Sundial stands as one of the most distinctive landmarks in Arizona—a 90-foot-wide timepiece that marks the hours in the most appropriate manner for a town that invites residents to slow down and appreciate life's simple pleasures. Designed by John Yellott and built in 1959, this remarkable structure has become the symbol of Carefree, appearing in photographs, marketing materials, and the memories of countless visitors who have paused to watch the shadow mark time across the plaza.

The sundial sits at the heart of Carefree's charming downtown, surrounded by the galleries, boutiques, and restaurants that give the town center its distinctive character. Spanish colonial architecture creates a cohesive aesthetic, with stucco walls, tile roofs, and covered walkways that provide shade during warm months and shelter during occasional rain. The human scale of the buildings and the pedestrian-friendly layout encourage strolling, browsing, and the kind of spontaneous encounters that build community.

Art galleries occupy a prominent place in the downtown fabric, representing the artistic community that has flourished in Carefree since the town's founding. Bronze sculpture, Southwestern painting, contemporary works, and Native American art find appreciative audiences among residents and visitors alike. The galleries rotate exhibitions regularly, ensuring fresh discoveries for regular visitors, while the semi-annual Carefree Fine Art & Wine Festival draws collectors from throughout the region.

Dining options range from casual spots perfect for coffee and conversation to sophisticated restaurants suitable for special occasions. The outdoor patios take advantage of Arizona's exceptional climate, providing al fresco dining for most of the year. Live music, community events, and seasonal celebrations transform the downtown into gathering spaces where neighbors reconnect and visitors discover why Carefree lives up to its name. The combination of the iconic sundial, the artistic culture, and the small-town atmosphere creates a town center that residents genuinely enjoy rather than merely tolerate.`,
    stats: [
      { value: '90 ft', label: 'Sundial Width' },
      { value: '35', label: 'Art Galleries' },
      { value: 'Weekly', label: 'Art Events' },
      { value: 'Charming', label: 'Town Center' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

const CAVE_CREEK = createCarefreeCommunity({
  id: 'cave-creek',
  name: 'Cave Creek',
  city: 'Cave Creek',
  tagline: 'Where the Wild West Lives On',
  description: 'Cave Creek preserves its authentic Western heritage while offering luxury living in the Sonoran Desert. Custom estates on large lots, equestrian properties, and a vibrant downtown with saloons and shops attract those seeking rural luxury.',
  narrative: `Cave Creek preserves an authenticity that most Arizona communities have surrendered to development pressure—a genuine Western town where horses have the right of way, where saloons serve cold beer to dusty riders, and where the spirit of the Old West survives not as tourist attraction but as lived reality. This is not a theme park version of the American frontier; it is the real thing, adapted for contemporary life while maintaining the character that has defined Cave Creek since the 1870s.

The town's history stretches back to prospectors and ranchers who arrived seeking gold and grazing land in the decades following the Civil War. While the gold strikes proved modest, the ranching tradition took root in the lush riparian corridor of Cave Creek wash, where flowing water supported cattle operations that continued for generations. That heritage remains visible today in the hitching posts that line downtown streets, the equestrian trails that connect neighborhoods, and the working ranches that still operate on the town's fringes.

Downtown Cave Creek captures the imagination with its collection of saloons, shops, and restaurants that reject the sanitized aesthetic of planned communities in favor of genuine character. The Hideaway, Harold's Cave Creek Corral, and Buffalo Chip Saloon have achieved legendary status among those who appreciate cold drinks, live music, and the kind of unpretentious atmosphere that cannot be manufactured. These establishments draw riders who arrive on horseback, motorcyclists exploring the scenic roads of the high desert, and residents who appreciate that their hometown offers something genuinely different from the typical Arizona suburb.

For equestrian enthusiasts, Cave Creek provides one of the finest horse-friendly environments in the Phoenix metropolitan area. Multi-acre properties accommodate private horse facilities, while the town's trail system connects to regional networks that extend for miles through pristine Sonoran Desert. Morning rides through the desert, with saguaros silhouetted against the rising sun and wildlife going about their business, create experiences that suburban horse owners can only imagine. The annual rodeo and numerous equestrian events celebrate this heritage while building community among those who share the passion.

Custom estates throughout Cave Creek range from contemporary architectural statements to traditional Southwestern haciendas, united by generous lot sizes that provide privacy and room for the pools, outdoor entertaining areas, and horse facilities that buyers at this level expect. The lack of cookie-cutter subdivision development means that homes possess individual character, responding to their specific sites and reflecting the personal tastes of their owners. Recent years have seen increased interest from buyers seeking escape from more developed areas, drawn by Cave Creek's combination of authentic character, natural beauty, and proximity to the amenities of North Scottsdale.

The elevation at approximately 2,200 feet provides modestly cooler temperatures than Phoenix, while the surrounding Tonto National Forest ensures that undeveloped desert will remain visible from most properties. Dark skies reveal the stars that urban areas have lost to light pollution, and the sounds of coyotes and owls replace the traffic noise that characterizes more developed communities.`,
  stats: { avgPrice: '$1.4M', priceRange: '$500K - $6M', avgPpsf: '$365', avgDom: 48, inventory: 52, trend: '+7%' },
  zipCode: '85331',
  coordinates: [33.8320, -111.9510],
  features: ['Western Heritage', 'Equestrian', 'Large Lots', 'Desert Living', 'Authentic Saloons'],
  amenities: ['Downtown Shops', 'Western Saloons', 'Trail Riding', 'Local Events', 'Live Music'],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'Wild West Downtown',
    description: `Cave Creek's downtown district represents something increasingly rare in the American West—an authentic frontier town that continues to function as a living community rather than a museum or tourist attraction. The saloons, shops, and restaurants that line the main street have evolved from genuine frontier establishments, maintaining their character while adapting to serve contemporary residents and visitors who appreciate authenticity over manufactured charm.

The legendary saloons of Cave Creek have achieved almost mythical status among those who appreciate cold drinks, live music, and the kind of unpretentious atmosphere that cannot be replicated in planned developments. Buffalo Chip Saloon has hosted countless memorable nights of live country music, while Harold's Cave Creek Corral maintains traditions that stretch back decades. The Hideaway offers a somewhat more refined experience while preserving the casual character that defines Cave Creek hospitality. These establishments draw riders who arrive on horseback, motorcyclists exploring the scenic desert roads, and residents who appreciate that their hometown offers something genuinely different.

Beyond the saloons, downtown Cave Creek provides the shops, galleries, and services that support daily life while celebrating Western heritage. Western wear outfitters provide authentic gear for riders and those who appreciate the style. Art galleries showcase works that respond to the desert landscape and cowboy culture. Restaurants range from barbecue joints to fine dining, all maintaining the relaxed atmosphere that visitors and residents expect.

Year-round events transform downtown Cave Creek into celebration space, from the famous Taste of Cave Creek to the annual rodeo that draws competitors and spectators from throughout the region. The Christmas parade and holiday celebrations bring the community together in traditions that have continued for generations. The combination of authentic heritage, active saloon culture, and community events creates a downtown that residents genuinely enjoy rather than merely drive through—a genuine town center for a community that values authenticity above all.`,
    stats: [
      { value: 'Authentic', label: 'Western Town' },
      { value: 'Live', label: 'Music Venues' },
      { value: 'Horse', label: 'Friendly' },
      { value: 'Events', label: 'Year-Round' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
});

// ============================================
// PHOENIX
// ============================================

const DESERT_RIDGE: CommunityData = {
  id: 'desert-ridge',
  name: 'Desert Ridge',
  city: 'Phoenix',
  region: 'phoenix',
  tagline: "Phoenix's Premier Master-Planned Community",
  description: "Desert Ridge is North Phoenix's premier master-planned community, home to the JW Marriott Desert Ridge Resort, High Street shopping district, and diverse housing options from condos to luxury estates. Excellent schools and amenities make it ideal for families.",
  narrative: `Desert Ridge has emerged as North Phoenix's defining master-planned community—a development that proved the intersection of freeways and desert could become a vibrant, livable neighborhood where families thrive, businesses prosper, and resort-style amenities enhance daily life. Since development began in the early 2000s, Desert Ridge has grown from empty desert into one of the Valley's most sought-after addresses, attracting residents who value the combination of convenience, community, and quality that thoughtful planning creates.

The community's location at the intersection of the Loop 101 and State Route 51 freeways provides connectivity that few residential areas can match. Employment centers throughout the Valley are accessible within reasonable commute times, while Phoenix Sky Harbor International Airport is approximately 25 minutes away. For professionals whose careers require flexibility and mobility, Desert Ridge provides a home base that simplifies logistics while delivering the lifestyle amenities that make coming home a genuine pleasure.

High Street has evolved into the community's vibrant heart—a mixed-use district that brings shopping, dining, and entertainment together in a walkable environment that encourages spontaneous outings and casual encounters. Movie theaters, bowling, and seasonal events provide entertainment options without requiring drives across the Valley, while restaurants spanning casual to sophisticated ensure dining variety for different occasions. The outdoor concert series and community events transform High Street into celebration space, building the connections that transform neighbors into friends.

The JW Marriott Desert Ridge Resort adds a dimension of luxury that enhances daily life for community residents. The Revive Spa provides wellness services that would require travel to destination resorts in other communities, while multiple dining venues offer options for date nights and celebrations. The Wildfire Golf Club features two championship courses—Palmer and Faldo—that provide quality golf without venturing beyond the neighborhood. For entertaining out-of-town guests or simply enjoying resort amenities close to home, the JW Marriott delivers experiences that elevate the Desert Ridge lifestyle.

Families are drawn to Desert Ridge by the combination of excellent schools, safe streets, and the abundance of parks and recreational facilities that support active childhood development. Pinnacle High School has established itself as one of the premier public high schools in the Valley, while elementary and middle schools throughout the community maintain the standards that parents expect. Community centers, sports leagues, and youth programming provide structure and opportunity for children and teenagers, while the community's pedestrian-friendly design allows kids to grow into independence without the concerns that busier areas create.

Housing within Desert Ridge spans a range that accommodates different budgets and life stages. Entry-level homes provide accessibility for young families building equity, while larger custom homes offer the space and amenities that established families desire. The community's relatively young age means most homes benefit from contemporary construction standards and energy efficiency, while the active HOA maintains the common areas and standards that protect property values.`,
  heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  elevation: "1,500'",
  zipCode: '85050',
  coordinates: [33.6850, -111.9850],
  stats: {
    avgPrice: '$850K',
    priceRange: '$400K - $2.5M',
    avgPpsf: '$325',
    avgDom: 32,
    inventory: 65,
    trend: '+9%',
  },
  metrics: generateMetrics('$850K', 32, '$325', '+9%'),
  features: ['Master-Planned', 'Resort Living', 'Shopping & Dining', 'Top Schools', 'Family-Friendly', 'Golf'],
  amenities: ['JW Marriott Resort', 'High Street', 'Wildfire Golf', 'Community Parks', 'Rec Centers'],
  lifestyleFeatures: GOLF_LIFESTYLE_FEATURES,
  gallery: DEFAULT_GALLERY,
  demographics: {
    population: '45,000',
    medianAge: '38',
    collegeEducated: '58%',
    householdIncome: '$125K',
    homeOwnership: '72%',
    avgHomeValue: '$850K',
  },
  qualityOfLife: DEFAULT_QUALITY_OF_LIFE,
  schools: [
    { name: 'Pinnacle High School', type: 'Public 9-12', rating: 9, distance: '2 mi', students: 2400, highlight: 'A+ Rated' },
    { name: 'Explorer Middle School', type: 'Public 6-8', rating: 9, distance: '1 mi', students: 1100, highlight: 'STEM Focus' },
    { name: 'Desert Trails Elementary', type: 'Public K-5', rating: 9, distance: '1 mi', students: 650, highlight: 'Blue Ribbon' },
    { name: 'Basis Phoenix', type: 'Charter K-12', rating: 10, distance: '3 mi', students: 1000, highlight: 'Top Ranked' },
  ],
  restaurants: NORTH_SCOTTSDALE_RESTAURANTS,
  employers: DEFAULT_EMPLOYERS,
  economicStats: DEFAULT_ECONOMIC_STATS,
  airports: {
    private: { name: 'Scottsdale Airport (KSDL)', type: 'Private/Executive', distance: '20 min', details: 'FBO services available' },
    commercial: { name: 'Phoenix Sky Harbor (PHX)', type: 'International', distance: '25 min', details: 'Direct flights to 100+ destinations' },
  },
  keyDistances: [
    { place: 'Downtown Phoenix', time: '25 min', miles: '18 mi' },
    { place: 'Scottsdale', time: '15 min', miles: '10 mi' },
    { place: 'Phoenix Sky Harbor', time: '25 min', miles: '15 mi' },
    { place: 'Mayo Clinic', time: '15 min', miles: '8 mi' },
  ],
  signatureAmenity: {
    icon: 'TreePine',
    title: 'High Street & JW Marriott',
    description: `Desert Ridge benefits from the remarkable combination of High Street's vibrant mixed-use district and the JW Marriott Desert Ridge Resort—complementary amenities that together create a lifestyle unmatched in North Phoenix master-planned communities.

High Street functions as the community's social hub, bringing together shopping, dining, and entertainment in a walkable environment that encourages residents to leave their cars at home and enjoy spontaneous outings. More than 50 restaurants and retailers provide variety for different occasions, from quick lunches to leisurely dinners, from essential errands to browsing specialty shops. The movie theater, bowling alley, and entertainment options mean families can enjoy complete evenings without driving across the Valley. Seasonal events and concerts transform the district into celebration space, building community connections.

The JW Marriott Desert Ridge Resort adds resort luxury to daily Desert Ridge life. The Revive Spa provides comprehensive wellness services from massage and body treatments to salon services and fitness programming. Multiple restaurants offer dining variety from casual poolside fare to sophisticated cuisine suitable for special occasions. The meeting and event facilities provide venues for business entertaining and celebrations of all scales.

The Wildfire Golf Club, located within the resort, features two championship courses designed by Arnold Palmer and Nick Faldo respectively. Both layouts offer quality golf through dramatic Sonoran Desert terrain, providing residents with convenient access to excellent play without venturing beyond their neighborhood. Practice facilities, instruction, and the full club experience support golfers seeking to improve their games while enjoying the social benefits of club membership.`,
    stats: [
      { value: '50+', label: 'Shops & Restaurants' },
      { value: 'JW Marriott', label: 'Resort' },
      { value: '2', label: 'Golf Courses' },
      { value: 'Walkable', label: 'Town Center' },
    ],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
  listings: DEFAULT_LISTINGS,
};

// ============================================
// EXPORT ALL COMMUNITIES
// ============================================

export const COMMUNITIES: Record<string, CommunityData> = {
  // North Scottsdale
  'desert-mountain': DESERT_MOUNTAIN,
  'silverleaf': SILVERLEAF,
  'dc-ranch': DC_RANCH,
  'estancia': ESTANCIA,
  'mirabel': MIRABEL,
  'troon-north': TROON_NORTH,
  'grayhawk': GRAYHAWK,
  'desert-highlands': DESERT_HIGHLANDS,
  'whisper-rock': WHISPER_ROCK,
  'ancala': ANCALA,
  'terravita': TERRAVITA,
  'windgate-ranch': WINDGATE_RANCH,
  'troon-village': TROON_VILLAGE,
  'legend-trail': LEGEND_TRAIL,
  'mcdowell-mountain-ranch': MCDOWELL_MOUNTAIN_RANCH,
  'pinnacle-peak': PINNACLE_PEAK,
  'kierland': KIERLAND,
  'boulders': BOULDERS,
  'scottsdale-mountain': SCOTTSDALE_MOUNTAIN,
  'sincuidados': SINCUIDADOS,
  'pima-acres': PIMA_ACRES,
  'pinnacle-peak-country-club': PINNACLE_PEAK_CC,
  'pinnacle-peak-heights': PINNACLE_PEAK_HEIGHTS,
  'pinnacle-peak-vistas': PINNACLE_PEAK_VISTAS,
  'canyon-heights': CANYON_HEIGHTS,

  // Central Scottsdale
  'central-scottsdale': CENTRAL_SCOTTSDALE,
  'scottsdale-ranch': SCOTTSDALE_RANCH,
  'stonegate': STONEGATE,

  // South Scottsdale
  'gainey-ranch': GAINEY_RANCH,
  'mccormick-ranch': MCCORMICK_RANCH,
  'old-town-scottsdale': OLD_TOWN,

  // Paradise Valley
  'paradise-valley': PARADISE_VALLEY,

  // Carefree & Cave Creek
  'carefree': CAREFREE,
  'cave-creek': CAVE_CREEK,

  // Phoenix
  'desert-ridge': DESERT_RIDGE,
};

// Helper function to get community by ID
export const getCommunityById = (id: string): CommunityData | undefined => {
  return COMMUNITIES[id];
};

// Get all communities as array
export const getAllCommunities = (): CommunityData[] => {
  return Object.values(COMMUNITIES);
};

// Get communities by region
export const getCommunitiesByRegion = (region: string): CommunityData[] => {
  return Object.values(COMMUNITIES).filter(c => c.region === region);
};

// Re-export type
export type { CommunityData };
