// rank.js

const ranks = ["Bronze","Silver","Gold","Diamond","Legend","Mythic","Divine"];
const maxTier = 3;

// Load rank from localStorage
function loadRank() {
    const stored = localStorage.getItem("playerRank");
    if (stored) {
        try { return JSON.parse(stored); } 
        catch(e){ console.warn("Failed parsing rank:", e); }
    }
    return { rankIndex:0, tier:1 };
}

// Save rank
function saveRank(rank) {
    localStorage.setItem("playerRank", JSON.stringify(rank));
}

// Convert rank object to string
function getRankString(rank) {
    const tierRoman = ["I","II","III"];
    return `${ranks[rank.rankIndex]} ${tierRoman[rank.tier-1]}`;
}
