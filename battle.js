// ========== АРЕНА UNDERTALE v7 — ПАУЗА, ВЫХОД, УЛУЧШЕННАЯ ГРАФИКА ==========
let arenaActive = false;
let arenaPaused = false;
let arenaBoss = null;
let arenaHP = 30;
let arenaMaxHP = 30;
let arenaInterval = null;
let arenaAttackInterval = null;
let arenaPhase = "dodge";
let arenaBossMaxHP = 1000;
let arenaAttackType = 0;
let arenaClickTargets = [];
let arenaClicksHit = 0;
let arenaTotalTargets = 8;
let arenaAttackTimeLeft = 2;
let heart = { x: 200, y: 400, size: 15 };
let attacks = [];
let canvas = null;
let ctx = null;
let arenaParticles = [];
let arenaShake = 0;
let arenaHitFlash = 0;
let arenaBgStars = [];
let arenaBgTime = 0;

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    // Генерируем звёзды для фона
    for (let i = 0; i < 80; i++) {
        arenaBgStars.push({
            x: Math.random() * 400,
            y: Math.random() * 500,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            twinkle: Math.random() * Math.PI * 2
        });
    }
    
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive || arenaPaused || arenaPhase !== "dodge") return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("touchmove", (e) => {
        if (!arenaActive || arenaPaused || arenaPhase !== "dodge") return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("click", (e) => {
        if (!arenaActive || arenaPaused) return;
        if (arenaPhase === "attack") {
            let rect = canvas.getBoundingClientRect();
            let mx = e.clientX - rect.left;
            let my = e.clientY - rect.top;
            checkClickTarget(mx, my);
        }
    });
    
    canvas.addEventListener("touchstart", (e) => {
        if (!arenaActive || arenaPaused) return;
        e.preventDefault();
        if (arenaPhase === "attack") {
            let rect = canvas.getBoundingClientRect();
            let mx = e.touches[0].clientX - rect.left;
            let my = e.touches[0].clientY - rect.top;
            checkClickTarget(mx, my);
            return;
        }
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        let dx = mx - t.x, dy = my - t.y;
        if (Math.sqrt(dx*dx + dy*dy) < t.radius && !t.hit) {
            t.hit = true;
            arenaClicksHit++;
            for (let j = 0; j < 12; j++) {
                arenaParticles.push({
                    x: t.x, y: t.y,
                    vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                    life: 25, color: "#0f0", size: Math.random()*4+2
                });
            }
            break;
        }
    }
}

function calculateArenaHP() {
    let bonus = 0;
    team.forEach(idx => {
        let cd = myCards[idx];
        if (cd) bonus += Math.floor(cd.hp / 50);
    });
    arenaMaxHP = 30 + bonus;
    arenaHP = arenaMaxHP;
}

// ПАУЗА
function toggleArenaPause() {
    arenaPaused = !arenaPaused;
    let btn = document.getElementById("arenaPauseBtn");
    if (btn) btn.innerText = arenaPaused ? "▶ Продолжить" : "⏸ Пауза";
    let pauseOverlay = document.getElementById("arenaPauseOverlay");
    if (pauseOverlay) pauseOverlay.style.display = arenaPaused ? "flex" : "none";
}

// ВЫХОД ИЗ БОЯ
function exitArena() {
    if (confirm("⚠️ Выйти из боя? Вы потеряете 30 HP!")) {
        stopArena();
        playerHp = Math.max(1, playerHp - 30);
        alert("Вы сбежали с боя! Потеряно 30 HP.");
        updatePlayerStats();
        renderEnemy();
    }
}

function startArena(bossWave) {
    arenaActive = true;
    arenaPaused = false;
    calculateArenaHP();
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaPhase = "dodge";
    attacks = [];
    arenaParticles = [];
    arenaShake = 0;
    arenaHitFlash = 0;
    heart.x = 200; heart.y = 400;
    
    let bt = bossTemplates[bossWave];
    arenaBoss = bt ? bt.name : "БОСС";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000;
    
    arenaAttackType = Math.random() < 0.5 ? 0 : 1;
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = "∞";
    
    let pauseOverlay = document.getElementById("arenaPauseOverlay");
    if (pauseOverlay) pauseOverlay.style.display = "none";
    let pauseBtn = document.getElementById("arenaPauseBtn");
    if (pauseBtn) pauseBtn.innerText = "⏸ Пауза";
    
    if (!ctx) initArena();
    startDodgePhase();
    requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge";
    attacks = [];
    heart.x = 200; heart.y = 400;
    let typeText = arenaAttackType === 0 ? "⬜ ОБЫЧНЫЕ" : "🔷 ХАОС";
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + typeText;
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let intervalTime = arenaAttackType === 0 ? 600 : 500;
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive && !arenaPaused) spawnAttack();
    }, intervalTime);
    let dodgeTime = 8000 + Math.random() * 6000;
    setTimeout(() => {
        if (arenaPhase === "dodge" && arenaActive && !arenaPaused) startAttackPhase();
    }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = [];
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaTotalTargets = 8;
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose, attempts = 0;
        do {
            x = 55 + Math.random() * 290;
            y = 100 + Math.random() * 330;
            tooClose = false;
            for (let p of usedPositions) {
                if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 55) { tooClose = true; break; }
            }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({x, y});
        arenaClickTargets.push({ x, y, radius: 24, hit: false, pulse: Math.random()*Math.PI*2 });
    }
    
    let attackTimer = setInterval(() => {
        if (!arenaPaused) {
            arenaAttackTimeLeft--;
            document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
        }
        if (arenaAttackTimeLeft <= 0) { clearInterval(attackTimer); applyArenaDamage(); }
    }, 1000);
    
    setTimeout(() => {
        if (arenaPhase === "attack" && arenaActive) applyArenaDamage();
    }, 2000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    let dmgMult = 0;
    if (arenaClicksHit >= 8) dmgMult = 2.0;
    else if (arenaClicksHit >= 4) dmgMult = 1.0;
    else if (arenaClicksHit >= 1) dmgMult = 0.5;
    
    let baseDmg = window.playerFinalDamage || 10;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        arenaShake = 20;
        for (let i = 0; i < 30; i++) {
            arenaParticles.push({
                x: 200, y: 250,
                vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12,
                life: 35, color: Math.random() < 0.5 ? "#ff0" : "#f80", size: Math.random()*5+2
            });
        }
        document.getElementById("arenaBossName").innerText = arenaBoss + " — 💥 -" + finalDmg + "!";
    } else {
        document.getElementById("arenaBossName").innerText = arenaBoss + " — 😞 Промах!";
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        arenaAttackType = Math.random() < 0.5 ? 0 : 1;
        arenaPhase = "dodge";
        startDodgePhase();
    }, 1200);
}

