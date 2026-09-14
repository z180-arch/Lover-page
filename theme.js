// Update CSS variables from configuration
function applyTheme() {
    const config = window.VALENTINE_CONFIG;
    const root = document.documentElement;

    // Apply colors
    root.style.setProperty('--background-color-1', config.colors.backgroundStart);
    root.style.setProperty('--background-color-2', config.colors.backgroundEnd);
    root.style.setProperty('--button-color', config.colors.buttonBackground);
    root.style.setProperty('--button-hover', config.colors.buttonHover);
    root.style.setProperty('--text-color', config.colors.textColor);

    // Apply animation settings
    root.style.setProperty('--float-duration', config.animations.floatDuration);
    root.style.setProperty('--float-distance', config.animations.floatDistance);
    root.style.setProperty('--bounce-speed', config.animations.bounceSpeed);
    root.style.setProperty('--heart-explosion-size', config.animations.heartExplosionSize);

    // Theme Schema：字体（留空 = 内置系统衬线栈）
    const fonts = config.theme && config.theme.fonts;
    if (fonts && fonts.body) root.style.setProperty('--font-body', fonts.body);
    if (fonts && fonts.outlier) root.style.setProperty('--font-outlier', fonts.outlier);
}

// Apply theme when the page loads
window.addEventListener('DOMContentLoaded', applyTheme); 