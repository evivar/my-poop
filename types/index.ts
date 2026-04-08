export interface Profile {
  id: string
  display_name: string
  role: 'user' | 'admin'
  is_banned: boolean
  created_at: string
  updated_at: string
}

export type BathroomType = 'public' | 'restaurant' | 'gas_station' | 'mall' | 'cafe' | 'hotel' | 'hospital' | 'other'

export interface Bathroom {
  id: string
  name: string
  latitude: number
  longitude: number
  type: BathroomType
  is_accessible: boolean
  is_free: boolean
  directions: string | null
  schedule: string | null
  avg_rating: number
  avg_cleanliness: number
  avg_privacy: number
  avg_toilet_paper_quality: number
  review_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  osm_id: string | null
  source: 'user' | 'osm'
  user_edited: boolean
}

export interface Review {
  id: string
  bathroom_id: string
  user_id: string
  rating: number
  cleanliness: number
  privacy: number
  toilet_paper_quality: number
  comment: string | null
  is_hidden: boolean
  vote_count: number
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'display_name'>
  photos?: Photo[]
  user_has_voted?: boolean
}

export interface ReviewVote {
  id: string
  review_id: string
  user_id: string
  created_at: string
}

export interface Report {
  id: string
  review_id: string
  reported_by: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  moderated_by: string | null
  moderated_at: string | null
  created_at: string
  reviews?: Review & { profiles?: Pick<Profile, 'display_name'> }
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
}

export interface Favorite {
  id: string
  user_id: string
  bathroom_id: string
  created_at: string
}

export interface Photo {
  id: string
  bathroom_id: string | null
  review_id: string | null
  uploaded_by: string
  storage_path: string
  created_at: string
}

export type BathroomStatusType = 'no_paper' | 'dirty' | 'closed' | 'out_of_order' | 'flooded'

export interface BathroomStatus {
  id: string
  bathroom_id: string
  user_id: string
  status: BathroomStatusType
  created_at: string
}

export interface ActiveStatus {
  status: BathroomStatusType
  report_count: number
}

export interface GeocoderResult {
  name: string
  displayName: string
  lat: number
  lng: number
}
