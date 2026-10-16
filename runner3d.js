import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("runner3dCanvas");
const scoreOutput = document.getElementById("runner3dScore");
const distanceOutput = document.getElementById("runner3dDistance");
const status = document.getElementById("runner3dStatus");
const overlay = document.getElementById("runner3dOverlay");
const overlayMessage = document.getElementById("runner3dOverlayMessage");
const startButton = document.getElementById("runner3dStartButton");
const leftButton = document.getElementById("runner3dLeftButton");
const rightButton = document.getElementById("runner3dRightButton");
const jumpButton = document.getElementById("runner3dJumpButton");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#a9d0ce");
scene.fog = new THREE.Fog("#a9d0ce", 28, 92);

const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 130);
camera.position.set(0, 6.4, 12.5);

scene.add(new THREE.HemisphereLight("#f4e7c8", "#31564c", 2.2));
const sunLight = new THREE.DirectionalLight("#ffe2a2", 3.2);
sunLight.position.set(-9, 15, 6);
scene.add(sunLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 150),
  new THREE.MeshStandardMaterial({ color: "#658b68", roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.16, -36);
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 150),
  new THREE.MeshStandardMaterial({ color: "#263b3a", roughness: 0.92 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, -0.08, -36);
scene.add(road);

const laneCenters = [-3.2, 0, 3.2];
const roadMarkers = [];
for (const markerX of [-1.6, 1.6]) {
  for (let index = 0; index < 16; index += 1) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.025, 3.5),
      new THREE.MeshStandardMaterial({ color: "#c4c5a7", emissive: "#333221", roughness: 0.8 })
    );
    marker.position.set(markerX, -0.045, -88 + index * 7.4);
    scene.add(marker);
    roadMarkers.push(marker);
  }
}

for (const edgeX of [-5.95, 5.95]) {
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.035, 150),
    new THREE.MeshStandardMaterial({ color: "#e4a65a", emissive: "#4c2710" })
  );
  edge.position.set(edgeX, -0.035, -36);
  scene.add(edge);
}

const scenery = [];
for (let index = 0; index < 18; index += 1) {
  const side = index % 2 === 0 ? -1 : 1;
  const distance = -8 - Math.floor(index / 2) * 9;
  const height = 5 + (index % 4) * 1.8;
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(3.5 + (index % 3), height, 5),
    new THREE.MeshStandardMaterial({
      color: index % 3 === 0 ? "#52785b" : index % 3 === 1 ? "#77906a" : "#3d6656",
      roughness: 1
    })
  );
  hill.position.set(side * (12 + (index % 3) * 3), height / 2 - 0.1, distance);
  hill.rotation.y = index * 0.73;
  scene.add(hill);
  scenery.push(hill);
}

const lights = [];
for (let index = 0; index < 9; index += 1) {
  const z = -76 + index * 10;
  for (const side of [-1, 1]) {
    const post = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.08, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: "#405d52", roughness: 0.8 })
    );
    pole.position.y = 1.2;
    post.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 8, 6),
      new THREE.MeshStandardMaterial({ color: "#ffe2a2", emissive: "#d67e37", emissiveIntensity: 1.4 })
    );
    lamp.position.y = 2.5;
    post.add(lamp);
    post.position.set(side * 7.3, 0, z);
    scene.add(post);
    lights.push(post);
  }
}

const runner = new THREE.Group();
scene.add(runner);
runner.position.z = 2.5;

const suitMaterial = new THREE.MeshStandardMaterial({ color: "#245c58", roughness: 0.72 });
const trimMaterial = new THREE.MeshStandardMaterial({ color: "#efaa55", roughness: 0.55 });
const helmetMaterial = new THREE.MeshStandardMaterial({ color: "#d9e1cc", roughness: 0.42 });
const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 0.38), suitMaterial);
body.position.y = 1.08;
runner.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), helmetMaterial);
head.position.set(0, 1.72, 0.02);
runner.add(head);
const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.12), trimMaterial);
visor.position.set(0, 1.75, 0.27);
runner.add(visor);

