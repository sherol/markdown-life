import { VaultFile } from '../types';
import { getAccessToken } from './googleAuth';
import { parseFrontmatter } from './markdownParser';

const ROOT_FOLDER_NAME = 'Markdown Life Vault';

interface DriveFileItem {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
}

/**
 * Helper to call Google Drive API with current in-memory token
 */
async function driveFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('You must be signed in with Google to access Google Drive.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errText = await res.text();
    let message = `Google Drive error (${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        message = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res;
}

/**
 * Finds or creates a folder inside a parent folder (or root if parentId is null)
 */
export async function getOrCreateFolder(
  folderName: string,
  parentId?: string
): Promise<string> {
  const parentQuery = parentId
    ? `'${parentId}' in parents`
    : `'root' in parents`;
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and ${parentQuery} and trashed = false`;

  const searchRes = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await searchRes.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createPayload: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    createPayload.parents = [parentId];
  }

  const createRes = await driveFetch('files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPayload),
  });
  const created = await createRes.json();
  return created.id;
}

/**
 * Ensures the root 'Markdown Life Vault' folder and its standard subfolders exist in Google Drive
 */
export async function getVaultFolderHierarchy(): Promise<{
  rootId: string;
  folderMap: Record<string, string>;
}> {
  const rootId = await getOrCreateFolder(ROOT_FOLDER_NAME);

  const subfolders = ['goals', 'projects', 'skills', 'notes', 'archive'];
  const folderMap: Record<string, string> = {};

  for (const sf of subfolders) {
    const id = await getOrCreateFolder(sf, rootId);
    folderMap[sf] = id;
  }

  return { rootId, folderMap };
}

/**
 * Resolves or creates a nested sub-directory path inside Google Drive (e.g. "goals/2026" or "projects/ai-agent")
 */
export async function resolveDriveFolderId(
  folderPath: string,
  rootId: string
): Promise<string> {
  if (!folderPath || folderPath === '.' || folderPath === '/') return rootId;
  const parts = folderPath.split('/').map((s) => s.trim()).filter(Boolean);
  let currentParentId = rootId;
  for (const part of parts) {
    currentParentId = await getOrCreateFolder(part, currentParentId);
  }
  return currentParentId;
}

/**
 * Saves or updates a single markdown file in Google Drive
 */
export async function saveFileToDrive(
  file: VaultFile,
  targetFolderId?: string
): Promise<{ fileId: string; isNew: boolean }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  let resolvedFolderId = targetFolderId;
  if (!resolvedFolderId) {
    const { rootId } = await getVaultFolderHierarchy();
    resolvedFolderId = await resolveDriveFolderId(file.folder, rootId);
  }

  // Check if file already exists in this folder
  const fileName = file.name.endsWith('.md') ? file.name : `${file.name}.md`;
  const q = `name = '${fileName}' and '${resolvedFolderId}' in parents and trashed = false`;
  const searchRes = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await searchRes.json();

  if (data.files && data.files.length > 0) {
    const existingId = data.files[0].id;
    // Update content via upload API
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/markdown; charset=utf-8',
        },
        body: file.content,
      }
    );
    if (!uploadRes.ok) {
      throw new Error(`Failed to update ${file.name} in Google Drive`);
    }
    return { fileId: existingId, isNew: false };
  } else {
    // Create metadata first
    const createRes = await driveFetch('files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fileName,
        parents: [resolvedFolderId],
        mimeType: 'text/markdown',
      }),
    });
    const created = await createRes.json();
    const newId = created.id;

    // Upload content
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${newId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/markdown; charset=utf-8',
        },
        body: file.content,
      }
    );
    if (!uploadRes.ok) {
      throw new Error(`Failed to upload content for ${file.name} to Google Drive`);
    }
    return { fileId: newId, isNew: true };
  }
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteFileFromDrive(folderName: string, fileName: string): Promise<boolean> {
  const { rootId } = await getVaultFolderHierarchy();
  const folderId = await resolveDriveFolderId(folderName, rootId);
  const cleanName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
  const q = `name = '${cleanName}' and '${folderId}' in parents and trashed = false`;
  const searchRes = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await searchRes.json();

  if (data.files && data.files.length > 0) {
    const fileId = data.files[0].id;
    await driveFetch(`files/${fileId}`, {
      method: 'DELETE',
    });
    return true;
  }
  return false;
}

