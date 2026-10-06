import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Key,
  Copy,
  Check,
  Trophy,
  FileText,
  Target,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  LogOut,
  Flame,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StudyGroup } from '../types';

interface StudyGroupsPageProps {
  onNavigate: (path: string) => void;
}

export const StudyGroupsPage: React.FC<StudyGroupsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createSubject, setCreateSubject] = useState('Science');
  const [createDesc, setCreateDesc] = useState('');

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Group sub-tabs
  const [groupTab, setGroupTab] = useState<'leaderboard' | 'notes' | 'challenges'>('leaderboard');

  // Shared note form
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [sharingNote, setSharingNote] = useState(false);

  // New challenge form
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeTarget, setNewChallengeTarget] = useState(100);
  const [newChallengeXp, setNewChallengeXp] = useState(150);
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await api.getStudyGroups();
      setGroups(res.groups || []);
      if (res.groups && res.groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.groups[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load study groups', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (id: number) => {
    try {
      const res = await api.getStudyGroup(id);
      setActiveGroup(res.group);
    } catch (err: any) {
      console.error('Failed to load group details', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    try {
      const res = await api.createStudyGroup({
        name: createName,
        subject: createSubject,
        description: createDesc,
      });
      setCreateModalOpen(false);
      setCreateName('');
      setCreateDesc('');
      await loadGroups();
      setSelectedGroupId(res.group.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await api.joinStudyGroup(joinCode.trim().toUpperCase());
      setJoinModalOpen(false);
      setJoinCode('');
      await loadGroups();
      setSelectedGroupId(res.group.id);
    } catch (err: any) {
      alert(err.message || 'Invalid invite code or already a member');
    }
  };

  const handleCopyInviteCode = () => {
    if (!activeGroup?.invite_code) return;
    navigator.clipboard.writeText(activeGroup.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newNoteTitle.trim() || !newNoteContent.trim()) return;
    setSharingNote(true);
    try {
      await api.shareNoteInGroup(selectedGroupId, {
        title: newNoteTitle,
        content: newNoteContent,
        subject: activeGroup?.subject,
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      await loadGroupDetails(selectedGroupId);
    } catch (err: any) {
      alert(err.message || 'Failed to share note');
    } finally {
      setSharingNote(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newChallengeTitle.trim()) return;
    setCreatingChallenge(true);
    try {
      await api.createGroupChallenge(selectedGroupId, {
        title: newChallengeTitle,
        description: newChallengeDesc,
        target_metric: 'questions_answered',
        target_value: Number(newChallengeTarget) || 100,
        xp_reward: Number(newChallengeXp) || 150,
      });
      setNewChallengeTitle('');
      setNewChallengeDesc('');
      await loadGroupDetails(selectedGroupId);
    } catch (err: any) {
      alert(err.message || 'Failed to create challenge');
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroupId || !window.confirm('Are you sure you want to leave this study group?')) return;
    try {
      await api.leaveStudyGroup(selectedGroupId);
      setSelectedGroupId(null);
      setActiveGroup(null);
      await loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to leave group');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Private Peer Learning
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Private
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Private Study Groups
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Form private study circles with classmates. Share high-yield notes, tackle group challenges, and compete on the weekly member leaderboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-indigo-500" /> Join with Code
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Group
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading your private study groups...</div>
      ) : groups.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Study Groups Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            StudyForge study groups are completely private and invite-only. Create a group for your class, or enter an invite code from your study partner!
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Create New Group
            </button>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="py-2.5 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Enter Invite Code
            </button>
          </div>
        </div>
      ) : (
        /* Main Layout: Left Group List (4 cols) & Right Group Dashboard (8 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Groups sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Your Circles ({groups.length})
            </div>
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  selectedGroupId === g.id
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                    {g.subject || 'All Subjects'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {g.member_count} members
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {g.name}
                </h4>
                {g.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {g.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Active Group Board */}
          {activeGroup && (
            <div className="lg:col-span-8 space-y-6">
              {/* Group Banner & Invite Code Header */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {activeGroup.subject} Study Circle
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {activeGroup.name}
                    </h2>
                    {activeGroup.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {activeGroup.description}
                      </p>
                    )}
                  </div>

                  {/* Private Invite Code Badge */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Invite Code</div>
                      <div className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {activeGroup.invite_code}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer"
                      title="Copy invite code"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sub tabs */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGroupTab('leaderboard')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        groupTab === 'leaderboard'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5 inline mr-1" /> Member Leaderboard
                    </button>
                    <button
                      onClick={() => setGroupTab('notes')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        groupTab === 'notes'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 inline mr-1" /> Shared Notes ({activeGroup.shared_notes?.length || 0})
                    </button>
                    <button
                      onClick={() => setGroupTab('challenges')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        groupTab === 'challenges'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 inline mr-1" /> Group Challenges ({activeGroup.challenges?.length || 0})
                    </button>
                  </div>

                  <button
                    onClick={handleLeaveGroup}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" /> Leave
                  </button>
                </div>
              </div>

              {/* Sub Tab 1: Member Leaderboard */}
              {groupTab === 'leaderboard' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Weekly Member Leaderboard
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(activeGroup.members || []).map((m, idx) => (
                      <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                : idx === 2
                                ? 'bg-amber-700/20 text-amber-900 dark:text-amber-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {m.username} {m.user_id === user?.id && <span className="text-[10px] text-indigo-500 font-normal">(You)</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Level {m.level}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Flame className="w-3 h-3" /> {m.streak}d streak
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                          {m.xp} XP
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub Tab 2: Shared Notes */}
              {groupTab === 'notes' && (
                <div className="space-y-6">
                  {/* Note Creator */}
                  <form
                    onSubmit={handleShareNote}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Share Notes or Formulas with Group
                    </h4>
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={e => setNewNoteTitle(e.target.value)}
                      placeholder="Note Title (e.g. Thermodynamics Cheat Sheet)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      placeholder="Markdown notes, summary, formulas, or tips to share..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={sharingNote}
                      className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                    >
                      {sharingNote ? 'Posting...' : 'Post to Group Notes'}
                    </button>
                  </form>

                  {/* Notes Feed */}
                  <div className="space-y-3">
                    {(activeGroup.shared_notes || []).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        No shared notes posted yet. Be the first to share notes with your circle!
                      </div>
                    ) : (
                      activeGroup.shared_notes?.map(note => (
                        <div
                          key={note.id}
                          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <h4 className="font-bold text-slate-900 dark:text-white">{note.title}</h4>
                            <span className="text-[10px] text-slate-400">By {note.author_name}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {note.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sub Tab 3: Group Challenges */}
              {groupTab === 'challenges' && (
                <div className="space-y-6">
                  {/* Create Challenge */}
                  <form
                    onSubmit={handleCreateChallenge}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Launch a Collective Study Challenge
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newChallengeTitle}
                        onChange={e => setNewChallengeTitle(e.target.value)}
                        placeholder="e.g. Master 100 Chemistry Practice Questions"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        value={newChallengeTarget}
                        onChange={e => setNewChallengeTarget(Number(e.target.value))}
                        placeholder="Target questions/sessions (e.g. 100)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingChallenge}
                      className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                    >
                      {creatingChallenge ? 'Launching...' : 'Create Group Challenge'}
                    </button>
                  </form>

                  {/* Challenges List */}
                  <div className="space-y-3">
                    {(activeGroup.challenges || []).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        No active challenges right now.
                      </div>
                    ) : (
                      activeGroup.challenges?.map(ch => {
                        const pct = Math.min(100, Math.round((ch.current_value / ch.target_value) * 100));
                        return (
                          <div
                            key={ch.id}
                            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{ch.title}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                +{ch.xp_reward} XP
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Progress: {ch.current_value} / {ch.target_value}</span>
                              <span>{pct}% complete</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create Private Study Circle</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="e.g. AP Biology Squad"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select
                  value={createSubject}
                  onChange={e => setCreateSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option>Science</option>
                  <option>Mathematics</option>
                  <option>English</option>
                  <option>Social Studies</option>
                  <option>Computer Science</option>
                  <option>General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="Goal of this circle..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  Create Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Join with Invite Code</h3>
            <p className="text-xs text-slate-500">Ask your study partner for their 6-character private invite code.</p>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input
                type="text"
                required
                maxLength={8}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. SF-9K2L"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-bold text-sm tracking-widest text-slate-900 dark:text-white uppercase"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  Join Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
