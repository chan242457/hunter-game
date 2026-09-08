// Hero Slayer: Demon Subjugation - Upgrades, Evolutions & Ancient Artifacts

const WEAPON_TYPES = {
    SWORD: {
        id: 'SWORD',
        name: '용사의 강철 대검',
        desc: '전방의 적들을 호쾌하게 베어가르는 날카로운 검기',
        icon: '🗡️',
        color: '#ffd700',
        maxLevel: 5,
        baseCooldown: 1.0,
        baseDamage: 32,
        area: 100,
        knockback: 8,
        evolutionPair: 'CRIT_BOOST',
        evolvesTo: 'EXCALIBUR',
        levels: [
            { desc: '기본 강철 대검 참격' },
            { desc: '공격력 +35%, 참격 반경 +20%' },
            { desc: '공격 속도 +20%, 2연속 참격' },
            { desc: '공격력 +40%, 강력한 넉백 부여' },
            { desc: '3연속 참격 및 날아가는 황금 검기 파동' }
        ]
    },
    FIREBALL: {
        id: 'FIREBALL',
        name: '비전 화염구',
        desc: '적을 추적하여 착탄 시 폭발하는 마법 화염 구체',
        icon: '🔥',
        color: '#ff4500',
        maxLevel: 5,
        baseCooldown: 1.8,
        baseDamage: 48,
        count: 2,
        splashRadius: 50,
        evolutionPair: 'ATK_BOOST',
        evolvesTo: 'METEOR',
        levels: [
            { desc: '적을 유도하는 2발의 화염구 발사' },
            { desc: '화염구 +1발, 폭발 범위 +25%' },
            { desc: '화염 피해량 +40%, 탄속 증가' },
            { desc: '화염구 +2발 (총 5발 동시 발사)' },
            { desc: '쿨다운 -30%, 폭발 지점에 잔류 화염 생성' }
        ]
    },
    FROST: {
        id: 'FROST',
        name: '서리 노바',
        desc: '주변을 급속 냉각하여 적들을 빙결시키고 이동을 차단',
        icon: '❄️',
        color: '#00e5ff',
        maxLevel: 5,
        baseCooldown: 2.2,
        baseDamage: 25,
        radius: 130,
        slowDuration: 2.0,
        evolutionPair: 'COOLDOWN',
        evolvesTo: 'BLIZZARD',
        levels: [
            { desc: '주변 130px 적들을 빙결 및 40% 감속' },
            { desc: '빙결 반경 +25%, 피해량 +30%' },
            { desc: '쿨다운 -25%, 빙결 시간 2.8초로 증가' },
            { desc: '빙결 반경 +30%, 1.2초 완전 기절 부여' },
            { desc: '2연속 서리 폭발 방출' }
        ]
    },
    HOLY_LIGHT: {
        id: 'HOLY_LIGHT',
        name: '천상의 심판',
        desc: '하늘에서 적들의 머리 위로 내리꽂히는 신성한 빛의 벼락',
        icon: '⚡',
        color: '#fff370',
        maxLevel: 5,
        baseCooldown: 1.5,
        baseDamage: 36,
        count: 3,
        evolutionPair: 'MAGNET',
        evolvesTo: 'JUDGEMENT',
        levels: [
            { desc: '가장 위협적인 적 3명에게 신성 벼락 강타' },
            { desc: '낙뢰 대상 +2명, 피해량 +35%' },
            { desc: '쿨다운 -25%, 낙뢰 지점 연쇄 충격파' },
            { desc: '낙뢰 대상 +3명 (총 8명 강타)' },
            { desc: '동시 2연타 낙뢰 및 마비 기절' }
        ]
    },
    SHIELD: {
        id: 'SHIELD',
        name: '성기사의 수호 방패',
        desc: '용사의 주위를 회전하며 적을 밀쳐내고 원거리 투사체를 방어',
        icon: '🛡️',
        color: '#9966ff',
        maxLevel: 5,
        satellites: 2,
        baseDamage: 22,
        radius: 85,
        speed: 2.7,
        evolutionPair: 'SPEED',
        evolvesTo: 'AEGIS',
        levels: [
            { desc: '2개의 빛나는 방패 공전' },
            { desc: '방패 +1개 (총 3개), 회전 속도 +25%' },
            { desc: '공격력 +40%, 공전 반경 확대' },
            { desc: '방패 +1개 (총 4개), 적 넉백 강화' },
            { desc: '적 원거리 투사체를 완벽 소멸시킴' }
        ]
    },

    // --- AWAKENED LEGENDARY WEAPONS (초월 각성 무기) ---
    EXCALIBUR: {
        id: 'EXCALIBUR',
        isEvolved: true,
        name: '★ 성검 엑스칼리버 (Excalibur)',
        desc: '빛의 성검이 화면 전체를 가르며 신성한 황금빛 검기 폭풍을 소환',
        icon: '✨',
        color: '#ffd700',
        maxLevel: 1,
        baseCooldown: 0.7,
        baseDamage: 90,
        area: 170
    },
    METEOR: {
        id: 'METEOR',
        isEvolved: true,
        name: '★ 지옥불 메테오 (Hellfire Meteor)',
        desc: '하늘에서 초거대 묵시록 운석이 낙하하여 전장을 불바다로 초토화',
        icon: '☄️',
        color: '#ff2200',
        maxLevel: 1,
        baseCooldown: 1.3,
        baseDamage: 140,
        splashRadius: 100
    },
    BLIZZARD: {
        id: 'BLIZZARD',
        isEvolved: true,
        name: '★ 절대영도 블리자드 (Absolute Zero)',
        desc: '화면 전역의 대기가 얼어붙으며 모든 적을 산산조각 냄',
        icon: '🧊',
        color: '#00f7ff',
        maxLevel: 1,
        baseCooldown: 1.0,
        baseDamage: 75,
        radius: 280
    },
    JUDGEMENT: {
        id: 'JUDGEMENT',
        isEvolved: true,
        name: '★ 신벌의 낙뢰 (Wrath of God)',
        desc: '신성한 천벌의 벼락이 전 화면에 소나기처럼 쏟아져 악을 멸함',
        icon: '⚡',
        color: '#ffff33',
        maxLevel: 1,
        baseCooldown: 0.6,
        baseDamage: 80,
        count: 12
    },
    AEGIS: {
        id: 'AEGIS',
        isEvolved: true,
        name: '★ 이지스의 성벽 (Aegis Bastion)',
        desc: '6개의 거대한 천상 방패가 회전하며 다가오는 모든 적을 분쇄하고 보호막을 지속 충전',
        icon: '🛡️',
        color: '#b366ff',
        maxLevel: 1,
        satellites: 6,
        baseDamage: 65,
        radius: 125
    }
};

