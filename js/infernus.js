(function () {
  "use strict";

  const subjects = window.DEVQUEST_SUBJECTS;
  const subjectIds = window.DEVQUEST_INFERNUS_SUBJECTS;
  const { answersMatch, escapeHtml, getOptionContent, isCodeOption, shuffle } = window.DevQuestUtils;

  const elements = {
    setupScreen: document.getElementById("setup-screen"),
    subjectSelection: document.getElementById("subject-selection"),
    selectedCount: document.getElementById("selected-count"),
    setupError: document.getElementById("setup-error"),
    startButton: document.getElementById("start-infernus"),
    clearButton: document.getElementById("clear-selection"),
    statsBar: document.getElementById("stats-bar"),
    hitsCount: document.getElementById("hits-count"),
    errorsCount: document.getElementById("errors-count"),
    selectedSubjectsLabel: document.getElementById("selected-subjects-label"),
    loading: document.getElementById("loading"),
    quizContainer: document.getElementById("quiz-container"),
    questionArea: document.getElementById("question-area"),
    nextButton: document.getElementById("next-btn"),
    finalScreen: document.getElementById("final-screen"),
    finalTitle: document.getElementById("final-title"),
    scoreText: document.getElementById("score-text"),
    restartButton: document.getElementById("restart-infernus"),
    mainWrapper: document.getElementById("main-wrapper"),
    pantherButton: document.getElementById("panther-button"),
    pantherBubble: document.getElementById("panther-bubble"),
    pantherSvg: document.getElementById("panther-svg")
  };

  const state = {
    selectedSubjects: new Set(),
    questions: [],
    currentIndex: 0,
    score: 0,
    errors: 0,
    locked: false
  };

  let pantherTimer;

  function refreshIcons() {
    window.lucide?.createIcons();
  }

  function highlightCode() {
    window.hljs?.highlightAll();
  }

  function renderSubjectCards() {
    const fragment = document.createDocumentFragment();

    subjectIds.forEach((subjectId) => {
      const subject = subjects[subjectId];
      const button = document.createElement("button");

      button.type = "button";
      button.dataset.subject = subjectId;
      button.setAttribute("aria-pressed", "false");
      button.className =
        "subject-select-card text-left rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5";
      button.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <span class="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <i data-lucide="${escapeHtml(subject.icon)}" class="dead-icon w-6 h-6"></i>
          </span>
          <h3 class="text-white font-bold text-lg leading-tight">${escapeHtml(subject.label)}</h3>
        </div>
        <p class="text-zinc-400 text-sm leading-relaxed">${escapeHtml(subject.description)}</p>
      `;
      button.addEventListener("click", () => toggleSubject(subjectId, button));
      fragment.appendChild(button);
    });

    elements.subjectSelection.replaceChildren(fragment);
    refreshIcons();
  }

  function toggleSubject(subjectId, button) {
    const selected = state.selectedSubjects.has(subjectId);

    if (selected) {
      state.selectedSubjects.delete(subjectId);
    } else {
      state.selectedSubjects.add(subjectId);
    }

    button.classList.toggle("selected", !selected);
    button.setAttribute("aria-pressed", String(!selected));
    elements.setupError.classList.add("hidden");
    updateSelectedCount();
  }

  function updateSelectedCount() {
    elements.selectedCount.textContent = state.selectedSubjects.size;
  }

  function clearSelection() {
    state.selectedSubjects.clear();
    elements.subjectSelection.querySelectorAll("button").forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
    elements.setupError.classList.add("hidden");
    updateSelectedCount();
  }

  function extractQuestions(data, subject) {
    const questions = data?.[subject.jsonKey];
    if (!Array.isArray(questions)) {
      throw new Error(`Chave inválida em ${subject.jsonPath}: ${subject.jsonKey}`);
    }
    return questions;
  }

  function isValidQuestion(question) {
    return (
      question &&
      question.tipo !== "discursiva" &&
      Array.isArray(question.opcoes) &&
      question.opcoes.length >= 2 &&
      typeof question.resposta === "string"
    );
  }

  async function loadSelectedQuestions() {
    const groups = await Promise.all(
      [...state.selectedSubjects].map(async (subjectId) => {
        const subject = subjects[subjectId];
        const response = await fetch(subject.jsonPath);

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status} ao carregar ${subject.jsonPath}`);
        }

        const data = await response.json();
        const questions = extractQuestions(data, subject);

        if (questions.some((question) => !isValidQuestion(question))) {
          throw new Error(`Há questões inválidas em ${subject.jsonPath}.`);
        }

        return questions.map((question) => ({
          ...question,
          materia: subject.label
        }));
      })
    );

    return shuffle(groups.flat());
  }

  async function startInfernus() {
    if (state.selectedSubjects.size < 2) {
      elements.setupError.classList.remove("hidden");
      return;
    }

    elements.setupScreen.classList.add("hidden");
    elements.loading.classList.remove("hidden");

    try {
      state.questions = await loadSelectedQuestions();
      state.currentIndex = 0;
      state.score = 0;
      state.errors = 0;
      state.locked = false;

      if (state.questions.length === 0) throw new Error("Nenhuma questão encontrada.");

      elements.loading.classList.add("hidden");
      elements.quizContainer.classList.remove("hidden");
      elements.statsBar.classList.remove("hidden");
      elements.selectedSubjectsLabel.textContent = [...state.selectedSubjects]
        .map((subjectId) => subjects[subjectId].label)
        .join(", ");

      updateCounters();
      showQuestion();
    } catch (error) {
      console.error(error);
      elements.loading.textContent = "Não foi possível carregar as matérias selecionadas.";
    }
  }

  function updateCounters() {
    elements.hitsCount.textContent = state.score;
    elements.errorsCount.textContent = state.errors;
  }

  function renderQuestionHeader(question) {
    const title = question.titulo
      ? `<h2 id="current-question-title" tabindex="-1" class="text-xl md:text-2xl font-bold text-white mt-2 leading-relaxed">${escapeHtml(question.titulo)}</h2>`
      : `<h2 id="current-question-title" tabindex="-1" class="sr-only">Questão ${state.currentIndex + 1}</h2>`;

    const image = question.imagem
      ? `
        <figure class="question-image my-6 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950/40 shadow-2xl">
          <img src="${escapeHtml(question.imagem)}" alt="${escapeHtml(question.titulo || "Imagem da questão")}" class="w-full h-auto object-contain" loading="lazy">
        </figure>
      `
      : "";

    const code = question.codigo
      ? `
        <div class="my-6 rounded-xl overflow-hidden border border-zinc-700 shadow-2xl">
          <div class="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 font-mono">código</div>
          <pre class="m-0 overflow-x-auto"><code class="language-plaintext block p-4 text-sm leading-relaxed">${escapeHtml(question.codigo)}</code></pre>
        </div>
      `
      : "";

    const statements = Array.isArray(question.afirmacoes)
      ? `
        <div class="my-6 flex flex-col gap-2">
          <span class="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Analise:</span>
          ${question.afirmacoes
            .map(
              (item) => `
                <div class="flex gap-4 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                  <span class="font-bold text-white text-sm shrink-0 pt-0.5">${escapeHtml(item.id)}</span>
                  <span class="text-zinc-300 text-sm font-light leading-relaxed whitespace-pre-line">${escapeHtml(item.texto)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      `
      : "";

    return `
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-3 mb-3">
          <span class="text-xs font-bold tracking-widest text-white uppercase">Questão ${state.currentIndex + 1} de ${state.questions.length}</span>
          <span class="text-[10px] font-bold tracking-[.2em] uppercase px-3 py-1 rounded-full bg-white/10 text-zinc-200 border border-white/10">${escapeHtml(question.materia)}</span>
        </div>
        ${title}
        <p class="text-zinc-300 mt-4 text-sm leading-relaxed whitespace-pre-line">${escapeHtml(question.descricao)}</p>
        ${image}
        ${code}
        ${statements}
      </div>
      <div id="options-box" class="flex flex-col gap-3" role="group" aria-label="Alternativas"></div>
    `;
  }

  function createOptionButton(option, index, correctAnswer) {
    const letters = "ABCDEFGH";
    const button = document.createElement("button");
    const content = getOptionContent(option);

    button.type = "button";
    button.dataset.correct = String(answersMatch(option, correctAnswer));
    button.className =
      "infernus-option w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 " +
      "hover:bg-zinc-900 hover:border-white/40 transition-all duration-200 text-zinc-300 font-medium group overflow-hidden";

    if (isCodeOption(option)) {
      button.innerHTML = `
        <div class="flex gap-3 items-start">
          <span class="font-bold text-white shrink-0 pt-1">${letters[index] ?? index + 1})</span>
          <div class="flex-1 min-w-0 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900/80">
            <div class="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 font-mono">python</div>
            <pre class="m-0 overflow-x-auto"><code class="language-python block p-4 text-sm leading-relaxed">${escapeHtml(content)}</code></pre>
          </div>
        </div>
      `;
    } else {
      button.innerHTML = `
        <span class="flex gap-3 items-start">
          <span class="font-bold text-white shrink-0">${letters[index] ?? index + 1})</span>
          <span class="font-light leading-relaxed whitespace-pre-line break-words">${escapeHtml(content)}</span>
        </span>
      `;
    }

    button.addEventListener("click", () => checkAnswer(button));
    return button;
  }

  function showQuestion() {
    const question = state.questions[state.currentIndex];
    const fragment = document.createDocumentFragment();

    state.locked = false;
    elements.nextButton.classList.add("hidden");
    elements.questionArea.innerHTML = renderQuestionHeader(question);

    shuffle(question.opcoes).forEach((option, index) => {
      fragment.appendChild(createOptionButton(option, index, question.resposta));
    });

    document.getElementById("options-box").appendChild(fragment);

    const image = elements.questionArea.querySelector(".question-image img");
    image?.addEventListener("error", () => image.closest(".question-image")?.remove(), { once: true });

    highlightCode();
    document.getElementById("current-question-title")?.focus({ preventScroll: true });
  }

  function styleButton(button, type, dim = false) {
    button.classList.remove("bg-zinc-950/50", "border-zinc-800", "opacity-50");

    if (type === "correct") {
      button.classList.add("bg-emerald-500/10", "border-emerald-500");
      button.querySelectorAll("span").forEach((span) => span.classList.add("text-emerald-400"));
    } else {
      button.classList.add("bg-red-500/10", "border-red-500");
      button.querySelectorAll("span").forEach((span) => span.classList.add("text-red-400"));
    }

    if (dim) button.classList.add("opacity-50");
  }

  function checkAnswer(selectedButton) {
    if (state.locked) return;
    state.locked = true;

    const buttons = [...document.querySelectorAll("#options-box button")];
    const isCorrect = selectedButton.dataset.correct === "true";

    buttons.forEach((button) => {
      button.disabled = true;
      button.classList.add("cursor-default", "opacity-50");
    });

    if (isCorrect) {
      state.score++;
      styleButton(selectedButton, "correct");
    } else {
      state.errors++;
      styleButton(selectedButton, "wrong");
      const correctButton = buttons.find((button) => button.dataset.correct === "true");
      if (correctButton) styleButton(correctButton, "correct");
    }

    updateCounters();

    if (state.errors >= 3) {
      triggerResetByErrors();
      return;
    }

    elements.nextButton.classList.remove("hidden");
    elements.nextButton.focus();
  }

  function triggerResetByErrors() {
    elements.mainWrapper.classList.add("shake-screen");
    window.setTimeout(() => {
      window.alert("Modo Infernus: você errou 3 questões. O desafio será reiniciado.");
      window.location.reload();
    }, 350);
  }

  function nextQuestion() {
    state.currentIndex++;

    if (state.currentIndex < state.questions.length) {
      showQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    elements.quizContainer.classList.add("hidden");
    elements.statsBar.classList.add("hidden");
    elements.finalScreen.classList.remove("hidden");
    elements.scoreText.textContent = `Você acertou ${state.score} de ${state.questions.length} questões e terminou com ${state.errors} erro${state.errors === 1 ? "" : "s"}.`;
    elements.finalTitle.focus();
  }

  function animatePanther() {
    window.clearTimeout(pantherTimer);
    elements.pantherBubble.classList.remove("opacity-0", "scale-90", "translate-y-2");
    elements.pantherBubble.classList.add("opacity-100", "scale-100", "translate-y-0");
    elements.pantherSvg.classList.add("translate-y-2", "scale-105");

    pantherTimer = window.setTimeout(() => {
      elements.pantherBubble.classList.remove("opacity-100", "scale-100", "translate-y-0");
      elements.pantherBubble.classList.add("opacity-0", "scale-90", "translate-y-2");
      elements.pantherSvg.classList.remove("translate-y-2", "scale-105");
    }, 1000);
  }

  elements.startButton.addEventListener("click", startInfernus);
  elements.clearButton.addEventListener("click", clearSelection);
  elements.nextButton.addEventListener("click", nextQuestion);
  elements.restartButton.addEventListener("click", () => window.location.reload());
  elements.pantherButton.addEventListener("click", animatePanther);

  renderSubjectCards();
  updateSelectedCount();
  refreshIcons();
})();
