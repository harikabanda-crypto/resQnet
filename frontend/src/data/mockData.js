// Central mock data for ResQNet demo

export const DEMO_ZONES = [
  { id: 'A17', name: 'Zone A17 – Kukatpally', risk: 'critical', population: 2430, sos: 87, waterLevel: 'Rising', rainfall: '82 mm/hr', lat: 17.49, lng: 78.39, recommendation: 'Evacuate vulnerable residents to Shelter S04.' },
  { id: 'B05', name: 'Zone B05 – Miyapur', risk: 'high', population: 1820, sos: 43, waterLevel: 'High', rainfall: '65 mm/hr', lat: 17.50, lng: 78.36, recommendation: 'Issue evacuation advisory. Monitor road conditions.' },
  { id: 'C12', name: 'Zone C12 – Bachupally', risk: 'high', population: 1340, sos: 31, waterLevel: 'Moderate', rainfall: '54 mm/hr', lat: 17.52, lng: 78.38, recommendation: 'Pre-position rescue teams. Alert citizens.' },
  { id: 'D03', name: 'Zone D03 – Kondapur', risk: 'moderate', population: 980, sos: 12, waterLevel: 'Low', rainfall: '38 mm/hr', lat: 17.46, lng: 78.35, recommendation: 'Monitor situation. Send preparedness alerts.' },
  { id: 'E09', name: 'Zone E09 – Gachibowli', risk: 'safe', population: 2100, sos: 2, waterLevel: 'Normal', rainfall: '12 mm/hr', lat: 17.44, lng: 78.34, recommendation: 'No immediate action required.' },
  { id: 'F01', name: 'Zone F01 – Madhapur', risk: 'safe', population: 3200, sos: 0, waterLevel: 'Normal', rainfall: '8 mm/hr', lat: 17.45, lng: 78.38, recommendation: 'No immediate action required.' },
];

export const DEMO_SHELTERS = [
  { id: 'S01', name: 'BVRIT Relief Center', location: 'Bachupally', capacity: 500, occupied: 312, lat: 17.52, lng: 78.38, status: 'safe' },
  { id: 'S02', name: 'JNTU Community Hall', location: 'Kukatpally', capacity: 800, occupied: 764, lat: 17.49, lng: 78.39, status: 'warning' },
  { id: 'S03', name: 'Miyapur School Ground', location: 'Miyapur', capacity: 350, occupied: 190, lat: 17.50, lng: 78.36, status: 'safe' },
  { id: 'S04', name: 'Kondapur Sports Complex', location: 'Kondapur', capacity: 1000, occupied: 420, lat: 17.46, lng: 78.35, status: 'safe' },
];

export const DEMO_RESOURCES = [
  { id: 'R01', type: 'Water', available: 2400, demand: 3200, unit: 'bottles', provider: 'NGO Alpha', location: 'Zone B05' },
  { id: 'R02', type: 'Food', available: 1800, demand: 2400, unit: 'packets', provider: 'NGO Beta', location: 'Zone D03' },
  { id: 'R03', type: 'Medicine', available: 540, demand: 620, unit: 'kits', provider: 'Red Cross Unit 7', location: 'Zone A17' },
  { id: 'R04', type: 'Blankets', available: 1200, demand: 900, unit: 'pieces', provider: 'Govt Store', location: 'Zone E09' },
  { id: 'R05', type: 'Rescue Equipment', available: 38, demand: 45, unit: 'sets', provider: 'NDRF Team 3', location: 'Zone A17' },
];

export const INITIAL_REQUESTS = [
  { id: 'RQ28491', type: 'Water', zone: 'A17', location: 'Kukatpally', people: 5, priority: 'high', status: 'out_for_delivery', assignedTeam: 'Volunteer V17', time: '14 min ago', citizenName: 'Demo Citizen' },
  { id: 'RQ28490', type: 'Rescue', zone: 'A17', location: 'Kukatpally', people: 3, priority: 'critical', status: 'matched', assignedTeam: 'Rescue Team R02', time: '22 min ago', citizenName: 'Ravi Kumar' },
  { id: 'RQ28489', type: 'Medicine', zone: 'B05', location: 'Miyapur', people: 8, priority: 'high', status: 'received', assignedTeam: null, time: '31 min ago', citizenName: 'Priya Sharma' },
  { id: 'RQ28488', type: 'Food', zone: 'C12', location: 'Bachupally', people: 12, priority: 'urgent', status: 'matched', assignedTeam: 'NGO Beta Van', time: '45 min ago', citizenName: 'Suresh Reddy' },
  { id: 'RQ28487', type: 'Shelter', zone: 'B05', location: 'Miyapur', people: 6, priority: 'normal', status: 'delivered', assignedTeam: 'Volunteer V09', time: '1 hr ago', citizenName: 'Lakshmi Devi' },
  { id: 'RQ28486', type: 'Water', zone: 'C12', location: 'Bachupally', people: 20, priority: 'critical', status: 'out_for_delivery', assignedTeam: 'Delivery D03', time: '1 hr ago', citizenName: 'Mohammed Ali' },
];

