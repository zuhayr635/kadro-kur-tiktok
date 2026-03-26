(function () {
  "use strict";

  // --- DOM references ---
  const userInfoEl = document.getElementById("userInfo");
  const userNameEl = document.getElementById("userName");
  const tiktokUsernameEl = document.getElementById("tiktokUsername");
  const totalGamesEl = document.getElementById("totalGames");
  const totalCardsEl = document.getElementById("totalCards");
  const avgScoreEl = document.getElementById("avgScore");
  const bestScoreEl = document.getElementById("bestScore");
  const historyGridEl = document.getElementById("historyGrid");
  const emptyStateEl = document.getElementById("emptyState");
  const errorStateEl = document.getElementById("errorState");
  const loadingStateEl = document.getElementById("loadingState");
  const modalOverlayEl = document.getElementById("modalOverlay");
  const modalContentEl = document.getElementById("modalContent");
  const modalCloseEl = document.getElementById("modalClose");

  // --- Extract license_id from URL ---
  var licenseId = window.location.pathname.split("/").pop();

  if (!licenseId || licenseId === "profile") {
    showError();
    return;
  }

  // --- Helpers ---
  function showError() {
    loadingStateEl.style.display = "none";
    errorStateEl.style.display = "block";
    document.querySelector(".profile-header").style.display = "none";
    document.querySelector(".stats-grid").style.display = "none";
    document.querySelector(".history-section").style.display = "none";
  }

  function showContent() {
    loadingStateEl.style.display = "none";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return "-";
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (mins === 0) return secs + "sn";
    return mins + "dk " + secs + "sn";
  }

  // --- Render functions ---
  function renderProfile(profile) {
    userNameEl.textContent = profile.name || profile.license_holder || "Bilinmiyor";
    tiktokUsernameEl.textContent = profile.tiktok_username
      ? "@" + profile.tiktok_username
      : "";
  }

  function renderStats(stats) {
    totalGamesEl.textContent =
      stats.total_games !== undefined ? stats.total_games : 0;
    totalCardsEl.textContent =
      stats.total_cards !== undefined ? stats.total_cards : 0;
    avgScoreEl.textContent =
      stats.avg_score !== undefined ? Number(stats.avg_score).toFixed(1) : "0";
    bestScoreEl.textContent =
      stats.best_score !== undefined ? stats.best_score : "0";
  }

  function createGameCard(game) {
    var card = document.createElement("div");
    card.className = "game-card";

    var homeTeam = game.home_team || game.team1 || "Ev Sahibi";
    var awayTeam = game.away_team || game.team2 || "Deplasman";
    var homeScore =
      game.home_score !== undefined
        ? game.home_score
        : game.score1 !== undefined
        ? game.score1
        : "-";
    var awayScore =
      game.away_score !== undefined
        ? game.away_score
        : game.score2 !== undefined
        ? game.score2
        : "-";
    var status = game.status || "completed";
    var statusClass =
      status === "active" ? "status-active" : "status-completed";
    var statusText = status === "active" ? "Devam Ediyor" : "Tamamlandi";

    card.innerHTML =
      '<div class="game-card-header">' +
      '  <span class="game-date">' +
      formatDate(game.date || game.created_at) +
      "</span>" +
      '  <span class="game-duration">' +
      formatDuration(game.duration) +
      "</span>" +
      "</div>" +
      '<div class="game-teams">' +
      '  <span class="team-name">' +
      escapeHtml(homeTeam) +
      "</span>" +
      '  <span class="vs-badge">VS</span>' +
      '  <span class="team-name">' +
      escapeHtml(awayTeam) +
      "</span>" +
      "</div>" +
      '<div class="game-scores">' +
      '  <span class="score-home">' +
      homeScore +
      "</span>" +
      '  <span class="score-separator">-</span>' +
      '  <span class="score-away">' +
      awayScore +
      "</span>" +
      "</div>" +
      '<div class="game-card-footer">' +
      '  <span class="game-status ' +
      statusClass +
      '">' +
      statusText +
      "</span>" +
      "</div>";

    card.addEventListener("click", function () {
      openGameModal(game);
    });

    return card;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderHistory(games) {
    historyGridEl.innerHTML = "";

    if (!games || games.length === 0) {
      emptyStateEl.style.display = "block";
      return;
    }

    games.forEach(function (game) {
      historyGridEl.appendChild(createGameCard(game));
    });
  }

  function openGameModal(game) {
    var homeTeam = game.home_team || game.team1 || "Ev Sahibi";
    var awayTeam = game.away_team || game.team2 || "Deplasman";
    var homeScore =
      game.home_score !== undefined ? game.home_score : game.score1 || "-";
    var awayScore =
      game.away_score !== undefined ? game.away_score : game.score2 || "-";

    var rows = [
      { label: "Tarih", value: formatDate(game.date || game.created_at) },
      { label: "Sure", value: formatDuration(game.duration) },
      {
        label: "Durum",
        value: game.status === "active" ? "Devam Ediyor" : "Tamamlandi",
      },
      {
        label: "Acilan Kart",
        value:
          game.cards_opened !== undefined ? game.cards_opened : "-",
      },
      {
        label: "Toplam Begeni",
        value: game.total_likes !== undefined ? game.total_likes : "-",
      },
      {
        label: "Toplam Hediye",
        value: game.total_gifts !== undefined ? game.total_gifts : "-",
      },
    ];

    var html =
      "<h3>" +
      escapeHtml(homeTeam) +
      " vs " +
      escapeHtml(awayTeam) +
      "</h3>" +
      '<div class="modal-scores">' +
      '  <span class="score-home">' +
      homeScore +
      "</span>" +
      '  <span class="score-separator">-</span>' +
      '  <span class="score-away">' +
      awayScore +
      "</span>" +
      "</div>";

    rows.forEach(function (row) {
      html +=
        '<div class="modal-detail-row">' +
        '  <span class="detail-label">' +
        row.label +
        "</span>" +
        '  <span class="detail-value">' +
        row.value +
        "</span>" +
        "</div>";
    });

    modalContentEl.innerHTML = html;
    modalOverlayEl.classList.add("active");
  }

  function closeModal() {
    modalOverlayEl.classList.remove("active");
  }

  // --- Modal close handlers ---
  modalCloseEl.addEventListener("click", closeModal);
  modalOverlayEl.addEventListener("click", function (e) {
    if (e.target === modalOverlayEl) {
      closeModal();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  // --- Fetch data ---
  async function loadProfile() {
    try {
      var profileRes = await fetch("/api/profile/" + encodeURIComponent(licenseId));
      if (!profileRes.ok) {
        showError();
        return;
      }
      var profileData = await profileRes.json();
      renderProfile(profileData.profile || profileData);
      renderStats(profileData.stats || profileData);
      showContent();
    } catch (err) {
      console.error("Profile fetch error:", err);
      showError();
      return;
    }

    try {
      var historyRes = await fetch(
        "/api/profile/" + encodeURIComponent(licenseId) + "/history"
      );
      if (historyRes.ok) {
        var historyData = await historyRes.json();
        renderHistory(historyData.games || historyData.history || historyData);
      } else {
        renderHistory([]);
      }
    } catch (err) {
      console.error("History fetch error:", err);
      renderHistory([]);
    }
  }

  loadProfile();
})();
