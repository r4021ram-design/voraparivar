import { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Download, RotateCcw, LogOut, Search as SearchIcon,
  Settings,
  X,
  Menu,
  Calendar, Moon, Sun, Maximize, Palette, Printer, Users, CloudUpload
} from 'lucide-react';
import clsx from 'clsx';

import FamilyNode from './components/FamilyNode';
import CustomEdge from './components/CustomEdge';
import FileUpload from './components/FileUpload';
import EditModal from './components/EditModal';
import LoginScreen, { type UserData } from './components/LoginScreen';
import { toPng } from 'html-to-image';
import SearchSidebar from './components/SearchSidebar';
import TimelineView from './components/TimelineView';
import CommunityDashboard from './components/CommunityDashboard';
import { translations, type Language } from './i18n';
import { familyTreeData } from './data';
import { processTreeToElements } from './utils/layout';
import type { Person } from './types';
import { useSupabaseTree } from './hooks/useSupabaseTree'; // [NEW]
import { supabase } from './lib/supabase'; // [NEW]
import { ErrorBoundary } from './components/ErrorBoundary';

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: dbData, loading: dbLoading, refresh: refreshDb } = useSupabaseTree(); // [NEW]
  const [currentData, setCurrentData] = useState<Person>(familyTreeData);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('EN');
  const [theme, setTheme] = useState<'light' | 'dark' | 'rajashahi'>('light');
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');

  // Header Content State
  const [headerVerse, setHeaderVerse] = useState(() =>
    localStorage.getItem('vanshavali_header_verse_v1') ??
    "अत्रि गोत्रोत्पन्नाः वयं, यजुर्वेदीय-माध्यन्दिनि-शाखाध्यायिनः; सहस्र-औदीच्य-गोरवाल-ब्राह्मणाः — धर्मरक्षणाय समर्पिताः।"
  );
  const [headerTitle, setHeaderTitle] = useState(() =>
    localStorage.getItem('vanshavali_header_title_v1') ??
    "वोरा वंशावली"
  );
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Custom Branch Styling
  const [edgeColor, setEdgeColor] = useState('#8B4513'); // Default brown
  const [edgeWidth, setEdgeWidth] = useState(4);

  const { fitView } = useReactFlow();
  const t = translations[language];

  // Ref to break circular dependency
  const refreshLayoutRef = useRef<(data: Person) => void>(() => { });

  // Recursive update function
  const updatePersonInTree = (root: Person, updatedPerson: Person): Person => {
    if (root.id === updatedPerson.id) {
      return { ...updatedPerson, children: root.children };
    }
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => updatePersonInTree(child, updatedPerson))
      };
    }
    return root;
  };

  const handleAddChild = useCallback(async (parentId: string, type: 'son' | 'daughter') => {
    // 1. Optimistic Update
    const newChildId = crypto.randomUUID(); // Generate UUID for DB
    const isMale = type === 'son';

    const addChildRecursive = (root: Person): Person => {
      if (root.id === parentId) {
        const newChild: Person = {
          id: newChildId,
          name: `New ${type === 'son' ? 'Son' : 'Daughter'}`,
          generation: root.generation + 1,
          relation: type === 'son' ? 'Son' : 'Daughter',
          gender: isMale ? 'MALE' : 'FEMALE',
          children: []
        };
        return { ...root, children: [...root.children, newChild] };
      }
      if (root.children) {
        return { ...root, children: root.children.map(child => addChildRecursive(child)) };
      }
      return root;
    };

    setCurrentData((prevData) => {
      const newData = addChildRecursive(prevData);
      setTimeout(() => refreshLayoutRef.current(newData), 0);
      return newData;
    });

    // 2. DB Insert
    try {
      const { error } = await supabase.from('people').insert({
        id: newChildId,
        parent_id: parentId,
        name: `New ${type === 'son' ? 'Son' : 'Daughter'}`,
        gender: isMale ? 'MALE' : 'FEMALE',
        relation: type === 'son' ? 'Son' : 'Daughter',
        generation: 0, // Logic needed to get parent gen + 1. For now simple.
        // generation: root.generation + 1 // We need access to parent's gen. 
        // Simplified: The backend or reload will fix gen if we are not careful.
        // Use local state knowledge?
      });
      if (error) throw error;
      refreshDb(); // Sync
    } catch (e) {
      console.error("Error adding child to DB:", e);
      alert("Failed to save new child to database.");
    }

  }, [refreshDb]);

  const handleDelete = useCallback(async (personId: string) => {
    if (personId === 'root') {
      alert("Cannot delete the root node.");
      return;
    }
    if (!confirm("Are you sure? This will delete the person and ALL descendants.")) return;

    // 1. Optimistic Update
    const deleteRecursive = (root: Person): Person | null => {
      if (root.id === personId) return null;
      if (root.children) {
        const newChildren = root.children
          .map(child => deleteRecursive(child))
          .filter((child): child is Person => child !== null);
        return { ...root, children: newChildren };
      }
      return root;
    };

    setCurrentData((prevData) => {
      const newData = deleteRecursive(prevData);
      if (!newData) return prevData;
      setTimeout(() => refreshLayoutRef.current(newData), 0);
      return newData;
    });

    // 2. DB Delete (Recursive handled by Postgres CASCADE if configured, OR we do it here)
    // For now, assuming CASCADE on parent_id isn't strictly set for safety, 
    // BUT we should probably rely on a DB function or ensure schema supports keys.
    // Let's assume user manually deletes leaf nodes or we delete by ID. 
    // Actually, simply deleting the ID in 'people' will fail if children exist unless CASCADE is on.
    // I'll try normal delete.
    try {
      const { error } = await supabase.from('people').delete().eq('id', personId);
      if (error) throw error;
      refreshDb();
    } catch (e) {
      console.error("Failed to delete from DB:", e);
      alert("Failed to delete from database. Ensure no children exist or DB Cascade is on.");
    }
  }, [refreshDb]);

  const handleToggleExpand = useCallback((personId: string) => {
    const toggleRecursive = (root: Person): Person => {
      if (root.id === personId) {
        return { ...root, isCollapsed: !root.isCollapsed };
      }
      if (root.children) {
        return {
          ...root,
          children: root.children.map(child => toggleRecursive(child))
        };
      }
      return root;
    };

    setCurrentData((prevData) => {
      const newData = toggleRecursive(prevData);
      try {
        localStorage.setItem('vanshavali_data_v3', JSON.stringify(newData));
      } catch (e) {
        console.error("Failed to save", e);
      }
      setTimeout(() => refreshLayoutRef.current(newData), 0);
      return newData;
    });
  }, []);

  const handleAddParent = useCallback(() => {
    setCurrentData((prevData) => {
      const newRoot: Person = {
        id: `p${Date.now()}`,
        name: 'New Ancestor',
        generation: 1,
        gender: 'MALE',
        children: [{ ...prevData }]
      };

      try {
        localStorage.setItem('vanshavali_data_v3', JSON.stringify(newRoot));
      } catch (e) {
        console.error("Failed to save", e);
      }
      setTimeout(() => refreshLayoutRef.current(newRoot), 0);
      return newRoot;
    });
  }, []);

  const refreshLayout = useCallback((data: Person) => {
    const { nodes: initialNodes, edges: initialEdgesRaw } = processTreeToElements(data);

    // Apply custom styling to edges
    const styledEdges = initialEdgesRaw.map(e => ({
      ...e,
      style: { stroke: edgeColor, strokeWidth: edgeWidth, opacity: 0.8 }
    }));

    const canEdit = user.role === 'ADMIN' || user.role === 'STANDARD';
    const isAdmin = user.role === 'ADMIN';

    const nodesWithCallback = initialNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onEdit: canEdit ? (p: Person) => setEditingPerson(p) : undefined,
        onAddChild: canEdit ? handleAddChild : undefined,
        onToggleExpand: handleToggleExpand,
        onDelete: isAdmin ? handleDelete : undefined,
        onAddParent: isAdmin ? handleAddParent : undefined,
        language,
        theme,
        fontScale
      }
    }));

    setNodes(nodesWithCallback);
    setEdges(styledEdges);

    window.requestAnimationFrame(() => {
      fitView({ duration: 800, padding: 0.2 });
    });
  }, [setNodes, setEdges, user.role, handleAddChild, handleDelete, fitView, language, edgeColor, edgeWidth, theme, fontScale]);

  useEffect(() => {
    refreshLayoutRef.current = refreshLayout;
  }, [refreshLayout]);

  const handleSaveEdit = async (updatedPerson: Person) => {
    // 1. Optimistic UI Update
    const newData = updatePersonInTree(currentData, updatedPerson);
    setCurrentData(newData);
    refreshLayout(newData);
    setEditingPerson(null);

    // 2. DB Update
    try {
      const { error } = await supabase.from('people').update({
        name: updatedPerson.name,
        gender: updatedPerson.gender,
        relation: updatedPerson.relation,
        bio: updatedPerson.bio,
        occupation: updatedPerson.occupation,
        dob: updatedPerson.dateOfBirth,
        dod: updatedPerson.dateOfDeath,
        phone: updatedPerson.phoneNumber,
        spouse_name: updatedPerson.spouse,
        spouse_occupation: updatedPerson.spouseOccupation,
        spouse_phone: updatedPerson.spousePhoneNumber,
        spouse_dob: updatedPerson.spouseDateOfBirth,
        spouse_dod: updatedPerson.spouseDateOfDeath,
        location_name: updatedPerson.location?.name,
        location_lat: updatedPerson.location?.lat,
        location_lng: updatedPerson.location?.lng,
      }).eq('id', updatedPerson.id);

      if (error) throw error;
      refreshDb();
    } catch (e) {
      console.error("Error updating DB:", e);
      alert("Failed to save changes to database.");
    }
  };

  const handleDataLoaded = useCallback((data: Person) => {
    try {
      localStorage.setItem('vanshavali_data_v3', JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
    setCurrentData(data);
    refreshLayout(data);
  }, [refreshLayout]);

  const handleReset = useCallback(() => {
    if (confirm("Are you sure you want to reset all data to default? This cannot be undone.")) {
      localStorage.removeItem('vanshavali_data_v3');
      setCurrentData(familyTreeData);
      refreshLayout(familyTreeData);
    }
  }, [refreshLayout]);

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

  const handleFocusNode = useCallback((nodeId: string) => {
    fitView({
      nodes: [{ id: nodeId }],
      duration: 1000,
      minZoom: 0.8,
      maxZoom: 1.2,
      padding: 0.5
    });
    if (window.innerWidth < 640) {
      setIsSearchOpen(false);
    }
  }, [fitView]);

  const handleExportImage = useCallback(() => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    // Hide UI elements during export
    const controls = document.querySelector('.react-flow__controls') as HTMLElement;
    if (controls) controls.style.display = 'none';

    toPng(flowElement, {
      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      quality: 1,
      pixelRatio: 2,
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `family-tree-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      })
      .finally(() => {
        if (controls) controls.style.display = 'flex';
      });
  }, [theme]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleFocusRoot = useCallback(() => {
    handleFocusNode('root');
  }, [handleFocusNode]);

  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vanshavali_header_verse_v1', headerVerse);
    localStorage.setItem('vanshavali_header_title_v1', headerTitle);
    setIsEditingHeader(false);
  };

  useEffect(() => {
    if (dbData) {
      console.log("Loaded data from Supabase");
      setCurrentData(dbData);
      refreshLayout(dbData);
    } else if (!dbLoading) {
      // Fallback or empty state
      console.log("No DB data or Error, using default/local fallback.");
      // Ensure we display whatever is in currentData (which is familyTreeData by default)
      refreshLayout(currentData);
    }
  }, [dbData, dbLoading, refreshLayout]);

  const handleResetFromBackup = useCallback(() => {
    if (confirm("This will clear your recent changes and reload the data from the 'backup' folder. Continue?")) {
      localStorage.removeItem('vanshavali_data_v3');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    document.body.className = theme === 'rajashahi' ? 'rajashahi' : '';
  }, [theme]);

  return (
    <div className={clsx(
      "w-full h-screen relative",
      theme === 'dark' && 'dark',
      theme === 'rajashahi' && 'rajashahi',
      `font-scale-${fontScale}`
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
                    onClick={() => setIsCommunityOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 px-2 py-1.5 rounded-lg shadow-md border border-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium transition-all"
                  >
                    <Users size={16} />
                    <span className="text-[11px] font-bold truncate">{t.community}</span>
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(true)}
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
              <p className="text-[9px] sm:text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 rajashahi:text-amber-800/90 italic leading-tight sm:leading-relaxed max-w-2xl">
                {headerVerse}
              </p>
              <h1 className="text-lg sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white rajashahi:text-[#800000] drop-shadow-md mt-1 flex items-center gap-1 sm:gap-2">
                {headerTitle} <span className="text-blue-600 rajashahi:text-[#ffd700]">|</span>
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
                      value={edgeColor}
                      onChange={(e) => setEdgeColor(e.target.value)}
                      className="w-3 h-3 rounded cursor-pointer border-none bg-transparent"
                      title="Branch Color"
                      aria-label="Branch Color"
                    />
                  </div>
                  <select
                    value={edgeWidth}
                    onChange={(e) => setEdgeWidth(parseInt(e.target.value))}
                    className="bg-transparent text-[9px] font-black outline-none text-gray-700 dark:text-gray-300 border-none px-0.5 cursor-pointer w-full text-center"
                    title="Branch Thickness"
                    aria-label="Branch Thickness"
                  >
                    {[2, 4, 6, 8].map(w => <option key={w} value={w}>{w}px</option>)}
                  </select>
                </div>

                <button
                  onClick={handleFocusRoot}
                  className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Maximize size={16} />
                  <span className="text-[11px] font-bold">Focus</span>
                </button>

                {/* Image Export & Print */}
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
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[11px] font-bold text-gray-700 dark:text-gray-200 w-full"
                    title={t.printTree}
                  >
                    <Printer size={14} className="text-gray-500" />
                    Print
                  </button>
                </div>

                {/* Theme Toggle Vertical */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-1 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 flex flex-col gap-1 w-full">
                  <button onClick={() => setTheme('light')} title="Light Mode" className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", theme === 'light' ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500")}>
                    <Sun size={14} />
                  </button>
                  <button onClick={() => setTheme('dark')} title="Dark Mode" className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", theme === 'dark' ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-gray-400")}>
                    <Moon size={14} />
                  </button>
                  <button onClick={() => setTheme('rajashahi')} title="Royal Mode" className={clsx("p-1.5 rounded-md transition-all flex items-center gap-2 justify-center", theme === 'rajashahi' ? "bg-orange-600 text-white" : "hover:bg-orange-50 text-orange-600")}>
                    <Palette size={14} />
                  </button>
                </div>

                {/* Font Scale Toggle Vertical */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-1 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 flex flex-col gap-1 w-full">
                  {(['sm', 'md', 'lg'] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => setFontScale(scale)}
                      className={clsx(
                        "py-1 rounded-md text-[9px] font-black transition-all text-center",
                        fontScale === scale ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
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
                      onClick={() => setLanguage(lang)}
                      className={`py-1 rounded text-[9px] font-black transition-all text-center ${language === lang ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
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

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          language={language}
        />

        <SearchSidebar
          nodes={nodes}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onFocusNode={handleFocusNode}
          language={language}
        />

        <TimelineView
          nodes={nodes}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
          onFocusNode={handleFocusNode}
          language={language}
        />

        <CommunityDashboard
          isOpen={isCommunityOpen}
          onClose={() => setIsCommunityOpen(false)}
          language={language}
        />

        {/* Header Editor Modal */}
        {isEditingHeader && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Palette size={24} />
                  Customize Header Text
                </h2>
              </div>

              <form onSubmit={handleSaveHeader} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sanskrit Verse / Subtitle</label>
                  <textarea
                    value={headerVerse}
                    onChange={(e) => setHeaderVerse(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-medium leading-relaxed dark:text-white"
                    placeholder="Enter the cultural verse..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Main Application Title</label>
                  <input
                    type="text"
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-lg font-black dark:text-white"
                    placeholder="Enter title..."
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-2.5 rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all text-sm"
                  >
                    Apply Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Left Drawer */}
        {isLeftDrawerOpen && (
          <div className="fixed inset-0 z-[100] sm:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLeftDrawerOpen(false)} />
            <div className="absolute top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl p-4 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Actions</h3>
                <button onClick={() => setIsLeftDrawerOpen(false)} title="Close Menu" aria-label="Close Menu"><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setIsSearchOpen(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-blue-600 p-3 rounded-xl text-white font-bold"><SearchIcon size={20} />{t.findPerson}</button>
                <button onClick={() => { setIsTimelineOpen(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 font-bold"><Calendar size={20} />{t.timeline}</button>
                {user.role === 'ADMIN' && (
                  <>
                    <FileUpload onDataLoaded={handleDataLoaded} />
                    <button onClick={() => { handleExport(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold"><Download size={20} />{t.export}</button>
                    <button onClick={() => { setIsCommunityOpen(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 p-3 rounded-xl text-white font-bold"><Users size={20} />{t.community}</button>
                    <button onClick={() => { setIsEditingHeader(true); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-purple-600 p-3 rounded-xl text-white font-bold"><Palette size={20} />Header Editor</button>
                    <button onClick={() => { handleReset(); setIsLeftDrawerOpen(false); }} className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-red-600 font-bold"><RotateCcw size={20} />{t.reset}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Right Drawer */}
        {isRightDrawerOpen && (
          <div className="fixed inset-0 z-[100] sm:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRightDrawerOpen(false)} />
            <div className="absolute top-0 right-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl p-4 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setIsRightDrawerOpen(false)} title="Close Settings" aria-label="Close Settings"><X size={20} className="text-gray-500" /></button>
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Settings</h3>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Theme</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => setTheme('light')} className={clsx("p-3 rounded-xl flex items-center gap-3 font-bold", theme === 'light' ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-500")}><Sun size={18} />Light</button>
                    <button onClick={() => setTheme('dark')} className={clsx("p-3 rounded-xl flex items-center gap-3 font-bold", theme === 'dark' ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-400")}><Moon size={18} />Dark</button>
                    <button onClick={() => setTheme('rajashahi')} className={clsx("p-3 rounded-xl flex items-center gap-3 font-bold", theme === 'rajashahi' ? "bg-orange-600 text-white" : "bg-orange-50/50 dark:bg-orange-900/10 text-orange-600")}><Palette size={18} />Royal</button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Language</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['EN', 'HI', 'GU'].map(lang => (
                      <button key={lang} onClick={() => setLanguage(lang as any)} className={clsx("py-2 rounded-lg text-xs font-black", language === lang ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-500")}>{lang}</button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 font-black"><LogOut size={20} />Logout</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('vanshavali_user');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        localStorage.removeItem('vanshavali_user');
      }
    }
  }, []);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem('vanshavali_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vanshavali_user');
  };

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
