export interface TestLocation {
  name: string
  date: string
  time: string
  location: string
  latitude: number
  longitude: number
  timezone: string
  description: string
  expectedUTC: string
}

export const TEST_LOCATIONS: TestLocation[] = [
  {
    name: 'New York',
    expectedUTC: '1990-06-15T18:30:00.000Z',
    date: '1990-06-15',
    time: '14:30',
    location: 'New York, NY, USA',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    description: 'Eastern Time (UTC-5/-4)'
  },
  {
    name: 'Los Angeles',
    expectedUTC: '1985-12-25T16:00:00.000Z',
    date: '1985-12-25',
    time: '08:00',
    location: 'Los Angeles, CA, USA',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles',
    description: 'Pacific Time (UTC-8/-7)'
  },
  {
    name: 'London',
    expectedUTC: '1992-03-10T19:45:00.000Z',
    date: '1992-03-10',
    time: '19:45',
    location: 'London, UK',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    description: 'GMT/BST (UTC+0/+1)'
  },
  {
    name: 'Tokyo',
    expectedUTC: '1988-08-08T14:30:00.000Z',
    date: '1988-08-08',
    time: '23:30',
    location: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    description: 'Japan Standard Time (UTC+9)'
  },
  {
    name: 'Sydney',
    expectedUTC: '1995-01-19T19:15:00.000Z',
    date: '1995-01-20',
    time: '06:15',
    location: 'Sydney, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    description: 'Australian Eastern Time (UTC+10/+11)'
  },
  {
    name: 'Dubai',
    expectedUTC: '1987-11-05T08:00:00.000Z',
    date: '1987-11-05',
    time: '12:00',
    location: 'Dubai, UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
    description: 'Gulf Standard Time (UTC+4)'
  },
  {
    name: 'São Paulo',
    expectedUTC: '1991-04-17T19:20:00.000Z',
    date: '1991-04-17',
    time: '16:20',
    location: 'São Paulo, Brazil',
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: 'America/Sao_Paulo',
    description: 'Brasília Time (UTC-3)'
  },
  {
    name: 'Mumbai',
    expectedUTC: '1993-07-22T05:15:00.000Z',
    date: '1993-07-22',
    time: '10:45',
    location: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    description: 'Indian Standard Time (UTC+5:30)'
  },
  {
    name: 'Reykjavik',
    expectedUTC: '1989-02-14T04:00:00.000Z',
    date: '1989-02-14',
    time: '04:00',
    location: 'Reykjavik, Iceland',
    latitude: 64.1466,
    longitude: -21.9426,
    timezone: 'Atlantic/Reykjavik',
    description: 'GMT (UTC+0)'
  },
  {
    name: 'Chicago',
    expectedUTC: '1977-09-01T22:00:00.000Z',
    date: '1977-09-01',
    time: '17:00',
    location: 'Chicago, IL, USA',
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago',
    description: 'Central Time (UTC-6/-5)'
  }
]

