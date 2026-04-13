/**
 * Auth session lifecycle hook.
 *
 * Handles session bootstrap, auth state changes, role loading, login and logout.
 * Extracted from the top-level App component to make auth reusable and testable.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { UserData, UserRole } from '../../../types/auth';

export const useAuthSession = () => {
    const [user, setUser] = useState<UserData | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const loadUserRole = useCallback(async (authUser: { id: string; email?: string }) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authUser.id)
                .single();

            setUser({
                email: authUser.email ?? '',
                role: (profile?.role as UserRole) || 'VIEW_ONLY',
            });
        } catch (e) {
            console.error('Failed to load user role:', e);
            setUser({ email: authUser.email ?? '', role: 'VIEW_ONLY' });
        } finally {
            setAuthLoading(false);
        }
    }, []);

    // Bootstrap session on mount
    useEffect(() => {
        let isMounted = true;

        // Fast synchronous-like session check
        supabase.auth.getSession().then(({ data: { session }, error }: { data: { session: any }; error: any }) => {
            if (error) {
                console.error('Auth session check error:', error);
                if (isMounted) setAuthLoading(false);
                return;
            }

            if (session?.user) {
                if (isMounted) loadUserRole(session.user);
            } else {
                if (isMounted) setAuthLoading(false);
            }
        }).catch((e: any) => {
            console.error('Auth throw error:', e);
            if (isMounted) setAuthLoading(false);
        });

        // Listen for auth changes independently
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (!isMounted) return;
            if (session?.user) {
                // DO NOT use async/await here to avoid blocking Supabase's internal auth event loop
                loadUserRole(session.user);
            } else {
                setUser(null);
                setAuthLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [loadUserRole]);

    const handleLogin = useCallback((userData: UserData) => {
        setUser(userData);
    }, []);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
    }, []);

    return {
        user,
        authLoading,
        handleLogin,
        handleLogout,
    };
};
