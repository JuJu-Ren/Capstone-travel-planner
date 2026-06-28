export interface POI {
  name: string
  type: 'food' | 'art' | 'history' | 'nature' | 'event' | 'shopping'
  lat: number
  lng: number
  description: string
}

export interface City {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  photo: string
  tagline: string
  description: string
  history: string
  highlights: string[]
  lines: string[]
  amtrakFrom?: string
  pois: POI[]
}

export interface TrainLine {
  id: string
  name: string
  color: string
  stops: [number, number][]
}

export const cities: City[] = [
  {
    id: 'bos',
    name: 'Boston',
    state: 'MA',
    lat: 42.3519,
    lng: -71.0552,
    photo: 'https://picsum.photos/seed/boston-ma/400/250',
    tagline: 'The Cradle of Liberty',
    description: 'Boston is one of the oldest and most historically rich cities in America, blending colonial history with a vibrant modern culture. Home to world-class universities, a storied sports culture, and a thriving food scene.',
    history: 'Founded in 1630, Boston played a central role in the American Revolution. The city\'s Freedom Trail connects 16 historical sites across 2.5 miles. Boston has long been a hub for education, innovation, and Irish-American culture.',
    highlights: ['Walk the Freedom Trail', 'Fenway Park & Red Sox', 'Harvard & MIT in nearby Cambridge', 'Fresh seafood at Quincy Market', 'Isabella Stewart Gardner Museum'],
    lines: ['Acela', 'Northeast Regional', 'Lake Shore Limited'],
    pois: [
      { name: 'Quincy Market', type: 'food', lat: 42.3601, lng: -71.0544, description: 'Historic market hall with dozens of local food vendors and restaurants.' },
      { name: 'Museum of Fine Arts', type: 'art', lat: 42.3394, lng: -71.0965, description: 'One of the largest art museums in the US with 450,000+ works.' },
      { name: 'Freedom Trail', type: 'history', lat: 42.3601, lng: -71.0575, description: '2.5-mile red-brick path linking 16 Revolutionary War historic sites.' },
      { name: 'Fenway Park', type: 'event', lat: 42.3467, lng: -71.0972, description: 'America\'s oldest MLB ballpark, home of the Boston Red Sox.' },
      { name: 'North End', type: 'food', lat: 42.3647, lng: -71.0542, description: 'Boston\'s oldest neighborhood — the Italian heart of the city with authentic trattorias.' },
    ],
  },
  {
    id: 'nyc',
    name: 'New York City',
    state: 'NY',
    lat: 40.7505,
    lng: -73.9934,
    photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop',
    tagline: 'The City That Never Sleeps',
    description: 'New York City is the cultural, financial, and entertainment capital of the world. Five boroughs, 8+ million people, countless neighborhoods — each with its own personality. Every train line leads here.',
    history: 'Originally settled by the Lenape people, New York was colonized by the Dutch as New Amsterdam in 1626. It served as the first US capital and grew into a global metropolis through waves of immigration, becoming the world\'s most iconic skyline.',
    highlights: ['Times Square & Broadway shows', 'Central Park', 'World-class museums (The Met, MoMA)', 'Brooklyn Bridge & DUMBO', 'Diverse neighborhoods: Chinatown, Little Italy, Harlem'],
    lines: ['Acela', 'Northeast Regional', 'Empire Service', 'Lake Shore Limited', 'Crescent', 'Silver Star', 'NJ Transit', 'PATH', 'NYC Subway'],
    pois: [
      { name: 'The Metropolitan Museum of Art', type: 'art', lat: 40.7794, lng: -73.9632, description: 'One of the world\'s largest art museums with over 2 million works spanning 5,000 years.' },
      { name: 'Central Park', type: 'nature', lat: 40.7851, lng: -73.9683, description: '843 acres of urban nature in the heart of Manhattan with lakes, meadows and more.' },
      { name: 'Chelsea Market', type: 'food', lat: 40.7424, lng: -74.0048, description: 'Legendary food hall in a converted cookie factory with artisan vendors.' },
      { name: 'Brooklyn Bridge', type: 'history', lat: 40.7061, lng: -73.9969, description: 'Iconic 1883 suspension bridge with stunning views of the Manhattan skyline.' },
      { name: 'MoMA', type: 'art', lat: 40.7614, lng: -73.9776, description: 'Museum of Modern Art — home to Starry Night, Warhol, Picasso and beyond.' },
    ],
  },
  {
    id: 'nwk',
    name: 'Newark',
    state: 'NJ',
    lat: 40.7345,
    lng: -74.1641,
    photo: 'https://picsum.photos/seed/newark-nj/400/250',
    tagline: 'Gateway to the Garden State',
    description: 'Newark is New Jersey\'s largest city — a vibrant, underrated destination with rich Portuguese, Brazilian, and African-American heritage, world-class performing arts, and easy access to NYC via PATH and NJ Transit.',
    history: 'One of the oldest US cities (founded 1666), Newark thrived as an industrial powerhouse before economic decline. It has been undergoing a major renaissance, led by arts, tech, and immigrant communities.',
    highlights: ['Newark Museum of Art', 'Prudential Center concerts', 'Ironbound district Portuguese food', 'Branch Brook Park cherry blossoms', 'Quick PATH ride to NYC'],
    lines: ['Northeast Regional', 'NJ Transit NEC Line', 'PATH'],
    pois: [
      { name: 'Ironbound District', type: 'food', lat: 40.7288, lng: -74.1578, description: 'Vibrant Portuguese-Brazilian neighborhood with incredible steakhouses and bakeries.' },
      { name: 'Newark Museum of Art', type: 'art', lat: 40.7448, lng: -74.1726, description: 'New Jersey\'s largest museum with a renowned Tibetan art collection.' },
      { name: 'Branch Brook Park', type: 'nature', lat: 40.7640, lng: -74.1735, description: 'America\'s first county park — famous for its 5,000 cherry blossom trees.' },
    ],
  },
  {
    id: 'phi',
    name: 'Philadelphia',
    state: 'PA',
    lat: 39.9566,
    lng: -75.1817,
    photo: 'https://picsum.photos/seed/philadelphia-pa/400/250',
    tagline: 'The Birthplace of America',
    description: 'Philadelphia is where America was born — home to the Liberty Bell, Independence Hall, and the nation\'s first zoo. "Philly" also has one of the most exciting food scenes in the country, from cheesesteaks to James Beard Award-winning restaurants.',
    history: 'Founded by William Penn in 1682, Philadelphia served as the nation\'s first capital. The Declaration of Independence and the Constitution were both drafted and signed here. Its rich immigrant history gave rise to iconic food, jazz, and street art scenes.',
    highlights: ['Independence Hall & Liberty Bell', 'Philadelphia Museum of Art (Rocky steps)', 'Reading Terminal Market', 'Cheesesteaks at Pat\'s or Geno\'s', 'Mural Arts Philadelphia'],
    lines: ['Acela', 'Northeast Regional', 'SEPTA Regional Rail'],
    pois: [
      { name: 'Reading Terminal Market', type: 'food', lat: 39.9535, lng: -75.1593, description: 'One of America\'s oldest and largest public markets — Amish pretzels, cheesesteaks, and more.' },
      { name: 'Philadelphia Museum of Art', type: 'art', lat: 39.9657, lng: -75.1810, description: 'World-class museum with iconic Rocky steps and a stunning impressionist collection.' },
      { name: 'Independence Hall', type: 'history', lat: 39.9489, lng: -75.1500, description: 'UNESCO World Heritage Site where the Declaration of Independence was signed in 1776.' },
      { name: 'Eastern State Penitentiary', type: 'history', lat: 39.9684, lng: -75.1722, description: 'Hauntingly beautiful Gothic prison — now a museum and Halloween attraction.' },
    ],
  },
  {
    id: 'bal',
    name: 'Baltimore',
    state: 'MD',
    lat: 39.2904,
    lng: -76.6122,
    photo: 'https://picsum.photos/seed/baltimore-md/400/250',
    tagline: 'Charm City',
    description: 'Baltimore is a city of neighborhoods — from the famous Inner Harbor to Fells Point\'s cobblestone streets. It\'s one of the country\'s great crab cities, with a gritty charm and deep maritime history.',
    history: 'Founded in 1729, Baltimore was a key port city during the War of 1812 — Francis Scott Key wrote the Star-Spangled Banner here. It\'s the birthplace of Babe Ruth and home to one of America\'s oldest and most storied urban cultures.',
    highlights: ['Inner Harbor & USS Constellation', 'Maryland Blue Crabs', 'Fells Point historic waterfront', 'American Visionary Art Museum', 'Edgar Allan Poe House'],
    lines: ['Acela', 'Northeast Regional', 'MARC Train'],
    pois: [
      { name: 'Inner Harbor', type: 'event', lat: 39.2858, lng: -76.6122, description: 'Bustling waterfront with shops, museums, and the National Aquarium.' },
      { name: 'American Visionary Art Museum', type: 'art', lat: 39.2826, lng: -76.5992, description: 'Extraordinary museum dedicated to outsider and self-taught artists.' },
      { name: 'Lexington Market', type: 'food', lat: 39.2937, lng: -76.6218, description: 'One of America\'s oldest public markets, famous for fresh Maryland seafood.' },
    ],
  },
  {
    id: 'dca',
    name: 'Washington D.C.',
    state: 'DC',
    lat: 38.8975,
    lng: -77.0065,
    photo: 'https://picsum.photos/seed/washington-dc/400/250',
    tagline: 'The Nation\'s Capital',
    description: 'Washington D.C. is the political heart of the United States and home to world-class free museums, iconic monuments, and vibrant neighborhoods. The National Mall alone spans 2 miles of history.',
    history: 'Established in 1790 as a planned federal city, DC was designed by Pierre Charles L\'Enfant on land ceded by Maryland and Virginia. It has witnessed every chapter of American democracy — from Lincoln to Civil Rights to the present day.',
    highlights: ['All Smithsonian museums (free!)', 'National Mall & Lincoln Memorial', 'Georgetown waterfront', 'Cherry blossoms in spring', 'Kennedy Center for the Arts'],
    lines: ['Acela', 'Northeast Regional', 'Crescent', 'Capitol Limited', 'Cardinal', 'Silver Star', 'MARC Train', 'VRE'],
    pois: [
      { name: 'National Museum of Natural History', type: 'history', lat: 38.8913, lng: -77.0261, description: 'Free Smithsonian museum with the Hope Diamond, dinosaurs, and ocean halls.' },
      { name: 'Lincoln Memorial', type: 'history', lat: 38.8893, lng: -77.0502, description: 'Iconic neoclassical memorial overlooking the Reflecting Pool and National Mall.' },
      { name: 'National Gallery of Art', type: 'art', lat: 38.8913, lng: -77.0199, description: 'Free world-class art museum with da Vinci, Monet, Rembrandt and more.' },
      { name: 'Georgetown', type: 'food', lat: 38.9057, lng: -77.0637, description: 'Historic neighborhood with great restaurants, boutiques, and waterfront views.' },
      { name: 'Eastern Market', type: 'food', lat: 38.8836, lng: -76.9962, description: 'Capitol Hill\'s beloved public market with fresh produce, art, and weekend flea markets.' },
    ],
  },
  {
    id: 'ric',
    name: 'Richmond',
    state: 'VA',
    lat: 37.5411,
    lng: -77.4289,
    photo: 'https://picsum.photos/seed/richmond-va/400/250',
    tagline: 'RVA — Art, Beer & History',
    description: 'Richmond is one of America\'s most underrated cities — a craft beer capital, street art destination, and Civil War history hub all rolled into one. The James River runs through the heart of the city.',
    history: 'One of America\'s oldest cities, Richmond served as the capital of the Confederacy during the Civil War. Today it has transformed into a progressive, arts-forward city with a booming culinary scene and a thriving music community.',
    highlights: ['Belle Isle & James River rapids', 'Craft brewery scene', 'Virginia Museum of Fine Arts', 'Monument Avenue murals', 'Jackson Ward historic neighborhood'],
    lines: ['Northeast Regional', 'Crescent', 'Silver Star'],
    pois: [
      { name: 'Virginia Museum of Fine Arts', type: 'art', lat: 37.5657, lng: -77.4574, description: 'One of the largest art museums in the Southeast, with art from ancient times to today.' },
      { name: 'Belle Isle', type: 'nature', lat: 37.5258, lng: -77.4583, description: 'Island in the James River with hiking trails, river views, and kayaking.' },
      { name: 'Scott\'s Addition', type: 'food', lat: 37.5571, lng: -77.4744, description: 'Richmond\'s brewery district — dozens of craft breweries and eateries in converted warehouses.' },
    ],
  },
  {
    id: 'clt',
    name: 'Charlotte',
    state: 'NC',
    lat: 35.2271,
    lng: -80.8431,
    photo: 'https://picsum.photos/seed/charlotte-nc/400/250',
    tagline: 'Queen City',
    description: 'Charlotte is the South\'s fastest-growing major city — a financial powerhouse with great food, a vibrant arts scene, and easy access to the Blue Ridge Mountains and beaches.',
    history: 'Named after Queen Charlotte of England, the city was founded in 1768. It became the first US city to establish a branch of the US Mint (1837), and gold was discovered here before California\'s Gold Rush. Today it\'s a banking capital.',
    highlights: ['Whitewater Center outdoor adventures', 'NoDa arts district', 'NASCAR Hall of Fame', 'Uptown food & brewery scene', 'Carowinds theme park'],
    lines: ['Crescent'],
    pois: [
      { name: 'NoDa Arts District', type: 'art', lat: 35.2494, lng: -80.8254, description: 'Charlotte\'s bohemian arts neighborhood with galleries, studios, and live music.' },
      { name: 'US National Whitewater Center', type: 'nature', lat: 35.2680, lng: -80.9991, description: 'Outdoor recreation hub with rafting, climbing, mountain biking and zip lines.' },
      { name: 'Optimist Hall', type: 'food', lat: 35.2377, lng: -80.8502, description: 'Massive food hall in a historic textile mill with 20+ local vendors.' },
    ],
  },
  {
    id: 'atl',
    name: 'Atlanta',
    state: 'GA',
    lat: 33.7490,
    lng: -84.3880,
    photo: 'https://picsum.photos/seed/charlotte-nc/400/250',
    tagline: 'The City in a Forest',
    description: 'Atlanta is the cultural capital of the South — birthplace of Martin Luther King Jr., home to the world\'s busiest airport, and the unofficial capital of Black American culture, hip-hop, and the "New South."',
    history: 'Founded as a railroad terminus in 1836, Atlanta rose and fell with the Civil War (Sherman\'s March burned it to the ground in 1864), then rebuilt to become a global city. It hosted the 1996 Olympics and is headquarters to Coca-Cola, CNN, and Delta.',
    highlights: ['National Center for Civil and Human Rights', 'Martin Luther King Jr. National Historic Site', 'Atlanta BeltLine', 'Ponce City Market', 'Georgia Aquarium'],
    lines: ['Crescent'],
    pois: [
      { name: 'Ponce City Market', type: 'food', lat: 33.7718, lng: -84.3669, description: 'Iconic mixed-use development in a former Sears building on the Atlanta BeltLine.' },
      { name: 'MLK National Historic Site', type: 'history', lat: 33.7558, lng: -84.3745, description: 'Birthplace and church of Rev. Dr. Martin Luther King Jr. — a profound American landmark.' },
      { name: 'High Museum of Art', type: 'art', lat: 33.7903, lng: -84.3856, description: 'The South\'s premier art museum, designed by Richard Meier.' },
    ],
  },
  {
    id: 'nor',
    name: 'New Orleans',
    state: 'LA',
    lat: 29.9511,
    lng: -90.0715,
    photo: 'https://picsum.photos/seed/new-orleans-la/400/250',
    tagline: 'The Big Easy',
    description: 'New Orleans is unlike anywhere else in America — a city of jazz, Creole cuisine, Mardi Gras, and Gothic architecture where Caribbean, French, Spanish, and African cultures have fused into something entirely unique.',
    history: 'Founded by the French in 1718, New Orleans changed hands between France, Spain, and the US before becoming the cultural crossroads of the Americas. Jazz was born here. The city\'s Creole culture and cuisine are unmatched anywhere in the world.',
    highlights: ['Bourbon Street & French Quarter', 'Authentic Creole cuisine', 'Jazz clubs on Frenchmen Street', 'Garden District architecture', 'City Park & NOMA'],
    lines: ['Crescent', 'Sunset Limited'],
    pois: [
      { name: 'French Quarter', type: 'history', lat: 29.9584, lng: -90.0644, description: 'The oldest neighborhood in New Orleans — 13 blocks of history, music, and nightlife.' },
      { name: 'Frenchmen Street', type: 'event', lat: 29.9611, lng: -90.0524, description: 'The true soul of New Orleans jazz — live music spills out of bars every night.' },
      { name: 'Café Du Monde', type: 'food', lat: 29.9573, lng: -90.0618, description: 'Legendary 24-hour café serving beignets and chicory café au lait since 1862.' },
      { name: 'Garden District', type: 'history', lat: 29.9267, lng: -90.0900, description: 'Stunning antebellum mansions draped in Spanish moss along Magazine Street.' },
    ],
  },
  {
    id: 'mia',
    name: 'Miami',
    state: 'FL',
    lat: 25.7617,
    lng: -80.1918,
    photo: 'https://picsum.photos/seed/miami-fl/400/250',
    tagline: 'The Magic City',
    description: 'Miami is the gateway to Latin America — a neon-soaked city of Art Deco buildings, world-class beaches, incredible Cuban food, and nightlife that runs until dawn. Wynwood\'s street art scene is world-famous.',
    history: 'Incorporated in 1896, Miami grew rapidly during the Florida land boom of the 1920s. Its Art Deco historic district is the largest in the US. Waves of Cuban, Haitian, and South American immigration transformed it into the cultural capital of Latin America.',
    highlights: ['South Beach Art Deco Historic District', 'Wynwood Walls street art', 'Authentic Cuban food in Little Havana', 'Pérez Art Museum Miami', 'Everglades day trips'],
    lines: ['Silver Star', 'Silver Meteor', 'Brightline (to Orlando)'],
    pois: [
      { name: 'Wynwood Walls', type: 'art', lat: 25.8008, lng: -80.1997, description: 'The world\'s most famous outdoor street art museum — vibrant murals by global artists.' },
      { name: 'Little Havana', type: 'food', lat: 25.7660, lng: -80.2280, description: 'Cuban coffee, cigars, dominos, and some of the best Latin food in the US.' },
      { name: 'South Beach', type: 'event', lat: 25.7825, lng: -80.1301, description: 'Iconic beach with 1920s Art Deco architecture, ocean drives, and world-class people-watching.' },
      { name: 'Pérez Art Museum Miami', type: 'art', lat: 25.7747, lng: -80.1862, description: 'Stunning waterfront museum showcasing international and Latin American art.' },
    ],
  },
  {
    id: 'chi',
    name: 'Chicago',
    state: 'IL',
    lat: 41.8781,
    lng: -87.6298,
    photo: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=250&fit=crop',
    tagline: 'The Windy City',
    description: 'Chicago is America\'s great Midwestern metropolis — a city of world-class architecture, deep-dish pizza, blues clubs, and one of the finest collections of museums anywhere. The lakefront is breathtaking.',
    history: 'Incorporated in 1837, Chicago rebuilt itself after the Great Fire of 1871 to become a global center of architecture (birthplace of the skyscraper), music (blues and house music), and meatpacking. It\'s been the literary and cultural heart of the Midwest ever since.',
    highlights: ['Chicago Architecture Boat Tour', 'Millennium Park & The Bean', 'Art Institute of Chicago', 'Deep-dish pizza at Lou Malnati\'s', 'Blues clubs on the South Side'],
    lines: ['Empire Builder', 'California Zephyr', 'Southwest Chief', 'Capitol Limited', 'Lake Shore Limited', 'Cardinal', 'City of New Orleans', 'Texas Eagle', 'Hiawatha', 'Metra'],
    pois: [
      { name: 'Art Institute of Chicago', type: 'art', lat: 41.8796, lng: -87.6237, description: 'One of the oldest and largest art museums in the US — home to Seurat\'s A Sunday Afternoon.' },
      { name: 'Millennium Park', type: 'event', lat: 41.8827, lng: -87.6233, description: 'Chicago\'s crown jewel — Cloud Gate sculpture, Crown Fountain, and lakefront views.' },
      { name: 'The 606 Trail', type: 'nature', lat: 41.9111, lng: -87.6687, description: '2.7-mile elevated rail trail through four vibrant Chicago neighborhoods.' },
      { name: 'Giordano\'s', type: 'food', lat: 41.8836, lng: -87.6281, description: 'The definitive deep-dish Chicago pizza experience since 1974.' },
    ],
  },
  {
    id: 'pit',
    name: 'Pittsburgh',
    state: 'PA',
    lat: 40.4406,
    lng: -79.9959,
    photo: 'https://picsum.photos/seed/pittsburgh-pa/400/250',
    tagline: 'The Steel City',
    description: 'Pittsburgh has reinvented itself from an industrial steel town into one of America\'s most livable cities — with a thriving tech scene, 446 bridges, Andy Warhol Museum, and a neighborhood culture unlike anywhere else.',
    history: 'Pittsburgh\'s rivers made it America\'s steel capital during the Industrial Revolution. After the collapse of the steel industry in the 1980s, the city reinvented itself around healthcare, education, and technology, while preserving its working-class neighborhoods.',
    highlights: ['Andy Warhol Museum', 'Incline viewpoints of three rivers', 'Strip District food market', 'Carnegie Museum of Natural History', 'Primanti Bros. sandwiches'],
    lines: ['Capitol Limited', 'Pennsylvanian'],
    pois: [
      { name: 'Andy Warhol Museum', type: 'art', lat: 40.4482, lng: -80.0026, description: 'The largest museum in the US dedicated to a single artist — Pittsburgh\'s own Andy Warhol.' },
      { name: 'Mt. Washington Incline', type: 'history', lat: 40.4296, lng: -80.0103, description: 'Historic funicular railway offering the most stunning city views from atop the hill.' },
      { name: 'Strip District', type: 'food', lat: 40.4483, lng: -79.9867, description: 'Pittsburgh\'s historic market district — fish, cheese, pierogi, and more on Penn Ave.' },
    ],
  },
  {
    id: 'cle',
    name: 'Cleveland',
    state: 'OH',
    lat: 41.4993,
    lng: -81.6944,
    photo: 'https://picsum.photos/seed/cleveland-oh/400/250',
    tagline: 'Rock & Roll Capital of the World',
    description: 'Cleveland sits on Lake Erie and has transformed from a Rust Belt stereotype into a city with one of the best food scenes in the Midwest, the Rock & Roll Hall of Fame, and a proud, passionate community.',
    history: 'Founded in 1796, Cleveland became an industrial powerhouse in the 19th century. It was home to John D. Rockefeller and Standard Oil. Today, the Cleveland Clinic is one of the world\'s top hospitals, and the food scene rivals much larger cities.',
    highlights: ['Rock & Roll Hall of Fame', 'West Side Market', 'Cleveland Museum of Art (free!)', 'Little Italy neighborhood', 'Playhouse Square'],
    lines: ['Lake Shore Limited', 'Capitol Limited'],
    pois: [
      { name: 'Rock & Roll Hall of Fame', type: 'history', lat: 41.5086, lng: -81.6956, description: 'Iconic I.M. Pei-designed museum honoring the legends and stories of rock music.' },
      { name: 'West Side Market', type: 'food', lat: 41.4849, lng: -81.7027, description: 'Cleveland\'s beloved century-old public market with 100+ vendors of fresh food.' },
      { name: 'Cleveland Museum of Art', type: 'art', lat: 41.5095, lng: -81.6113, description: 'One of the finest art museums in the US — free admission always.' },
    ],
  },
  {
    id: 'buf',
    name: 'Buffalo',
    state: 'NY',
    lat: 42.8864,
    lng: -78.8784,
    photo: 'https://picsum.photos/seed/buffalo-ny/400/250',
    tagline: 'The City of Good Neighbors',
    description: 'Buffalo is a gritty, proud city on Lake Erie — birthplace of the Buffalo wing, home to stunning Frank Lloyd Wright architecture, and gateway to Niagara Falls just 30 minutes away.',
    history: 'Buffalo peaked as one of America\'s most important cities in the early 20th century as a Great Lakes port. After decades of industrial decline, it has experienced a genuine renaissance, with restored architecture and a passionate community rebuilding the city.',
    highlights: ['Niagara Falls (30 min away)', 'Darwin Martin House by Frank Lloyd Wright', 'Anchor Bar (original Buffalo wings!)', 'Albright-Knox Art Gallery', 'Elmwood Village'],
    lines: ['Empire Service', 'Lake Shore Limited'],
    pois: [
      { name: 'Anchor Bar', type: 'food', lat: 42.9113, lng: -78.8661, description: 'Birthplace of the original Buffalo chicken wing — a pilgrimage every food lover should make.' },
      { name: 'Darwin Martin House', type: 'art', lat: 42.9333, lng: -78.8550, description: 'Frank Lloyd Wright masterpiece — a Prairie Style complex considered among his finest work.' },
      { name: 'Niagara Falls', type: 'nature', lat: 43.0799, lng: -79.0747, description: 'One of the world\'s most spectacular natural wonders — 30 miles from Buffalo.' },
    ],
  },
  {
    id: 'alb',
    name: 'Albany',
    state: 'NY',
    lat: 42.6526,
    lng: -73.7562,
    photo: 'https://images.unsplash.com/photo-1569261636069-6bde5f9d3ea0?w=400&h=250&fit=crop',
    tagline: 'New York\'s Capital City',
    description: 'Albany is one of the oldest continuously settled European communities in the US, sitting at the gateway to the Adirondacks, Hudson Valley wine country, and Saratoga Springs.',
    history: 'Settled by the Dutch as Fort Nassau in 1614, Albany became a trading post and the capital of New York State in 1797. Its historic architecture and position on the Hudson River made it a key commercial center for centuries.',
    highlights: ['New York State Capitol building', 'Hudson Valley wine trails nearby', 'Saratoga Springs horse racing', 'Albany Institute of History & Art', 'Troy Farmers Market'],
    lines: ['Empire Service', 'Lake Shore Limited'],
    pois: [
      { name: 'New York State Capitol', type: 'history', lat: 42.6526, lng: -73.7578, description: '30-year construction Romanesque Revival masterpiece — free tours available.' },
      { name: 'Washington Park', type: 'nature', lat: 42.6519, lng: -73.7703, description: 'Beloved 80-acre park designed by Frederick Law Olmsted in the 1870s.' },
    ],
  },
  {
    id: 'pro',
    name: 'Providence',
    state: 'RI',
    lat: 41.8240,
    lng: -71.4128,
    photo: 'https://images.unsplash.com/photo-1569261636069-6bde5f9d3ea0?w=400&h=250&fit=crop',
    tagline: 'The Creative Capital',
    description: 'Providence is a thriving, walkable small city with a world-class culinary scene (home to Johnson & Wales), Rhode Island School of Design, and a charming colonial hill neighborhood.',
    history: 'Founded by Roger Williams in 1636 as a haven for religious freedom, Providence became a prosperous port city. Today, the concentration of RISD and Brown University has made it a creative powerhouse with one of the most exciting food scenes in New England.',
    highlights: ['WaterFire fire sculpture event', 'College Hill & Benefit Street', 'RISD Museum', 'Federal Hill Italian district', 'Prospect Terrace Park views'],
    lines: ['Acela', 'Northeast Regional'],
    pois: [
      { name: 'WaterFire Providence', type: 'event', lat: 41.8218, lng: -71.4146, description: 'Magical public art installation of 100 bonfires on three rivers — a Providence signature event.' },
      { name: 'RISD Museum', type: 'art', lat: 41.8256, lng: -71.4106, description: 'Exceptional art museum on College Hill with 100,000 works spanning 5,000 years.' },
      { name: 'Federal Hill', type: 'food', lat: 41.8218, lng: -71.4290, description: 'Providence\'s Italian neighborhood — the best pasta outside of Italy.' },
    ],
  },
  {
    id: 'nhv',
    name: 'New Haven',
    state: 'CT',
    lat: 41.2983,
    lng: -72.9279,
    photo: 'https://images.unsplash.com/photo-1569261636069-6bde5f9d3ea0?w=400&h=250&fit=crop',
    tagline: 'Pizza Capital of America',
    description: 'New Haven is a vibrant college city (home to Yale University) with a fierce claim to America\'s best pizza, a thriving arts scene, and stunning Gothic architecture.',
    history: 'One of America\'s oldest planned cities (1638), New Haven is home to Yale University, founded in 1701. It was a major industrial center in the 19th century and today thrives on education, arts, and a fierce pizza rivalry.',
    highlights: ['Frank Pepe\'s & Sally\'s Apizza (legendary pizza!)', 'Yale University Gothic architecture', 'Yale Art Gallery (free)', 'Wooster Square cherry blossoms', 'New Haven Green'],
    lines: ['Acela', 'Northeast Regional', 'Shore Line East', 'Metro-North'],
    pois: [
      { name: 'Frank Pepe Pizzeria Napoletana', type: 'food', lat: 41.3095, lng: -72.9299, description: 'Since 1925 — possibly the most famous pizza in America. The white clam pie is legendary.' },
      { name: 'Yale University Art Gallery', type: 'art', lat: 41.3082, lng: -72.9313, description: 'America\'s oldest college art museum — free admission, world-class collections.' },
      { name: 'East Rock Park', type: 'nature', lat: 41.3314, lng: -72.9129, description: 'Stunning traprock ridgeline with panoramic views over New Haven and Long Island Sound.' },
    ],
  },
  {
    id: 'den',
    name: 'Denver',
    state: 'CO',
    lat: 39.7392,
    lng: -104.9903,
    photo: 'https://picsum.photos/seed/denver-co/400/250',
    tagline: 'The Mile-High City',
    description: 'Denver sits at exactly 5,280 feet elevation with the Rocky Mountains as a dramatic backdrop. It\'s a city of outdoor adventure, craft beer, and a vibrant arts and music scene — and one of America\'s fastest-growing cities.',
    history: 'Founded during the Pike\'s Peak Gold Rush of 1858, Denver grew rapidly as a supply hub. It became the Colorado state capital in 1876. Today it\'s a thriving tech hub and outdoor recreation gateway, attracting young professionals from across the country.',
    highlights: ['Rocky Mountain National Park day trip', 'Art galleries & music on RiNo', 'Craft brewery scene (400+ breweries in Colorado)', 'Red Rocks Amphitheatre', 'Denver Art Museum'],
    lines: ['California Zephyr'],
    pois: [
      { name: 'Denver Art Museum', type: 'art', lat: 39.7334, lng: -104.9886, description: 'Striking Daniel Libeskind-designed museum with world-class Native American art collections.' },
      { name: 'RiNo Art District', type: 'art', lat: 39.7656, lng: -104.9760, description: 'River North\'s warehouse district transformed into Denver\'s creative hub with murals and galleries.' },
      { name: 'Red Rocks Amphitheatre', type: 'event', lat: 39.6654, lng: -105.2050, description: 'World\'s most iconic outdoor concert venue, carved into stunning red sandstone formations.' },
      { name: 'The Source Hotel Market Hall', type: 'food', lat: 39.7678, lng: -104.9777, description: 'Artisan market hall in a converted ironworks with Denver\'s best independent vendors.' },
    ],
  },
  {
    id: 'slc',
    name: 'Salt Lake City',
    state: 'UT',
    lat: 40.7608,
    lng: -111.8910,
    photo: 'https://picsum.photos/seed/buffalo-ny/400/250',
    tagline: 'Gateway to the Mighty 5',
    description: 'Salt Lake City is surrounded by extraordinary nature — five national parks within a day\'s drive, world-class ski resorts, and the Great Salt Lake. The city itself has a vibrant arts, food, and music scene.',
    history: 'Founded in 1847 by Mormon pioneers, Salt Lake City grew rapidly as the crossroads of the transcontinental railroad. Today it\'s a diverse, rapidly growing city with a booming tech sector ("Silicon Slopes") and spectacular outdoor access.',
    highlights: ['Zion, Bryce, Arches nearby', 'Temple Square architecture', 'Natural History Museum of Utah', 'The Great Salt Lake', 'Millcreek Canyon hiking'],
    lines: ['California Zephyr'],
    pois: [
      { name: 'Natural History Museum of Utah', type: 'history', lat: 40.7643, lng: -111.8256, description: 'Stunning museum atop Red Butte with world-class dinosaur halls and native cultures exhibits.' },
      { name: 'Temple Square', type: 'history', lat: 40.7703, lng: -111.8938, description: '35-acre complex with the iconic Salt Lake Temple and spectacular flower gardens.' },
      { name: 'Red Iguana', type: 'food', lat: 40.7702, lng: -111.9100, description: 'SLC\'s beloved Mexican mole restaurant — the best mole negro outside of Oaxaca.' },
    ],
  },
  {
    id: 'lax',
    name: 'Los Angeles',
    state: 'CA',
    lat: 34.0522,
    lng: -118.2437,
    photo: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400&h=250&fit=crop',
    tagline: 'City of Angels',
    description: 'Los Angeles is the entertainment capital of the world — a sprawling metropolis of palm trees, beaches, mountains, and neighborhoods each with a unique identity. The food scene is among the world\'s most diverse.',
    history: 'Founded by the Spanish in 1781, LA was a sleepy rancho town until the railroads arrived in the 1870s. Hollywood transformed it into a global cultural powerhouse in the 1920s. Today it\'s a city of 10 million with the most diverse food scene in North America.',
    highlights: ['Getty Center (free!) & LACMA', 'Santa Monica Pier & Venice Beach', 'Griffith Observatory views', 'Grand Central Market food hall', 'Diverse neighborhoods: Koreatown, Boyle Heights, Leimert Park'],
    lines: ['Pacific Surfliner', 'Coast Starlight', 'Southwest Chief', 'Sunset Limited', 'Metrolink'],
    pois: [
      { name: 'The Getty Center', type: 'art', lat: 34.0780, lng: -118.4741, description: 'Stunning hilltop museum with free admission, incredible architecture, and LA panoramas.' },
      { name: 'Grand Central Market', type: 'food', lat: 34.0506, lng: -118.2488, description: 'Historic downtown market hall with LA\'s most diverse street food since 1917.' },
      { name: 'Griffith Observatory', type: 'history', lat: 34.1184, lng: -118.3004, description: 'Iconic observatory with free admission and unbeatable views of the Hollywood sign and city.' },
      { name: 'Venice Beach Boardwalk', type: 'event', lat: 33.9850, lng: -118.4695, description: 'LA\'s ultimate people-watching destination with street performers, murals, and Muscle Beach.' },
    ],
  },
  {
    id: 'sdi',
    name: 'San Diego',
    state: 'CA',
    lat: 32.7157,
    lng: -117.1611,
    photo: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=250&fit=crop',
    tagline: 'America\'s Finest City',
    description: 'San Diego has 70 miles of beaches, 266 sunny days a year, a thriving craft beer scene, and the country\'s largest naval base. It\'s laid-back California living at its finest, just minutes from the Mexican border.',
    history: 'The site of the first European settlement on the Pacific Coast (Mission San Diego de Alcalá, 1769), San Diego has a rich Spanish and Mexican heritage visible throughout the city, especially in Old Town and the Gaslamp Quarter.',
    highlights: ['Balboa Park museums (free)', 'San Diego Zoo', 'Craft beer capital of the US', 'Old Town San Diego', 'Torrey Pines State Reserve hiking'],
    lines: ['Pacific Surfliner', 'Coaster', 'Trolley'],
    pois: [
      { name: 'Balboa Park', type: 'art', lat: 32.7341, lng: -117.1446, description: '1,200-acre cultural park with 17 museums, gardens, and the famous San Diego Zoo.' },
      { name: 'Little Italy', type: 'food', lat: 32.7284, lng: -117.1697, description: 'San Diego\'s most vibrant neighborhood with incredible food, coffee, and the Mercato farmers market.' },
      { name: 'Torrey Pines State Reserve', type: 'nature', lat: 32.9206, lng: -117.2519, description: 'Rare pine forest atop dramatic cliffs over the Pacific — one of the most beautiful hikes in California.' },
    ],
  },
  {
    id: 'oak',
    name: 'Oakland / Emeryville',
    state: 'CA',
    lat: 37.8044,
    lng: -122.2712,
    photo: 'https://picsum.photos/seed/sanfrancisco-ca/400/250',
    tagline: 'Soulful, Vibrant, Authentic',
    description: 'Oakland is the Bay Area\'s most authentic city — a soulful, diverse place with deep roots in Black American culture, incredible food, and a thriving arts scene. The Amtrak station in Emeryville connects to ferries into San Francisco.',
    history: 'Long overshadowed by San Francisco, Oakland has its own proud identity as the birthplace of the Black Panther Party and home to generations of working-class immigrants. The Jack London Square waterfront and Lake Merritt are beloved gathering places.',
    highlights: ['Lake Merritt & Grand Lake neighborhood', 'Oakland Museum of California', 'Temescal neighborhood food & coffee', 'Jack London Square waterfront', 'Ferry to San Francisco'],
    lines: ['California Zephyr', 'Coast Starlight', 'Capitol Corridor', 'BART'],
    pois: [
      { name: 'Lake Merritt', type: 'nature', lat: 37.8055, lng: -122.2566, description: 'The "Jewel of Oakland" — a tidal lagoon with 3-mile path, gardens, and rowing clubs.' },
      { name: 'Oakland Museum of California', type: 'history', lat: 37.7979, lng: -122.2564, description: 'Definitive museum of California\'s art, history, and natural science in a gorgeous garden setting.' },
      { name: 'Temescal Alley', type: 'food', lat: 37.8330, lng: -122.2636, description: 'Oakland\'s hippest micro-neighborhood with great coffee, barbershops, and artisan shops.' },
    ],
  },
  {
    id: 'sac',
    name: 'Sacramento',
    state: 'CA',
    lat: 38.5816,
    lng: -121.4944,
    photo: 'https://picsum.photos/seed/sanfrancisco-ca/400/250',
    tagline: 'Farm-to-Fork Capital',
    description: 'Sacramento is California\'s capital — a surprising food city that claims the "Farm-to-Fork Capital" title, with access to the best produce in the world. Old Sacramento\'s Gold Rush history sits alongside modern breweries and art.',
    history: 'Sacramento was the western terminus of the first transcontinental railroad and grew dramatically during the California Gold Rush of 1848. It became the state capital in 1854 and remains a hub of California government and agriculture.',
    highlights: ['Old Sacramento Gold Rush district', 'Tower Bridge & Riverfront', 'Crocker Art Museum', 'Farm-to-Fork restaurant scene', 'California State Fair'],
    lines: ['California Zephyr', 'Coast Starlight', 'Capitol Corridor'],
    pois: [
      { name: 'Old Sacramento', type: 'history', lat: 38.5832, lng: -121.5064, description: 'Preserved Gold Rush-era neighborhood along the Sacramento River with museums and shops.' },
      { name: 'Crocker Art Museum', type: 'art', lat: 38.5762, lng: -121.5018, description: 'The oldest art museum in the American West, with a stunning modern expansion.' },
      { name: 'Midtown Sacramento', type: 'food', lat: 38.5709, lng: -121.4769, description: 'Sacramento\'s walkable grid neighborhood with the best farm-fresh restaurants in California.' },
    ],
  },
  {
    id: 'pdx',
    name: 'Portland',
    state: 'OR',
    lat: 45.5231,
    lng: -122.6765,
    photo: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=400&h=250&fit=crop',
    tagline: 'Keep Portland Weird',
    description: 'Portland is the Pacific Northwest\'s most idiosyncratic city — a city of food carts, bookshops, bike lanes, craft beer, and bridges over the Willamette River. Powell\'s City of Books alone is worth the train ride.',
    history: 'Founded in 1845 after a coin flip between two settlers (one from Portland, Maine, who won), the city grew as a lumber and shipping port. The counterculture of the 1960s-70s gave it the progressive, fiercely independent identity it\'s known for today.',
    highlights: ['Powell\'s City of Books (world\'s largest independent bookstore)', 'Forest Park hiking', 'Portland food cart pods', 'Japanese Garden', 'Alberta Arts District'],
    lines: ['Empire Builder', 'Coast Starlight', 'Cascades', 'MAX Light Rail'],
    pois: [
      { name: 'Powell\'s City of Books', type: 'shopping', lat: 45.5231, lng: -122.6815, description: 'The world\'s largest independent bookstore — an entire city block of new and used books.' },
      { name: 'Portland Japanese Garden', type: 'nature', lat: 45.5193, lng: -122.7073, description: 'Considered the most authentic Japanese garden outside Japan — five acres of serene beauty.' },
      { name: 'Portland Saturday Market', type: 'event', lat: 45.5228, lng: -122.6715, description: 'America\'s largest continuously operating outdoor arts and crafts market.' },
      { name: 'Voodoo Doughnut', type: 'food', lat: 45.5225, lng: -122.6710, description: 'Quirky Portland institution with outrageous doughnut creations — 24 hours.' },
    ],
  },
  {
    id: 'sea',
    name: 'Seattle',
    state: 'WA',
    lat: 47.6062,
    lng: -122.3321,
    photo: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=400&h=250&fit=crop',
    tagline: 'The Emerald City',
    description: 'Seattle is perched between Puget Sound and Lake Washington with the Olympic Mountains and Mount Rainier as backdrop. The city that gave the world Nirvana, Amazon, Starbucks, and Boeing has a rich culture and breathtaking scenery.',
    history: 'Incorporated in 1869, Seattle\'s first industry was lumber. The Klondike Gold Rush of 1897 transformed it into a major port city. The tech boom — from Boeing to Microsoft to Amazon — made it one of America\'s most economically dynamic cities.',
    highlights: ['Pike Place Market (where Starbucks started)', 'Space Needle views', 'Olympic Sculpture Park (free)', 'Capitol Hill music and food scene', 'Ferry rides on Puget Sound'],
    lines: ['Empire Builder', 'Coast Starlight', 'Cascades', 'Sounder', 'Link Light Rail'],
    pois: [
      { name: 'Pike Place Market', type: 'food', lat: 47.6085, lng: -122.3404, description: 'America\'s oldest farmers market — fish throwing, fresh flowers, the first Starbucks, and incredible vendors.' },
      { name: 'Chihuly Garden & Glass', type: 'art', lat: 47.6209, lng: -122.3493, description: 'Breathtaking glass art museum at the base of the Space Needle — Dale Chihuly\'s masterwork.' },
      { name: 'Olympic Sculpture Park', type: 'art', lat: 47.6166, lng: -122.3553, description: 'Free outdoor sculpture park along the waterfront with mountain and sound views.' },
      { name: 'Capitol Hill', type: 'food', lat: 47.6233, lng: -122.3233, description: 'Seattle\'s vibrant neighborhood with the best restaurants, bars, and live music in the city.' },
    ],
  },
  {
    id: 'mil',
    name: 'Milwaukee',
    state: 'WI',
    lat: 43.0389,
    lng: -87.9065,
    photo: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=250&fit=crop',
    tagline: 'Beer, Brats & Brilliance',
    description: 'Milwaukee is a proud, affordable city on Lake Michigan with a world-class art museum, a legendary brewery heritage, and one of America\'s best summer festival traditions.',
    history: 'Incorporated in 1846, Milwaukee was the brewing capital of America through the 19th and 20th centuries (Pabst, Schlitz, Miller, and Blatz all originated here). Its German immigrant heritage is still visible in the architecture, food, and festival culture.',
    highlights: ['Milwaukee Art Museum (stunning Calatrava wings)', 'Third Ward arts district', 'Summerfest (world\'s largest music festival)', 'Lakefront Brewery tour', 'Mitchell Park Domes'],
    lines: ['Hiawatha Service', 'Empire Builder'],
    pois: [
      { name: 'Milwaukee Art Museum', type: 'art', lat: 43.0399, lng: -87.8968, description: 'Stunning lakefront museum with iconic moveable "wings" designed by Santiago Calatrava.' },
      { name: 'Third Ward', type: 'food', lat: 43.0286, lng: -87.9091, description: 'Milwaukee\'s arts and entertainment district with great restaurants and the Public Market.' },
      { name: 'Lakefront Brewery', type: 'food', lat: 43.0552, lng: -87.8955, description: 'Classic Milwaukee brewery with legendary Fish Fry Fridays and Lake Michigan views.' },
    ],
  },
  {
    id: 'msp',
    name: 'Minneapolis',
    state: 'MN',
    lat: 44.9778,
    lng: -93.2650,
    photo: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=250&fit=crop',
    tagline: 'City of Lakes',
    description: 'Minneapolis-St. Paul ("The Cities") is the cultural capital of the northern Midwest — home to Prince, the Boundary Waters, incredible Somali and Hmong food, and the most theaters per capita outside NYC.',
    history: 'Founded as a milling city at St. Anthony Falls on the Mississippi River, Minneapolis became a major center of flour production in the 19th century. The Twin Cities\' large Scandinavian immigrant community shaped its culture, and today it has the nation\'s largest Somali diaspora.',
    highlights: ['Walker Art Center & Minneapolis Sculpture Garden', 'Boundary Waters Canoe Area Wilderness', 'First Avenue (Prince\'s venue)', 'Minneapolis Chain of Lakes', 'Midtown Global Market food hall'],
    lines: ['Empire Builder'],
    pois: [
      { name: 'Walker Art Center', type: 'art', lat: 44.9686, lng: -93.2888, description: 'World-class contemporary art museum with the famous Spoonbridge and Cherry sculpture outside.' },
      { name: 'Midtown Global Market', type: 'food', lat: 44.9494, lng: -93.2663, description: 'Extraordinarily diverse food market in a former Sears building — 50+ cuisines represented.' },
      { name: 'First Avenue', type: 'event', lat: 44.9789, lng: -93.2754, description: 'Legendary music club where Prince filmed Purple Rain — still the Twin Cities\' top live venue.' },
    ],
  },
  {
    id: 'kct',
    name: 'Kansas City',
    state: 'MO',
    lat: 39.0997,
    lng: -94.5786,
    photo: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=250&fit=crop',
    tagline: 'BBQ Capital of the World',
    description: 'Kansas City has more BBQ restaurants per capita than any other city, more fountains than Rome, a world-class jazz legacy, and a vibrant Crossroads Arts District.',
    history: 'Named after the Kansa Native American tribe, the city grew as a key jumping-off point for westward trails. Its jazz scene of the 1920s-40s produced Count Basie and Charlie Parker. Today it\'s known for BBQ, boulevards, and a genuine Midwestern warmth.',
    highlights: ['Kansas City BBQ (Gates, Joe\'s, Jack Stack)', 'Nelson-Atkins Museum of Art', 'Jazz district & 18th & Vine', 'Country Club Plaza shopping', 'Crossroads Arts District'],
    lines: ['Southwest Chief'],
    pois: [
      { name: 'Nelson-Atkins Museum of Art', type: 'art', lat: 39.0444, lng: -94.5803, description: 'One of America\'s finest art museums with a stunning Shuttlecocks sculpture garden — free.' },
      { name: 'Joe\'s Kansas City Bar-B-Que', type: 'food', lat: 39.0350, lng: -94.5857, description: 'The BBQ restaurant that turned KC into a national pilgrimage — the Z-Man sandwich is legendary.' },
      { name: '18th & Vine Jazz District', type: 'history', lat: 39.0953, lng: -94.5535, description: 'Historic jazz and blues district where Charlie Parker and Count Basie made history.' },
    ],
  },
  {
    id: 'alb2',
    name: 'Albuquerque',
    state: 'NM',
    lat: 35.0844,
    lng: -106.6504,
    photo: 'https://picsum.photos/seed/denver-co/400/250',
    tagline: 'Land of Enchantment',
    description: 'Albuquerque sits in the Rio Grande valley surrounded by ancient Puebloan culture, dramatic desert scenery, and New Mexican cuisine that\'s unlike anywhere else. The annual Balloon Fiesta is the world\'s largest balloon event.',
    history: 'Founded by Spanish settlers in 1706, Albuquerque has been home to Pueblo peoples for centuries. Route 66 runs through its heart. The nearby Sandia Mountains and Rio Grande define its dramatic landscape, and the city retains deep Native American and Hispanic cultural roots.',
    highlights: ['Albuquerque International Balloon Fiesta (October)', 'Old Town Albuquerque', 'Sandia Peak Tramway', 'New Mexican chile cuisine', 'Petroglyph National Monument'],
    lines: ['Southwest Chief'],
    pois: [
      { name: 'Old Town Albuquerque', type: 'history', lat: 35.0967, lng: -106.6679, description: 'The historic center of Albuquerque since 1706 — adobe churches, galleries, and chile-scented air.' },
      { name: 'Sandia Peak Tramway', type: 'nature', lat: 35.1905, lng: -106.4764, description: 'World\'s longest aerial tramway lifts you 10,378 feet to breathtaking desert panoramas.' },
      { name: 'Flying Star Café', type: 'food', lat: 35.0838, lng: -106.6509, description: 'Beloved local New Mexican café famous for its green chile breakfast burritos.' },
    ],
  },
  {
    id: 'stl',
    name: 'St. Louis',
    state: 'MO',
    lat: 38.6270,
    lng: -90.1994,
    photo: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=250&fit=crop',
    tagline: 'Gateway to the West',
    description: 'St. Louis is defined by its iconic Gateway Arch on the Mississippi River — the symbol of American westward expansion. It has world-class free museums, a rich blues and rock history, and a passionate Cardinals fan base.',
    history: 'Founded by French fur traders in 1764, St. Louis was the departure point for Lewis and Clark\'s expedition and for thousands of westward-bound settlers. It hosted the 1904 World\'s Fair (which introduced the ice cream cone and hot dog) and has a rich African-American cultural history.',
    highlights: ['Gateway Arch National Park (free!)', 'St. Louis Art Museum (free!)', 'City Museum (adult playground)', 'Ted Drewes Frozen Custard', 'Forest Park (bigger than Central Park)'],
    lines: ['Texas Eagle', 'Missouri River Runner'],
    pois: [
      { name: 'Gateway Arch', type: 'history', lat: 38.6247, lng: -90.1849, description: 'Iconic 630-foot stainless steel arch — the tallest monument in the US, with tram rides to the top.' },
      { name: 'City Museum', type: 'art', lat: 38.6333, lng: -90.2019, description: 'Utterly unique repurposed factory full of slides, caves, and surreal architectural wonders.' },
      { name: 'Forest Park', type: 'nature', lat: 38.6367, lng: -90.2853, description: 'Sprawling 1,300-acre park with free world-class museums including the Art Museum and History Museum.' },
    ],
  },
]

