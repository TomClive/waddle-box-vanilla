import * as THREE from 'three';
import { CFG } from './config.js';
import { scene, worldLayer, mat, addOutline, dirLight } from './graphics.js';
import { state } from './state.js';

export const upVector = new THREE.Vector3(0, 1, 0);

// Planet
const planetGeo = new THREE.IcosahedronGeometry(CFG.planetRadius, 5);
export const planet = new THREE.Mesh(planetGeo, mat.planet);
planet.receiveShadow = true;
addOutline(planet, planetGeo, 0.1);
scene.add(planet);

// Player
export const playerWrapper = new THREE.Group();
playerWrapper.position.set(0, CFG.planetRadius, 0);
scene.add(playerWrapper);
dirLight.target = playerWrapper;

const playerGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
export const playerMesh = new THREE.Mesh(playerGeo, mat.player);
playerMesh.position.y = 0.75;
playerMesh.castShadow = true;
playerMesh.receiveShadow = true;
addOutline(playerMesh, playerGeo);
playerWrapper.add(playerMesh);

function getRandomPos(minDist) {
    const phi = Math.acos(-1 + (2 * Math.random()));
    const theta = Math.sqrt(Math.PI * 50 * phi) * phi;
    const x = CFG.planetRadius * Math.cos(theta) * Math.sin(phi);
    const y = CFG.planetRadius * Math.sin(theta) * Math.sin(phi);
    const z = CFG.planetRadius * Math.cos(phi);
    const pos = new THREE.Vector3(x, y, z);
    
    if (pos.distanceTo(new THREE.Vector3(0, CFG.planetRadius, 0)) < minDist) return null;
    
    for(const obs of state.obstacles) {
        if (pos.distanceTo(obs.pos) < obs.radius + 1) return null;
    }
    return pos;
}

export function spawnScenery(type) {
    const pos = getRandomPos(5);
    if (!pos) return false;
    
    const group = new THREE.Group();
    group.position.copy(pos);
    group.quaternion.setFromUnitVectors(upVector, pos.clone().normalize());
    
    if(type === 'tree') {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2, 6);
        trunkGeo.translate(0, 1, 0);
        const trunk = new THREE.Mesh(trunkGeo, mat.trunk);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        addOutline(trunk, trunkGeo);
        group.add(trunk);
        
        const leavesGeo = new THREE.ConeGeometry(1.5, 3, 5);
        leavesGeo.translate(0, 3, 0);
        const leaves = new THREE.Mesh(leavesGeo, mat.tree);
        leaves.castShadow = true;
        addOutline(leaves, leavesGeo);
        group.add(leaves);
        
        state.obstacles.push({ pos: pos, radius: 0.6, height: 8, type: 'tree' });
    } else {
        const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);
        const rock = new THREE.Mesh(rockGeo, mat.rock);
        rock.position.y = 0.6;
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        addOutline(rock, rockGeo);
        group.add(rock);
        
        state.obstacles.push({ pos: pos, radius: 1.3, height: 1.2, type: 'rock' });
    }
    worldLayer.add(group);
    return true;
}

export function spawnCoin() {
    const pos = getRandomPos(8);
    if(!pos) return false;
    
    const group = new THREE.Group();
    group.position.copy(pos);
    group.quaternion.setFromUnitVectors(upVector, pos.clone().normalize());
    
    const coinGeo = new THREE.TorusGeometry(0.6, 0.2, 8, 16);
    const coin = new THREE.Mesh(coinGeo, mat.coin);
    coin.position.y = 1.5;
    coin.castShadow = true;
    addOutline(coin, coinGeo);
    
    group.add(coin);
    worldLayer.add(group);
    state.coins.push({ mesh: coin, group: group, active: true });
    return true;
}

export function spawnPowerPill() {
    const pos = getRandomPos(10);
    if(!pos) return false;
    
    const group = new THREE.Group();
    group.position.copy(pos);
    group.quaternion.setFromUnitVectors(upVector, pos.clone().normalize());
    
    const geo = new THREE.DodecahedronGeometry(0.8);
    const mesh = new THREE.Mesh(geo, mat.powerPill);
    mesh.position.y = 1.5;
    mesh.castShadow = true;
    addOutline(mesh, geo);
    
    group.add(mesh);
    worldLayer.add(group);
    state.powerPills.push({ mesh: mesh, group: group, active: true });
    return true;
}

export function spawnEnemy() {
    const pos = getRandomPos(20);
    if(!pos) return false;
    
    const group = new THREE.Group();
    group.position.copy(pos);
    group.quaternion.setFromUnitVectors(upVector, pos.clone().normalize());
    
    const bodyGeo = new THREE.SphereGeometry(0.9, 16, 16);
    bodyGeo.scale(1, 0.7, 1);
    const body = new THREE.Mesh(bodyGeo, mat.enemy);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    addOutline(body, bodyGeo);
    
    group.add(body);
    worldLayer.add(group);
    state.enemies.push({ group: group, active: true, spawnPos: pos.clone() });
    return true;
}