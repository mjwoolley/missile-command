// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    score: 0,
    level: 1,
    isGameOver: false,
    bases: [],
    cities: [],
    enemyMissiles: [],
    playerMissiles: [],
    explosions: []
};

// Initialize game
function initGame() {
    // Initialize bases (3 bases at the bottom)
    const baseSpacing = canvas.width / 4;
    for (let i = 1; i <= 3; i++) {
        gameState.bases.push({
            x: baseSpacing * i,
            y: canvas.height - 20,
            width: 40,
            height: 20,
            isDestroyed: false
        });
    }

    // Initialize cities (6 cities at the bottom)
    const citySpacing = canvas.width / 7;
    for (let i = 1; i <= 6; i++) {
        gameState.cities.push({
            x: citySpacing * i,
            y: canvas.height - 40,
            width: 30,
            height: 20,
            isDestroyed: false
        });
    }
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    updateGame();

    // Draw game elements
    drawGame();

    // Continue game loop if not game over
    if (!gameState.isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Update game state
function updateGame() {
    // Update enemy missiles
    updateEnemyMissiles();

    // Update player missiles
    updatePlayerMissiles();

    // Update explosions
    updateExplosions();

    // Check collisions
    checkCollisions();
}

// Draw game elements
function drawGame() {
    // Draw bases
    drawBases();

    // Draw cities
    drawCities();

    // Draw enemy missiles
    drawEnemyMissiles();

    // Draw player missiles
    drawPlayerMissiles();

    // Draw explosions
    drawExplosions();

    // Draw score
    drawScore();
}

// Event listeners
canvas.addEventListener('click', handleClick);

// Handle click events
function handleClick(event) {
    if (gameState.isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find nearest base and launch missile
    const nearestBase = findNearestBase(x, y);
    if (nearestBase && !nearestBase.isDestroyed) {
        launchPlayerMissile(nearestBase, x, y);
    }
}

// Drawing functions
function drawBases() {
    ctx.fillStyle = '#00ff00';
    gameState.bases.forEach(base => {
        if (!base.isDestroyed) {
            ctx.fillRect(base.x - base.width/2, base.y - base.height/2, base.width, base.height);
        }
    });
}

function drawCities() {
    ctx.fillStyle = '#ffffff';
    gameState.cities.forEach(city => {
        if (!city.isDestroyed) {
            ctx.fillRect(city.x - city.width/2, city.y - city.height/2, city.width, city.height);
        }
    });
}

function drawEnemyMissiles() {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    gameState.enemyMissiles.forEach(missile => {
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y);
        ctx.lineTo(missile.x, missile.y + 10);
        ctx.stroke();
    });
}

function drawPlayerMissiles() {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    gameState.playerMissiles.forEach(missile => {
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y);
        ctx.lineTo(missile.x + missile.dx * 5, missile.y + missile.dy * 5);
        ctx.stroke();
    });
}

function drawExplosions() {
    gameState.explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 0, ${1 - explosion.life/100})`;
        ctx.fill();
    });
}

function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    ctx.fillText(`Level: ${gameState.level}`, 10, 60);
}

// Game mechanics functions
function updateEnemyMissiles() {
    // Spawn new enemy missiles
    if (Math.random() < 0.02) {
        spawnEnemyMissile();
    }

    // Update existing missiles
    gameState.enemyMissiles.forEach(missile => {
        missile.y += missile.speed;
    });

    // Remove missiles that have gone off screen
    gameState.enemyMissiles = gameState.enemyMissiles.filter(missile => missile.y < canvas.height);
}

function spawnEnemyMissile() {
    const target = Math.random() < 0.5 ? 
        gameState.cities[Math.floor(Math.random() * gameState.cities.length)] :
        gameState.bases[Math.floor(Math.random() * gameState.bases.length)];

    if (target && !target.isDestroyed) {
        gameState.enemyMissiles.push({
            x: Math.random() * canvas.width,
            y: 0,
            speed: 2 + gameState.level * 0.5,
            target: target
        });
    }
}

function updatePlayerMissiles() {
    gameState.playerMissiles.forEach(missile => {
        missile.x += missile.dx;
        missile.y += missile.dy;
    });

    // Remove missiles that have gone off screen
    gameState.playerMissiles = gameState.playerMissiles.filter(missile => 
        missile.x >= 0 && missile.x <= canvas.width &&
        missile.y >= 0 && missile.y <= canvas.height
    );
}

function updateExplosions() {
    gameState.explosions.forEach(explosion => {
        explosion.radius += 0.5;
        explosion.life--;
    });

    // Remove dead explosions
    gameState.explosions = gameState.explosions.filter(explosion => explosion.life > 0);
}

function checkCollisions() {
    // Check enemy missiles against explosions
    gameState.enemyMissiles.forEach((missile, missileIndex) => {
        gameState.explosions.forEach(explosion => {
            const dx = missile.x - explosion.x;
            const dy = missile.y - explosion.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < explosion.radius) {
                gameState.enemyMissiles.splice(missileIndex, 1);
                gameState.score += 100;
            }
        });
    });

    // Check enemy missiles against cities and bases
    gameState.enemyMissiles.forEach((missile, missileIndex) => {
        // Check cities
        gameState.cities.forEach(city => {
            if (!city.isDestroyed && checkCollision(missile, city)) {
                city.isDestroyed = true;
                gameState.enemyMissiles.splice(missileIndex, 1);
            }
        });

        // Check bases
        gameState.bases.forEach(base => {
            if (!base.isDestroyed && checkCollision(missile, base)) {
                base.isDestroyed = true;
                gameState.enemyMissiles.splice(missileIndex, 1);
            }
        });
    });
}

function checkCollision(missile, target) {
    return missile.x >= target.x - target.width/2 &&
           missile.x <= target.x + target.width/2 &&
           missile.y >= target.y - target.height/2 &&
           missile.y <= target.y + target.height/2;
}

function findNearestBase(x, y) {
    let nearest = null;
    let minDistance = Infinity;

    gameState.bases.forEach(base => {
        if (!base.isDestroyed) {
            const dx = x - base.x;
            const dy = y - base.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = base;
            }
        }
    });

    return nearest;
}

function launchPlayerMissile(base, targetX, targetY) {
    const dx = targetX - base.x;
    const dy = targetY - base.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    gameState.playerMissiles.push({
        x: base.x,
        y: base.y,
        dx: dx / length * 5,
        dy: dy / length * 5
    });

    // Create explosion at launch point
    gameState.explosions.push({
        x: base.x,
        y: base.y,
        radius: 5,
        life: 20
    });
}

// Start the game
initGame();
gameLoop(); 