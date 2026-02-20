


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."pulse_get_pending_tasks"() RETURNS TABLE("id" "uuid", "task" "text", "description" "text", "category" "text", "priority" integer)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT id, task, description, category, priority
  FROM pulse_heartbeat
  WHERE status = 'pending'
    AND (scheduled_for IS NULL OR scheduled_for <= NOW())
    AND retry_count < max_retries
  ORDER BY priority ASC, created_at ASC;
$$;


ALTER FUNCTION "public"."pulse_get_pending_tasks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pulse_recall"("search_tags" "text"[]) RETURNS TABLE("key" "text", "content" "text", "memory_type" "text", "importance" integer)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT key, content, memory_type, importance
  FROM pulse_memory
  WHERE tags && search_tags
  ORDER BY importance ASC, updated_at DESC
  LIMIT 10;
$$;


ALTER FUNCTION "public"."pulse_recall"("search_tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pulse_recall_keyword"("search_term" "text") RETURNS TABLE("key" "text", "content" "text", "tags" "text"[], "memory_type" "text")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT key, content, tags, memory_type
  FROM pulse_memory
  WHERE content ILIKE '%' || search_term || '%'
     OR key ILIKE '%' || search_term || '%'
  ORDER BY importance ASC, updated_at DESC
  LIMIT 10;
$$;


ALTER FUNCTION "public"."pulse_recall_keyword"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pulse_update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."pulse_update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."body_metrics" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "time_measured" time without time zone,
    "weight_lbs" numeric(6,2),
    "body_fat_percentage" numeric(5,2),
    "resting_heart_rate" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."body_metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."body_metrics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."body_metrics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."body_metrics_id_seq" OWNED BY "public"."body_metrics"."id";



CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tokens_in" integer,
    "tokens_out" integer,
    "model_used" "text",
    CONSTRAINT "chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_summary" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "total_exercise_minutes" integer,
    "total_calories_burned" integer,
    "total_calories_consumed" numeric(10,2),
    "total_protein_g" numeric(8,2),
    "total_carbs_g" numeric(8,2),
    "total_net_carbs_g" numeric(8,2),
    "total_fat_g" numeric(8,2),
    "total_fiber_g" numeric(8,2),
    "sleep_duration_hours" numeric(4,2),
    "sleep_quality_rating" integer,
    "weight_lbs" numeric(6,2),
    "workout_quote" "text",
    "workout_quote_author" character varying(100),
    "energy_level" character varying(20),
    "inflammation_notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."daily_summary" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."daily_summary_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."daily_summary_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."daily_summary_id_seq" OWNED BY "public"."daily_summary"."id";



CREATE TABLE IF NOT EXISTS "public"."exercise_movements" (
    "id" bigint NOT NULL,
    "exercise_id" bigint NOT NULL,
    "movement_type" character varying(100),
    "sets" integer,
    "reps" integer,
    "weight_lbs" numeric(8,2),
    "duration_seconds" integer,
    "rest_seconds" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."exercise_movements" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."exercise_movements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."exercise_movements_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."exercise_movements_id_seq" OWNED BY "public"."exercise_movements"."id";



CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "day_of_week" character varying(10),
    "week_number" integer,
    "workout_number" integer,
    "exercise_type" character varying(100),
    "duration_minutes" integer,
    "intensity_level" character varying(20),
    "description" "text",
    "performance_notes" "text",
    "perceived_exertion" integer,
    "distance_miles" numeric(6,3),
    "elevation_gain_ft" integer,
    "calories_burned" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."exercises_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."exercises_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."exercises_id_seq" OWNED BY "public"."exercises"."id";



CREATE TABLE IF NOT EXISTS "public"."instagram_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "training_day" integer,
    "caption" "text",
    "quote" "text",
    "quote_author" "text",
    "workout_summary" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "posted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instagram_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'posted'::"text"])))
);


ALTER TABLE "public"."instagram_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nutrition_meals" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "time_logged" time without time zone,
    "meal_type" character varying(20),
    "description" "text",
    "source" character varying(50),
    "is_wife_plan" boolean DEFAULT false,
    "calories" numeric(8,2),
    "protein_g" numeric(8,2),
    "carbs_g" numeric(8,2),
    "net_carbs_g" numeric(8,2),
    "fat_g" numeric(8,2),
    "fiber_g" numeric(8,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."nutrition_meals" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."nutrition_meals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."nutrition_meals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."nutrition_meals_id_seq" OWNED BY "public"."nutrition_meals"."id";



CREATE TABLE IF NOT EXISTS "public"."performance_correlations" (
    "id" bigint NOT NULL,
    "analysis_date" "date" NOT NULL,
    "metric_1" character varying(50),
    "metric_2" character varying(50),
    "correlation_coefficient" numeric(5,3),
    "sample_size" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."performance_correlations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."performance_correlations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."performance_correlations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."performance_correlations_id_seq" OWNED BY "public"."performance_correlations"."id";



CREATE TABLE IF NOT EXISTS "public"."pulse_cost_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "model_used" "text" NOT NULL,
    "tokens_input" integer,
    "tokens_output" integer,
    "cost_usd" numeric(10,4),
    "task_type" "text",
    "value_generated" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "source" "text" DEFAULT 'unknown'::"text"
);


ALTER TABLE "public"."pulse_cost_log" OWNER TO "postgres";


COMMENT ON COLUMN "public"."pulse_cost_log"."source" IS 'Where the cost originated: cc_chat, telegram, cron, openclaw_docker, manual';



CREATE TABLE IF NOT EXISTS "public"."pulse_heartbeat" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "priority" integer DEFAULT 5 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "recurrence" "text",
    "max_retries" integer DEFAULT 3,
    "retry_count" integer DEFAULT 0,
    "created_by_session" "text",
    "result" "text",
    "error" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pulse_heartbeat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pulse_identity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pulse_identity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pulse_memory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "content" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "memory_type" "text" DEFAULT 'knowledge'::"text" NOT NULL,
    "importance" integer DEFAULT 5 NOT NULL,
    "source_session" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pulse_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pulse_session_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "log_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "session_id" "text",
    "summary" "text" NOT NULL,
    "topics" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "decisions_made" "text"[] DEFAULT '{}'::"text"[],
    "tasks_created" "text"[] DEFAULT '{}'::"text"[],
    "tokens_estimated" integer,
    "tokens_input" integer,
    "tokens_output" integer,
    "model_used" "text",
    "cost_usd" numeric(10,4),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pulse_session_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pulse_soul" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "directive" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "priority" integer DEFAULT 5 NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pulse_soul" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "quote" "text" NOT NULL,
    "author" "text" NOT NULL,
    "source" "text" DEFAULT 'manual'::"text",
    "used_for_instagram" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sleep" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "sleep_start" timestamp with time zone,
    "sleep_end" timestamp with time zone,
    "duration_hours" numeric(4,2),
    "quality_rating" integer,
    "sleep_type" character varying(20),
    "interruptions" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."sleep" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sleep_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sleep_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sleep_id_seq" OWNED BY "public"."sleep"."id";



CREATE TABLE IF NOT EXISTS "public"."supplements" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "time_taken" time without time zone,
    "supplement_name" character varying(100) NOT NULL,
    "brand" character varying(100),
    "dosage" character varying(50),
    "form" character varying(30),
    "caffeine_mg" numeric(8,2),
    "beta_alanine_mg" numeric(8,2),
    "other_ingredients" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."supplements" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."supplements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."supplements_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."supplements_id_seq" OWNED BY "public"."supplements"."id";



CREATE TABLE IF NOT EXISTS "public"."training_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_number" integer NOT NULL,
    "date" "date" NOT NULL,
    "phase" "text" NOT NULL,
    "week" integer NOT NULL,
    "focus" "text" NOT NULL,
    "location" "text" DEFAULT 'Gym'::"text" NOT NULL,
    "workout_name" "text" NOT NULL,
    "protocol" "text" NOT NULL,
    "notes" "text",
    "completed" boolean DEFAULT false,
    "quote" "text",
    "quote_author" "text",
    "instagram_posted" boolean DEFAULT false,
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."training_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wife_meal_plans" (
    "id" bigint NOT NULL,
    "week_start_date" "date" NOT NULL,
    "meal_day" character varying(10),
    "meal_type" character varying(20),
    "description" "text",
    "planned_protein_g" numeric(8,2),
    "planned_carbs_g" numeric(8,2),
    "planned_net_carbs_g" numeric(8,2),
    "planned_fat_g" numeric(8,2),
    "planned_calories" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."wife_meal_plans" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."wife_meal_plans_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."wife_meal_plans_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."wife_meal_plans_id_seq" OWNED BY "public"."wife_meal_plans"."id";



ALTER TABLE ONLY "public"."body_metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."body_metrics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."daily_summary" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."daily_summary_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."exercise_movements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."exercise_movements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."exercises" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."exercises_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."nutrition_meals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."nutrition_meals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."performance_correlations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_correlations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sleep" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sleep_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."supplements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."supplements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."wife_meal_plans" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."wife_meal_plans_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."body_metrics"
    ADD CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_summary"
    ADD CONSTRAINT "daily_summary_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_summary"
    ADD CONSTRAINT "daily_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_movements"
    ADD CONSTRAINT "exercise_movements_exercise_id_movement_type_sets_reps_key" UNIQUE ("exercise_id", "movement_type", "sets", "reps");



ALTER TABLE ONLY "public"."exercise_movements"
    ADD CONSTRAINT "exercise_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_date_workout_number_key" UNIQUE ("date", "workout_number");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_posts"
    ADD CONSTRAINT "instagram_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrition_meals"
    ADD CONSTRAINT "nutrition_meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_correlations"
    ADD CONSTRAINT "performance_correlations_analysis_date_metric_1_metric_2_key" UNIQUE ("analysis_date", "metric_1", "metric_2");



ALTER TABLE ONLY "public"."performance_correlations"
    ADD CONSTRAINT "performance_correlations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulse_cost_log"
    ADD CONSTRAINT "pulse_cost_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulse_heartbeat"
    ADD CONSTRAINT "pulse_heartbeat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulse_identity"
    ADD CONSTRAINT "pulse_identity_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."pulse_identity"
    ADD CONSTRAINT "pulse_identity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulse_memory"
    ADD CONSTRAINT "pulse_memory_key_unique" UNIQUE ("key");



ALTER TABLE ONLY "public"."pulse_memory"
    ADD CONSTRAINT "pulse_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulse_session_logs"
    ADD CONSTRAINT "pulse_session_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulse_soul"
    ADD CONSTRAINT "pulse_soul_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sleep"
    ADD CONSTRAINT "sleep_date_sleep_type_key" UNIQUE ("date", "sleep_type");



ALTER TABLE ONLY "public"."sleep"
    ADD CONSTRAINT "sleep_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplements"
    ADD CONSTRAINT "supplements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_log"
    ADD CONSTRAINT "training_log_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."training_log"
    ADD CONSTRAINT "training_log_day_number_key" UNIQUE ("day_number");



ALTER TABLE ONLY "public"."training_log"
    ADD CONSTRAINT "training_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wife_meal_plans"
    ADD CONSTRAINT "wife_meal_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wife_meal_plans"
    ADD CONSTRAINT "wife_meal_plans_week_start_date_meal_day_meal_type_key" UNIQUE ("week_start_date", "meal_day", "meal_type");



CREATE INDEX "idx_body_metrics_date" ON "public"."body_metrics" USING "btree" ("date");



CREATE INDEX "idx_chat_messages_created" ON "public"."chat_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_messages_session" ON "public"."chat_messages" USING "btree" ("session_id", "created_at");



CREATE INDEX "idx_daily_summary_date" ON "public"."daily_summary" USING "btree" ("date");



CREATE INDEX "idx_exercises_date" ON "public"."exercises" USING "btree" ("date");



CREATE INDEX "idx_exercises_week" ON "public"."exercises" USING "btree" ("week_number");



CREATE INDEX "idx_instagram_date" ON "public"."instagram_posts" USING "btree" ("date" DESC);



CREATE INDEX "idx_instagram_status" ON "public"."instagram_posts" USING "btree" ("status");



CREATE INDEX "idx_nutrition_date" ON "public"."nutrition_meals" USING "btree" ("date");



CREATE INDEX "idx_nutrition_meal_type" ON "public"."nutrition_meals" USING "btree" ("meal_type");



CREATE INDEX "idx_pulse_cost_log_date" ON "public"."pulse_cost_log" USING "btree" ("session_date" DESC);



CREATE INDEX "idx_pulse_cost_log_model" ON "public"."pulse_cost_log" USING "btree" ("model_used");



CREATE INDEX "idx_pulse_heartbeat_priority" ON "public"."pulse_heartbeat" USING "btree" ("priority");



CREATE INDEX "idx_pulse_heartbeat_scheduled" ON "public"."pulse_heartbeat" USING "btree" ("scheduled_for") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_pulse_heartbeat_status" ON "public"."pulse_heartbeat" USING "btree" ("status");



CREATE INDEX "idx_pulse_logs_date" ON "public"."pulse_session_logs" USING "btree" ("log_date" DESC);



CREATE INDEX "idx_pulse_logs_topics" ON "public"."pulse_session_logs" USING "gin" ("topics");



CREATE INDEX "idx_pulse_memory_importance" ON "public"."pulse_memory" USING "btree" ("importance");



CREATE INDEX "idx_pulse_memory_tags" ON "public"."pulse_memory" USING "gin" ("tags");



CREATE INDEX "idx_pulse_memory_type" ON "public"."pulse_memory" USING "btree" ("memory_type");



CREATE INDEX "idx_quotes_date" ON "public"."quotes" USING "btree" ("date" DESC);



CREATE INDEX "idx_sleep_date" ON "public"."sleep" USING "btree" ("date");



CREATE INDEX "idx_supplements_date" ON "public"."supplements" USING "btree" ("date");



CREATE INDEX "idx_training_completed" ON "public"."training_log" USING "btree" ("completed");



CREATE INDEX "idx_training_date" ON "public"."training_log" USING "btree" ("date" DESC);



CREATE INDEX "idx_training_phase" ON "public"."training_log" USING "btree" ("phase");



CREATE INDEX "idx_wife_meals_week" ON "public"."wife_meal_plans" USING "btree" ("week_start_date");



CREATE OR REPLACE TRIGGER "pulse_heartbeat_updated" BEFORE UPDATE ON "public"."pulse_heartbeat" FOR EACH ROW EXECUTE FUNCTION "public"."pulse_update_timestamp"();



CREATE OR REPLACE TRIGGER "pulse_identity_updated" BEFORE UPDATE ON "public"."pulse_identity" FOR EACH ROW EXECUTE FUNCTION "public"."pulse_update_timestamp"();



CREATE OR REPLACE TRIGGER "pulse_memory_updated" BEFORE UPDATE ON "public"."pulse_memory" FOR EACH ROW EXECUTE FUNCTION "public"."pulse_update_timestamp"();



CREATE OR REPLACE TRIGGER "pulse_soul_updated" BEFORE UPDATE ON "public"."pulse_soul" FOR EACH ROW EXECUTE FUNCTION "public"."pulse_update_timestamp"();



CREATE OR REPLACE TRIGGER "training_log_updated_at" BEFORE UPDATE ON "public"."training_log" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."exercise_movements"
    ADD CONSTRAINT "exercise_movements_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_posts"
    ADD CONSTRAINT "instagram_posts_training_day_fkey" FOREIGN KEY ("training_day") REFERENCES "public"."training_log"("day_number");



CREATE POLICY "Service role full access" ON "public"."instagram_posts" USING (true);



CREATE POLICY "Service role full access" ON "public"."quotes" USING (true);



CREATE POLICY "Service role full access" ON "public"."training_log" USING (true);



CREATE POLICY "anon_read" ON "public"."daily_summary" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read" ON "public"."exercise_movements" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read" ON "public"."instagram_posts" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read" ON "public"."performance_correlations" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read" ON "public"."sleep" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read" ON "public"."supplements" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read" ON "public"."wife_meal_plans" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_body_metrics" ON "public"."body_metrics" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_chat" ON "public"."chat_messages" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_exercises" ON "public"."exercises" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_nutrition_meals" ON "public"."nutrition_meals" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_pulse_cost_log" ON "public"."pulse_cost_log" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_pulse_heartbeat" ON "public"."pulse_heartbeat" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_pulse_identity" ON "public"."pulse_identity" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_pulse_memory" ON "public"."pulse_memory" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_pulse_session_logs" ON "public"."pulse_session_logs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_pulse_soul" ON "public"."pulse_soul" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_quotes" ON "public"."quotes" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_read_training_log" ON "public"."training_log" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."body_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nutrition_meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_correlations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulse_cost_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulse_heartbeat" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulse_identity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulse_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulse_session_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulse_soul" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sleep" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wife_meal_plans" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."pulse_get_pending_tasks"() TO "anon";
GRANT ALL ON FUNCTION "public"."pulse_get_pending_tasks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pulse_get_pending_tasks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pulse_recall"("search_tags" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."pulse_recall"("search_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pulse_recall"("search_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."pulse_recall_keyword"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pulse_recall_keyword"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pulse_recall_keyword"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pulse_update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."pulse_update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pulse_update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."body_metrics" TO "anon";
GRANT ALL ON TABLE "public"."body_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."body_metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."body_metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."body_metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."body_metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."daily_summary" TO "anon";
GRANT ALL ON TABLE "public"."daily_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_summary" TO "service_role";



GRANT ALL ON SEQUENCE "public"."daily_summary_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."daily_summary_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."daily_summary_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_movements" TO "anon";
GRANT ALL ON TABLE "public"."exercise_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exercise_movements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exercise_movements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exercise_movements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exercises_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exercises_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exercises_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_posts" TO "anon";
GRANT ALL ON TABLE "public"."instagram_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_posts" TO "service_role";



GRANT ALL ON TABLE "public"."nutrition_meals" TO "anon";
GRANT ALL ON TABLE "public"."nutrition_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrition_meals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nutrition_meals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nutrition_meals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nutrition_meals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."performance_correlations" TO "anon";
GRANT ALL ON TABLE "public"."performance_correlations" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_correlations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."performance_correlations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."performance_correlations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."performance_correlations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pulse_cost_log" TO "anon";
GRANT ALL ON TABLE "public"."pulse_cost_log" TO "authenticated";
GRANT ALL ON TABLE "public"."pulse_cost_log" TO "service_role";



GRANT ALL ON TABLE "public"."pulse_heartbeat" TO "anon";
GRANT ALL ON TABLE "public"."pulse_heartbeat" TO "authenticated";
GRANT ALL ON TABLE "public"."pulse_heartbeat" TO "service_role";



GRANT ALL ON TABLE "public"."pulse_identity" TO "anon";
GRANT ALL ON TABLE "public"."pulse_identity" TO "authenticated";
GRANT ALL ON TABLE "public"."pulse_identity" TO "service_role";



GRANT ALL ON TABLE "public"."pulse_memory" TO "anon";
GRANT ALL ON TABLE "public"."pulse_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."pulse_memory" TO "service_role";



GRANT ALL ON TABLE "public"."pulse_session_logs" TO "anon";
GRANT ALL ON TABLE "public"."pulse_session_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pulse_session_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pulse_soul" TO "anon";
GRANT ALL ON TABLE "public"."pulse_soul" TO "authenticated";
GRANT ALL ON TABLE "public"."pulse_soul" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."sleep" TO "anon";
GRANT ALL ON TABLE "public"."sleep" TO "authenticated";
GRANT ALL ON TABLE "public"."sleep" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sleep_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sleep_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sleep_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."supplements" TO "anon";
GRANT ALL ON TABLE "public"."supplements" TO "authenticated";
GRANT ALL ON TABLE "public"."supplements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."supplements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."supplements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."supplements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."training_log" TO "anon";
GRANT ALL ON TABLE "public"."training_log" TO "authenticated";
GRANT ALL ON TABLE "public"."training_log" TO "service_role";



GRANT ALL ON TABLE "public"."wife_meal_plans" TO "anon";
GRANT ALL ON TABLE "public"."wife_meal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."wife_meal_plans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."wife_meal_plans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."wife_meal_plans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."wife_meal_plans_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































