// supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con los de tu proyecto de Supabase
const supabaseUrl = 'https://zynbyczhbsplsyfbuvwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bmJ5Y3poYnNwbHN5ZmJ1dnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1MTQyMDQsImV4cCI6MjA0MjA5MDIwNH0.l_SDvTCaOpu239nxxfUpxsdNERnM5FNCeCjkQ14H7M0';

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
