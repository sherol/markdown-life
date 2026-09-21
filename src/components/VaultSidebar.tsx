import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Target,
  Rocket,
  Bot,
  Search,
  Plus,
  Trash2,
  Download,
  Copy,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { VaultFile, FileCategory } from '../types';
import { getTaskProgress } from '../utils/markdownParser';
import { exportSingleFile } from '../utils/storage';

interface VaultSidebarProps {
  files: VaultFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onDuplicateFile: (file: VaultFile) => void;
  onQuickNewFileInFolder: (folder: string) => void;
  onDropFiles: (fileList: FileList) => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onDeleteFile,
  onDuplicateFile,
  onQuickNewFileInFolder,
  onDropFiles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | FileCategory>('all');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  // Group files by folder, ensuring standard vault folders always appear
  const defaultFolders = ['goals', 'projects', 'skills', 'notes'];
  const fileFolders = files.map((f) => f.folder || 'notes');
  const folders = Array.from(new Set([...defaultFolders, ...fileFolders])).sort();

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  // Filtered files
  const filteredFiles = files.filter((file) => {
    const matchesCategory =
      activeCategoryFilter === 'all' ||
      file.folder === activeCategoryFilter ||
      file.frontmatter.category === activeCategoryFilter;

    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = file.name.toLowerCase().includes(q);
    const matchesTitle = file.frontmatter.title?.toLowerCase().includes(q);
    const matchesTags = file.frontmatter.tags?.some((t) => t.toLowerCase().includes(q));
    const matchesContent = file.content.toLowerCase().includes(q);

    return matchesName || matchesTitle || matchesTags || matchesContent;
  });

  const getCategoryIcon = (folder: string) => {
    switch (folder) {
      case 'goals':
        return <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'projects':
        return <Rocket className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'skills':
        return <Bot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'notes':
      default:
        return <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />;
    }
  };

