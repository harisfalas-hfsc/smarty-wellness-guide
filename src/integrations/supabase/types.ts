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
      bucket_goals: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          id: string
          legacy_id: string | null
          progress: number
          target_date: string
          title: string
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          progress?: number
          target_date?: string
          title: string
          updated_at?: string
          user_id?: string
          why?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          progress?: number
          target_date?: string
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
          created_at: string
          detail: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          detail?: string
          id: string
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          detail?: string
          id?: string
          sort_order?: number
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
          created_at: string
          days: number
          hypothesis: string
          id: string
          measures: string[]
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days: number
          hypothesis?: string
          id: string
          measures?: string[]
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days?: number
          hypothesis?: string
          id?: string
          measures?: string[]
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      experiment_logs: {
        Row: {
          created_at: string
          id: string
          local_date: string
          measurements: Json
          note: string | null
          user_experiment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          measurements?: Json
          note?: string | null
          user_experiment_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          detail: string
          id: string
          sort_order: number
          step_targets: string[]
          title: string
          total_steps: number
        }
        Insert: {
          active?: boolean
          area: string
          created_at?: string
          detail?: string
          id: string
          sort_order?: number
          step_targets?: string[]
          title: string
          total_steps?: number
        }
        Update: {
          active?: boolean
          area?: string
          created_at?: string
          detail?: string
          id?: string
          sort_order?: number
          step_targets?: string[]
          title?: string
          total_steps?: number
        }
        Relationships: []
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
      recommendations: {
        Row: {
          action: string
          area: string | null
          challenge_id: string | null
          check_in_id: string | null
          completed_at: string | null
          created_at: string
          headline: string
          id: string
          kind: string
          level: string
          local_date: string | null
          mission_id: string | null
          product: string | null
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          action?: string
          area?: string | null
          challenge_id?: string | null
          check_in_id?: string | null
          completed_at?: string | null
          created_at?: string
          headline?: string
          id?: string
          kind: string
          level?: string
          local_date?: string | null
          mission_id?: string | null
          product?: string | null
          reason?: string
          status?: string
          user_id?: string
        }
        Update: {
          action?: string
          area?: string | null
          challenge_id?: string | null
          check_in_id?: string | null
          completed_at?: string | null
          created_at?: string
          headline?: string
          id?: string
          kind?: string
          level?: string
          local_date?: string | null
          mission_id?: string | null
          product?: string | null
          reason?: string
          status?: string
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
      ritual_completions: {
        Row: {
          created_at: string
          id: string
          local_date: string
          ritual_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          ritual_id: string
          user_id?: string
        }
        Update: {
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
      user_experiments: {
        Row: {
          created_at: string
          days_done: number
          end_date: string | null
          experiment_id: string
          id: string
          result_summary: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_done?: number
          end_date?: string | null
          experiment_id: string
          id?: string
          result_summary?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          days_done?: number
          end_date?: string | null
          experiment_id?: string
          id?: string
          result_summary?: string | null
          start_date?: string
          status?: string
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
          mission_id: string
          started_at: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          mission_id: string
          started_at?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          mission_id?: string
          started_at?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
