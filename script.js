const popup = document.getElementById("popup");
const playVideoButton = document.getElementById("playVideoBtn");
const videoPlayerContainer = document.getElementById("videoPlayerContainer");
const satisfyingVideo = document.getElementById("satisfyingVideo");
const clickCounterButton = document.getElementById("clickCounterBtn");
const impactMapElement = document.getElementById("impactMap");
const googleMap = document.getElementById("googleMap");
const mapEffects = document.getElementById("mapEffects");
const impactSearchForm = document.getElementById("impactSearchForm");
const impactPlaceInput = document.getElementById("impactPlaceInput");
const asteroidMaterial = document.getElementById("asteroidMaterial");
const asteroidDiameterInput = document.getElementById("asteroidDiameter");
const asteroidSpeedInput = document.getElementById("asteroidSpeed");
const asteroidAngleInput = document.getElementById("asteroidAngle");
const diameterValue = document.getElementById("diameterValue");
const speedValue = document.getElementById("speedValue");
const angleValue = document.getElementById("angleValue");
const impactCountLabel = document.getElementById("impactCount");
const throwStatus = document.getElementById("throwStatus");
const impactEnergyLabel = document.getElementById("impactEnergy");
const asteroidModelDiameterLabel = document.getElementById("asteroidModelDiameter");
const asteroidModelMaterialLabel = document.getElementById("asteroidModelMaterial");
const asteroidModelSpeedLabel = document.getElementById("asteroidModelSpeed");
const asteroidModelAngleLabel = document.getElementById("asteroidModelAngle");
const impactLocationLabel = document.getElementById("impactLocation");
const launchAsteroidButton = document.getElementById("launchAsteroidButton");
const mapHint = document.getElementById("mapHint");
const openDefenseButton = document.getElementById("openDefenseButton");
const defenseSection = document.getElementById("asteroidDefense");
const defenseCanvas = document.getElementById("defenseCanvas");
const defenseContext = defenseCanvas.getContext("2d");
const defenseScoreLabel = document.getElementById("defenseScore");
const defenseLivesLabel = document.getElementById("defenseLives");
const defenseBossPanel = document.getElementById("defenseBossPanel");
const defenseBossHealthLabel = document.getElementById("defenseBossHealth");
const defenseStatus = document.getElementById("defenseStatus");
const restartDefenseButton = document.getElementById("restartDefenseButton");
const defenseWidth = defenseCanvas.width;
const defenseHeight = defenseCanvas.height;
const defenseBossTriggerScore = 300;
const defenseBossStartingHealth = 50;
const joulesPerMegatonTnt = 4.184e15;
let clickCount = 0;
let impactCount = 0;
let impactLocation = null;
let asteroidInFlight = false;
let defenseRunning = false;
let defenseFrame = 0;
let defenseLastFrame = 0;
let defenseSpawnTimer = 0;
let defenseShotCooldown = 0;
let defenseScore = 0;
let defenseLives = 3;
let defenseBoss = null;
let defenseBossDefeated = false;
let defenseAim = { x: defenseWidth / 2, y: defenseHeight / 3 };
const defenseAsteroids = [];
const defenseShots = [];
const defenseStars = Array.from({ length: 72 }, () => ({
  x: Math.random() * defenseWidth,
  y: Math.random() * defenseHeight,
  radius: Math.random() * 1.5 + 0.4
}));

function calculateImpactEnergyMegatons(diameterMeters, density, speedKmPerSecond) {
  const radiusMeters = diameterMeters / 2;
  const massKg = (4 / 3) * Math.PI * radiusMeters ** 3 * density;
  return (0.5 * massKg * (speedKmPerSecond * 1000) ** 2) / joulesPerMegatonTnt;
}

function formatDiameter(diameterMeters) {
  return diameterMeters >= 1000
    ? `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(diameterMeters / 1000)} km`
    : `${diameterMeters} m`;
}

