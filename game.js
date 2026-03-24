let buyAmount = 1;

let state = {
    bloons: 0, totalBloons: 0, bps: 0, clickPower: 1, multiplier: 1, totalClicks: 0, timePlayed: 0,
    monkeys: {
        dart: { count: 0, baseCost: 15, bps: 0.1, name: "Dart Monkey", icon: "🏹", desc: "Lanza dardos simples. Cada uno da 0.1 BPS." },
        boomerang: { count: 0, baseCost: 100, bps: 1, name: "Boomerang", icon: "🪃", desc: "Ataque curvo que genera 1 BPS." },
        bomb: { count: 0, baseCost: 1100, bps: 8, name: "Bomb Tower", icon: "💣", desc: "Explosiones potentes que dan 8 BPS." },
        tack: { count: 0, baseCost: 4000, bps: 25, name: "Tack Shooter", icon: "⚙️", desc: "Dispara tachuelas. Da 25 BPS." },
        wizard: { count: 0, baseCost: 20000, bps: 120, name: "Wizard Monkey", icon: "🧙", desc: "Magia ancestral que da 120 BPS." },
        village: { count: 0, baseCost: 50000, bps: 0, name: "Village", icon: "🏠", desc: "No ataca, pero sube el BPS global un 10%." },
        ninja: { count: 0, baseCost: 150000, bps: 450, name: "Ninja Monkey", icon: "🥷", desc: "Shurikens rápidos. Da 450 BPS." },
        super: { count: 0, baseCost: 1000000, bps: 2500, name: "Super Monkey", icon: "🦸", desc: "Héroe legendario. Da 2500 BPS." },
        temple: { count: 0, baseCost: 50000000, bps: 150000, name: "Sun Temple", icon: "☀️", desc: "Poder solar divino. Da 150k BPS." }
    },
    upgrades: [
        { id: 'sharp', name: 'Sharp Darts', desc: 'Dart Monkeys x2 potencia.', cost: 500, type: 'mult', target: 'dart', bonus: 2, purchased: false, icon: '📍' },
        { id: 'gloves', name: 'Super Gloves', desc: '+5 Bloons por cada clic.', cost: 1000, type: 'click', bonus: 5, purchased: false, icon: '🥊' },
        { id: 'heavy', name: 'Heavy Bombs', desc: 'Bomb Towers x3 potencia.', cost: 15000, type: 'mult', target: 'bomb', bonus: 3, purchased: false, icon: '🧨' },
        { id: 'fire', name: 'Fireball', desc: 'Wizard Monkeys x2 potencia.', cost: 100000, type: 'mult', target: 'wizard', bonus: 2, purchased: false, icon: '🔥' },
        { id: 'double', name: 'Double Shot', desc: 'Ninjas disparan doble (x2 BPS).', cost: 500000, type: 'mult', target: 'ninja', bonus: 2, purchased: false, icon: '⚔️' },
        { id: 'village_pro', name: 'Jungle Drums', desc: 'Villages dan +20% global en vez de 10%.', cost: 2000000, type: 'special', bonus: 0, purchased: false, icon: '🥁' }
    ]
};

const tooltip = document.getElementById('tooltip');

// Formato para Bloons totales
function format(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num);
}

// FORMATO PARA BPS (Muestra decimales para Dart Monkeys)
function formatBPS(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    if (num > 0 && num < 10) return num.toFixed(1); 
    return Math.floor(num);
}

function showTooltip(e, name, desc, cost) {
    tooltip.classList.remove('hidden');
    document.getElementById('tooltip-name').innerText = name.toUpperCase();
    document.getElementById('tooltip-desc').innerText = desc;
    document.getElementById('tooltip-cost').innerText = `COSTE: ${format(cost)}`;
    moveTooltip(e);
}

function moveTooltip(e) {
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
}

function hideTooltip() { tooltip.classList.add('hidden'); }

function setBuyAmount(amt) {
    buyAmount = amt;
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText === 'X'+amt) btn.classList.add('active');
    });
    updateUI();
}

