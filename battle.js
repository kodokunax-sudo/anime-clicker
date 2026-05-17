// ========== АРЕНА UNDERTALE v2 ==========
let arenaActive = false;
let arenaBoss = null;
let arenaHP = 100;
let arenaTimer = 30;
let arenaInterval = null;
let arenaAttackInterval = null;
let arenaPhase = "dodge"; // dodge или attack
let arenaAttackReady = false;
let arenaBossMaxHP = 1000;

// Сердечко
let heart = { x: 200, y: 400, size: 15 };

// Атаки
let attacks = [];

// Canvas
let canvas = null;
let ctx = null;

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("touchmove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("touchstart", (e) => {
        if (!arenaActive) return;
        e.preventDefault();
        if (arenaPhase === "attack") {
            doArenaAttack();
            return;
        }
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("click", () => {
        if (!arenaActive) return;
        if (arenaPhase === "attack") {
            doArenaAttack();
        }
    });
}

function startArena(bossWave) {
    arenaActive = true;
    arenaHP = 100;
    arenaTimer = 30;
    attacks = [];
    arenaPhase = "dodge";
    arenaAttackReady = false;
    heart.x = 200;
    heart.y = 400;
    
    let bt = bossTemplates[bossWave];
    arenaBoss = bt ? bt.name : "БОСС";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000;
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = arenaTimer;
    
    if (!ctx) initArena();
    
    // Таймер
    arenaInterval = setInterval(() => {
        arenaTimer--;
        document.getElementById("arenaTimer").innerText = arenaTimer;
        
        // Каждые 10 секунд — фаза атаки
        if (arenaTimer % 10 === 0 && arenaTimer > 0 && arenaPhase === "dodge") {
            startAttackPhase();
        }
        
        if (arenaTimer <= 0) {
            winArena();
        }
    }, 1000);
    
    // Атаки
    startDodgePhase();
    
    requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge";
    arenaAttackReady = false;
    attacks = [];
    heart.x = 200;
    heart.y = 400;
    document.getElementById("arenaBossName").innerText = arenaBoss + " — УКЛОНЯЙСЯ!";
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase !== "dodge") return;
        spawnRandomAttack();
        if (Math.random() < 0.3) spawnRandomAttack();
    }, 600);
}

function startAttackPhase() {
    arenaPhase = "attack";
    arenaAttackReady = true;
    attacks = [];
    heart.x = 200;
    heart.y = 400;
    document.getElementById("arenaBossName").innerText = arenaBoss + " — БЕЙ!";
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaAttackInterval = null;
    
    // Даём 3 секунды на удар
    setTimeout(() => {
        if (arenaPhase === "attack" && arenaActive) {
            arenaPhase = "dodge";
            startDodgePhase();
        }
    }, 3000);
}

function doArenaAttack() {
    if (!arenaActive || arenaPhase !== "attack" || !arenaAttackReady) return;
    arenaAttackReady = false;
    
    // Наносим урон боссу
    let dmg = Math.floor((window.playerFinalDamage || 10) * (1 + Math.random() * 0.5));
    arenaBossMaxHP -= dmg;
    
    showFloatingTextArena("💥 -" + dmg, "#ff0");
    
    if (arenaBossMaxHP <= 0) {
        winArena();
        return;
    }
    
    // Возвращаемся к уклонению
    arenaPhase = "dodge";
    startDodgePhase();
}

function showFloatingTextArena(text, color) {
    let el = document.getElementById("arenaBossName");
    if (!el) return;
    let oldText = el.innerText;
    el.innerText = text;
    el.style.color = color;
    setTimeout(() => {
        if (el) {
            el.innerText = oldText;
            el.style.color = "white";
        }
    }, 800);
}

function stopArena() {
    arenaActive = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null;
    arenaAttackInterval = null;
    attacks = [];
    document.getElementById("arenaOverlay").style.display = "none";
}

function winArena() {
    stopArena();
    alert("🎉 Ты выжил! Босс повержен!");
    if (currentEnemy) {
        currentEnemy.hp = 0;
    }
    victory();
}

function loseArena() {
    stopArena();
    // Сразу поражение — нельзя бить врага
    playerHp = 0;
    defeat();
}