  const getFolderLabel = (folder: string) => {
    switch (folder) {
      case 'goals':
        return 'Goals & OKRs';
      case 'projects':
        return 'Projects & Initiatives';
      case 'skills':
        return 'Agent Skills';
      case 'notes':
        return 'Notes & Rituals';
      default:
        return folder.charAt(0).toUpperCase() + folder.slice(1);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <aside
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full md:w-80 lg:w-88 border-r border-stone-200 bg-stone-50/60 flex flex-col shrink-0 h-full select-none ${
        isDragOver ? 'ring-2 ring-stone-900 bg-stone-100' : ''
      }`}
    >
      {/* Top Search Bar */}
      <div className="p-3 border-b border-stone-200 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="vault-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, tags, or content..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-100 hover:bg-stone-150 focus:bg-white rounded-lg border border-transparent focus:border-stone-300 focus:outline-hidden transition-all text-stone-900 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'goals', label: 'Goals' },
              { id: 'projects', label: 'Projects' },
              { id: 'skills', label: 'Skills' },
              { id: 'notes', label: 'Notes' },
            ] as const
          ).map((tab) => {
            const count =
              tab.id === 'all'
                ? files.length
                : files.filter((f) => f.folder === tab.id).length;
            const isSelected = activeCategoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`filter-${tab.id}`}
                onClick={() => setActiveCategoryFilter(tab.id)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap font-medium transition-colors ${
                  isSelected
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label} <span className="opacity-70 text-[10px] ml-0.5">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {isDragOver && (
          <div className="p-4 border-2 border-dashed border-stone-400 rounded-lg text-center text-xs text-stone-600 bg-white font-medium">
            Drop markdown files here to import into vault
          </div>
        )}

        {folders.map((folder) => {
          const folderFiles = filteredFiles.filter((f) => f.folder === folder);
          if (folderFiles.length === 0 && activeCategoryFilter !== 'all' && activeCategoryFilter !== folder) {
            return null;
          }

          const isCollapsed = !!collapsedFolders[folder];

          return (
            <div key={folder} className="space-y-0.5">
              {/* Folder Header */}
              <div className="flex items-center justify-between px-2 py-1 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100/80 group">
                <button
                  type="button"
                  id={`folder-btn-${folder}`}
                  onClick={() => toggleFolder(folder)}
                  className="flex items-center gap-1.5 font-semibold text-[11px] tracking-wide uppercase text-stone-500 hover:text-stone-800"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  )}
                  {isCollapsed ? (
                    <Folder className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-stone-400" />
                  )}
                  <span>{getFolderLabel(folder)}</span>
                  <span className="text-[10px] font-normal text-stone-400 lowercase font-mono ml-0.5">
                    ({folderFiles.length})
                  </span>
                </button>

                <button
                  type="button"
                  id={`quick-add-${folder}`}
                  onClick={() => onQuickNewFileInFolder(folder)}
                  title={`Add new ${folder} file`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 rounded transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Folder Files List */}
              {!isCollapsed && (
                <div className="pl-2 space-y-0.5">
                  {folderFiles.length === 0 ? (
                    <div className="px-3 py-1.5 text-[11px] text-stone-400 italic">
                      No files in /{folder}
                    </div>
                  ) : (
                    folderFiles.map((file) => {
                      const isSelected = file.id === selectedFileId;
                      const progress = getTaskProgress(file.content);
                      const title = file.frontmatter.title || file.name.replace(/\.md$/, '');
                      const status = file.frontmatter.status;

                      return (
                        <div
                          key={file.id}
                          className={`group/item flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-stone-900 text-white font-medium shadow-xs'
                              : 'text-stone-700 hover:bg-stone-200/70'
                          }`}
                          onClick={() => onSelectFile(file.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={isSelected ? 'text-white' : ''}>
                              {getCategoryIcon(file.folder)}
                            </span>

                            <div className="truncate flex-1">
                              <span className="truncate block text-xs">
                                {title}
                              </span>
                              <span
                                className={`text-[10px] block truncate font-mono ${
                                  isSelected ? 'text-stone-300' : 'text-stone-400'
                                }`}
                              >
                                {file.name}
                              </span>
                            </div>
                          </div>

                          {/* Meta pill or action buttons */}
                          <div className="flex items-center gap-1 shrink-0 ml-1.5">
                            {/* Task Progress Badge */}
                            {progress.total > 0 && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-0.5 ${
                                  isSelected
                                    ? 'bg-stone-800 text-stone-200'
                                    : progress.completed === progress.total
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                <CheckCircle className="w-2.5 h-2.5" />
                                {progress.completed}/{progress.total}
                              </span>
                            )}

                            {/* Status Indicator */}
                            {status && progress.total === 0 && (
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                                  isSelected
                                    ? 'bg-stone-800 text-stone-200'
                                    : status === 'active' || status === 'in-progress'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {status}
                              </span>
                            )}

                            {/* Hover Actions */}
                            <div className="hidden group-hover/item:flex items-center gap-0.5">
                              <button
                                type="button"
                                title="Duplicate file"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateFile(file);
                                }}
                                className={`p-1 rounded ${
                                  isSelected
                                    ? 'hover:bg-stone-800 text-stone-300'
                                    : 'hover:bg-stone-300 text-stone-500'
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Download .md file"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportSingleFile(file);
                                }}
                                className={`p-1 rounded ${
                                  isSelected
                                    ? 'hover:bg-stone-800 text-stone-300'
                                    : 'hover:bg-stone-300 text-stone-500'
                                }`}
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Delete file"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFile(file.id);
                                }}
                                className={`p-1 rounded ${
                                  isSelected
                                    ? 'hover:bg-red-900 text-red-200'
                                    : 'hover:bg-red-100 text-red-600'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className="p-6 text-center text-stone-400">
            <Tag className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="font-medium text-stone-600">No markdown files match</p>
            <p className="text-[11px] mt-1">Try another search keyword or clear filters.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-stone-200 text-[11px] text-stone-500 bg-white flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Auto-saved locally
        </span>
        <span className="font-mono text-stone-400">UTF-8 .md</span>
      </div>
    </aside>
  );
};
