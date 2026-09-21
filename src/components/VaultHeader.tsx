import React from 'react';
import {
  FolderArchive,
  Plus,
  Upload,
  RefreshCw,
  LayoutGrid,
  FileCode,
  Bot,
  Target,
  Rocket,
  CheckCircle2,
  Sparkles,
  HardDrive,
  CloudCheck,
  CloudUpload,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { VaultFile, ActiveTab } from '../types';
import { exportVaultAsZip } from '../utils/storage';
import { getTaskProgress } from '../utils/markdownParser';

interface VaultHeaderProps {
  files: VaultFile[];
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewFileModal: () => void;
  onImportFiles: (files: FileList) => void;
  onResetVault: () => void;
  isExportingZip: boolean;
  setIsExportingZip: (v: boolean) => void;
  googleUser: User | null;
  onOpenDriveModal: () => void;
  onRefreshDrive?: () => void;
  isRefreshingDrive?: boolean;
  isMockMode?: boolean;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  files,
  activeTab,
  onSelectTab,
  onOpenNewFileModal,
  onImportFiles,
  onResetVault,
  isExportingZip,
  setIsExportingZip,
  googleUser,
  onOpenDriveModal,
  onRefreshDrive,
  isRefreshingDrive = false,
  isMockMode = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Compute vault stats
  const goalsCount = files.filter(
    (f) => f.folder === 'goals' || f.folder.startsWith('goals/') || f.frontmatter.category === 'goals'
  ).length;
  const projectsCount = files.filter(
    (f) => f.folder === 'projects' || f.folder.startsWith('projects/') || f.frontmatter.category === 'projects'
  ).length;
  const skillsCount = files.filter(
    (f) => f.folder === 'skills' || f.folder.startsWith('skills/') || f.frontmatter.category === 'skills'
  ).length;
  const archiveCount = files.filter(
    (f) => f.folder === 'archive' || f.folder.startsWith('archive/') || f.frontmatter.category === 'archive'
  ).length;

  let totalTasks = 0;
  let completedTasks = 0;
  for (const f of files) {
    const progress = getTaskProgress(f.content);
    totalTasks += progress.total;
    completedTasks += progress.completed;
  }
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      await exportVaultAsZip(files);
    } catch (err) {
      console.error('Failed to export vault:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Stats */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <span className="font-mono">.md</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-stone-900 tracking-tight">
                Markdown Life & Skills Vault
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {files.length} markdown files
              </span>
              {isMockMode && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 border border-amber-300 flex items-center gap-1"
                  title="Running in local browser storage mode (mock.html)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Offline Mock
                </span>
              )}
            </div>
            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5 font-sans">
              <span className="inline-flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <strong className="text-stone-800 font-semibold">{goalsCount}</strong> Goals
              </span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Rocket className="w-3.5 h-3.5 text-blue-600" />
                <strong className="text-stone-800 font-semibold">{projectsCount}</strong> Projects
              </span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                <strong className="text-stone-800 font-semibold">{skillsCount}</strong> Agent Skills
              </span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
                <strong className="text-stone-800 font-semibold">{completedTasks}/{totalTasks}</strong> Tasks ({taskPct}%)
              </span>
              {archiveCount > 0 && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="inline-flex items-center gap-1 text-stone-400">
                    <FolderArchive className="w-3.5 h-3.5 text-stone-400" />
                    <strong className="text-stone-600 font-semibold">{archiveCount}</strong> Archived
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 self-start md:self-auto">
          <button
            type="button"
            id="tab-editor"
            onClick={() => onSelectTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'editor'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            File Editor
          </button>
          <button
            type="button"
            id="tab-matrix"
            onClick={() => onSelectTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'matrix'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Life Matrix
          </button>
          <button
            type="button"
            id="tab-skills"
            onClick={() => onSelectTab('skills-hub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'skills-hub'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Agent Skills Lab
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Google Drive Status & Modal Trigger (completely omitted in mock.html offline mode) */}
          {!isMockMode && (
            <>
              <button
                type="button"
                id="btn-google-drive-header"
                onClick={onOpenDriveModal}
                title={googleUser ? `Google Drive Connected: ${googleUser.email}` : 'Connect Google Drive'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  googleUser
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-blue-400'
                }`}
              >
                {googleUser?.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="Google"
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full border border-blue-400"
                  />
                ) : (
                  <HardDrive className={`w-3.5 h-3.5 ${googleUser ? 'text-blue-600' : 'text-stone-500'}`} />
                )}
                <span>
                  {googleUser ? 'Google Drive' : 'Connect Drive'}
                </span>
                {googleUser && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" title="Connected" />
                )}
              </button>

              {/* Refresh files from Google Drive button */}
              {googleUser && onRefreshDrive && (
                <button
                  type="button"
                  id="btn-refresh-drive"
                  onClick={onRefreshDrive}
                  disabled={isRefreshingDrive}
                  title="Refresh and sync files from Google Drive"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${isRefreshingDrive ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh Drive</span>
                </button>
              )}
            </>
          )}

          {/* Hidden File Input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            id="btn-import-md"
            onClick={() => fileInputRef.current?.click()}
            title="Import .md files"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            Import .md
          </button>

          <button
            type="button"
            id="btn-export-zip"
            disabled={isExportingZip}
            onClick={handleExportZip}
            title="Export all markdown files as a .zip vault"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <FolderArchive className="w-3.5 h-3.5 text-stone-500" />
            {isExportingZip ? 'Packing ZIP...' : 'Export .ZIP'}
          </button>

          <button
            type="button"
            id="btn-reset-vault"
            onClick={onResetVault}
            title="Reload initial template vault"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            id="btn-new-file"
            onClick={onOpenNewFileModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New File
          </button>
        </div>
      </div>
    </header>
  );
};