function updateAsteroidSettings() {
  const diameter = Number(asteroidDiameterInput.value);
  const speed = Number(asteroidSpeedInput.value);
  const angle = Number(asteroidAngleInput.value);
  const material = asteroidMaterial.selectedOptions[0];
  const density = Number(material.dataset.density);
  const energy = calculateImpactEnergyMegatons(diameter, density, speed);
  const formattedEnergy = new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 4 }).format(energy);
  const formattedDiameter = formatDiameter(diameter);
  const formattedSpeed = `${speed} km/s`;

  diameterValue.value = formattedDiameter;
  speedValue.value = formattedSpeed;
  angleValue.value = `${angle}°`;
  impactEnergyLabel.value = formattedEnergy;
  asteroidModelDiameterLabel.value = formattedDiameter;
  asteroidModelMaterialLabel.value = material.textContent;
  asteroidModelSpeedLabel.value = formattedSpeed;
  asteroidModelAngleLabel.value = `${angle}°`;
}

function selectImpactLocation(event) {
  event.preventDefault();
  const selectedLocation = impactPlaceInput.value.trim();
  if (!selectedLocation) return;

  impactLocation = selectedLocation;
  googleMap.src = `https://maps.google.com/maps?q=${encodeURIComponent(impactLocation)}&z=5&output=embed`;
  impactLocationLabel.textContent = impactLocation;
  mapHint.textContent = `Einschlagsort: ${impactLocation}`;
  launchAsteroidButton.disabled = false;
  throwStatus.textContent = "Ort auf der Karte gesetzt. Asteroid bereit zum Start.";
}

function showImpact(location, energy) {
  impactCount += 1;
  impactCountLabel.textContent = impactCount;
  const diameter = Number(asteroidDiameterInput.value);
  const speed = Number(asteroidSpeedInput.value);
  const angle = Number(asteroidAngleInput.value);
  const density = Number(asteroidMaterial.selectedOptions[0].dataset.density);
  const craterDiameterKm = (diameter * 18 * (speed / 20) ** 0.4 * (density / 3000) ** 0.15 * Math.sin(angle * Math.PI / 180) ** 0.33) / 1000;
  const damageRadiusKm = craterDiameterKm * 2.7;
  mapEffects.querySelectorAll(".impact-crater").forEach((crater) => crater.remove());
  const crater = document.createElement("div");
  crater.className = "impact-crater";
  crater.style.setProperty("--crater-size", `${Math.min(220, 48 + craterDiameterKm * 1.5)}px`);
  mapEffects.append(crater);
  throwStatus.textContent = `Einschlag bei ${location}! Krater: ca. ${craterDiameterKm.toFixed(1)} km. Zerstörungsradius: ca. ${damageRadiusKm.toFixed(1)} km. Energie: ${new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 4 }).format(energy)} Mt TNT.`;
}

function launchAsteroid() {
  if (!impactLocation || asteroidInFlight) return;
  asteroidInFlight = true;
  launchAsteroidButton.disabled = true;
  const diameter = Number(asteroidDiameterInput.value);
  const speed = Number(asteroidSpeedInput.value);
  const angle = Number(asteroidAngleInput.value);
  const density = Number(asteroidMaterial.selectedOptions[0].dataset.density);
  const energy = calculateImpactEnergyMegatons(diameter, density, speed);
  const end = { x: mapEffects.clientWidth / 2, y: mapEffects.clientHeight / 2 };
  const distance = Math.min(mapEffects.clientWidth * 0.8, 360);
  const radians = angle * Math.PI / 180;
  const start = { x: end.x - Math.cos(radians) * distance, y: end.y + Math.sin(radians) * distance };
  const projectile = document.createElement("div");
  projectile.className = "asteroid-projectile";
  projectile.style.setProperty("--projectile-size", `${Math.min(54, 20 + diameter / 100)}px`);
  mapEffects.append(projectile);
  throwStatus.textContent = "Asteroid im Anflug ...";

  const flightStart = performance.now();
  const fly = (timestamp) => {
    const progress = Math.min((timestamp - flightStart) / 900, 1);
    const eased = 1 - (1 - progress) ** 2;
    const x = start.x + (end.x - start.x) * eased;
    const y = start.y + (end.y - start.y) * eased - Math.sin(progress * Math.PI) * 70;
    projectile.style.left = `${x}px`;
    projectile.style.top = `${y}px`;
    projectile.style.transform = `translate(-50%, -50%) rotate(${progress * 540}deg) scale(${1 + progress * 0.7})`;
    if (progress < 1) {
      requestAnimationFrame(fly);
      return;
    }
    projectile.remove();
    asteroidInFlight = false;
    launchAsteroidButton.disabled = false;
    showImpact(impactLocation, energy);
  };
  requestAnimationFrame(fly);
}

