import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Palette, Menu
} from 'lucide-react';
import clsx from 'clsx';

import FamilyNode from './components/FamilyNode';
import CustomEdge from './components/CustomEdge';
import EditModal from './components/EditModal';
import ViewPersonModal from './components/ViewPersonModal';
import LoginScreen from './components/LoginScreen';
import { toPng } from 'html-to-image';
import SearchSidebar from './components/SearchSidebar';
import TimelineView from './components/TimelineView';
import CommunityDashboard from './components/CommunityDashboard';
import Breadcrumbs from './components/Breadcrumbs';
import TopNavigationDock from './components/TopNavigationDock';
import CommandPalette from './components/CommandPalette';
import KinshipModal from './components/KinshipModal';
import { translations } from './i18n';
import { loadFamilyTreeData } from './data';
import type { Person } from './types';
import { useFamilyTree } from './hooks/useFamilyTree';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import HeaderEditor from './components/HeaderEditor';
import TranslationOverlay from './components/TranslationOverlay';
import NavigationDrawers from './components/NavigationDrawers';
import {
  togglePersonCollapse,
  getTreeStatistics,
  setTreeCollapseByGeneration,
  expandAllTree,
  collapseToRoot
} from './features/family-tree/utils/treeTransforms';
import { useAuthSession } from './features/auth/hooks/useAuthSession';
import { useTreePreferences } from './features/family-tree/hooks/useTreePreferences';
import { useTreeSelection } from './features/family-tree/hooks/useTreeSelection';
import { useTreeLayout } from './features/family-tree/hooks/useTreeLayout';
import type { UserData } from './types/auth';
import { AdminManagementModal } from './features/admin/components/AdminManagementModal';
import { fetchFamilies, DEFAULT_FAMILY_ID } from './features/families/services/familyService';
import type { Family } from './features/families/types';

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
  // Multi-Family State
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(
    user.family_id || DEFAULT_FAMILY_ID
  );
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    fetchFamilies().then(setFamilies);
  }, []);

  // Sync familyId if user profile has a specific family assigned
  useEffect(() => {
    if (user.role !== 'ADMIN' && user.family_id) {
      setSelectedFamilyId(user.family_id);
    }
  }, [user.family_id, user.role]);

  const {
    currentData,
    setCurrentData,
    translationProgress,
    handleAddChild,
    handleDelete,
    handleSaveEdit,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    refreshDb
  } = useFamilyTree(user.role, selectedFamilyId);

  // UI state
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewPerson, setViewPerson] = useState<Person | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKinshipModalOpen, setIsKinshipModalOpen] = useState(false);
  const [kinshipPersonA, setKinshipPersonA] = useState<Person | null>(null);
  const [kinshipPersonB, setKinshipPersonB] = useState<Person | null>(null);
  const [currentGenDepth, setCurrentGenDepth] = useState<number>(0);

  // Extracted hooks
  const prefs = useTreePreferences();
  const { selectedNodeId, highlightedPath, setHighlightedPath, focusNode, focusRoot, clearSelection } = useTreeSelection(currentData);

  const t = translations[prefs.language];

  // Tree statistics
  const treeStats = useMemo(() => getTreeStatistics(currentData), [currentData]);

  const refreshLayoutRef = useRef<(data: Person, skipFitView?: boolean) => void>(() => {});

  const handleToggleExpand = useCallback((personId: string) => {
    setCurrentData((prevData) => {
      const newData = togglePersonCollapse(prevData, personId);
      setTimeout(() => refreshLayoutRef.current(newData), 0);
      return newData;
    });
  }, [setCurrentData]);

  const handleSetGenDepth = useCallback((depth: number) => {
    setCurrentGenDepth(depth);
    setCurrentData((prev) => {
      let updated: Person;
      if (depth === 0) {
        updated = expandAllTree(prev);
      } else if (depth === 1) {
        updated = collapseToRoot(prev);
      } else {
        updated = setTreeCollapseByGeneration(prev, depth);
      }
      setTimeout(() => refreshLayoutRef.current(updated), 0);
      return updated;
    });
  }, [setCurrentData]);

  const handleOpenKinshipForPerson = useCallback((person: Person) => {
    setKinshipPersonA(person);
    setKinshipPersonB(null);
    setIsKinshipModalOpen(true);
  }, []);

  const handleHighlightLineage = useCallback((path: string[]) => {
    setHighlightedPath(path);
    if (path.length > 0) {
      focusNode(path[0]);
    }
  }, [setHighlightedPath, focusNode]);

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

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    refreshLayout,
  } = useTreeLayout({
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
    onKinshipSelect: handleOpenKinshipForPerson,
  });

  useEffect(() => {
    refreshLayoutRef.current = refreshLayout;
  }, [refreshLayout]);

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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
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
      refreshLayout(currentData, true);
    }
  }, [prefs.language, prefs.theme, prefs.fontScale, prefs.isPrivacyMode, refreshLayout, currentData]);

  // Initial layout when data arrives
  useEffect(() => {
    if (currentData && currentData.name !== 'Loading…') {
      refreshLayout(currentData);
    }
  }, [currentData, refreshLayout]);

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
    refreshLayout(data);
  }, [setCurrentData, refreshLayout]);

  const handleReset = useCallback(async () => {
    if (confirm("Reset to default?")) {
      const defaultData = await loadFamilyTreeData();
      setCurrentData(defaultData);
      refreshLayout(defaultData);
    }
  }, [setCurrentData, refreshLayout]);

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

    toPng(flowElement, {
      backgroundColor: prefs.theme === 'rajashahi' ? '#fff9f0' : prefs.theme === 'dark' ? '#020617' : '#ffffff',
      quality: 1,
      pixelRatio: 2,
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `vanshavali-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    }).catch((err) => {
      console.error('Error generating image:', err);
      alert('Failed to generate image.');
    });
  }, [prefs.theme]);

  const handleExportPDF = useCallback(async () => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    try {
      const { jsPDF } = await import('jspdf');
      const dataUrl = await toPng(flowElement, {
        backgroundColor: prefs.theme === 'rajashahi' ? '#fff9f0' : prefs.theme === 'dark' ? '#020617' : '#ffffff',
        quality: 1,
        pixelRatio: 2,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`vanshavali-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF.');
    }
  }, [prefs.theme]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  return (
    <div className={clsx(
      "w-full h-screen relative overflow-hidden",
      prefs.theme === 'dark' && 'dark',
      prefs.theme === 'rajashahi' && 'rajashahi',
      `font-scale-${prefs.fontScale}`
    )}>
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rajashahi:bg-[#fff9f0] transition-colors duration-500">
        
        {/* Modern Glassmorphic Top Floating Island */}
        <TopNavigationDock
          stats={treeStats}
          user={user}
          language={prefs.language}
          setLanguage={prefs.setLanguage}
          theme={prefs.theme}
          setTheme={prefs.setTheme}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenKinship={() => {
            setKinshipPersonA(null);
            setKinshipPersonB(null);
            setIsKinshipModalOpen(true);
          }}
          onToggleTimeline={() => setIsTimelineOpen(prev => !prev)}
          onFocusRoot={focusRoot}
          onSetGenDepth={handleSetGenDepth}
          currentGenDepth={currentGenDepth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportJSON={handleExport}
          onExportImage={handleExportImage}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
          onReset={handleReset}
          onLogout={onLogout}
          families={families}
          currentFamilyId={selectedFamilyId}
          onSelectFamily={(famId) => setSelectedFamilyId(famId)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
        />

        {/* Mobile Left Drawer Trigger */}
        <div className="sm:hidden fixed bottom-4 left-4 z-40">
          <button
            onClick={() => setIsLeftDrawerOpen(true)}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Cultural Heading Banner */}
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 flex flex-col items-center text-center pointer-events-none z-10 px-4 w-full max-w-2xl animate-in fade-in duration-500">
          <p className="hidden sm:block text-[10px] sm:text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 rajashahi:text-amber-800/90 italic leading-tight max-w-xl">
            {prefs.headerVerse}
          </p>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white rajashahi:text-[#800000] drop-shadow-sm mt-0.5 flex items-center gap-1.5 pointer-events-auto">
            <span>
              {selectedFamilyId !== DEFAULT_FAMILY_ID && families.find(f => f.id === selectedFamilyId)
                ? `${families.find(f => f.id === selectedFamilyId)?.name} વંશાવલી`
                : prefs.headerTitle}
            </span>
            <span className="hidden sm:inline text-blue-600 rajashahi:text-[#ffd700]">|</span>
            {user.role === 'ADMIN' && (
              <button
                onClick={() => prefs.setIsEditingHeader(true)}
                className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
                title="Edit Header Title & Verse"
              >
                <Palette size={14} />
              </button>
            )}
          </h1>
        </div>

        {/* Ancestor Lineage Breadcrumbs */}
        <div className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 z-20">
          <Breadcrumbs
            currentNodeId={selectedNodeId}
            treeData={currentData}
            onNavigate={handleFocusNode}
            language={prefs.language}
          />
        </div>

        {/* Subtle Bottom-Left Branch Styler (Color & Width) */}
        <div className="absolute bottom-5 left-16 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/60 dark:border-slate-700/60 shadow-md text-xs font-bold">
          <span className="text-[10px] text-gray-400 uppercase tracking-tight">Branch:</span>
          <input
            type="color"
            value={prefs.edgeColor}
            onChange={(e) => prefs.setEdgeColor(e.target.value)}
            className="w-4 h-4 rounded cursor-pointer border-none bg-transparent"
            title="Branch Color"
            aria-label="Branch Color"
          />
          <select
            value={prefs.edgeWidth}
            onChange={(e) => prefs.setEdgeWidth(parseInt(e.target.value))}
            className="bg-transparent text-xs font-bold outline-none text-gray-700 dark:text-gray-300 border-none cursor-pointer"
            title="Branch Thickness"
            aria-label="Branch Thickness"
          >
            {[2, 4, 6, 8].map(w => <option key={w} value={w}>{w}px</option>)}
          </select>
        </div>

        {/* Main Interactive Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          <Controls position="bottom-left" />
          <MiniMap zoomable pannable position="bottom-right" />
        </ReactFlow>

        {/* Modals and Drawers */}
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
            onFocusPerson={handleFocusNode}
            onOpenKinshipWith={handleOpenKinshipForPerson}
          />
        )}

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          nodes={nodes}
          onFocusNode={handleFocusNode}
          language={prefs.language}
          theme={prefs.theme}
        />

        <KinshipModal
          isOpen={isKinshipModalOpen}
          onClose={() => setIsKinshipModalOpen(false)}
          treeRoot={currentData}
          initialPersonA={kinshipPersonA}
          initialPersonB={kinshipPersonB}
          onHighlightLineage={handleHighlightLineage}
          language={prefs.language}
          theme={prefs.theme}
        />

        <SearchSidebar
          nodes={nodes}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onFocusNode={handleFocusNode}
          language={prefs.language}
        />

        <TimelineView
          nodes={nodes}
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

        {isAdminModalOpen && (
          <AdminManagementModal
            isOpen={isAdminModalOpen}
            onClose={() => {
              setIsAdminModalOpen(false);
              fetchFamilies().then(setFamilies);
            }}
            currentFamilyId={selectedFamilyId}
            onSelectFamily={(famId) => {
              setSelectedFamilyId(famId);
              fetchFamilies().then(setFamilies);
            }}
          />
        )}
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
