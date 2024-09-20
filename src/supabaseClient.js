// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zynbyczhbsplsyfbuvwu.supabase.co'; // Tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bmJ5Y3poYnNwbHN5ZmJ1dnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1MTQyMDQsImV4cCI6MjA0MjA5MDIwNH0.l_SDvTCaOpu239nxxfUpxsdNERnM5FNCeCjkQ14H7M0'; // Tu API Key

export const supabase = createClient(supabaseUrl, supabaseKey);
