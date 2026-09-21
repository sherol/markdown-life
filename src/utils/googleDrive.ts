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
 * Finds or creates a folder inside a parent folder (or root if parentId is null),
 * checking for case-insensitive matches and common folder aliases first.
 */
export async function getOrCreateFolder(
  folderName: string,
  parentId?: string
): Promise<string> {
  const parentQuery = parentId
    ? `'${parentId}' in parents`
    : `'root' in parents`;

  // First, search all folders in parent to find exact or case-insensitive/alias matches
  try {
    const qAll = `mimeType = 'application/vnd.google-apps.folder' and ${parentQuery} and trashed = false`;
    const searchRes = await driveFetch(`files?q=${encodeURIComponent(qAll)}&fields=files(id,name)`);
    const data = await searchRes.json();

    if (data.files && Array.isArray(data.files) && data.files.length > 0) {
      const targetLower = folderName.toLowerCase().trim();
      const match = data.files.find((f: any) => {
        const nameLower = (f.name || '').toLowerCase().trim();
        if (nameLower === targetLower) return true;
        // Check standard category aliases
        if (targetLower === 'skills' && (nameLower === 'skills' || nameLower === 'agent skills' || nameLower === 'agent-skills' || nameLower === '3. agent skills' || nameLower === '3. skills')) return true;
        if (targetLower === 'goals' && (nameLower === 'goals' || nameLower === '1. goals')) return true;
        if (targetLower === 'projects' && (nameLower === 'projects' || nameLower === '2. projects')) return true;
        if (targetLower === 'notes' && (nameLower === 'notes' || nameLower === '4. notes')) return true;
        if (targetLower === 'archive' && (nameLower === 'archive' || nameLower === '5. archive')) return true;
        if (targetLower === ROOT_FOLDER_NAME.toLowerCase() && nameLower.includes('markdown life')) return true;
        return false;
      });

      if (match) {
        return match.id;
      }
    }
  } catch (err) {
    console.warn(`Error searching folders in parent ${parentId}:`, err);
  }

  // Create folder if not found
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
 * Imports markdown files from the Google Drive 'Markdown Life Vault' folder, including nested sub-directories,
 * and searches across the user's Google Drive for any separately created or uploaded 'skills' folders.
 */
export async function importFilesFromDrive(): Promise<VaultFile[]> {
  const { folderMap, rootId } = await getVaultFolderHierarchy();
  const importedFiles: VaultFile[] = [];
  const processedPaths = new Set<string>();

  async function scanDirectory(folderId: string, relativePath: string) {
    const isSkillsFolder = relativePath.toLowerCase().includes('skill');

    // 1. Scan files in this directory
    // For skills: support .md, .markdown, .txt, .yaml, .yml, .prompt, or generic text/octet-stream files (common when dragging raw files to Drive)
    const qFiles = isSkillsFolder
      ? `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder' and mimeType != 'application/vnd.google-apps.document' and mimeType != 'application/vnd.google-apps.spreadsheet' and mimeType != 'application/vnd.google-apps.presentation'`
      : `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder' and (mimeType = 'text/markdown' or mimeType = 'text/plain' or name contains '.md' or name contains '.markdown' or name contains '.txt')`;

    try {
      const resFiles = await driveFetch(`files?q=${encodeURIComponent(qFiles)}&fields=files(id,name,modifiedTime)`);
      const dataFiles = await resFiles.json();

      if (dataFiles.files && Array.isArray(dataFiles.files)) {
        for (const item of dataFiles.files) {
          try {
            const contentRes = await driveFetch(`files/${item.id}?alt=media`);
            const text = await contentRes.text();
            const cleanName = item.name.endsWith('.md') ? item.name : `${item.name}.md`;
            const currentFolder = relativePath || (isSkillsFolder ? 'skills' : 'notes');
            const filePath = `${currentFolder}/${cleanName}`;

            if (processedPaths.has(filePath)) continue;
            processedPaths.add(filePath);

            const parsed = parseFrontmatter(text);

            // Derive a friendly title for skill files if missing or generic "SKILL"
            let title = parsed.frontmatter.title;
            if (!title || title.toUpperCase() === 'SKILL' || title.toLowerCase() === 'untitled') {
              if (currentFolder.startsWith('skills/') && currentFolder.split('/').length > 1) {
                const subName = currentFolder.split('/').pop() || '';
                const formattedSub = subName
                  .split(/[-_]/)
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
                title = `${formattedSub} (${cleanName.replace(/\.md$/, '')})`;
              } else {
                title = cleanName.replace(/\.md$/, '');
              }
            }

            importedFiles.push({
              id: filePath,
              name: cleanName,
              path: filePath,
              folder: currentFolder,
              content: text,
              frontmatter: {
                ...parsed.frontmatter,
                title: title,
                category: isSkillsFolder ? 'skills' : (parsed.frontmatter.category || (currentFolder.split('/')[0] as any)),
              },
              createdAt: item.modifiedTime ? new Date(item.modifiedTime).getTime() : Date.now(),
              updatedAt: item.modifiedTime ? new Date(item.modifiedTime).getTime() : Date.now(),
            });
          } catch (err) {
            console.error(`Error reading ${item.name} from Google Drive:`, err);
          }
        }
      }
    } catch (err) {
      console.warn(`Error querying files in folder ${folderId} (${relativePath}):`, err);
    }

    // 2. Scan child sub-directories in this directory (e.g. skills/weather, projects/my-project)
    try {
      const qDirs = `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`;
      const resDirs = await driveFetch(`files?q=${encodeURIComponent(qDirs)}&fields=files(id,name)`);
      const dataDirs = await resDirs.json();

      if (dataDirs.files && Array.isArray(dataDirs.files)) {
        for (const subDir of dataDirs.files) {
          const nextRelativePath = relativePath ? `${relativePath}/${subDir.name}` : subDir.name;
          await scanDirectory(subDir.id, nextRelativePath);
        }
      }
    } catch (err) {
      console.warn(`Error scanning subdirectories in ${folderId}:`, err);
    }
  }

  // 1. Scan any files uploaded directly at the root of /Markdown Life Vault/
  await scanDirectory(rootId, '');

  // 2. Scan all subfolders inside /Markdown Life Vault/ (goals, projects, skills, notes, archive, and any custom folders)
  try {
    const qAllTopDirs = `'${rootId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`;
    const resAllTopDirs = await driveFetch(`files?q=${encodeURIComponent(qAllTopDirs)}&fields=files(id,name)`);
    const dataAllTopDirs = await resAllTopDirs.json();

    if (dataAllTopDirs.files && Array.isArray(dataAllTopDirs.files)) {
      for (const topDir of dataAllTopDirs.files) {
        // Normalize standard folder names to lowercase (e.g. 'Skills' -> 'skills')
        const nameLower = topDir.name.toLowerCase().trim();
        let targetRelative = topDir.name;
        if (nameLower === 'skills' || nameLower === 'agent skills' || nameLower === 'agent-skills') {
          targetRelative = 'skills';
        } else if (nameLower === 'goals') {
          targetRelative = 'goals';
        } else if (nameLower === 'projects') {
          targetRelative = 'projects';
        } else if (nameLower === 'notes') {
          targetRelative = 'notes';
        } else if (nameLower === 'archive') {
          targetRelative = 'archive';
        }
        await scanDirectory(topDir.id, targetRelative);
      }
    } else {
      for (const [topName, topId] of Object.entries(folderMap)) {
        await scanDirectory(topId, topName);
      }
    }
  } catch (err) {
    console.warn('Error reading subfolders in Markdown Life Vault:', err);
  }

  // 3. Fallback / Global Search: Also check if the user uploaded 'skills' or 'Skills' elsewhere in Google Drive
  // (e.g. at the root of My Drive or outside Markdown Life Vault)
  try {
    const qSkillsGlobal = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and (name = 'skills' or name = 'Skills' or name = 'SKILLS' or name = 'agent-skills' or name = 'Agent Skills') and not '${rootId}' in parents`;
    const resSkillsGlobal = await driveFetch(`files?q=${encodeURIComponent(qSkillsGlobal)}&fields=files(id,name,parents)`);
    const dataSkillsGlobal = await resSkillsGlobal.json();

    if (dataSkillsGlobal.files && Array.isArray(dataSkillsGlobal.files) && dataSkillsGlobal.files.length > 0) {
      for (const sf of dataSkillsGlobal.files) {
        await scanDirectory(sf.id, 'skills');
      }
    }
  } catch (err) {
    console.warn('Error querying global skills folders in Drive:', err);
  }

  return importedFiles;
}
