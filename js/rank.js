/* ======================================================
   rank.js
   Automatic Rank System integrated with actual game results
   - Updates points and rank automatically on game result
   - Progress bar shows progress to next tier
   - Displays points needed to next tier
   - In-screen top-right button
====================================================== */

const ranks = ["Bronze","Silver","Gold","Diamond","Legend","Mythic","Divine"];
const tierGaps = [5, 7, 10, 15, 20, 27, 30];
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

function getProgressPercent(rank) {
    const currentRankGap = tierGaps[rank.rankIndex];
    const pointsIntoTier = rank.points - getPointsForTierStart(rank);
    return Math.min((pointsIntoTier/currentRankGap)*100, 100);
}

function getPointsForTierStart(rank) {
    let total = 0;
    for(let i=0;i<rank.rankIndex;i++){
        total += tierGaps[i]*tiersPerRank;
    }
    total += tierGaps[rank.rankIndex]*(rank.tier-1);
    return total;
}

// Points to next tier
function getPointsToNextTier(rank) {
    if(rank.rankIndex === ranks.length-1 && rank.tier === 3) return 0;
    const nextTierStart = getPointsForTierStart({ 
        rankIndex: rank.rankIndex, 
        tier: rank.tier+1 > 3 ? rank.rankIndex+1 : rank.tier+1 
    });
    return nextTierStart - rank.points;
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

    const nextTierText = document.getElementById("rank-next-tier");
    if(nextTierText){
        const pointsToNext = getPointsToNextTier(rank);
        if(pointsToNext === 0){
            nextTierText.textContent = "Max Rank Reached";
        } else {
            nextTierText.textContent = `${pointsToNext} pts to next tier`;
        }
    }
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
        <div id="rank-next-tier"></div>
        <button id="rank-close-btn">Close</button>
    `;
    container.appendChild(popup);

    // Event listeners
    btn.addEventListener("click", showRankPopup);
    document.getElementById("rank-close-btn").addEventListener("click", closeRankPopup);

    // Hook automatic updates
    setupGameIntegration();
}

// ----------------------
// Integrate with game events
// ----------------------
function setupGameIntegration() {
    // Wrap GD_OPTIONS.onEvent to detect game over
    if(window.GD_OPTIONS && window.GD_OPTIONS.onEvent){
        const originalOnEvent = window.GD_OPTIONS.onEvent;
        window.GD_OPTIONS.onEvent = function(event){
            originalOnEvent(event); // keep existing behavior

            if(event.name === "SDK_GAME_OVER"){
                if(event.detail && event.detail.result === "win"){
                    changePoints(3);
                } else {
                    changePoints(-2);
                }
            }
        }
    }

    // Fallback: listen for custom GAME_OVER events dispatched by game
    document.getElementById("content").addEventListener("GAME_OVER", function(e){
        if(e.detail && e.detail.result === "win"){
            changePoints(3);
        } else {
            changePoints(-2);
        }
    });
}

// ----------------------
// Initialize
// ----------------------
document.addEventListener("DOMContentLoaded", setupRankUI);
