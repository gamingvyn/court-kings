// js/players.js
// All players have equal base stats. Each entry has a single ability: "megaDunk", "shield", "superAlleyOop" or null.

const PLAYER_LIBRARY = [
  { id: 'player1', name: 'LeBron', ability: 'megaDunk', sprite: 'assets/player1.png' },
  { id: 'player2', name: 'Steph Curry', ability: 'shield', sprite: 'assets/player2.png' },
  { id: 'player3', name: 'Shaquille', ability: 'superAlleyOop', sprite: 'assets/player3.png' },
  // add more players here with null ability if needed
];

// default selection (index 0). You can let user pick later.
const SELECTED_PLAYER = PLAYER_LIBRARY[0];
