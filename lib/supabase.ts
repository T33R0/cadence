import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Exposed for Edge Function auth (JWT verification)
export const SUPABASE_ANON_KEY = supabaseKey;

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder"
);

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS — mapped from Conn/Cadence live Supabase schema
   Project: bghyjxxjtkzvmfkbibqp
   ═══════════════════════════════════════════════════════════════ */

// Conn agent tables (conn_* prefix)
export type ConnMemory = {
  id: string;
  key: string;
  content: string;
  category: string;
  tags: string[];
  importance: number;
  source_session: string | null;
  created_at: string;
  updated_at: string;
};

export type ConnSoul = {
  id: string;
  directive: string;
  category: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConnIdentity = {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type ConnHeartbeat = {
  id: string;
  task: string;
  description: string | null;
  category: string;
  priority: number;
  status: string; // pending | in_progress | completed | failed
  scheduled_for: string | null;
  recurrence: string | null;
  max_retries: number;
  retry_count: number;
  result: string | null;
  error: string | null;
  completed_at: string | null;
  created_by_session: string | null;
  telegram_update_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ConnSessionLog = {
  id: string;
  log_date: string;
  session_id: string | null;
  summary: string;
  topics: string[];
  decisions_made: string[];
  tasks_created: string[];
  model_used: string | null;
  created_at: string;
};

// Cadence identity (dashboard personality)
export type CadenceIdentity = {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
};

// Training & wellness tables
export type TrainingLog = {
  id: string;
  day_number: number;
  date: string;
  phase: string;
  week: number;
  focus: string;
  location: string;
  workout_name: string;
  protocol: string;
  notes: string | null;
  completed: boolean;
  quote: string | null;
  quote_author: string | null;
  instagram_posted: boolean;
  synced_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type NutritionMeal = {
  id: number;
  date: string;
  time_logged: string | null;
  meal_type: string | null;
  description: string | null;
  source: string | null;
  is_wife_plan: boolean;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  net_carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type BodyMetric = {
  id: number;
  date: string;
  time_measured: string | null;
  weight_lbs: number | null;
  body_fat_percentage: number | null;
  resting_heart_rate: number | null;
  notes: string | null;
  created_at: string;
};

export type WifeMealPlan = {
  id: number;
  week_start_date: string;
  meal_day: string | null;
  meal_type: string | null;
  description: string | null;
  planned_protein_g: number | null;
  planned_carbs_g: number | null;
  planned_net_carbs_g: number | null;
  planned_fat_g: number | null;
  planned_calories: number | null;
  notes: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  session_id: string;
  created_at: string;
  tokens_in: number | null;
  tokens_out: number | null;
  model_used: string | null;
};

// Edge Function URL for chat
export const CHAT_FUNCTION_URL = `${supabaseUrl}/functions/v1/chat`;

// Model pricing (per 1M tokens: input/output)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "haiku-4.5":   { input: 1.00, output: 5.00 },
  "sonnet-4":    { input: 3.00, output: 15.00 },
  "sonnet-4.5":  { input: 3.00, output: 15.00 },
  "opus-4.6":    { input: 15.00, output: 75.00 },
  // Fallback names from DB
  "claude-3-haiku":  { input: 0.25, output: 1.25 },
  "claude-3-sonnet": { input: 3.00, output: 15.00 },
};