[asteroidDiameterInput, asteroidSpeedInput, asteroidAngleInput, asteroidMaterial].forEach((control) => {
  control.addEventListener("input", updateAsteroidSettings);
  control.addEventListener("change", updateAsteroidSettings);
});
launchAsteroidButton.addEventListener("click", launchAsteroid);
impactSearchForm.addEventListener("submit", selectImpactLocation);
updateAsteroidSettings();

function drawDefenseAsteroid(asteroid) {
  const colors = ["#bd7150", "#aab5aa", "#839b9c", "#d2a94d"];
  const color = colors[asteroid.colorIndex];
  defenseContext.save();
  defenseContext.translate(asteroid.x, asteroid.y);
  defenseContext.rotate(asteroid.rotation);
  defenseContext.beginPath();
  asteroid.vertices.forEach((scale, index) => {
    const angle = (index / asteroid.vertices.length) * Math.PI * 2;
    const x = Math.cos(angle) * asteroid.radius * scale;
    const y = Math.sin(angle) * asteroid.radius * scale;
    if (index === 0) defenseContext.moveTo(x, y);
    else defenseContext.lineTo(x, y);
  });
  defenseContext.closePath();
  defenseContext.fillStyle = color;
  defenseContext.strokeStyle = "#263a37";
  defenseContext.lineWidth = 2;
  defenseContext.fill();
  defenseContext.stroke();
  defenseContext.fillStyle = "rgba(25, 43, 39, 0.35)";
  defenseContext.beginPath();
  defenseContext.arc(-asteroid.radius * 0.25, -asteroid.radius * 0.15, asteroid.radius * 0.19, 0, Math.PI * 2);
  defenseContext.arc(asteroid.radius * 0.3, asteroid.radius * 0.25, asteroid.radius * 0.12, 0, Math.PI * 2);
  defenseContext.fill();
  defenseContext.restore();
}

function drawDefenseGame() {
  defenseContext.clearRect(0, 0, defenseWidth, defenseHeight);
  defenseContext.fillStyle = "rgba(227, 240, 218, 0.75)";
  for (const star of defenseStars) {
    defenseContext.beginPath();
    defenseContext.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    defenseContext.fill();
  }

  for (const asteroid of defenseAsteroids) drawDefenseAsteroid(asteroid);

  if (defenseBoss) drawDefenseBoss();

  defenseContext.strokeStyle = "#f2ce74";
  defenseContext.lineWidth = 3;
  defenseContext.lineCap = "round";
  for (const shot of defenseShots) {
    defenseContext.beginPath();
    defenseContext.moveTo(shot.x, shot.y);
    defenseContext.lineTo(shot.x - shot.velocityX * 0.025, shot.y - shot.velocityY * 0.025);
    defenseContext.stroke();
  }

  const shipX = defenseWidth / 2;
  const shipY = defenseHeight - 30;
  defenseContext.fillStyle = "#65b6a0";
  defenseContext.strokeStyle = "#d4eee0";
  defenseContext.lineWidth = 2;
  defenseContext.beginPath();
  defenseContext.moveTo(shipX, shipY - 17);
  defenseContext.lineTo(shipX + 18, shipY + 13);
  defenseContext.lineTo(shipX, shipY + 7);
  defenseContext.lineTo(shipX - 18, shipY + 13);
  defenseContext.closePath();
  defenseContext.fill();
  defenseContext.stroke();

  defenseContext.strokeStyle = "rgba(242, 206, 116, 0.8)";
  defenseContext.lineWidth = 1.5;
  defenseContext.beginPath();
  defenseContext.arc(defenseAim.x, defenseAim.y, 9, 0, Math.PI * 2);
  defenseContext.moveTo(defenseAim.x - 14, defenseAim.y);
  defenseContext.lineTo(defenseAim.x - 5, defenseAim.y);
  defenseContext.moveTo(defenseAim.x + 5, defenseAim.y);
  defenseContext.lineTo(defenseAim.x + 14, defenseAim.y);
  defenseContext.moveTo(defenseAim.x, defenseAim.y - 14);
  defenseContext.lineTo(defenseAim.x, defenseAim.y - 5);
  defenseContext.moveTo(defenseAim.x, defenseAim.y + 5);
  defenseContext.lineTo(defenseAim.x, defenseAim.y + 14);
  defenseContext.stroke();

  if (!defenseRunning && defenseLives === 0) {
    defenseContext.fillStyle = "rgba(8, 20, 18, 0.72)";
    defenseContext.fillRect(0, 0, defenseWidth, defenseHeight);
    defenseContext.fillStyle = "#f4f6ef";
    defenseContext.font = "700 28px sans-serif";
    defenseContext.textAlign = "center";
    defenseContext.fillText("Abwehr beendet", defenseWidth / 2, defenseHeight / 2);
  }
}