function spawnAttack() {
    if (arenaAttackType === 0) {
        let type = Math.floor(Math.random() * 4);
        if (type === 0) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: -50 - i*75, y: 60 + i*85, size: 28, speed: 3.5, speedX: null, speedY: null, glow: Math.random()*Math.PI*2 });
            }
        } else if (type === 1) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 450 + i*75, y: 80 + i*80, size: 28, speed: -3.5, speedX: null, speedY: null, glow: Math.random()*Math.PI*2 });
            }
        } else if (type === 2) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 30 + i*85, y: -40, size: 28, speed: null, speedX: 0, speedY: 3, glow: Math.random()*Math.PI*2 });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 50 + i*80, y: 540, size: 28, speed: null, speedX: 0, speedY: -3, glow: Math.random()*Math.PI*2 });
            }
        }
    } else {
        let count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            let side = Math.floor(Math.random() * 4);
            let x, y, spX, spY;
            switch(side) {
                case 0: x = Math.random()*380; y = -50-Math.random()*60; spX = (Math.random()-0.5)*4; spY = 4+Math.random()*6; break;
                case 1: x = Math.random()*380; y = 550+Math.random()*60; spX = (Math.random()-0.5)*4; spY = -(4+Math.random()*6); break;
                case 2: x = -50-Math.random()*60; y = Math.random()*460; spX = 4+Math.random()*6; spY = (Math.random()-0.5)*4; break;
                case 3: x = 450+Math.random()*60; y = Math.random()*460; spX = -(4+Math.random()*6); spY = (Math.random()-0.5)*4; break;
            }
            attacks.push({ type: "square", x, y, size: 18+Math.random()*14, speed: null, speedX: spX, speedY: spY, glow: Math.random()*Math.PI*2 });
        }
    }
}

