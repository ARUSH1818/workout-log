const STORAGE_KEY = "ironlog-workout-sessions";
const DEFAULT_TEMPLATES = [
  {
    name: "Push Day",
    exercises: [
      { name: "Barbell Bench Press", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
      { name: "Overhead Press", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
      { name: "Cable Triceps Pushdown", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
    ],
  },
  {
    name: "Pull Day",
    exercises: [
      { name: "Deadlift", sets: [{ weight: 0, reps: 5 }, { weight: 0, reps: 5 }, { weight: 0, reps: 5 }, { weight: 0, reps: 5 }] },
      { name: "Lat Pulldown", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
      { name: "Seated Cable Row", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
      { name: "Barbell Curl", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
    ],
  },
  {
    name: "Leg Day",
    exercises: [
      { name: "Back Squat", sets: [{ weight: 0, reps: 6 }, { weight: 0, reps: 6 }, { weight: 0, reps: 6 }, { weight: 0, reps: 6 }] },
      { name: "Romanian Deadlift", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
      { name: "Leg Press", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
      { name: "Walking Lunges", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
    ],
  },
];

const form = document.getElementById("workout-form");
const formTitle = document.getElementById("form-title");
const workoutNameInput = document.getElementById("workout-name");
const sessionDateInput = document.getElementById("session-date");
const sessionNotesInput = document.getElementById("session-notes");
const exerciseNameInput = document.getElementById("exercise-name");
const exerciseWeightInput = document.getElementById("exercise-weight");
const exerciseRepsInput = document.getElementById("exercise-reps");
const addSetButton = document.getElementById("add-set-button");
const addExerciseButton = document.getElementById("add-exercise-button");
const resetButton = document.getElementById("reset-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const templateSelect = document.getElementById("template-select");
const applyTemplateButton = document.getElementById("apply-template-button");
const calendarPrevButton = document.getElementById("calendar-prev");
const calendarNextButton = document.getElementById("calendar-next");

const exerciseList = document.getElementById("exercise-list");
const setList = document.getElementById("set-list");
const setHint = document.getElementById("set-hint");
const previousHint = document.getElementById("previous-hint");
const sessionVolume = document.getElementById("session-volume");
const overviewCards = document.getElementById("overview-cards");
const topExercises = document.getElementById("top-exercises");
const sessionHistory = document.getElementById("session-history");
const selectedDaySessions = document.getElementById("selected-day-sessions");
const exerciseSuggestions = document.getElementById("exercise-suggestions");
const statSessions = document.getElementById("stat-sessions");
const statVolume = document.getElementById("stat-volume");
const calendarMonthLabel = document.getElementById("calendar-month-label");
const calendarSelectedLabel = document.getElementById("calendar-selected-label");
const calendarGrid = document.getElementById("calendar-grid");

const exerciseItemTemplate = document.getElementById("exercise-item-template");
const setItemTemplate = document.getElementById("set-item-template");
const historyCardTemplate = document.getElementById("history-card-template");

let sessions = loadSessions();
let currentExercises = [];
let pendingSets = [];
let editingSessionId = null;
let selectedDate = formatDateInput(new Date());
let calendarMonth = getMonthStart(selectedDate);

sessionDateInput.value = selectedDate;

renderAll();

addSetButton.addEventListener("click", handleAddSet);
addExerciseButton.addEventListener("click", handleAddExercise);
resetButton.addEventListener("click", resetCurrentSession);
cancelEditButton.addEventListener("click", cancelEditMode);
applyTemplateButton.addEventListener("click", handleApplyTemplate);
form.addEventListener("submit", handleSaveSession);
exerciseNameInput.addEventListener("input", updatePreviousHint);
sessionDateInput.addEventListener("input", handleSessionDateChange);
calendarPrevButton.addEventListener("click", () => {
  calendarMonth = shiftMonth(calendarMonth, -1);
  renderCalendar();
});
calendarNextButton.addEventListener("click", () => {
  calendarMonth = shiftMonth(calendarMonth, 1);
  renderCalendar();
});

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortSessionsByDate(parsed.map(normalizeSession)) : [];
  } catch {
    return [];
  }
}

function normalizeSession(session) {
  return {
    ...session,
    exercises: (session.exercises || []).map(normalizeExercise),
    createdAt: session.createdAt || new Date().toISOString(),
  };
}

function normalizeExercise(exercise) {
  if (Array.isArray(exercise.sets) && exercise.sets.length > 0 && typeof exercise.sets[0] === "object") {
    return {
      id: exercise.id || crypto.randomUUID(),
      name: exercise.name,
      sets: exercise.sets.map((set, index) => ({
        id: set.id || crypto.randomUUID(),
        order: set.order || index + 1,
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
      })),
    };
  }

  const fallbackCount = Number(exercise.sets) || 0;
  const fallbackSets = Array.from({ length: fallbackCount }, (_, index) => ({
    id: crypto.randomUUID(),
    order: index + 1,
    weight: Number(exercise.weight) || 0,
    reps: Number(exercise.reps) || 0,
  }));

  return {
    id: exercise.id || crypto.randomUUID(),
    name: exercise.name,
    sets: fallbackSets,
  };
}

function persistSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function handleAddSet() {
  const weight = Number(exerciseWeightInput.value);
  const reps = Number(exerciseRepsInput.value);

  if (!Number.isFinite(weight) || !Number.isFinite(reps)) {
    window.alert("Add weight and reps for the set first.");
    return;
  }

  pendingSets.push({
    id: crypto.randomUUID(),
    order: pendingSets.length + 1,
    weight,
    reps,
  });

  exerciseWeightInput.value = "";
  exerciseRepsInput.value = "";
  renderPendingSets();
}

function handleAddExercise() {
  const name = exerciseNameInput.value.trim();

  if (!name || pendingSets.length === 0) {
    window.alert("Add an exercise name and at least one set first.");
    return;
  }

  currentExercises.push({
    id: crypto.randomUUID(),
    name,
    sets: pendingSets.map((set, index) => ({
      id: set.id,
      order: index + 1,
      weight: set.weight,
      reps: set.reps,
    })),
  });

  clearExerciseBuilder();
  renderCurrentExercises();
  updatePreviousHint();
}

function handleSaveSession(event) {
  event.preventDefault();

  const workoutName = workoutNameInput.value.trim();
  const sessionDate = sessionDateInput.value;
  const notes = sessionNotesInput.value.trim();

  if (!workoutName) {
    window.alert("Enter a workout name before saving.");
    return;
  }

  if (currentExercises.length === 0) {
    window.alert("Add at least one exercise before saving the session.");
    return;
  }

  const session = {
    id: editingSessionId || crypto.randomUUID(),
    workoutName,
    date: sessionDate,
    notes,
    exercises: currentExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        order: index + 1,
        weight: set.weight,
        reps: set.reps,
      })),
    })),
    createdAt: editingSessionId
      ? sessions.find((sessionItem) => sessionItem.id === editingSessionId)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
  };

  if (editingSessionId) {
    sessions = sessions.map((sessionItem) => (sessionItem.id === editingSessionId ? session : sessionItem));
  } else {
    sessions.unshift(session);
  }

  sessions = sortSessionsByDate(sessions);
  persistSessions();
  selectedDate = sessionDate;
  calendarMonth = getMonthStart(selectedDate);
  resetCurrentSession();
  renderAll();
}

function resetCurrentSession() {
  form.reset();
  sessionDateInput.value = selectedDate;
  currentExercises = [];
  pendingSets = [];
  editingSessionId = null;
  formTitle.textContent = "Log a workout";
  cancelEditButton.classList.add("hidden");
  renderCurrentExercises();
  renderPendingSets();
  updatePreviousHint();
}

function cancelEditMode() {
  resetCurrentSession();
}

function clearExerciseBuilder() {
  exerciseNameInput.value = "";
  exerciseWeightInput.value = "";
  exerciseRepsInput.value = "";
  pendingSets = [];
  renderPendingSets();
}

function renderAll() {
  renderTemplates();
  renderCurrentExercises();
  renderPendingSets();
  renderSummary();
  renderHistory();
  renderSuggestions();
  renderCalendar();
  renderSelectedDaySessions();
}

function renderCurrentExercises() {
  exerciseList.innerHTML = "";
  const totalVolume = currentExercises.reduce((sum, exercise) => sum + getExerciseVolume(exercise), 0);
  sessionVolume.textContent = `Volume: ${formatWeight(totalVolume)}`;

  if (currentExercises.length === 0) {
    exerciseList.className = "exercise-list empty-state";
    exerciseList.innerHTML = "<li>No exercises added yet.</li>";
    return;
  }

  exerciseList.className = "exercise-list";

  currentExercises.forEach((exercise) => {
    const item = exerciseItemTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".exercise-title").textContent = exercise.name;
    item.querySelector(".exercise-meta").textContent = formatSetSummary(exercise.sets);
    item.querySelector(".icon-button").addEventListener("click", () => {
      currentExercises = currentExercises.filter((entry) => entry.id !== exercise.id);
      renderCurrentExercises();
    });
    exerciseList.appendChild(item);
  });
}

function renderPendingSets() {
  setList.innerHTML = "";
  setHint.textContent =
    pendingSets.length > 0
      ? `${pendingSets.length} set${pendingSets.length > 1 ? "s" : ""} ready for this exercise.`
      : "Add one or more sets for this exercise.";

  if (pendingSets.length === 0) {
    setList.className = "exercise-list empty-state";
    setList.innerHTML = "<li>No sets added yet.</li>";
    return;
  }

  setList.className = "exercise-list";

  pendingSets.forEach((set, index) => {
    const item = setItemTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".exercise-title").textContent = `Set ${index + 1}`;
    item.querySelector(".exercise-meta").textContent = `${set.weight} kg x ${set.reps} reps`;
    item.querySelector(".icon-button").addEventListener("click", () => {
      pendingSets = pendingSets
        .filter((entry) => entry.id !== set.id)
        .map((entry, newIndex) => ({ ...entry, order: newIndex + 1 }));
      renderPendingSets();
    });
    setList.appendChild(item);
  });
}