function drawDefenseBoss() {
  const { x, y, radius, hitFlash } = defenseBoss;
  defenseContext.save();
  defenseContext.translate(x, y);
  defenseContext.shadowColor = "rgba(236, 94, 65, 0.75)";
  defenseContext.shadowBlur = 18;
  defenseContext.beginPath();
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2 - Math.PI / 2;
    const pointRadius = radius * (index % 2 === 0 ? 1.2 : 0.92);
    const pointX = Math.cos(angle) * pointRadius;
    const pointY = Math.sin(angle) * pointRadius;
    if (index === 0) defenseContext.moveTo(pointX, pointY);
    else defenseContext.lineTo(pointX, pointY);
  }
  defenseContext.closePath();
  defenseContext.fillStyle = hitFlash > 0 ? "#fff0cc" : "#a83e34";
  defenseContext.strokeStyle = "#f2be59";
  defenseContext.lineWidth = 4;
  defenseContext.fill();
  defenseContext.stroke();
  defenseContext.shadowBlur = 0;

  defenseContext.fillStyle = "#562c32";
  defenseContext.beginPath();
  defenseContext.ellipse(-radius * 0.35, -radius * 0.1, radius * 0.18, radius * 0.27, -0.35, 0, Math.PI * 2);
  defenseContext.ellipse(radius * 0.35, -radius * 0.1, radius * 0.18, radius * 0.27, 0.35, 0, Math.PI * 2);
  defenseContext.fill();
  defenseContext.fillStyle = "#ffd76b";
  defenseContext.beginPath();
  defenseContext.arc(-radius * 0.35, -radius * 0.1, radius * 0.08, 0, Math.PI * 2);
  defenseContext.arc(radius * 0.35, -radius * 0.1, radius * 0.08, 0, Math.PI * 2);
  defenseContext.fill();
  defenseContext.restore();

  const healthRatio = defenseBoss.health / defenseBoss.maxHealth;
  const barWidth = radius * 2.6;
  const barX = x - barWidth / 2;
  const barY = y - radius * 1.55;
  defenseContext.fillStyle = "rgba(12, 25, 23, 0.85)";
  defenseContext.fillRect(barX, barY, barWidth, 8);
  defenseContext.fillStyle = "#f07855";
  defenseContext.fillRect(barX, barY, barWidth * healthRatio, 8);
}

function fireDefenseShot() {
  if (!defenseRunning || defenseShotCooldown > 0) return;

  const shipX = defenseWidth / 2;
  const shipY = defenseHeight - 30;
  const directionX = defenseAim.x - shipX;
  const directionY = defenseAim.y - shipY;
  const directionLength = Math.hypot(directionX, directionY) || 1;
  defenseShots.push({
    x: shipX,
    y: shipY - 14,
    velocityX: (directionX / directionLength) * 640,
    velocityY: (directionY / directionLength) * 640
  });
  defenseShotCooldown = 0.16;
}

function spawnDefenseAsteroid() {
  const radius = 14 + Math.random() * 13;
  defenseAsteroids.push({
    x: radius + Math.random() * (defenseWidth - radius * 2),
    y: -radius,
    radius,
    velocityX: (Math.random() - 0.5) * 48,
    velocityY: 58 + Math.random() * 42 + defenseScore * 0.18,
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 1.8,
    colorIndex: Math.floor(Math.random() * 4),
    vertices: Array.from({ length: 9 }, () => 0.72 + Math.random() * 0.28)
  });
}

