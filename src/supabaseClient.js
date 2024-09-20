// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umvpcsdyfbmgalekufgh.supabase.co'; // Tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdnBjc2R5ZmJtZ2FsZWt1ZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0OTMyMTksImV4cCI6MjA0MjA2OTIxOX0.8fGoABy2TKQaqt2ZFjCJ-qmgSgxqIoNbgVjXSK30Tts'; // Tu API Key

export const supabase = createClient(supabaseUrl, supabaseKey);
