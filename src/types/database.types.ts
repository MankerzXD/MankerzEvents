import { UserRole } from '../lib/constants';

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  admin_email: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  company_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sorteo {
  id: string;
  company_id: string;
  title: string;
  description: string;
  prize: string;
  ticket_price: number;
  total_tickets: number;
  sold_tickets: number;
  draw_date: string;
  status: 'active' | 'draft' | 'completed';
  created_at: string;
}

export interface Participacion {
  id: string;
  sorteo_id: string;
  company_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  ticket_count: number;
  total_amount: number;
  ticket_numbers: number[];
  payment_status: 'completed' | 'pending';
  created_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  user_id?: string | null;
  email: string;
  full_name: string;
  plan_tier: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Company, 'id'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      sorteos: {
        Row: Sorteo;
        Insert: Omit<Sorteo, 'id' | 'created_at' | 'sold_tickets'> & {
          id?: string;
          sold_tickets?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Sorteo, 'id'>>;
      };
      participaciones: {
        Row: Participacion;
        Insert: Omit<Participacion, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Participacion, 'id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Subscription, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
