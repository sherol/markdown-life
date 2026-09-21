import React, { useState } from 'react';
import {
  X,
  Target,
  Rocket,
  Bot,
  FileText,
  Plus,
  FolderPlus,
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
  const [folder, setFolder] = useState<string>(initialFolder);
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [customFolderName, setCustomFolderName] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate clean markdown slug
    const clean = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(clean ? `${clean}.md` : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFolder = isCustomFolder ? customFolderName.trim().toLowerCase() : folder;
    const finalFilename = slug.endsWith('.md') ? slug : `${slug || 'untitled'}.md`;
    const finalTitle = title.trim() || slug.replace(/\.md$/, '');

    if (!finalFolder || !finalFilename) return;
    onCreateFile(finalFolder, finalFilename, finalTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Create Markdown File</h3>
              <p className="text-[11px] text-stone-500">
                Organize under goals, projects, skills, or notes
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
              Folder / Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFolder('goals');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  !isCustomFolder && folder === 'goals'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Target className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="font-semibold block">Goal</span>
                  <span className="text-[10px] opacity-70">Long-term vision</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('projects');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  !isCustomFolder && folder === 'projects'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Rocket className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="font-semibold block">Project</span>
                  <span className="text-[10px] opacity-70">Actionable checklist</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('skills');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  !isCustomFolder && folder === 'skills'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Bot className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-semibold block">Agent Skill</span>
                  <span className="text-[10px] opacity-70">Prompt spec</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolder('notes');
                  setIsCustomFolder(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  !isCustomFolder && folder === 'notes'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <FileText className="w-4 h-4 text-stone-500" />
                <div>
                  <span className="font-semibold block">Notes & Logs</span>
                  <span className="text-[10px] opacity-70">Daily scratchpad</span>
                </div>
              </button>
            </div>

            {/* Custom Folder Option */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomFolder(!isCustomFolder)}
                className={`text-[11px] font-medium inline-flex items-center gap-1 ${
                  isCustomFolder ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                {isCustomFolder ? 'Using custom folder:' : 'Create in custom folder...'}
              </button>
              {isCustomFolder && (
                <input
                  type="text"
                  placeholder="e.g. routines, reading"
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  className="flex-1 p-1 bg-stone-50 border border-stone-200 rounded text-xs font-mono"
                  autoFocus
                />
              )}
            </div>
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
              autoFocus={!isCustomFolder}
              placeholder="e.g. Q4 Growth Architecture"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-stone-400 focus:outline-hidden"
            />
          </div>

          {/* Filename / Slug */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Markdown Filename (.md)
            </label>
            <div className="flex items-center gap-1 text-stone-500 font-mono">
              <span className="text-[11px]">/{isCustomFolder ? customFolderName || 'custom' : folder}/</span>
              <input
                type="text"
                required
                placeholder="filename.md"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:bg-white focus:border-stone-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-create-file"
              disabled={!slug.trim()}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              Create File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
