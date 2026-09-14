/**
 * Lightweight App State Management
 * （母版原有状态管理，完整保留；仅增加首页大标题 h1 的显隐）
 */

window.appState = {
    currentStep: 1, // 1~7, or 'celebration'
    isMusicPlaying: false,
    loveValue: 100,

    // Listeners for state changes
    listeners: [],

    subscribe(callback) {
        this.listeners.push(callback);
    },

    setState(newState) {
        const oldState = { ...this };
        Object.assign(this, newState);

        // Notify listeners of the change
        this.listeners.forEach(callback => callback(this, oldState));
    }
};

// UI Reaction logic
window.appState.subscribe((state, oldState) => {
    // Handle step changes
    if (state.currentStep !== oldState.currentStep) {
        document.querySelectorAll('.question-section, .celebration').forEach(el => el.classList.add('hidden'));

        if (state.currentStep === 'celebration') {
            document.getElementById('celebration').classList.remove('hidden');
        } else {
            document.getElementById(`question${state.currentStep}`).classList.remove('hidden');
        }

        // 首页（step 1）显示大标题 h1，其余步骤隐藏，避免与各步骤小标题重复
        const bigTitle = document.getElementById('valentineTitle');
        if (bigTitle) {
            bigTitle.classList.toggle('hidden', state.currentStep !== 1);
        }
    }

    // Handle music state
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
        const config = window.VALENTINE_CONFIG;
        musicToggle.textContent = state.isMusicPlaying ? config.music.stopText : config.music.startText;
    }
});