function renderSummary() {
  statSessions.textContent = String(sessions.length);
  const totalVolume = sessions.reduce((sessionTotal, session) => {
    return sessionTotal + session.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + getExerciseVolume(exercise), 0);
  }, 0);
  statVolume.textContent = formatWeight(totalVolume);
  renderOverviewCards();

  const progress = buildExerciseProgress();
  topExercises.innerHTML = "";

  if (progress.length === 0) {
    topExercises.innerHTML =
      '<div class="summary-card"><strong>No data yet</strong><p>Save your first session to see exercise trends and recent lifts.</p></div>';
    return;
  }

  progress.slice(0, 4).forEach((entry) => {
    const card = document.createElement("article");
    card.className = "summary-card";

    const deltaText =
      entry.change === null
        ? "First logged top set"
        : `${entry.change >= 0 ? "+" : ""}${entry.change} kg vs previous top set`;

    card.innerHTML = `
      <strong>${escapeHtml(entry.name)}</strong>
      <p>Latest: ${escapeHtml(formatSetSummary(entry.latestSetList))}</p>
      <p class="${entry.change !== null && entry.change >= 0 ? "positive" : ""}">${escapeHtml(deltaText)}</p>
    `;

    topExercises.appendChild(card);
  });
}

function renderHistory() {
  sessionHistory.innerHTML = "";

  if (sessions.length === 0) {
    sessionHistory.innerHTML =
      '<div class="summary-card"><strong>No sessions yet</strong><p>Your saved workouts will appear here with the full exercise list.</p></div>';
    return;
  }

  sessions.slice(0, 6).forEach((session) => {
    sessionHistory.appendChild(buildSessionCard(session));
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  calendarMonthLabel.textContent = formatMonthLabel(calendarMonth);
  calendarSelectedLabel.textContent = `Selected: ${formatReadableDate(selectedDate)}`;

  const firstDayOfMonth = new Date(`${calendarMonth}T00:00:00`);
  const year = firstDayOfMonth.getFullYear();
  const monthIndex = firstDayOfMonth.getMonth();
  const leadingBlanks = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = formatDateInput(new Date());
  const sessionsByDate = getSessionsByDateMap();

  for (let i = 0; i < leadingBlanks; i += 1) {
    const filler = document.createElement("div");
    filler.className = "calendar-day-empty";
    calendarGrid.appendChild(filler);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = `${calendarMonth.slice(0, 8)}${String(day).padStart(2, "0")}`;
    const button = document.createElement("button");
    const count = sessionsByDate.get(dateValue)?.length || 0;
    button.type = "button";
    button.className = "calendar-day";
    if (count > 0) button.classList.add("has-session");
    if (dateValue === selectedDate) button.classList.add("selected");
    if (dateValue === today) button.classList.add("today");
    button.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      <span class="calendar-day-meta">${count > 0 ? `${count} workout${count > 1 ? "s" : ""}` : "No workout"}</span>
    `;
    button.addEventListener("click", () => {
      selectedDate = dateValue;
      sessionDateInput.value = dateValue;
      renderCalendar();
      renderSelectedDaySessions();
    });
    calendarGrid.appendChild(button);
  }
}

function renderSelectedDaySessions() {
  selectedDaySessions.innerHTML = "";
  const sessionsOnDay = sessions.filter((session) => session.date === selectedDate);

  if (sessionsOnDay.length === 0) {
    selectedDaySessions.innerHTML =
      '<div class="summary-card"><strong>No workout on this day</strong><p>Select a day with a highlight, or log a new workout for this date.</p></div>';
    return;
  }

  sessionsOnDay.forEach((session) => {
    selectedDaySessions.appendChild(buildSessionCard(session));
  });
}

function buildSessionCard(session) {
  const card = historyCardTemplate.content.firstElementChild.cloneNode(true);
  const volume = session.exercises.reduce((sum, exercise) => sum + getExerciseVolume(exercise), 0);

  card.querySelector(".history-date").textContent = formatReadableDate(session.date);
  card.querySelector(".history-name").textContent = session.workoutName;
  card.querySelector(".history-volume").textContent = formatWeight(volume);
  card.querySelector(".history-notes").textContent = session.notes;
  card.querySelector(".history-edit-button").addEventListener("click", () => {
    loadSessionIntoForm(session.id);
  });
  card.querySelector(".history-delete-button").addEventListener("click", () => {
    deleteSession(session.id);
  });

  const list = card.querySelector(".history-exercises");
  session.exercises.forEach((exercise) => {
    const row = document.createElement("li");
    row.textContent = `${exercise.name}: ${formatSetSummary(exercise.sets)}`;
    list.appendChild(row);
  });

  return card;
}

function renderTemplates() {
  templateSelect.innerHTML = '<option value="">Choose a template</option>';
  DEFAULT_TEMPLATES.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.name;
    option.textContent = template.name;
    templateSelect.appendChild(option);
  });
}

function renderSuggestions() {
  const names = [...new Set(sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name)))].sort(
    (a, b) => a.localeCompare(b)
  );

  exerciseSuggestions.innerHTML = "";
  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    exerciseSuggestions.appendChild(option);
  });
}

function renderOverviewCards() {
  overviewCards.innerHTML = "";

  if (sessions.length === 0) {
    overviewCards.innerHTML = `
      <article class="overview-card">
        <strong>Ready to train</strong>
        <p>Save your first session to unlock stats.</p>
        <small>Templates and progress tracking appear here.</small>
      </article>
    `;
    return;
  }

  const thisWeekSessions = sessions.filter((session) => isWithinLastDays(session.date, 7)).length;
  const heaviestLift = getHeaviestLift();
  const popularExercise = getMostLoggedExercise();

  [
    {
      title: `${thisWeekSessions}`,
      text: "Sessions in last 7 days",
      note: thisWeekSessions > 0 ? "Consistency is building." : "Time to log your next workout.",
    },
    {
      title: heaviestLift ? `${heaviestLift.weight} kg` : "0 kg",
      text: heaviestLift ? `Heaviest set: ${heaviestLift.name}` : "Heaviest set",
      note: heaviestLift ? `Logged on ${formatReadableDate(heaviestLift.date)}.` : "Start adding exercises to track peaks.",
    },
    {
      title: popularExercise ? popularExercise.name : "No favorite yet",
      text: popularExercise ? `${popularExercise.count} total sets logged` : "Most repeated lift",
      note: "Your most frequent exercise usually reveals your training focus.",
    },
  ].forEach((item) => {
    const card = document.createElement("article");
    card.className = "overview-card";
    card.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
      <small>${escapeHtml(item.note)}</small>
    `;
    overviewCards.appendChild(card);
  });
}

function updatePreviousHint() {
  const name = exerciseNameInput.value.trim().toLowerCase();
  if (!name) {
    previousHint.textContent = "Pick an exercise to see your most recent weight.";
    return;
  }

  for (const session of sessions) {
    const match = session.exercises.find((exercise) => exercise.name.toLowerCase() === name);
    if (match) {
      previousHint.textContent = `Last time: ${formatSetSummary(match.sets)} on ${formatReadableDate(session.date)}.`;
      return;
    }
  }

  previousHint.textContent = "No previous record for this exercise yet.";
}

function handleApplyTemplate() {
  const selected = DEFAULT_TEMPLATES.find((template) => template.name === templateSelect.value);
  if (!selected) {
    window.alert("Choose a template first.");
    return;
  }

  workoutNameInput.value = selected.name;
  currentExercises = selected.exercises.map((exercise) => {
    const latest = findLatestExercise(exercise.name);
    const sourceSets = latest ? latest.sets : exercise.sets;
    return {
      id: crypto.randomUUID(),
      name: exercise.name,
      sets: sourceSets.map((set, index) => ({
        id: crypto.randomUUID(),
        order: index + 1,
        weight: set.weight,
        reps: set.reps,
      })),
    };
  });

  clearExerciseBuilder();
  renderCurrentExercises();
}

function loadSessionIntoForm(sessionId) {
  const session = sessions.find((sessionItem) => sessionItem.id === sessionId);
  if (!session) return;

  editingSessionId = session.id;
  selectedDate = session.date;
  calendarMonth = getMonthStart(session.date);
  workoutNameInput.value = session.workoutName;
  sessionDateInput.value = session.date;
  sessionNotesInput.value = session.notes || "";
  currentExercises = session.exercises.map((exercise) => ({
    id: crypto.randomUUID(),
    name: exercise.name,
    sets: exercise.sets.map((set, index) => ({
      id: crypto.randomUUID(),
      order: index + 1,
      weight: set.weight,
      reps: set.reps,
    })),
  }));
  pendingSets = [];
  formTitle.textContent = "Edit workout";
  cancelEditButton.classList.remove("hidden");
  renderCurrentExercises();
  renderPendingSets();
  renderCalendar();
  renderSelectedDaySessions();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSession(sessionId) {
  const target = sessions.find((session) => session.id === sessionId);
  if (!target) return;

  const shouldDelete = window.confirm(`Delete "${target.workoutName}" from ${formatReadableDate(target.date)}?`);
  if (!shouldDelete) return;

  sessions = sessions.filter((session) => session.id !== sessionId);
  if (editingSessionId === sessionId) {
    resetCurrentSession();
  }
  persistSessions();
  renderAll();
}

function handleSessionDateChange() {
  if (!sessionDateInput.value) return;
  selectedDate = sessionDateInput.value;
  calendarMonth = getMonthStart(selectedDate);
  renderCalendar();
  renderSelectedDaySessions();
}

function findLatestExercise(name) {
  const normalizedName = name.trim().toLowerCase();
  for (const session of sessions) {
    const match = session.exercises.find((exercise) => exercise.name.toLowerCase() === normalizedName);
    if (match) return match;
  }
  return null;
}

function buildExerciseProgress() {
  const historyMap = new Map();

  [...sessions].reverse().forEach((session) => {
    session.exercises.forEach((exercise) => {
      const key = exercise.name.toLowerCase();
      if (!historyMap.has(key)) {
        historyMap.set(key, []);
      }
      historyMap.get(key).push({
        name: exercise.name,
        sets: exercise.sets,
        date: session.date,
      });
    });
  });

  return [...historyMap.values()]
    .map((entries) => {
      const latest = entries[entries.length - 1];
      const previous = entries[entries.length - 2] || null;
      return {
        name: latest.name,
        latestSetList: latest.sets,
        change: previous ? roundToOneDecimal(getTopSetWeight(latest.sets) - getTopSetWeight(previous.sets)) : null,
        date: latest.date,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getHeaviestLift() {
  return (
    sessions
      .flatMap((session) =>
        session.exercises.flatMap((exercise) =>
          exercise.sets.map((set) => ({
            name: exercise.name,
            weight: set.weight,
            date: session.date,
          }))
        )
      )
      .sort((a, b) => b.weight - a.weight)[0] || null
  );
}

function getMostLoggedExercise() {
  const counts = new Map();
  sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const key = exercise.name.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count += exercise.sets.length;
      } else {
        counts.set(key, { name: exercise.name, count: exercise.sets.length });
      }
    });
  });

  return [...counts.values()].sort((a, b) => b.count - a.count)[0] || null;
}

function isWithinLastDays(dateString, days) {
  const target = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  const diff = today.getTime() - target.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function sortSessionsByDate(sessionList) {
  return [...sessionList].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function getSessionsByDateMap() {
  const map = new Map();
  sessions.forEach((session) => {
    if (!map.has(session.date)) {
      map.set(session.date, []);
    }
    map.get(session.date).push(session);
  });
  return map;
}

function getMonthStart(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

function shiftMonth(monthStart, delta) {
  const date = new Date(`${monthStart}T00:00:00`);
  date.setMonth(date.getMonth() + delta);
  return formatDateInput(new Date(date.getFullYear(), date.getMonth(), 1));
}

function formatMonthLabel(monthStart) {
  return new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatWeight(value) {
  return `${roundToOneDecimal(value)} kg`;
}

function getExerciseVolume(exercise) {
  return exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
}

function getTopSetWeight(sets) {
  return sets.reduce((max, set) => Math.max(max, set.weight), 0);
}

function formatSetSummary(sets) {
  return sets.map((set, index) => `Set ${index + 1}: ${set.weight} kg x ${set.reps}`).join(" • ");
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
