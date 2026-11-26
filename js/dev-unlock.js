(() => {
  "use strict";
  const cat = document.getElementById("cat-button");
  if (!cat) return;
  let count = 0, last = 0;
  document.addEventListener("click", event => {
    if (!cat.contains(event.target)) count = 0;
  });
  cat.addEventListener("click", () => {
    const now = performance.now();
    if (now - last > 10000) count = 0;
    last = now;
    if (++count === 7) {
      count = 0;
      window.location.href = "dev.html";
    }
  });
})();