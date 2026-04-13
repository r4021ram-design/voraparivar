import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Download, RotateCcw, LogOut, Search as SearchIcon,
  Settings,
  Menu,
  Calendar, Moon, Sun, Maximize, Palette, Printer, Users, CloudUpload, Eye, EyeOff, Undo, Redo, Wand2, Loader2
} from 'lucide-react';
import clsx from 'clsx';

import FamilyNode from './components/FamilyNode';
import CustomEdge from './components/CustomEdge';
import FileUpload from './components/FileUpload';
import EditModal from './components/EditModal';
import ViewPersonModal from './components/ViewPersonModal';
import LoginScreen from './components/LoginScreen';
import { toPng } from 'html-to-image';
import SearchSidebar from './components/SearchSidebar';
import TimelineView from './components/TimelineView';
import CommunityDashboard from './components/CommunityDashboard';
import Breadcrumbs from './components/Breadcrumbs';
import { translations } from './i18n';
import { loadFamilyTreeData } from './data';
import type { Person } from './types';
import { useFamilyTree } from './hooks/useFamilyTree';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import HeaderEditor from './components/HeaderEditor';
import TranslationOverlay from './components/TranslationOverlay';
import NavigationDrawers from './components/NavigationDrawers';
import { togglePersonCollapse } from './features/family-tree/utils/treeTransforms';
import { useAuthSession } from './features/auth/hooks/useAuthSession';
import { useTreePreferences } from './features/family-tree/hooks/useTreePreferences';
import { useTreeSelection } from './features/family-tree/hooks/useTreeSelection';
import { useTreeLayout } from './features/family-tree/hooks/useTreeLayout';
import type { UserData } from './types/auth';

