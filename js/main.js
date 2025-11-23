import { state, resetInputs } from './state.js';
import { audioManager } from './audio.js';
import { leaderboard } from './firebase.js';
import { handleResize, renderer } from './graphics.js';
import { setupInputs } from './input.js';
import { startCountdown, startGameLoop } from './game.js';

// Setup DOM Events
document.getElementById('btn-play').addEventListener('click', handleAction);
document.getElementById('btn-replay').addEventListener('click', handleAction);
document.getElementById('music-note').addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    document.getElementById('music-note').innerText = "Music: " + (isMuted ? "OFF" : "ON");
});

// Leaderboard Buttons
document.getElementById('btn-lb-show').addEventListener('click', () => leaderboard.show(false));
document.getElementById('btn-lb-close').addEventListener('click', () => document.getElementById('highscore-overlay').style.display='none');
document.getElementById('btn-submit').addEventListener('click', () => leaderboard.submitScore('player-name', 'btn-submit'));

window.addEventListener('resize', handleResize);

// Initialize Inputs
setupInputs();

// Initialize Render Loop
document.body.appendChild(renderer.domElement);
startGameLoop();

export function handleAction() {
    if (state.gameState === "WAITING") {
        resetInputs();
        audioManager.init();
        audioManager.playBGM();
        document.getElementById('start-screen').style.display = 'none';
        state.totalScore = 0;
        startCountdown(1);
    } else if (state.gameState === "LOST") {
        document.getElementById('game-over').style.display = 'none';
        state.totalScore = 0;
        startCountdown(1);
    }
}