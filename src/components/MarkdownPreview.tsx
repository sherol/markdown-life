import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Calendar,
  Tag,
  Target,
  Rocket,
  Bot,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { VaultFile } from '../types';

interface MarkdownPreviewProps {
  file: VaultFile;
  allFiles: VaultFile[];
  onNavigateToFile: (filenameOrPath: string) => void;
  onToggleCheckbox: (index: number) => void;
  onOpenSkillPlayground: (file: VaultFile) => void;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  file,
  allFiles,
  onNavigateToFile,
  onToggleCheckbox,
  onOpenSkillPlayground,
}) => {
  const [copied, setCopied] = useState(false);
  const { frontmatter, content } = file;

  // Strip frontmatter from preview body
  const bodyContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

  const isSkill = file.folder === 'skills' || frontmatter.category === 'skills';

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Convert [[WikiLinks]] and @skill into custom placeholders or elements
  // We can customize react-markdown components
  let taskCheckboxCounter = 0;

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Frontmatter Metadata Card */}
      <div className="mb-6 p-4 rounded-xl bg-stone-50 border border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Tag */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-stone-200 text-stone-800">
              {file.folder === 'goals' && <Target className="w-3 h-3 text-amber-700" />}
              {file.folder === 'projects' && <Rocket className="w-3 h-3 text-blue-700" />}
              {file.folder === 'skills' && <Bot className="w-3 h-3 text-emerald-700" />}
              {file.folder}
            </span>

            {/* Status */}
            {frontmatter.status && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium uppercase font-mono ${
                  frontmatter.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : frontmatter.status === 'active' || frontmatter.status === 'in-progress'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {frontmatter.status}
              </span>
            )}

            {/* Priority */}
            {frontmatter.priority && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
                Priority: <strong className="capitalize text-stone-900">{frontmatter.priority}</strong>
              </span>
            )}

            {/* Target Date */}
            {frontmatter.target_date && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-stone-600 bg-white border border-stone-200">
                <Calendar className="w-3 h-3 text-stone-400" />
                {frontmatter.target_date}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSkill && (
              <button
                type="button"
                id="btn-test-skill-banner"
                onClick={() => onOpenSkillPlayground(file)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Test Agent Skill
              </button>
            )}

            <button
              type="button"
              id="btn-copy-raw-md"
              onClick={copyContent}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-stone-400" />
                  Copy .md
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tags & Skill Attributes */}
        <div className="pt-2.5 flex flex-col gap-2 text-xs">
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="w-3 h-3 text-stone-400" />
              {frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-stone-200/80 text-stone-700 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Connected Relationships */}
          {frontmatter.goal_id && (
            <div className="flex items-center gap-1.5 text-stone-600">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>Parent Goal:</span>
              <button
                type="button"
                onClick={() => onNavigateToFile(frontmatter.goal_id!)}
                className="inline-flex items-center gap-0.5 text-blue-600 hover:underline font-mono font-medium"
              >
                {frontmatter.goal_id}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {frontmatter.linked_projects && frontmatter.linked_projects.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-stone-600">
              <Rocket className="w-3.5 h-3.5 text-blue-600" />
              <span>Linked Projects:</span>
              {frontmatter.linked_projects.map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => onNavigateToFile(proj)}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[11px]"
                >
                  {proj}
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          )}

          {frontmatter.assigned_skills && frontmatter.assigned_skills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-stone-600">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>Assigned Skills:</span>
              {frontmatter.assigned_skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onNavigateToFile(skill)}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-[11px]"
                >
                  {skill}
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          )}

          {/* Skill specifics */}
          {frontmatter.role && (
            <div className="flex items-center gap-1.5 text-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">Agent Persona:</span>
              <span>{frontmatter.role}</span>
              {frontmatter.model && (
                <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
                  {frontmatter.model}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rendered Markdown Body with custom components */}
      <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed font-sans">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold tracking-tight text-stone-950 mt-6 mb-3 pb-2 border-b border-stone-200">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold tracking-tight text-stone-900 mt-5 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold tracking-tight text-stone-900 mt-4 mb-1">
                {children}
              </h3>
            ),
            p: ({ children }) => {
              // Custom text renderer to parse [[WikiLinks]] inside paragraphs
              return <p className="my-2.5 text-sm text-stone-700 leading-relaxed">{children}</p>;
            },
            ul: ({ children }) => <ul className="my-2 space-y-1 pl-5 list-disc text-sm">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 space-y-1 pl-5 list-decimal text-sm">{children}</ol>,
            li: ({ children, ...props }: any) => {
              const checked = props.checked;
              if (checked !== null && checked !== undefined) {
                const currentIndex = taskCheckboxCounter++;
                return (
                  <li className="list-none -ml-5 flex items-start gap-2 py-0.5 text-sm group">
                    <input
                      type="checkbox"
                      checked={Boolean(checked)}
                      onChange={() => onToggleCheckbox(currentIndex)}
                      className="mt-1 w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-500 cursor-pointer"
                    />
                    <span
                      onClick={() => onToggleCheckbox(currentIndex)}
                      className={`cursor-pointer select-none transition-colors ${
                        checked ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {children}
                    </span>
                  </li>
                );
              }
              return <li className="text-sm py-0.5">{children}</li>;
            },
            input: ({ type, checked, ...props }: any) => {
              if (type === 'checkbox') {
                const currentIndex = taskCheckboxCounter++;
                return (
                  <input
                    type="checkbox"
                    checked={Boolean(checked)}
                    onChange={() => onToggleCheckbox(currentIndex)}
                    className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-500 cursor-pointer mr-2 align-middle"
                  />
                );
              }
              return <input type={type} checked={checked} {...props} />;
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-stone-400 pl-4 py-1 italic my-3 text-stone-600 bg-stone-50/70 rounded-r">
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              const isBlock = className && className.includes('language-');
              if (isBlock) {
                return (
                  <div className="relative group my-3">
                    <pre className="bg-stone-950 text-stone-100 p-3.5 rounded-lg text-xs font-mono overflow-x-auto border border-stone-800">
                      <code>{children}</code>
                    </pre>
                  </div>
                );
              }
              return (
                <code className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono text-xs border border-stone-200">
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-stone-100 p-2.5 font-semibold text-stone-800 border-b border-stone-200">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="p-2.5 border-b border-stone-100 text-stone-700">
                {children}
              </td>
            ),
            a: ({ href, children }) => {
              // Check if internal wiki reference
              const isInternal = href?.startsWith('#') || href?.endsWith('.md');
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    if (isInternal && href) {
                      e.preventDefault();
                      onNavigateToFile(href.replace(/^#/, ''));
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {bodyContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};
