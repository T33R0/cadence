"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, MODEL_PRICING } from "./supabase";
import type {
  ConnMemory,
  ConnSoul,
  ConnIdentity,
  ConnHeartbeat,
  ConnSessionLog,
  CadenceIdentity,
  TrainingLog,
  NutritionMeal,
  BodyMetric,
  WifeMealPlan,
  ChatMessage,
} from "./supabase";

/* ═══════════════════════════════════════════════════════════════
   Generic hook for fetching from Supabase
   ═══════════════════════════════════════════════════════════════ */
function useSupabaseQuery<T>(
  table: string,
  options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    filter?: { column: string; op: string; value: any };
    filters?: { column: string; op: string; value: any }[];
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from(table)
      .select(options?.select || "*");

    if (options?.filter) {
      query = query.filter(
        options.filter.column,
        options.filter.op,
        options.filter.value
      );
    }

    if (options?.filters) {
      for (const f of options.filters) {
        query = query.filter(f.column, f.op, f.value);
      }
    }

    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? false,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: result, error: err } = await query;

    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((result as T[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/* ═══════════════════════════════════════════════════════════════
   Typed hooks for each table — using conn_* schema
   ═══════════════════════════════════════════════════════════════ */

export function useMemories() {
  return useSupabaseQuery<ConnMemory>("conn_memory", {
    order: { column: "importance", ascending: false },
  });
}

export function useSoul() {
  return useSupabaseQuery<ConnSoul>("conn_soul", {
    order: { column: "priority", ascending: true },
    filter: { column: "active", op: "eq", value: true },
  });
}

export function useConnIdentity() {
  return useSupabaseQuery<ConnIdentity>("conn_identity", {
    order: { column: "category", ascending: true },
  });
}

export function useCadenceIdentity() {
  return useSupabaseQuery<CadenceIdentity>("cadence_identity", {
    order: { column: "category", ascending: true },
  });
}

export function useTasks() {
  return useSupabaseQuery<ConnHeartbeat>("conn_heartbeat", {
    order: { column: "created_at", ascending: false },
  });
}

export function useSessionLogs() {
  return useSupabaseQuery<ConnSessionLog>("conn_session_logs", {
    order: { column: "created_at", ascending: false },
    limit: 10,
  });
}

export function useTrainingLog() {
  return useSupabaseQuery<TrainingLog>("training_log", {
    order: { column: "day_number", ascending: false },
    limit: 10,
  });
}

export function useTrainingStats() {
  return useSupabaseQuery<TrainingLog>("training_log", {
    order: { column: "day_number", ascending: false },
  });
}

export function useNutritionToday() {
  const today = new Date().toISOString().split("T")[0];
  return useSupabaseQuery<NutritionMeal>("nutrition_meals", {
    order: { column: "time_logged", ascending: true },
    filter: { column: "date", op: "eq", value: today },
  });
}

export function useBodyMetrics() {
  return useSupabaseQuery<BodyMetric>("body_metrics", {
    order: { column: "date", ascending: false },
    limit: 7,
  });
}

export function useWifeMealPlans() {
  return useSupabaseQuery<WifeMealPlan>("wife_meal_plans", {
    order: { column: "week_start_date", ascending: false },
    limit: 14,
  });
}

export function useChatCosts() {
  return useSupabaseQuery<ChatMessage>("chat_messages", {
    select: "id,tokens_in,tokens_out,model_used,created_at,session_id",
    order: { column: "created_at", ascending: false },
    limit: 100,
  });
}

/* ═══════════════════════════════════════════════════════════════
   Master dashboard hook — aggregates all data
   ═══════════════════════════════════════════════════════════════ */

export function useDashboardData() {
  const memories = useMemories();
  const soul = useSoul();
  const connIdentity = useConnIdentity();
  const cadenceIdentity = useCadenceIdentity();
  const tasks = useTasks();
  const training = useTrainingLog();
  const trainingAll = useTrainingStats();
  const nutrition = useNutritionToday();
  const body = useBodyMetrics();
  const sessions = useSessionLogs();
  const mealPlans = useWifeMealPlans();
  const chatCosts = useChatCosts();

  const loading =
    memories.loading ||
    soul.loading ||
    connIdentity.loading ||
    tasks.loading ||
    training.loading ||
    nutrition.loading ||
    body.loading;

  // Training progress
  const completedDays = trainingAll.data.filter((d) => d.completed).length;
  const totalDays = trainingAll.data.length || 98;
  const currentDay = trainingAll.data.length > 0
    ? Math.max(...trainingAll.data.map((d) => d.day_number))
    : 0;

  // Today's nutrition totals
  const nutritionTotals = {
    calories: nutrition.data.reduce((s, m) => s + (Number(m.calories) || 0), 0),
    protein: nutrition.data.reduce((s, m) => s + (Number(m.protein_g) || 0), 0),
    fat: nutrition.data.reduce((s, m) => s + (Number(m.fat_g) || 0), 0),
    netCarbs: nutrition.data.reduce((s, m) => s + (Number(m.net_carbs_g) || 0), 0),
    fiber: nutrition.data.reduce((s, m) => s + (Number(m.fiber_g) || 0), 0),
  };

  // Latest body metric
  const latestBody = body.data[0] || null;

  // Genesis countdown
  const genesisDate = new Date("2026-05-03");
  const genesisCountdown = Math.ceil(
    (genesisDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Chat cost calculation
  const today = new Date().toISOString().split("T")[0];
  const todayCost = chatCosts.data
    .filter((m) => m.created_at.startsWith(today))
    .reduce((sum, m) => {
      const pricing = MODEL_PRICING[m.model_used || ""] || { input: 3, output: 15 };
      const inCost = ((m.tokens_in || 0) / 1_000_000) * pricing.input;
      const outCost = ((m.tokens_out || 0) / 1_000_000) * pricing.output;
      return sum + inCost + outCost;
    }, 0);

  const totalCost = chatCosts.data.reduce((sum, m) => {
    const pricing = MODEL_PRICING[m.model_used || ""] || { input: 3, output: 15 };
    const inCost = ((m.tokens_in || 0) / 1_000_000) * pricing.input;
    const outCost = ((m.tokens_out || 0) / 1_000_000) * pricing.output;
    return sum + inCost + outCost;
  }, 0);

  const totalTokens = chatCosts.data.reduce(
    (sum, m) => sum + (m.tokens_in || 0) + (m.tokens_out || 0),
    0
  );

  const refetchAll = () => {
    memories.refetch();
    soul.refetch();
    connIdentity.refetch();
    cadenceIdentity.refetch();
    tasks.refetch();
    training.refetch();
    trainingAll.refetch();
    nutrition.refetch();
    body.refetch();
    sessions.refetch();
    mealPlans.refetch();
    chatCosts.refetch();
  };

  return {
    memories: memories.data,
    soul: soul.data,
    connIdentity: connIdentity.data,
    cadenceIdentity: cadenceIdentity.data,
    tasks: tasks.data,
    training: training.data,
    sessions: sessions.data,
    nutritionMeals: nutrition.data,
    nutritionTotals,
    bodyMetrics: body.data,
    latestBody,
    mealPlans: mealPlans.data,
    completedDays,
    totalDays,
    currentDay,
    todayCost,
    totalCost,
    totalTokens,
    genesisCountdown,
    loading,
    refetchAll,
  };
}
