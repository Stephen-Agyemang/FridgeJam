/* FridgeJam Web Audio kitchen sound effects */

// --- Sound Effects Synthesizer using Web Audio API ---
class KitchenSynth {
    constructor() {
        this.ctx = null;
        this.disabled = false;
    }

    init() {
        if (this.disabled) return false;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                this.disabled = true;
                return false;
            }

            try {
                this.ctx = new AudioCtx();
            } catch (err) {
                this.disabled = true;
                console.warn('[FridgeJam] Kitchen sound effects unavailable:', err);
                return false;
            }
        }
        return true;
    }

    // Deep retro stove dial click sound
    playDialClick() {
        if (!this.init()) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }

    // Synthesized gas ignition and sizzle (using white noise)
    playStoveSizzle() {
        if (!this.init()) return;
        const ctx = this.ctx;
        
        // Generate white noise buffer
        const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Custom filter to shape the sizzle sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(4500, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 2.0);
        
        // Gain envelope for smooth sizzle fade-in & fade-out
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3); // ignition blast
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.0); // steady simmer
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 2.4);  // fade out
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start();
        noise.stop(ctx.currentTime + 2.5);
    }

    // High-end crystal dinner bell chime when food is plated
    playDinnerBell() {
        if (!this.init()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        
        // Dual oscillator chime for rich bell harmonics
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5 note
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, now); // E6 harmonic
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
    }

    // Cute slide tone for opening Recipe Box
    playDrawerSlide() {
        if (!this.init()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now); // E4
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25); // A4
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(now + 0.36);
    }
}

const synth = new KitchenSynth();