function spawnRandomAttack() {
    let type = Math.floor(Math.random() * 4);
    switch(type) {
        case 0: // Падающий круг
            attacks.push({
                type: "circle",
                x: Math.random() * 370 + 15,
                y: -20,
                radius: 18,
                speed: 2 + Math.random() * 2
            });
            break;
        case 1: // Полоса слева/справа (летит до конца)
            let fromLeft = Math.random() < 0.5;
            attacks.push({
                type: "bar",
                x: fromLeft ? -60 : 400,
                y: Math.random() * 440 + 30,
                width: 60,
                height: 14,
                speed: fromLeft ? 3 + Math.random() * 2 : -(3 + Math.random() * 2)
            });
            break;
        case 2: // Волна снизу
            attacks.push({
                type: "wave",
                x: Math.random() * 350,
                y: 510,
                width: 60,
                height: 18,
                speed: -2 - Math.random() * 2
            });
            break;
        case 3: // Двойной круг
            let cx = Math.random() * 370 + 15;
            attacks.push({ type: "circle", x: cx, y: -20, radius: 15, speed: 2.5 });
            attacks.push({ type: "circle", x: cx + (Math.random() < 0.5 ? 40 : -40), y: -40, radius: 15, speed: 2.5 });
            break;
    }
}

function renderArena() {
    if (!arenaActive) return;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, 400, 500);
    
    // Фон арены
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 400, 500);
    ctx.strokeStyle = arenaPhase === "attack" ? "#ff0" : "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // Текст фазы
    ctx.fillStyle = arenaPhase === "attack" ? "#ff0" : "#fff";
    ctx.font = "bold 16px Nunito, sans-serif";
    ctx.fillText(arenaPhase === "attack" ? "⚡ БЕЙ!" : "🛡️ Уклоняйся!", 150, 30);
    
    // HP босса
    ctx.fillStyle = "#f00";
    ctx.fillRect(10, 40, 380, 10);
    ctx.fillStyle = "#0f0";
    let hpPercent = Math.max(0, arenaBossMaxHP / (currentEnemy ? currentEnemy.maxHp : 1000));
    ctx.fillRect(10, 40, 380 * hpPercent, 10);
    
    // Атаки (только в фазе уклонения)
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            // Движение
            if (a.type === "circle") {
                a.y += a.speed;
            } else if (a.type === "bar") {
                a.x += a.speed;
            } else if (a.type === "wave") {
                a.y += a.speed;
            }
            
            // Проверка столкновения
            let hit = false;
            if (a.type === "circle") {
                let dx = heart.x - a.x, dy = heart.y - a.y;
                hit = Math.sqrt(dx*dx + dy*dy) < (heart.size + a.radius);
            } else {
                hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.width &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.height);
            }
            
            if (hit) {
                arenaHP -= 15;
                document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
                attacks.splice(i, 1);
                // Эффект попадания
                ctx.fillStyle = "rgba(255,0,0,0.3)";
                ctx.fillRect(0, 0, 400, 500);
                if (arenaHP <= 0) {
                    loseArena();
                    return;
                }
                continue;
            }
            
            // Удаление если ушло далеко за экран (НЕ останавливаются!)
            if (a.y > 600 || a.y < -100 || a.x < -200 || a.x > 600) {
                attacks.splice(i, 1);
                continue;
            }
            
            // Отрисовка
            ctx.fillStyle = a.type === "wave" ? "#00bfff" : "#fff";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#fff";
            if (a.type === "circle") {
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillRect(a.x, a.y, a.width, a.height);
            }
            ctx.shadowBlur = 0;
        }
    }
    
    // Сердечко (только в фазе уклонения)
    if (arenaPhase === "dodge") {
        let hx = heart.x, hy = heart.y, s = heart.size;
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s*0.3);
        ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
        ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
        ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
        ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
        ctx.fill();
        ctx.strokeStyle = "#cc0000"; ctx.lineWidth = 2; ctx.stroke();
    }
    
    // Кнопка атаки в фазе атаки
    if (arenaPhase === "attack") {
        ctx.fillStyle = "#ff0";
        ctx.font = "bold 20px Nunito, sans-serif";
        ctx.fillText("НАЖМИ ЧТОБЫ УДАРИТЬ!", 60, 260);
        ctx.fillText("🖱️", 180, 300);
    }
    
    requestAnimationFrame(renderArena);
}
