import React, { useState } from 'react';
import { 
  MessageSquare, ThumbsUp, Sparkles, Send, Plus, Filter, 
  Play, CheckCircle2, Bot, Code, HelpCircle, Share2, Search, ArrowRight 
} from 'lucide-react';
import { ForumPost, ForumComment, UserProgress, Language } from '../types';
import { INITIAL_FORUM_POSTS } from '../data/coursesData';
import { CodeEditor } from './CodeEditor';
import { runCode, ExecutionResult } from '../utils/codeRunner';
import { playSound } from '../utils/audio';

interface CommunityForumProps {
  userProgress: UserProgress;
  onPostCreated?: () => void;
}

export const CommunityForum: React.FC<CommunityForumProps> = ({ userProgress }) => {
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_FORUM_POSTS);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isReviewingAI, setIsReviewingAI] = useState<Record<string, boolean>>({});

  // Code runner states for posts
  const [runningPostId, setRunningPostId] = useState<string | null>(null);
  const [postOutputs, setPostOutputs] = useState<Record<string, string>>({});

  // New post modal state
  const [newTitle, setNewTitle] = useState('');
  const [newLanguage, setNewLanguage] = useState<Language>('python');
  const [newTag, setNewTag] = useState('CodeReview');
  const [newContent, setNewContent] = useState('');
  const [newCode, setNewCode] = useState('');

  // Run snippet from post
  const handleRunPostCode = async (postId: string, code: string, lang: string) => {
    setRunningPostId(postId);
    try {
      const res: ExecutionResult = await runCode(code, lang);
      setPostOutputs((prev) => ({
        ...prev,
        [postId]: res.output || res.error || 'Execution finished with no output.',
      }));
      if (userProgress.soundEnabled) playSound('click');
    } catch (e: any) {
      setPostOutputs((prev) => ({
        ...prev,
        [postId]: e?.message || 'Execution error',
      }));
    } finally {
      setRunningPostId(null);
    }
  };

  // Upvote post
  const handleUpvote = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const wasUpvoted = p.hasUpvoted;
          return {
            ...p,
            upvotes: wasUpvoted ? p.upvotes - 1 : p.upvotes + 1,
            hasUpvoted: !wasUpvoted,
          };
        }
        return p;
      })
    );
    if (userProgress.soundEnabled) playSound('click');
  };

  // Request AI Code Review for a post
  const handleRequestAIReview = async (post: ForumPost) => {
    if (!post.code) return;
    setIsReviewingAI((prev) => ({ ...prev, [post.id]: true }));

    try {
      const res = await fetch('/api/gemini/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: post.code,
          language: post.language,
          title: post.title,
          questionContext: post.content,
        }),
      });

      if (!res.ok) throw new Error('AI code review request failed');
      const reviewData = await res.json();

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id) {
            return {
              ...p,
              aiReview: reviewData,
              comments: [
                ...p.comments,
                {
                  id: `ai_${Date.now()}`,
                  author: {
                    name: 'Prof. Nova (AI Tutor)',
                    avatar: '🤖',
                    badge: 'Master AI Teacher',
                    isAITutor: true,
                  },
                  content: `${reviewData.summary}\n\nKey Strengths: ${reviewData.strengths?.join(', ')}`,
                  codeSnippet: reviewData.refactoredCode,
                  createdAt: 'Just now',
                  upvotes: 4,
                },
              ],
            };
          }
          return p;
        })
      );

      if (userProgress.soundEnabled) playSound('celebration');
    } catch (e) {
      console.error('AI code review error:', e);
    } finally {
      setIsReviewingAI((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  // Submit comment
  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: ForumComment = {
      id: `c_${Date.now()}`,
      author: {
        name: 'You (Ahtsham)',
        avatar: '🚀',
        badge: 'Level 3 Learner',
      },
      content: text,
      createdAt: 'Just now',
      upvotes: 0,
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    if (userProgress.soundEnabled) playSound('click');
  };

  // Submit new post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const createdPost: ForumPost = {
      id: `post_${Date.now()}`,
      title: newTitle.trim(),
      author: {
        name: 'Ahtsham',
        avatar: '🚀',
        level: userProgress.level,
        badge: 'Python Apprentice',
      },
      language: newLanguage,
      tags: [newLanguage.toUpperCase(), newTag],
      content: newContent.trim(),
      code: newCode.trim() || undefined,
      createdAt: 'Just now',
      upvotes: 1,
      hasUpvoted: true,
      comments: [],
    };

    setPosts([createdPost, ...posts]);
    setIsCreatingPost(false);
    setNewTitle('');
    setNewContent('');
    setNewCode('');

    if (userProgress.soundEnabled) playSound('celebration');
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchLang = selectedLanguage === 'all' || post.language === selectedLanguage;
    const matchTag = selectedTag === 'all' || post.tags.includes(selectedTag);
    const matchSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLang && matchTag && matchSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-8 select-none">
      {/* Header & New Post Action */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>Peer Support & Reviews</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Community Code Exchange</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ask questions, exchange peer code reviews, and get instant feedback from AI and fellow students.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingPost(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Request Review / Ask</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions, errors, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="sql">SQL</option>
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Tags</option>
            <option value="CodeReview">#CodeReview</option>
            <option value="BugHelp">#BugHelp</option>
            <option value="Showcase">#Showcase</option>
          </select>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => {
          const isAIReviewing = isReviewingAI[post.id];
          const isRunningThisCode = runningPostId === post.id;
          const output = postOutputs[post.id];

          return (
            <div
              key={post.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700/80 transition"
            >
              {/* Post Author Bar */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xl">
                    {post.author.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{post.author.name}</span>
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {post.author.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{post.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                  {post.isSolved && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Solved</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Content */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{post.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Runnable Code Snippet */}
              {post.code && (
                <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950">
                  <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase text-blue-400">{post.language} Code</span>
                    <button
                      onClick={() => handleRunPostCode(post.id, post.code!, post.language)}
                      disabled={isRunningThisCode}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold text-xs transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isRunningThisCode ? 'Running...' : 'Run Snippet'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-emerald-300 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
                    {post.code}
                  </pre>
                  {output && (
                    <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs font-mono text-slate-300">
                      <span className="text-slate-500 text-[10px] block mb-0.5">Terminal Output:</span>
                      {output}
                    </div>
                  )}
                </div>
              )}

              {/* AI Code Review Block if present */}
              {post.aiReview && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="font-bold text-xs text-indigo-300">Prof. Nova's Code Critique</span>
                    </div>
                    <span className="text-xs font-extrabold text-amber-400">
                      ★ {post.aiReview.ratingScore} / 5.0
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{post.aiReview.summary}</p>

                  {post.aiReview.suggestions && post.aiReview.suggestions.length > 0 && (
                    <div className="space-y-1">
                      {post.aiReview.suggestions.map((s, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-indigo-400 font-semibold">[{s.topic}]:</span>
                          <span>{s.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Toolbar: Upvote, Request AI Review, Comments count */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      post.hasUpvoted
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.upvotes}</span>
                  </button>

                  <button
                    onClick={() => setActivePostId(activePostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.comments.length} Comments</span>
                  </button>
                </div>

                {/* AI Review Trigger */}
                {post.code && !post.aiReview && (
                  <button
                    onClick={() => handleRequestAIReview(post)}
                    disabled={isAIReviewing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/30 text-purple-300 font-semibold text-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isAIReviewing ? 'Analyzing with AI...' : 'Request AI Teacher Review'}</span>
                  </button>
                )}
              </div>

              {/* Comments Section (Expandable or always visible if active) */}
              {activePostId === post.id && (
                <div className="pt-4 space-y-3 border-t border-slate-800/80">
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                          comment.author.isAITutor
                            ? 'bg-indigo-950/30 border-indigo-800/40'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{comment.author.avatar}</span>
                            <span className="font-bold text-white">{comment.author.name}</span>
                            <span className="text-[10px] text-slate-400">{comment.author.badge}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{comment.createdAt}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        {comment.codeSnippet && (
                          <pre className="p-2.5 rounded-lg bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto">
                            {comment.codeSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Write a helpful peer answer or suggestion..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Discussion / Code Review Request */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-lg text-white">Ask Peers or Request Code Review</h3>
              <button
                onClick={() => setIsCreatingPost(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How can I optimize this Python list comprehension?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Language</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="CodeReview">#CodeReview</option>
                    <option value="BugHelp">#BugHelp</option>
                    <option value="Showcase">#Showcase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Question</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what your code does, what you've tried, or where you're seeking advice..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Code Snippet (Optional)</label>
                <textarea
                  rows={4}
                  placeholder="# Paste your code here..."
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Publish to Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
