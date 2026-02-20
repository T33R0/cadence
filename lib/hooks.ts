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
  CadenceHeartbeat,
  CadenceMemory,
  CadenceSoul,
  TrainingLog,
  NutritionMeal,
  BodyMetric,
  WifeMealPlan,
  ChatMessage,
} from "./supabase";

/* ═══════════════════════════════════════════════════════════════
   MST helper — Rory's timezone is America/Denver
   ═══════════════════════════════════════════════════════════════ */
function getMSTDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" }); // YYYY-MM-DD
}

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
   Typed hooks — Conn agent tables
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

/* ═══════════════════════════════════════════════════════════════
   Typed hooks — Cadence agent tables
   ═══════════════════════════════════════════════════════════════ */

export function useCadenceIdentity() {
  return useSupabaseQuery<CadenceIdentity>("cadence_identity", {
    order: { column: "category", ascending: true },
  });
}

export function useCadenceHeartbeat() {
  return useSupabaseQuery<CadenceHeartbeat>("cadence_heartbeat", {
    order: { column: "created_at", ascending: false },
  });
}

export function useCadenceMemory() {
  return useSupabaseQuery<CadenceMemory>("cadence_memory", {
    order: { column: "importance", ascending: false },
  });
}

export function useCadenceSoul() {
  return useSupabaseQuery<CadenceSoul>("cadence_soul", {
    order: { column: "priority", ascending: true },
    filter: { column: "active", op: "eq", value: true },
  });
}

/* ═══════════════════════════════════════════════════════════════
   Typed hooks — Training & wellness
   ═══════════════════════════════════════════════════════════════ */

export function useTrainingLog() {
  // Fetch around current day — ascending from today's area
  return useSupabaseQuery<TrainingLog>("training_log", {
    order: { column: "day_number", ascending: true },
  });
}

export function useNutritionToday() {
  const today = getMSTDate();
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
  const cadenceHeartbeat = useCadenceHeartbeat();
  const cadenceMemory = useCadenceMemory();
  const cadenceSoul = useCadenceSoul();
  const tasks = useTasks();
  const trainingAll = useTrainingLog();
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
    trainingAll.loading ||
    nutrition.loading ||
    body.loading;

  // Training progress — find current day by matching today's MST date
  const todayMST = getMSTDate();
  const allTraining = trainingAll.data;
  const completedDays = allTraining.filter((d) => d.completed).length;
  const totalDays = allTraining.length || 98;

  // Current day = the training_log entry matching today's date, or nearest past
  const todayEntry = allTraining.find((d) => d.date === todayMST);
  const currentDay = todayEntry
    ? todayEntry.day_number
    : allTraining.filter((d) => d.date <= todayMST).length > 0
      ? allTraining.filter((d) => d.date <= todayMST).slice(-1)[0].day_number
      : 0;

  // Training entries near today (for dashboard preview: today + next few)
  const todayIdx = allTraining.findIndex((d) => d.date === todayMST);
  const trainingNearToday = todayIdx >= 0
    ? allTraining.slice(todayIdx, todayIdx + 5)
    : allTraining.filter((d) => d.date >= todayMST).slice(0, 5);

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

  // Genesis Race countdown — race is May 30, 2026 (training ends May 3)
  const raceDate = new Date("2026-05-30");
  const trainingEndDate = new Date("2026-05-03");
  const raceCountdown = Math.ceil(
    (raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const trainingEndCountdown = Math.ceil(
    (trainingEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Chat cost calculation — using MST calendar day
  const todayCost = chatCosts.data
    .filter((m) => {
      // Convert created_at to MST date string
      const msgDate = new Date(m.created_at).toLocaleDateString("en-CA", { timeZone: "America/Denver" });
      return msgDate === todayMST;
    })
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
    cadenceHeartbeat.refetch();
    cadenceMemory.refetch();
    cadenceSoul.refetch();
    tasks.refetch();
    trainingAll.refetch();
    nutrition.refetch();
    body.refetch();
    sessions.refetch();
    mealPlans.refetch();
    chatCosts.refetch();
  };

  return {
    // Conn agent data
    memories: memories.data,
    soul: soul.data,
    connIdentity: connIdentity.data,
    tasks: tasks.data,
    sessions: sessions.data,
    // Cadence agent data
    cadenceIdentity: cadenceIdentity.data,
    cadenceHeartbeat: cadenceHeartbeat.data,
    cadenceMemory: cadenceMemory.data,
    cadenceSoul: cadenceSoul.data,
    // Training & wellness
    trainingAll: allTraining,
    trainingNearToday,
    nutritionMeals: nutrition.data,
    nutritionTotals,
    bodyMetrics: body.data,
    latestBody,
    mealPlans: mealPlans.data,
    // Computed
    completedDays,
    totalDays,
    currentDay,
    todayCost,
    totalCost,
    totalTokens,
    raceCountdown,
    trainingEndCountdown,
    loading,
    refetchAll,
  };
}