function calculateStats() {
    let rawBps = 0;
    for (let key in state.monkeys) {
        let m = state.monkeys[key];
        let mBps = m.count * m.bps;
        state.upgrades.forEach(u => { if(u.purchased && u.target === key) mBps *= u.bonus; });
        rawBps += mBps;
    }
    let vBonus = state.upgrades.find(u => u.id === 'village_pro').purchased ? 0.2 : 0.1;
    state.bps = rawBps * (1 + (state.monkeys.village.count * vBonus)) * state.multiplier;
    
    let p = 1;
    state.upgrades.forEach(u => { if(u.purchased && u.type === 'click') p += u.bonus; });
    state.clickPower = p;
}

function updateUI() {
    document.getElementById('bloon-count').innerText = `${format(state.bloons)} BLOONS`;
    document.getElementById('bps-display').querySelector('.bps-val').innerText = formatBPS(state.bps);
    document.getElementById('stat-clicks').innerText = state.totalClicks;
    document.getElementById('stat-monkeys').innerText = Object.values(state.monkeys).reduce((a,b) => a+b.count, 0);
    
    let s = Math.floor(state.timePlayed % 60);
    let m = Math.floor(state.timePlayed / 60);
    document.getElementById('stat-time').innerText = `${m}M ${s}S`;

    renderShop();
    renderUpgrades();
}

function getMultiCost(m, amt) {
    let t = 0;
    for(let i=0; i<amt; i++) t += Math.floor(m.baseCost * Math.pow(1.15, m.count + i));
    return t;
}

function renderShop() {
    const container = document.getElementById('shop-container');
    for (let id in state.monkeys) {
        const m = state.monkeys[id];
        let totalCost = getMultiCost(m, buyAmount);
        
        let div = document.getElementById(`shop-${id}`);
        if(!div) {
            div = document.createElement('div');
            div.id = `shop-${id}`;
            div.className = 'shop-item';
            div.onclick = () => buyMonkey(id);
            div.onmouseenter = (e) => showTooltip(e, m.name, m.desc, totalCost);
            div.onmousemove = (e) => moveTooltip(e);
            div.onmouseleave = hideTooltip;
            container.appendChild(div);
        }
        div.className = `shop-item ${state.bloons >= totalCost ? '' : 'locked'}`;
        div.innerHTML = `<div class="shop-item-icon">${m.icon}</div>
            <div class="shop-item-details">${m.name.toUpperCase()}<br><small>CANT: ${m.count}</small></div>
            <div class="shop-item-cost"><span class="cost-val">${format(totalCost)}</span></div>`;
    }
}

function renderUpgrades() {
    const container = document.getElementById('upgrades-grid');
    state.upgrades.forEach((u, i) => {
        let div = document.getElementById(`upg-${u.id}`);
        if(u.purchased) { div?.remove(); return; }
        if(!div) {
            div = document.createElement('div');
            div.id = `upg-${u.id}`;
            div.className = 'upgrade-item';
            div.onclick = () => { buyUpgrade(i); hideTooltip(); };
            div.onmouseenter = (e) => showTooltip(e, u.name, u.desc, u.cost);
            div.onmousemove = (e) => moveTooltip(e);
            div.onmouseleave = hideTooltip;
            container.appendChild(div);
        }
        div.className = `upgrade-item ${state.bloons >= u.cost ? '' : 'locked'}`;
        div.innerText = u.icon;
    });
}

function buyMonkey(id) {
    let m = state.monkeys[id];
    let cost = getMultiCost(m, buyAmount);
    if(state.bloons >= cost) {
        state.bloons -= cost; m.count += buyAmount;
        document.getElementById('buy-sound').cloneNode(true).play();
        calculateStats(); updateUI();
    }
}

function buyUpgrade(i) {
    let u = state.upgrades[i];
    if(state.bloons >= u.cost && !u.purchased) {
        state.bloons -= u.cost; u.purchased = true;
        document.getElementById('buy-sound').cloneNode(true).play();
        calculateStats(); updateUI();
    }
}

function clickBloon(e) {
    let amt = state.clickPower * state.multiplier;
    state.bloons += amt; state.totalBloons += amt; state.totalClicks++;
    
    let p = document.createElement('div');
    p.className = 'particle'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
    p.innerText = `+${format(amt)}`; document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
    
    document.getElementById('pop-sound').cloneNode(true).play();
    updateUI();
}

// Bucle de juego: 10 veces por segundo
setInterval(() => { 
    state.bloons += state.bps/10; 
    state.timePlayed += 0.1; 
    updateUI(); 
}, 100);

document.getElementById('main-bloon').onclick = clickBloon;