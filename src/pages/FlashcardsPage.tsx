import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { FlashcardDeck, Flashcard, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

export const FlashcardsPage: React.FC = () => {
  const { user, updateUserStats } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [isNewDeckModalOpen, setIsNewDeckModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [newDeck, setNewDeck] = useState({ title: '', description: '', subject_id: 1 });
  const [newCard, setNewCard] = useState({ front: '', back: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      const [deckRes, subRes] = await Promise.all([
        api.getFlashcardDecks(),
        api.getSubjects(),
      ]);
      setDecks(deckRes.decks || []);
      setSubjects(subRes.subjects || []);
    } catch (e) {
      console.error('Failed to load flashcard decks:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleStartStudy = async (deck: FlashcardDeck) => {
    try {
      const data = await api.getDeckCards(deck.id);
      setActiveDeck(deck);
      setCards(data.cards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setStudyMode(true);
    } catch (e) {
      console.error('Failed to start flashcard study:', e);
    }
  };

  const handleRateCard = async (rating: 'easy' | 'medium' | 'hard') => {
    const current = cards[currentCardIndex];
    if (!current) return;

    try {
      await api.reviewFlashcard(current.id, rating);
      if (user) {
        updateUserStats(user.xp + 5, user.level, false);
      }
    } catch (e) {
      console.error('Failed to record flashcard review:', e);
    }

    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Completed deck review
      setStudyMode(false);
      loadDecks();
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeck.title.trim()) return;
    try {
      await api.createDeck(newDeck);
      setIsNewDeckModalOpen(false);
      setNewDeck({ title: '', description: '', subject_id: 1 });
      loadDecks();
    } catch (e) {
      console.error('Failed to create deck:', e);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !newCard.front.trim() || !newCard.back.trim()) return;
    try {
      await api.addDeckCard(activeDeck.id, newCard);
      setIsAddCardModalOpen(false);
      setNewCard({ front: '', back: '' });
      const data = await api.getDeckCards(activeDeck.id);
      setCards(data.cards || []);
    } catch (e) {
      console.error('Failed to add card:', e);
    }
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-500" /> Spaced-Repetition Flashcards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Active recall with scheduled review intervals so challenging cards appear more frequently.
          </p>
        </div>

        {!studyMode && (
          <button
            onClick={() => setIsNewDeckModalOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Deck
          </button>
        )}
      </div>

      {/* VIEW: STUDY MODE (3D Flip Card) */}
      {studyMode && activeDeck && (
        <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStudyMode(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Exit Study Mode
            </button>
            <div className="text-xs font-bold text-slate-500">
              Card {currentCardIndex + 1} of {cards.length}
            </div>
            <button
              onClick={() => setIsAddCardModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {currentCard ? (
            <div className="space-y-6">
              {/* Interactive 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 min-h-[320px] w-full cursor-pointer group"
              >
                <div
                  className={`w-full h-full min-h-[320px] rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 shadow-xl border text-center ${
                    isFlipped
                      ? 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-purple-600 text-white border-indigo-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs opacity-75">
                    <span className="font-bold uppercase tracking-wider">
                      {isFlipped ? 'Answer & Explanation' : 'Front • Question'}
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" /> Click to flip
                    </span>
                  </div>

                  <div className="my-auto py-6">
                    <h3 className="text-xl sm:text-2xl font-bold leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </h3>
                  </div>

                  <div className="text-[11px] opacity-60">
                    Difficulty rating: {currentCard.difficulty} • Repetitions: {currentCard.repetitions}
                  </div>
                </div>
              </div>

              {/* Spaced Review Rating Buttons (Section #11: Easy/Medium/Hard) */}
              <div className="pt-2">
                <div className="text-center text-xs font-semibold text-slate-400 mb-3">
                  How well did you recall this card?
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleRateCard('hard')}
                    className="p-3 rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Hard
                    <span className="block text-[10px] font-normal text-rose-500 mt-0.5">Review soon</span>
                  </button>

                  <button
                    onClick={() => handleRateCard('medium')}
                    className="p-3 rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Medium
                    <span className="block text-[10px] font-normal text-amber-500 mt-0.5">Review in 2d</span>
                  </button>

                  <button
                    onClick={() => handleRateCard('easy')}
                    className="p-3 rounded-2xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Easy
                    <span className="block text-[10px] font-normal text-emerald-500 mt-0.5">Mastered</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No cards in this deck yet.</p>
              <button
                onClick={() => setIsAddCardModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Card
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DECK BROWSING */}
      {!studyMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div
              key={deck.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {deck.subject_name || 'Academics'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{deck.total_cards} Cards</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {deck.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {deck.description || 'Master key definitions, formulas and principles.'}
                </p>

                {/* Mastery Progress */}
                <div className="mt-5 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Deck Mastery</span>
                    <span>{deck.mastery_percent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${deck.mastery_percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {deck.mastered_cards || 0} of {deck.total_cards} Mastered
                </span>

                <button
                  onClick={() => handleStartStudy(deck)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Study Deck
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Deck */}
      {isNewDeckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsNewDeckModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create Flashcard Deck</h3>
            <p className="text-xs text-slate-500 mb-4">Organize key topics into custom revision decks.</p>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deck Title
                </label>
                <input
                  type="text"
                  required
                  value={newDeck.title}
                  onChange={e => setNewDeck({ ...newDeck, title: e.target.value })}
                  placeholder="e.g. Periodic Table Elements"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newDeck.subject_id}
                  onChange={e => setNewDeck({ ...newDeck, subject_id: Number(e.target.value) })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDeck.description}
                  onChange={e => setNewDeck({ ...newDeck, description: e.target.value })}
                  placeholder="What is covered in this flashcard deck?"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewDeckModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Card to Active Deck */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsAddCardModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Card to Deck</h3>
            <p className="text-xs text-slate-500 mb-4">{activeDeck?.title}</p>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Front (Prompt / Question)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newCard.front}
                  onChange={e => setNewCard({ ...newCard, front: e.target.value })}
                  placeholder="e.g. What is the derivative of sin(x)?"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Back (Answer & Explanation)
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCard.back}
                  onChange={e => setNewCard({ ...newCard, back: e.target.value })}
                  placeholder="e.g. cos(x)"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCardModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
