(function () {
  "use strict";

  const { escapeHtml } = window.DevQuestUtils;
  const { prepareSession, renderQuestion } = window.DevQuestDecoreba;
  const subjects = window.DEVQUEST_SUBJECTS;
  const courses = window.DEVQUEST_COURSES;
  const palette = { violet: "#b69aff", fuchsia: "#ee9bea", orange: "#ffb779", red: "#ff8f9e", yellow: "#f6db71", green: "#6de4ab", emerald: "#70e8bf", blue: "#85c2ff", lime: "#bde981" };
  const $ = id => document.getElementById(id);
  const state = { entries: [], index: 0, subjectId: null, courseId: null, request: 0, pilot: false, timer: null, generation: 0 };
  let cuesPromise;
  let pilotPromise;
  const pilotSubjects = new Set(["empreendedorismo", "segurancainformacao"]);
  const delayMs = 10000;

  function stopTimer() {
    state.generation++;
    if (state.timer !== null) clearInterval(state.timer);
    state.timer = null;
  }

  function renderCurrent() {
    const entry = state.entries[state.index];
    const activeIndex = document.activeElement?.dataset?.optionIndex;
    $("decoreba-question-area").innerHTML = renderQuestion(entry, state.pilot ? entry.attempt : null);
    if (activeIndex !== undefined) $("decoreba-question-area").querySelector(`[data-option-index="${activeIndex}"]`)?.focus({ preventScroll: true });
  }

  function updateCountdown(remaining) {
    $("decoreba-timer-seconds").textContent = `${String(remaining).padStart(2, "0")}s`;
    $("decoreba-timer-title").textContent = remaining ? "Revelação da dica" : "Dica revelada";
    $("decoreba-timer-help").textContent = remaining ? "Tente lembrar — você já pode responder." : "A palavra-chave está brilhando na alternativa. Marque sua resposta.";
  }

  function beginTimer() {
    stopTimer();
    const entry = state.entries[state.index];
    if (!state.pilot || entry.attempt.selected !== null) return;
    if (entry.attempt.revealed) {
      updateCountdown(0);
      return;
    }
    const generation = state.generation;
    const deadline = Date.now() + delayMs;
    function tick() {
      if (generation !== state.generation) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      updateCountdown(remaining);
      if (!remaining) {
        stopTimer();
        entry.attempt.revealed = true;
        renderCurrent();
      }
    }
    tick();
    state.timer = setInterval(tick, 100);
  }

  function feedback() {
    const entry = state.entries[state.index];
    const answered = state.pilot && entry.attempt.selected !== null;
    $("decoreba-feedback").hidden = !answered;
    if (answered) {
      const correct = window.DevQuestUtils.answersMatch(entry.options[entry.attempt.selected], entry.question.resposta);
      $("decoreba-feedback").textContent = correct
        ? `Acertou! ${entry.attempt.usedHint ? "Com a dica." : "Antes da dica!"} Pode seguir para a próxima questão.`
        : "Não foi dessa vez. A alternativa correta está indicada acima. Leia a associação e tente a próxima.";
    }
    $("decoreba-next").disabled = state.pilot && !answered;
    $("decoreba-timer").hidden = !state.pilot || answered;
  }

  function normalQuizUrl() {
    const params = new URLSearchParams({ materia: state.subjectId });
    if (state.courseId) params.set("curso", state.courseId);
    return `quiz.html?${params}`;
  }

  function renderCatalog() {
    $("decoreba-subjects").innerHTML = Object.entries(courses).map(([courseId, course]) => `
      <section class="decoreba-course"><h2>${escapeHtml(course.fullLabel)}</h2><div class="decoreba-grid">
        ${course.subjects.map(id => {
          const subject = subjects[id];
          return `<a class="decoreba-subject" href="decoreba.html?materia=${encodeURIComponent(id)}&curso=${courseId}" style="--subject-color:${palette[subject.accent] || palette.violet}">
            <i data-lucide="${escapeHtml(subject.icon)}" aria-hidden="true"></i>
            <span><strong>${escapeHtml(subject.label)}</strong><small>${escapeHtml(subject.description)}${pilotSubjects.has(id) ? " · TESTE: DICA EM 10s" : ""}</small></span><span aria-hidden="true">↗</span>
          </a>`;
        }).join("")}
      </div></section>`).join("");
    window.lucide?.createIcons();
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    return response.json();
  }

  function loadCues() {
    if (!cuesPromise) cuesPromise = fetchJson("data/decoreba-cues.json").catch(error => {
      cuesPromise = null;
      throw error;
    });
    return cuesPromise;
  }

  async function startSubject(subjectId, courseId) {
    stopTimer();
    const request = ++state.request;
    const subject = subjects[subjectId];
    if (!subject) return;
    state.subjectId = subjectId;
    state.pilot = pilotSubjects.has(subjectId);
    state.courseId = courses[courseId]?.subjects.includes(subjectId) ? courseId : null;
    document.body.style.setProperty("--subject-color", palette[subject.accent] || palette.violet);
    document.title = `DevQuest - Decoreba · ${subject.label}`;
    $("decoreba-title").textContent = subject.label;
    $("decoreba-subtitle").textContent = state.pilot
      ? "Leia as chaves da pergunta e escolha uma alternativa. Em 10 segundos, a palavra-chave da resposta correta também brilha."
      : "Associe os trechos em destaque. Leia a resposta correta e siga no seu ritmo.";
    $("decoreba-catalog").hidden = true;
    $("decoreba-session").hidden = true;
    $("decoreba-finish").hidden = true;
    $("decoreba-error").hidden = true;
    $("decoreba-loading").hidden = false;
    try {
      if (state.pilot && !pilotPromise) pilotPromise = fetchJson("data/decoreba-pilot.json").catch(error => { pilotPromise = null; throw error; });
      const [bank, metadata, pilotMetadata] = await Promise.all([fetchJson(subject.jsonPath), loadCues(), state.pilot ? pilotPromise : null]);
      if (request !== state.request) return;
      state.entries = prepareSession(bank[subject.jsonKey], metadata.subjects?.[subjectId], state.pilot ? pilotMetadata.subjects[subjectId] : undefined);
      if (state.pilot) state.entries.forEach(entry => { entry.attempt = { selected: null, revealed: false, usedHint: false }; });
      state.index = 0;
      $("decoreba-session").hidden = false;
      for (const link of document.querySelectorAll("[data-normal-quiz]")) link.href = normalQuizUrl();
      $("decoreba-subject-label").textContent = `${state.courseId ? `${state.courseId} · ` : ""}Decoreba`;
      showQuestion(false);
    } catch (error) {
      if (request !== state.request) return;
      console.error("Não foi possível abrir o Decoreba:", error);
      $("decoreba-error").hidden = false;
      $("decoreba-error-message").textContent = location.protocol === "file:"
        ? "Abra o projeto por um servidor local para carregar as questões. Veja o arquivo LEIA-ME-DECOREBA.md."
        : "Não foi possível carregar esta matéria e seus destaques. Tente novamente ou escolha outra matéria.";
    } finally {
      if (request === state.request) $("decoreba-loading").hidden = true;
    }
  }

  function showQuestion(focus = true) {
    stopTimer();
    const total = state.entries.length;
    $("decoreba-counter").textContent = `Questão ${state.index + 1} de ${total}`;
    $("decoreba-progress").value = state.index + 1;
    $("decoreba-progress").max = total;
    renderCurrent();
    feedback();
    beginTimer();
    $("decoreba-previous").disabled = state.index === 0;
    $("decoreba-next").textContent = state.index === total - 1 ? "Concluir revisão ✓" : "Próxima questão →";
    if (focus) {
      $("decoreba-counter").focus({ preventScroll: true });
      $("decoreba-session").scrollIntoView({ block: "start" });
    }
  }

  $("decoreba-question-area").addEventListener("click", event => {
    const button = event.target.closest("[data-option-index]");
    if (!button || !$("decoreba-question-area").contains(button) || !state.pilot) return;
    const entry = state.entries[state.index];
    if (entry.attempt.selected !== null) return;
    const index = Number(button.dataset.optionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= entry.options.length) return;
    stopTimer();
    entry.attempt.selected = index;
    entry.attempt.usedHint = entry.attempt.revealed;
    renderCurrent();
    feedback();
    $("decoreba-next").focus({ preventScroll: true });
  });

  window.addEventListener?.("pagehide", stopTimer);
  window.addEventListener?.("pageshow", event => {
    if (event.persisted && state.entries.length && !$("decoreba-session").hidden) beginTimer();
  });

  $("decoreba-previous").addEventListener("click", () => {
    if (state.index > 0) { state.index--; showQuestion(); }
  });
  $("decoreba-next").addEventListener("click", () => {
    if (!state.entries.length || (state.pilot && state.entries[state.index].attempt.selected === null)) return;
    stopTimer();
    if (state.index + 1 < state.entries.length) { state.index++; showQuestion(); return; }
    $("decoreba-session").hidden = true;
    $("decoreba-finish").hidden = false;
    $("decoreba-finish-detail").textContent = `Você revisou ${state.entries.length} questões de ${subjects[state.subjectId].label}. Agora, experimente responder sem os destaques.`;
    $("decoreba-finish-title").focus();
  });
  $("decoreba-restart").addEventListener("click", () => startSubject(state.subjectId, state.courseId));
  $("decoreba-retry").addEventListener("click", () => startSubject(state.subjectId, state.courseId));

  renderCatalog();
  const params = new URLSearchParams(location.search);
  const subjectId = params.get("materia");
  if (subjectId && Object.hasOwn(subjects, subjectId)) {
    startSubject(subjectId, params.get("curso")?.toUpperCase());
  } else if (subjectId) {
    $("decoreba-subtitle").textContent = "Matéria não encontrada. Escolha uma das matérias abaixo.";
  }
})();
