// Score persistence using localStorage (for session state)
const SCORE_KEY = 'rps_scores';
const USER_KEY = 'rps_username';

let username = localStorage.getItem(USER_KEY);
while (!username) {
  username = prompt('Enter a username for the leaderboard:')?.trim();
}
localStorage.setItem(USER_KEY, username);

// Tracks SESSION scores
let scores = {
  playerWins: 0,
  cpuWins: 0,
  ties: 0
};

// Tracks LIFETIME Max Net Score (synced with server)
let lifetimeMaxNet = -Infinity;

const $leaderboard = document.getElementById('leaderboard');

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/scores/rps');
    if (res.ok) {
        const data = await res.json();
        renderLeaderboard(data);
        
        // Sync local lifetime max from server
        const myEntry = data.find(e => e.name === username);
        if (myEntry) {
            lifetimeMaxNet = myEntry.netScore;
            updateScoreDisplay(); // Update high score display
        }
    }
  } catch (e) {
    console.error('Failed to load leaderboard', e);
  }
}

function renderLeaderboard(data) {
  if (!$leaderboard) return;

  // Clear existing leaderboard entries
  $leaderboard.innerHTML = '';

  // Safely render each leaderboard entry using DOM nodes
  data.forEach((e) => {
    const li = document.createElement('li');
    const nameBold = document.createElement('b');

    // Use textContent to avoid interpreting any HTML in the name
    nameBold.textContent = e.name;

    li.appendChild(nameBold);
    li.appendChild(
      document.createTextNode(
        `: ${e.netScore} (W:${e.playerWins} L:${e.cpuWins} T:${e.ties})`
      )
    );

    $leaderboard.appendChild(li);
  });
}

let isSubmitting = false;

async function submitScore() {
    if (isSubmitting) return;
    const currentNet = scores.playerWins - scores.cpuWins;
    
    // Logic: Only submit if we have beaten our lifetime max
    // OR if we don't have a lifetime max yet.
    if (currentNet > lifetimeMaxNet) {
        isSubmitting = true;
        try {
            const res = await fetch('/api/scores/rps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: username,
                    playerWins: scores.playerWins,
                    cpuWins: scores.cpuWins,
                    ties: scores.ties
                })
            });
            if (res.ok) {
                const data = await res.json();
                renderLeaderboard(data);
                // Update lifetime max to the new high
                const myEntry = data.find(e => e.name === username);
                if (myEntry) lifetimeMaxNet = myEntry.netScore;
                updateScoreDisplay();
            }
        } catch (e) {
            console.error('Failed to submit score', e);
        } finally {
            isSubmitting = false;
        }
    }
}

function loadScores() {
  const data = localStorage.getItem(SCORE_KEY);
  if (data) {
    try {
      const obj = JSON.parse(data);
      return {
        playerWins: obj.playerWins || 0,
        cpuWins: obj.cpuWins || 0,
        ties: obj.ties || 0
      };
    } catch { }
  }
  return { playerWins: 0, cpuWins: 0, ties: 0 };
}

function saveScores(s) {
  localStorage.setItem(SCORE_KEY, JSON.stringify(s));
}

function randomThrow() {
  const throws = ['rock', 'paper', 'scissors'];
  return throws[Math.floor(Math.random() * throws.length)];
}

function normalizeThrow(throwStr) {
  const t = throwStr.trim().toLowerCase();
  if (["rock", "r"].includes(t)) return "rock";
  if (["paper", "p"].includes(t)) return "paper";
  if (["scissors", "s"].includes(t)) return "scissors";
  return null;
}

function rpsLogic(playerThrow, cpuThrow) {
  const t1 = normalizeThrow(playerThrow);
  const t2 = normalizeThrow(cpuThrow);
  if (!t1 || !t2) return "Invalid input!";
  if (t1 === t2) return "It's a tie!";
  if (t1 === "rock") {
    return (t2 === "scissors") ? "Rock crushes scissors! Player wins!" : "Paper covers rock! CPU wins!";
  }
  if (t1 === "paper") {
    return (t2 === "rock") ? "Paper covers rock! Player wins!" : "Scissors cut paper! CPU wins!";
  }
  if (t1 === "scissors") {
    return (t2 === "paper") ? "Scissors cut paper! Player wins!" : "Rock crushes scissors! CPU wins!";
  }
  return "Invalid input!";
}

function updateScoreDisplay() {
  const net = scores.playerWins - scores.cpuWins;
  document.getElementById('playerWins').textContent = scores.playerWins;
  document.getElementById('cpuWins').textContent = scores.cpuWins;
  document.getElementById('ties').textContent = scores.ties;
  document.getElementById('netScore').textContent = net;
  
  const displayHigh = (lifetimeMaxNet === -Infinity) ? '-' : lifetimeMaxNet;
  document.getElementById('highscore').textContent = displayHigh;
}

function handleThrow(playerThrow) {
  const cpuThrow = randomThrow();
  document.getElementById('computerChoice').textContent = `Computer chose: ${cpuThrow}`;
  const result = rpsLogic(playerThrow, cpuThrow);
  document.getElementById('result').textContent = result;
  
  const t1 = normalizeThrow(playerThrow);
  const t2 = normalizeThrow(cpuThrow);
  if (!t1) return;
  
  if (t1 === t2) {
    scores.ties += 1;
  } else if (
    (t1 === "rock" && t2 === "scissors") ||
    (t1 === "paper" && t2 === "rock") ||
    (t1 === "scissors" && t2 === "paper")
  ) {
    scores.playerWins += 1;
  } else {
    scores.cpuWins += 1;
  }
  
  updateScoreDisplay();
  saveScores(scores);
  submitScore(); // Try to submit to leaderboard
}

document.addEventListener('DOMContentLoaded', () => {
    scores = loadScores();
    loadLeaderboard(); // Fetch global scores + sync lifetime max
    updateScoreDisplay();
    
    document.querySelectorAll('.throw').forEach(btn => {
        btn.addEventListener('click', () => {
        handleThrow(btn.dataset.throw);
        });
    });
    
    document.getElementById('resetScores').addEventListener('click', () => {
        scores = { playerWins: 0, cpuWins: 0, ties: 0 };
        updateScoreDisplay();
        saveScores(scores);
        document.getElementById('result').textContent = '';
        document.getElementById('computerChoice').textContent = '';
        // Note: We do NOT reset the global high score here, only the local session.
        // The user can't "delete" their global score from here, only beat it.
    });
});
