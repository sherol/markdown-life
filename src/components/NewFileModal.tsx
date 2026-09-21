import React, { useState } from 'react';
import {
  X,
  Target,
  Rocket,
  Bot,
  FileText,
  Archive,
  FolderPlus,
  Calendar,
  Folder,
} from 'lucide-react';
import { FileCategory } from '../types';

interface NewFileModalProps {
  initialFolder?: string;
  existingFolders: string[];
  onClose: () => void;
  onCreateFile: (folder: string, filename: string, title: string) => void;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({
  initialFolder = 'goals',
  existingFolders,
  onClose,
  onCreateFile,
}) => {
  // Determine initial state based on initialFolder
  const getInitialState = () => {
    if (initialFolder.startsWith('goals/')) {
      return {
        cat: 'goals' as FileCategory,
        year: initialFolder.split('/')[1] || new Date().getFullYear().toString(),
        proj: '',
        custom: '',
        isCustom: false,
      };
    }
    if (initialFolder === 'goals') {
      return {
        cat: 'goals' as FileCategory,
        year: new Date().getFullYear().toString(),
        proj: '',
        custom: '',
        isCustom: false,
      };
    }
    if (initialFolder.startsWith('projects/')) {
      return {
        cat: 'projects' as FileCategory,
        year: new Date().getFullYear().toString(),
        proj: initialFolder.split('/')[1] || '',
        custom: '',
        isCustom: false,
      };
    }
    if (initialFolder === 'projects') {
      return {
        cat: 'projects' as FileCategory,
        year: new Date().getFullYear().toString(),
        proj: '',
        custom: '',
        isCustom: false,
      };
    }
    if (initialFolder === 'skills') {
      return {
        cat: 'skills' as FileCategory,
        year: new Date().getFullYear().toString(),
        proj: '',
        custom: '',
        isCustom: false,
      };
    }
    if (initialFolder === 'notes') {
      return {
        cat: 'notes' as FileCategory,
        year: new Date().getFullYear().toString(),
        proj: '',
        custom: '',
        isCustom: false,
      };
    }
    if (initialFolder === 'archive' || initialFolder.startsWith('archive/')) {
      return {
        cat: 'archive' as FileCategory,
        year: new Date().getFullYear().toString(),
        proj: '',
        custom: '',
        isCustom: false,
      };
    }
    return {
      cat: 'custom' as FileCategory,
      year: new Date().getFullYear().toString(),
      proj: '',
      custom: initialFolder,
      isCustom: true,
    };
  };

  const initState = getInitialState();
  const [category, setCategory] = useState<FileCategory>(initState.cat);
  const [goalYear, setGoalYear] = useState<string>(initState.year);
  const [projectSubfolder, setProjectSubfolder] = useState<string>(initState.proj);
  const [isCustomFolder, setIsCustomFolder] = useState<boolean>(initState.isCustom);
  const [customFolderName, setCustomFolderName] = useState<string>(initState.custom);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  // Extract existing years and existing project folders from existingFolders
  const existingYears = Array.from(
    new Set(
      existingFolders
        .filter((f) => f.startsWith('goals/'))
        .map((f) => f.replace('goals/', '').split('/')[0])
        .filter(Boolean)
    )
  );
  if (!existingYears.includes('2026')) existingYears.push('2026');
  if (!existingYears.includes('2027')) existingYears.push('2027');
  existingYears.sort((a, b) => b.localeCompare(a));

  const existingProjectFolders = Array.from(
    new Set(
      existingFolders
        .filter((f) => f.startsWith('projects/'))
        .map((f) => f.replace('projects/', '').split('/')[0])
        .filter(Boolean)
    )
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate clean markdown slug
    const clean = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(clean ? `${clean}.md` : '');

    // If in project mode and projectSubfolder is empty, auto-suggest project subfolder
    if (category === 'projects' && !projectSubfolder) {
      setProjectSubfolder(clean);
    }
  };

  const computeFinalFolder = () => {
    if (isCustomFolder) {
      return customFolderName.trim().toLowerCase() || 'custom';
    }
    if (category === 'goals') {
      const year = goalYear.trim() || new Date().getFullYear().toString();
      return `goals/${year}`;
    }
    if (category === 'projects') {
      const cleanProject = projectSubfolder
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return cleanProject ? `projects/${cleanProject}` : 'projects';
    }
    if (category === 'archive') {
      return 'archive';
    }
    if (category === 'skills') {
      return 'skills';
    }
    return 'notes';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFolder = computeFinalFolder();
    const finalFilename = slug.endsWith('.md') ? slug : `${slug || 'untitled'}.md`;
    const finalTitle = title.trim() || slug.replace(/\.md$/, '');

    if (!finalFolder || !finalFilename) return;
    onCreateFile(finalFolder, finalFilename, finalTitle);
    onClose();
  };

  const finalFolderPreview = computeFinalFolder();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Create Markdown File</h3>
              <p className="text-[11px] text-stone-500">
                Organize under structured vault folders and sub-directories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1.5">
              Vault Destination
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('goals');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isCustomFolder && category === 'goals'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Target className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs">Goals & OKRs</span>
                  <span className="text-[10px] opacity-70">Year sub-directory</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('projects');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isCustomFolder && category === 'projects'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Rocket className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs">Projects</span>
                  <span className="text-[10px] opacity-70">Per-project sub-dir</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('skills');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isCustomFolder && category === 'skills'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Bot className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs">Agent Skills</span>
                  <span className="text-[10px] opacity-70">Prompt spec</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('notes');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isCustomFolder && category === 'notes'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <FileText className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs">Notes & Rituals</span>
                  <span className="text-[10px] opacity-70">Daily scratchpad</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('archive');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isCustomFolder && category === 'archive'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Archive className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs">Archive</span>
                  <span className="text-[10px] opacity-70">Legacy storage</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCustomFolder(true);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  isCustomFolder
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <FolderPlus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs">Custom Folder</span>
                  <span className="text-[10px] opacity-70">Arbitrary path</span>
                </div>
              </button>
            </div>

            {/* Dynamic Sub-directory Configuration */}
            {!isCustomFolder && category === 'goals' && (
              <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-900 font-semibold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Target Year Sub-Directory
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono">goals/YYYY</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={goalYear}
                    onChange={(e) => setGoalYear(e.target.value.trim())}
                    placeholder="e.g. 2026, 2027"
                    className="flex-1 p-2 bg-white border border-amber-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:border-amber-500"
                  />
                  <div className="flex items-center gap-1">
                    {existingYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setGoalYear(yr)}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          goalYear === yr
                            ? 'bg-amber-600 text-white font-medium'
                            : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isCustomFolder && category === 'projects' && (
              <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-blue-900 font-semibold flex items-center gap-1.5 text-xs">
                    <Folder className="w-3.5 h-3.5 text-blue-600" />
                    Project Sub-Directory
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono">projects/[name]</span>
                </div>
                <input
                  type="text"
                  value={projectSubfolder}
                  onChange={(e) => setProjectSubfolder(e.target.value)}
                  placeholder="e.g. autonomous-research-agent, mobile-app"
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:border-blue-500"
                />
                {existingProjectFolders.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <span className="text-[10px] text-stone-400">Existing:</span>
                    {existingProjectFolders.slice(0, 4).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProjectSubfolder(p)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors truncate max-w-[140px] ${
                          projectSubfolder === p
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isCustomFolder && (
              <div className="mt-3 p-3 bg-stone-100 border border-stone-200 rounded-xl space-y-1.5">
                <label className="block text-stone-800 font-semibold text-xs">
                  Custom Folder Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. routines, reading/2026"
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:border-stone-500"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Title or Objective
            </label>
            <input
              type="text"
              id="input-new-file-title"
              required
              placeholder="e.g. Q4 Growth Architecture"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-stone-400 focus:outline-hidden"
            />
          </div>

          {/* Destination Path & Slug Preview */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Markdown Filename (.md)
            </label>
            <div className="flex items-center gap-1 text-stone-500 font-mono">
              <span className="text-[11px] bg-stone-100 px-2 py-2 rounded-lg border border-stone-200 text-stone-600 truncate max-w-[180px]">
                /{finalFolderPreview}/
              </span>
              <input
                type="text"
                required
                placeholder="filename.md"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:bg-white focus:border-stone-400 focus:outline-hidden"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1 font-mono truncate">
              Full vault path: /{finalFolderPreview}/{slug ? (slug.endsWith('.md') ? slug : `${slug}.md`) : 'untitled.md'}
            </p>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-create-file"
              disabled={!slug.trim()}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Create File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
