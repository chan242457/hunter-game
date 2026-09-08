// Hero Slayer: Demon Subjugation - Epic Fantasy Web Audio Engine

class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.tempo = 120;
        this.masterVolume = 0.4;
        this.sfxVolume = 0.5;
        this.bgmVolume = 0.22;

        this.notes = {
            'D2': 73.42, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'C3': 130.81,
            'D3': 146.83, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'C4': 261.63,
            'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'A5': 880.00
        };

        // Epic heroic battle bassline (D minor)
        this.bassSeq = ['D2', 'D2', 'F2', 'D2', 'G2', 'D2', 'A2', 'F2', 'D2', 'D2', 'Bb2', 'A2', 'G2', 'F2', 'E2', 'F2'];
        // Heroic melody arpeggio
        this.arpSeq = ['D4', 'F4', 'A4', 'D5', 'F4', 'A4', 'C5', 'A4', 'G4', 'Bb4', 'D5', 'F5', 'A4', 'F4', 'E4', 'A4'];
    }

    init() {
        try {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        } catch (e) {}
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    startBGM() {
        if (this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;
        this.bgmStep = 0;

        const stepTime = (60 / this.tempo) / 4;

        this.bgmTimer = setInterval(() => {
            if (!this.isMuted && this.ctx) {
                try {
                    this.playBGMStep(this.bgmStep);
                } catch (e) {}
            }
            this.bgmStep = (this.bgmStep + 1) % 16;
        }, stepTime * 1000);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    playBGMStep(step) {
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;

            // Orchestral Bass Cello
            const bassNote = this.bassSeq[step];
            if (bassNote && this.notes[bassNote]) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(this.notes[bassNote], now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(320, now);
                filter.frequency.exponentialRampToValueAtTime(110, now + 0.16);

                gain.gain.setValueAtTime(this.bgmVolume * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.17);
            }

            // Flute/String Melody Lead
            const arpNote = this.arpSeq[step];
            if (arpNote && this.notes[arpNote]) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(this.notes[arpNote], now);

                gain.gain.setValueAtTime(this.bgmVolume * 0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.14);
            }

            // War Drum Kick
            if (step % 4 === 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.setValueAtTime(110, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.14);
                gain.gain.setValueAtTime(this.bgmVolume * 0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {}
    }

    // --- SOUND EFFECTS ---

    playSlash() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            // Metal Sword Slash
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(680, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

            gain.gain.setValueAtTime(this.sfxVolume * 0.42, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    }

    playLaser() {
        // Fireball whoosh
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);

            gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.14);
        } catch (e) {}
    }

    playLightning() {
        // Divine Thunder Smite
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.setValueAtTime(220, now + 0.04);
            osc.frequency.setValueAtTime(750, now + 0.08);

            gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    playHit() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(170, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

            gain.gain.setValueAtTime(this.sfxVolume * 0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.07);
        } catch (e) {}
    }

    playCritHit() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

            gain.gain.setValueAtTime(this.sfxVolume * 0.65, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.16);
        } catch (e) {}
    }

    playExplosion() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.38);

            gain.gain.setValueAtTime(this.sfxVolume * 0.75, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.38);
        } catch (e) {}
    }

    playGem() {
        // Mana Chime
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const freqs = [783.99, 880.00, 1046.5, 1318.51];
            const f = freqs[Math.floor(Math.random() * freqs.length)];

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 1.4, now + 0.08);

            gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    playDash() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

            gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    }

    playLevelUp() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [440, 554.37, 659.25, 880, 1108.7]; // A major fanfare
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0.001, now + idx * 0.08);
                gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + idx * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.25);
            });
        } catch (e) {}
    }

    playOverdrive() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.45);

            gain.gain.setValueAtTime(this.sfxVolume * 0.75, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);

            setTimeout(() => this.playExplosion(), 350);
        } catch (e) {}
    }

    playBossAlert() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(500, now + i * 0.25);
                osc.frequency.linearRampToValueAtTime(350, now + i * 0.25 + 0.18);

                gain.gain.setValueAtTime(this.sfxVolume * 0.55, now + i * 0.25);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.25);
                osc.stop(now + i * 0.25 + 0.2);
            }
        } catch (e) {}
    }

    playClick() {
        if (this.isMuted) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(750, now);
            osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
            gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {}
    }
}

const audio = new SoundManager();