function stopArena() {
    arenaActive = false;
    arenaPaused = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null; arenaAttackInterval = null;
    attacks = []; arenaClickTargets = []; arenaParticles = [];
    document.getElementById("arenaOverlay").style.display = "none";
    let pauseOverlay = document.getElementById("arenaPauseOverlay");
    if (pauseOverlay) pauseOverlay.style.display = "none";
}

function winArena() {
    stopArena();
    alert("🎉 Ты победил босса!");
    if (currentEnemy) currentEnemy.hp = 0;
    victory();
}

function loseArena() {
    stopArena();
    playerHp = 0;
    defeat();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    arenaBgTime += 0.016;
    
    ctx.save();
    ctx.translate(sx, sy);
    
    ctx.clearRect(-10, -10, 420, 520);
    
    // Фон с градиентом
    let bgGrad = ctx.createRadialGradient(200, 250, 50, 200, 250, 400);
    bgGrad.addColorStop(0, "#1a1a3e");
    bgGrad.addColorStop(1, "#050510");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 500);
    
    // Звёзды
    arenaBgStars.forEach(star => {
        star.twinkle += star.speed * 0.05;
        let alpha = 0.3 + Math.sin(star.twinkle) * 0.4;
        ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
    });
    
    // Рамка
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (arenaAttackType === 0 ? "#ffffff" : "#4499ff");
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20; ctx.shadowColor = borderColor;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    // Вспышка при попадании
    if (arenaHitFlash > 0) {
        ctx.fillStyle = "rgba(255,0,0," + (arenaHitFlash/15) + ")";
        ctx.fillRect(0, 0, 400, 500);
    }
    
    // HP игрока
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 8, 384, 28);
    ctx.fillStyle = "#400"; ctx.fillRect(12, 12, 376, 8);
    let hpGrad = ctx.createLinearGradient(12, 0, 388, 0);
    hpGrad.addColorStop(0, "#ff0000"); hpGrad.addColorStop(0.3, "#ff8800"); hpGrad.addColorStop(0.6, "#ffff00"); hpGrad.addColorStop(1, "#00ff00");
    ctx.fillStyle = hpGrad;
    ctx.fillRect(12, 12, 376 * (arenaHP / arenaMaxHP), 8);
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px Nunito, sans-serif";
    ctx.fillText("❤️ " + arenaHP + "/" + arenaMaxHP, 14, 32);
    
    // HP босса
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 40, 384, 16);
    ctx.fillStyle = "#400"; ctx.fillRect(12, 44, 376, 4);
    let maxHp = currentEnemy ? currentEnemy.maxHp : 1000;
    let bossGrad = ctx.createLinearGradient(12, 0, 388, 0);
    bossGrad.addColorStop(0, "#ff0000"); bossGrad.addColorStop(1, "#ff8800");
    ctx.fillStyle = bossGrad;
    ctx.fillRect(12, 44, 376 * Math.max(0, arenaBossMaxHP / maxHp), 4);
    ctx.fillStyle = "#aaa"; ctx.font = "bold 9px Nunito, sans-serif";
    ctx.fillText("👾 " + arenaBoss, 14, 54);
    
    // Текст
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px Nunito, sans-serif";
    let phaseText = arenaPhase === "attack" ? "⚡ ЖМИ КРУГИ! (" + arenaClicksHit + "/8)" : "🛡️ Уклоняйся!";
    ctx.fillText(phaseText, 105, 76);
    
    if (arenaPhase === "dodge" && !arenaPaused) {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            if (a.glow !== undefined) a.glow += 0.1;
            
            if (a.speedX !== null && a.speedX !== undefined) { a.x += a.speedX; a.y += a.speedY; }
            else if (a.speedY !== null && a.speedY !== undefined) { a.y += a.speedY; }
            else if (a.speed !== null && a.speed !== undefined) { a.x += a.speed; }
            
            let hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.size &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.size);
            
            if (hit) {
                arenaHP -= 5;
                arenaHitFlash = 10;
                document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
                for (let j = 0; j < 8; j++) {
                    arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 20, color: "#f00", size: Math.random()*4+1 });
                }
                attacks.splice(i, 1);
                if (arenaHP <= 0) { loseArena(); ctx.restore(); return; }
                continue;
            }
            
            if (a.x < -200 || a.x > 600 || a.y < -200 || a.y > 700) { attacks.splice(i, 1); continue; }
            
            let col = arenaAttackType === 0 ? "#ffffff" : "#4499ff";
            ctx.fillStyle = col;
            ctx.shadowBlur = 10 + Math.sin(a.glow || 0)*5;
            ctx.shadowColor = col;
            // Градиент на квадрате
            let sqGrad = ctx.createLinearGradient(a.x, a.y, a.x+a.size, a.y+a.size);
            sqGrad.addColorStop(0, col);
            sqGrad.addColorStop(1, arenaAttackType === 0 ? "#cccccc" : "#2266cc");
            ctx.fillStyle = sqGrad;
            ctx.fillRect(a.x, a.y, a.size, a.size);
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 1;
            ctx.strokeRect(a.x, a.y, a.size, a.size);
            ctx.shadowBlur = 0;
        }
        
        // Сердечко
        let hx = heart.x, hy = heart.y, s = heart.size + Math.sin(Date.now()/200)*1.5;
        // Свечение
        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.shadowBlur = 25; ctx.shadowColor = "#ff0000";
        ctx.beginPath(); ctx.arc(hx, hy, s+5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        // Само сердечко
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 12; ctx.shadowColor = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s*0.3);
        ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
        ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
        ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
        ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
        ctx.fill();
        ctx.strokeStyle = "#ff6666"; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    if (arenaPhase === "attack" && !arenaPaused) {
        arenaClickTargets.forEach(t => {
            t.pulse += 0.08;
            let r = t.radius + Math.sin(t.pulse)*4;
            ctx.fillStyle = t.hit ? "rgba(0,255,0,0.6)" : "rgba(255,255,0,0.8)";
            ctx.shadowBlur = t.hit ? 18 : 25;
            ctx.shadowColor = t.hit ? "#0f0" : "#ff0";
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = t.hit ? "#0f0" : "#ffaa00"; ctx.lineWidth = 3; ctx.stroke();
            ctx.shadowBlur = 0;
            if (!t.hit) {
                ctx.fillStyle = "#000"; ctx.font = "bold 13px Nunito, sans-serif";
                ctx.fillText("ЖМИ", t.x-17, t.y+5);
                // Стрелочка
                ctx.fillStyle = "#fff";
                ctx.beginPath(); ctx.moveTo(t.x, t.y-r-8); ctx.lineTo(t.x-5, t.y-r-3); ctx.lineTo(t.x+5, t.y-r-3); ctx.fill();
            }
        });
    }
    
    // Частицы
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { arenaParticles.splice(i, 1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life/35;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Пауза
    if (arenaPaused) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, 400, 500);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px Nunito, sans-serif";
        ctx.fillText("⏸", 170, 250);
        ctx.font = "bold 16px Nunito, sans-serif";
        ctx.fillText("ПАУЗА", 155, 280);
    }
    
    ctx.restore();
    requestAnimationFrame(renderArena);
}
