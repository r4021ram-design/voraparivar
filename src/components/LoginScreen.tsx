import { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserRole, UserData } from '../types/auth';

// Re-export for backward compatibility (App.tsx imports from here)
export type { UserRole, UserData };

interface LoginScreenProps {
    onLogin: (user: UserData) => void;
}

const FALLBACK_CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
    'admin': { password: 'dnjn123', role: 'ADMIN' },
    'user': { password: 'user123', role: 'STANDARD' },
    'guest': { password: 'guest', role: 'VIEW_ONLY' }
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const cleanUser = username.trim().toLowerCase();

        try {
            // Support both full email address (e.g. user@domain.com) and plain usernames
            const loginEmail = cleanUser.includes('@') ? cleanUser : `${cleanUser}@family.local`;

            // 1. Sign In
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password
            });

            if (authError) throw authError;

            if (authData.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role, family_id')
                    .eq('id', authData.user.id)
                    .single();
                
                // Fallback to VIEW_ONLY if profile is missing
                const role = (profileData?.role as UserRole) || 'VIEW_ONLY';
                
                onLogin({
                    id: authData.user.id,
                    email: username, // pass the username/email to the app state
                    role,
                    family_id: profileData?.family_id ?? null,
                });
                return;
            }
        } catch (err: unknown) {
            // Check fallback offline credentials if Supabase is offline / unreachable (Failed to fetch)
            const fallback = FALLBACK_CREDENTIALS[cleanUser];
            if (fallback && fallback.password === password) {
                console.warn('Supabase offline or unreachable. Logged in with local credentials.');
                onLogin({
                    email: username,
                    role: fallback.role
                });
                return;
            }

            const errMsg = err instanceof Error ? err.message : 'Invalid email or password';
            if (errMsg.toLowerCase().includes('failed to fetch')) {
                setError('Supabase is offline/unreachable. Please use local credentials (admin / dnjn123).');
            } else {
                setError(errMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 min-h-screen flex items-center justify-center bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 font-inter">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-pink-100 dark:bg-pink-900/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 sm:p-10 transform transition-all">
                <div className="mb-8 text-center bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                        Sign in to access your family tree network
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-bold text-center animate-in shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium"
                                placeholder="Username"
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium"
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={20} className="ml-1" />
                            </>
                        )}
                    </button>
                    
                     <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 font-medium">
                        Contact administration to obtain login credentials
                    </p>
                </form>
            </div>
        </div>
    );
}
