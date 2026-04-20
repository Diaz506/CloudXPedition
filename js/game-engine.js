/* ============================================
   Cloud Pre-Sales Learning Path — Game Engine
   XP, Levels, Badges, Streaks (localStorage)
   ============================================ */

const GameEngine = (() => {
  const STORAGE_KEY = 'cloudpath_game_state';

  const LEVELS = [
    { level: 1, title: '☁️ Cloud Rookie',     xpRequired: 0 },
    { level: 2, title: '🔍 Cloud Explorer',   xpRequired: 500 },
    { level: 3, title: '🛠️ Cloud Builder',    xpRequired: 1500 },
    { level: 4, title: '🔒 Cloud Specialist',  xpRequired: 3000 },
    { level: 5, title: '🏗️ Cloud Architect',  xpRequired: 5000 },
    { level: 6, title: '🏆 Cloud Champion',    xpRequired: 8000 },
    { level: 7, title: '⭐ Cloud Legend',       xpRequired: 12000 },
  ];

  const BADGES = {
    'network-navigator':  { emoji: '🌐', name: 'Network Navigator',  desc: 'Complete Phase 1' },
    'identity-guardian':   { emoji: '🛡️', name: 'Identity Guardian',  desc: 'Complete Phase 2' },
    'cloud-pioneer':       { emoji: '☁️', name: 'Cloud Pioneer',      desc: 'Complete Phase 3' },
    'service-master':      { emoji: '⚙️', name: 'Service Master',     desc: 'Complete Phase 4' },
    'deal-closer':         { emoji: '💼', name: 'Deal Closer',        desc: 'Complete Phase 5' },
    'certified-pro':       { emoji: '📜', name: 'Certified Pro',      desc: 'Complete Phase 6' },
    'on-fire':             { emoji: '🔥', name: 'On Fire!',           desc: '7-day study streak' },
    'speed-learner':       { emoji: '⚡', name: 'Speed Learner',      desc: 'Beat a Phase Boss on first try' },
    'trailblazer':         { emoji: '🗺️', name: 'Trailblazer',       desc: 'Complete the self-assessment' },
    'perfectionist':       { emoji: '🎯', name: 'Perfectionist',     desc: 'Score Confident on all scenarios' },
    'journey-complete':    { emoji: '🌟', name: 'Journey Complete',   desc: 'Finish all 6 phases' },
  };

  const PHASE_BADGES = {
    1: 'network-navigator',
    2: 'identity-guardian',
    3: 'cloud-pioneer',
    4: 'service-master',
    5: 'deal-closer',
    6: 'certified-pro',
  };

  const QUOTES = [
    { text: "The cloud is not about technology; it's about agility and outcomes.", author: "Werner Vogels" },
    { text: "Every expert was once a beginner.", author: "Helen Hayes" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "It's not about being the smartest person in the room; it's about being the most curious.", author: "Satya Nadella" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Cloud is about how you do computing, not where you do computing.", author: "Paul Maritz" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The more I learn, the more I realize how much I don't know.", author: "Albert Einstein" },
  ];

  // --- State Management ---
  function getDefaultState() {
    return {
      xp: 0,
      badges: [],
      completedTopics: [],
      completedPhases: [],
      completedChecks: [],
      assessmentDone: false,
      assessmentScores: {},
      phaseProgress: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
      streak: { current: 0, longest: 0, lastDate: null },
      bossFirstTry: [],
      createdAt: new Date().toISOString(),
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      return { ...getDefaultState(), ...parsed };
    } catch { return getDefaultState(); }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = loadState();

  // --- XP & Levels ---
  function addXP(amount, reason) {
    const multiplier = getStreakMultiplier();
    const earned = Math.round(amount * multiplier);
    state.xp += earned;
    saveState(state);
    showToast(`+${earned} XP — ${reason}${multiplier > 1 ? ` (${multiplier}x streak!)` : ''}`);
    checkLevelUp();
    updateHeaderUI();
    return earned;
  }

  function getXP() { return state.xp; }

  function getLevel() {
    let current = LEVELS[0];
    for (const l of LEVELS) {
      if (state.xp >= l.xpRequired) current = l;
      else break;
    }
    return current;
  }

  function getNextLevel() {
    const current = getLevel();
    const idx = LEVELS.findIndex(l => l.level === current.level);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }

  function getLevelProgress() {
    const current = getLevel();
    const next = getNextLevel();
    if (!next) return 100;
    const inLevel = state.xp - current.xpRequired;
    const needed = next.xpRequired - current.xpRequired;
    return Math.min(100, Math.round((inLevel / needed) * 100));
  }

  function checkLevelUp() {
    const lvl = getLevel();
    const prevLvl = state._lastLevel || 1;
    if (lvl.level > prevLvl) {
      state._lastLevel = lvl.level;
      saveState(state);
      showToast(`🎉 LEVEL UP! You are now ${lvl.title}`);
      triggerCelebration();
    }
    state._lastLevel = lvl.level;
  }

  // --- Badges ---
  function unlockBadge(id) {
    if (state.badges.includes(id)) return false;
    if (!BADGES[id]) return false;
    state.badges.push(id);
    saveState(state);
    const badge = BADGES[id];
    showToast(`${badge.emoji} Badge Unlocked: ${badge.name}!`);
    triggerCelebration();
    return true;
  }

  function hasBadge(id) { return state.badges.includes(id); }
  function getEarnedBadges() { return state.badges.map(id => ({ id, ...BADGES[id] })); }
  function getAllBadges() {
    return Object.entries(BADGES).map(([id, b]) => ({
      id, ...b, earned: state.badges.includes(id)
    }));
  }

  // --- Topics & Phases ---
  function completeTopic(phaseNum, topicId) {
    if (!state.phaseProgress[phaseNum]) state.phaseProgress[phaseNum] = [];
    if (state.phaseProgress[phaseNum].includes(topicId)) return;
    state.phaseProgress[phaseNum].push(topicId);
    if (!state.completedTopics.includes(topicId)) {
      state.completedTopics.push(topicId);
    }
    saveState(state);
    addXP(50, `Completed: ${topicId.replace(/-/g, ' ')}`);
    updateStreak();
  }

  function isTopicCompleted(topicId) {
    return state.completedTopics.includes(topicId);
  }

  function getPhaseProgress(phaseNum) {
    return state.phaseProgress[phaseNum] || [];
  }

  function completePhase(phaseNum) {
    if (state.completedPhases.includes(phaseNum)) return;
    state.completedPhases.push(phaseNum);
    saveState(state);
    addXP(500, `Phase ${phaseNum} Complete!`);
    const badgeId = PHASE_BADGES[phaseNum];
    if (badgeId) unlockBadge(badgeId);
    if (state.completedPhases.length === 6) unlockBadge('journey-complete');
  }

  function isPhaseCompleted(phaseNum) {
    return state.completedPhases.includes(phaseNum);
  }

  function getCurrentPhase() {
    for (let i = 1; i <= 6; i++) {
      if (!state.completedPhases.includes(i)) return i;
    }
    return 7; // all done
  }

  // --- Knowledge Checks ---
  function completeCheck(checkId) {
    if (state.completedChecks.includes(checkId)) return;
    state.completedChecks.push(checkId);
    saveState(state);
    addXP(25, 'Knowledge check passed');
  }

  function isCheckCompleted(checkId) {
    return state.completedChecks.includes(checkId);
  }

  // --- Boss Challenges ---
  function completeBoss(phaseNum, firstTry) {
    if (firstTry && !state.bossFirstTry.includes(phaseNum)) {
      state.bossFirstTry.push(phaseNum);
      unlockBadge('speed-learner');
    }
    saveState(state);
    addXP(200, `Phase ${phaseNum} Boss defeated!`);
  }

  // --- Assessment ---
  function saveAssessment(scores, reasons) {
    const isFirstTime = !state.assessmentDone;
    state.assessmentScores = scores;
    state.assessmentReasons = reasons || null;
    state.assessmentDone = true;
    saveState(state);

    if (isFirstTime) {
      addXP(100, 'Assessment complete');
      unlockBadge('trailblazer');
    } else {
      addXP(25, 'Assessment retake');
    }
    const allConfident = Object.values(scores).every(s => s === 3);
    if (allConfident) unlockBadge('perfectionist');
  }

  function getAssessmentScores() { return state.assessmentScores; }
  function getAssessmentReasons() { return state.assessmentReasons || null; }
  function isAssessmentDone() { return state.assessmentDone; }
  function resetAssessment() {
    state.assessmentScores = {};
    state.assessmentReasons = null;
    state.assessmentDone = false;
    saveState(state);
  }

  // --- Streak ---
  function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (state.streak.lastDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (state.streak.lastDate === yesterday) {
      state.streak.current += 1;
    } else if (state.streak.lastDate !== today) {
      state.streak.current = 1;
    }

    state.streak.lastDate = today;
    if (state.streak.current > state.streak.longest) {
      state.streak.longest = state.streak.current;
    }
    saveState(state);

    if (state.streak.current >= 7) unlockBadge('on-fire');
  }

  function getStreak() { return state.streak; }

  function getStreakMultiplier() {
    const s = state.streak.current;
    if (s >= 7) return 2;
    if (s >= 3) return 1.5;
    return 1;
  }

  // --- Quotes ---
  function getRandomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  // --- UI Helpers ---
  function showToast(message) {
    const existing = document.querySelectorAll('.toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function triggerCelebration() {
    const container = document.createElement('div');
    container.className = 'celebration';
    document.body.appendChild(container);

    const colors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 1.5 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4000);
  }

  function updateHeaderUI() {
    const xpEl = document.getElementById('header-xp-text');
    const xpFill = document.getElementById('header-xp-fill');
    const levelEl = document.getElementById('header-level');
    const streakEl = document.getElementById('header-streak');

    if (xpEl) xpEl.textContent = `${state.xp} XP`;
    if (xpFill) {
      const progress = getLevelProgress();
      xpFill.style.width = progress + '%';
      const xpBar = document.querySelector('.header-xp-bar');
      if (xpBar) xpBar.setAttribute('aria-valuenow', Math.round(progress));
    }
    if (levelEl) {
      const lvl = getLevel();
      levelEl.textContent = lvl.title;
    }
    if (streakEl) {
      const s = getStreak();
      streakEl.innerHTML = s.current > 0 ? `🔥 ${s.current}d` : '';
    }
    // Reveal header after first paint with correct values
    const headerXp = document.querySelector('.header-xp');
    if (headerXp) headerXp.classList.add('loaded');
  }

  function getOverallProgress() {
    return Math.round((state.completedPhases.length / 6) * 100);
  }

  // --- Reset (for testing) ---
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    state = getDefaultState();
    updateHeaderUI();
  }

  // Init header on page load
  function init() {
    updateStreak();
    updateHeaderUI();

    // Render motivational quote if container exists
    const quoteEl = document.getElementById('motivational-quote');
    if (quoteEl) {
      const q = getRandomQuote();
      quoteEl.innerHTML = `"${q.text}" <span class="author">— ${q.author}</span>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    addXP, getXP, getLevel, getNextLevel, getLevelProgress,
    unlockBadge, hasBadge, getEarnedBadges, getAllBadges,
    completeTopic, isTopicCompleted, getPhaseProgress,
    completePhase, isPhaseCompleted, getCurrentPhase,
    completeCheck, isCheckCompleted,
    completeBoss,
    saveAssessment, getAssessmentScores, getAssessmentReasons, isAssessmentDone, resetAssessment,
    getStreak, getStreakMultiplier,
    getRandomQuote, getOverallProgress,
    showToast, triggerCelebration, updateHeaderUI,
    reset,
    LEVELS, BADGES, PHASE_BADGES,
  };
})();
