import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fbjgutmaulopjevoiqsb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_qm8QfrXWNBGrYLXS3MuZvA_C3BM57_4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
