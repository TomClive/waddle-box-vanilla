import * as THREE from 'three';
import { CFG } from './config.js';
import { state, resetInputs, resetLevelState } from './state.js';
import { audioManager } from './audio.js';
import { scene, camera, renderer, worldLayer, mat, dirLight } from './graphics.js';
import { playerWrapper, playerMesh, spawnScenery, spawnCoin, spawnPowerPill, spawnEnemy, upVector } from './entities.js';

const clock = new THREE.Clock();
const smoothedForward = new THREE.Vector3(0, 0, 1);
const tempQuat = new THREE.Quaternion();

function updateHUD() {
    document.getElementById('score-level').innerText = state.levelScore;
    document.getElementById('score-total').innerText = state.totalScore;
    document.getElementById('level-num').innerText = state.currentLevel;
}

function trackEvent(eventName, params = {}) {
    if(typeof window.gtag === 'function') window.gtag('event', eventName, params);
}

export function buildLevel(lvl) {
    resetLevelState();
    
    while(worldLayer.children.length > 0) {
        worldLayer.remove(worldLayer.children[0]);
    }

    for(let i=0; i<30; i++) spawnScenery('tree');
    for(let i=0; i<10; i++) spawnScenery('rock');
    while(state.coins.length < CFG.totalCoins) spawnCoin();
    while(state.powerPills.length < 3) spawnPowerPill();
    
    const enemyCount = 4 + (lvl * 2);
    while(state.enemies.length < enemyCount) spawnEnemy();

    updateHUD();
    
    // Reset Player Pos
    playerWrapper.position.set(0, CFG.planetRadius, 0);
    playerWrapper.quaternion.set(0, 0, 0, 1);

    state.currentLevel = lvl;
    trackEvent('level_start', { level: lvl });
}

export function startCountdown(nextLvl) {
    resetInputs();
    state.gameState = "COUNTDOWN";
    audioManager.levelUp();

    const screen = document.getElementById('transition-screen');
    const title = document.getElementById('trans-title');
    const msg = document.getElementById('trans-msg');
    const countUi = document.getElementById('countdown');

    screen.style.display = 'flex'; // Tailwind uses flex by default if class is flex, but we hid it

    if(nextLvl === 1) {
        title.innerText = "GET READY";
        msg.innerHTML = "1. Collect 20 Gold Coins.<br>2. Jump over Slimes (or eat them with Blue Pills).";
    } else {
        title.innerText = "LEVEL COMPLETE";
        msg.innerHTML = "Nice work! Prepare for Level " + nextLvl;
    }

    let count = 3;
    countUi.innerText = count;

    const interval = setInterval(() => {
        count--;
        if(count > 0) {
            countUi.innerText = count;
        } else {
            clearInterval(interval);
            screen.style.display = 'none';
            state.currentLevel = nextLvl;
            buildLevel(state.currentLevel);
            state.gameState = "PLAYING";
            clock.getDelta(); // Reset dt
        }
    }, 1000);
}

export function gameOver() {
    state.gameState = "LOST";
    const finalTotalScore = state.totalScore;
    
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('go-title').innerText = "GAME OVER";
    document.getElementById('go-msg').innerText = "You reached Level " + state.currentLevel + "\nTotal Score: " + finalTotalScore;
    
    document.getElementById('submit-form').style.display = 'block';
    document.getElementById('leaderboard-display').style.display = 'none';
    
    const btn = document.getElementById('btn-submit');
    btn.disabled = false;
    btn.innerText = "SUBMIT";
    
    audioManager.die();
    trackEvent('game_over', { level: state.currentLevel, score: finalTotalScore });
}

