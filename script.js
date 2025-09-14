const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const gameSelect = document.getElementById("gameSelect");
const modeSelect = document.getElementById("modeSelect");
const dpiInput = document.getElementById("dpiInput");
const sensitivityInput = document.getElementById("sensitivityInput");
const applySettings = document.getElementById("applySettings");
const dotSizeOptions = document.querySelectorAll(".dotSizeOption");
const crosshairStyle = document.getElementById("crosshairStyle");
const crosshairColor = document.getElementById("crosshairColor");
const timerDiv = document.getElementById("timer");
const accuracyDiv = document.getElementById("accuracy");
const counterDiv = document.getElementById("counter");

let dotsHit = 0;
let totalDots = 20;
let clicksMade = 0;
let gameStarted = false;
let timerStart = null;
let timerInterval = null;
let crosshairX = canvas.width / 2;
let crosshairY = canvas.height / 2;
let sensitivity = 1.0;
let isPointerLocked = false;
let dotSize = 10;

let dots = [];
let gameMode = "single";
let movingInterval = null;

// Calculate sensitivity (normalized)
const calculateSensitivity = (game, dpi, sens) => {
    let base = (dpi / 800) * sens * 0.1;
    if (game === "valorant") base *= 0.426;
    return base;
};

// Dot size selection
dotSizeOptions.forEach(button => {
    button.addEventListener("click", e => {
        dotSize = parseInt(e.target.dataset.size);
        dotSizeOptions.forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
    });
});

// Random position
const randomPosition = () => ({
    x: Math.random() * (canvas.width - 2 * dotSize) + dotSize,
    y: Math.random() * (canvas.height - 2 * dotSize) + dotSize
});

// Spawn dots
const spawnDots = () => {
    dots = [];
    if (gameMode === "single") {
        dots.push({ ...randomPosition(), hit: false });
    } else if (gameMode === "multi-static" || gameMode === "multi-moving") {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const pos = randomPosition();
            const velocity = gameMode === "multi-moving"
                ? { vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 }
                : { vx: 0, vy: 0 };
            dots.push({ ...pos, hit: false, ...velocity });
        }
    }
    drawScene();
};

// Draw everything
const drawScene = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dots
    ctx.fillStyle = "red";
    dots.forEach(dot => {
        if (!dot.hit) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    });

    // Draw crosshair
    ctx.strokeStyle = crosshairColor.value;
    ctx.fillStyle = crosshairColor.value;
    ctx.lineWidth = 2;

    switch (crosshairStyle.value) {
        case "default":
            ctx.beginPath();
            ctx.moveTo(crosshairX - 15, crosshairY);
            ctx.lineTo(crosshairX + 15, crosshairY);
            ctx.moveTo(crosshairX, crosshairY - 15);
            ctx.lineTo(crosshairX, crosshairY + 15);
            ctx.stroke();
            break;
        case "circle":
            ctx.beginPath();
            ctx.arc(crosshairX, crosshairY, 10, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case "dot":
            ctx.beginPath();
            ctx.arc(crosshairX, crosshairY, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
        case "plus":
        case "plus-empty":
            const arm = 10, gap = crosshairStyle.value === "plus-empty" ? 5 : 0;
            ctx.beginPath();
            ctx.moveTo(crosshairX - arm, crosshairY);
            ctx.lineTo(crosshairX - gap, crosshairY);
            ctx.moveTo(crosshairX + gap, crosshairY);
            ctx.lineTo(crosshairX + arm, crosshairY);
            ctx.moveTo(crosshairX, crosshairY - arm);
            ctx.lineTo(crosshairX, crosshairY - gap);
            ctx.moveTo(crosshairX, crosshairY + gap);
            ctx.lineTo(crosshairX, crosshairY + arm);
            ctx.stroke();
            break;
    }
};

// Smooth movement for moving mode
const moveDots = () => {
    dots.forEach(dot => {
        if (!dot.hit) {
            dot.x += dot.vx;
            dot.y += dot.vy;

            // Bounce off walls
            if (dot.x <= dotSize || dot.x >= canvas.width - dotSize) dot.vx *= -1;
            if (dot.y <= dotSize || dot.y >= canvas.height - dotSize) dot.vy *= -1;
        }
    });
    drawScene();
};

// Handle mouse movement
document.addEventListener("mousemove", e => {
    if (!isPointerLocked || !gameStarted) return;
    crosshairX += e.movementX * sensitivity;
    crosshairY += e.movementY * sensitivity;
    crosshairX = Math.max(0, Math.min(canvas.width, crosshairX));
    crosshairY = Math.max(0, Math.min(canvas.height, crosshairY));
    drawScene();
});

// Handle clicks
canvas.addEventListener("click", () => {
    if (!gameStarted) return;
    clicksMade++;
    let hitSomething = false;

    dots.forEach(dot => {
        if (!dot.hit) {
            const dist = Math.hypot(crosshairX - dot.x, crosshairY - dot.y);
            if (dist <= dotSize) {
                dot.hit = true;
                dotsHit++;
                hitSomething = true;
            }
        }
    });

    updateAccuracy();
    updateCounter();

    if (gameMode === "single") {
        if (hitSomething) {
            // Only move to new dot on a hit
            spawnDots();
        }
        if (clicksMade >= totalDots) endGame();
    } else if (gameMode === "multi-static" || gameMode === "multi-moving") {
        const remaining = dots.filter(dot => !dot.hit).length;
        if (remaining === 0) endGame();
    }
});

// Accuracy and counter updates
const updateAccuracy = () => {
    const acc = clicksMade ? (dotsHit / clicksMade) * 100 : 0;
    accuracyDiv.textContent = `Accuracy: ${acc.toFixed(2)}%`;
};
const updateCounter = () => {
    counterDiv.textContent = `Dots Hit: ${dotsHit} / ${totalDots}`;
};

// Timer
const startTimer = () => {
    timerStart = performance.now();
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - timerStart) / 1000;
        timerDiv.textContent = `Time: ${elapsed.toFixed(1)}s`;
    }, 100);
};
const stopTimer = () => clearInterval(timerInterval);

// Start game
startButton.addEventListener("click", () => {
    gameMode = modeSelect.value;
    clicksMade = 0;
    dotsHit = 0;
    gameStarted = true;
    spawnDots();
    canvas.requestPointerLock();
    startTimer();
    if (gameMode === "multi-moving") {
        movingInterval = setInterval(moveDots, 30); // smooth animation
    }
});

// End game
const endGame = () => {
    gameStarted = false;
    stopTimer();
    clearInterval(movingInterval);
    document.exitPointerLock();
    timerDiv.textContent += "  |  Game Over!";
    resetButton.style.display = "block";
};

// Reset game
resetButton.addEventListener("click", () => {
    stopTimer();
    clearInterval(movingInterval);
    gameStarted = false;
    clicksMade = dotsHit = 0;
    dots = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    timerDiv.textContent = "Time: 0.0s";
    accuracyDiv.textContent = "Accuracy: 0%";
    counterDiv.textContent = "Dots Hit: 0 / 20";
});

// Pointer lock
document.addEventListener("pointerlockchange", () => {
    isPointerLocked = document.pointerLockElement === canvas;
});

// Apply settings
applySettings.addEventListener("click", () => {
    const game = gameSelect.value;
    const dpi = parseFloat(dpiInput.value);
    const sens = parseFloat(sensitivityInput.value);
    sensitivity = calculateSensitivity(game, dpi, sens);
    alert(`Sensitivity applied: ${sensitivity.toFixed(3)}`);
});
