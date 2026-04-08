// ============================================
// VISUAL EFFECTS - Smoke particles
// ============================================

export function createSmokeParticles() {
  const container = document.getElementById('smoke-container');
  if (!container) return;

  function spawnParticle() {
    const particle = document.createElement('div');
    particle.className = 'smoke-particle';

    const x = Math.random() * window.innerWidth;
    const size = 10 + Math.random() * 30;
    const duration = 8 + Math.random() * 12;

    particle.style.left = x + 'px';
    particle.style.bottom = '-20px';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.animationDuration = duration + 's';

    container.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }

  // Spawn particles periodically
  setInterval(spawnParticle, 2000);

  // Initial batch
  for (let i = 0; i < 5; i++) {
    setTimeout(spawnParticle, i * 400);
  }
}
