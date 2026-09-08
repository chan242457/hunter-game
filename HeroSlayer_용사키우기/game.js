// Hero Slayer: Demon Subjugation - Main Game Engine

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // State: 'MENU', 'PLAYING', 'LEVEL_UP', 'CHEST', 'GAME_OVER', 'LAB'
        this.state = 'MENU';

        this.lastTime = performance.now();
        this.gameTime = 0;

        this.saveData = this.loadSaveData();
        this.selectedClass = 'KNIGHT';

        this.camera = { x: 0, y: 0 };
        this.worldWidth = 3200;
        this.worldHeight = 3200;

        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyBullets = [];
        this.drops = [];
        this.damageTexts = [];
        this.groundDecals = [];
        this.pool = new ParticlePool(400);

        this.spawnTimer = 0;
        this.bossSpawnedAt = {};

        this.combo = 0;
        this.comboTimer = 0;
        this.comboMaxTimer = 3.5;
        this.comboRank = 'D';

        this.input = { up: false, down: false, left: false, right: false };
        this.touchStick = { active: false, startX: 0, startY: 0, curX: 0, curY: 0 };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        this.setupUI();

        requestAnimationFrame((t) => this.loop(t));
    }

    loadSaveData() {
        const defaultData = {
            coins: 0,
            highScoreTime: 0,
            totalKills: 0,
            playerName: '빛의 용사',
            leaderboard: [
                { rank: 1, name: '대마법사 아린', time: 300, kills: 680, level: 24, date: '2026.09.08' },
                { rank: 2, name: '성기사 롤랑', time: 240, kills: 510, level: 20, date: '2026.09.08' },
                { rank: 3, name: '그림자 발렌', time: 180, kills: 375, level: 16, date: '2026.09.08' },
                { rank: 4, name: '수호자 가렌', time: 120, kills: 230, level: 12, date: '2026.09.08' },
                { rank: 5, name: '견습 기사', time: 60, kills: 85, level: 7, date: '2026.09.08' }
            ],
            unlockedClasses: ['KNIGHT'],
            metaUpgrades: {
                meta_damage: 0,
                meta_hp: 0,
                meta_speed: 0,
                meta_crit: 0,
                meta_magnet: 0,
                meta_dash: 0,
                meta_greed: 0,
                meta_revive: 0
            }
        };

        try {
            const raw = localStorage.getItem('hero_slayer_save');
            if (raw) {
                const parsed = JSON.parse(raw);
                const merged = { ...defaultData, ...parsed, metaUpgrades: { ...defaultData.metaUpgrades, ...parsed.metaUpgrades } };
                if (!merged.leaderboard || !Array.isArray(merged.leaderboard) || merged.leaderboard.length === 0) {
                    merged.leaderboard = defaultData.leaderboard;
                }
                if (!merged.playerName) merged.playerName = '빛의 용사';
                return merged;
            }
        } catch (e) {}
        return defaultData;
    }

    saveGameData() {
        try {
            localStorage.setItem('hero_slayer_save', JSON.stringify(this.saveData));
        } catch (e) {}
    }

    resize() {
        this.canvas.width = Math.max(300, window.innerWidth);
        this.canvas.height = Math.max(300, window.innerHeight);
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            if (this.state === 'PLAYING') {
                if (e.code === 'KeyW' || e.key === 'ArrowUp') this.input.up = true;
                if (e.code === 'KeyS' || e.key === 'ArrowDown') this.input.down = true;
                if (e.code === 'KeyA' || e.key === 'ArrowLeft') this.input.left = true;
                if (e.code === 'KeyD' || e.key === 'ArrowRight') this.input.right = true;
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (this.player) this.player.performDash();
                }
                if (e.code === 'KeyQ' || e.code === 'KeyE') {
                    if (this.player) this.player.triggerOverdrive(this.enemies, this.pool, this);
                }
            } else if (this.state === 'LEVEL_UP' && this.currentUpgradeChoices) {
                if (e.code === 'Digit1' || e.code === 'Numpad1') {
                    if (this.currentUpgradeChoices[0]) this.applyUpgradeCard(this.currentUpgradeChoices[0]);
                } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
                    if (this.currentUpgradeChoices[1]) this.applyUpgradeCard(this.currentUpgradeChoices[1]);
                } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
                    if (this.currentUpgradeChoices[2]) this.applyUpgradeCard(this.currentUpgradeChoices[2]);
                }
            }

            if (e.code === 'KeyM') {
                const muted = audio.toggleMute();
                const muteBtn = document.getElementById('muteBtn');
                if (muteBtn) muteBtn.textContent = muted ? '🔇 음소거' : '🔊 사운드 ON';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.key === 'ArrowUp') this.input.up = false;
            if (e.code === 'KeyS' || e.key === 'ArrowDown') this.input.down = false;
            if (e.code === 'KeyA' || e.key === 'ArrowLeft') this.input.left = false;
            if (e.code === 'KeyD' || e.key === 'ArrowRight') this.input.right = false;
        });

        // Mouse aiming
        window.addEventListener('mousemove', (e) => {
            if (this.state === 'PLAYING' && this.player) {
                const screenCenterX = this.canvas.width / 2;
                const screenCenterY = this.canvas.height / 2;
                this.player.facingAngle = Math.atan2(e.clientY - screenCenterY, e.clientX - screenCenterX);
            }
        });

        const canvas = this.canvas;
        canvas.addEventListener('pointerdown', (e) => {
            if (this.state !== 'PLAYING') return;
            this.touchStick.active = true;
            this.touchStick.startX = e.clientX;
            this.touchStick.startY = e.clientY;
            this.touchStick.curX = e.clientX;
            this.touchStick.curY = e.clientY;
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.touchStick.active) return;
            this.touchStick.curX = e.clientX;
            this.touchStick.curY = e.clientY;

            const dx = this.touchStick.curX - this.touchStick.startX;
            const dy = this.touchStick.curY - this.touchStick.startY;
            const dist = Math.hypot(dx, dy);

            if (dist > 15) {
                this.input.left = dx < -15;
                this.input.right = dx > 15;
                this.input.up = dy < -15;
                this.input.down = dy > 15;
            } else {
                this.input.left = false;
                this.input.right = false;
                this.input.up = false;
                this.input.down = false;
            }
        });

        const endTouch = () => {
            this.touchStick.active = false;
            this.input.left = false;
            this.input.right = false;
            this.input.up = false;
            this.input.down = false;
        };
        window.addEventListener('pointerup', endTouch);
        window.addEventListener('pointercancel', endTouch);
    }

    setupUI() {
        document.getElementById('muteBtn').addEventListener('click', () => {
            const muted = audio.toggleMute();
            document.getElementById('muteBtn').textContent = muted ? '🔇 음소거' : '🔊 사운드 ON';
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            audio.playClick();
            audio.startBGM();
            this.startRun();
        });

        document.getElementById('labBtn').addEventListener('click', () => {
            audio.playClick();
            this.openCyberLab();
        });

        document.getElementById('closeLabBtn').addEventListener('click', () => {
            audio.playClick();
            this.state = 'MENU';
            document.getElementById('labModal').classList.add('hidden');
            document.getElementById('mainMenu').classList.remove('hidden');
            this.updateMainMenuUI();
        });

        document.getElementById('overdriveBtn').addEventListener('click', () => {
            if (this.player) this.player.triggerOverdrive(this.enemies, this.pool, this);
        });

        document.getElementById('dashBtn').addEventListener('click', () => {
            if (this.player) this.player.performDash();
        });

        document.getElementById('retryBtn').addEventListener('click', () => {
            audio.playClick();
            document.getElementById('gameOverModal').classList.add('hidden');
            this.startRun();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            audio.playClick();
            document.getElementById('gameOverModal').classList.add('hidden');
            document.getElementById('mainMenu').classList.remove('hidden');
            this.state = 'MENU';
            this.updateMainMenuUI();
        });

        // Player Name Input
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            nameInput.value = this.saveData.playerName || '빛의 용사';
            nameInput.addEventListener('input', (e) => {
                this.saveData.playerName = e.target.value.trim() || '빛의 용사';
                this.saveGameData();
            });
        }

        // Leaderboard Modals & Buttons
        const lbBtn = document.getElementById('leaderboardBtn');
        if (lbBtn) {
            lbBtn.addEventListener('click', () => {
                audio.playClick();
                this.openLeaderboard();
            });
        }

        const goLbBtn = document.getElementById('gameOverLeaderboardBtn');
        if (goLbBtn) {
            goLbBtn.addEventListener('click', () => {
                audio.playClick();
                this.openLeaderboard();
            });
        }

        const closeLbBtn = document.getElementById('closeLeaderboardBtn');
        if (closeLbBtn) {
            closeLbBtn.addEventListener('click', () => {
                audio.playClick();
                this.closeLeaderboard();
            });
        }

        const shareUrlBtn = document.getElementById('copyShareUrlBtn');
        if (shareUrlBtn) {
            shareUrlBtn.addEventListener('click', () => {
                this.copyShareUrl();
            });
        }

        const copyRankBtn = document.getElementById('copyRankBtn');
        if (copyRankBtn) {
            copyRankBtn.addEventListener('click', () => {
                this.copyRankText();
            });
        }

        this.checkServerConnection();
        this.updateMainMenuUI();
    }

    updateMainMenuUI() {
        document.getElementById('menuCoins').textContent = this.saveData.coins.toLocaleString();
        const bestTime = Math.max(
            this.saveData.highScoreTime || 0,
            (this.saveData.leaderboard && this.saveData.leaderboard[0]) ? this.saveData.leaderboard[0].time : 0
        );
        document.getElementById('menuRecord').textContent = this.formatTime(bestTime);

        const nameInput = document.getElementById('playerNameInput');
        if (nameInput && document.activeElement !== nameInput) {
            nameInput.value = this.saveData.playerName || '빛의 용사';
        }

        const container = document.getElementById('heroCards');
        container.innerHTML = '';

        for (const [key, hero] of Object.entries(HERO_CLASSES)) {
            const isUnlocked = this.saveData.unlockedClasses.includes(key);
            const isSelected = this.selectedClass === key;

            const card = document.createElement('div');
            card.className = `hero-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="hero-icon">${hero.icon}</div>
                <div class="hero-name">${hero.name}</div>
                <div class="hero-title">${hero.title}</div>
                <div class="hero-desc">${hero.desc}</div>
                <div class="hero-start-wpn">시작 무기: <strong>${WEAPON_TYPES[hero.startWeapon].name}</strong></div>
                ${!isUnlocked ? `<button class="unlock-hero-btn" data-key="${key}">🔓 해금 (${hero.cost} 금화)</button>` : ''}
            `;

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('unlock-hero-btn')) {
                    const cost = hero.cost;
                    if (this.saveData.coins >= cost) {
                        this.saveData.coins -= cost;
                        this.saveData.unlockedClasses.push(key);
                        this.selectedClass = key;
                        this.saveGameData();
                        audio.playLevelUp();
                        this.updateMainMenuUI();
                    } else {
                        audio.playHit();
                        alert('금화가 부족합니다!');
                    }
                    return;
                }

                if (isUnlocked) {
                    this.selectedClass = key;
                    audio.playClick();
                    this.updateMainMenuUI();
                }
            });

            container.appendChild(card);
        }
    }

    startRun() {
        this.state = 'PLAYING';
        this.gameTime = 0;
        this.enemies = [];
        this.projectiles = [];
        this.enemyBullets = [];
        this.drops = [];
        this.damageTexts = [];
        this.groundDecals = [];
        this.bossSpawnedAt = {};
        this.combo = 0;
        this.comboTimer = 0;

        const greedLvl = this.saveData.metaUpgrades.meta_greed || 0;
        this.metaGreedBonus = greedLvl * 0.12;

        this.player = new Player(this.selectedClass, this.saveData.metaUpgrades);

        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('levelUpModal').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');

        // Reset Artifact HUD
        this.updateArtifactHUD();

        audio.playLevelUp();
    }

    updateArtifactHUD() {
        const container = document.getElementById('artifactSlots');
        if (!container || !this.player) return;
        container.innerHTML = '';
        for (const artId of this.player.artifacts) {
            const art = ANCIENT_ARTIFACTS[artId];
            if (!art) continue;
            const icon = document.createElement('div');
            icon.className = 'artifact-badge';
            icon.title = `${art.name}: ${art.desc}`;
            icon.innerHTML = art.icon;
            container.appendChild(icon);
        }
    }

    triggerScreenShake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = duration;
    }

    triggerLevelUpModal() {
        this.state = 'LEVEL_UP';
        const modal = document.getElementById('levelUpModal');
        const cardGrid = document.getElementById('upgradeCards');
        cardGrid.innerHTML = '';
        modal.classList.remove('hidden');

        const availableCards = this.getAvailableUpgradeCards();

        const choices = [];
        const poolCopy = [...availableCards];
        for (let i = 0; i < 3 && poolCopy.length > 0; i++) {
            const idx = Math.floor(Math.random() * poolCopy.length);
            choices.push(poolCopy.splice(idx, 1)[0]);
        }

        if (choices.length === 0) {
            choices.push({
                type: 'BONUS_COIN',
                name: '황금 보급 상자',
                desc: '120 금화 즉시 획득',
                icon: '💰',
                color: '#ffd700',
                apply: () => {
                    this.player.totalCoins += 120;
                    this.saveData.coins += 120;
                }
            });
            choices.push({
                type: 'SUPER_HEAL',
                name: '성스러운 기도의 은총',
                desc: '체력 및 보호막 100% 완전 회복',
                icon: '💖',
                color: '#ff1155',
                apply: () => {
                    this.player.hp = this.player.maxHp;
                    this.player.shield = this.player.maxShield;
                }
            });
        }

        this.currentUpgradeChoices = choices;

        choices.forEach((cardData, idx) => {
            const el = document.createElement('div');
            el.className = `upgrade-card ${cardData.isEvolved ? 'evolved-card' : ''}`;
            el.innerHTML = `
                <div class="card-key-badge">[${idx + 1}키]</div>
                <div class="card-glow" style="background: ${cardData.color}"></div>
                <div class="card-icon">${cardData.icon}</div>
                <div class="card-title" style="color: ${cardData.color}">${cardData.name}</div>
                <div class="card-level">${cardData.isEvolved ? '★ 초월 각성 ★' : (cardData.levelInfo || '신규 습득')}</div>
                <div class="card-desc">${cardData.desc}</div>
            `;

            el.addEventListener('click', () => {
                this.applyUpgradeCard(cardData);
            });

            cardGrid.appendChild(el);
        });
    }

    applyUpgradeCard(cardData) {
        if (!cardData) return;
        audio.playClick();
        if (cardData.apply) {
            cardData.apply();
        } else if (cardData.isWeapon) {
            if (cardData.isEvolved) {
                this.player.evolveWeapon(cardData.baseWeaponId, cardData.id);
                audio.playOverdrive();
                this.triggerScreenShake(8, 0.3);
            } else {
                this.player.addWeapon(cardData.id);
            }
        } else if (cardData.isPassive) {
            this.player.addPassive(cardData.id);
        }

        const modal = document.getElementById('levelUpModal');
        this.currentUpgradeChoices = null;

        if (this.player && this.player.pendingLevelUps > 0) {
            this.player.pendingLevelUps--;
        }

        if (this.player && this.player.pendingLevelUps > 0) {
            this.triggerLevelUpModal();
        } else {
            modal.classList.add('hidden');
            this.state = 'PLAYING';
        }
    }

    getAvailableUpgradeCards() {
        const cards = [];

        // 1. Weapon Evolutions (Priority 1)
        for (const [wId, wp] of Object.entries(this.player.weapons)) {
            const wDef = WEAPON_TYPES[wId];
            if (wDef && !wDef.isEvolved && wp.level >= wDef.maxLevel) {
                const pairPassiveId = wDef.evolutionPair;
                if (this.player.passives[pairPassiveId]) {
                    const evoDef = WEAPON_TYPES[wDef.evolvesTo];
                    if (evoDef) {
                        cards.push({
                            id: evoDef.id,
                            baseWeaponId: wId,
                            isWeapon: true,
                            isEvolved: true,
                            name: evoDef.name,
                            icon: evoDef.icon,
                            color: evoDef.color,
                            desc: evoDef.desc
                        });
                    }
                }
            }
        }

        // 2. Existing Weapons leveling
        for (const [wId, wp] of Object.entries(this.player.weapons)) {
            const wDef = WEAPON_TYPES[wId];
            if (wDef && !wDef.isEvolved && wp.level < wDef.maxLevel) {
                cards.push({
                    id: wId,
                    isWeapon: true,
                    name: wDef.name,
                    icon: wDef.icon,
                    color: wDef.color,
                    levelInfo: `Lv.${wp.level} ➔ Lv.${wp.level + 1}`,
                    desc: wDef.levels[wp.level].desc
                });
            }
        }

        // 3. New Weapons (slots < 4)
        const weaponCount = Object.keys(this.player.weapons).length;
        if (weaponCount < 4) {
            for (const [wId, wDef] of Object.entries(WEAPON_TYPES)) {
                if (!wDef.isEvolved && !this.player.weapons[wId]) {
                    cards.push({
                        id: wId,
                        isWeapon: true,
                        name: wDef.name,
                        icon: wDef.icon,
                        color: wDef.color,
                        levelInfo: '신규 무기 장착',
                        desc: wDef.desc
                    });
                }
            }
        }

        // 4. Existing Passives leveling
        for (const [pId, lvl] of Object.entries(this.player.passives)) {
            const pDef = PASSIVE_TYPES[pId];
            if (pDef && lvl < pDef.maxLevel) {
                cards.push({
                    id: pId,
                    isPassive: true,
                    name: pDef.name,
                    icon: pDef.icon,
                    color: pDef.color,
                    levelInfo: `Lv.${lvl} ➔ Lv.${lvl + 1}`,
                    desc: pDef.levels[lvl]
                });
            }
        }

        // 5. New Passives (slots < 4)
        const passiveCount = Object.keys(this.player.passives).length;
        if (passiveCount < 4) {
            for (const [pId, pDef] of Object.entries(PASSIVE_TYPES)) {
                if (!this.player.passives[pId]) {
                    cards.push({
                        id: pId,
                        isPassive: true,
                        name: pDef.name,
                        icon: pDef.icon,
                        color: pDef.color,
                        levelInfo: '신규 패시브 습득',
                        desc: pDef.levels[0]
                    });
                }
            }
        }

        return cards;
    }

    openChest() {
        const bonusCoins = Math.floor(Math.random() * 50 + 40);
        this.player.totalCoins += bonusCoins;
        this.saveData.coins += bonusCoins;

        // Chance to grant an unacquired ancient artifact
        const unownedArtifacts = Object.keys(ANCIENT_ARTIFACTS).filter(aId => !this.player.artifacts.has(aId));
        if (unownedArtifacts.length > 0 && Math.random() < 0.6) {
            const chosen = unownedArtifacts[Math.floor(Math.random() * unownedArtifacts.length)];
            this.player.addArtifact(chosen);
            const art = ANCIENT_ARTIFACTS[chosen];
            this.damageTexts.push(new DamageText(this.player.x, this.player.y - 65, `★ 유물 획득: ${art.name}!`, '#ffd700', true, 25));
            this.updateArtifactHUD();
        } else {
            this.damageTexts.push(new DamageText(this.player.x, this.player.y - 45, `보물상자! +${bonusCoins} 금화`, '#ffd700', true, 22));
        }

        this.triggerScreenShake(7, 0.25);
        this.triggerLevelUpModal();
    }

    spawnDrop(x, y, type, value) {
        this.drops.push(new DropItem(x, y, type, value));
    }

    spawnEnemyBullet(x, y, angle, speed, damage) {
        this.enemyBullets.push(new EnemyBullet(x, y, angle, speed, damage));
    }

    onEnemyKilled(enemy) {
        this.player.kills++;
        this.saveData.totalKills++;

        // Vampire Chalice Artifact: every 40 kills gives +4 Max HP
        if (this.player.artifacts.has('VAMPIRE_CHALICE')) {
            this.player.chaliceKills = (this.player.chaliceKills || 0) + 1;
            if (this.player.chaliceKills % 40 === 0) {
                this.player.maxHp += 4;
                this.player.heal(4);
                this.damageTexts.push(new DamageText(this.player.x, this.player.y - 35, '피의 성배: 최대 HP +4 영구 증가!', '#ff0055', true, 18));
            }
        }

        this.combo++;
        this.comboTimer = this.comboMaxTimer;
        this.updateComboRank();
    }

    updateComboRank() {
        let oldRank = this.comboRank;
        if (this.combo >= 60) this.comboRank = 'SSS';
        else if (this.combo >= 40) this.comboRank = 'SS';
        else if (this.combo >= 25) this.comboRank = 'S';
        else if (this.combo >= 15) this.comboRank = 'A';
        else if (this.combo >= 8) this.comboRank = 'B';
        else if (this.combo >= 3) this.comboRank = 'C';
        else this.comboRank = 'D';

        if (this.comboRank !== oldRank && (this.comboRank === 'S' || this.comboRank === 'SS' || this.comboRank === 'SSS')) {
            audio.playCritHit();
            this.damageTexts.push(new DamageText(this.player.x, this.player.y - 60, `용사의 일격 [${this.comboRank}]!`, '#ffd700', true, 26));
        }
    }

    onPlayerDied() {
        this.state = 'GAME_OVER';

        this.saveData.coins += this.player.totalCoins;

        // Create score entry for player
        const pName = (this.saveData.playerName || '빛의 용사').trim();
        const scoreEntry = {
            name: pName,
            time: Math.floor(this.gameTime),
            kills: this.player.kills,
            level: this.player.level,
            date: new Date().toISOString().slice(0, 10).replace(/-/g, '.')
        };

        const isNewRecord = this.recordScore(scoreEntry);

        if (this.gameTime > this.saveData.highScoreTime) {
            this.saveData.highScoreTime = this.gameTime;
        }
        this.saveGameData();

        document.getElementById('hud').classList.add('hidden');
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('hidden');

        // New record announcement banner
        const recordBanner = document.getElementById('newRecordBanner');
        if (recordBanner) {
            if (isNewRecord) {
                recordBanner.classList.remove('hidden');
                audio.playLevelUp();
            } else {
                recordBanner.classList.add('hidden');
            }
        }

        document.getElementById('statTime').textContent = this.formatTime(this.gameTime);
        document.getElementById('statKills').textContent = this.player.kills.toLocaleString();
        document.getElementById('statLevel').textContent = this.player.level;
        document.getElementById('statCoins').textContent = `+${this.player.totalCoins.toLocaleString()}`;

        // Sync with central server
        this.syncScoreWithServer(scoreEntry);
    }

    recordScore(entry) {
        if (!this.saveData.leaderboard || !Array.isArray(this.saveData.leaderboard)) {
            this.saveData.leaderboard = [];
        }

        // Must have survived at least 1 second
        if (entry.time <= 0) return false;

        const list = [...this.saveData.leaderboard];
        list.push(entry);

        // Sort: time desc -> kills desc -> level desc
        list.sort((a, b) => {
            if (b.time !== a.time) return b.time - a.time;
            if (b.kills !== a.kills) return b.kills - a.kills;
            return b.level - a.level;
        });

        const entryIndex = list.indexOf(entry);
        const top5 = list.slice(0, 5);
        for (let i = 0; i < top5.length; i++) {
            top5[i].rank = i + 1;
        }
        this.saveData.leaderboard = top5;

        // Return true if our new score made it into the top 5
        return entryIndex < 5;
    }

    openLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.classList.remove('hidden');
        this.renderLeaderboardTable();
        this.fetchServerLeaderboard();
    }

    closeLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.classList.add('hidden');
    }

    renderLeaderboardTable() {
        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const list = this.saveData.leaderboard || [];
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const tr = document.createElement('tr');

            let rankHtml = '';
            if (i === 0) rankHtml = '<span class="rank-cell rank-badge-1">🥇 1위</span>';
            else if (i === 1) rankHtml = '<span class="rank-cell rank-badge-2">🥈 2위</span>';
            else if (i === 2) rankHtml = '<span class="rank-cell rank-badge-3">🥉 3위</span>';
            else rankHtml = `<span class="rank-cell rank-badge-other">${i + 1}위</span>`;

            const isCurrent = (item.name === this.saveData.playerName);
            if (isCurrent) tr.classList.add('rank-row-highlight');

            tr.innerHTML = `
                <td>${rankHtml}</td>
                <td class="hero-name-cell" title="${this.escapeHtml(item.name)}">${this.escapeHtml(item.name)}</td>
                <td class="hero-time-cell">${this.formatTime(item.time)}</td>
                <td>⚔️ ${Number(item.kills || 0).toLocaleString()}</td>
                <td>LV.${item.level || 1}</td>
                <td style="color: #94a3b8; font-size: 12px;">${item.date || '-'}</td>
            `;
            tbody.appendChild(tr);
        }

        // Fill empty rows if less than 5
        for (let i = list.length; i < 5; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="rank-cell rank-badge-other">${i + 1}위</span></td>
                <td class="hero-name-cell" style="color: #64748b;">(도전자 대기중)</td>
                <td class="hero-time-cell" style="color: #64748b;">00:00</td>
                <td style="color: #64748b;">⚔️ 0</td>
                <td style="color: #64748b;">LV.1</td>
                <td style="color: #64748b; font-size: 12px;">-</td>
            `;
            tbody.appendChild(tr);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async checkServerConnection() {
        const badgeText = document.getElementById('syncStatusText');
        try {
            const res = await fetch('/api/leaderboard', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.leaderboard)) {
                    this.isServerConnected = true;
                    this.saveData.leaderboard = data.leaderboard;
                    this.saveGameData();
                    if (badgeText) badgeText.textContent = '🌐 연동 서버 접속 중 (실시간 공유)';
                    return;
                }
            }
        } catch (e) {}
        this.isServerConnected = false;
        if (badgeText) badgeText.textContent = '💾 기기 로컬 보존 모드';
    }

    async fetchServerLeaderboard() {
        const badgeText = document.getElementById('syncStatusText');
        try {
            const res = await fetch('/api/leaderboard', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.leaderboard)) {
                    this.isServerConnected = true;
                    this.saveData.leaderboard = data.leaderboard;
                    this.saveGameData();
                    if (badgeText) badgeText.textContent = '🌐 연동 서버 접속 중 (실시간 공유)';
                    this.renderLeaderboardTable();
                    return;
                }
            }
        } catch (e) {}
        this.isServerConnected = false;
        if (badgeText) badgeText.textContent = '💾 기기 로컬 보존 모드';
    }

    async syncScoreWithServer(scoreEntry) {
        try {
            const res = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scoreEntry)
            });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.leaderboard)) {
                    this.saveData.leaderboard = data.leaderboard;
                    this.saveGameData();
                }
            }
        } catch (e) {}
    }

    copyShareUrl() {
        const btn = document.getElementById('copyShareUrlBtn');
        let shareUrl = window.location.href;
        if (window.location.protocol === 'file:') {
            alert('현재 [파일 직접 실행] 모드입니다.\n\n다른 사람이나 스마트폰과 공유하려면 게임 폴더의 [공유_서버_실행.bat]을 더블 클릭해 실행해주세요!');
            return;
        }
        navigator.clipboard.writeText(shareUrl).then(() => {
            const oldText = btn.textContent;
            btn.textContent = '✅ 주소 복사 완료!';
            setTimeout(() => { btn.textContent = oldText; }, 2000);
        }).catch(() => {
            prompt('친구에게 전달할 접속 주소입니다:', shareUrl);
        });
    }

    copyRankText() {
        const btn = document.getElementById('copyRankBtn');
        const list = this.saveData.leaderboard || [];
        let text = '🏆 [용사 키우기: 마왕 토벌전] 명예의 전당 TOP 5 🏆\n\n';
        list.forEach((item, idx) => {
            text += `${idx + 1}위: [${item.name}] 생존 ${this.formatTime(item.time)} | ⚔️ ${Number(item.kills || 0).toLocaleString()} 처치 | LV.${item.level} (${item.date})\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
            const oldText = btn.textContent;
            btn.textContent = '✅ 기록 복사 완료!';
            setTimeout(() => { btn.textContent = oldText; }, 2000);
        }).catch(() => {
            prompt('명예의 전당 기록입니다:', text);
        });
    }

    openCyberLab() {
        this.state = 'LAB';
        document.getElementById('mainMenu').classList.add('hidden');
        const modal = document.getElementById('labModal');
        modal.classList.remove('hidden');
        this.renderCyberLab();
    }

    renderCyberLab() {
        document.getElementById('labCoins').textContent = this.saveData.coins.toLocaleString();
        const list = document.getElementById('metaList');
        list.innerHTML = '';

        for (const [key, upg] of Object.entries(META_UPGRADES)) {
            const curLvl = this.saveData.metaUpgrades[key] || 0;
            const isMax = curLvl >= upg.maxLevel;
            const cost = getMetaUpgradeCost(key, curLvl);

            const item = document.createElement('div');
            item.className = 'meta-item';
            item.innerHTML = `
                <div class="meta-icon">${upg.icon}</div>
                <div class="meta-info">
                    <div class="meta-title">${upg.name} <span class="meta-lvl">Lv.${curLvl}/${upg.maxLevel}</span></div>
                    <div class="meta-desc">${upg.desc}</div>
                    <div class="meta-boost">기도 효과: ${upg.perLevel}</div>
                </div>
                <button class="meta-buy-btn ${isMax ? 'maxed' : ''}" data-key="${key}">
                    ${isMax ? '은총 완료' : `기도 봉헌 (${cost} 금화)`}
                </button>
            `;

            const btn = item.querySelector('.meta-buy-btn');
            if (!isMax) {
                btn.addEventListener('click', () => {
                    if (this.saveData.coins >= cost) {
                        this.saveData.coins -= cost;
                        this.saveData.metaUpgrades[key] = curLvl + 1;
                        this.saveGameData();
                        audio.playLevelUp();
                        this.renderCyberLab();
                    } else {
                        audio.playHit();
                        alert('금화가 부족합니다! 마물들을 토벌하여 금화를 모으세요.');
                    }
                });
            }

            list.appendChild(item);
        }
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    loop(timestamp) {
        try {
            const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
            this.lastTime = timestamp;

            if (this.state === 'PLAYING') {
                this.update(dt);
            }

            this.render();
        } catch (err) {
            console.error('Safe Game Loop Error Caught:', err);
        } finally {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    update(dt) {
        this.gameTime += dt;

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer <= 0) this.shakeIntensity = 0;
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboRank = 'D';
            }
        }

        this.player.update(dt, this.input, this.enemies, this.pool, this);

        const halfW = this.worldWidth / 2;
        const halfH = this.worldHeight / 2;
        this.player.x = Math.max(-halfW + 30, Math.min(halfW - 30, this.player.x));
        this.player.y = Math.max(-halfH + 30, Math.min(halfH - 30, this.player.y));

        this.camera.x += (this.player.x - this.camera.x) * 8 * dt;
        this.camera.y += (this.player.y - this.camera.y) * 8 * dt;

        this.updateSpawning(dt);

        // Update Ground Decals
        for (let i = this.groundDecals.length - 1; i >= 0; i--) {
            const gd = this.groundDecals[i];
            gd.update(dt, this.player);
            if (gd.dead) this.groundDecals.splice(i, 1);
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, this.player, this.enemies, this.pool, this);
            if (e.dead) this.enemies.splice(i, 1);
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, this.enemies, this.pool, this);
            if (p.dead) this.projectiles.splice(i, 1);
        }

        // Update Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.update(dt, this.player, this.pool, this);
            if (b.dead) this.enemyBullets.splice(i, 1);
        }

        // Update Drops
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const d = this.drops[i];
            d.update(dt, this.player);
            if (d.dead) this.drops.splice(i, 1);
        }

        // Update Damage Texts
        for (let i = this.damageTexts.length - 1; i >= 0; i--) {
            const t = this.damageTexts[i];
            t.update(dt);
            if (t.dead) this.damageTexts.splice(i, 1);
        }

        this.pool.update(dt);
        this.updateHUD();
    }

    updateSpawning(dt) {
        this.spawnTimer += dt;
        const difficulty = 1 + (this.gameTime / 60) * 0.35;
        const currentInterval = Math.max(0.2, 0.9 - (this.gameTime / 180) * 0.55);

        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.spawnWaveEnemy(difficulty);
        }

        // Boss milestones: 02:00 Cerberus, 05:00 Demon King
        if (this.gameTime >= 120 && !this.bossSpawnedAt['CERBERUS']) {
            this.bossSpawnedAt['CERBERUS'] = true;
            this.spawnBoss('CERBERUS');
        }

        if (this.gameTime >= 300 && !this.bossSpawnedAt['DEMON_KING']) {
            this.bossSpawnedAt['DEMON_KING'] = true;
            this.spawnBoss('DEMON_KING');
        }
    }

    spawnWaveEnemy(difficulty) {
        if (this.enemies.length >= 200) return;

        const angle = Math.random() * Math.PI * 2;
        const spawnDist = Math.max(this.canvas.width, this.canvas.height) * 0.65;
        const sx = this.player.x + Math.cos(angle) * spawnDist;
        const sy = this.player.y + Math.sin(angle) * spawnDist;

        let type = 'SLIME';
        const t = this.gameTime;

        if (t > 240) {
            // Demon castle entrance: Golems, Assassins, Imps, Necromancers
            const roll = Math.random();
            if (roll < 0.25) type = 'SHADOW_ASSASSIN';
            else if (roll < 0.5) type = 'STONE_GOLEM';
            else if (roll < 0.75) type = 'FIRE_IMP';
            else type = 'NECROMANCER';
        } else if (t > 150) {
            // Castle ruins: Imps, Assassins, Skeleton Archers
            const roll = Math.random();
            if (roll < 0.35) type = 'FIRE_IMP';
            else if (roll < 0.7) type = 'SHADOW_ASSASSIN';
            else type = 'SKELETON_ARCHER';
        } else if (t > 60) {
            // Crypt: Skeleton archers, Goblins, Necromancers
            const roll = Math.random();
            if (roll < 0.45) type = 'SKELETON_ARCHER';
            else if (roll < 0.75) type = 'GOBLIN';
            else type = 'NECROMANCER';
        } else if (t > 25) {
            type = Math.random() < 0.6 ? 'SLIME' : 'GOBLIN';
        }

        this.enemies.push(new Enemy(sx, sy, type, difficulty));
    }

    spawnBoss(bossType) {
        audio.playBossAlert();
        this.triggerScreenShake(14, 0.6);

        const angle = Math.random() * Math.PI * 2;
        const sx = this.player.x + Math.cos(angle) * 450;
        const sy = this.player.y + Math.sin(angle) * 450;

        const boss = new Enemy(sx, sy, bossType, 1.0);
        this.enemies.push(boss);

        const title = bossType === 'CERBERUS' ? '⚠️ 지옥 맹견 켈베로스 출현!' : '🔥 심연의 마왕 말가루스 강림!';
        this.damageTexts.push(new DamageText(this.player.x, this.player.y - 60, title, '#ff2200', true, 26));
    }

    updateHUD() {
        if (!this.player) return;

        const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        document.getElementById('hpBar').style.width = `${hpPct}%`;
        document.getElementById('hpText').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

        const shieldPct = Math.max(0, (this.player.shield / this.player.maxShield) * 100);
        document.getElementById('shieldBar').style.width = `${shieldPct}%`;

        const expPct = Math.max(0, (this.player.exp / this.player.expToNextLevel) * 100);
        document.getElementById('expBar').style.width = `${expPct}%`;
        document.getElementById('levelBadge').textContent = `LV. ${this.player.level}`;

        document.getElementById('timerText').textContent = this.formatTime(this.gameTime);
        document.getElementById('killCount').textContent = `⚔️ ${this.player.kills}`;
        document.getElementById('coinCount').textContent = `🪙 ${this.player.totalCoins}`;

        const comboEl = document.getElementById('comboBadge');
        if (this.combo > 1) {
            comboEl.classList.remove('hidden');
            comboEl.textContent = `${this.combo} 연격 [${this.comboRank}]`;
        } else {
            comboEl.classList.add('hidden');
        }

        const dashBtn = document.getElementById('dashBtn');
        if (dashBtn) {
            if (this.player.dashTimer > 0) {
                dashBtn.classList.add('on-cooldown');
                dashBtn.textContent = `회피 (${this.player.dashTimer.toFixed(1)}s)`;
            } else {
                dashBtn.classList.remove('on-cooldown');
                dashBtn.textContent = '⚡ 회피 대시 [SPACE]';
            }
        }

        const odBtn = document.getElementById('overdriveBtn');
        if (odBtn) {
            const odPct = Math.floor((this.player.overdriveEnergy / this.player.maxOverdrive) * 100);
            if (odPct >= 100) {
                odBtn.classList.add('ready');
                odBtn.textContent = '✨ 천벌의 성역 READY! [Q]';
            } else {
                odBtn.classList.remove('ready');
                odBtn.textContent = `성역 게이지 ${odPct}% [Q]`;
            }
        }

        const boss = this.enemies.find(e => e.isBoss && !e.dead);
        const bossBarContainer = document.getElementById('bossBarContainer');
        if (boss) {
            bossBarContainer.classList.remove('hidden');
            const bPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
            document.getElementById('bossBarFill').style.width = `${bPct}%`;
            document.getElementById('bossName').textContent = `⚠️ ${boss.name}`;
        } else {
            bossBarContainer.classList.add('hidden');
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        if (this.shakeTimer > 0) {
            const ox = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const oy = (Math.random() - 0.5) * this.shakeIntensity * 2;
            ctx.translate(ox, oy);
        }

        if (this.state === 'PLAYING' || this.state === 'LEVEL_UP' || this.state === 'GAME_OVER') {
            ctx.save();
            ctx.translate(this.canvas.width / 2 - this.camera.x, this.canvas.height / 2 - this.camera.y);

            this.drawFantasyBattlefield(ctx);

            for (const gd of this.groundDecals) gd.draw(ctx);
            for (const d of this.drops) d.draw(ctx);
            for (const e of this.enemies) e.draw(ctx);
            if (this.player) this.player.draw(ctx);
            for (const p of this.projectiles) p.draw(ctx);
            for (const b of this.enemyBullets) b.draw(ctx);
            this.pool.draw(ctx);
            for (const t of this.damageTexts) t.draw(ctx);

            ctx.restore();

            if (this.touchStick.active) {
                this.drawTouchStick(ctx);
            }
        }

        ctx.restore();
    }

    drawFantasyBattlefield(ctx) {
        const halfW = this.worldWidth / 2;
        const halfH = this.worldHeight / 2;

        // Dark Obsidian Stone Ground
        ctx.fillStyle = '#100c14';
        ctx.fillRect(-halfW, -halfH, this.worldWidth, this.worldHeight);

        // Ancient Stone Tile Borders
        const tileSize = 120;
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = -halfW; x <= halfW; x += tileSize) {
            ctx.moveTo(x, -halfH);
            ctx.lineTo(x, halfH);
        }
        for (let y = -halfH; y <= halfH; y += tileSize) {
            ctx.moveTo(-halfW, y);
            ctx.lineTo(halfW, y);
        }
        ctx.stroke();

        // Magic Rune Rings on Center
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 300, 0, Math.PI * 2);
        ctx.arc(0, 0, 500, 0, Math.PI * 2);
        ctx.stroke();

        // World Border Flame Wall
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 20;
        ctx.strokeRect(-halfW, -halfH, this.worldWidth, this.worldHeight);
        ctx.shadowBlur = 0;
    }

    drawTouchStick(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.touchStick.startX, this.touchStick.startY, 45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.beginPath();
        ctx.arc(this.touchStick.curX, this.touchStick.curY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