const nodeTypes = {
  familyNode: FamilyNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

interface FamilyTreeFlowProps {
  user: UserData;
  onLogout: () => void;
}

const FamilyTreeFlow = ({ user, onLogout }: FamilyTreeFlowProps) => {
  const {
    currentData,
    setCurrentData,
    isBulkTranslating,
    translationProgress,
    handleAddChild,
    handleDelete,
    handleSaveEdit,
    handleBulkTranslate,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    refreshDb
  } = useFamilyTree(user.role);

  // UI state
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewPerson, setViewPerson] = useState<Person | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Extracted hooks
  const prefs = useTreePreferences();
  const { selectedNodeId, highlightedPath, focusNode, focusRoot, clearSelection } = useTreeSelection(currentData);

  const t = translations[prefs.language];

  const handleToggleExpand = useCallback((personId: string) => {
    setCurrentData((prevData) => {
      const newData = togglePersonCollapse(prevData, personId);
      setTimeout(() => layout.refreshLayoutRef.current(newData), 0);
      return newData;
    });
  }, [setCurrentData]);

  const handleViewDetails = useCallback((person: Person) => {
    setViewPerson(person);
    focusNode(person.id);
  }, [focusNode]);

  const handleEditPerson = useCallback((person: Person) => {
    setEditingPerson(person);
  }, []);

  const handleAddParent = useCallback(async () => {
    const newRootId = crypto.randomUUID();
    const oldRootId = currentData.id;

    const newRoot: Person = {
      id: newRootId,
      name: 'New Ancestor',
      generation: 1,
      gender: 'MALE',
      children: [{ ...currentData }]
    };

    setCurrentData(newRoot);
    try {
        const { error: insertError } = await supabase.from('people').insert({
          id: newRootId,
          parent_id: null,
          name: 'New Ancestor',
          gender: 'MALE',
          generation: 1,
        });
        if (insertError) throw insertError;
        if (oldRootId) {
            await supabase.from('people').update({ parent_id: newRootId }).eq('id', oldRootId);
        }
        refreshDb();
    } catch (e) {
        console.error(e);
    }
  }, [currentData, setCurrentData, refreshDb]);

  const layout = useTreeLayout({
    userRole: user.role,
    language: prefs.language,
    theme: prefs.theme,
    fontScale: prefs.fontScale,
    isPrivacyMode: prefs.isPrivacyMode,
    highlightedPath,
    selectedNodeId,
    edgeColor: prefs.edgeColor,
    edgeWidth: prefs.edgeWidth,
    handleAddChild,
    handleDelete,
    handleToggleExpand,
    handleAddParent,
    onEditPerson: handleEditPerson,
    onViewDetails: handleViewDetails,
  });

  // Progress bar DOM update
  useEffect(() => {
    if (translationProgress) {
        const bar = document.getElementById('ai-translation-progress-bar');
        if (bar) {
            const percent = (translationProgress.current / translationProgress.total) * 100;
            bar.style.width = `${percent}%`;
        }
    }
  }, [translationProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) { handleRedo(); } else { handleUndo(); }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Reactive refresh when UI settings or data change
  useEffect(() => {
    if (currentData && currentData.id !== 'root') {
      layout.refreshLayout(currentData, true);
    }
  }, [prefs.language, prefs.theme, prefs.fontScale, prefs.isPrivacyMode, layout.refreshLayout, currentData]);

  // Initial layout when data arrives
  useEffect(() => {
    if (currentData && currentData.name !== 'Loading…') {
      layout.refreshLayout(currentData);
    }
  }, [currentData, layout.refreshLayout]);

  // Theme body class
  useEffect(() => {
    document.body.className = prefs.theme === 'rajashahi' ? 'rajashahi' : '';
  }, [prefs.theme]);

  const handleFocusNode = useCallback((nodeId: string) => {
    focusNode(nodeId);
    if (window.innerWidth < 640) {
      setIsSearchOpen(false);
    }
  }, [focusNode]);

  const handleDataLoaded = useCallback((data: Person) => {
    setCurrentData(data);
    layout.refreshLayout(data);
  }, [setCurrentData, layout.refreshLayout]);

  const handleReset = useCallback(async () => {
    if (confirm("Reset to default?")) {
      const defaultData = await loadFamilyTreeData();
      setCurrentData(defaultData);
      layout.refreshLayout(defaultData);
    }
  }, [setCurrentData, layout.refreshLayout]);

  const handleExport = () => {
    const jsonString = JSON.stringify({ tree: currentData }, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "vanshavali_edited.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportImage = useCallback(() => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;
    toPng(flowElement, { backgroundColor: prefs.theme === 'dark' ? '#0f172a' : '#ffffff', quality: 1, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `family-tree.png`;
        link.href = dataUrl;
        link.click();
      });
  }, [prefs.theme]);

  const handleExportPDF = useCallback(() => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;
    toPng(flowElement, { backgroundColor: prefs.theme === 'dark' ? '#0f172a' : '#ffffff', quality: 1, pixelRatio: 2 })
      .then(async (dataUrl) => {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
        pdf.save(`vanshavali.pdf`);
      });
  }, [prefs.theme]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  const handleResetFromBackup = useCallback(() => {
    if (confirm("Reload from backup?")) {
      localStorage.removeItem('vanshavali_data_v3');
      window.location.reload();
    }
  }, []);

  return (
    <div className={clsx(
      "w-full h-screen relative",
      prefs.theme === 'dark' && 'dark',
      prefs.theme === 'rajashahi' && 'rajashahi',
      `font-scale-${prefs.fontScale}`
    )}>
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rajashahi:bg-[#fff9f0] transition-colors duration-500">
        {/* Top Controls Container */}
        <div className="absolute top-0 left-0 w-full p-2 sm:p-4 z-50 pointer-events-none">
          <div className="flex justify-between items-start gap-2 sm:gap-4">

            {/* Mobile Left Menu Button */}
            <div className="sm:hidden pointer-events-auto">
              <button
                onClick={() => setIsLeftDrawerOpen(true)}
                className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                title="Open Menu"
                aria-label="Open Menu"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Left Side: Actions Column (Hidden on Mobile) */}
            <div className="hidden sm:flex flex-col gap-1.5 items-start pointer-events-auto w-32 sm:w-40">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center gap-1.5 bg-blue-600 px-2 py-1.5 rounded-lg shadow-md border border-blue-700 hover:bg-blue-700 text-white font-medium transition-colors header-btn-primary"
              >
                <SearchIcon size={16} />
                <span className="text-[11px] font-bold truncate">{t.findPerson}</span>
              </button>

              <button
                onClick={handleResetFromBackup}
                className="w-full flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-medium transition-colors"
                title="Reset from Backup Folder"
              >
                <RotateCcw size={16} />
                <span className="text-[11px] font-bold truncate">Sync Backup</span>
              </button>
              <button
                onClick={() => setIsTimelineOpen(true)}
                className="w-full flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400 font-medium transition-colors header-btn-secondary"
              >
                <Calendar size={16} />
                <span className="text-[11px] font-bold truncate">{t.timeline}</span>
              </button>

              {user.role === 'ADMIN' && (
                <div className="flex flex-col gap-1.5 w-full">
                  <FileUpload onDataLoaded={handleDataLoaded} />
                  <button
                    onClick={async () => {
                      if (confirm("Migrate data to Supabase? This will upload your local data to the database.")) {
                        const { migrateDataToSupabase } = await import('./utils/migrate');
                        await migrateDataToSupabase();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-green-600 px-2 py-1.5 rounded-lg shadow-md border border-green-700 hover:bg-green-700 text-white font-medium transition-colors"
                  >
                    <CloudUpload size={16} />
                    <span className="text-[11px] font-bold truncate">Migrate to DB</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium transition-colors"
                  >
                    <Download size={16} />
                    <span className="text-[11px] font-bold truncate">{t.export}</span>
                  </button>
                  <button
                    onClick={handleBulkTranslate}
                    disabled={isBulkTranslating}
                    className="w-full flex items-center justify-center gap-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1.5 rounded-lg shadow-md border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/60 font-bold transition-all disabled:opacity-50"
                  >
                    {isBulkTranslating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    <span className="text-[11px] font-bold truncate">Bulk AI Translate</span>
                  </button>
                  <button
                    onClick={() => setIsCommunityOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 px-2 py-1.5 rounded-lg shadow-md border border-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium transition-all"
                  >
                    <Users size={16} />
                    <span className="text-[11px] font-bold truncate">{t.community}</span>
                  </button>
                  <button
                    onClick={() => prefs.setIsEditingHeader(true)}
                    className="w-full flex items-center justify-center gap-1.5 bg-purple-600 px-2 py-1.5 rounded-lg shadow-md border border-purple-700 hover:bg-purple-700 text-white font-medium transition-colors"
                  >
                    <Palette size={16} />
                    <span className="text-[11px] font-bold truncate">Header</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 font-medium transition-colors"
                  >
                    <RotateCcw size={16} />
                    <span className="text-[11px] font-bold truncate">{t.reset}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Center: Cultural Heading (Responsive Scaling) */}
            <div className="flex-1 flex flex-col items-center text-center pointer-events-auto mt-1 sm:mt-2 px-1">
              <p className="hidden sm:block text-[9px] sm:text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 rajashahi:text-amber-800/90 italic leading-tight sm:leading-relaxed max-w-2xl">
                {prefs.headerVerse}
              </p>
              <h1 className="text-lg sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white rajashahi:text-[#800000] drop-shadow-md mt-1 flex items-center gap-1 sm:gap-2">
                {prefs.headerTitle} <span className="hidden sm:inline text-blue-600 rajashahi:text-[#ffd700]">|</span>
              </h1>
            </div>

            {/* Mobile Right Settings Button */}
            <div className="sm:hidden pointer-events-auto">
              <button
                onClick={() => setIsRightDrawerOpen(true)}
                className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                title="Open Settings"
                aria-label="Open Settings"
              >
                <Settings size={24} />
              </button>
            </div>

            {/* Right Side: Configuration Column (Hidden on Mobile) */}
            <div className="hidden sm:flex flex-col gap-1.5 items-end pointer-events-auto w-32 sm:w-40">
              <div className="flex flex-col gap-1.5 w-full">
                {/* Branch Style Selector */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-1 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 flex flex-col gap-1 w-full">
                  <div className="px-1 pb-0.5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-1">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Branch</span>
                    <input
                      type="color"
                      value={prefs.edgeColor}
                      onChange={(e) => prefs.setEdgeColor(e.target.value)}
                      className="w-3 h-3 rounded cursor-pointer border-none bg-transparent"
                      title="Branch Color"
                      aria-label="Branch Color"
                    />
                  </div>
                  <select
                    value={prefs.edgeWidth}
                    onChange={(e) => prefs.setEdgeWidth(parseInt(e.target.value))}
                    className="bg-transparent text-[9px] font-black outline-none text-gray-700 dark:text-gray-300 border-none px-0.5 cursor-pointer w-full text-center"
                    title="Branch Thickness"
                    aria-label="Branch Thickness"
                  >
                    {[2, 4, 6, 8].map(w => <option key={w} value={w}>{w}px</option>)}
                  </select>
                </div>

                <button
                  onClick={focusRoot}
                  className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Maximize size={16} />
                  <span className="text-[11px] font-bold">Focus</span>
                </button>

                {/* History Options */}
                {user.role === 'ADMIN' && (
                <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 border border-gray-200 dark:border-slate-700 w-full overflow-hidden">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    aria-label="Undo"
                    title="Undo (Ctrl+Z)"
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-l-lg transition-all",
                        canUndo ? "hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200" : "opacity-30 cursor-not-allowed text-gray-500"
                    )}
                  >
                    <Undo size={14} />
                  </button>
                  <div className="w-px h-full bg-gray-300 dark:bg-slate-600 mx-0.5"></div>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    aria-label="Redo"
                    title="Redo (Ctrl+Y)"
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-r-lg transition-all",
                        canRedo ? "hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200" : "opacity-30 cursor-not-allowed text-gray-500"
                    )}
                  >
                    <Redo size={14} />
                  </button>
                </div>
                )}

                {/* Image Export & Print - Admin Only */}
                {user.role === 'ADMIN' && (
                  <div className="flex flex-col bg-gray-100 dark:bg-slate-800 rounded-xl p-1 border border-gray-200 dark:border-slate-700 w-full overflow-hidden">
                    <button
                      onClick={handleExportImage}
                      className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[11px] font-bold text-gray-700 dark:text-gray-200 w-full"
                    >
                      <Download size={14} className="text-blue-600 dark:text-blue-400" />
                      Img
                    </button>
                    <div className="w-full h-px bg-gray-300 dark:bg-slate-600 my-0.5"></div>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[11px] font-bold text-gray-700 dark:text-gray-200 w-full"
                      title="Export as PDF"
                    >
                      <Download size={14} className="text-red-500" />
                      PDF
                    </button>
                    <div className="w-full h-px bg-gray-300 dark:bg-slate-600 my-0.5"></div>
                    <button
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[11px] font-bold text-gray-700 dark:text-gray-200 w-full"
                      title={t.printTree}
                    >
                      <Printer size={14} className="text-gray-500" />
                      Print
                    </button>
                  </div>
                )}

                {/* Theme Toggle Vertical */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-1 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 flex flex-col gap-1 w-full">
                  <button onClick={() => prefs.setTheme('light')} title="Light Mode" className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", prefs.theme === 'light' ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500")}>
                    <Sun size={14} />
                  </button>
                  <button onClick={() => prefs.setTheme('dark')} title="Dark Mode" className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", prefs.theme === 'dark' ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-gray-400")}>
                    <Moon size={14} />
                  </button>
                  <button onClick={() => prefs.setTheme('rajashahi')} title="Royal Mode" className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", prefs.theme === 'rajashahi' ? "bg-orange-600 text-white" : "hover:bg-orange-50 text-orange-600")}>
                    <Palette size={14} />
                  </button>
                  <button onClick={() => prefs.setIsPrivacyMode(!prefs.isPrivacyMode)} title={prefs.isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"} className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", prefs.isPrivacyMode ? "bg-red-500 text-white" : "hover:bg-red-50 text-red-500")}>
                    {prefs.isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Font Scale Toggle Vertical */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-1 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 flex flex-col gap-1 w-full">
                  {(['sm', 'md', 'lg'] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => prefs.setFontScale(scale)}
                      className={clsx(
                        "py-1 rounded-md text-[9px] font-black transition-all text-center",
                        prefs.fontScale === scale ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {scale === 'sm' ? "A" : scale === 'md' ? "A+" : "A++"}
                    </button>
                  ))}
                </div>

                {/* Language Selector Vertical */}
                <div className="flex flex-col bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-1 gap-1 w-full">
                  {(['EN', 'HI', 'GU'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => prefs.setLanguage(lang)}
                      className={`py-1 rounded text-[9px] font-black transition-all text-center ${prefs.language === lang ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center justify-center gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-2 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'ADMIN' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                    <span className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-tighter truncate">{user.role}</span>
                  </div>

                  <button
                    onClick={onLogout}
                    className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-700 dark:text-gray-300 font-bold transition-colors"
                  >
                    <LogOut size={16} className="text-red-500" />
                    <span className="text-[11px] font-bold">Exit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Breadcrumbs
            currentNodeId={selectedNodeId}
            treeData={currentData}
            onNavigate={handleFocusNode}
            language={prefs.language}
        />

        <ReactFlow
          nodes={layout.nodes}
          edges={layout.edges}
          onNodesChange={layout.onNodesChange}
          onEdgesChange={layout.onEdgesChange}
          onNodeClick={(_, node) => handleFocusNode(node.id)}
          onPaneClick={clearSelection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          attributionPosition="bottom-right"
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap zoomable pannable />
        </ReactFlow>

        <EditModal
          person={editingPerson}
          onClose={() => setEditingPerson(null)}
          onSave={handleSaveEdit}
          language={prefs.language}
          userRole={user.role}
        />

        {viewPerson && (
          <ViewPersonModal
            person={viewPerson}
            language={prefs.language}
            theme={prefs.theme}
            fontScale={prefs.fontScale}
            isPrivacyMode={user.role === 'VIEW_ONLY'}
            onClose={() => setViewPerson(null)}
          />
        )}

        <SearchSidebar
          nodes={layout.nodes}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onFocusNode={handleFocusNode}
          language={prefs.language}
        />

        <TimelineView
          nodes={layout.nodes}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
          onFocusNode={handleFocusNode}
          language={prefs.language}
        />

        <CommunityDashboard
          isOpen={isCommunityOpen}
          onClose={() => setIsCommunityOpen(false)}
          language={prefs.language}
        />

        <HeaderEditor
          isOpen={prefs.isEditingHeader}
          headerVerse={prefs.headerVerse}
          headerTitle={prefs.headerTitle}
          setHeaderVerse={prefs.setHeaderVerse}
          setHeaderTitle={prefs.setHeaderTitle}
          onClose={() => prefs.setIsEditingHeader(false)}
          onSave={prefs.handleSaveHeader}
        />

        <NavigationDrawers
          isLeftDrawerOpen={isLeftDrawerOpen}
          isRightDrawerOpen={isRightDrawerOpen}
          setIsLeftDrawerOpen={setIsLeftDrawerOpen}
          setIsRightDrawerOpen={setIsRightDrawerOpen}
          user={user}
          t={t}
          language={prefs.language}
          setLanguage={prefs.setLanguage}
          theme={prefs.theme}
          setTheme={prefs.setTheme}
          setIsSearchOpen={setIsSearchOpen}
          setIsTimelineOpen={setIsTimelineOpen}
          setIsCommunityOpen={setIsCommunityOpen}
          setIsEditingHeader={prefs.setIsEditingHeader}
          handleDataLoaded={handleDataLoaded}
          handleExport={handleExport}
          handleExportImage={handleExportImage}
          handleExportPDF={handleExportPDF}
          handlePrint={handlePrint}
          handleReset={handleReset}
          onLogout={onLogout}
        />

        <TranslationOverlay progress={translationProgress} />
      </div>
    </div>
  );
};

export default function App() {
  const { user, authLoading, handleLogin, handleLogout } = useAuthSession();

  if (authLoading) {
      return (
          <div className="h-screen w-full flex flex-col gap-4 items-center justify-center bg-gray-50 dark:bg-slate-900">
              <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse text-sm">Authenticating...</p>
          </div>
      );
  }

  return (
    <ReactFlowProvider>
      <ErrorBoundary>
        {user ? (
          <FamilyTreeFlow user={user} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </ErrorBoundary>
    </ReactFlowProvider>
  );
}
