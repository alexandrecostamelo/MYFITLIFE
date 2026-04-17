export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
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
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
