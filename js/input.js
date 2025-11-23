import { state, resetInputs } from './state.js';
import { handleAction } from './main.js';

export function setupInputs() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            handleAction(); // Trigger game start if waiting
            state.keys[e.code] = true;
        } else {
            state.keys[e.code] = true;
        }
    });

    window.addEventListener('keyup', (e) => state.keys[e.code] = false);

    document.addEventListener('touchstart', (e) => {
        if(e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        
        if(state.gameState === "WAITING" || state.gameState === "LOST") {
            e.preventDefault();
            handleAction();
            return;
        }
        if(state.gameState !== "PLAYING") return;

        e.preventDefault();
        state.isMobile = true;
        for(let i=0; i<e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if(t.clientX < window.innerWidth / 2) state.touchState.left = true;
            else state.touchState.right = true;
        }
    }, {passive: false});

    document.addEventListener('touchend', (e) => {
        if(state.gameState !== "PLAYING") return;
        e.preventDefault();
        for(let i=0; i<e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if(t.clientX < window.innerWidth / 2) state.touchState.left = false;
            else state.touchState.right = false;
        }
    }, {passive: false});

    // Prevent propagation on name field
    document.getElementById('player-name').addEventListener('keydown', (e) => {
        e.stopPropagation();
    });
}