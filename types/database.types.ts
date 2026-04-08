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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bathroom_status: {
        Row: {
          bathroom_id: string
          created_at: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          bathroom_id: string
          created_at?: string | null
          id?: string
          status: string
          user_id: string
        }
        Update: {
          bathroom_id?: string
          created_at?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bathroom_status_bathroom_id_fkey"
            columns: ["bathroom_id"]
            isOneToOne: false
            referencedRelation: "bathrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bathrooms: {
        Row: {
          avg_cleanliness: number | null
          avg_privacy: number | null
          avg_rating: number | null
          avg_toilet_paper_quality: number | null
          created_at: string
          created_by: string | null
          directions: string | null
          id: string
          is_accessible: boolean
          is_free: boolean
          latitude: number
          location: unknown
          longitude: number
          name: string
          osm_id: string | null
          review_count: number
          schedule: string | null
          source: string
          type: string
          updated_at: string
          user_edited: boolean
        }
        Insert: {
          avg_cleanliness?: number | null
          avg_privacy?: number | null
          avg_rating?: number | null
          avg_toilet_paper_quality?: number | null
          created_at?: string
          created_by?: string | null
          directions?: string | null
          id?: string
          is_accessible?: boolean
          is_free?: boolean
          latitude: number
          location: unknown
          longitude: number
          name: string
          osm_id?: string | null
          review_count?: number
          schedule?: string | null
          source?: string
          type?: string
          updated_at?: string
          user_edited?: boolean
        }
        Update: {
          avg_cleanliness?: number | null
          avg_privacy?: number | null
          avg_rating?: number | null
          avg_toilet_paper_quality?: number | null
          created_at?: string
          created_by?: string | null
          directions?: string | null
          id?: string
          is_accessible?: boolean
          is_free?: boolean
          latitude?: number
          location?: unknown
          longitude?: number
          name?: string
          osm_id?: string | null
          review_count?: number
          schedule?: string | null
          source?: string
          type?: string
          updated_at?: string
          user_edited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bathrooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          bathroom_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          bathroom_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          bathroom_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_bathroom_id_fkey"
            columns: ["bathroom_id"]
            isOneToOne: false
            referencedRelation: "bathrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          bathroom_id: string | null
          created_at: string | null
          id: string
          review_id: string | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          bathroom_id?: string | null
          created_at?: string | null
          id?: string
          review_id?: string | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          bathroom_id?: string | null
          created_at?: string | null
          id?: string
          review_id?: string | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_bathroom_id_fkey"
            columns: ["bathroom_id"]
            isOneToOne: false
            referencedRelation: "bathrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_banned: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          is_banned?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_banned?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          reason: string
          reported_by: string
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          reason: string
          reported_by: string
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          reason?: string
          reported_by?: string
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          bathroom_id: string
          cleanliness: number
          comment: string | null
          created_at: string
          id: string
          is_hidden: boolean
          privacy: number
          rating: number
          toilet_paper_quality: number
          updated_at: string
          user_id: string
          vote_count: number | null
        }
        Insert: {
          bathroom_id: string
          cleanliness: number
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          privacy: number
          rating: number
          toilet_paper_quality: number
          updated_at?: string
          user_id: string
          vote_count?: number | null
        }
        Update: {
          bathroom_id?: string
          cleanliness?: number
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          privacy?: number
          rating?: number
          toilet_paper_quality?: number
          updated_at?: string
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_bathroom_id_fkey"
            columns: ["bathroom_id"]
            isOneToOne: false
            referencedRelation: "bathrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
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
      cleanup_old_bathroom_statuses: { Args: never; Returns: undefined }
      get_active_bathroom_statuses: {
        Args: { p_bathroom_id: string }
        Returns: {
          report_count: number
          status: string
        }[]
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
