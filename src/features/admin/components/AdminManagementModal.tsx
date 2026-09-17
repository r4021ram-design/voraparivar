import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, Users, PlusCircle, Shield, KeyRound, Copy, 
    Trash2, RefreshCw, Eye, EyeOff, Building2, UserCheck, AlertCircle 
} from 'lucide-react';
import type { Family, FamilyUser } from '../../families/types';
import type { UserRole } from '../../../types/auth';
import { 
    fetchFamilies, createFamily, fetchFamilyUsers, 
    createFamilyUser, resetFamilyUserPassword, deleteFamilyUser 
} from '../../families/services/familyService';

interface AdminManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFamilyId: string;
    onSelectFamily: (familyId: string) => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
    isOpen,
    onClose,
    currentFamilyId,
    onSelectFamily,
}) => {
    const [activeTab, setActiveTab] = useState<'families' | 'users'>('families');
    
    // Families State
    const [families, setFamilies] = useState<Family[]>([]);
    const [loadingFamilies, setLoadingFamilies] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [newFamilyRootName, setNewFamilyRootName] = useState('');
    const [creatingFamily, setCreatingFamily] = useState(false);

    // Users State
    const [users, setUsers] = useState<FamilyUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // Create User Form
    const [selectedFamilyForUser, setSelectedFamilyForUser] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('VIEW_ONLY');
    const [showPassword, setShowPassword] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);

    // Feedback & Copy State
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedInfo, setCopiedInfo] = useState<string | null>(null);

    // Password Reset Modal State
    const [resettingUserId, setResettingUserId] = useState<string | null>(null);
    const [resetNewPassword, setResetNewPassword] = useState('');

    const loadData = useCallback(async () => {
        setLoadingFamilies(true);
        setLoadingUsers(true);
        try {
            const [famList, userList] = await Promise.all([
                fetchFamilies(),
                fetchFamilyUsers()
            ]);
            setFamilies(famList);
            setUsers(userList);
            if (famList.length > 0 && !selectedFamilyForUser) {
                setSelectedFamilyForUser(famList[0].id);
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
        } finally {
            setLoadingFamilies(false);
            setLoadingUsers(false);
        }
    }, [selectedFamilyForUser]);

    useEffect(() => {
        if (isOpen) {
            loadData();
            setStatusMessage(null);
        }
    }, [isOpen, loadData]);

    if (!isOpen) return null;

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFamilyName.trim()) return;

        setCreatingFamily(true);
        setStatusMessage(null);

        const res = await createFamily(newFamilyName, newFamilyRootName);
        setCreatingFamily(false);

        if (res.success && res.family) {
            setStatusMessage({ type: 'success', text: `Family "${res.family.name}" created successfully!` });
            setNewFamilyName('');
            setNewFamilyRootName('');
            loadData();
        } else {
            setStatusMessage({ type: 'error', text: res.error || 'Failed to create family' });
        }
    };

    const handleGeneratePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewUserPassword(pass);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail.trim() || !newUserPassword || !selectedFamilyForUser) {
            setStatusMessage({ type: 'error', text: 'Please fill in all user details.' });
            return;
        }

        setCreatingUser(true);
        setStatusMessage(null);

        const res = await createFamilyUser({
            email: newUserEmail.trim(),
            password: newUserPassword,
            role: newUserRole,
            family_id: selectedFamilyForUser,
        });

        setCreatingUser(false);

        if (res.success) {
            const selectedFam = families.find(f => f.id === selectedFamilyForUser);
            const copyText = `✨ Family Tree Login Details ✨\nFamily: ${selectedFam?.name || 'Parivar'}\nUsername / Email: ${newUserEmail.trim()}\nPassword: ${newUserPassword}\nRole: ${newUserRole === 'STANDARD' ? 'Editor' : 'Viewer'}`;
            
            setCopiedInfo(copyText);
            setStatusMessage({ 
                type: 'success', 
                text: `User "${newUserEmail.trim()}" created successfully! Click 'Copy Credentials' below to share.` 
            });

            setNewUserEmail('');
            setNewUserPassword('');
            loadData();
        } else {
            let errText = res.error || 'Failed to create user';
            if (errText.includes('Access Denied')) {
                errText = '⚠️ Supabase में Admin खाता एक्टिव नहीं है। कृपया Supabase Dashboard के SQL Editor में "supabase_schema_v7_multifamily.sql" एक बार Run करें।';
            }
            setStatusMessage({ type: 'error', text: errText });
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Login credentials copied to clipboard! You can paste and send via WhatsApp.');
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${email}"? This cannot be undone.`)) {
            return;
        }
        const res = await deleteFamilyUser(userId);
        if (res.success) {
            setStatusMessage({ type: 'success', text: `User "${email}" deleted.` });
            loadData();
        } else {
            setStatusMessage({ type: 'error', text: res.error || 'Failed to delete user' });
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!resetNewPassword) return;
        const res = await resetFamilyUserPassword(userId, resetNewPassword);
        if (res.success) {
            setStatusMessage({ type: 'success', text: 'Password reset successfully!' });
            setResettingUserId(null);
            setResetNewPassword('');
        } else {
            setStatusMessage({ type: 'error', text: res.error || 'Failed to reset password' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Management Portal</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage multiple family trees and member login credentials</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 bg-gray-50/50 dark:bg-gray-800/30">
                    <button
                        onClick={() => setActiveTab('families')}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'families'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Families ({families.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'users'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Users & Logins ({users.length})
                    </button>
                </div>

                {/* Status Alert */}
                {statusMessage && (
                    <div className={`mx-6 mt-4 p-3.5 rounded-xl text-sm flex items-center gap-2.5 ${
                        statusMessage.type === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{statusMessage.text}</span>
                        {copiedInfo && (
                            <button
                                onClick={() => handleCopy(copiedInfo)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copy Credentials
                            </button>
                        )}
                    </div>
                )}

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* TAB 1: FAMILIES */}
                    {activeTab === 'families' && (
                        <div className="space-y-6">
                            {/* Add Family Card */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-rose-500/5 border border-amber-500/20 dark:border-amber-500/10">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4 text-amber-500" />
                                    Add New Family Tree
                                </h3>
                                <form onSubmit={handleCreateFamily} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Family Name *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Shah Parivar, Gupta Parivar"
                                            value={newFamilyName}
                                            onChange={(e) => setNewFamilyName(e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">First Ancestor (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Dada ji / Root Person Name"
                                            value={newFamilyRootName}
                                            onChange={(e) => setNewFamilyRootName(e.target.value)}
                                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={creatingFamily || !newFamilyName.trim()}
                                            className="w-full py-2 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {creatingFamily ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                                            Create Family
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Existing Families List */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Existing Families</h3>
                                {loadingFamilies ? (
                                    <div className="text-center py-8 text-gray-500">Loading families...</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {families.map((fam) => {
                                            const isActive = fam.id === currentFamilyId;
                                            return (
                                                <div 
                                                    key={fam.id}
                                                    className={`p-4 rounded-xl border transition-all ${
                                                        isActive
                                                            ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                                                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white text-base">{fam.name}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {fam.memberCount || 0} members recorded
                                                            </p>
                                                        </div>
                                                        {isActive && (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                                                                ACTIVE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <button
                                                            onClick={() => {
                                                                onSelectFamily(fam.id);
                                                                onClose();
                                                            }}
                                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                                isActive 
                                                                    ? 'bg-amber-600 text-white' 
                                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-amber-500 hover:text-white'
                                                            }`}
                                                        >
                                                            {isActive ? 'Viewing Now' : 'Switch to Tree'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: USERS */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Create User Form */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/20 dark:border-purple-500/10">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-purple-500" />
                                    Create Member Login Credentials
                                </h3>
                                <form onSubmit={handleCreateUser} className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Family Select */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Select Family *</label>
                                            <select
                                                value={selectedFamilyForUser}
                                                onChange={(e) => setSelectedFamilyForUser(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            >
                                                {families.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Username/Email */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Username / Email *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. shah_family or user@gmail.com"
                                                value={newUserEmail}
                                                onChange={(e) => setNewUserEmail(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            />
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Password *</label>
                                                <button
                                                    type="button"
                                                    onClick={handleGeneratePassword}
                                                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold"
                                                >
                                                    Generate
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Enter or generate"
                                                    value={newUserPassword}
                                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 pr-8 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Access Role *</label>
                                            <select
                                                value={newUserRole}
                                                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            >
                                                <option value="VIEW_ONLY">👁️ View-Only (Sirf Dekhna)</option>
                                                <option value="STANDARD">✏️ Editor (Member Add/Edit)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="submit"
                                            disabled={creatingUser || !newUserEmail.trim() || !newUserPassword}
                                            className="py-2 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {creatingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                            Create User Credentials
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Users List */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Existing User Accounts</h3>
                                {loadingUsers ? (
                                    <div className="text-center py-8 text-gray-500">Loading user accounts...</div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3">Username / Email</th>
                                                    <th className="px-4 py-3">Assigned Family</th>
                                                    <th className="px-4 py-3">Role</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                                {users.map((u) => (
                                                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                            {u.email}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                            {u.familyName}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                u.role === 'ADMIN'
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    : u.role === 'STANDARD'
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            }`}>
                                                                {u.role === 'ADMIN' ? '👑 Admin' : u.role === 'STANDARD' ? '✏️ Editor' : '👁️ View Only'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right space-x-2">
                                                            {u.role !== 'ADMIN' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setResettingUserId(u.id);
                                                                            setResetNewPassword('');
                                                                        }}
                                                                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold"
                                                                    >
                                                                        Reset Password
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                                        className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 font-semibold inline-flex items-center gap-1"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Reset Modal Prompt */}
                {resettingUserId && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-20">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl max-w-sm w-full border border-gray-200 dark:border-gray-700 shadow-xl space-y-4">
                            <h4 className="font-bold text-gray-900 dark:text-white">Reset User Password</h4>
                            <input
                                type="text"
                                placeholder="Enter new password"
                                value={resetNewPassword}
                                onChange={(e) => setResetNewPassword(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setResettingUserId(null)}
                                    className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleResetPassword(resettingUserId)}
                                    disabled={!resetNewPassword}
                                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                >
                                    Save Password
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