// Major US Amtrak train lines as coordinate sequences
export const trainLines: TrainLine[] = [
  {
    id: 'nec',
    name: 'Northeast Corridor (Acela/Regional)',
    color: '#CE1126',
    stops: [
      [42.3519, -71.0552], // Boston
      [41.8240, -71.4128], // Providence
      [41.2983, -72.9279], // New Haven
      [40.7505, -73.9934], // New York
      [40.7345, -74.1641], // Newark
      [39.9566, -75.1817], // Philadelphia
      [39.7367, -75.5518], // Wilmington (approx)
      [39.2904, -76.6122], // Baltimore
      [38.8975, -77.0065], // Washington DC
    ],
  },
  {
    id: 'empire',
    name: 'Empire Service',
    color: '#0052A5',
    stops: [
      [40.7505, -73.9934], // New York
      [42.6526, -73.7562], // Albany
      [43.0489, -76.1472], // Syracuse (approx)
      [43.1610, -77.6109], // Rochester (approx)
      [42.8864, -78.8784], // Buffalo
    ],
  },
  {
    id: 'lakeshore',
    name: 'Lake Shore Limited',
    color: '#003087',
    stops: [
      [42.3519, -71.0552], // Boston
      [42.6526, -73.7562], // Albany
      [41.4993, -81.6944], // Cleveland
      [41.8781, -87.6298], // Chicago
    ],
  },
  {
    id: 'capitol',
    name: 'Capitol Limited',
    color: '#6600CC',
    stops: [
      [38.8975, -77.0065], // Washington DC
      [40.4406, -79.9959], // Pittsburgh
      [41.4993, -81.6944], // Cleveland
      [41.8781, -87.6298], // Chicago
    ],
  },
  {
    id: 'crescent',
    name: 'Crescent',
    color: '#CC9900',
    stops: [
      [40.7505, -73.9934], // New York
      [39.9566, -75.1817], // Philadelphia
      [38.8975, -77.0065], // Washington DC
      [37.5411, -77.4289], // Richmond
      [35.2271, -80.8431], // Charlotte
      [33.7490, -84.3880], // Atlanta
      [29.9511, -90.0715], // New Orleans
    ],
  },
  {
    id: 'silver',
    name: 'Silver Star / Silver Meteor',
    color: '#A8A9AD',
    stops: [
      [40.7505, -73.9934], // New York
      [39.9566, -75.1817], // Philadelphia
      [38.8975, -77.0065], // Washington DC
      [37.5411, -77.4289], // Richmond
      [30.3322, -81.6557], // Jacksonville (approx)
      [28.5383, -81.3792], // Orlando (approx)
      [25.7617, -80.1918], // Miami
    ],
  },
  {
    id: 'empire_builder',
    name: 'Empire Builder',
    color: '#006400',
    stops: [
      [41.8781, -87.6298], // Chicago
      [43.0389, -87.9065], // Milwaukee
      [44.9778, -93.2650], // Minneapolis
      [46.7774, -92.1002], // Duluth (approx)
      [47.5253, -111.3008], // Havre (approx)
      [47.6062, -122.3321], // Seattle
      [45.5231, -122.6765], // Portland
    ],
  },
  {
    id: 'california_zephyr',
    name: 'California Zephyr',
    color: '#FF6600',
    stops: [
      [41.8781, -87.6298], // Chicago
      [39.7392, -104.9903], // Denver
      [40.7608, -111.8910], // Salt Lake City
      [39.5273, -119.8136], // Reno (approx)
      [38.5816, -121.4944], // Sacramento
      [37.8044, -122.2712], // Oakland/Emeryville
    ],
  },
  {
    id: 'southwest_chief',
    name: 'Southwest Chief',
    color: '#CC0000',
    stops: [
      [41.8781, -87.6298], // Chicago
      [39.0997, -94.5786], // Kansas City
      [35.0844, -106.6504], // Albuquerque
      [34.0522, -118.2437], // Los Angeles
    ],
  },
  {
    id: 'coast_starlight',
    name: 'Coast Starlight',
    color: '#009900',
    stops: [
      [47.6062, -122.3321], // Seattle
      [45.5231, -122.6765], // Portland
      [38.5816, -121.4944], // Sacramento
      [37.8044, -122.2712], // Oakland
      [34.0522, -118.2437], // Los Angeles
      [32.7157, -117.1611], // San Diego
    ],
  },
  {
    id: 'pacific_surfliner',
    name: 'Pacific Surfliner',
    color: '#0080FF',
    stops: [
      [34.0522, -118.2437], // Los Angeles
      [34.1975, -119.1771], // Ventura (approx)
      [34.4208, -119.6982], // Santa Barbara (approx)
      [35.2828, -120.6596], // San Luis Obispo (approx)
    ],
  },
  {
    id: 'cascades',
    name: 'Cascades',
    color: '#006633',
    stops: [
      [44.0580, -123.0989], // Eugene (approx)
      [45.5231, -122.6765], // Portland
      [47.6062, -122.3321], // Seattle
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset Limited',
    color: '#FF4500',
    stops: [
      [29.9511, -90.0715], // New Orleans
      [29.4241, -98.4936], // San Antonio (approx)
      [31.7619, -106.4850], // El Paso (approx)
      [34.0522, -118.2437], // Los Angeles
    ],
  },
  {
    id: 'hiawatha',
    name: 'Hiawatha Service',
    color: '#336699',
    stops: [
      [41.8781, -87.6298], // Chicago
      [43.0389, -87.9065], // Milwaukee
    ],
  },
]
