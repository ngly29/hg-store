import { UserResponse } from "@/types/auth";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState{
    user: UserResponse | null;
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setAuth: (user: UserResponse, token: string) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

// Tạo store
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,

            setAuth:(user, token)=>{
                // Lưu token vào localStorage
                localStorage.setItem('token', token);
                // Lưu token + role vào cookie
                document.cookie = `token=${token}; path=/`;
                document.cookie = `role=${user.role}; path=/`;

                set({user, token, isAuthenticated: true});
            },
            logout:()=>{
                localStorage.removeItem('token');
                document.cookie='token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                set({
                    user:null,
                    token:null,
                    isAuthenticated:false,
                });
            },

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            }
        }),
        {
            name: 'hg-auth',
            onRehydrateStorage:() => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
)