/**
 * Renames a file in Google Drive
 */
export async function renameFileInDrive(
  folderName: string,
  oldFileName: string,
  newFileName: string
): Promise<boolean> {
  const { rootId } = await getVaultFolderHierarchy();
  const folderId = await resolveDriveFolderId(folderName, rootId);
  const cleanOldName = oldFileName.endsWith('.md') ? oldFileName : `${oldFileName}.md`;
  const cleanNewName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;

  const q = `name = '${cleanOldName}' and '${folderId}' in parents and trashed = false`;
  const searchRes = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await searchRes.json();

  if (data.files && data.files.length > 0) {
    const fileId = data.files[0].id;
    await driveFetch(`files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanNewName }),
    });
    return true;
  }
  return false;
}

/**
 * Saves all files from the vault into their matching Google Drive folders
 */
export async function syncAllFilesToDrive(
  files: VaultFile[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ uploaded: number; updated: number }> {
  const { rootId } = await getVaultFolderHierarchy();

  let uploaded = 0;
  let updated = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);

    const folderId = await resolveDriveFolderId(file.folder, rootId);
    const result = await saveFileToDrive(file, folderId);
    if (result.isNew) {
      uploaded++;
    } else {
      updated++;
    }
  }

  return { uploaded, updated };
}

/**
 * Imports markdown files from the Google Drive 'Markdown Life Vault' folder, including nested sub-directories
 */
export async function importFilesFromDrive(): Promise<VaultFile[]> {
  const { folderMap, rootId } = await getVaultFolderHierarchy();
  const importedFiles: VaultFile[] = [];
  const processedPaths = new Set<string>();

  async function scanDirectory(folderId: string, relativePath: string) {
    // 1. Scan markdown files in this directory
    const qFiles = `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder' and (mimeType = 'text/markdown' or mimeType = 'text/plain' or name contains '.md')`;
    const resFiles = await driveFetch(`files?q=${encodeURIComponent(qFiles)}&fields=files(id,name,modifiedTime)`);
    const dataFiles = await resFiles.json();

    if (dataFiles.files && Array.isArray(dataFiles.files)) {
      for (const item of dataFiles.files) {
        try {
          const contentRes = await driveFetch(`files/${item.id}?alt=media`);
          const text = await contentRes.text();
          const cleanName = item.name.endsWith('.md') ? item.name : `${item.name}.md`;
          const filePath = relativePath ? `${relativePath}/${cleanName}` : cleanName;

          if (processedPaths.has(filePath)) continue;
          processedPaths.add(filePath);

          const parsed = parseFrontmatter(text);

          importedFiles.push({
            id: filePath,
            name: cleanName,
            path: filePath,
            folder: relativePath || 'notes',
            content: text,
            frontmatter: parsed.frontmatter,
            createdAt: item.modifiedTime ? new Date(item.modifiedTime).getTime() : Date.now(),
            updatedAt: item.modifiedTime ? new Date(item.modifiedTime).getTime() : Date.now(),
          });
        } catch (err) {
          console.error(`Error reading ${item.name} from Google Drive:`, err);
        }
      }
    }

    // 2. Scan child sub-directories in this directory (e.g. goals/2026, projects/my-project)
    const qDirs = `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`;
    const resDirs = await driveFetch(`files?q=${encodeURIComponent(qDirs)}&fields=files(id,name)`);
    const dataDirs = await resDirs.json();

    if (dataDirs.files && Array.isArray(dataDirs.files)) {
      for (const subDir of dataDirs.files) {
        const nextRelativePath = relativePath ? `${relativePath}/${subDir.name}` : subDir.name;
        await scanDirectory(subDir.id, nextRelativePath);
      }
    }
  }

  // Scan each top-level vault folder
  for (const [topName, topId] of Object.entries(folderMap)) {
    await scanDirectory(topId, topName);
  }

  return importedFiles;
}
