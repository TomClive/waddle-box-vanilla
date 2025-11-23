import * as THREE from 'three';

// Mutable state object
export const state = {
    gameState: "WAITING", // WAITING, PLAYING, COUNTDOWN, LOST
    totalScore: 0,
    levelScore: 0,
    currentLevel: 1,
    powerUpEndTime: 0,
    
    // Physics / Position trackers
    playerVerticalSpeed: 0,
    playerHeight: 0,
    groundLevel: 0,

    // Entities Arrays
    obstacles: [],
    coins: [],
    powerPills: [],
    enemies: [],

    // Inputs
    keys: {},
    touchState: { left: false, right: false },
    isMobile: false
};

export function resetInputs() {
    state.keys['KeyW'] = false;
    state.keys['KeyA'] = false;
    state.keys['KeyS'] = false;
    state.keys['KeyD'] = false;
    state.keys['ArrowUp'] = false;
    state.keys['ArrowDown'] = false;
    state.keys['ArrowLeft'] = false;
    state.keys['ArrowRight'] = false;
    state.keys['Space'] = false;
    state.touchState.left = false;
    state.touchState.right = false;
}

export function resetLevelState() {
    state.levelScore = 0;
    state.powerUpEndTime = 0;
    state.playerHeight = 0;
    state.playerVerticalSpeed = 0;
    state.groundLevel = 0;
    state.obstacles = [];
    state.coins = [];
    state.powerPills = [];
    state.enemies = [];
}