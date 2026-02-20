import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("AI_GATEWAY_API_KEY");
const API_URL = Deno.env.get("AI_GATEWAY_URL") || "https://api.anthropic.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// ═══ ALLOWED MODELS ═══
const ALLOWED_MODELS = {
  "haiku-4.5": {
    id: "claude-haiku-4-5-20251001",
    inputPer1M: 1,
    outputPer1M: 5
  },
  "sonnet-4": {
    id: "claude-sonnet-4-20250514",
    inputPer1M: 3,
    outputPer1M: 15
  },
  "sonnet-4.5": {
    id: "claude-sonnet-4-5-20250929",
    inputPer1M: 3,
    outputPer1M: 15
  },
  "opus-4.6": {
    id: "claude-opus-4-6",
    inputPer1M: 15,
    outputPer1M: 75
  }
};
const DEFAULT_MODEL = "haiku-4.5";
// ═══ TOOL DEFINITIONS ═══
const tools = [
  {
    name: "create_task",
    description: "Create a new task in the heartbeat queue. Use when Rory asks you to track something, add a to-do, or when you identify an action item.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "Short task title"
        },
        description: {
          type: "string",
          description: "Detailed description"
        },
        category: {
          type: "string",
          enum: [
            "dev",
            "health",
            "business",
            "ops",
            "brand",
            "general"
          ]
        },
        priority: {
          type: "number",
          description: "1-10 (1=critical). Default 5."
        }
      },
      required: [
        "task",
        "category"
      ]
    }
  },
  {
    name: "update_task",
    description: "Update status of an existing task. Use when Rory says something is done, in progress, or should be cancelled.",
    input_schema: {
      type: "object",
      properties: {
        task_name: {
          type: "string",
          description: "Task title to search (partial match)"
        },
        status: {
          type: "string",
          enum: [
            "pending",
            "in_progress",
            "completed",
            "failed"
          ]
        },
        result: {
          type: "string",
          description: "Result or notes"
        }
      },
      required: [
        "task_name",
        "status"
      ]
    }
  },
  {
    name: "save_memory",
    description: "Save to persistent memory. Use when Rory says 'remember this', shares a preference/decision, or provides info worth retaining.",
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Short identifier (snake_case)"
        },
        content: {
          type: "string",
          description: "The information to remember"
        },
        memory_type: {
          type: "string",
          enum: [
            "core_memory",
            "decision",
            "skill",
            "preference",
            "knowledge"
          ]
        },
        importance: {
          type: "number",
          description: "1-10 (10=critical). Default 5."
        },
        tags: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "key",
        "content",
        "memory_type"
      ]
    }
  },
  {
    name: "list_tasks",
    description: "List tasks from heartbeat queue.",
    input_schema: {
      type: "object",
      properties: {
        status_filter: {
          type: "string",
          enum: [
            "all",
            "pending",
            "in_progress",
            "completed"
          ]
        }
      }
    }
  },
  {
    name: "search_memories",
    description: "Search persistent memories by key or content.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term"
        }
      },
      required: [
        "query"
      ]
    }
  },
  {
    name: "check_cost",
    description: "Check actual spend from pulse_cost_log. Use when Rory asks about costs, budget, or when you want to verify spend is on track. Also use proactively if the conversation has been long.",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: [
            "today",
            "week",
            "all"
          ],
          description: "Time period to check. Default: today."
        }
      }
    }
  }
];
// ═══ TOOL EXECUTION ═══
async function executeTool(name, input) {
  try {
    switch(name){
      case "create_task":
        {
          const { data, error } = await supabase.from("pulse_heartbeat").insert({
            task: input.task,
            description: input.description || null,
            category: input.category,
            priority: input.priority || 5,
            status: "pending",
            created_by_session: "cc_chat"
          }).select().single();
          if (error) return `Error: ${error.message}`;
          return `Task created: "${data.task}" [${data.category}] P${data.priority}`;
        }
      case "update_task":
        {
          const { data: tasks } = await supabase.from("pulse_heartbeat").select("*").ilike("task", `%${input.task_name}%`).limit(5);
          if (!tasks?.length) return `No task found matching "${input.task_name}"`;
          const target = tasks[0];
          const updates = {
            status: input.status,
            updated_at: new Date().toISOString()
          };
          if (input.result) updates.result = input.result;
          if (input.status === "completed") updates.completed_at = new Date().toISOString();
          const { error } = await supabase.from("pulse_heartbeat").update(updates).eq("id", target.id);
          if (error) return `Error: ${error.message}`;
          return `Task "${target.task}" → ${input.status}${input.result ? " — " + input.result : ""}`;
        }
      case "save_memory":
        {
          const { data, error } = await supabase.from("pulse_memory").upsert({
            key: input.key,
            content: input.content,
            memory_type: input.memory_type,
            importance: input.importance || 5,
            tags: input.tags || [],
            source_session: "cc_chat",
            updated_at: new Date().toISOString()
          }, {
            onConflict: "key"
          }).select().single();
          if (error) return `Error: ${error.message}`;
          return `Memory saved: "${data.key}" [${data.memory_type}] importance ${data.importance}`;
        }
      case "list_tasks":
        {
          let query = supabase.from("pulse_heartbeat").select("task, status, priority, category, description").order("priority", {
            ascending: true
          });
          if (input.status_filter && input.status_filter !== "all") {
            query = query.eq("status", input.status_filter);
          } else {
            query = query.neq("status", "completed").neq("status", "failed");
          }
          const { data, error } = await query.limit(20);
          if (error) return `Error: ${error.message}`;
          if (!data?.length) return "No active tasks. (Completed/failed filtered out. Use status_filter='all' to see everything.)";
          return data.map((t)=>`[P${t.priority}] [${t.status}] [${t.category}] ${t.task}${t.description ? " — " + t.description.slice(0, 80) : ""}`).join("\n");
        }
      case "search_memories":
        {
          const { data, error } = await supabase.from("pulse_memory").select("key, content, memory_type, importance").or(`key.ilike.%${input.query}%,content.ilike.%${input.query}%`).order("importance", {
            ascending: false
          }).limit(10);
          if (error) return `Error: ${error.message}`;
          if (!data?.length) return `No memories matching "${input.query}". (Top 10 by importance are already in your system prompt.)`;
          return data.map((m)=>`[${m.memory_type}] ${m.key}: ${m.content.slice(0, 200)}`).join("\n");
        }
      case "check_cost":
        {
          const period = input.period || "today";
          const today = new Date().toISOString().split("T")[0];
          let query = supabase.from("pulse_cost_log").select("session_date, model_used, tokens_input, tokens_output, cost_usd, source, task_type");
          if (period === "today") {
            query = query.eq("session_date", today);
          } else if (period === "week") {
            const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
            query = query.gte("session_date", weekAgo);
          }
          const { data, error } = await query.order("created_at", {
            ascending: false
          }).limit(50);
          if (error) return `Error: ${error.message}`;
          if (!data?.length) return `No cost data for ${period}.`;
          const bySource = {};
          let totalCost = 0;
          for (const row of data){
            const src = row.source || "unknown";
            if (!bySource[src]) bySource[src] = {
              count: 0,
              cost: 0,
              tokensIn: 0,
              tokensOut: 0
            };
            bySource[src].count++;
            bySource[src].cost += Number(row.cost_usd) || 0;
            bySource[src].tokensIn += row.tokens_input || 0;
            bySource[src].tokensOut += row.tokens_output || 0;
            totalCost += Number(row.cost_usd) || 0;
          }
          const lines = [];
          lines.push(`=== COST REPORT (${period}) ===`);
          lines.push(`Total logged: $${totalCost.toFixed(4)}`);
          lines.push(`Budget: $10.00/day`);
          lines.push(`Remaining: $${(10 - totalCost).toFixed(4)}`);
          lines.push(``);
          lines.push(`By source:`);
          for (const [src, stats] of Object.entries(bySource)){
            lines.push(`  ${src}: ${stats.count} calls, $${stats.cost.toFixed(4)}, ${((stats.tokensIn + stats.tokensOut) / 1000).toFixed(1)}K tokens`);
          }
          lines.push(``);
          lines.push(`NOTE: This only shows costs logged to pulse_cost_log. If Vercel bill is higher, there may be unlogged sources.`);
          return lines.join("\n");
        }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Tool error: ${e.message}`;
  }
}
// ═══ SYSTEM PROMPT ═══
async function getCadenceContext(modelKey) {
  const [soul, identity, memories, sessionLogs, todayCost] = await Promise.all([
    supabase.from("pulse_soul").select("directive, category").eq("active", true).order("priority"),
    supabase.from("pulse_identity").select("key, value").limit(30),
    supabase.from("pulse_memory").select("key, content, memory_type").order("importance", {
      ascending: false
    }).limit(10),
    supabase.from("pulse_session_logs").select("summary, log_date").order("created_at", {
      ascending: false
    }).limit(3),
    supabase.from("pulse_cost_log").select("cost_usd, source").eq("session_date", new Date().toISOString().split("T")[0])
  ]);
  const soulCount = soul.data?.length || 0;
  const idCount = identity.data?.length || 0;
  const memCount = memories.data?.length || 0;
  const logCount = sessionLogs.data?.length || 0;
  const todaySpend = (todayCost.data || []).reduce((sum, r)=>sum + (Number(r.cost_usd) || 0), 0);
  const ccSpend = (todayCost.data || []).filter((r)=>r.source === "cc_chat").reduce((sum, r)=>sum + (Number(r.cost_usd) || 0), 0);
  const modelInfo = ALLOWED_MODELS[modelKey] || ALLOWED_MODELS[DEFAULT_MODEL];
  const parts = [];
  parts.push("You are Cadence, Rory Teehan's personal fitness and performance monitoring agent.");
  parts.push("Your name reflects rhythm, pace, and timing — the measurable tempo of human performance.");
  parts.push("You track training, nutrition, body metrics, sleep, blood work, and anything that impacts personal performance.");
  parts.push("");
  parts.push("## CONTEXT STATUS");
  parts.push(`Pulse DB is LIVE. Loaded: ${soulCount} directives, ${idCount} identity entries, ${memCount} memories, ${logCount} session logs.`);
  parts.push(`Today's logged spend: $${todaySpend.toFixed(4)} (CC chat: $${ccSpend.toFixed(4)}) | Budget: $10.00/day | Remaining: $${(10 - todaySpend).toFixed(4)}`);
  parts.push(`Current model: ${modelKey} ($${modelInfo.inputPer1M}/$${modelInfo.outputPer1M} per M tokens)`);
  parts.push(`DO NOT claim DB is empty or context is missing. Everything below is live data.`);
  parts.push("");
  parts.push("## Architecture");
  parts.push("- You = Supabase Edge Function → Claude via Vercel AI Gateway");
  parts.push("- Interface = Cadence Command Center (cadence-cc), Next.js 15 on Vercel");
  parts.push("- Memory = Supabase pulse_* tables (persistent across sessions)");
  parts.push("- All API calls route through Vercel AI Gateway — that's where billing happens");
  parts.push("- Model is selected by Rory from the dashboard dropdown. You cannot change it yourself.");
  parts.push("");
  parts.push("## Model Pricing (KNOW THESE)");
  parts.push("| Model | Input | Output |");
  parts.push("|-------|-------|--------|");
  parts.push("| Haiku 4.5 | $1/M | $5/M |");
  parts.push("| Sonnet 4 | $3/M | $15/M |");
  parts.push("| Sonnet 4.5 | $3/M | $15/M |");
  parts.push("| Opus 4.6 | $15/M | $75/M |");
  parts.push("");
  parts.push("## Tools: create_task, update_task, save_memory, list_tasks, search_memories, check_cost");
  parts.push("Use proactively. Action item → create_task. Worth remembering → save_memory. Cost question → check_cost.");
  parts.push("");
  parts.push("## Tone: Direct, no fluff. Match Rory's energy.");
  parts.push("");
  if (soul.data?.length) {
    parts.push("## Soul Directives");
    soul.data.forEach((s)=>parts.push(`- [${s.category}] ${s.directive}`));
    parts.push("");
  }
  if (identity.data?.length) {
    parts.push("## Rory's Context");
    identity.data.forEach((i)=>parts.push(`- ${i.key}: ${i.value}`));
    parts.push("");
  }
  if (memories.data?.length) {
    parts.push("## Memories (top 10)");
    memories.data.forEach((m)=>parts.push(`- [${m.memory_type}] ${m.key}: ${m.content.slice(0, 200)}`));
    parts.push("");
  }
  if (sessionLogs.data?.length) {
    parts.push("## Recent Sessions");
    sessionLogs.data.forEach((l)=>parts.push(`- [${l.log_date}] ${l.summary.slice(0, 200)}`));
  }
  return parts.join("\n");
}
// ═══ MAIN HANDLER ═══
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const { message, session_id, model } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({
        error: "Message required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (message.length > 4000) {
      return new Response(JSON.stringify({
        error: "Message too long (max 4000 chars)"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Resolve model
    const modelKey = model && ALLOWED_MODELS[model] ? model : DEFAULT_MODEL;
    const modelInfo = ALLOWED_MODELS[modelKey];
    const sid = session_id || crypto.randomUUID();
    await supabase.from("chat_messages").insert({
      role: "user",
      content: message.trim(),
      session_id: sid
    });
    const { data: history } = await supabase.from("chat_messages").select("role, content").eq("session_id", sid).order("created_at", {
      ascending: true
    }).limit(20);
    const systemPrompt = await getCadenceContext(modelKey);
    const messages = (history || []).map((m)=>({
        role: m.role,
        content: m.content
      }));
    const endpoint = API_URL.endsWith("/v1/messages") ? API_URL : `${API_URL.replace(/\/$/, "")}/v1/messages`;
    let totalTokensIn = 0, totalTokensOut = 0;
    const textParts = []; // ACCUMULATE text across iterations
    let currentMessages = [
      ...messages
    ];
    let iterations = 0;
    while(iterations < 5){
      iterations++;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: modelInfo.id,
          max_tokens: 4096,
          system: systemPrompt,
          messages: currentMessages,
          tools
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("AI API error:", response.status, errText);
        return new Response(JSON.stringify({
          error: "AI service error",
          detail: errText.slice(0, 200)
        }), {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      const result = await response.json();
      totalTokensIn += result.usage?.input_tokens || 0;
      totalTokensOut += result.usage?.output_tokens || 0;
      const toolUseBlocks = (result.content || []).filter((b)=>b.type === "tool_use");
      const textBlocks = (result.content || []).filter((b)=>b.type === "text");
      // ACCUMULATE text from each iteration (fixes bug where tool-use loops lost earlier text)
      if (textBlocks.length > 0) {
        textParts.push(textBlocks.map((b)=>b.text).join("\n"));
      }
      if (toolUseBlocks.length === 0 || result.stop_reason === "end_turn") {
        break;
      }
      currentMessages.push({
        role: "assistant",
        content: result.content
      });
      const toolResults = [];
      for (const tb of toolUseBlocks){
        toolResults.push({
          type: "tool_result",
          tool_use_id: tb.id,
          content: await executeTool(tb.name, tb.input)
        });
      }
      currentMessages.push({
        role: "user",
        content: toolResults
      });
    }
    const finalText = textParts.length > 0 ? textParts.join("\n\n") : "I'm having trouble responding right now.";
    const { data: savedMsg } = await supabase.from("chat_messages").insert({
      role: "assistant",
      content: finalText,
      session_id: sid,
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
      model_used: modelKey
    }).select().single();
    const cost = (totalTokensIn * modelInfo.inputPer1M + totalTokensOut * modelInfo.outputPer1M) / 1_000_000;
    await supabase.from("pulse_cost_log").insert({
      session_date: new Date().toISOString().split("T")[0],
      model_used: modelKey,
      tokens_input: totalTokensIn,
      tokens_output: totalTokensOut,
      cost_usd: cost,
      task_type: "chat",
      source: "cc_chat",
      notes: `CC chat [${modelKey}]: ${message.trim().slice(0, 80)}`
    });
    return new Response(JSON.stringify({
      reply: finalText,
      session_id: sid,
      message_id: savedMsg?.id,
      tokens: {
        in: totalTokensIn,
        out: totalTokensOut
      },
      tool_calls: iterations > 1 ? iterations - 1 : 0,
      model_used: modelKey
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Connection": "keep-alive"
      }
    });
  } catch (err) {
    console.error("Chat function error:", err);
    return new Response(JSON.stringify({
      error: "Internal error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