export const DEMO_TEAMS = [
  { id: 'T01', name: 'NDRF Team Alpha', type: 'rescue', location: 'Zone A17', status: 'busy', task: 'Rescue op – Flat 4B Kukatpally', members: 8 },
  { id: 'T02', name: 'Rescue Team R02', type: 'rescue', location: 'Zone B05', status: 'en_route', task: 'Responding to RQ28490', members: 6 },
  { id: 'V17', name: 'Volunteer Arjun M.', type: 'volunteer', location: 'Zone A17', status: 'en_route', task: 'Water delivery – RQ28491', members: 1 },
  { id: 'V09', name: 'Volunteer Sneha P.', type: 'volunteer', location: 'Zone E09', status: 'available', task: null, members: 1 },
  { id: 'N01', name: 'NGO Alpha', type: 'ngo', location: 'Zone B05', status: 'busy', task: 'Distributing water supplies', members: 12 },
  { id: 'N02', name: 'NGO Beta', type: 'ngo', location: 'Zone D03', status: 'available', task: null, members: 9 },
  { id: 'D03', name: 'Delivery Partner Ramesh', type: 'delivery', location: 'Zone C12', status: 'en_route', task: 'Water delivery – RQ28486', members: 1 },
];

export const DEMO_ALERTS = [
  { id: 'AL001', time: '2 min ago', message: 'Zone A17 upgraded to CRITICAL – water levels rising rapidly', severity: 'critical' },
  { id: 'AL002', time: '8 min ago', message: '27 new SOS requests received in Kukatpally', severity: 'high' },
  { id: 'AL003', time: '15 min ago', message: 'Water shortage detected – demand exceeds supply by 800 units', severity: 'high' },
  { id: 'AL004', time: '23 min ago', message: 'Shelter S02 (JNTU) nearing 95% capacity', severity: 'warning' },
  { id: 'AL005', time: '34 min ago', message: 'Road NH65 flooded – rerouting all deliveries via Ring Road', severity: 'warning' },
  { id: 'AL006', time: '1 hr ago', message: 'NDRF Team Alpha deployed to Zone A17', severity: 'info' },
];

export const DEMO_ROUTES = [
  { id: 'route_a', name: 'Route A – NH65 Direct', distance: '2.1 km', time: '6 min', risk: 'high', safetyScore: 32, recommended: false, reason: 'Flooded – NH65 submerged' },
  { id: 'route_b', name: 'Route B – Ring Road', distance: '2.8 km', time: '9 min', risk: 'low', safetyScore: 94, recommended: true, reason: 'Safe – elevated road, no flooding' },
  { id: 'route_c', name: 'Route C – Inner Roads', distance: '3.4 km', time: '12 min', risk: 'low', safetyScore: 88, recommended: false, reason: 'Safe alternative – slightly longer' },
];

export const ANALYTICS_DATA = {
  requestsOverTime: [
    { time: '08:00', requests: 12 }, { time: '09:00', requests: 34 }, { time: '10:00', requests: 89 },
    { time: '11:00', requests: 156 }, { time: '12:00', requests: 234 }, { time: '13:00', requests: 312 },
    { time: '14:00', requests: 287 }, { time: '15:00', requests: 198 },
  ],
  resourcesDistributed: [
    { name: 'Water', value: 1400 }, { name: 'Food', value: 980 }, { name: 'Medicine', value: 320 },
    { name: 'Blankets', value: 650 }, { name: 'Equipment', value: 28 },
  ],
  riskTrend: [
    { time: '08:00', zoneA17: 40, zoneB05: 30 }, { time: '09:00', zoneA17: 55, zoneB05: 38 },
    { time: '10:00', zoneA17: 68, zoneB05: 50 }, { time: '11:00', zoneA17: 82, zoneB05: 62 },
    { time: '12:00', zoneA17: 91, zoneB05: 70 }, { time: '13:00', zoneA17: 95, zoneB05: 74 },
    { time: '14:00', zoneA17: 97, zoneB05: 76 },
  ],
  responseTime: [
    { name: 'Water', avg: 18 }, { name: 'Food', avg: 24 }, { name: 'Medicine', avg: 14 },
    { name: 'Rescue', avg: 9 }, { name: 'Shelter', avg: 31 },
  ],
};

export const AI_PREDICTIONS = {
  zone: 'A17',
  currentRisk: 'critical',
  confidence: 91,
  predictions: [
    { period: 'Next 1 Hour', risk: 'high', level: 80 },
    { period: 'Next 3 Hours', risk: 'critical', level: 95 },
    { period: 'Next 6 Hours', risk: 'critical', level: 97 },
  ],
  factors: [
    'Heavy rainfall (82mm/hr)',
    'Rising water levels (+3cm/hr)',
    'Low elevation area',
    'Drainage overflow reported',
    'Historical flood pattern match',
  ],
  recommendation: 'Evacuate vulnerable residents in Zone A17 to Shelter S04. Redirect incoming traffic away from flooded NH65. Pre-position 3 rescue boats at coordination point CP-7.',
};
