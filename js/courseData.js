(function () {
  "use strict";

  const subjects = window.DEVQUEST_SUBJECTS;
  const courses = window.DEVQUEST_COURSES;
  const featuredSubjectIds = window.DEVQUEST_FEATURED_SUBJECTS || [];
  const { escapeHtml } = window.DevQuestUtils;

  const grids = {
    ADS: document.getElementById("adsCardsGrid"),
    CC: document.getElementById("ccCardsGrid")
  };
  const featuredGrid = document.getElementById("featuredCardsGrid");

  const sharedSubjects = new Set(
    Object.keys(subjects).filter(
      (subjectId) => Object.values(courses).filter((course) => course.subjects.includes(subjectId)).length > 1
    )
  );

  function rgbChannels(hexColor) {
    const color = hexColor.replace("#", "");
    return [0, 2, 4].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)).join(" ");
  }

  function createCard(subjectId, courseId, color, index) {
    const subject = subjects[subjectId];
    const course = courses[courseId];
    const card = document.createElement("a");
    const isShared = sharedSubjects.has(subjectId);
    const otherCourse = courseId === "ADS" ? "CC" : "ADS";

    card.href = `quiz.html?materia=${encodeURIComponent(subjectId)}&curso=${encodeURIComponent(courseId)}`;
    card.className = "card-item group subject-card rounded-[1.75rem] p-6 flex flex-col justify-between";
    card.style.animationDelay = `${index * 65}ms`;
    card.style.setProperty("--card-accent", color);
    card.style.setProperty("--card-accent-rgb", rgbChannels(color));
    card.setAttribute("aria-label", `Abrir ${subject.label} da trilha ${course.fullLabel}`);
    card.innerHTML = `
      <div class="relative z-10">
        <div class="card-topline">
          <span class="subject-icon-shell">
            <i data-lucide="${escapeHtml(subject.icon)}" class="w-7 h-7"></i>
          </span>
          <span class="course-stamp course-stamp--${courseId.toLowerCase()}">${escapeHtml(courseId)}</span>
        </div>

        <h3 class="text-2xl font-black text-zinc-100 mt-5 mb-3 leading-tight">
          ${escapeHtml(subject.label)}
        </h3>
        <p class="text-zinc-400 text-sm leading-relaxed max-w-[34ch]">${escapeHtml(subject.description)}</p>

        ${
          isShared
            ? `<span class="shared-subject-note"><i data-lucide="split" class="w-3.5 h-3.5"></i> Trilha ${escapeHtml(courseId)} · também presente em ${escapeHtml(otherCourse)}</span>`
            : ""
        }
      </div>

      <div class="relative z-10 card-footer">
        <span class="text-xs uppercase tracking-[0.16em] text-zinc-500 font-semibold">Quiz da trilha ${escapeHtml(courseId)}</span>
        <span class="card-arrow" aria-hidden="true">
          <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
        </span>
      </div>
    `;

    return card;
  }

  function validatePalette() {
    const colors = Object.values(courses).flatMap((course) => course.cardColors);

    if (new Set(colors.map((color) => color.toLowerCase())).size !== colors.length) {
      throw new Error("Cada card precisa ter uma cor de destaque exclusiva.");
    }

    Object.values(courses).forEach((course) => {
      if (course.subjects.length !== course.cardColors.length) {
        throw new Error(`A paleta de ${course.label} não corresponde ao total de matérias.`);
      }
    });

    featuredSubjectIds.forEach((subjectId) => {
      if (!subjects[subjectId] || !courses.ADS.subjects.includes(subjectId)) {
        throw new Error(`A matéria em destaque "${subjectId}" não pertence à trilha ADS.`);
      }
    });
  }

  function getCourseColor(courseId, subjectId) {
    const course = courses[courseId];
    return course.cardColors[course.subjects.indexOf(subjectId)];
  }

  function renderCourse(courseId) {
    const course = courses[courseId];
    const grid = grids[courseId];
    const fragment = document.createDocumentFragment();

    if (!course || !grid) return;

    course.subjects.forEach((subjectId, index) => {
      fragment.appendChild(createCard(subjectId, courseId, course.cardColors[index], index));
    });

    grid.replaceChildren(fragment);
  }

  function renderFeatured() {
    if (!featuredGrid) return;

    const fragment = document.createDocumentFragment();
    featuredSubjectIds.forEach((subjectId, index) => {
      fragment.appendChild(createCard(subjectId, "ADS", getCourseColor("ADS", subjectId), index));
    });
    featuredGrid.replaceChildren(fragment);
  }

  validatePalette();
  renderFeatured();
  renderCourse("ADS");
  renderCourse("CC");
  window.lucide?.createIcons();
})();
