export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      breathing_sessions: {
        Row: {
          completed_at: string
          duration_seconds: number
          id: string
          local_date: string
          pattern: string
          ritual_slot: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_seconds: number
          id?: string
          local_date: string
          pattern: string
          ritual_slot?: string | null
          user_id?: string
        }
        Update: {
          completed_at?: string
          duration_seconds?: number
          id?: string
          local_date?: string
          pattern?: string
          ritual_slot?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breathing_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_goals: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          legacy_id: string | null
          linked_areas: string[]
          notes: string
          obstacles: string
          priority: string
          progress: number
          progress_mode: string
          status: string
          target_date: string
          target_on: string | null
          title: string
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          legacy_id?: string | null
          linked_areas?: string[]
          notes?: string
          obstacles?: string
          priority?: string
          progress?: number
          progress_mode?: string
          status?: string
          target_date?: string
          target_on?: string | null
          title: string
          updated_at?: string
          user_id?: string
          why?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          legacy_id?: string | null
          linked_areas?: string[]
          notes?: string
          obstacles?: string
          priority?: string
          progress?: number
          progress_mode?: string
          status?: string
          target_date?: string
          target_on?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          local_date: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          local_date: string
          user_id?: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          local_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_definitions: {
        Row: {
          active: boolean
          cadence: string
          category: string
          created_at: string
          detail: string
          duration_days: number
          goal: number | null
          id: string
          instructions: string
          metric: string
          objective: string
          sort_order: number
          target_days: number
          title: string
        }
        Insert: {
          active?: boolean
          cadence?: string
          category?: string
          created_at?: string
          detail?: string
          duration_days?: number
          goal?: number | null
          id: string
          instructions?: string
          metric?: string
          objective?: string
          sort_order?: number
          target_days?: number
          title: string
        }
        Update: {
          active?: boolean
          cadence?: string
          category?: string
          created_at?: string
          detail?: string
          duration_days?: number
          goal?: number | null
          id?: string
          instructions?: string
          metric?: string
          objective?: string
          sort_order?: number
          target_days?: number
          title?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          created_at: string
          energy: number
          id: string
          legacy_id: string | null
          local_date: string
          mood: string
          motivation: number
          needs: string[]
          note: string | null
          sleep: number
          stress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy: number
          id?: string
          legacy_id?: string | null
          local_date: string
          mood: string
          motivation: number
          needs?: string[]
          note?: string | null
          sleep: number
          stress: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          energy?: number
          id?: string
          legacy_id?: string | null
          local_date?: string
          mood?: string
          motivation?: number
          needs?: string[]
          note?: string | null
          sleep?: number
          stress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          check_in_id: string | null
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          recommendation_id: string | null
          role: string
          text: string
          user_id: string
        }
        Insert: {
          check_in_id?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          recommendation_id?: string | null
          role: string
          text: string
          user_id?: string
        }
        Update: {
          check_in_id?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          recommendation_id?: string | null
          role?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_definitions: {
        Row: {
          active: boolean
          area: string
          created_at: string
          days: number
          hypothesis: string
          id: string
          measure: string
          measures: string[]
          reason: string
          sort_order: number
          target_behaviour: string
          title: string
        }
        Insert: {
          active?: boolean
          area?: string
          created_at?: string
          days: number
          hypothesis?: string
          id: string
          measure?: string
          measures?: string[]
          reason?: string
          sort_order?: number
          target_behaviour?: string
          title: string
        }
        Update: {
          active?: boolean
          area?: string
          created_at?: string
          days?: number
          hypothesis?: string
          id?: string
          measure?: string
          measures?: string[]
          reason?: string
          sort_order?: number
          target_behaviour?: string
          title?: string
        }
        Relationships: []
      }
      experiment_logs: {
        Row: {
          created_at: string
          done: boolean
          id: string
          local_date: string
          measurements: Json
          note: string | null
          user_experiment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          local_date: string
          measurements?: Json
          note?: string | null
          user_experiment_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          local_date?: string
          measurements?: Json
          note?: string | null
          user_experiment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_logs_user_experiment_id_fkey"
            columns: ["user_experiment_id"]
            isOneToOne: false
            referencedRelation: "user_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_actions: {
        Row: {
          created_at: string
          done_at: string | null
          goal_id: string
          id: string
          milestone_id: string | null
          source: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          goal_id: string
          id?: string
          milestone_id?: string | null
          source?: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          goal_id?: string
          id?: string
          milestone_id?: string | null
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_actions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "bucket_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_actions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "goal_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          created_at: string
          done_at: string | null
          goal_id: string
          id: string
          sort_order: number
          source: string
          target_on: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          goal_id: string
          id?: string
          sort_order?: number
          source?: string
          target_on?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          goal_id?: string
          id?: string
          sort_order?: number
          source?: string
          target_on?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "bucket_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_progress_events: {
        Row: {
          created_at: string
          detail: string
          goal_id: string
          id: string
          kind: string
          progress: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string
          goal_id: string
          id?: string
          kind: string
          progress?: number | null
          user_id?: string
        }
        Update: {
          created_at?: string
          detail?: string
          goal_id?: string
          id?: string
          kind?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_events_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "bucket_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_entries: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          local_date: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          local_date: string
          user_id?: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          local_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hydration_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          local_date: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          local_date?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          local_date?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_snapshots: {
        Row: {
          created_at: string
          id: string
          kind: string
          local_date: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          local_date: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          local_date?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          detail: Json
          finished_at: string | null
          id: string
          job: string
          started_at: string
          status: string
        }
        Insert: {
          detail?: Json
          finished_at?: string | null
          id?: string
          job: string
          started_at?: string
          status?: string
        }
        Update: {
          detail?: Json
          finished_at?: string | null
          id?: string
          job?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      legacy_imports: {
        Row: {
          completed_at: string | null
          counts: Json
          error: string | null
          fingerprint: string
          id: string
          source_key: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          counts?: Json
          error?: string | null
          fingerprint: string
          id?: string
          source_key: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          counts?: Json
          error?: string | null
          fingerprint?: string
          id?: string
          source_key?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_imports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_grants: {
        Row: {
          expires_at: string | null
          granted_at: string
          note: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          note?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          note?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_completions: {
        Row: {
          created_at: string
          id: string
          local_date: string
          mission_id: string
          step: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          mission_id: string
          step?: number | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          local_date?: string
          mission_id?: string
          step?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_definitions: {
        Row: {
          active: boolean
          area: string
          completion_criteria: string
          created_at: string
          days_per_step: number
          detail: string
          id: string
          metric: string
          objective: string
          sort_order: number
          step_goals: number[]
          step_targets: string[]
          title: string
          total_steps: number
        }
        Insert: {
          active?: boolean
          area: string
          completion_criteria?: string
          created_at?: string
          days_per_step?: number
          detail?: string
          id: string
          metric?: string
          objective?: string
          sort_order?: number
          step_goals?: number[]
          step_targets?: string[]
          title: string
          total_steps?: number
        }
        Update: {
          active?: boolean
          area?: string
          completion_criteria?: string
          created_at?: string
          days_per_step?: number
          detail?: string
          id?: string
          metric?: string
          objective?: string
          sort_order?: number
          step_goals?: number[]
          step_targets?: string[]
          title?: string
          total_steps?: number
        }
        Relationships: []
      }
      mission_progress_events: {
        Row: {
          created_at: string
          from_step: number | null
          id: string
          mission_id: string
          reason: string
          to_step: number
          user_id: string
        }
        Insert: {
          created_at?: string
          from_step?: number | null
          id?: string
          mission_id: string
          reason?: string
          to_step: number
          user_id?: string
        }
        Update: {
          created_at?: string
          from_step?: number | null
          id?: string
          mission_id?: string
          reason?: string
          to_step?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_progress_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_progress_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      period_check_ins: {
        Row: {
          answers: Json
          created_at: string
          id: string
          local_date: string
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          local_date: string
          period: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          local_date?: string
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "period_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_achievements: {
        Row: {
          achieved_on: string
          category: string
          created_at: string
          goal_id: string | null
          id: string
          note: string
          title: string
          user_id: string
        }
        Insert: {
          achieved_on: string
          category?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          note?: string
          title: string
          user_id?: string
        }
        Update: {
          achieved_on?: string
          category?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          note?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "bucket_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_time_entries: {
        Row: {
          category: string
          created_at: string
          id: string
          local_date: string
          minutes: number
          note: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          local_date: string
          minutes: number
          note?: string | null
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          local_date?: string
          minutes?: number
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarded_at: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarded_at?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded_at?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      protein_entries: {
        Row: {
          created_at: string
          grams: number
          id: string
          label: string | null
          local_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grams: number
          id?: string
          label?: string | null
          local_date: string
          user_id?: string
        }
        Update: {
          created_at?: string
          grams?: number
          id?: string
          label?: string | null
          local_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protein_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          action: string
          area: string | null
          benefit: string | null
          challenge_id: string | null
          check_in_id: string | null
          completed_at: string | null
          created_at: string
          difficulty: string | null
          est_minutes: number | null
          headline: string
          id: string
          kind: string
          level: string
          local_date: string | null
          mission_id: string | null
          postponed_until: string | null
          product: string | null
          reason: string
          rec_key: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: string
          area?: string | null
          benefit?: string | null
          challenge_id?: string | null
          check_in_id?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string | null
          est_minutes?: number | null
          headline?: string
          id?: string
          kind: string
          level?: string
          local_date?: string | null
          mission_id?: string | null
          postponed_until?: string | null
          product?: string | null
          reason?: string
          rec_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          action?: string
          area?: string | null
          benefit?: string | null
          challenge_id?: string | null
          check_in_id?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string | null
          est_minutes?: number | null
          headline?: string
          id?: string
          kind?: string
          level?: string
          local_date?: string | null
          mission_id?: string | null
          postponed_until?: string | null
          product?: string | null
          reason?: string
          rec_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_activity_completions: {
        Row: {
          activity_id: string
          completed_at: string
          duration_seconds: number | null
          id: string
          local_date: string
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          local_date: string
          user_id?: string
        }
        Update: {
          activity_id?: string
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          local_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "ritual_activity_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_activity_definitions: {
        Row: {
          detail: string
          id: string
          kind: string
          minutes: number
          optional: boolean
          personal_category: string | null
          ritual_id: string
          sort_order: number
          title: string
        }
        Insert: {
          detail?: string
          id: string
          kind: string
          minutes?: number
          optional?: boolean
          personal_category?: string | null
          ritual_id: string
          sort_order?: number
          title: string
        }
        Update: {
          detail?: string
          id?: string
          kind?: string
          minutes?: number
          optional?: boolean
          personal_category?: string | null
          ritual_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_activity_definitions_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "ritual_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_completions: {
        Row: {
          closing_message: string | null
          completed_at: string
          created_at: string
          id: string
          local_date: string
          ritual_id: string
          user_id: string
        }
        Insert: {
          closing_message?: string | null
          completed_at?: string
          created_at?: string
          id?: string
          local_date: string
          ritual_id: string
          user_id?: string
        }
        Update: {
          closing_message?: string | null
          completed_at?: string
          created_at?: string
          id?: string
          local_date?: string
          ritual_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_completions_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "ritual_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_definitions: {
        Row: {
          created_at: string
          detail: string
          id: string
          slot: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id: string
          slot: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          slot?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          environment: string
          id: string
          received_at: string
          type: string
        }
        Insert: {
          environment: string
          id: string
          received_at?: string
          type: string
        }
        Update: {
          environment?: string
          id?: string
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender: string
          thread_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender?: string
          thread_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          admin_unread: boolean
          category: string
          created_at: string
          id: string
          member_unread: boolean
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_unread?: boolean
          category?: string
          created_at?: string
          id?: string
          member_unread?: boolean
          status?: string
          subject: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          admin_unread?: boolean
          category?: string
          created_at?: string
          id?: string
          member_unread?: boolean
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_days: {
        Row: {
          created_at: string
          local_date: string
          user_challenge_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          local_date: string
          user_challenge_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          local_date?: string
          user_challenge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_days_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          created_at: string
          custom_detail: string | null
          custom_title: string | null
          ends_on: string
          id: string
          started_on: string
          status: string
          target_days: number
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string
          custom_detail?: string | null
          custom_title?: string | null
          ends_on: string
          id?: string
          started_on: string
          status?: string
          target_days?: number
          user_id?: string
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string
          custom_detail?: string | null
          custom_title?: string | null
          ends_on?: string
          id?: string
          started_on?: string
          status?: string
          target_days?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experiments: {
        Row: {
          baseline: Json
          created_at: string
          custom_hypothesis: string | null
          custom_title: string | null
          days_done: number
          duration_days: number
          end_date: string | null
          evaluation: Json
          experiment_id: string | null
          id: string
          measure: string
          paused_at: string | null
          reason: string
          result_summary: string | null
          start_date: string
          status: string
          target_behaviour: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline?: Json
          created_at?: string
          custom_hypothesis?: string | null
          custom_title?: string | null
          days_done?: number
          duration_days?: number
          end_date?: string | null
          evaluation?: Json
          experiment_id?: string | null
          id?: string
          measure?: string
          paused_at?: string | null
          reason?: string
          result_summary?: string | null
          start_date: string
          status?: string
          target_behaviour?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          baseline?: Json
          created_at?: string
          custom_hypothesis?: string | null
          custom_title?: string | null
          days_done?: number
          duration_days?: number
          end_date?: string | null
          evaluation?: Json
          experiment_id?: string | null
          id?: string
          measure?: string
          paused_at?: string | null
          reason?: string
          result_summary?: string | null
          start_date?: string
          status?: string
          target_behaviour?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experiments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experiments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mission_progress: {
        Row: {
          completed_at: string | null
          mission_id: string
          started_at: string
          status: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          mission_id: string
          started_at?: string
          status?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          mission_id?: string
          started_at?: string
          status?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mission_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wellness_preferences: {
        Row: {
          created_at: string
          daily_messages: boolean
          hidden_ritual_activities: string[]
          personal_time_goal_min: number | null
          personal_time_goal_period: string
          protein_target_g: number | null
          protein_target_source: string
          reminders: Json
          ritual_minutes: Json
          updated_at: string
          user_id: string
          water_target_ml: number | null
        }
        Insert: {
          created_at?: string
          daily_messages?: boolean
          hidden_ritual_activities?: string[]
          personal_time_goal_min?: number | null
          personal_time_goal_period?: string
          protein_target_g?: number | null
          protein_target_source?: string
          reminders?: Json
          ritual_minutes?: Json
          updated_at?: string
          user_id?: string
          water_target_ml?: number | null
        }
        Update: {
          created_at?: string
          daily_messages?: boolean
          hidden_ritual_activities?: string[]
          personal_time_goal_min?: number | null
          personal_time_goal_period?: string
          protein_target_g?: number | null
          protein_target_source?: string
          reminders?: Json
          ritual_minutes?: Json
          updated_at?: string
          user_id?: string
          water_target_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_profiles: {
        Row: {
          activity_level: string
          age: string
          children: string
          commute: string
          created_at: string
          entertainment: string
          family_responsibilities: string
          fitness_level: string
          free_time: string
          gender: string
          hobbies: string
          interests: string
          limitations: string
          mood: string
          motivation: string
          name: string
          nutrition_consistency: string
          nutrition_goals: string
          nutrition_habits: string
          nutrition_preferences: string
          nutrition_restrictions: string
          occupation: string
          outdoor: string
          pain: string
          personal_goals: string
          personal_time: string
          physical_energy: string
          reading: string
          relationship: string
          responsibilities: string
          sleep_routine: string
          social_connection: string
          stress: string
          training_experience: string
          typical_schedule: string
          updated_at: string
          user_id: string
          working_hours: string
        }
        Insert: {
          activity_level?: string
          age?: string
          children?: string
          commute?: string
          created_at?: string
          entertainment?: string
          family_responsibilities?: string
          fitness_level?: string
          free_time?: string
          gender?: string
          hobbies?: string
          interests?: string
          limitations?: string
          mood?: string
          motivation?: string
          name?: string
          nutrition_consistency?: string
          nutrition_goals?: string
          nutrition_habits?: string
          nutrition_preferences?: string
          nutrition_restrictions?: string
          occupation?: string
          outdoor?: string
          pain?: string
          personal_goals?: string
          personal_time?: string
          physical_energy?: string
          reading?: string
          relationship?: string
          responsibilities?: string
          sleep_routine?: string
          social_connection?: string
          stress?: string
          training_experience?: string
          typical_schedule?: string
          updated_at?: string
          user_id?: string
          working_hours?: string
        }
        Update: {
          activity_level?: string
          age?: string
          children?: string
          commute?: string
          created_at?: string
          entertainment?: string
          family_responsibilities?: string
          fitness_level?: string
          free_time?: string
          gender?: string
          hobbies?: string
          interests?: string
          limitations?: string
          mood?: string
          motivation?: string
          name?: string
          nutrition_consistency?: string
          nutrition_goals?: string
          nutrition_habits?: string
          nutrition_preferences?: string
          nutrition_restrictions?: string
          occupation?: string
          outdoor?: string
          pain?: string
          personal_goals?: string
          personal_time?: string
          physical_energy?: string
          reading?: string
          relationship?: string
          responsibilities?: string
          sleep_routine?: string
          social_connection?: string
          stress?: string
          training_experience?: string
          typical_schedule?: string
          updated_at?: string
          user_id?: string
          working_hours?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_reviews: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          reflection: string
          summary: string
          trends: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          reflection?: string
          summary?: string
          trends?: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          reflection?: string
          summary?: string
          trends?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_mission_step: {
        Args: { _delta: number; _mission_id: string; _reason: string }
        Returns: number
      }
      admin_report: { Args: { _from: string; _to: string }; Returns: Json }
      credit_linked_progress: {
        Args: { _date: string; _user: string }
        Returns: undefined
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
