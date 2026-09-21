import React from 'react';
import { CloudUpload, AlertTriangle } from 'lucide-react';
import { VaultFile } from '../types';

interface ConfirmDriveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  file: VaultFile;
  isDarkMode?: boolean;
}

export const ConfirmDriveActionModal: React.FC<ConfirmDriveActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  file,
  isDarkMode = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className={`rounded-2xl border shadow-2xl max-w-md w-full p-5 space-y-4 ${
          isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Save File to Google Drive
            </h4>
            <p className="text-[11px] text-stone-400">Explicit confirmation required before modifying Drive data</p>
          </div>
        </div>

        <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
          <p>
            Do you want to save and write this markdown file to your Google Drive?
          </p>
          <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono text-xs">
            <div>📄 <strong>{file.name}</strong></div>
            <div className="text-stone-400 text-[11px] mt-0.5">Destination: /Markdown Life Vault/{file.folder}/</div>
          </div>
          <p className="text-[11px] text-stone-500">
            If this file already exists in Google Drive, its contents will be updated with your latest changes.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
              isDarkMode
                ? 'border-stone-800 text-stone-400 hover:bg-stone-800'
                : 'border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-single-file-drive-save"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            Save to Google Drive
          </button>
        </div>
      </div>
    </div>
  );
};
