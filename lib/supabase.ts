import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null as any

export const supabaseAdmin = (() => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey && supabaseUrl) {
    return createSupabaseClient(supabaseUrl, serviceKey)
  }
  return null as any
})()

export const createClient = () => supabase

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'B2BsalesBUDDY'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bhadreshdani69@gmail.com'
export const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/bhadreshdani/15min'
