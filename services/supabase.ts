
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://egohzqqondgbuijrybhy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb2h6cXFvbmRnYnVpanJ5Ymh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjA3ODUsImV4cCI6MjA4MjMzNjc4NX0.W_1Lr0sF_VOcEdH89nKNaUTOxdUODNvJV6dYjpyVlu0';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getDeviceId = () => {
  let id = localStorage.getItem('tactical_radio_device_id_v2');
  if (!id) {
    // Generar un ID más robusto tipo UUID corto
    id = 'unit-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('tactical_radio_device_id_v2', id);
  }
  return id;
};
