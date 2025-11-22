/* ======================================================
   rank.js
   Full Rank System for Court-Kings with Progress Bar
====================================================== */

const ranks = ["Bronze","Silver","Gold","Diamond","Legend","Mythic","Divine"];
const tierGaps = [5, 7, 10, 15, 20, 27, 30]; // points per tier
const tiersPerRank = 3;

// ----------------------
// Load/Save Rank
// ----------------------
function loadRank() {
    const stored = localStorage.getItem("playerRank");
    if (stored) {
        try { return JSON.parse(stored); } 
        catch(e){ console.warn("Failed parsing rank:", e); }
    }
    return { points: 0, rankIndex: 0, tier: 1 };
}

function saveRank(rank) {
    localStorage.setItem("playerRank", JSON.stringify(rank));
}

// ----------------------
// Calculate Rank/Tier From Points
// ----------------------
function calculateRankFromPoints(points) {
    let remaining = points, rankIndex = 0, tier = 1;
    for (let i=0;i<ranks.length;i++) {
        const gap = tierGaps[i];
        const rankPoints = gap*tiersPerRank;
        if (remaining >= rankPoints) remaining -= rankPoints, rankIndex++;
        else { tier = Math.floor(remaining/gap)+1; break; }
    }
    if (rankIndex >= ranks.length) rankIndex = ranks.length-1, tier=3;
    return { rankIndex, tier };
}

// ----------------------
// Points Modification
// ----------------------
function addWin() { changePoints(3); }
function addLoss() { changePoints(-2); }

function changePoints(delta) {
    const rank = loadRank();
    rank.points = Math.max(0,(rank.points||0)+delta);

    const newRank = calculateRankFromPoints(rank.points);
    rank.rankIndex = newRank.rankIndex;
    rank.tier = newRank.tier;

    saveRank(rank);
    updatePopup();
    return rank;
}

// ----------------------
// Display Helpers
// ----------------------
function getRankString(rank) {
    const tierRoman = ["I","II","III"];
    return `${ranks[rank.rankIndex]} ${tierRoman[rank.tier-1]} (${rank.points} pts)`;
}

// Calculate progress percentage to next tier
function getProgressPercent(rank) {
    const currentRankGap = tierGaps[rank.rankIndex];
    const pointsIntoTier = rank.points - getPointsForTierStart(rank);
    const percent = Math.min((pointsIntoTier/currentRankGap)*100, 100);
    return percent;
}

// Calculate points at start of current tier
function getPointsForTierStart(rank) {
    let total = 0;
    for(let i=0;i<rank.rankIndex;i++){
        total += tierGaps[i]*tiersPerRank;
    }
    total += tierGaps[rank.rankIndex]*(rank.tier-1);
    return total;
}

// ----------------------
// Popup UI
// ----------------------
function showRankPopup() { document.getElementById("rank-popup").style.display="block"; }
function closeRankPopup() { document.getElementById("rank-popup").style.display="none"; }

function updatePopup() {
    const rank = loadRank();
    const display = document.getElementById("rank-display");
    if(display) display.textContent = getRankString(rank);

    const progressBar = document.getElementById("rank-progress-bar");
    if(progressBar) progressBar.style.width = getProgressPercent(rank) + "%";
}

// ----------------------
// Inject UI
// ----------------------
function setupRankUI() {
    const container = document.createElement("div");
    container.id = "rank-container";
    document.body.appendChild(container);

    // Star button
    const btn = document.createElement("button");
    btn.id = "rank-btn";
    btn.title = "Rank";
    btn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="gold" stroke="black" stroke-width="1">
        <path d="M12 2 L15 9 H22 L17 14 L18 21 L12 17 L6 21 L7 14 L2 9 H9 Z"/>
    </svg>`;
    container.appendChild(btn);

    // Popup
    const popup = document.createElement("div");
    popup.id = "rank-popup";
    popup.innerHTML = `
        <h3>Your Rank</h3>
        <div id="rank-display">${getRankString(loadRank())}</div>
        <div id="rank-progress-container">
            <div id="rank-progress-bar"></div>
        </div>
        <button id="rank-win-btn">Test Win (+3)</button>
        <button id="rank-loss-btn">Test Loss (-2)</button>
        <button id="rank-close-btn">Close</button>
    `;
    container.appendChild(popup);

    // Event listeners
    btn.addEventListener("click", showRankPopup);
    document.getElementById("rank-close-btn").addEventListener("click", closeRankPopup);
    document.getElementById("rank-win-btn").addEventListener("click", () => addWin());
    document.getElementById("rank-loss-btn").addEventListener("click", () => addLoss());
}

document.addEventListener("DOMContentLoaded", setupRankUI);