export function startGameLoop() {
    // Initial Level Build for Title Screen Background
    buildLevel(1); 

    function animate() {
        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.1);

        // --- TITLE SCREEN / WAITING ANIMATION ---
        if(state.gameState === "WAITING") {
            const time = Date.now() * 0.0001; // Slow rotation
            const dist = CFG.camDistance + CFG.planetRadius + 10;
            camera.position.x = Math.sin(time) * dist;
            camera.position.z = Math.cos(time) * dist;
            camera.position.y = CFG.planetRadius + 15; // slightly elevated
            camera.lookAt(0, 0, 0);
            
            // Still render the scene
            renderer.render(scene, camera);
            return;
        }

        // --- PLAYING LOOP ---
        if(state.gameState !== "PLAYING" && state.gameState !== "COUNTDOWN" && state.gameState !== "LOST") {
             // Fallback for unexpected states, though we handle waiting above
            return;
        }

        // If LOST, we might still want to render the static scene or keep it frozen. 
        // For now, let's freeze updates but render.
        if (state.gameState === "LOST") {
             renderer.render(scene, camera);
             return;
        }
        
        // Don't update physics during countdown, but do render
        if (state.gameState === "COUNTDOWN") {
             renderer.render(scene, camera);
             return;
        }

        const now = Date.now();
        const isPowered = now < state.powerUpEndTime;

        // Power UP UI
        if (isPowered) {
            const timeLeft = state.powerUpEndTime - now;
            const pct = (timeLeft / CFG.powerDuration) * 100;
            document.getElementById('power-ui').style.display = 'block';
            const bar = document.getElementById('power-bar-fill');
            bar.style.width = pct + "%";
            bar.style.backgroundColor = (timeLeft < 1500) ? "#FF0000" : "#00FFFF";
            mat.enemy.color.setHex(CFG.colors.enemyVuln);
        } else {
            document.getElementById('power-ui').style.display = 'none';
            mat.enemy.color.setHex(CFG.colors.enemyNormal);
        }

        // 1. DETERMINE GROUND
        let currentGroundLevel = 0;
        const playerPos = playerWrapper.position.clone();
        for(const obs of state.obstacles) {
            if (obs.type === 'rock') {
                if (playerPos.distanceTo(obs.pos) < obs.radius) {
                    if (state.playerHeight >= obs.height * 0.8) {
                        currentGroundLevel = Math.max(currentGroundLevel, obs.height);
                    }
                }
            }
        }
        state.groundLevel = currentGroundLevel;

        // 2. INPUTS
        let turn = 0;
        let jump = false;
        let moveInput = 0;

        if (state.isMobile) {
            moveInput = 1; // Auto run
            if(state.touchState.left && state.touchState.right) jump = true;
            else if(state.touchState.left) turn = 1;
            else if(state.touchState.right) turn = -1;
        } else {
            if(state.keys['KeyW'] || state.keys['ArrowUp']) moveInput = 1;
            if(state.keys['KeyS'] || state.keys['ArrowDown']) moveInput = -1;
            if(state.keys['KeyA'] || state.keys['ArrowLeft']) turn = 1;
            if(state.keys['KeyD'] || state.keys['ArrowRight']) turn = -1;
            if(state.keys['Space']) jump = true;
        }

        // 3. PHYSICS
        if (jump && state.playerHeight <= state.groundLevel + 0.1) {
            state.playerVerticalSpeed = CFG.jumpForce;
            audioManager.jump();
        }
        state.playerVerticalSpeed -= CFG.gravity * dt;
        state.playerHeight += state.playerVerticalSpeed * dt;

        if (state.playerHeight < state.groundLevel) {
            state.playerHeight = state.groundLevel;
            state.playerVerticalSpeed = 0;
        }
        playerMesh.position.y = 0.75 + state.playerHeight;

        // 4. MOVE
        if (turn !== 0) playerWrapper.rotateY(turn * CFG.turnSpeed * dt);

        if (moveInput !== 0) {
            const dist = moveInput * CFG.moveSpeed * dt;
            playerWrapper.translateZ(-dist);

            const newPos = playerWrapper.position.clone().normalize().multiplyScalar(CFG.planetRadius);
            let hit = false;

            for(const obs of state.obstacles) {
                if (newPos.distanceTo(obs.pos) < obs.radius) {
                    if (obs.type === 'rock') {
                        if (state.playerHeight >= obs.height * 0.8) {
                            // Landed on rock, ok
                        } else { hit = true; }
                    } else { hit = true; }
                }
            }

            if (!hit) {
                playerWrapper.position.copy(newPos);
                playerMesh.rotation.z = Math.sin(clock.getElapsedTime() * 15) * 0.1;
            } else {
                playerWrapper.translateZ(dist); // Undo
            }
        } else {
            playerMesh.rotation.z *= 0.8;
        }

        // Re-orient to planet surface
        const planetNormal = playerWrapper.position.clone().normalize();
        const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerWrapper.quaternion);
        tempQuat.setFromUnitVectors(currentUp, planetNormal);
        playerWrapper.quaternion.premultiply(tempQuat);

        // 5. COLLISIONS & LOGIC
        // Coins
        for(const c of state.coins) {
            if(!c.active) continue;
            c.mesh.rotation.y += 3.0 * dt;
            c.mesh.position.y = 1.5 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
            if (playerWrapper.position.distanceTo(c.group.position) < 2.0) {
                c.active = false; c.group.visible = false;
                state.levelScore++;
                state.totalScore += 10;
                updateHUD();
                audioManager.coin();
                if(state.levelScore >= CFG.totalCoins) startCountdown(state.currentLevel + 1);
            }
        }

        // Power Pills
        for(const p of state.powerPills) {
            if(!p.active) continue;
            p.mesh.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 5)*0.2);
            if (playerWrapper.position.distanceTo(p.group.position) < 2.0) {
                p.active = false; p.group.visible = false;
                state.powerUpEndTime = Date.now() + CFG.powerDuration;
                audioManager.powerUp();
                trackEvent('power_up');
            }
        }

        // Enemies
        for(const enemy of state.enemies) {
            if(!enemy.active) continue;
            const enemyPos = enemy.group.position.clone();
            const toPlayer = playerWrapper.position.clone().sub(enemyPos);
            const dist = toPlayer.length();

            let moveDir = isPowered ? toPlayer.negate() : toPlayer;
            moveDir.normalize();

            // Separation boids
            const separation = new THREE.Vector3();
            let count = 0;
            for(const other of state.enemies) {
                if(other === enemy || !other.active) continue;
                const diff = enemyPos.clone().sub(other.group.position);
                const len = diff.length();
                if(len < 4.0 && len > 0) {
                    separation.add(diff.normalize().divideScalar(len * 0.5));
                    count++;
                }
            }
            if(count > 0) {
                moveDir.add(separation.multiplyScalar(2.5));
                moveDir.normalize();
            }

            const enemyNormal = enemyPos.clone().normalize();
            const projectedDir = moveDir.sub(enemyNormal.multiplyScalar(moveDir.dot(enemyNormal))).normalize();
            const spd = (isPowered ? CFG.baseEnemySpeed * 0.6 : CFG.baseEnemySpeed) * dt;
            const nextPos = enemyPos.add(projectedDir.multiplyScalar(spd));
            nextPos.normalize().multiplyScalar(CFG.planetRadius);

            enemy.group.position.copy(nextPos);
            const enemyQ = new THREE.Quaternion().setFromUnitVectors(upVector, nextPos.clone().normalize());
            enemy.group.quaternion.copy(enemyQ);

            if (dist < 1.5) {
                if(isPowered) {
                    enemy.active = false; enemy.group.visible = false;
                    state.totalScore += 50;
                    updateHUD();
                    audioManager.eatGhost();
                    setTimeout(() => {
                        if(state.gameState !== "PLAYING") return;
                        enemy.active = true;
                        enemy.group.visible = true;
                        enemy.group.position.copy(enemy.spawnPos);
                    }, 4000);
                } else {
                    if(state.playerHeight > 1.2) { /* Safe */ }
                    else { gameOver(); }
                }
            }
        }

        // CAMERA
        const playerForward = new THREE.Vector3(0, 0, 1).applyQuaternion(playerWrapper.quaternion);
        smoothedForward.lerp(playerForward, CFG.camLag);
        const dot = smoothedForward.dot(planetNormal);
        smoothedForward.sub(planetNormal.clone().multiplyScalar(dot)).normalize();
        
        if (isNaN(smoothedForward.x)) smoothedForward.copy(playerForward);
        
        const cameraOffset = planetNormal.clone().multiplyScalar(CFG.camHeight).add(smoothedForward.clone().multiplyScalar(CFG.camDistance));
        camera.position.copy(playerWrapper.position.clone().add(cameraOffset));
        camera.up.copy(planetNormal);
        camera.lookAt(playerWrapper.position);

        const sunOffset = new THREE.Vector3(50, 100, 50).applyQuaternion(playerWrapper.quaternion);
        dirLight.position.copy(playerWrapper.position).add(sunOffset);

        renderer.render(scene, camera);
    }
    animate();
}