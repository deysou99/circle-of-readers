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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          genre: string | null
          id: string
          pages: number | null
          published_year: number | null
          rating: number | null
          summary: string | null
          title: string
        }
        Insert: {
          author: string
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          pages?: number | null
          published_year?: number | null
          rating?: number | null
          summary?: string | null
          title: string
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          pages?: number | null
          published_year?: number | null
          rating?: number | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          active_book_id: string | null
          avatar_url: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          handle: string
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
        }
        Insert: {
          active_book_id?: string | null
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          handle: string
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
        }
        Update: {
          active_book_id?: string | null
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          handle?: string
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_active_book_id_fkey"
            columns: ["active_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      onboarding_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          session_id: string | null
          stage_index: number | null
          stage_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          session_id?: string | null
          stage_index?: number | null
          stage_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          session_id?: string | null
          stage_index?: number | null
          stage_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          book_id: string | null
          club_id: string | null
          comments_count: number | null
          content: string
          created_at: string
          id: string
          likes_count: number | null
          rating: number | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          club_id?: string | null
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          rating?: number | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          club_id?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          favorite_genres: string[]
          first_name: string | null
          goodreads_connected: boolean
          goodreads_last_sync_at: string | null
          goodreads_profile: string | null
          goodreads_stats: Json
          goodreads_user_id: string | null
          goodreads_verified_at: string | null
          id: string
          last_name: string | null
          onboarded: boolean
          onboarding_step: number
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          profile_completed: boolean
          reading_goal: number | null
          reading_pace: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_genres?: string[]
          first_name?: string | null
          goodreads_connected?: boolean
          goodreads_last_sync_at?: string | null
          goodreads_profile?: string | null
          goodreads_stats?: Json
          goodreads_user_id?: string | null
          goodreads_verified_at?: string | null
          id?: string
          last_name?: string | null
          onboarded?: boolean
          onboarding_step?: number
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          profile_completed?: boolean
          reading_goal?: number | null
          reading_pace?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_genres?: string[]
          first_name?: string | null
          goodreads_connected?: boolean
          goodreads_last_sync_at?: string | null
          goodreads_profile?: string | null
          goodreads_stats?: Json
          goodreads_user_id?: string | null
          goodreads_verified_at?: string | null
          id?: string
          last_name?: string | null
          onboarded?: boolean
          onboarding_step?: number
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          profile_completed?: boolean
          reading_goal?: number | null
          reading_pace?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reader_profiles: {
        Row: {
          community_motivations: string[]
          completed: boolean
          conversation_style: string[]
          created_at: string
          curiosity_preferences: string[]
          id: string
          personality_description: string | null
          personality_name: string | null
          post_book_behaviour: string[]
          reading_interruptions: string[]
          reading_locations: string[]
          traits: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          community_motivations?: string[]
          completed?: boolean
          conversation_style?: string[]
          created_at?: string
          curiosity_preferences?: string[]
          id?: string
          personality_description?: string | null
          personality_name?: string | null
          post_book_behaviour?: string[]
          reading_interruptions?: string[]
          reading_locations?: string[]
          traits?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          community_motivations?: string[]
          completed?: boolean
          conversation_style?: string[]
          created_at?: string
          curiosity_preferences?: string[]
          id?: string
          personality_description?: string | null
          personality_name?: string | null
          post_book_behaviour?: string[]
          reading_interruptions?: string[]
          reading_locations?: string[]
          traits?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_books: {
        Row: {
          book_id: string
          created_at: string
          id: string
          progress: number
          rating: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          progress?: number
          rating?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          progress?: number
          rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_club: { Args: { _club_id: string }; Returns: boolean }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          favorite_genres: string[]
          first_name: string | null
          goodreads_connected: boolean
          goodreads_last_sync_at: string | null
          goodreads_profile: string | null
          goodreads_stats: Json
          goodreads_user_id: string | null
          goodreads_verified_at: string | null
          id: string
          last_name: string | null
          onboarded: boolean
          onboarding_step: number
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          profile_completed: boolean
          reading_goal: number | null
          reading_pace: string | null
          updated_at: string
          user_id: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
