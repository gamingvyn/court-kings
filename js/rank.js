/* ======================================================
   rank.js
   Full Rank System for Court-Kings
   - Points system: wins/losses affect points
   - Rank: Bronze → Divine, each with 3 tiers
   - Points gaps increase per rank
   - Rank button uses inline SVG star
   - Popup now inside game screen
====================================================== */

const ranks = ["Bronze","Silver","Gold","Diamond","Legend","Mythic","Divine"];
const tierGaps = [5, 7, 10, 15, 20, 27, 30]; // points per tier per rank
const tiersPerRank = 3;

// ----------------------
// Load and Save Rank Data
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
    let remaining = points;
    let rankIndex = 0;
    let tier = 1;

    for (let i = 0; i < ranks.length; i++) {
        const gap = tierGaps[i];
        const rankPoints = gap * tiersPerRank;

        if (remaining >= rankPoints) {
            remaining -= rankPoints;
            rankIndex++;
        } else {
            tier = Math.floor(remaining / gap) + 1;
            break;
        }
    }

    if (rankIndex >= ranks.length) {
        rankIndex = ranks.length - 1;
        tier = 3;
    }

    return { rankIndex, tier };
}

// ----------------------
// Points Modification
// ----------------------
function addWin() { changePoints(3); }
function addLoss() { changePoints(-2); }

function changePoints(delta) {
    const rank = loadRank();
    rank.points = Math.max(0, (rank.points || 0) + delta);

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

// ----------------------
// Popup UI
// ----------------------
function showRankPopup() {
    const popup = document.getElementById("rank-popup");
    updatePopup();
    popup.style.display = "block";
}

function closeRankPopup() {
    document.getElementById("rank-popup").style.display = "none";
}

function updatePopup() {
    const display = document.getElementById("rank-display");
    if (!display) return;
    display.textContent = getRankString(loadRank());
}

// ----------------------
// Inject Rank Button and Popup
// ----------------------
function setupRankUI() {
    const container = document.getElementById("rank-container") || createRankContainer();

    // Create Rank Button with inline SVG star
    const btn = document.createElement("button");
    btn.id = "rank-btn";
    btn.title = "Rank";
    btn.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="gold" stroke="black" stroke-width="1">
          <path d="M12 2 L15 9 H22 L17 14 L18 21 L12 17 L6 21 L7 14 L2 9 H9 Z"/>
        </svg>
    `;
    container.appendChild(btn);

    // Create Popup inside the same container
    const popup = document.createElement("div");
    popup.id = "rank-popup";
    popup.innerHTML = `
        <h3>Your Rank</h3>
        <div id="rank-display">${getRankString(loadRank())}</div>
        <button id="rank-win-btn">Test Win (+3)</button>
        <button id="rank-loss-btn">Test Loss (-2)</button>
        <button id="rank-close-btn">Close</button>
    `;
    container.appendChild(popup);

    // Event Listeners
    btn.addEventListener("click", showRankPopup);
    document.getElementById("rank-close-btn").addEventListener("click", closeRankPopup);
    document.getElementById("rank-win-btn").addEventListener("click", () => addWin());
    document.getElementById("rank-loss-btn").addEventListener("click", () => addLoss());
}

// ----------------------
// Create rank-container if not present
// ----------------------
function createRankContainer() {
    const container = document.createElement("div");
    container.id = "rank-container";
    container.style.display = "inline-block";
    container.style.position = "absolute"; // ensure it's in-game
    container.style.top = "10px";
    container.style.right = "10px";
    container.style.zIndex = "1000";
    const topRight = document.querySelector("#ui-buttons") || document.body;
    topRight.appendChild(container);
    return container;
}

// ----------------------
// Initialize
// ----------------------
document.addEventListener("DOMContentLoaded", setupRankUI);
