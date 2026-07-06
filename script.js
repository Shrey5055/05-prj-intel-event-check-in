// Intel Sustainability Summit Check-In — script.js
// Handles check-in submissions, live counts, the progress bar,
// the celebration moment, the attendee list, and localStorage persistence.

document.addEventListener("DOMContentLoaded", () => {
  const GOAL = 50;
  const STORAGE_KEY = "intelSummitCheckIn";

  const TEAM_LABELS = {
    water: "Team Water Wise",
    zero: "Team Net Zero",
    power: "Team Renewables",
  };
  const TEAM_EMOJI = {
    water: "🌊",
    zero: "🌿",
    power: "⚡",
  };

  // Cache DOM elements
  const form = document.getElementById("checkInForm");
  const nameInput = document.getElementById("attendeeName");
  const teamSelect = document.getElementById("teamSelect");
  const greeting = document.getElementById("greeting");
  const celebrationBanner = document.getElementById("celebrationBanner");
  const attendeeCountEl = document.getElementById("attendeeCount");
  const attendeeGoalEl = document.getElementById("attendeeGoal");
  const progressBar = document.getElementById("progressBar");
  const attendeeListEl = document.getElementById("attendeeList");
  const resetBtn = document.getElementById("resetBtn");

  const countEls = {
    water: document.getElementById("waterCount"),
    zero: document.getElementById("zeroCount"),
    power: document.getElementById("powerCount"),
  };

  if (attendeeGoalEl) attendeeGoalEl.textContent = GOAL;

  // ---- State ----
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.attendees)) return parsed;
      }
    } catch (err) {
      console.error("Could not read saved check-in data:", err);
    }
    return { attendees: [] };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Could not save check-in data:", err);
    }
  }

  function getTeamCounts() {
    const counts = { water: 0, zero: 0, power: 0 };
    state.attendees.forEach((a) => {
      if (counts[a.team] !== undefined) counts[a.team]++;
    });
    return counts;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Rendering ----
  function render() {
    const total = state.attendees.length;
    const counts = getTeamCounts();

    // Total attendance count
    attendeeCountEl.textContent = total;

    // Team counts
    countEls.water.textContent = counts.water;
    countEls.zero.textContent = counts.zero;
    countEls.power.textContent = counts.power;

    // Progress bar
    const pct = Math.min((total / GOAL) * 100, 100);
    progressBar.style.width = pct + "%";

    // Attendee list
    renderAttendeeList();

    // Winning team highlight + celebration
    document
      .querySelectorAll(".team-card")
      .forEach((card) => card.classList.remove("winning-team"));

    if (total >= GOAL) {
      const maxCount = Math.max(counts.water, counts.zero, counts.power);
      const winningTeams = Object.keys(counts).filter(
        (team) => counts[team] === maxCount && maxCount > 0
      );
      winningTeams.forEach((team) => {
        const card = document.querySelector(`.team-card.${team}`);
        if (card) card.classList.add("winning-team");
      });

      const winnerLabel =
        winningTeams.length > 1
          ? winningTeams.map((t) => TEAM_LABELS[t]).join(" & ")
          : TEAM_LABELS[winningTeams[0]];

      celebrationBanner.textContent = `🎉 Attendance goal reached! ${total} sustainability champions checked in — ${winnerLabel} leads the way!`;
      celebrationBanner.style.display = "block";
    } else {
      celebrationBanner.style.display = "none";
    }
  }

  function renderAttendeeList() {
    attendeeListEl.innerHTML = "";

    if (state.attendees.length === 0) {
      const empty = document.createElement("li");
      empty.className = "attendee-empty";
      empty.textContent = "No attendees checked in yet.";
      attendeeListEl.appendChild(empty);
      return;
    }

    // Show most recent check-ins first
    [...state.attendees]
      .reverse()
      .forEach(({ name, team }) => {
        const li = document.createElement("li");
        li.className = `attendee-item team-${team}`;
        li.innerHTML = `
          <span class="attendee-emoji">${TEAM_EMOJI[team] || ""}</span>
          <span class="attendee-name">${escapeHtml(name)}</span>
          <span class="attendee-team">${TEAM_LABELS[team] || ""}</span>
        `;
        attendeeListEl.appendChild(li);
      });
  }

  function showGreeting(name, team) {
    greeting.textContent = `Welcome, ${name}! Thanks for checking in with ${TEAM_LABELS[team]}. 🌍`;
    greeting.classList.add("success-message");
    greeting.style.display = "block";
  }

  // ---- Events ----
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const team = teamSelect.value;

    if (!name || !team) return;

    state.attendees.push({ name, team });
    saveState();

    showGreeting(name, team);
    render();

    form.reset();
    nameInput.focus();
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Reset all check-in data? This cannot be undone."
      );
      if (!confirmed) return;

      state = { attendees: [] };
      saveState();

      greeting.style.display = "none";
      celebrationBanner.style.display = "none";
      render();
    });
  }

  // ---- Init ----
  render();
});