function spawnDefenseBoss() {
  defenseBoss = {
    x: defenseWidth / 2,
    y: 90,
    radius: 48,
    health: defenseBossStartingHealth,
    maxHealth: defenseBossStartingHealth,
    horizontalSpeed: 115,
    hitFlash: 0
  };
  defenseAsteroids.length = 0;
  defenseBossPanel.hidden = false;
  defenseBossHealthLabel.value = defenseBoss.health;
  defenseStatus.textContent = "Boss im Anflug! Triff ihn 50-mal, um ihn zu zerstören.";
}

function finishDefenseGame() {
  defenseRunning = false;
  defenseLives = 0;
  defenseLivesLabel.value = defenseLives;
  defenseStatus.textContent = `Abwehr beendet. ${defenseScore} Punkte.`;
  restartDefenseButton.hidden = false;
  drawDefenseGame();
}

function updateDefenseGame(timestamp) {
  if (!defenseRunning) return;

  const deltaTime = Math.min((timestamp - defenseLastFrame) / 1000, 0.05);
  defenseLastFrame = timestamp;
  defenseShotCooldown = Math.max(0, defenseShotCooldown - deltaTime);
  if (!defenseBoss && !defenseBossDefeated) {
    defenseSpawnTimer += deltaTime;
    const spawnInterval = Math.max(0.4, 1.05 - defenseScore * 0.004);
    if (defenseSpawnTimer >= spawnInterval) {
      spawnDefenseAsteroid();
      defenseSpawnTimer = 0;
    }
  }

  for (let index = defenseShots.length - 1; index >= 0; index -= 1) {
    const shot = defenseShots[index];
    shot.x += shot.velocityX * deltaTime;
    shot.y += shot.velocityY * deltaTime;
    if (shot.x < 0 || shot.x > defenseWidth || shot.y < 0 || shot.y > defenseHeight) {
      defenseShots.splice(index, 1);
    }
  }

  for (let asteroidIndex = defenseAsteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
    const asteroid = defenseAsteroids[asteroidIndex];
    asteroid.x += asteroid.velocityX * deltaTime;
    asteroid.y += asteroid.velocityY * deltaTime;
    asteroid.rotation += asteroid.rotationSpeed * deltaTime;
    if (asteroid.x < asteroid.radius || asteroid.x > defenseWidth - asteroid.radius) asteroid.velocityX *= -1;
    if (asteroid.y - asteroid.radius > defenseHeight) {
      defenseAsteroids.splice(asteroidIndex, 1);
      defenseLives -= 1;
      defenseLivesLabel.value = defenseLives;
      if (defenseLives === 0) {
        finishDefenseGame();
        return;
      }
      continue;
    }

    for (let shotIndex = defenseShots.length - 1; shotIndex >= 0; shotIndex -= 1) {
      const shot = defenseShots[shotIndex];
      if (Math.hypot(asteroid.x - shot.x, asteroid.y - shot.y) < asteroid.radius + 5) {
        defenseAsteroids.splice(asteroidIndex, 1);
        defenseShots.splice(shotIndex, 1);
        defenseScore += 10;
        defenseScoreLabel.value = defenseScore;
        defenseStatus.textContent = `Treffer. ${defenseScore} Punkte.`;
        if (defenseScore >= defenseBossTriggerScore && !defenseBossDefeated) {
          spawnDefenseBoss();
        }
        break;
      }
    }
    if (defenseBoss) break;
  }

  if (defenseBoss) {
    defenseBoss.x += defenseBoss.horizontalSpeed * deltaTime;
    if (defenseBoss.x < defenseBoss.radius || defenseBoss.x > defenseWidth - defenseBoss.radius) {
      defenseBoss.horizontalSpeed *= -1;
    }
    defenseBoss.y = 88 + Math.sin(timestamp / 430) * 14;
    defenseBoss.hitFlash = Math.max(0, defenseBoss.hitFlash - deltaTime);

    for (let shotIndex = defenseShots.length - 1; shotIndex >= 0; shotIndex -= 1) {
      const shot = defenseShots[shotIndex];
      if (Math.hypot(defenseBoss.x - shot.x, defenseBoss.y - shot.y) < defenseBoss.radius + 5) {
        defenseShots.splice(shotIndex, 1);
        defenseBoss.health -= 1;
        defenseBoss.hitFlash = 0.12;
        defenseBossHealthLabel.value = defenseBoss.health;
        if (defenseBoss.health === 0) {
          defenseBoss = null;
          defenseBossDefeated = true;
          defenseScore += 100;
          defenseScoreLabel.value = defenseScore;
          defenseBossPanel.hidden = true;
          defenseStatus.textContent = `Boss zerstört! 100 Bonuspunkte. Gesamt: ${defenseScore} Punkte.`;
          break;
        }
        defenseStatus.textContent = `Boss getroffen. Noch ${defenseBoss.health} Treffer!`;
      }
    }
  }

  drawDefenseGame();
  defenseFrame = window.requestAnimationFrame(updateDefenseGame);
}

