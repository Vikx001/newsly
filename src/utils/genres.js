import { 
  Laptop, Globe, TrendingUp, Trophy, 
  Microscope, Heart, Film, Vote 
} from 'lucide-react'

export const GENRES = [
  { id: 'technology', name: 'Technology', icon: Laptop },
  { id: 'general', name: 'World', icon: Globe },
  { id: 'business', name: 'Business', icon: TrendingUp },
  { id: 'sports', name: 'Sports', icon: Trophy },
  { id: 'science', name: 'Science', icon: Microscope },
  { id: 'health', name: 'Health', icon: Heart },
  { id: 'entertainment', name: 'Entertainment', icon: Film },
  { id: 'politics', name: 'Politics', icon: Vote },
]

export const getGenreById = (id) => GENRES.find(g => g.id === id)
export const getGenresByIds = (ids) => GENRES.filter(g => ids.includes(g.id))