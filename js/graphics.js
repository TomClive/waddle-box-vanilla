import * as THREE from 'three';
import { CFG } from './config.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.colors.bg);
scene.fog = new THREE.Fog(CFG.colors.bg, 60, 100);

export const worldLayer = new THREE.Group();
scene.add(worldLayer);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const d = 26;
const aspect = window.innerWidth / window.innerHeight;
export const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 500);
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

export const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

export const mat = {
    planet: new THREE.MeshToonMaterial({ color: CFG.colors.planet }),
    player: new THREE.MeshToonMaterial({ color: CFG.colors.player }),
    enemy: new THREE.MeshToonMaterial({ color: CFG.colors.enemyNormal }),
    coin: new THREE.MeshToonMaterial({ color: CFG.colors.coin, emissive: 0x333300 }),
    powerPill: new THREE.MeshToonMaterial({ color: CFG.colors.powerPill, emissive: 0x004444 }),
    tree: new THREE.MeshToonMaterial({ color: CFG.colors.tree }),
    trunk: new THREE.MeshToonMaterial({ color: CFG.colors.trunk }),
    rock: new THREE.MeshToonMaterial({ color: CFG.colors.rock, flatShading: true }),
    outline: new THREE.MeshBasicMaterial({ color: CFG.colors.outline, side: THREE.BackSide })
};

export function addOutline(mesh, geometry, scaleOverride = 1.0) {
    const outlineMesh = new THREE.Mesh(geometry, mat.outline);
    const s = 1 + CFG.outlineThickness * scaleOverride;
    outlineMesh.scale.set(s, s, s);
    mesh.add(outlineMesh);
}

export function handleResize() {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -d * newAspect;
    camera.right = d * newAspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}