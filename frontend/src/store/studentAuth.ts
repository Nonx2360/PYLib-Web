import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StudentProfile {
  member_id: string;
  full_name: string;
  member_type: string;
  joined_date: string;
}

interface StudentAuthState {
  token: string | null;
  profile: StudentProfile | null;
  setSession: (payload: { profile: StudentProfile; token: string }) => void;
  logout: () => void;
}

export const useStudentAuthStore = create<StudentAuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      setSession: ({ profile, token }) => set({ profile, token }),
      logout: () => set({ profile: null, token: null }),
    }),
    { name: "smart-library-student" }
  )
);
