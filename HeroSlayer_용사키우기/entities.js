// Hero Slayer: Demon Subjugation - Fantasy Entities, Spells & Monster Ecosystem

function distSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}

// Floating Combat Text
class DamageText {
    constructor(x, y, text, color = '#ffffff', isCrit = false, size = 16) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y + (Math.random() * 10 - 5);
        this.text = text;
        this.color = color;
        this.isCrit = isCrit;
        this.size = isCrit ? size * 1.5 : size;
        this.vy = isCrit ? -3.5 : -2.0;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.alpha = 1.0;
        this.life = 0;
        this.maxLife = isCrit ? 0.9 : 0.6;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vy += 2.5 * dt;
        this.life += dt;
        if (this.life > this.maxLife) {
            this.dead = true;
        } else {
            this.alpha = 1 - (this.life / this.maxLife);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.font = `${this.isCrit ? '900' : 'bold'} ${Math.round(this.size)}px 'Cinzel', 'Rajdhani', 'Segoe UI', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = this.isCrit ? '#ff0033' : '#110500';
        ctx.lineWidth = this.isCrit ? 4 : 3;
        ctx.strokeText(this.text, this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// Ground Decals (Slime Puddles, Meteor Scars, Shockwaves)
class GroundDecal {
    constructor(x, y, type = 'SLIME_PUDDLE', radius = 35, duration = 4.5) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = radius;
        this.life = 0;
        this.maxLife = duration;
        this.dead = false;
    }

    update(dt, player) {
        this.life += dt;
        if (this.life >= this.maxLife) {
            this.dead = true;
            return;
        }

        // Slime Puddle slows player by 35% when standing inside
        if (this.type === 'SLIME_PUDDLE') {
            if (dist(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
                player.isSlowed = true;
                player.slowTimer = 0.2;
            }
        }
    }

    draw(ctx) {
        const alpha = Math.min(1, (1 - this.life / this.maxLife) * 1.5);
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha * 0.45);

        if (this.type === 'SLIME_PUDDLE') {
            ctx.fillStyle = '#05ffa1';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'FIRE_ZONE') {
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Particle System
class Particle {
    constructor() {
        this.active = false;
    }

    spawn(x, y, vx, vy, color, size, maxLife, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = 0;
        this.maxLife = maxLife;
        this.shape = shape;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vx *= 0.93;
        this.vy *= 0.93;
        this.life += dt;
        if (this.life >= this.maxLife) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        const progress = this.life / this.maxLife;
        const alpha = 1 - progress;
        const currentSize = this.size * (1 - progress * 0.5);

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'ring') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(1, currentSize * 0.2);
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize * (1 + progress * 2), 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.shape === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class ParticlePool {
    constructor(size = 400) {
        this.particles = Array.from({ length: size }, () => new Particle());
    }

    emit(x, y, count, color, speed = 3, size = 3, shape = 'circle') {
        for (let i = 0; i < count; i++) {
            const p = this.particles.find(item => !item.active);
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const spd = (Math.random() * 0.8 + 0.2) * speed;
            p.spawn(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                color,
                size * (Math.random() * 0.6 + 0.7),
                Math.random() * 0.3 + 0.2,
                shape
            );
        }
    }

    emitRing(x, y, color, radius = 40) {
        const p = this.particles.find(item => !item.active);
        if (p) {
            p.spawn(x, y, 0, 0, color, radius, 0.4, 'ring');
        }
    }

    update(dt) {
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].update(dt);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].draw(ctx);
            }
        }
    }
}

// Drop Items (Mana Crystals, Gold Coins, Health Potions, Artifact Chests)
class DropItem {
    constructor(x, y, type = 'EXP_1', value = 1) {
        this.x = x;
        this.y = y;
        this.type = type; // 'EXP_1', 'EXP_2', 'EXP_3', 'COIN', 'HEALTH', 'CHEST', 'MAGNET_NUKE'
        this.value = value;
        this.radius = 8;
        this.target = null;
        this.speed = 0;
        this.dead = false;
        this.bobOffset = Math.random() * Math.PI * 2;

        if (type === 'EXP_1') {
            this.color = '#00f2ff'; // Sky Blue Mana
            this.radius = 6;
        } else if (type === 'EXP_2') {
            this.color = '#a855f7'; // Royal Purple Mana
            this.radius = 8;
        } else if (type === 'EXP_3') {
            this.color = '#ffd700'; // Radiant Gold Mana
            this.radius = 11;
        } else if (type === 'COIN') {
            this.color = '#ffbb00';
            this.radius = 7;
        } else if (type === 'HEALTH') {
            this.color = '#ff1155'; // Healing Potion
            this.radius = 9;
        } else if (type === 'CHEST') {
            this.color = '#ffd700'; // Treasure Chest
            this.radius = 14;
        } else if (type === 'MAGNET_NUKE') {
            this.color = '#05ffa1';
            this.radius = 11;
        }
    }

    update(dt, player) {
        const d = dist(this.x, this.y, player.x, player.y);

        if (!this.target && d < player.magnetRadius) {
            this.target = player;
        }

        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.speed += 850 * dt;
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            if (d < player.radius + this.radius) {
                this.dead = true;
                player.collectItem(this);
            }
        }
    }

    draw(ctx) {
        const hoverY = this.y + Math.sin(Date.now() * 0.006 + this.bobOffset) * 2.5;

        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;

        if (this.type.startsWith('EXP')) {
            // Radiant Mana Crystal
            ctx.beginPath();
            ctx.moveTo(this.x, hoverY - this.radius);
            ctx.lineTo(this.x + this.radius * 0.7, hoverY);
            ctx.lineTo(this.x, hoverY + this.radius);
            ctx.lineTo(this.x - this.radius * 0.7, hoverY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, hoverY, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'COIN') {
            // Golden Coin with crest
            ctx.beginPath();
            ctx.arc(this.x, hoverY, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (this.type === 'HEALTH') {
            // Ruby Health Potion bottle
            ctx.fillStyle = '#ff1155';
            ctx.beginPath();
            ctx.arc(this.x, hoverY + 2, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(this.x - 3, hoverY - 7, 6, 4);
        } else if (this.type === 'CHEST') {
            // Golden Ornate Treasure Chest
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x - 12, hoverY - 8, 24, 16);
            ctx.strokeStyle = '#8b5a00';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 12, hoverY - 8, 24, 16);
            ctx.fillStyle = '#ff0033';
            ctx.fillRect(this.x - 3, hoverY - 2, 6, 5);
        } else if (this.type === 'MAGNET_NUKE') {
            // Mana Vortex
            ctx.beginPath();
            ctx.arc(this.x, hoverY, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Projectiles & Spells
class Projectile {
    constructor(config) {
        Object.assign(this, config);
        this.dead = false;
        this.life = 0;
    }

    update(dt, enemies, pool, game) {
        this.life += dt;
        if (this.maxLife && this.life >= this.maxLife) {
            this.dead = true;
            return;
        }

        switch (this.type) {
            case 'SWORD_SLASH':
            case 'EXCALIBUR_SLASH':
                if (this.owner) {
                    this.x = this.owner.x;
                    this.y = this.owner.y;
                }
                if (!this.hitEnemies) this.hitEnemies = new Set();
                {
                    const swingDir = this.swingDir || 1;
                    const arc = this.arcAngle;
                    const startAngle = this.angle - (arc / 2) * swingDir;
                    const progress = Math.min(1, Math.max(0, this.life / this.maxLife));
                    const easeProgress = Math.min(1, 1 - Math.pow(1 - progress, 2.2));
                    const currentAngle = startAngle + (arc * swingDir) * easeProgress;

                    // Blade tip spark particles
                    if (Math.random() < 0.35) {
                        const tipX = this.x + Math.cos(currentAngle) * (this.range * 0.9);
                        const tipY = this.y + Math.sin(currentAngle) * (this.range * 0.9);
                        pool.emit(tipX, tipY, 1, this.color, 1.5, 1, 'spark');
                    }

                    for (const enemy of enemies) {
                        if (enemy.dead || this.hitEnemies.has(enemy)) continue;
                        const d = dist(this.x, this.y, enemy.x, enemy.y);
                        if (d <= this.range + enemy.radius) {
                            const enemyAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                            let diff = Math.abs(enemyAngle - this.angle);
                            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
                            if (diff <= (arc / 2) + 0.2) {
                                let angleFromStart = (enemyAngle - startAngle) * swingDir;
                                while (angleFromStart < -Math.PI) angleFromStart += Math.PI * 2;
                                while (angleFromStart > Math.PI) angleFromStart -= Math.PI * 2;
                                if (angleFromStart >= -0.25 && angleFromStart <= (arc * easeProgress) + 0.35) {
                                    this.hitEnemies.add(enemy);
                                    enemy.takeDamage(this.damage, this.isCrit, this.knockback, enemyAngle, pool, game);
                                    pool.emit(enemy.x, enemy.y, 8, this.color, 4, 3, 'spark');
                                    if (this.isCrit || this.type === 'EXCALIBUR_SLASH') {
                                        game.triggerScreenShake(2.5, 0.08);
                                    }
                                }
                            }
                        }
                    }
                }
                break;

            case 'FIREBALL':
            case 'METEOR':
                if (!this.target || this.target.dead) {
                    let closest = null;
                    let minD = Infinity;
                    for (const enemy of enemies) {
                        if (enemy.dead) continue;
                        const d = distSq(this.x, this.y, enemy.x, enemy.y);
                        if (d < minD) {
                            minD = d;
                            closest = enemy;
                        }
                    }
                    this.target = closest;
                }

                if (this.target) {
                    const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                    let angleDiff = targetAngle - this.angle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    this.angle += angleDiff * Math.min(1, dt * 5.0);
                }

                this.x += Math.cos(this.angle) * this.speed * dt;
                this.y += Math.sin(this.angle) * this.speed * dt;

                // Fire trail
                if (Math.random() < 0.6) {
                    pool.emit(this.x, this.y, 2, '#ff6600', 1.5, 2, 'circle');
                }

                for (const enemy of enemies) {
                    if (enemy.dead) continue;
                    if (dist(this.x, this.y, enemy.x, enemy.y) < enemy.radius + 12) {
                        this.explode(enemies, pool, game);
                        break;
                    }
                }
                break;

            case 'FROST_NOVA':
            case 'BLIZZARD_PULSE':
                if (this.firstFrame) {
                    this.firstFrame = false;
                    for (const enemy of enemies) {
                        if (enemy.dead) continue;
                        if (dist(this.x, this.y, enemy.x, enemy.y) <= this.radius) {
                            enemy.freeze(this.slowDuration || 2.0);
                            enemy.takeDamage(this.damage, this.isCrit, 4, Math.atan2(enemy.y - this.y, enemy.x - this.x), pool, game);
                        }
                    }
                }
                break;
        }
    }

    explode(enemies, pool, game) {
        this.dead = true;
        audio.playExplosion();
        game.triggerScreenShake(this.isEvolved ? 7 : 4, 0.22);
        pool.emit(this.x, this.y, this.isEvolved ? 40 : 22, this.color, 4, 4, 'circle');
        pool.emitRing(this.x, this.y, this.color, this.splashRadius);

        // Leave fire ground decal if meteor
        if (this.isEvolved && game.groundDecals) {
            game.groundDecals.push(new GroundDecal(this.x, this.y, 'FIRE_ZONE', this.splashRadius * 0.7, 3.5));
        }

        for (const enemy of enemies) {
            if (enemy.dead) continue;
            const d = dist(this.x, this.y, enemy.x, enemy.y);
            if (d <= this.splashRadius) {
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.takeDamage(this.damage, this.isCrit, this.knockback, angle, pool, game);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        if (this.type === 'SWORD_SLASH' || this.type === 'EXCALIBUR_SLASH') {
            const swingDir = this.swingDir || 1;
            const arc = this.arcAngle;
            const startAngle = this.angle - (arc / 2) * swingDir;
            const progress = Math.min(1, Math.max(0, this.life / this.maxLife));
            const easeProgress = Math.min(1, 1 - Math.pow(1 - progress, 2.2));
            const currentAngle = startAngle + (arc * swingDir) * easeProgress;
            const trailSpan = Math.min(arc * easeProgress, arc * 0.72);
            const trailStartAngle = currentAngle - trailSpan * swingDir;
            const bladeLen = this.range * 0.95;
            const isExcalibur = this.type === 'EXCALIBUR_SLASH';

            // 1. Draw Crescent Slash Energy Trail (검기 잔상 파동)
            if (progress > 0.02) {
                ctx.save();
                const fadeAlpha = (1 - progress * 0.55);
                ctx.globalAlpha = Math.max(0, fadeAlpha);

                const innerRadius = Math.max(16, this.range * 0.35);
                const outerRadius = this.range;

                // Path for the curved crescent trail
                ctx.beginPath();
                if (swingDir > 0) {
                    ctx.arc(this.x, this.y, outerRadius, trailStartAngle, currentAngle, false);
                    ctx.arc(this.x, this.y, innerRadius, currentAngle, trailStartAngle, true);
                } else {
                    ctx.arc(this.x, this.y, outerRadius, trailStartAngle, currentAngle, true);
                    ctx.arc(this.x, this.y, innerRadius, currentAngle, trailStartAngle, false);
                }
                ctx.closePath();

                // Gradient fill
                const grad = ctx.createRadialGradient(this.x, this.y, innerRadius, this.x, this.y, outerRadius);
                if (isExcalibur) {
                    grad.addColorStop(0, 'rgba(255, 215, 0, 0.05)');
                    grad.addColorStop(0.5, 'rgba(255, 223, 77, 0.5)');
                    grad.addColorStop(0.85, 'rgba(255, 245, 150, 0.85)');
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
                } else {
                    grad.addColorStop(0, 'rgba(0, 242, 255, 0.05)');
                    grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.4)');
                    grad.addColorStop(0.85, 'rgba(125, 211, 252, 0.75)');
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
                }
                ctx.fillStyle = grad;
                ctx.fill();

                // Glowing Sharp Cutting Edge on outer perimeter
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = isExcalibur ? 4.5 : 3;
                ctx.shadowColor = isExcalibur ? '#ffd700' : '#38bdf8';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                if (swingDir > 0) {
                    ctx.arc(this.x, this.y, outerRadius, trailStartAngle, currentAngle, false);
                } else {
                    ctx.arc(this.x, this.y, outerRadius, trailStartAngle, currentAngle, true);
                }
                ctx.stroke();

                // Inner accent line
                ctx.strokeStyle = isExcalibur ? '#f59e0b' : '#0284c7';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                if (swingDir > 0) {
                    ctx.arc(this.x, this.y, outerRadius * 0.93, trailStartAngle, currentAngle, false);
                } else {
                    ctx.arc(this.x, this.y, outerRadius * 0.93, trailStartAngle, currentAngle, true);
                }
                ctx.stroke();

                ctx.restore();
            }

            // 2. Draw The Sword Blade (실제 검 휘두르기 모양: 손잡이, 가드, 검신, 칼날)
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(currentAngle);

            const bladeAlpha = Math.max(0, 1 - Math.pow(progress, 3));
            ctx.globalAlpha = bladeAlpha;

            // Sword Pommel & Grip
            ctx.fillStyle = '#261c14';
            ctx.fillRect(4, -3, 14, 6);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1;
            ctx.strokeRect(4, -3, 14, 6);

            // Pommel
            ctx.fillStyle = isExcalibur ? '#ffe066' : '#d4af37';
            ctx.beginPath();
            ctx.arc(3, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Crossguard
            const guardWidth = isExcalibur ? 34 : 26;
            ctx.fillStyle = isExcalibur ? '#ffd700' : '#d4af37';
            ctx.shadowColor = isExcalibur ? '#ffd700' : '#ffffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(17, -guardWidth / 2);
            ctx.lineTo(22, -guardWidth / 2 + 3);
            ctx.lineTo(21, guardWidth / 2 - 3);
            ctx.lineTo(17, guardWidth / 2);
            ctx.lineTo(19, 0);
            ctx.closePath();
            ctx.fill();

            // Core Gem in Crossguard
            ctx.fillStyle = isExcalibur ? '#00f2ff' : '#dc2626';
            ctx.beginPath();
            ctx.arc(19, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            // Blade Body
            const bladeBaseW = isExcalibur ? 9 : 6;
            const tipX = bladeLen;

            const bladeGrad = ctx.createLinearGradient(19, -bladeBaseW, 19, bladeBaseW);
            if (isExcalibur) {
                bladeGrad.addColorStop(0, '#ffffff');
                bladeGrad.addColorStop(0.3, '#fef08a');
                bladeGrad.addColorStop(0.5, '#ffd700');
                bladeGrad.addColorStop(1, '#b45309');
            } else {
                bladeGrad.addColorStop(0, '#ffffff');
                bladeGrad.addColorStop(0.25, '#f1f5f9');
                bladeGrad.addColorStop(0.5, '#cbd5e1');
                bladeGrad.addColorStop(1, '#475569');
            }

            ctx.fillStyle = bladeGrad;
            ctx.shadowColor = isExcalibur ? '#ffd700' : '#38bdf8';
            ctx.shadowBlur = isExcalibur ? 18 : 10;

            ctx.beginPath();
            ctx.moveTo(21, -bladeBaseW);
            ctx.lineTo(tipX - 14, -bladeBaseW * 0.7);
            ctx.lineTo(tipX, 0); // Razor-sharp tip
            ctx.lineTo(tipX - 14, bladeBaseW * 0.7);
            ctx.lineTo(21, bladeBaseW);
            ctx.closePath();
            ctx.fill();

            // Central Fuller / Blood Groove & Runic Glow
            ctx.strokeStyle = isExcalibur ? '#ffffff' : '#00f2ff';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = isExcalibur ? '#ffffff' : '#00f2ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(23, 0);
            ctx.lineTo(tipX - 16, 0);
            ctx.stroke();

            // Blade Edge Highlight
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(21, -bladeBaseW);
            ctx.lineTo(tipX, 0);
            ctx.stroke();

            // Tip Flash / Star Sparkle
            if (progress < 0.6) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(tipX, 0, isExcalibur ? 4.5 : 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else if (this.type === 'FIREBALL' || this.type === 'METEOR') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.type === 'METEOR' ? 14 : 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff7b2';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.type === 'METEOR' ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'FROST_NOVA' || this.type === 'BLIZZARD_PULSE') {
            const progress = this.life / this.maxLife;
            ctx.globalAlpha = Math.max(0, 1 - progress);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * progress, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Fantasy Monster Ecosystem
class Enemy {
    constructor(x, y, type = 'SLIME', waveMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;
        this.flashTimer = 0;
        this.vx = 0;
        this.vy = 0;
        this.frozenTimer = 0;

        switch (type) {
            case 'SLIME':
                this.name = '맹독 슬라임';
                this.maxHp = Math.round(26 * waveMultiplier);
                this.speed = 120;
                this.radius = 14;
                this.color = '#05ffa1';
                this.damage = 9;
                this.exp = 1;
                this.coinChance = 0.15;
                break;
            case 'MINI_SLIME':
                this.name = '새끼 슬라임';
                this.maxHp = Math.round(12 * waveMultiplier);
                this.speed = 155;
                this.radius = 9;
                this.color = '#00ff88';
                this.damage = 6;
                this.exp = 1;
                this.coinChance = 0.05;
                break;
            case 'GOBLIN':
                this.name = '고블린 도적';
                this.maxHp = Math.round(42 * waveMultiplier);
                this.speed = 185;
                this.radius = 13;
                this.color = '#a3e635';
                this.damage = 14;
                this.exp = 2;
                this.coinChance = 0.35;
                break;
            case 'SKELETON_ARCHER':
                this.name = '해골 저격수';
                this.maxHp = Math.round(38 * waveMultiplier);
                this.speed = 95;
                this.radius = 15;
                this.color = '#e2e8f0';
                this.damage = 15;
                this.exp = 3;
                this.shootCooldown = 2.4;
                this.shootTimer = Math.random() * 1.5;
                this.coinChance = 0.4;
                break;
            case 'NECROMANCER':
                this.name = '심연의 강령술사';
                this.maxHp = Math.round(75 * waveMultiplier);
                this.speed = 90;
                this.radius = 18;
                this.color = '#a855f7';
                this.damage = 12;
                this.exp = 4;
                this.summonTimer = 0;
                this.coinChance = 0.5;
                break;
            case 'WISP':
                this.name = '망령 위스프';
                this.maxHp = Math.round(18 * waveMultiplier);
                this.speed = 170;
                this.radius = 10;
                this.color = '#c084fc';
                this.damage = 11;
                this.exp = 1;
                this.coinChance = 0.1;
                break;
            case 'SHADOW_ASSASSIN':
                this.name = '그림자 암살자';
                this.maxHp = Math.round(95 * waveMultiplier);
                this.speed = 160;
                this.radius = 16;
                this.color = '#6b21a8';
                this.damage = 26;
                this.exp = 5;
                this.teleportCooldown = 4.0;
                this.teleportTimer = 1.0;
                this.coinChance = 0.6;
                break;
            case 'STONE_GOLEM':
                this.name = '고대 바위 골렘';
                this.maxHp = Math.round(320 * waveMultiplier);
                this.speed = 70;
                this.radius = 28;
                this.color = '#78716c';
                this.damage = 30;
                this.exp = 7;
                this.stompTimer = 0;
                this.coinChance = 0.75;
                break;
            case 'FIRE_IMP':
                this.name = '자폭 화염 임프';
                this.maxHp = Math.round(35 * waveMultiplier);
                this.speed = 150;
                this.radius = 13;
                this.color = '#ff4500';
                this.damage = 16;
                this.exp = 2;
                this.detonating = false;
                this.detonateTimer = 0;
                this.coinChance = 0.3;
                break;
            case 'CERBERUS':
                this.name = '지옥 맹견 켈베로스 (보스)';
                this.maxHp = Math.round(1600 * waveMultiplier);
                this.speed = 115;
                this.radius = 40;
                this.color = '#ff2200';
                this.damage = 35;
                this.exp = 60;
                this.isBoss = true;
                this.patternTimer = 0;
                break;
            case 'DEMON_KING':
                this.name = '심연의 마왕 말가루스 (최종 보스)';
                this.maxHp = Math.round(3500 * waveMultiplier);
                this.speed = 95;
                this.radius = 48;
                this.color = '#b91c1c';
                this.damage = 45;
                this.exp = 150;
                this.isBoss = true;
                this.phase = 1;
                this.patternTimer = 0;
                break;
        }

        this.hp = this.maxHp;
    }

    freeze(duration) {
        this.frozenTimer = duration;
    }

    update(dt, player, enemies, pool, game) {
        if (this.dead) return;

        if (this.flashTimer > 0) this.flashTimer -= dt;

        // Frozen effect
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            dt *= 0.3; // 70% slow while frozen
        }

        // Apply knockback decay
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vx *= 0.88;
        this.vy *= 0.88;

        const d = dist(this.x, this.y, player.x, player.y);
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        // Fire Imp countdown detonation
        if (this.detonating) {
            this.detonateTimer += dt;
            this.radius = 13 + (this.detonateTimer / 1.2) * 12; // Swell up
            if (this.detonateTimer >= 1.2) {
                this.dead = true;
                audio.playExplosion();
                game.triggerScreenShake(7, 0.25);
                pool.emit(this.x, this.y, 35, '#ff2200', 5, 4, 'circle');
                pool.emitRing(this.x, this.y, '#ff4500', 70);

                if (dist(this.x, this.y, player.x, player.y) < 70 + player.radius) {
                    player.takeDamage(35, game, pool);
                }
                return;
            }
            return;
        }

        // Specific Monster Behaviors
        if (this.type === 'SKELETON_ARCHER') {
            // Maintains 250px range and shoots arrows
            if (d < 230) {
                this.x -= Math.cos(angle) * this.speed * dt;
                this.y -= Math.sin(angle) * this.speed * dt;
            } else if (d > 300) {
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            }

            this.shootTimer += dt;
            if (this.shootTimer >= this.shootCooldown) {
                this.shootTimer = 0;
                audio.playLaser();
                game.spawnEnemyBullet(this.x, this.y, angle, 200, this.damage);
            }
        } else if (this.type === 'NECROMANCER') {
            this.x += Math.cos(angle + Math.PI / 2) * this.speed * 0.8 * dt;
            this.y += Math.sin(angle + Math.PI / 2) * this.speed * 0.8 * dt;

            this.summonTimer += dt;
            if (this.summonTimer >= 4.0 && enemies.length < 180) {
                this.summonTimer = 0;
                audio.playLightning();
                pool.emitRing(this.x, this.y, '#a855f7', 40);
                enemies.push(new Enemy(this.x + 20, this.y, 'WISP', 1));
                enemies.push(new Enemy(this.x - 20, this.y, 'WISP', 1));
            }
        } else if (this.type === 'SHADOW_ASSASSIN') {
            this.teleportTimer += dt;
            if (this.teleportTimer >= this.teleportCooldown && d < 380) {
                this.teleportTimer = 0;
                // Teleport behind player!
                audio.playDash();
                pool.emit(this.x, this.y, 10, '#6b21a8', 3, 2, 'circle');
                this.x = player.x - Math.cos(player.facingAngle) * 60;
                this.y = player.y - Math.sin(player.facingAngle) * 60;
                pool.emit(this.x, this.y, 14, '#ff0055', 4, 3, 'circle');
                game.damageTexts.push(new DamageText(this.x, this.y - 20, 'AMBUSH!', '#ff0055', true, 16));
            } else {
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            }
        } else if (this.type === 'STONE_GOLEM') {
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            this.stompTimer += dt;
            if (this.stompTimer >= 4.5) {
                this.stompTimer = 0;
                audio.playExplosion();
                game.triggerScreenShake(8, 0.3);
                pool.emitRing(this.x, this.y, '#d97706', 120);
                pool.emit(this.x, this.y, 25, '#78716c', 5, 3, 'circle');

                if (d < 120 + player.radius) {
                    player.takeDamage(28, game, pool);
                    // Knockback player away
                    player.vx += Math.cos(angle) * 350;
                    player.vy += Math.sin(angle) * 350;
                }
            }
        } else if (this.type === 'CERBERUS') {
            // Cerberus Boss: 3-way fire breath & charge
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            this.patternTimer += dt;
            if (this.patternTimer >= 3.2) {
                this.patternTimer = 0;
                audio.playLaser();
                for (let i = -1; i <= 1; i++) {
                    game.spawnEnemyBullet(this.x, this.y, angle + (i * 0.28), 220, 18);
                }
            }
        } else if (this.type === 'DEMON_KING') {
            // Final Boss Demon King Malgarus
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            this.patternTimer += dt;
            if (this.patternTimer >= 2.5) {
                this.patternTimer = 0;
                audio.playLightning();
                game.triggerScreenShake(7, 0.2);

                // Ring of dark orbs
                const count = this.hp < this.maxHp * 0.5 ? 16 : 10;
                for (let i = 0; i < count; i++) {
                    const bAngle = (Math.PI * 2 / count) * i;
                    game.spawnEnemyBullet(this.x, this.y, bAngle, 190, 22);
                }

                // Meteor Decal on player
                if (game.groundDecals) {
                    game.groundDecals.push(new GroundDecal(player.x, player.y, 'FIRE_ZONE', 60, 2.5));
                }
            }
        } else {
            // Default pursue
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
        }

        // Avoid overlapping with other enemies
        for (let i = 0; i < enemies.length; i++) {
            const other = enemies[i];
            if (other === this || other.dead) continue;
            const ed = dist(this.x, this.y, other.x, other.y);
            const minDist = this.radius + other.radius;
            if (ed < minDist && ed > 0.001) {
                const push = (minDist - ed) * 0.15;
                const pushAngle = Math.atan2(this.y - other.y, this.x - other.x);
                this.x += Math.cos(pushAngle) * push;
                this.y += Math.sin(pushAngle) * push;
            }
        }

        // Touch player damage
        if (d < this.radius + player.radius) {
            player.takeDamage(this.damage, game, pool);
        }
    }

    takeDamage(amount, isCrit, knockback, angle, pool, game) {
        if (this.dead) return;

        // Midas glove artifact check: 5% chance to instant gold kill
        if (game && game.player && game.player.artifacts && game.player.artifacts.has('MIDAS_GLOVE')) {
            if (Math.random() < 0.05 && !this.isBoss) {
                this.hp = 0;
                game.spawnDrop(this.x, this.y, 'COIN', 15);
                game.damageTexts.push(new DamageText(this.x, this.y - 20, 'MIDAS GOLD!', '#ffd700', true, 20));
                this.die(pool, game);
                return;
            }
        }

        this.hp -= amount;
        this.flashTimer = 0.1;

        const kb = this.isBoss ? knockback * 0.1 : knockback;
        this.vx += Math.cos(angle) * kb;
        this.vy += Math.sin(angle) * kb;

        game.damageTexts.push(new DamageText(
            this.x, this.y,
            Math.round(amount),
            isCrit ? '#ffd700' : '#ffffff',
            isCrit,
            isCrit ? 19 : 14
        ));

        if (isCrit) {
            audio.playCritHit();
            pool.emit(this.x, this.y, 8, '#ffd700', 4, 3, 'spark');

            // Thunder feather artifact: trigger chain lightning on crit
            if (game && game.player && game.player.artifacts && game.player.artifacts.has('THUNDER_FEATHER')) {
                audio.playLightning();
                pool.emit(this.x, this.y, 10, '#00f2ff', 4, 3, 'spark');
                for (const other of game.enemies) {
                    if (other !== this && !other.dead && dist(this.x, this.y, other.x, other.y) < 180) {
                        other.takeDamage(Math.round(amount * 0.6), false, 4, 0, pool, game);
                    }
                }
            }
        } else {
            audio.playHit();
            pool.emit(this.x, this.y, 4, this.color, 3, 2, 'circle');
        }

        // Lifesteal
        if (game && game.player && game.player.lifestealChance > 0) {
            if (Math.random() < game.player.lifestealChance) {
                game.player.heal(game.player.lifestealAmount, game);
            }
        }

        // Fire imp triggers detonation on lethal hit
        if (this.hp <= 0 && this.type === 'FIRE_IMP' && !this.detonating) {
            this.detonating = true;
            this.detonateTimer = 0;
            return;
        }

        if (this.hp <= 0) {
            this.die(pool, game);
        }
    }

    die(pool, game) {
        this.dead = true;
        audio.playExplosion();
        game.onEnemyKilled(this);

        pool.emit(this.x, this.y, this.isBoss ? 55 : 12, this.color, this.isBoss ? 7 : 4, 3, 'circle');

        // Slime split mechanic
        if (this.type === 'SLIME') {
            game.groundDecals.push(new GroundDecal(this.x, this.y, 'SLIME_PUDDLE', 40, 5.0));
            game.enemies.push(new Enemy(this.x + 12, this.y, 'MINI_SLIME', 1));
            game.enemies.push(new Enemy(this.x - 12, this.y, 'MINI_SLIME', 1));
        }

        // Boss drops
        if (this.isBoss) {
            game.spawnDrop(this.x, this.y, 'CHEST', 1);
            game.spawnDrop(this.x + 20, this.y, 'MAGNET_NUKE', 1);
            for (let i = 0; i < 8; i++) {
                game.spawnDrop(this.x + (Math.random() * 60 - 30), this.y + (Math.random() * 60 - 30), 'COIN', 15);
            }
        } else {
            const expType = this.exp >= 5 ? 'EXP_3' : (this.exp >= 2 ? 'EXP_2' : 'EXP_1');
            game.spawnDrop(this.x, this.y, expType, this.exp);

            const greed = 1 + (game.metaGreedBonus || 0) + (game.player && game.player.artifacts && game.player.artifacts.has('MIDAS_GLOVE') ? 1.0 : 0);
            if (Math.random() < this.coinChance * greed) {
                game.spawnDrop(this.x + 10, this.y, 'COIN', Math.floor(Math.random() * 3 + 1));
            }

            if (Math.random() < 0.02) {
                game.spawnDrop(this.x - 10, this.y, 'HEALTH', 1);
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;

        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.frozenTimer > 0) {
            ctx.fillStyle = '#00f7ff';
        } else if (this.detonating) {
            ctx.fillStyle = Math.floor(Date.now() / 80) % 2 === 0 ? '#ff0000' : '#ffff00';
        } else {
            ctx.fillStyle = this.color;
        }

        if (this.type === 'SLIME' || this.type === 'MINI_SLIME') {
            // Squishy Slime Body
            const squish = Math.sin(Date.now() * 0.008) * 0.15;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * (1 + squish), this.radius * (1 - squish), 0, 0, Math.PI * 2);
            ctx.fill();

            // Slime cute eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.35, this.y - 2, this.radius * 0.22, 0, Math.PI * 2);
            ctx.arc(this.x + this.radius * 0.35, this.y - 2, this.radius * 0.22, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'GOBLIN') {
            // Spiky Goblin
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius, this.y);
            ctx.lineTo(this.x - this.radius - 8, this.y - 6);
            ctx.lineTo(this.x - this.radius + 2, this.y + 4);
            ctx.fill();
            ctx.moveTo(this.x + this.radius, this.y);
            ctx.lineTo(this.x + this.radius + 8, this.y - 6);
            ctx.lineTo(this.x + this.radius - 2, this.y + 4);
            ctx.fill();
        } else if (this.type === 'SKELETON_ARCHER') {
            // Skeleton skull
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // Dark eye sockets
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x - 4, this.y - 2, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 4, this.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'NECROMANCER') {
            // Hooded robes
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x + this.radius, this.y + this.radius);
            ctx.lineTo(this.x - this.radius, this.y + this.radius);
            ctx.closePath();
            ctx.fill();
            // Purple aura
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'SHADOW_ASSASSIN') {
            // Semi-transparent phantom
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'STONE_GOLEM') {
            // Heavy Stone Block
            ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else if (this.type === 'FIRE_IMP') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'CERBERUS' || this.type === 'DEMON_KING') {
            // Grand Boss
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Demonic Horns
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, -Math.PI * 0.7, -Math.PI * 0.3);
            ctx.stroke();
        }

        // Health bar
        if (!this.isBoss && this.hp < this.maxHp) {
            const barW = this.radius * 2;
            const pct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW, 4);
            ctx.fillStyle = '#ff1155';
            ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW * pct, 4);
        }

        ctx.restore();
    }
}

// Enemy Projectiles
class EnemyBullet {
    constructor(x, y, angle, speed, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.radius = 6;
        this.color = '#ff2200';
        this.dead = false;
        this.life = 0;
        this.maxLife = 5;
    }

    update(dt, player, pool, game) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        this.life += dt;
        if (this.life >= this.maxLife) {
            this.dead = true;
            return;
        }

        if (dist(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
            this.dead = true;
            player.takeDamage(this.damage, game, pool);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Player Entity (Hero)
class Player {
    constructor(classKey = 'KNIGHT', metaData = {}) {
        const cls = HERO_CLASSES[classKey] || HERO_CLASSES.KNIGHT;
        this.classKey = classKey;
        this.name = cls.name;
        this.icon = cls.icon;

        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 18;
        this.facingAngle = 0;

        const dmgMeta = metaData.meta_damage ? META_UPGRADES.meta_damage.getValue(metaData.meta_damage) : 1;
        const hpMeta = metaData.meta_hp ? META_UPGRADES.meta_hp.getValue(metaData.meta_hp) : 0;
        const spdMeta = metaData.meta_speed ? META_UPGRADES.meta_speed.getValue(metaData.meta_speed) : 1;
        const critMeta = metaData.meta_crit ? META_UPGRADES.meta_crit.getValue(metaData.meta_crit) : { rate: 0, dmg: 0 };
        const magMeta = metaData.meta_magnet ? META_UPGRADES.meta_magnet.getValue(metaData.meta_magnet) : 1;
        const dashMeta = metaData.meta_dash ? META_UPGRADES.meta_dash.getValue(metaData.meta_dash) : 1;
        const reviveMeta = metaData.meta_revive ? META_UPGRADES.meta_revive.getValue(metaData.meta_revive) : 0;

        this.maxHp = Math.round(cls.stats.maxHp + hpMeta);
        this.hp = this.maxHp;
        this.shield = 40;
        this.maxShield = 40;
        this.shieldRechargeTimer = 0;

        this.baseSpeed = cls.stats.speed * spdMeta;
        this.speed = this.baseSpeed;
        this.isSlowed = false;
        this.slowTimer = 0;

        this.damageMultiplier = cls.stats.damageMultiplier * dmgMeta;
        this.cooldownMultiplier = cls.stats.cooldownMultiplier;
        this.critChance = cls.stats.critChance + critMeta.rate;
        this.critDamage = cls.stats.critDamage + critMeta.dmg;
        this.magnetRadius = 95 * magMeta;
        this.lifestealChance = 0;
        this.lifestealAmount = 5;

        // Dash
        this.dashCooldown = cls.stats.dashCooldown * dashMeta;
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashDuration = 0.18;
        this.dashElapsed = 0;
        this.dashDirX = 1;
        this.dashDirY = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;

        // Ultimate Overdrive: Divine Sanctuary
        this.overdriveEnergy = 0;
        this.maxOverdrive = 100;

        this.revivesRemaining = reviveMeta;

        // Inventory
        this.weapons = {};
        this.passives = {};
        this.artifacts = new Set(); // In-Game Artifacts (HOURGLASS, THUNDER_FEATHER, etc.)

        this.addWeapon(cls.startWeapon);

        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 10;
        this.pendingLevelUps = 0;
        this.totalCoins = 0;
        this.kills = 0;
        this.trails = [];
    }

    addWeapon(weaponId) {
        if (!this.weapons[weaponId]) {
            this.weapons[weaponId] = { level: 1, timer: 0, orbitAngle: 0 };
        } else {
            this.weapons[weaponId].level++;
        }
    }

    evolveWeapon(baseId, evolvedId) {
        delete this.weapons[baseId];
        this.weapons[evolvedId] = { level: 1, timer: 0, orbitAngle: 0 };
    }

    addPassive(passiveId) {
        if (!this.passives[passiveId]) {
            this.passives[passiveId] = 1;
        } else {
            this.passives[passiveId]++;
        }
        this.recalculateStats();
    }

    addArtifact(artifactId) {
        this.artifacts.add(artifactId);
    }

    recalculateStats() {
        let atkMod = 1.0;
        let cdMod = 1.0;
        let spdMod = 1.0;
        let critRateMod = 0;
        let critDmgMod = 0;
        let magMod = 1.0;
        let extraHp = 0;
        let lsMod = 0;

        for (const [id, lvl] of Object.entries(this.passives)) {
            const p = PASSIVE_TYPES[id];
            if (!p) continue;
            switch (id) {
                case 'ATK_BOOST': atkMod += p.valuePerLevel * lvl; break;
                case 'COOLDOWN': cdMod *= Math.pow(1 - p.valuePerLevel, lvl); break;
                case 'SPEED': spdMod += p.valuePerLevel * lvl; break;
                case 'CRIT_BOOST':
                    critRateMod += p.valuePerLevel * lvl;
                    critDmgMod += (p.valuePerLevel * 2.5) * lvl;
                    break;
                case 'MAGNET': magMod += p.valuePerLevel * lvl; break;
                case 'MAX_HP': extraHp += p.valuePerLevel * lvl; break;
                case 'LIFESTEAL': lsMod += p.valuePerLevel * lvl; break;
            }
        }

        this.speed = this.baseSpeed * spdMod;
        this.cooldownMultiplier = Math.max(0.3, cdMod);
        this.critChance = 0.12 + critRateMod;
        this.critDamage = 1.6 + critDmgMod;
        this.magnetRadius = 95 * magMod;
        this.lifestealChance = lsMod;

        const newMaxHp = this.maxHp + extraHp;
        if (newMaxHp > this.maxHp) {
            this.hp += (newMaxHp - this.maxHp);
            this.maxHp = newMaxHp;
        }
    }

    performDash() {
        if (this.dashTimer > 0 || this.isDashing) return false;

        this.isDashing = true;
        this.dashElapsed = 0;
        this.dashTimer = this.dashCooldown;
        this.invulnerable = true;
        this.invulnerableTimer = this.dashDuration + 0.12;

        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            const mag = Math.hypot(this.vx, this.vy);
            this.dashDirX = this.vx / mag;
            this.dashDirY = this.vy / mag;
        } else {
            this.dashDirX = Math.cos(this.facingAngle);
            this.dashDirY = Math.sin(this.facingAngle);
        }

        audio.playDash();
        return true;
    }

    triggerOverdrive(enemies, pool, game) {
        if (this.overdriveEnergy < this.maxOverdrive) return false;

        this.overdriveEnergy = 0;
        audio.playOverdrive();
        game.triggerScreenShake(15, 0.6);

        // Golden Divine Sanctuary Effect
        pool.emitRing(this.x, this.y, '#ffd700', 320);
        pool.emitRing(this.x, this.y, '#ff4500', 480);
        pool.emit(this.x, this.y, 80, '#ffd700', 8, 5, 'spark');

        for (const enemy of enemies) {
            if (enemy.dead) continue;
            const d = dist(this.x, this.y, enemy.x, enemy.y);
            if (d < 750) {
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.takeDamage(260 * this.damageMultiplier, true, 20, angle, pool, game);
            }
        }

        game.damageTexts.push(new DamageText(this.x, this.y - 45, 'DIVINE SANCTUARY!', '#ffd700', true, 28));
        return true;
    }

    update(dt, input, enemies, pool, game) {
        if (this.dashTimer > 0) this.dashTimer -= dt;

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) this.invulnerable = false;
        }

        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) this.isSlowed = false;
        }

        this.shieldRechargeTimer += dt;
        if (this.shieldRechargeTimer >= 3.5 && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + 16 * dt);
        }

        const curSpeed = this.isSlowed ? this.speed * 0.65 : this.speed;

        if (this.isDashing) {
            const dashSpeed = curSpeed * 3.8;
            this.x += this.dashDirX * dashSpeed * dt;
            this.y += this.dashDirY * dashSpeed * dt;
            this.dashElapsed += dt;

            this.trails.push({
                x: this.x,
                y: this.y,
                alpha: 0.7,
                color: '#ffd700'
            });

            if (this.dashElapsed >= this.dashDuration) {
                this.isDashing = false;
            }
        } else {
            let dx = 0;
            let dy = 0;
            if (input.up) dy -= 1;
            if (input.down) dy += 1;
            if (input.left) dx -= 1;
            if (input.right) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx /= len;
                dy /= len;

                this.vx = dx * curSpeed;
                this.vy = dy * curSpeed;
                this.facingAngle = Math.atan2(dy, dx);
            } else {
                this.vx *= 0.8;
                this.vy *= 0.8;
            }

            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        for (let i = this.trails.length - 1; i >= 0; i--) {
            this.trails[i].alpha -= dt * 3.5;
            if (this.trails[i].alpha <= 0) {
                this.trails.splice(i, 1);
            }
        }

        this.updateWeapons(dt, enemies, pool, game);
    }

    updateWeapons(dt, enemies, pool, game) {
        for (const [id, wp] of Object.entries(this.weapons)) {
            const wDef = WEAPON_TYPES[id];
            if (!wDef) continue;

            wp.timer += dt;
            const cd = (wDef.baseCooldown || 1.0) * this.cooldownMultiplier;

            // SHIELD & AEGIS (Orbital Protection)
            if (id === 'SHIELD' || id === 'AEGIS') {
                const rotSpeed = (id === 'AEGIS' ? 4.2 : 2.7) + (wp.level * 0.2);
                wp.orbitAngle += rotSpeed * dt;
                const satCount = (id === 'AEGIS') ? 6 : (1 + wp.level);
                const radius = (id === 'AEGIS') ? 125 : (85 + wp.level * 6);
                const dmg = (wDef.baseDamage * (1 + wp.level * 0.35)) * this.damageMultiplier;

                for (let i = 0; i < satCount; i++) {
                    const angle = wp.orbitAngle + (Math.PI * 2 / satCount) * i;
                    const ox = this.x + Math.cos(angle) * radius;
                    const oy = this.y + Math.sin(angle) * radius;

                    for (const enemy of enemies) {
                        if (enemy.dead) continue;
                        if (dist(ox, oy, enemy.x, enemy.y) < 18 + enemy.radius) {
                            const isCrit = Math.random() < this.critChance;
                            const finalDmg = isCrit ? dmg * this.critDamage : dmg;
                            enemy.takeDamage(finalDmg * dt * 8, isCrit, 4, angle, pool, game);
                        }
                    }
                }
            }

            if (wp.timer >= cd) {
                wp.timer = 0;
                this.fireWeapon(id, wp, enemies, pool, game);
            }
        }
    }

    fireWeapon(id, wp, enemies, pool, game) {
        const wDef = WEAPON_TYPES[id];
        if (!wDef) return;

        let aimAngle = this.facingAngle;
        let closest = null;
        let minD = 480 * 480;
        for (const e of enemies) {
            if (e.dead) continue;
            const d = distSq(this.x, this.y, e.x, e.y);
            if (d < minD) {
                minD = d;
                closest = e;
            }
        }
        if (closest) {
            aimAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
            this.facingAngle = aimAngle;
        }

        const isCrit = Math.random() < this.critChance;
        const dmg = (wDef.baseDamage * (1 + (wp.level - 1) * 0.35)) * this.damageMultiplier * (isCrit ? this.critDamage : 1);

        switch (id) {
            case 'SWORD': {
                audio.playSlash();
                const range = wDef.area + (wp.level * 10);
                this.lastSwordSwingDir = -(this.lastSwordSwingDir || -1);
                game.projectiles.push(new Projectile({
                    type: 'SWORD_SLASH',
                    owner: this,
                    x: this.x,
                    y: this.y,
                    range: range,
                    arcAngle: Math.PI * 0.92,
                    angle: aimAngle,
                    swingDir: this.lastSwordSwingDir,
                    damage: dmg,
                    isCrit: isCrit,
                    knockback: wDef.knockback,
                    color: wDef.color,
                    maxLife: 0.18
                }));
                pool.emit(this.x + Math.cos(aimAngle) * range * 0.5, this.y + Math.sin(aimAngle) * range * 0.5, 6, wDef.color, 3, 2, 'spark');
                break;
            }

            case 'EXCALIBUR': {
                audio.playSlash();
                game.triggerScreenShake(4, 0.15);
                for (let i = -1; i <= 1; i++) {
                    setTimeout(() => {
                        if (this.hp <= 0) return;
                        audio.playSlash();
                        this.lastSwordSwingDir = -(this.lastSwordSwingDir || -1);
                        game.projectiles.push(new Projectile({
                            type: 'EXCALIBUR_SLASH',
                            owner: this,
                            x: this.x,
                            y: this.y,
                            range: 180,
                            arcAngle: Math.PI * 1.35,
                            angle: this.facingAngle + (i * 0.35),
                            swingDir: this.lastSwordSwingDir,
                            damage: dmg,
                            isCrit: true,
                            knockback: 14,
                            color: '#ffd700',
                            maxLife: 0.22
                        }));
                    }, (i + 1) * 70);
                }
                break;
            }

            case 'FIREBALL':
            case 'METEOR': {
                const count = (id === 'METEOR') ? 4 : (1 + Math.floor(wp.level / 2));
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        if (this.hp <= 0) return;
                        audio.playLaser();
                        const spreadAngle = this.facingAngle + (Math.random() - 0.5) * 1.0;
                        game.projectiles.push(new Projectile({
                            type: 'FIREBALL',
                            x: this.x,
                            y: this.y,
                            angle: spreadAngle,
                            speed: 350,
                            damage: dmg,
                            isCrit: isCrit,
                            knockback: 10,
                            splashRadius: (id === 'METEOR') ? 100 : 50,
                            color: wDef.color,
                            isEvolved: (id === 'METEOR'),
                            maxLife: 3.0
                        }));
                    }, i * 65);
                }
                break;
            }

            case 'FROST':
            case 'BLIZZARD': {
                audio.playLightning();
                const rad = (id === 'BLIZZARD') ? 280 : (130 + wp.level * 15);
                game.projectiles.push(new Projectile({
                    type: 'FROST_NOVA',
                    x: this.x,
                    y: this.y,
                    radius: rad,
                    damage: dmg,
                    isCrit: isCrit,
                    slowDuration: (id === 'BLIZZARD') ? 3.5 : 2.0,
                    color: wDef.color,
                    maxLife: 0.3,
                    firstFrame: true
                }));
                pool.emitRing(this.x, this.y, wDef.color, rad);
                break;
            }

            case 'HOLY_LIGHT':
            case 'JUDGEMENT': {
                const count = (id === 'JUDGEMENT') ? 10 : (2 + Math.floor(wp.level / 2));
                const sorted = [...enemies].filter(e => !e.dead).sort((a, b) => distSq(this.x, this.y, a.x, a.y) - distSq(this.x, this.y, b.x, b.y));
                const targets = sorted.slice(0, count);

                if (targets.length > 0) {
                    audio.playLightning();
                    for (const target of targets) {
                        target.takeDamage(dmg, isCrit, 6, 0, pool, game);
                        pool.emit(target.x, target.y, 8, wDef.color, 4, 3, 'spark');
                    }
                }
                break;
            }
        }
    }

    collectItem(item) {
        if (item.type.startsWith('EXP')) {
            audio.playGem();
            this.exp += item.value;
            this.overdriveEnergy = Math.min(this.maxOverdrive, this.overdriveEnergy + item.value * 1.5);

            let leveled = false;
            while (this.exp >= this.expToNextLevel) {
                this.pendingLevelUps++;
                this.level++;
                this.exp -= this.expToNextLevel;
                this.expToNextLevel = Math.round(this.expToNextLevel * 1.35 + 8);
                leveled = true;
            }

            if (leveled && window.gameInstance && window.gameInstance.state === 'PLAYING') {
                audio.playLevelUp();
                window.gameInstance.triggerLevelUpModal();
            }
        } else if (item.type === 'COIN') {
            audio.playGem();
            this.totalCoins += item.value;
        } else if (item.type === 'HEALTH') {
            audio.playLevelUp();
            this.heal(Math.round(this.maxHp * 0.35));
        } else if (item.type === 'MAGNET_NUKE') {
            audio.playCritHit();
            if (window.gameInstance) {
                for (const drop of window.gameInstance.drops) {
                    drop.target = this;
                }
            }
        } else if (item.type === 'CHEST') {
            audio.playLevelUp();
            if (window.gameInstance) {
                window.gameInstance.openChest();
            }
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        if (window.gameInstance) {
            window.gameInstance.damageTexts.push(new DamageText(this.x, this.y - 20, `+${amount} HP`, '#05ffa1', false, 17));
        }
    }

    takeDamage(amount, game, pool) {
        if (this.invulnerable || this.hp <= 0) return;

        this.shieldRechargeTimer = 0;
        let remaining = amount;

        if (this.shield > 0) {
            if (this.shield >= remaining) {
                this.shield -= remaining;
                remaining = 0;
            } else {
                remaining -= this.shield;
                this.shield = 0;
            }
        }

        if (remaining > 0) {
            this.hp -= remaining;
        }

        // Hourglass Artifact check
        if (this.artifacts.has('HOURGLASS') && this.hp <= this.maxHp * 0.3 && !this.hourglassUsed) {
            this.hourglassUsed = true;
            this.invulnerable = true;
            this.invulnerableTimer = 3.5;
            audio.playOverdrive();
            game.triggerScreenShake(8, 0.4);
            game.damageTexts.push(new DamageText(this.x, this.y - 40, 'HOURGLASS TIME WARP!', '#ffd700', true, 22));
        }

        game.damageTexts.push(new DamageText(this.x, this.y, `-${Math.round(amount)}`, '#ff1155', false, 18));
        game.triggerScreenShake(6, 0.2);
        audio.playHit();
        pool.emit(this.x, this.y, 8, '#ff1155', 4, 3, 'circle');

        this.invulnerable = true;
        this.invulnerableTimer = 0.4;

        if (this.hp <= 0) {
            if (this.revivesRemaining > 0) {
                this.revivesRemaining--;
                this.hp = Math.round(this.maxHp * 0.6);
                this.invulnerable = true;
                this.invulnerableTimer = 2.5;
                audio.playLevelUp();
                game.triggerScreenShake(12, 0.45);
                pool.emitRing(this.x, this.y, '#ffd700', 140);
                game.damageTexts.push(new DamageText(this.x, this.y - 30, 'PHOENIX REVIVE!', '#ffd700', true, 25));
            } else {
                game.onPlayerDied();
            }
        }
    }

    draw(ctx) {
        ctx.save();

        for (const tr of this.trails) {
            ctx.save();
            ctx.globalAlpha = tr.alpha * 0.4;
            ctx.fillStyle = tr.color;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, this.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.invulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Magnet Aura
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.magnetRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Holy Shield Barrier
        if (this.shield > 0) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + (this.shield / this.maxShield) * 0.5})`;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Hero Core (Golden Knight Armor with Cape)
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;

        // Flowing Red Cape behind hero
        const capeAngle = this.facingAngle + Math.PI;
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(capeAngle - 0.4) * (this.radius + 12), this.y + Math.sin(capeAngle - 0.4) * (this.radius + 12));
        ctx.lineTo(this.x + Math.cos(capeAngle + 0.4) * (this.radius + 12), this.y + Math.sin(capeAngle + 0.4) * (this.radius + 12));
        ctx.closePath();
        ctx.fill();

        // Hero Armor Body
        ctx.fillStyle = '#1e1b4b'; // Royal deep armor
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Gold Trim
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Radiant Knight Sword in hand
        const handAngle = this.facingAngle + 0.45;
        const handX = this.x + Math.cos(handAngle) * (this.radius + 4);
        const handY = this.y + Math.sin(handAngle) * (this.radius + 4);
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(this.facingAngle + 0.2);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-2, -5, 4, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(2, -3);
        ctx.lineTo(18, 0);
        ctx.lineTo(2, 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Orbital Shields
        const orb = this.weapons.SHIELD || this.weapons.AEGIS;
        if (orb) {
            const isSuper = !!this.weapons.AEGIS;
            const satCount = isSuper ? 6 : (1 + orb.level);
            const rad = isSuper ? 125 : (85 + orb.level * 6);
            const color = isSuper ? '#ffd700' : '#a855f7';

            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = color;

            for (let i = 0; i < satCount; i++) {
                const a = orb.orbitAngle + (Math.PI * 2 / satCount) * i;
                const sx = this.x + Math.cos(a) * rad;
                const sy = this.y + Math.sin(a) * rad;

                ctx.beginPath();
                ctx.arc(sx, sy, isSuper ? 9 : 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}