const limbs = [];
for (const side of [-1, 1]) {
  const armPivot = new THREE.Group();
  armPivot.position.set(side * 0.38, 1.3, 0);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.53, 0.2), suitMaterial);
  arm.position.y = -0.22;
  armPivot.add(arm);
  runner.add(armPivot);
  limbs.push(armPivot);

  const legPivot = new THREE.Group();
  legPivot.position.set(side * 0.18, 0.72, 0);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.25), trimMaterial);
  leg.position.y = -0.29;
  legPivot.add(leg);
  runner.add(legPivot);
  limbs.push(legPivot);
}

const cubeChaser = new THREE.Group();
const cubeMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 0.9, 0.9),
  new THREE.MeshStandardMaterial({ color: "#e5282d", emissive: "#791119", emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.12 })
);
cubeChaser.add(cubeMesh);
const cubeEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(cubeMesh.geometry),
  new THREE.LineBasicMaterial({ color: "#ffc1a0" })
);
cubeChaser.add(cubeEdges);
scene.add(cubeChaser);

const hazards = [];
const hazardMaterials = [
  new THREE.MeshStandardMaterial({ color: "#d97b48", roughness: 0.85 }),
  new THREE.MeshStandardMaterial({ color: "#738e6c", roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: "#d6bd76", roughness: 0.8 })
];
const clock = new THREE.Clock();
let gameState = "ready";
let score = 0;
let distance = 54;
let laneIndex = 1;
let targetX = laneCenters[laneIndex];
let jumpHeight = 0;
let jumpVelocity = 0;
let hazardTimer = 0;
let elapsed = 0;

function resizeScene() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function startGame() {
  for (const hazard of hazards) {
    scene.remove(hazard.mesh);
    hazard.mesh.geometry.dispose();
  }
  hazards.length = 0;
  gameState = "running";
  score = 0;
  distance = 54;
  laneIndex = 1;
  targetX = laneCenters[laneIndex];
  jumpHeight = 0;
  jumpVelocity = 0;
  hazardTimer = 0.9;
  elapsed = 0;
  scoreOutput.value = "0";
  distanceOutput.value = "54";
  status.textContent = "Der Würfel ist hinter dir!";
  startButton.textContent = "Neu starten";
  overlay.hidden = true;
  canvas.focus({ preventScroll: true });
}

function finishGame(message) {
  gameState = "over";
  overlayMessage.textContent = message;
  startButton.textContent = "Nochmal spielen";
  overlay.hidden = false;
  status.textContent = `Spiel vorbei. ${Math.floor(score)} Punkte erreicht.`;
}

function moveLane(direction) {
  if (gameState !== "running") return;
  laneIndex = THREE.MathUtils.clamp(laneIndex + direction, 0, laneCenters.length - 1);
  targetX = laneCenters[laneIndex];
}

function jump() {
  if (gameState === "running" && jumpHeight === 0) jumpVelocity = 9.2;
}

function spawnHazard() {
  const lane = Math.floor(Math.random() * laneCenters.length);
  const rock = Math.random() > 0.56;
  const geometry = rock
    ? new THREE.IcosahedronGeometry(0.72, 0)
    : new THREE.BoxGeometry(1.25, 1.2, 0.9);
  const mesh = new THREE.Mesh(geometry, hazardMaterials[Math.floor(Math.random() * hazardMaterials.length)]);
  mesh.position.set(laneCenters[lane], rock ? 0.66 : 0.6, -82);
  mesh.rotation.set(Math.random() * 0.5, Math.random() * 2, Math.random() * 0.5);
  scene.add(mesh);
  hazards.push({ mesh, lane, rock, rotationSpeed: (Math.random() - 0.5) * 1.8 });
}

