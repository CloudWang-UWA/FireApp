export type RiskLevel = 'Low' | 'Medium' | 'High'

export type FactorKey =
  | 'slope_profile'
  | 'fuel_age'
  | 'wind_exposure'
  | 'vegetation_density'
  | 'outcrop_index'

export type FactorData = {
  key: FactorKey
  label: string
  subtitle: string
  value: string
  description: string
  contributionPct: number
  color: string
  tone: string
}

export type HeritageInsightsModel = {
  siteLabel: string
  siteTitle: string
  siteId: string
  areaName: string
  riskLevel: RiskLevel
  predictedProbability: number
  probabilitySubtitle: string
  interpretationBullets: string[]
  locationPreview: {
    title: string
    description: string
    coordinatesText: string
    lat: number
    lng: number
    radiusMeters: number
    legend: string[]
  }
  factors: FactorData[]
  elevationProfile: Array<{ x: string; value: number }>
  windRose: Array<{ direction: string; value: number }>
  vegetationHistogram: Array<{ bucket: string; value: number }>
  fuelAgeDistribution: Array<{ name: string; value: number; color: string }>
  systemSummary: string
  systemActions: Array<{ title: string; detail: string }>
}

export const MOCK_HERITAGE_INSIGHTS: HeritageInsightsModel = {
  siteLabel: 'Selected heritage site',
  siteTitle: 'Karla Granite Shelter Complex',
  siteId: 'ACH-ALB-00421',
  areaName: 'Albany, WA Region',
  riskLevel: 'High',
  predictedProbability: 0.74,
  probabilitySubtitle:
    'Risk rises under strong seasonal winds and dry fuel continuity around the site perimeter.',
  interpretationBullets: [
    'Slope and wind alignment significantly increase directional spread potential.',
    'Fuel age and vegetation continuity support sustained burn behavior.',
    'Outcrop zones provide partial resistance but are insufficient as primary mitigation.',
  ],
  locationPreview: {
    title: 'Location preview',
    description: 'Geospatial context of the selected site and surrounding risk envelope.',
    coordinatesText: 'Lat -34.950, Lng 117.880',
    lat: -34.95,
    lng: 117.88,
    radiusMeters: 650,
    legend: ['Site marker', 'Risk buffer', 'Observed terrain context'],
  },
  factors: [
    {
      key: 'slope_profile',
      label: 'Slope profile',
      subtitle: 'Terrain gradient behavior',
      value: '17°',
      description: 'Steeper gradients accelerate uphill fire movement and preheating.',
      contributionPct: 26,
      color: '#4fa96f',
      tone: 'is-slope',
    },
    {
      key: 'fuel_age',
      label: 'Fuel age',
      subtitle: 'Vegetation maturity',
      value: '11 yrs',
      description: 'Mature fuel contributes higher sustained intensity and burn duration.',
      contributionPct: 23,
      color: '#c98d4a',
      tone: 'is-fuel',
    },
    {
      key: 'wind_exposure',
      label: 'Wind exposure',
      subtitle: 'Prevailing pressure',
      value: '32 km/h',
      description: 'Persistent wind channels increase ember travel and front speed.',
      contributionPct: 22,
      color: '#4f88be',
      tone: 'is-wind',
    },
    {
      key: 'vegetation_density',
      label: 'Vegetation density',
      subtitle: 'Fuel continuity',
      value: '68%',
      description: 'Dense cover raises heat transfer and short-range spotting risk.',
      contributionPct: 15,
      color: '#3f8f5b',
      tone: 'is-vegetation',
    },
    {
      key: 'outcrop_index',
      label: 'Outcrop index',
      subtitle: 'Rock exposure buffer',
      value: '43%',
      description: 'Exposed rock reduces spread continuity, but only in segmented corridors.',
      contributionPct: 14,
      color: '#9a6da9',
      tone: 'is-outcrop',
    },
  ],
  elevationProfile: [
    { x: '0', value: 12 },
    { x: '1', value: 18 },
    { x: '2', value: 24 },
    { x: '3', value: 22 },
    { x: '4', value: 30 },
    { x: '5', value: 35 },
    { x: '6', value: 31 },
    { x: '7', value: 26 },
    { x: '8', value: 20 },
    { x: '9', value: 17 },
    { x: '10', value: 14 },
  ],
  windRose: [
    { direction: 'N', value: 36 },
    { direction: 'NE', value: 28 },
    { direction: 'E', value: 22 },
    { direction: 'SE', value: 14 },
    { direction: 'S', value: 16 },
    { direction: 'SW', value: 24 },
    { direction: 'W', value: 30 },
    { direction: 'NW', value: 34 },
  ],
  vegetationHistogram: [
    { bucket: 'Sparse', value: 18 },
    { bucket: 'Low', value: 24 },
    { bucket: 'Medium', value: 31 },
    { bucket: 'High', value: 27 },
  ],
  fuelAgeDistribution: [
    { name: '0-5y', value: 12, color: '#e9c89a' },
    { name: '6-10y', value: 24, color: '#dca96b' },
    { name: '11-15y', value: 38, color: '#c98546' },
    { name: '16y+', value: 26, color: '#9f5e2f' },
  ],
  systemSummary:
    'Current indicators show a high-confidence vulnerability profile driven by slope-wind coupling and mature fuel continuity. Mitigation should prioritize exposed gradient corridors and wind-facing edge zones.',
  systemActions: [
    {
      title: 'Prioritize edge monitoring',
      detail: 'Increase patrol frequency on wind-exposed ridge-adjacent boundaries.',
    },
    {
      title: 'Sequence fuel treatment',
      detail: 'Target mature fuel bands overlapping high-gradient corridors first.',
    },
    {
      title: 'Use outcrop buffers',
      detail: 'Leverage rock-exposed segments as tactical staging and containment zones.',
    },
    {
      title: 'Trigger weather alerts',
      detail: 'Enable seasonal alert thresholds for dry-wind escalation windows.',
    },
  ],
}