const PASSIVE_TYPES = {
    ATK_BOOST: {
        id: 'ATK_BOOST',
        name: '거인의 완력',
        desc: '모든 공격력과 마법 피해를 증폭',
        icon: '💪',
        color: '#ff3333',
        maxLevel: 5,
        valuePerLevel: 0.20,
        levels: ['공격력 +20%', '공격력 +40%', '공격력 +60%', '공격력 +80%', '공격력 +100% (2배!)']
    },
    CRIT_BOOST: {
        id: 'CRIT_BOOST',
        name: '매의 눈',
        desc: '치명타 확률과 치명타 피해량 대폭 증가',
        icon: '🎯',
        color: '#ff0055',
        maxLevel: 5,
        valuePerLevel: 0.08,
        levels: ['크리티컬 +8%, 치명피해 +20%', '크리티컬 +16%, 치명피해 +40%', '크리티컬 +24%, 치명피해 +60%', '크리티컬 +32%, 치명피해 +80%', '크리티컬 +40%, 치명피해 +100%']
    },
    COOLDOWN: {
        id: 'COOLDOWN',
        name: '마나 순환석',
        desc: '모든 무기와 마법의 재사용 대기시간 단축',
        icon: '🔮',
        color: '#00ddff',
        maxLevel: 5,
        valuePerLevel: 0.09,
        levels: ['쿨다운 -9%', '쿨다운 -18%', '쿨다운 -27%', '쿨다운 -36%', '쿨다운 -45% (초고속 연사)']
    },
    SPEED: {
        id: 'SPEED',
        name: '질풍의 장화',
        desc: '이동속도 증가 및 회피 대시 거리 확장',
        icon: '👢',
        color: '#00ff88',
        maxLevel: 5,
        valuePerLevel: 0.12,
        levels: ['이동속도 +12%', '이동속도 +24%', '이동속도 +36%', '이동속도 +48%', '이동속도 +60%']
    },
    MAGNET: {
        id: 'MAGNET',
        name: '마력 자석석',
        desc: '마력 젬과 금화 흡수 범위를 비약적으로 확대',
        icon: '🧲',
        color: '#ffaa00',
        maxLevel: 5,
        valuePerLevel: 0.40,
        levels: ['자석 범위 +40%', '자석 범위 +80%', '자석 범위 +120%', '자석 범위 +160%', '화면 전체 흡수급 광역 자석']
    },
    MAX_HP: {
        id: 'MAX_HP',
        name: '용의 심장',
        desc: '최대 체력을 대폭 늘리고 즉시 체력 회복',
        icon: '❤️',
        color: '#ff1155',
        maxLevel: 5,
        valuePerLevel: 35,
        levels: ['최대 체력 +35 & 회복', '최대 체력 +70 & 회복', '최대 체력 +105 & 회복', '최대 체력 +140 & 회복', '최대 체력 +175 & 완전 회복']
    },
    LIFESTEAL: {
        id: 'LIFESTEAL',
        name: '흡혈귀의 송곳니',
        desc: '적 타격 시 생명력을 흡수하여 상처를 치유',
        icon: '🩸',
        color: '#cc0033',
        maxLevel: 5,
        valuePerLevel: 0.035,
        levels: ['타격 시 3.5% 확률로 5 HP 회복', '타격 시 7% 확률로 6 HP 회복', '타격 시 10.5% 확률로 7 HP 회복', '타격 시 14% 확률로 8 HP 회복', '타격 시 17.5% 확률로 10 HP 회복']
    }
};

