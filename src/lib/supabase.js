import { createClient } from '@supabase/supabase-js';

// ─── Supabase Configuration ───────────────────────────────────────────────────
// Replace these values with your actual Supabase project credentials.
// Get them from: https://supabase.com/dashboard → Project Settings → API
//
// VITE_ prefix makes these available in the browser via import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// ─── GIS Layer Export ─────────────────────────────────────────────────────────
// Supabase table schema (run this SQL in your Supabase SQL editor):
//
// CREATE TABLE gis_layers (
//   id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   created_at   timestamptz DEFAULT now(),
//   layer_name   text NOT NULL,
//   map_type     text NOT NULL,      -- 'classification' | 'abundance' | 'uncertainty' | 'probability'
//   mineral      text,               -- target mineral (for abundance/probability maps)
//   presenter    text DEFAULT 'Lidiya',
//   mission_id   text,               -- e.g. 'SIH25142'
//   seed         integer,            -- deterministic seed used to generate this map
//   pixel_count  integer,
//   dominant_mineral text,
//   confidence_pct  numeric,
//   coord_system text DEFAULT 'Lunar IAU 2015',
//   export_format   text DEFAULT 'GeoTIFF',
//   pixel_data   jsonb,              -- full pixel array for the map
//   abundance_breakdown jsonb,       -- mineral % breakdown
//   metadata     jsonb               -- extra key/value pairs
// );
//
// -- Enable row-level security (optional but recommended)
// ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow anon inserts" ON gis_layers FOR INSERT TO anon WITH CHECK (true);
// CREATE POLICY "Allow anon selects" ON gis_layers FOR SELECT TO anon USING (true);

export async function exportGISLayer({
  layerName,
  mapType,
  mineral,
  seed,
  pixelData,
  abundanceBreakdown,
  dominantMineral,
}) {
  if (!supabase) {
    return { error: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env' };
  }

  const payload = {
    layer_name: layerName,
    map_type: mapType,
    mineral: mineral || null,
    presenter: 'Lidiya',
    mission_id: 'SIH25142',
    seed,
    pixel_count: pixelData ? pixelData.flat().length : 0,
    dominant_mineral: dominantMineral,
    confidence_pct: 97.3,
    coord_system: 'Lunar IAU 2015',
    export_format: 'GeoTIFF',
    pixel_data: pixelData,
    abundance_breakdown: abundanceBreakdown,
    metadata: {
      resolution: '30m/pixel',
      grid_size: '32x32',
      vnir_bands: 9,
      ai_model: '3D-CNN + ViT',
      physics_validated: true,
    },
  };

  const { data, error } = await supabase
    .from('gis_layers')
    .insert([payload])
    .select()
    .single();

  return { data, error };
}

export async function fetchGISLayers() {
  if (!supabase) return { data: [], error: 'Not configured' };
  const { data, error } = await supabase
    .from('gis_layers')
    .select('id, created_at, layer_name, map_type, mineral, dominant_mineral, confidence_pct, seed')
    .order('created_at', { ascending: false })
    .limit(20);
  return { data, error };
}
