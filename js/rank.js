/* ======================================================
   rank.js
   Full Rank System for Court-Kings
   - Points system: wins/losses affect points
   - Rank: Bronze → Divine, each with 3 tiers
   - Points gaps increase per rank
   - Manual test buttons included
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
    // Default starting rank
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

    // Cap at Divine III
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
    rank.points = Math.max(0, (rank.points || 0) + delta); // cannot go below 0

    // Update rank/tier
    const newRank = calculateRankFromPoints(rank.points);
    rank.rankIndex = newRank.rankIndex;
    rank.tier = newRank.tier;

    saveRank(rank);
    updatePopup(); // refresh popup if open
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
    // Find container for top-right buttons
    const container = document.getElementById("rank-container") || createRankContainer();

    // Create Rank Button
    const btn = document.createElement("button");
    btn.id = "rank-btn";
    btn.title = "Rank";
    container.appendChild(btn);

    // Create Popup
    const popup = document.createElement("div");
    popup.id = "rank-popup";
    popup.innerHTML = `
        <h3>Your Rank</h3>
        <div id="rank-display">${getRankString(loadRank())}</div>
        <button id="rank-win-btn">Test Win (+3)</button>
        <button id="rank-loss-btn">Test Loss (-2)</button>
        <button id="rank-close-btn">Close</button>
    `;
    document.body.appendChild(popup);

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
    container.style.marginLeft = "8px"; // space from Achievements
    // Try to find existing UI container
    const topRight = document.querySelector("#ui-buttons") || document.body;
    topRight.appendChild(container);
    return container;
}

// ----------------------
// Initialize
// ----------------------
document.addEventListener("DOMContentLoaded", setupRankUI);