// In-Game Artifacts dropped from Bosses & Treasure Chests
const ANCIENT_ARTIFACTS = {
    HOURGLASS: {
        id: 'HOURGLASS',
        name: '시간의 모래시계',
        desc: '체력이 30% 이하가 되면 3.5초간 모든 적이 80% 느려지며 무적 발동',
        icon: '⏳',
        color: '#ffd700'
    },
    THUNDER_FEATHER: {
        id: 'THUNDER_FEATHER',
        name: '뇌신의 황금 깃털',
        desc: '크리티컬 타격 시 100% 확률로 주위 적들에게 벼락 연쇄 강타',
        icon: '🪶',
        color: '#00f2ff'
    },
    VAMPIRE_CHALICE: {
        id: 'VAMPIRE_CHALICE',
        name: '영원의 피 성배',
        desc: '적을 40마리 처치할 때마다 최대 체력이 영구적으로 +4 증가',
        icon: '🍷',
        color: '#ff0055'
    },
    MIDAS_GLOVE: {
        id: 'MIDAS_GLOVE',
        name: '미다스의 건틀릿',
        desc: '골드 획득량이 2배로 증가하고 피격된 적이 5% 확률로 황금 석화 즉사',
        icon: '🧤',
        color: '#ffaa00'
    }
};

// Hero Classes
const HERO_CLASSES = {
    KNIGHT: {
        id: 'KNIGHT',
        name: '성기사 용사',
        title: '빛의 인도자',
        desc: '단단한 성기사 갑옷과 용사의 대검으로 전선을 돌파하는 정통 용사',
        icon: '🛡️',
        avatarImg: 'assets/hero.jpg',
        unlockedByDefault: true,
        cost: 0,
        startWeapon: 'SWORD',
        stats: {
            maxHp: 120,
            speed: 225,
            damageMultiplier: 1.15,
            cooldownMultiplier: 0.95,
            critChance: 0.12,
            critDamage: 1.6,
            dashCooldown: 2.2
        }
    },
    MAGE: {
        id: 'MAGE',
        name: '아케인 대마법사',
        title: '원소의 지배자',
        desc: '광범위 화염구와 짧은 쿨다운으로 전장을 불태우는 원거리 마법사',
        icon: '🧙‍♂️',
        avatarImg: 'assets/hero.jpg',
        unlockedByDefault: false,
        cost: 400,
        startWeapon: 'FIREBALL',
        stats: {
            maxHp: 85,
            speed: 215,
            damageMultiplier: 1.3,
            cooldownMultiplier: 0.82,
            critChance: 0.08,
            critDamage: 1.5,
            dashCooldown: 2.6
        }
    },
    BERSERKER: {
        id: 'BERSERKER',
        name: '불굴의 광전사',
        title: '피의 투사',
        desc: '압도적인 생명력과 서리 결계로 적진 한가운데서 날뛰는 파괴자',
        icon: '⚔️',
        avatarImg: 'assets/hero.jpg',
        unlockedByDefault: false,
        cost: 1000,
        startWeapon: 'FROST',
        stats: {
            maxHp: 170,
            speed: 200,
            damageMultiplier: 1.25,
            cooldownMultiplier: 1.05,
            critChance: 0.15,
            critDamage: 1.7,
            dashCooldown: 2.8
        }
    }
};

