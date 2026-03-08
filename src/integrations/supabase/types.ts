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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      authorized_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          parent_id: string
          school_year: Database["public"]["Enums"]["school_year"] | null
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          parent_id: string
          school_year?: Database["public"]["Enums"]["school_year"] | null
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          parent_id?: string
          school_year?: Database["public"]["Enums"]["school_year"] | null
          used?: boolean
        }
        Relationships: []
      }
      battles: {
        Row: {
          battle_won: boolean | null
          damage_dealt: number | null
          ended_at: string | null
          enemy_health: number
          enemy_level: number
          enemy_name: string
          enemy_type: string
          id: string
          rewards_coins: number | null
          rewards_diamonds: number | null
          rewards_xp: number | null
          started_at: string | null
          student_id: string
        }
        Insert: {
          battle_won?: boolean | null
          damage_dealt?: number | null
          ended_at?: string | null
          enemy_health: number
          enemy_level?: number
          enemy_name: string
          enemy_type: string
          id?: string
          rewards_coins?: number | null
          rewards_diamonds?: number | null
          rewards_xp?: number | null
          started_at?: string | null
          student_id: string
        }
        Update: {
          battle_won?: boolean | null
          damage_dealt?: number | null
          ended_at?: string | null
          enemy_health?: number
          enemy_level?: number
          enemy_name?: string
          enemy_type?: string
          id?: string
          rewards_coins?: number | null
          rewards_diamonds?: number | null
          rewards_xp?: number | null
          started_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          building_type: string
          created_at: string
          id: string
          level: number
          position_x: number
          position_y: number
          student_id: string
        }
        Insert: {
          building_type: string
          created_at?: string
          id?: string
          level?: number
          position_x?: number
          position_y?: number
          student_id: string
        }
        Update: {
          building_type?: string
          created_at?: string
          id?: string
          level?: number
          position_x?: number
          position_y?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          receiver_parent_approved: boolean
          requester_id: string
          requester_parent_approved: boolean
          status: Database["public"]["Enums"]["friendship_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          receiver_parent_approved?: boolean
          requester_id: string
          requester_parent_approved?: boolean
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          receiver_parent_approved?: boolean
          requester_id?: string
          requester_parent_approved?: boolean
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friendships_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          mission_type: Database["public"]["Enums"]["mission_type"]
          reward_coins: number | null
          reward_diamonds: number | null
          reward_xp: number | null
          subject: Database["public"]["Enums"]["subject"] | null
          target_count: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mission_type: Database["public"]["Enums"]["mission_type"]
          reward_coins?: number | null
          reward_diamonds?: number | null
          reward_xp?: number | null
          subject?: Database["public"]["Enums"]["subject"] | null
          target_count?: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mission_type?: Database["public"]["Enums"]["mission_type"]
          reward_coins?: number | null
          reward_diamonds?: number | null
          reward_xp?: number | null
          subject?: Database["public"]["Enums"]["subject"] | null
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      monthly_test_results: {
        Row: {
          bonus_earned: boolean | null
          completed_at: string | null
          id: string
          percentage: number
          score: number
          student_id: string
          test_id: string
          total_questions: number
        }
        Insert: {
          bonus_earned?: boolean | null
          completed_at?: string | null
          id?: string
          percentage: number
          score: number
          student_id: string
          test_id: string
          total_questions: number
        }
        Update: {
          bonus_earned?: boolean | null
          completed_at?: string | null
          id?: string
          percentage?: number
          score?: number
          student_id?: string
          test_id?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "monthly_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_tests: {
        Row: {
          bonus_coins: number | null
          bonus_diamonds: number | null
          bonus_xp: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          month: number
          question_count: number | null
          school_year: Database["public"]["Enums"]["school_year"]
          subject: Database["public"]["Enums"]["subject"]
          title: string
          year: number
        }
        Insert: {
          bonus_coins?: number | null
          bonus_diamonds?: number | null
          bonus_xp?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          month: number
          question_count?: number | null
          school_year: Database["public"]["Enums"]["school_year"]
          subject: Database["public"]["Enums"]["subject"]
          title: string
          year: number
        }
        Update: {
          bonus_coins?: number | null
          bonus_diamonds?: number | null
          bonus_xp?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          month?: number
          question_count?: number | null
          school_year?: Database["public"]["Enums"]["school_year"]
          subject?: Database["public"]["Enums"]["subject"]
          title?: string
          year?: number
        }
        Relationships: []
      }
      player_inventory: {
        Row: {
          id: string
          item_id: string
          purchased_at: string | null
          quantity: number | null
          student_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string | null
          quantity?: number | null
          student_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string | null
          quantity?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      player_missions: {
        Row: {
          assigned_at: string | null
          completed: boolean | null
          completed_at: string | null
          expires_at: string
          id: string
          mission_id: string
          progress: number | null
          student_id: string
        }
        Insert: {
          assigned_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          expires_at: string
          id?: string
          mission_id: string
          progress?: number | null
          student_id: string
        }
        Update: {
          assigned_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          expires_at?: string
          id?: string
          mission_id?: string
          progress?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_missions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          district: Database["public"]["Enums"]["district"] | null
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          district?: Database["public"]["Enums"]["district"] | null
          email: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          district?: Database["public"]["Enums"]["district"] | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string
          difficulty: number
          id: string
          options: Json
          question_text: string
          school_year: Database["public"]["Enums"]["school_year"]
          subject: Database["public"]["Enums"]["subject"]
        }
        Insert: {
          correct_answer: number
          created_at?: string
          difficulty?: number
          id?: string
          options: Json
          question_text: string
          school_year: Database["public"]["Enums"]["school_year"]
          subject: Database["public"]["Enums"]["subject"]
        }
        Update: {
          correct_answer?: number
          created_at?: string
          difficulty?: number
          id?: string
          options?: Json
          question_text?: string
          school_year?: Database["public"]["Enums"]["school_year"]
          subject?: Database["public"]["Enums"]["subject"]
        }
        Relationships: []
      }
      quiz_history: {
        Row: {
          answered_at: string
          answered_correctly: boolean
          id: string
          question_id: string
          reward_amount: number | null
          reward_type: Database["public"]["Enums"]["resource_type"] | null
          student_id: string
        }
        Insert: {
          answered_at?: string
          answered_correctly: boolean
          id?: string
          question_id: string
          reward_amount?: number | null
          reward_type?: Database["public"]["Enums"]["resource_type"] | null
          student_id: string
        }
        Update: {
          answered_at?: string
          answered_correctly?: boolean
          id?: string
          question_id?: string
          reward_amount?: number | null
          reward_type?: Database["public"]["Enums"]["resource_type"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          citizen_bonus: number | null
          created_at: string | null
          defense_bonus: number | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          item_type: Database["public"]["Enums"]["shop_item_type"]
          min_school_year: Database["public"]["Enums"]["school_year"] | null
          min_village_level: number | null
          name: string
          price_coins: number | null
          price_diamonds: number | null
          rarity: Database["public"]["Enums"]["item_rarity"]
          xp_bonus: number | null
        }
        Insert: {
          citizen_bonus?: number | null
          created_at?: string | null
          defense_bonus?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_type: Database["public"]["Enums"]["shop_item_type"]
          min_school_year?: Database["public"]["Enums"]["school_year"] | null
          min_village_level?: number | null
          name: string
          price_coins?: number | null
          price_diamonds?: number | null
          rarity?: Database["public"]["Enums"]["item_rarity"]
          xp_bonus?: number | null
        }
        Update: {
          citizen_bonus?: number | null
          created_at?: string | null
          defense_bonus?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_type?: Database["public"]["Enums"]["shop_item_type"]
          min_school_year?: Database["public"]["Enums"]["school_year"] | null
          min_village_level?: number | null
          name?: string
          price_coins?: number | null
          price_diamonds?: number | null
          rarity?: Database["public"]["Enums"]["item_rarity"]
          xp_bonus?: number | null
        }
        Relationships: []
      }
      students: {
        Row: {
          citizens: number
          coins: number
          created_at: string
          defense_level: number
          diamonds: number
          display_name: string
          district: Database["public"]["Enums"]["district"] | null
          gender: string | null
          id: string
          parent_id: string
          school_name: string | null
          school_year: Database["public"]["Enums"]["school_year"]
          updated_at: string
          user_id: string
          village_level: number
          xp: number
        }
        Insert: {
          citizens?: number
          coins?: number
          created_at?: string
          defense_level?: number
          diamonds?: number
          display_name: string
          district?: Database["public"]["Enums"]["district"] | null
          gender?: string | null
          id?: string
          parent_id: string
          school_name?: string | null
          school_year?: Database["public"]["Enums"]["school_year"]
          updated_at?: string
          user_id: string
          village_level?: number
          xp?: number
        }
        Update: {
          citizens?: number
          coins?: number
          created_at?: string
          defense_level?: number
          diamonds?: number
          display_name?: string
          district?: Database["public"]["Enums"]["district"] | null
          gender?: string | null
          id?: string
          parent_id?: string
          school_name?: string | null
          school_year?: Database["public"]["Enums"]["school_year"]
          updated_at?: string
          user_id?: string
          village_level?: number
          xp?: number
        }
        Relationships: []
      }
      subject_priorities: {
        Row: {
          id: string
          parent_id: string
          priority: number
          student_id: string
          subject: Database["public"]["Enums"]["subject"]
        }
        Insert: {
          id?: string
          parent_id: string
          priority?: number
          student_id: string
          subject: Database["public"]["Enums"]["subject"]
        }
        Update: {
          id?: string
          parent_id?: string
          priority?: number
          student_id?: string
          subject?: Database["public"]["Enums"]["subject"]
        }
        Relationships: [
          {
            foreignKeyName: "subject_priorities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      app_role: "parent" | "student"
      district:
        | "aveiro"
        | "beja"
        | "braga"
        | "braganca"
        | "castelo_branco"
        | "coimbra"
        | "evora"
        | "faro"
        | "guarda"
        | "leiria"
        | "lisboa"
        | "portalegre"
        | "porto"
        | "santarem"
        | "setubal"
        | "viana_castelo"
        | "vila_real"
        | "viseu"
        | "acores"
        | "madeira"
      friendship_status: "pending_parent_approval" | "approved" | "rejected"
      item_rarity: "common" | "rare" | "epic" | "legendary"
      mission_type: "daily" | "weekly" | "monthly"
      resource_type: "coins" | "diamonds" | "citizens"
      school_year: "1" | "2" | "3" | "4"
      shop_item_type: "building" | "decoration" | "powerup" | "defense"
      subject: "portugues" | "matematica" | "estudo_meio" | "ingles"
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
    Enums: {
      app_role: ["parent", "student"],
      district: [
        "aveiro",
        "beja",
        "braga",
        "braganca",
        "castelo_branco",
        "coimbra",
        "evora",
        "faro",
        "guarda",
        "leiria",
        "lisboa",
        "portalegre",
        "porto",
        "santarem",
        "setubal",
        "viana_castelo",
        "vila_real",
        "viseu",
        "acores",
        "madeira",
      ],
      friendship_status: ["pending_parent_approval", "approved", "rejected"],
      item_rarity: ["common", "rare", "epic", "legendary"],
      mission_type: ["daily", "weekly", "monthly"],
      resource_type: ["coins", "diamonds", "citizens"],
      school_year: ["1", "2", "3", "4"],
      shop_item_type: ["building", "decoration", "powerup", "defense"],
      subject: ["portugues", "matematica", "estudo_meio", "ingles"],
    },
  },
} as const
