(function () {
  "use strict";

  const button = document.getElementById("cat-button");
  const bubble = document.getElementById("cat-bubble");
  const mascot = document.getElementById("cat-svg");
  let animationTimer;

  if (!button || !bubble || !mascot) return;

  function playRandomMeow() {
    const sounds = [1, 2, 3, 4, 5]
      .map((number) => document.getElementById(`meow${number}`))
      .filter(Boolean);

    if (sounds.length === 0) return;

    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    sound.currentTime = 0;
    sound.play().catch(() => {
      // Alguns navegadores bloqueiam áudio automático; o mascote continua animando.
    });
  }

  function animateMascot() {
    window.clearTimeout(animationTimer);
    bubble.classList.remove("opacity-0", "scale-90", "translate-y-2");
    bubble.classList.add("opacity-100", "scale-100", "translate-y-0");
    mascot.classList.add("translate-y-2");

    animationTimer = window.setTimeout(() => {
      bubble.classList.remove("opacity-100", "scale-100", "translate-y-0");
      bubble.classList.add("opacity-0", "scale-90", "translate-y-2");
      mascot.classList.remove("translate-y-2");
    }, 1000);
  }

  button.addEventListener("click", () => {
    playRandomMeow();
    animateMascot();
  });
})();
