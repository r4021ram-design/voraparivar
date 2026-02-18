import { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';


// User Roles
export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEW_ONLY';

export interface UserData {
    username: string;
    role: UserRole;
    name: string;
}

// Hardcoded Internal Credentials
const CREDENTIALS: Record<string, { password: string, role: UserRole, name: string }> = {
    'admin': { password: 'dnjn123', role: 'ADMIN', name: 'Administrator' },
    'user': { password: 'user123', role: 'STANDARD', name: 'Standard User' },
    'guest': { password: 'guest', role: 'VIEW_ONLY', name: 'Guest User' }
};

interface LoginScreenProps {
    onLogin: (user: UserData) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network delay for better UX feel
        setTimeout(() => {
            const user = CREDENTIALS[username.toLowerCase()]; // Case insensitive username

            if (user && user.password === password) {
                onLogin({
                    username: username.toLowerCase(),
                    role: user.role,
                    name: user.name
                });
            } else {
                setError('Invalid username or password');
                setIsLoading(false);
            }
        }, 600);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* Background is handled by global CSS (index.css), this is just content */}

            <div className="w-full max-w-md p-6 sm:p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 mx-4">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-[11px] font-medium tracking-wide text-gray-500 italic leading-tight mb-1">
                            अत्रि गोत्रोत्पन्नाः वयं, यजुर्वेदीय-माध्यन्दिनि-शाखाध्यायिनः; सहस्र-औदीच्य-गोरवाल-ब्राह्मणाः — धर्मरक्षणाय समर्पिताः।
                        </p>
                        <h1 className="text-2xl font-black tracking-tighter text-gray-800 drop-shadow-sm">
                            वोरा वंशावली <span className="text-blue-600">|</span>
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider ml-1">Username</label>
                        <div className="relative group">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-800 font-medium"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-800 font-medium"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                Sign In <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        Protected System • Authorized Personnel Only
                    </p>
                </div>
            </div>
        </div>
    );
}