// Permanent Meta Upgrades (신전의 기도 / 영구 성장)
const META_UPGRADES = {
    meta_damage: {
        id: 'meta_damage',
        name: '용사의 기운 (공격력)',
        desc: '모든 공격과 마법 피해를 영구적으로 증폭시킵니다.',
        icon: '⚔️',
        maxLevel: 10,
        baseCost: 50,
        costScale: 1.45,
        perLevel: '+8% 공격력',
        getValue: (lvl) => 1 + lvl * 0.08
    },
    meta_hp: {
        id: 'meta_hp',
        name: '신성한 생명력 (체력)',
        desc: '기본 최대 체력을 영구적으로 증대시킵니다.',
        icon: '❤️',
        maxLevel: 10,
        baseCost: 40,
        costScale: 1.4,
        perLevel: '+20 최대 HP',
        getValue: (lvl) => lvl * 20
    },
    meta_speed: {
        id: 'meta_speed',
        name: '바람의 가호 (이동속도)',
        desc: '용사의 기본 기동성과 대시 거리를 향상시킵니다.',
        icon: '👟',
        maxLevel: 6,
        baseCost: 60,
        costScale: 1.5,
        perLevel: '+6% 이동속도',
        getValue: (lvl) => 1 + lvl * 0.06
    },
    meta_crit: {
        id: 'meta_crit',
        name: '심안의 직관 (치명타)',
        desc: '치명타 확률과 치명타 시 입히는 피해량을 강화합니다.',
        icon: '🎯',
        maxLevel: 8,
        baseCost: 75,
        costScale: 1.5,
        perLevel: '+4% 치명타율, +10% 치명피해',
        getValue: (lvl) => ({ rate: lvl * 0.04, dmg: lvl * 0.10 })
    },
    meta_magnet: {
        id: 'meta_magnet',
        name: '영혼의 나침반 (자석 범위)',
        desc: '필드에 드랍된 마력 젬과 금화의 흡수 범위를 넓힙니다.',
        icon: '🧲',
        maxLevel: 6,
        baseCost: 45,
        costScale: 1.45,
        perLevel: '+25% 자석 범위',
        getValue: (lvl) => 1 + lvl * 0.25
    },
    meta_dash: {
        id: 'meta_dash',
        name: '질주의 룬 (대시 쿨타임)',
        desc: '순간 회피 대시의 쿨타임을 단축시킵니다.',
        icon: '🌀',
        maxLevel: 5,
        baseCost: 100,
        costScale: 1.6,
        perLevel: '대시 쿨 -12%',
        getValue: (lvl) => 1 - lvl * 0.12
    },
    meta_greed: {
        id: 'meta_greed',
        name: '풍요의 축복 (골드/EXP)',
        desc: '전투 중 획득하는 금화와 경험치량을 증가시킵니다.',
        icon: '💰',
        maxLevel: 8,
        baseCost: 80,
        costScale: 1.5,
        perLevel: '+12% 코인/경험치 보너스',
        getValue: (lvl) => 1 + lvl * 0.12
    },
    meta_revive: {
        id: 'meta_revive',
        name: '불사조의 깃털 (부활)',
        desc: '치명상을 입었을 때 60% 생명력으로 즉시 부활합니다.',
        icon: '✨',
        maxLevel: 2,
        baseCost: 450,
        costScale: 3.0,
        perLevel: '부활 횟수 +1회',
        getValue: (lvl) => lvl
    }
};

function getMetaUpgradeCost(upgradeKey, currentLevel) {
    const upg = META_UPGRADES[upgradeKey];
    if (!upg || currentLevel >= upg.maxLevel) return null;
    return Math.floor(upg.baseCost * Math.pow(upg.costScale, currentLevel));
}
