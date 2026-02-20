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
   TYPE DEFINITIONS — mapped from Ogma's live Supabase schema
   ═══════════════════════════════════════════════════════════════ */

export type PulseMemory = {
  id: string;
  key: string;
  content: string;
  tags: string[];
  memory_type: string; // core_memory | decision | skill | preference | knowledge
  importance: number;
  source_session: string | null;
  created_at: string;
  updated_at: string;
};

export type PulseSoul = {
  id: string;
  directive: string;
  category: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PulseIdentity = {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type PulseHeartbeat = {
  id: string;
  task: string;
  description: string | null;
  category: string;
  priority: number;
  status: string; // pending | in_progress | completed | failed
  scheduled_for: string | null;
  recurrence: string | null;
  result: string | null;
  error: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PulseCostLog = {
  id: string;
  session_date: string;
  model_used: string;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;
  task_type: string | null;
  value_generated: string | null;
  notes: string | null;
  created_at: string;
};

export type PulseSessionLog = {
  id: string;
  log_date: string;
  session_id: string | null;
  summary: string;
  topics: string[];
  decisions_made: string[];
  tasks_created: string[];
  tokens_estimated: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  model_used: string | null;
  cost_usd: number | null;
  created_at: string;
};

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
};

export type NutritionMeal = {
  id: number;
  date: string;
  time_logged: string | null;
  meal_type: string | null;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  net_carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
  created_at: string;
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