function startDefenseGame() {
  window.cancelAnimationFrame(defenseFrame);
  defenseRunning = true;
  defenseLastFrame = performance.now();
  defenseSpawnTimer = 0;
  defenseShotCooldown = 0;
  defenseScore = 0;
  defenseLives = 3;
  defenseBoss = null;
  defenseBossDefeated = false;
  defenseAsteroids.length = 0;
  defenseShots.length = 0;
  defenseScoreLabel.value = defenseScore;
  defenseLivesLabel.value = defenseLives;
  defenseBossHealthLabel.value = defenseBossStartingHealth;
  defenseBossPanel.hidden = true;
  defenseStatus.textContent = "Asteroiden im Anflug.";
  restartDefenseButton.hidden = true;
  defenseAim = { x: defenseWidth / 2, y: defenseHeight / 3 };
  drawDefenseGame();
  defenseCanvas.focus({ preventScroll: true });
  defenseFrame = window.requestAnimationFrame(updateDefenseGame);
}

function updateDefenseAim(event) {
  const bounds = defenseCanvas.getBoundingClientRect();
  defenseAim = {
    x: Math.max(0, Math.min(defenseWidth, (event.clientX - bounds.left) * defenseWidth / bounds.width)),
    y: Math.max(0, Math.min(defenseHeight - 30, (event.clientY - bounds.top) * defenseHeight / bounds.height))
  };
}

