import { createClient } from '@supabase/supabase-js';

// 1. Grab the secret keys from your .env.local file
const supabaseUrl = 'https://urhwjbomehgowyzhvqko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaHdqYm9tZWhnb3d5emh2cWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTE5NjAsImV4cCI6MjA5OTYyNzk2MH0.VzUEFTmPn0mgql5HJdV_RKvBE_MH3boX_gtNtXKzRV4';

// 2. Create the "client" (This is the actual bridge between your app and the database)
export const supabase = createClient(supabaseUrl, supabaseKey);
