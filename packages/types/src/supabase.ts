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
          video_url: string | null;
          video_source: 'youtube' | 'direct' | 'vimeo' | null;
          form_tips: string[] | null;
          pose_check_key: string | null;
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
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          photo_path: string;
          pose: 'front' | 'back' | 'side_left' | 'side_right';
          weight_kg: number | null;
          body_fat_percent: number | null;
          notes: string | null;
          taken_at: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      trails: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string;
          duration_days: number;
          level: 'beginner' | 'intermediate' | 'advanced';
          goal: string;
          cover_emoji: string | null;
          is_premium: boolean;
          days_config: any;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_trails: {
        Row: {
          id: string;
          user_id: string;
          trail_id: string;
          started_at: string;
          completed_at: string | null;
          current_day: number;
          days_completed: number[] | null;
          abandoned: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_stats: {
        Row: { user_id: string; total_xp: number; level: number; xp_strength: number; xp_endurance: number; xp_flexibility: number; xp_consistency: number; xp_nutrition: number; current_streak: number; longest_streak: number; last_active_date: string | null; freezes_used_this_month: number; freezes_reset_month: string | null; updated_at: string };
        Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [];
      };
      xp_events: {
        Row: { id: string; user_id: string; event_type: string; xp_awarded: number; dimension: string | null; ref_table: string | null; ref_id: string | null; description: string | null; created_at: string };
        Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [];
      };
      achievements: {
        Row: { id: string; slug: string; title: string; description: string; icon: string; category: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; xp_reward: number; criteria: any };
        Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [];
      };
      user_achievements: {
        Row: { id: string; user_id: string; achievement_id: string; unlocked_at: string };
        Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [];
      };
      daily_quests: {
        Row: { id: string; user_id: string; quest_date: string; title: string; description: string; xp_reward: number; target_type: string; target_value: number; progress: number; completed: boolean; completed_at: string | null; created_at: string };
        Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'blocked' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          metric: string;
          target_value: number;
          start_date: string;
          end_date: string;
          status: 'active' | 'completed' | 'cancelled';
          is_public: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      challenge_participants: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          joined_at: string;
          current_progress: number;
          completed_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      weekly_reports: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          week_end: string;
          workouts_count: number;
          meals_count: number;
          checkins_count: number;
          xp_earned: number;
          weight_change_kg: number | null;
          highlight: string | null;
          summary: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      gym_places: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          latitude: number;
          longitude: number;
          phone: string | null;
          website: string | null;
          instagram: string | null;
          google_place_id: string | null;
          contributed_by: string | null;
          verified: boolean;
          claimed_by: string | null;
          amenities: string[] | null;
          operating_hours: any;
          photos_paths: string[] | null;
          rating_avg: number | null;
          rating_count: number;
          checkins_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      gym_reviews: {
        Row: {
          id: string;
          gym_place_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      gym_checkins: {
        Row: {
          id: string;
          user_id: string;
          gym_place_id: string | null;
          user_gym_id: string | null;
          workout_log_id: string | null;
          latitude: number | null;
          longitude: number | null;
          checked_in_at: string;
          left_at: string | null;
          duration_sec: number | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      community_groups: {
        Row: { id: string; slug: string; name: string; description: string | null; cover_emoji: string | null; category: string; member_count: number; created_at: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      group_members: {
        Row: { id: string; group_id: string; user_id: string; role: 'member' | 'moderator'; joined_at: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      community_posts: {
        Row: {
          id: string;
          author_id: string;
          group_id: string | null;
          content: string;
          photo_path: string | null;
          likes_count: number;
          comments_count: number;
          moderation_status: 'pending' | 'approved' | 'flagged' | 'removed';
          moderation_reason: string | null;
          moderation_score: any;
          removed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      post_likes: {
        Row: { id: string; post_id: string; user_id: string; created_at: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          moderation_status: 'pending' | 'approved' | 'flagged' | 'removed';
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: 'post' | 'comment' | 'user';
          target_id: string;
          reason: string;
          details: string | null;
          status: 'pending' | 'reviewed' | 'dismissed';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_blocks: {
        Row: { id: string; blocker_id: string; blocked_id: string; created_at: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      feature_flags: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          enabled: boolean;
          rollout_pct: number;
          target_user_ids: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          workout_reminder: boolean;
          meal_reminder: boolean;
          water_reminder: boolean;
          sleep_reminder: boolean;
          weekly_summary_email: boolean;
          churn_recovery_email: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_agent: string | null;
          created_at: string;
          last_used_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string | null;
          to_email: string;
          template: string;
          subject: string;
          status: 'pending' | 'sent' | 'failed' | 'bounced';
          provider_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_response_cache: {
        Row: {
          id: string;
          cache_key: string;
          feature: string;
          response_text: string;
          hit_count: number;
          last_hit_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      rate_limits: {
        Row: {
          id: string;
          user_id: string | null;
          identifier: string | null;
          bucket: string;
          window_start: string;
          count: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      ai_usage_metrics: {
        Row: {
          id: string;
          user_id: string | null;
          feature: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          cached_tokens: number;
          cost_estimate_usd: number;
          latency_ms: number | null;
          cache_hit: boolean;
          fallback_used: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      proactive_messages: {
        Row: {
          id: string;
          user_id: string;
          trigger_type: string;
          title: string;
          content: string;
          severity: 'info' | 'suggestion' | 'warning';
          action_label: string | null;
          action_url: string | null;
          read_at: string | null;
          dismissed_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      menstrual_settings: {
        Row: {
          user_id: string;
          tracking_enabled: boolean;
          average_cycle_length: number | null;
          average_period_length: number | null;
          last_updated: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      menstrual_cycles: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string | null;
          symptoms: string[] | null;
          flow_intensity: 'light' | 'medium' | 'heavy' | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      lab_exams: {
        Row: {
          id: string;
          user_id: string;
          file_path: string | null;
          exam_date: string | null;
          lab_name: string | null;
          title: string | null;
          raw_extraction: any;
          processed: boolean;
          processing_error: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      biomarkers: {
        Row: {
          id: string;
          user_id: string;
          lab_exam_id: string | null;
          marker_key: string;
          marker_name: string;
          value: number;
          unit: string;
          reference_min: number | null;
          reference_max: number | null;
          status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | null;
          measured_at: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professional_availability: {
        Row: {
          id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          slot_duration_min: number;
          active: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professional_blocked_dates: {
        Row: {
          id: string;
          professional_id: string;
          blocked_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          professional_id: string;
          client_id: string;
          scheduled_at: string;
          duration_min: number;
          status: 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
          client_notes: string | null;
          professional_notes: string | null;
          meeting_url: string | null;
          modality: 'online' | 'presencial' | 'domiciliar' | null;
          price: number | null;
          share_history: boolean;
          cancelled_by: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professional_threads: {
        Row: {
          id: string;
          professional_id: string;
          client_id: string;
          last_message_at: string | null;
          client_unread: number;
          professional_unread: number;
          archived: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professional_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          user_id: string;
          profession: 'nutritionist' | 'personal_trainer' | 'physiotherapist';
          council_type: 'CRN' | 'CREF' | 'CREFITO';
          council_number: string;
          council_state: string;
          full_name: string;
          bio: string | null;
          avatar_url: string | null;
          specialties: string[];
          formations: string[];
          city: string | null;
          state: string | null;
          modalities: string[];
          price_consultation: number | null;
          price_monthly: number | null;
          whatsapp: string | null;
          email: string | null;
          instagram: string | null;
          website: string | null;
          verified: boolean;
          active: boolean;
          rating_avg: number | null;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professional_reviews: {
        Row: {
          id: string;
          professional_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      professional_favorites: {
        Row: {
          id: string;
          user_id: string;
          professional_id: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      gym_claims: {
        Row: {
          id: string;
          gym_place_id: string;
          user_id: string;
          status: 'pending' | 'approved' | 'rejected';
          message: string | null;
          admin_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      form_sessions: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string | null;
          exercise_name: string;
          pose_check_key: string;
          duration_sec: number;
          reps_detected: number;
          avg_form_score: number;
          best_form_score: number;
          feedback_counts: any;
          summary_cues: string[] | null;
          recorded_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      community_challenges: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          category: 'strength' | 'cardio' | 'consistency' | 'nutrition' | 'flexibility' | 'mindset';
          challenge_type: 'daily_reps' | 'total_reps' | 'daily_streak' | 'accumulated_minutes' | 'photo_habit';
          target_value: number;
          target_unit: string;
          exercise_hint: string | null;
          duration_days: number;
          enrollment_start: string;
          enrollment_end: string | null;
          start_date: string;
          end_date: string;
          featured: boolean;
          cover_emoji: string;
          xp_on_complete: number;
          min_participants: number;
          max_participants: number | null;
          status: 'draft' | 'enrollment' | 'active' | 'completed' | 'cancelled';
          rules: string | null;
          tips: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      community_challenge_participants: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          enrolled_at: string;
          current_progress: number;
          check_in_count: number;
          longest_streak: number;
          current_streak: number;
          last_checkin_date: string | null;
          completed_at: string | null;
          abandoned_at: string | null;
          final_rank: number | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      community_challenge_checkins: {
        Row: {
          id: string;
          participant_id: string;
          challenge_id: string;
          user_id: string;
          checkin_date: string;
          value: number;
          notes: string | null;
          photo_path: string | null;
          created_at: string;
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
