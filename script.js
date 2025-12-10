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

const calculateSensitivity = (game, dpi, sens) => {
    const eDPI = dpi * sens;
    if (game === "valorant") {
        return (eDPI / 280) * 0.5;
    } else {
        return (eDPI / 800) * 0.5;
    }
};

dotSizeOptions.forEach(button => {
    button.addEventListener("click", e => {
        dotSize = parseInt(e.target.dataset.size);
        dotSizeOptions.forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
    });
});

const randomPosition = () => ({
    x: Math.random() * (canvas.width - 2 * dotSize) + dotSize,
    y: Math.random() * (canvas.height - 2 * dotSize) + dotSize
});

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

const drawScene = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    dots.forEach(dot => {
        if (!dot.hit) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    });

    if (gameStarted) {
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
                const arm = 10;
                const gap = crosshairStyle.value === "plus-empty" ? 5 : 0;
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
    }
};

const moveDots = () => {
    dots.forEach(dot => {
        if (!dot.hit) {
            dot.x += dot.vx;
            dot.y += dot.vy;

            if (dot.x <= dotSize || dot.x >= canvas.width - dotSize) dot.vx *= -1;
            if (dot.y <= dotSize || dot.y >= canvas.height - dotSize) dot.vy *= -1;
        }
    });
    drawScene();
};

document.addEventListener("mousemove", e => {
    if (!isPointerLocked || !gameStarted) return;
    crosshairX += e.movementX * sensitivity;
    crosshairY += e.movementY * sensitivity;
    crosshairX = Math.max(0, Math.min(canvas.width, crosshairX));
    crosshairY = Math.max(0, Math.min(canvas.height, crosshairY));
    drawScene();
});

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
            spawnDots();
        }
        if (clicksMade >= totalDots) endGame();
    } else if (gameMode === "multi-static" || gameMode === "multi-moving") {
        const remaining = dots.filter(dot => !dot.hit).length;
        if (remaining === 0) endGame();
    }
});

const updateAccuracy = () => {
    const acc = clicksMade ? (dotsHit / clicksMade) * 100 : 0;
    accuracyDiv.textContent = `Accuracy: ${acc.toFixed(2)}%`;
};
const updateCounter = () => {
    counterDiv.textContent = `Dots Hit: ${dotsHit} / ${totalDots}`;
};

const startTimer = () => {
    timerStart = performance.now();
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - timerStart) / 1000;
        timerDiv.textContent = `Time: ${elapsed.toFixed(1)}s`;
    }, 100);
};
const stopTimer = () => clearInterval(timerInterval);

startButton.addEventListener("click", () => {
    gameMode = modeSelect.value;
    clicksMade = 0;
    dotsHit = 0;
    gameStarted = true;
    crosshairX = canvas.width / 2;
    crosshairY = canvas.height / 2;
    spawnDots();
    canvas.requestPointerLock();
    startTimer();
    if (gameMode === "multi-moving") {
        movingInterval = setInterval(moveDots, 30);
    }
});

const endGame = () => {
    if (!gameStarted) return;
    gameStarted = false;
    stopTimer();
    clearInterval(movingInterval);
    document.exitPointerLock();
    timerDiv.textContent += "  |  Game Over!";
    resetButton.style.display = "block";
};

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
    resetButton.style.display = "none";
    drawScene();
});

// FIX: Stop game when clicking off (pointer lock lost)
document.addEventListener("pointerlockchange", () => {
    isPointerLocked = document.pointerLockElement === canvas;
    
    // Stop game if pointer lock is lost during gameplay
    if (!isPointerLocked && gameStarted) {
        stopTimer();
        clearInterval(movingInterval);
        gameStarted = false;
        timerDiv.textContent += " (Paused)";
    }
});

applySettings.addEventListener("click", () => {
    const game = gameSelect.value;
    const dpi = parseFloat(dpiInput.value);
    const sens = parseFloat(sensitivityInput.value);
    sensitivity = calculateSensitivity(game, dpi, sens);
    
    const originalText = applySettings.textContent;
    applySettings.textContent = "✓ Applied!";
    applySettings.style.backgroundColor = "#28a745";
    
    setTimeout(() => {
        applySettings.textContent = originalText;
        applySettings.style.backgroundColor = "";
    }, 1500);
});

window.addEventListener('DOMContentLoaded', () => {
    dpiInput.value = "800";
    sensitivityInput.value = "1.0";
    gameSelect.value = "csgo";
    sensitivity = calculateSensitivity("csgo", 800, 1.0);
    drawScene();
});