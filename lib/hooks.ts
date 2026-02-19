"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import type {
  PulseMemory,
  PulseSoul,
  PulseIdentity,
  PulseHeartbeat,
  PulseCostLog,
  PulseSessionLog,
  TrainingLog,
  NutritionMeal,
  BodyMetric,
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
   Typed hooks for each table
   ═══════════════════════════════════════════════════════════════ */

export function useMemories() {
  return useSupabaseQuery<PulseMemory>("pulse_memory", {
    order: { column: "importance", ascending: false },
  });
}

export function useSoul() {
  return useSupabaseQuery<PulseSoul>("pulse_soul", {
    order: { column: "priority", ascending: true },
    filter: { column: "active", op: "eq", value: true },
  });
}

export function useIdentity() {
  return useSupabaseQuery<PulseIdentity>("pulse_identity", {
    order: { column: "category", ascending: true },
  });
}

export function useTasks() {
  return useSupabaseQuery<PulseHeartbeat>("pulse_heartbeat", {
    order: { column: "created_at", ascending: false },
  });
}

export function useCostLog() {
  return useSupabaseQuery<PulseCostLog>("pulse_cost_log", {
    order: { column: "created_at", ascending: false },
    limit: 20,
  });
}

export function useSessionLogs() {
  return useSupabaseQuery<PulseSessionLog>("pulse_session_logs", {
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

/* ═══════════════════════════════════════════════════════════════
   Derived / computed data hooks
   ═══════════════════════════════════════════════════════════════ */

export function useDashboardData() {
  const memories = useMemories();
  const soul = useSoul();
  const identity = useIdentity();
  const tasks = useTasks();
  const costLog = useCostLog();
  const training = useTrainingLog();
  const trainingAll = useTrainingStats();
  const nutrition = useNutritionToday();
  const body = useBodyMetrics();
  const sessions = useSessionLogs();

  const loading =
    memories.loading ||
    soul.loading ||
    identity.loading ||
    tasks.loading ||
    costLog.loading ||
    training.loading ||
    nutrition.loading ||
    body.loading;

  // Compute training progress
  const completedDays = trainingAll.data.filter((d) => d.completed).length;
  const totalDays = trainingAll.data.length || 98;
  const currentDay = trainingAll.data.length > 0
    ? Math.max(...trainingAll.data.map((d) => d.day_number))
    : 0;

  // Compute today's cost
  const today = new Date().toISOString().split("T")[0];
  const todayCost = costLog.data
    .filter((c) => c.session_date === today)
    .reduce((sum, c) => sum + (Number(c.cost_usd) || 0), 0);

  // Compute today's nutrition totals
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

  const refetchAll = () => {
    memories.refetch();
    soul.refetch();
    identity.refetch();
    tasks.refetch();
    costLog.refetch();
    training.refetch();
    trainingAll.refetch();
    nutrition.refetch();
    body.refetch();
    sessions.refetch();
  };

  return {
    memories: memories.data,
    soul: soul.data,
    identity: identity.data,
    tasks: tasks.data,
    costLog: costLog.data,
    training: training.data,
    sessions: sessions.data,
    nutritionMeals: nutrition.data,
    nutritionTotals,
    bodyMetrics: body.data,
    latestBody,
    completedDays,
    totalDays,
    currentDay,
    todayCost,
    genesisCountdown,
    loading,
    refetchAll,
  };
}
