# Markdown Life & Skills Vault 🗂️

A modern, markdown-first personal operating system and agent skills repository that directly integrates with your **Google Drive** as its storage layer.

Manage your goals, projects, agent skill templates, and interconnected notes in an elegant, distraction-free environment — accessible anywhere with zero proprietary lock-in.

Example: http://sherol.github.io/mdlife

---

## ✨ Features

- **Google Drive Storage**: Uses your personal Google Drive (`/Markdown Life Vault/`) as the authoritative storage backend. No proprietary database or cloud lock-in.
- **Bi-Directional Drive Sync**:
  - Automatically debounce-syncs edits in real-time.
  - Creates, renames, duplicates, and deletes files directly within your Google Drive hierarchy.
  - One-click "Refresh from Drive" and "Initialize Starter Templates".
- **File Management & Renaming**:
  - Rename `.md` files right in the sidebar or directly inside the editor pane.
  - Automatically updates any `[[wiki-links]]` referencing the renamed file across the entire vault.
- **Structured Life Matrix**:
  - Connect **Goals** 🎯 to **Projects** 🚀, **Agent Skills** 🤖, and **Notes** 📝 with YAML frontmatter metadata and `[[wiki-links]]`.
  - Visual status chips, priority tracking, target quarters, and task completion metrics.
- **Agent Skills Lab**:
  - Standardized Markdown specs for LLM agent prompts with frontmatter parameters (`role`, `model`, `inputs`).
  - Interactive **Skill Playground** to test prompts and fill parameters on the fly.
- **Split Markdown Editor & Preview**:
  - Interactive checklists (click checkboxes in preview to update markdown source).
  - Code syntax highlighting, tables, callout blocks, and frontmatter badge viewer.
- **Import / Export**:
  - Drag-and-drop local `.md` files to upload into your vault.
  - Download entire vault as an organized `.zip` file anytime.
- **GitHub Pages Ready**: Fully configured GitHub Actions workflow (`.github/workflows/deploy.yml`) for 100% free hosting on GitHub Pages.

---

## 📁 Vault Directory Structure

When synced to Google Drive or exported as a ZIP, files are organized into standard folders:

```text
Markdown Life Vault/
├── goals/
│   ├── annual-strategic-goals.md
│   └── health-and-endurance.md
├── projects/
│   ├── ai-agent-knowledge-vault.md
│   └── personal-infrastructure.md
├── skills/
│   ├── research-synthesizer.md
│   └── code-refactoring-agent.md
└── notes/
    └── weekly-operating-cadence.md
```

### File Specification Example
Each markdown file utilizes standard YAML frontmatter:
```markdown
---
title: AI Agent Knowledge Vault
category: projects
status: active
priority: high
tags: [ai, productivity, oss]
relatedGoals: ["annual-strategic-goals"]
---

# 🚀 Project: AI Agent Knowledge Vault
- [x] Integrate Google Drive API sync
- [ ] Deploy to GitHub Pages
```

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Cloud Storage**: Google Drive REST API v3 (`https://www.googleapis.com/auth/drive.file`)
- **Icons**: Lucide React
- **Markdown Tools**: `marked`, `js-yaml`, `jszip`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or bun

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to GitHub Pages

This repository includes an automated workflow in `.github/workflows/deploy.yml`.

### Step 1: Enable GitHub Actions for Pages
1. Go to your repository on GitHub.
2. Navigate to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Every push to the `main` (or `master`) branch will automatically build and publish the app!

### Step 2: Configure Google OAuth / Firebase for your GitHub Pages Domain
To enable Google Sign-In on your published GitHub Pages URL (e.g. `https://<your-username>.github.io`):
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) or [Firebase Console](https://console.firebase.google.com/).
2. In **Firebase Authentication** → **Settings** → **Authorized domains**:
   - Add `<your-username>.github.io`.
3. In **Google Cloud Console** → **APIs & Services** → **Credentials** → Your Web OAuth Client:
   - Add `https://<your-username>.github.io` under **Authorized JavaScript origins**.

---

## 🔒 Privacy & Permissions

- The application requests the minimal Google Drive scope: `https://www.googleapis.com/auth/drive.file`.
- This scope restricts the application to **only reading and writing files created by this application** inside the `/Markdown Life Vault/` folder. It cannot access your existing photos, personal documents, or other Drive folders.
- No personal data or vault contents are stored on any external server. All API communication occurs directly between your browser and Google APIs.

---

## 📄 License

Apache-2.0. Feel free to fork and customize for your own workflow!
