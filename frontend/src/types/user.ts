export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "superadmin" | "profesor" | "alumno";
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
