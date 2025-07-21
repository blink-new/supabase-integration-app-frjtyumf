import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fjpiloatjlkcnflgjxza.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcGlsb2F0amxrY25mbGdqeHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3Mzc2NDcsImV4cCI6MjA2ODMxMzY0N30.TNe6Lv3KrfWeITK992A9OAGdzetWKwtIuW_txBYbAKM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Project {
  id: string
  name: string
  description?: string
  domain?: string
  subdomain?: string
  created_at: string
  updated_at: string
  user_id: string
  is_published: boolean
  theme_settings?: any
}

export interface Page {
  id: string
  project_id: string
  title: string
  slug: string
  content: string
  meta_description?: string
  meta_keywords?: string
  is_published: boolean
  order_index: number
  parent_id?: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  description?: string
  content: string
  preview_image?: string
  category: string
  created_at: string
}

export interface Analytics {
  id: string
  project_id: string
  page_id?: string
  event_type: string
  event_data?: any
  timestamp: string
  user_agent?: string
  ip_address?: string
}