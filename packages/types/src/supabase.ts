export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'user' | 'professional' | 'gym_admin' | 'platform_admin';
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          phone: string | null;
          birth_date: string | null;
          gender: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          onboarding_completed: boolean;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_profiles: {
        Row: {
          user_id: string;
          height_cm: number | null;
          current_weight_kg: number | null;
          target_weight_kg: number | null;
          body_fat_percent: number | null;
          activity_level: string | null;
          sleep_hours_avg: number | null;
          work_schedule: string | null;
          available_minutes_per_day: number | null;
          primary_goal: 'lose_fat' | 'gain_muscle' | 'maintain' | 'performance' | 'general_health' | 'rehabilitation';
          secondary_goals: string[] | null;
          diet_preference: string | null;
          food_allergies: string[] | null;
          food_restrictions: string[] | null;
          disliked_foods: string[] | null;
          preferred_foods: string[] | null;
          experience_level: 'beginner' | 'intermediate' | 'advanced';
          preferred_training_locations: string[] | null;
          available_equipment: string[] | null;
          injuries_notes: string | null;
          medical_notes: string | null;
          coach_tone: 'warm' | 'motivational' | 'technical' | 'tough';
          target_calories: number | null;
          target_protein_g: number | null;
          target_carbs_g: number | null;
          target_fats_g: number | null;
          target_water_ml: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      foods: {
        Row: {
          id: string;
          source: string | null;
          name: string;
          name_normalized: string | null;
          brand: string | null;
          category: string | null;
          calories_kcal: number;
          protein_g: number;
          carbs_g: number;
          fats_g: number;
          fiber_g: number | null;
          sodium_mg: number | null;
          serving_size_g: number | null;
          serving_description: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          food_id: string | null;
          logged_at: string;
          meal_type: string;
          amount_g: number;
          calories_kcal: number;
          protein_g: number;
          carbs_g: number;
          fats_g: number;
          input_method: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          slug: string;
          name_pt: string;
          name_en: string | null;
          description: string | null;
          instructions: string[] | null;
          common_mistakes: string[] | null;
          breathing_notes: string | null;
          category: string;
          primary_muscles: string[];
          secondary_muscles: string[] | null;
          equipment: string[];
          difficulty: number;
          verified: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          finished_at: string | null;
          duration_sec: number | null;
          perceived_effort: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      set_logs: {
        Row: {
          id: string;
          workout_log_id: string;
          exercise_id: string;
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          rir: number | null;
          duration_sec: number | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coach_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coach_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          model: string | null;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      daily_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_date: string;
          meals_suggestion: any;
          water_goal_ml: number | null;
          habits: any;
          ai_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      morning_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          sleep_quality: number | null;
          sleep_hours: number | null;
          energy_level: number | null;
          mood: number | null;
          stress_level: number | null;
          sore_muscles: string[] | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          body_fat_percent: number | null;
          logged_at: string;
          notes: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          cost_units: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      equipment_recognitions: {
        Row: {
          id: string;
          user_id: string;
          photo_path: string | null;
          detected_name: string;
          detected_name_en: string | null;
          category: string | null;
          primary_muscles: string[] | null;
          confidence: 'high' | 'medium' | 'low' | null;
          suggested_exercises: any;
          user_confirmed: boolean;
          added_to_workout_id: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_gyms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          city: string | null;
          state: string | null;
          notes: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      gym_equipment: {
        Row: {
          id: string;
          gym_id: string;
          user_id: string;
          name: string;
          name_normalized: string;
          category: string | null;
          primary_muscles: string[] | null;
          confidence: 'high' | 'medium' | 'low' | null;
          recognition_id: string | null;
          added_manually: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      shopping_lists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source: string | null;
          plan_date_from: string | null;
          plan_date_to: string | null;
          items: any;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