openDefenseButton.addEventListener("click", () => {
  defenseSection.hidden = false;
  openDefenseButton.hidden = true;
  startDefenseGame();
  defenseSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

restartDefenseButton.addEventListener("click", startDefenseGame);
defenseCanvas.addEventListener("pointermove", updateDefenseAim);
defenseCanvas.addEventListener("pointerdown", (event) => {
  updateDefenseAim(event);
  defenseCanvas.focus({ preventScroll: true });
  fireDefenseShot();
});
defenseCanvas.addEventListener("keydown", (event) => {
  const step = 24;
  const movement = {
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0]
  }[event.key];

  if (movement) {
    event.preventDefault();
    defenseAim.x = Math.max(0, Math.min(defenseWidth, defenseAim.x + movement[0]));
    defenseAim.y = Math.max(0, Math.min(defenseHeight - 30, defenseAim.y + movement[1]));
  } else if (event.code === "Space") {
    event.preventDefault();
    fireDefenseShot();
  }
});

const dinoCanvas = document.getElementById("dinoCanvas");
const dinoContext = dinoCanvas.getContext("2d");
const dinoScoreLabel = document.getElementById("dinoScore");
const dinoStatus = document.getElementById("dinoStatus");
const dinoStartButton = document.getElementById("dinoStartButton");
const dinoWidth = dinoCanvas.width;
const dinoHeight = dinoCanvas.height;
const dinoX = 64;
const dinoHeightPixels = 42;
const dinoGroundY = dinoHeight - 30;
let dinoRunning = false;
let dinoFrame = 0;
let dinoLastFrame = 0;
let dinoElapsed = 0;
let dinoScore = 0;
let dinoPositionY = dinoGroundY - dinoHeightPixels;
let dinoVelocityY = 0;
let dinoObstacleTimer = 0;
let dinoObstacleInterval = 1.25;
let dinoObstacles = [];

function drawDinoScene() {
  dinoContext.clearRect(0, 0, dinoWidth, dinoHeight);
  dinoContext.fillStyle = "#f4f6ef";
  dinoContext.fillRect(0, 0, dinoWidth, dinoHeight);

  dinoContext.fillStyle = "#d7dfd3";
  for (const cloud of [{ x: 155, y: 48 }, { x: 445, y: 72 }, { x: 650, y: 38 }]) {
    const cloudX = ((cloud.x - dinoElapsed * 12) % (dinoWidth + 80) + dinoWidth + 80) % (dinoWidth + 80) - 40;
    dinoContext.fillRect(cloudX, cloud.y, 42, 2);
    dinoContext.fillRect(cloudX + 10, cloud.y - 4, 18, 2);
  }

  dinoContext.strokeStyle = "#657a68";
  dinoContext.lineWidth = 2;
  dinoContext.beginPath();
  dinoContext.moveTo(0, dinoGroundY + 1);
  dinoContext.lineTo(dinoWidth, dinoGroundY + 1);
  dinoContext.stroke();
  dinoContext.fillStyle = "#9aa894";
  for (let index = 0; index < 12; index += 1) {
    const dashX = ((index * 83 - dinoElapsed * 270) % (dinoWidth + 12) + dinoWidth + 12) % (dinoWidth + 12);
    dinoContext.fillRect(dashX, dinoGroundY + 9, 10, 2);
  }

  const dinoTop = dinoPositionY;
  const dinoColor = "#31594b";
  dinoContext.fillStyle = dinoColor;
  dinoContext.fillRect(dinoX + 8, dinoTop + 11, 26, 25);
  dinoContext.fillRect(dinoX + 23, dinoTop + 1, 22, 21);
  dinoContext.fillRect(dinoX + 39, dinoTop + 8, 16, 9);
  dinoContext.fillRect(dinoX + 2, dinoTop + 24, 10, 5);
  dinoContext.fillRect(dinoX + 1, dinoTop + 21, 8, 5);
  dinoContext.fillRect(dinoX + 17, dinoTop + 32, 13, 7);
  dinoContext.fillRect(dinoX + 25, dinoTop + 36, 9, 5);
  dinoContext.fillStyle = "#f4f6ef";
  dinoContext.fillRect(dinoX + 38, dinoTop + 5, 3, 3);

  const legOffset = dinoRunning && dinoPositionY >= dinoGroundY - dinoHeightPixels - 1
    ? Math.floor(dinoElapsed * 14) % 2
    : 0;
  dinoContext.fillStyle = dinoColor;
  dinoContext.fillRect(dinoX + 13, dinoTop + 35, 7, 9 - legOffset * 4);
  dinoContext.fillRect(dinoX + 27, dinoTop + 36, 7, 8 - (1 - legOffset) * 4);

  for (const obstacle of dinoObstacles) {
    dinoContext.fillStyle = "#b4563c";
    dinoContext.fillRect(obstacle.x + obstacle.width * 0.32, dinoGroundY - obstacle.height, obstacle.width * 0.36, obstacle.height);
    dinoContext.fillRect(obstacle.x, dinoGroundY - obstacle.height * 0.64, obstacle.width * 0.38, 7);
    dinoContext.fillRect(obstacle.x, dinoGroundY - obstacle.height * 0.64, 6, obstacle.height * 0.3);
    if (obstacle.width > 23) {
      dinoContext.fillRect(obstacle.x + obstacle.width * 0.62, dinoGroundY - obstacle.height * 0.48, obstacle.width * 0.38, 7);
      dinoContext.fillRect(obstacle.x + obstacle.width * 0.78, dinoGroundY - obstacle.height * 0.48, 6, obstacle.height * 0.25);
    }
  }

  if (!dinoRunning && dinoScore > 0) {
    dinoContext.fillStyle = "rgba(244, 246, 239, 0.78)";
    dinoContext.fillRect(0, 0, dinoWidth, dinoHeight);
    dinoContext.fillStyle = "#31594b";
    dinoContext.font = "700 24px sans-serif";
    dinoContext.textAlign = "center";
    dinoContext.fillText("Lauf vorbei", dinoWidth / 2, dinoHeight / 2);
  }
}

function startDinoRun() {
  window.cancelAnimationFrame(dinoFrame);
  dinoRunning = true;
  dinoLastFrame = performance.now();
  dinoElapsed = 0;
  dinoScore = 0;
  dinoPositionY = dinoGroundY - dinoHeightPixels;
  dinoVelocityY = 0;
  dinoObstacleTimer = 0;
  dinoObstacleInterval = 1.25;
  dinoObstacles = [];
  dinoScoreLabel.value = 0;
  dinoStatus.textContent = "Los geht's! Spring über die Hindernisse.";
  dinoStartButton.textContent = "Neu starten";
  dinoCanvas.focus({ preventScroll: true });
  dinoFrame = window.requestAnimationFrame(updateDinoRun);
}

function finishDinoRun() {
  dinoRunning = false;
  dinoStatus.textContent = `Lauf vorbei. ${Math.floor(dinoScore)} Punkte.`;
  drawDinoScene();
}

function jumpDino() {
  if (!dinoRunning) return;
  if (dinoPositionY >= dinoGroundY - dinoHeightPixels - 1) {
    dinoVelocityY = -510;
  }
}

function updateDinoRun(timestamp) {
  if (!dinoRunning) return;

  const deltaTime = Math.min((timestamp - dinoLastFrame) / 1000, 0.04);
  dinoLastFrame = timestamp;
  dinoElapsed += deltaTime;
  dinoScore += deltaTime * 10;
  dinoScoreLabel.value = Math.floor(dinoScore);
  dinoVelocityY += 1450 * deltaTime;
  dinoPositionY = Math.min(dinoGroundY - dinoHeightPixels, dinoPositionY + dinoVelocityY * deltaTime);
  if (dinoPositionY >= dinoGroundY - dinoHeightPixels) dinoVelocityY = 0;

  dinoObstacleTimer += deltaTime;
  if (dinoObstacleTimer >= dinoObstacleInterval) {
    const height = 28 + Math.random() * 24;
    const width = height > 42 ? 30 : 18 + Math.random() * 9;
    dinoObstacles.push({ x: dinoWidth + 12, width, height });
    dinoObstacleTimer = 0;
    dinoObstacleInterval = Math.max(0.72, 1.25 + Math.random() * 0.75 - dinoElapsed * 0.006);
  }

  const runSpeed = Math.min(280 + dinoElapsed * 8, 520);
  for (const obstacle of dinoObstacles) obstacle.x -= runSpeed * deltaTime;
  dinoObstacles = dinoObstacles.filter((obstacle) => obstacle.x + obstacle.width > 0);

  const dinoBounds = { left: dinoX + 8, right: dinoX + 42, top: dinoPositionY + 7, bottom: dinoPositionY + dinoHeightPixels - 2 };
  const collision = dinoObstacles.some((obstacle) => {
    const obstacleLeft = obstacle.x + obstacle.width * 0.25;
    const obstacleRight = obstacle.x + obstacle.width * 0.75;
    const obstacleTop = dinoGroundY - obstacle.height;
    return dinoBounds.right > obstacleLeft
      && dinoBounds.left < obstacleRight
      && dinoBounds.bottom > obstacleTop;
  });

  if (collision) {
    finishDinoRun();
    return;
  }

  drawDinoScene();
  dinoFrame = window.requestAnimationFrame(updateDinoRun);
}

dinoStartButton.addEventListener("click", startDinoRun);
dinoCanvas.addEventListener("pointerdown", jumpDino);
dinoCanvas.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.key === "ArrowUp") {
    event.preventDefault();
    jumpDino();
  }
});
dinoCanvas.addEventListener("pointerdown", () => dinoCanvas.focus({ preventScroll: true }));
drawDinoScene();

playVideoButton.addEventListener("click", () => {
  satisfyingVideo.src = "https://www.youtube-nocookie.com/embed/efXOrthfd2U?autoplay=1&rel=0";
  videoPlayerContainer.hidden = false;
});

clickCounterButton.addEventListener("click", () => {
  clickCount += 1;
  clickCounterButton.textContent = `Gedrückt: ${clickCount} mal`;
});

document.getElementById("openPopupBtn").addEventListener("click", () => {
  popup.showModal();
});

document.getElementById("closePopupBtn").addEventListener("click", () => {
  popup.close();
});
