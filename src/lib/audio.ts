// Audio utility to generate success sounds using Web Audio API
// This avoids needing an external sound file

export function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create oscillators for a pleasant "ding" sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Connect nodes
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set frequencies for a major chord feel
        oscillator1.frequency.value = 523.25; // C5
        oscillator2.frequency.value = 659.25; // E5

        oscillator1.type = 'sine';
        oscillator2.type = 'sine';

        // Set up envelope
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        // Start and stop
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.5);
        oscillator2.stop(now + 0.5);

        // Second beep (higher)
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.value = 783.99; // G5
            osc.type = 'sine';

            const t = audioContext.currentTime;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.start(t);
            osc.stop(t + 0.4);
        }, 150);

    } catch (error) {
        console.log('Audio not supported:', error);
    }
}

export function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 200;
        oscillator.type = 'square';

        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    } catch (error) {
        console.log('Audio not supported:', error);
    }
}