function updateGame(deltaTime) {
  if (gameState !== "running") return;

  elapsed += deltaTime;
  score += deltaTime * 10;
  distanceOutput.value = `${Math.ceil(distance)}`;
  scoreOutput.value = `${Math.floor(score)}`;
  const runSpeed = 20 + Math.min(score * 0.025, 15);

  runner.position.x = THREE.MathUtils.damp(runner.position.x, targetX, 11, deltaTime);
  runner.position.y = jumpHeight;
  jumpVelocity -= 25 * deltaTime;
  jumpHeight = Math.max(0, jumpHeight + jumpVelocity * deltaTime);
  if (jumpHeight === 0) jumpVelocity = 0;
  for (let index = 0; index < limbs.length; index += 1) {
    limbs[index].rotation.x = Math.sin(elapsed * 13 + index * Math.PI) * (jumpHeight > 0 ? 0.18 : 0.62);
  }

  hazardTimer += deltaTime;
  if (hazardTimer >= Math.max(0.72, 1.35 - elapsed * 0.006)) {
    spawnHazard();
    hazardTimer = 0;
  }

  for (let index = hazards.length - 1; index >= 0; index -= 1) {
    const hazard = hazards[index];
    hazard.mesh.position.z += runSpeed * deltaTime;
    hazard.mesh.rotation.y += hazard.rotationSpeed * deltaTime;
    if (hazard.mesh.position.z > 7) {
      scene.remove(hazard.mesh);
      hazard.mesh.geometry.dispose();
      hazards.splice(index, 1);
      continue;
    }

    const sameLane = Math.abs(runner.position.x - laneCenters[hazard.lane]) < 1.15;
    const atRunner = Math.abs(hazard.mesh.position.z - runner.position.z) < 1.25;
    if (sameLane && atRunner && jumpHeight < (hazard.rock ? 1.25 : 1.05)) {
      distance = Math.max(0, distance - 18);
      status.textContent = distance > 0 ? "Hindernis! Der Würfel kommt näher." : "Der rote Würfel hat dich erwischt!";
      scene.remove(hazard.mesh);
      hazard.mesh.geometry.dispose();
      hazards.splice(index, 1);
      if (distance === 0) {
        finishGame("Der rote Würfel hat dich erwischt!");
        return;
      }
    }
  }

  if (distance <= 0) finishGame("Der rote Würfel hat dich erwischt!");
}

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  updateGame(deltaTime);

  for (const marker of roadMarkers) {
    marker.position.z += (gameState === "running" ? 20 + Math.min(score * 0.025, 15) : 4) * deltaTime;
    if (marker.position.z > 13) marker.position.z -= 118.4;
  }
  for (const light of lights) {
    light.position.z += (gameState === "running" ? 20 + Math.min(score * 0.025, 15) : 4) * deltaTime;
    if (light.position.z > 14) light.position.z -= 90;
  }

  runner.position.x = THREE.MathUtils.damp(runner.position.x, targetX, 11, deltaTime);
  cubeChaser.position.x = THREE.MathUtils.damp(cubeChaser.position.x, runner.position.x + 0.7, 3.5, deltaTime);
  cubeChaser.position.y = 0.98 + Math.sin(performance.now() * 0.004) * 0.1;
  cubeChaser.position.z = runner.position.z + 1.3 + distance * 0.015;
  cubeChaser.rotation.x += deltaTime * 0.8;
  cubeChaser.rotation.y += deltaTime * 1.35;
  cubeChaser.rotation.z += deltaTime * 0.48;
  camera.position.x = THREE.MathUtils.damp(camera.position.x, runner.position.x * 0.14, 2, deltaTime);
  camera.lookAt(runner.position.x * 0.08, 0.9, -13);

  renderer.render(scene, camera);
}

startButton.addEventListener("click", startGame);
leftButton.addEventListener("click", () => moveLane(-1));
rightButton.addEventListener("click", () => moveLane(1));
jumpButton.addEventListener("click", jump);
canvas.addEventListener("pointerdown", jump);
canvas.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "ArrowLeft" || event.code === "KeyA") moveLane(-1);
  if (event.code === "ArrowRight" || event.code === "KeyD") moveLane(1);
  if (event.code === "ArrowUp" || event.code === "Space" || event.code === "KeyW") jump();
});
window.addEventListener("resize", resizeScene);
new ResizeObserver(resizeScene).observe(canvas);

resizeScene();
animate();
