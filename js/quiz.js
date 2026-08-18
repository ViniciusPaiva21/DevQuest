(function () {
  "use strict";

  if (!window.QUIZ_CONFIG) return;

  const { answersMatch, escapeHtml, getOptionContent, isCodeOption, shuffle } = window.DevQuestUtils;

  const accentMap = {
    violet: { text: "text-violet-400", border: "border-violet-500", bg: "bg-violet-500/10" },
    fuchsia: { text: "text-fuchsia-400", border: "border-fuchsia-500", bg: "bg-fuchsia-500/10" },
    orange: { text: "text-orange-400", border: "border-orange-500", bg: "bg-orange-500/10" },
    red: { text: "text-red-400", border: "border-red-500", bg: "bg-red-500/10" },
    yellow: { text: "text-yellow-400", border: "border-yellow-500", bg: "bg-yellow-500/10" },
    green: { text: "text-green-400", border: "border-green-500", bg: "bg-green-500/10" },
    emerald: { text: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-500/10" },
    blue: { text: "text-blue-400", border: "border-blue-500", bg: "bg-blue-500/10" },
    lime: { text: "text-lime-400", border: "border-lime-500", bg: "bg-lime-500/10" }
  };

  const config = resolveConfig(window.QUIZ_CONFIG);
  const elements = getElements();
  const state = {
    allQuestions: [],
    questions: [],
    wrongQuestions: [],
    currentIndex: 0,
    correctThisRound: 0,
    firstRoundScore: 0,
    originalTotal: 0,
    totalAttempts: 0,
    round: 1,
    reviewMode: false
  };

  function resolveConfig(userConfig) {
    if (!userConfig?.jsonPath || !userConfig?.jsonKey) {
      throw new Error("Configuração da matéria incompleta.");
    }

    return {
      ...userConfig,
      label: userConfig.label || "Quiz",
      description: userConfig.description || "Analise e responda.",
      icon: userConfig.icon || "brain",
      accent: accentMap[userConfig.accent] || accentMap.violet
    };
  }

  function getElements() {
    const ids = [
      "loading",
      "quiz-container",
      "question-area",
      "next-btn",
      "final-screen",
      "score-text",
      "round-badge",
      "progress-badge",
      "final-title",
      "final-detail",
      "restart-btn",
      "quiz-title",
      "quiz-subtitle",
      "quiz-icon",
      "quiz-course-badge"
    ];

    const result = Object.fromEntries(
      ids.map((id) => [id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), document.getElementById(id)])
    );

    const missing = ids.filter((id) => !document.getElementById(id));
    if (missing.length > 0) {
      throw new Error(`Elementos obrigatórios ausentes: ${missing.join(", ")}`);
    }

    return result;
  }

  function refreshIcons() {
    window.lucide?.createIcons();
  }

  function highlightCode() {
    window.hljs?.highlightAll();
  }

  function configurePage() {
    const courseSuffix = config.courseId ? ` · ${config.courseId}` : "";

    document.title = `DevQuest - ${config.label}${courseSuffix}`;
    elements.quizTitle.textContent = `Quiz ${config.label}${courseSuffix}`;
    elements.quizSubtitle.textContent = config.courseLabel
      ? `${config.courseLabel} — ${config.description}`
      : config.description;

    if (config.courseId) {
      elements.quizCourseBadge.textContent = `Trilha ${config.courseId}`;
      elements.quizCourseBadge.classList.remove("hidden");
      elements.quizCourseBadge.classList.add(`quiz-course-badge--${config.courseId.toLowerCase()}`);
    }

    elements.quizIcon.setAttribute("data-lucide", config.icon);
    elements.quizIcon.setAttribute("class", `${config.accent.text} w-8 h-8`);
    elements.loading.className = `${config.accent.text} font-bold text-xl animate-pulse`;
    elements.scoreText.className = `text-2xl ${config.accent.text} font-bold mb-4`;
    refreshIcons();
  }

  function extractQuestions(data) {
    const questions = data?.[config.jsonKey];

    if (!Array.isArray(questions)) {
      throw new Error(`A chave "${config.jsonKey}" não contém uma lista de questões.`);
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

  async function loadQuestions() {
    try {
      const response = await fetch(config.jsonPath);
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

      const data = await response.json();
      const questions = extractQuestions(data);
      const invalidCount = questions.filter((question) => !isValidQuestion(question)).length;

      if (invalidCount > 0) {
        throw new Error(`${invalidCount} questão(ões) possuem dados inválidos.`);
      }

      state.allQuestions = questions;
      startQuiz();
    } catch (error) {
      console.error(error);
      elements.loading.textContent = "Não foi possível carregar as questões desta matéria.";
    }
  }

  function startQuiz() {
    state.questions = shuffle(state.allQuestions);
    state.wrongQuestions = [];
    state.currentIndex = 0;
    state.correctThisRound = 0;
    state.firstRoundScore = 0;
    state.originalTotal = state.questions.length;
    state.totalAttempts = 0;
    state.round = 1;
    state.reviewMode = false;

    elements.finalScreen.classList.add("hidden");

    if (state.questions.length === 0) {
      elements.loading.textContent = "Nenhuma questão encontrada.";
      elements.loading.classList.remove("hidden");
      elements.quizContainer.classList.add("hidden");
      return;
    }

    elements.loading.classList.add("hidden");
    elements.quizContainer.classList.remove("hidden");
    updateStatus();
    showQuestion();
  }

  function updateStatus() {
    elements.roundBadge.innerHTML = `
      <i data-lucide="${state.reviewMode ? "rotate-ccw" : "brain"}" class="w-4 h-4 ${config.accent.text}"></i>
      <span>${state.reviewMode ? `Revisão · Rodada ${state.round}` : `Rodada ${state.round}`}</span>
    `;

    elements.progressBadge.innerHTML = `
      <i data-lucide="target" class="w-4 h-4 text-emerald-400"></i>
      <span>${state.correctThisRound} acerto${state.correctThisRound === 1 ? "" : "s"} nesta rodada</span>
    `;

    refreshIcons();
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
                  <span class="font-bold ${config.accent.text} text-sm shrink-0 pt-0.5">${escapeHtml(item.id)}</span>
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
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-xs font-bold tracking-widest ${config.accent.text} uppercase">
            ${state.reviewMode ? "Revisão · " : ""}Questão ${state.currentIndex + 1} de ${state.questions.length}
          </span>
          ${
            state.reviewMode
              ? `<span class="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${config.accent.bg} text-zinc-200 border ${config.accent.border}">Revisão de erro</span>`
              : ""
          }
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
      "w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 " +
      `hover:bg-zinc-900 hover:${config.accent.border} transition-all duration-200 ` +
      "text-zinc-300 font-medium group overflow-hidden";

    if (isCodeOption(option)) {
      button.innerHTML = `
        <div class="flex gap-3 items-start">
          <span class="font-bold ${config.accent.text} shrink-0 pt-1">${letters[index] ?? index + 1})</span>
          <div class="flex-1 min-w-0 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900/80">
            <div class="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 font-mono">python</div>
            <pre class="m-0 overflow-x-auto"><code class="language-python block p-4 text-sm leading-relaxed">${escapeHtml(content)}</code></pre>
          </div>
        </div>
      `;
    } else {
      button.innerHTML = `
        <span class="flex gap-3 items-start">
          <span class="font-bold ${config.accent.text} shrink-0">${letters[index] ?? index + 1})</span>
          <span class="font-light leading-relaxed whitespace-pre-line break-words">${escapeHtml(content)}</span>
        </span>
      `;
    }

    button.addEventListener("click", () => checkAnswer(button));
    return button;
  }

  function showQuestion() {
    const question = state.questions[state.currentIndex];
    elements.nextBtn.classList.add("hidden");
    elements.questionArea.innerHTML = renderQuestionHeader(question);

    const optionsBox = document.getElementById("options-box");
    const fragment = document.createDocumentFragment();

    shuffle(question.opcoes).forEach((option, index) => {
      fragment.appendChild(createOptionButton(option, index, question.resposta));
    });

    optionsBox.appendChild(fragment);

    const image = elements.questionArea.querySelector(".question-image img");
    image?.addEventListener("error", () => image.closest(".question-image")?.remove(), { once: true });

    highlightCode();
    refreshIcons();
    document.getElementById("current-question-title")?.focus({ preventScroll: true });
  }

  function setButtonState(button, stateName, dim = false) {
    button.classList.remove("bg-zinc-950/50", "border-zinc-800", "opacity-50");

    if (stateName === "correct") {
      button.classList.add("bg-emerald-500/10", "border-emerald-500");
      button.querySelectorAll("span").forEach((span) => span.classList.add("text-emerald-400"));
    } else if (stateName === "wrong") {
      button.classList.add("bg-red-500/10", "border-red-500");
      button.querySelectorAll("span").forEach((span) => span.classList.add("text-red-400"));
    }

    if (dim) button.classList.add("opacity-50");
  }

  function checkAnswer(selectedButton) {
    const buttons = [...document.querySelectorAll("#options-box button")];
    const isCorrect = selectedButton.dataset.correct === "true";

    state.totalAttempts++;
    buttons.forEach((button) => {
      button.disabled = true;
      button.classList.add("cursor-default", "opacity-50");
    });

    if (isCorrect) {
      state.correctThisRound++;
      setButtonState(selectedButton, "correct");
    } else {
      state.wrongQuestions.push(state.questions[state.currentIndex]);
      setButtonState(selectedButton, "wrong");

      const correctButton = buttons.find((button) => button.dataset.correct === "true");
      if (correctButton) setButtonState(correctButton, "correct");
    }

    updateStatus();
    elements.nextBtn.classList.remove("hidden");
    elements.nextBtn.focus();
  }

  function nextQuestion() {
    state.currentIndex++;

    if (state.currentIndex < state.questions.length) {
      showQuestion();
      return;
    }

    if (state.round === 1) state.firstRoundScore = state.correctThisRound;

    if (state.wrongQuestions.length > 0) {
      state.questions = shuffle(state.wrongQuestions);
      state.wrongQuestions = [];
      state.currentIndex = 0;
      state.correctThisRound = 0;
      state.round++;
      state.reviewMode = true;
      updateStatus();
      showQuestion();
      return;
    }

    showResults();
  }

  function showResults() {
    const extraRounds = state.round - 1;

    elements.quizContainer.classList.add("hidden");
    elements.finalScreen.classList.remove("hidden");
    elements.finalTitle.textContent = "Agora sim: zerou tudo. 🚀";
    elements.scoreText.textContent = `Primeira rodada: ${state.firstRoundScore} de ${state.originalTotal} acertos.`;
    elements.finalDetail.textContent =
      `Foram ${state.totalAttempts} tentativas no total e ${extraRounds} rodada${extraRounds === 1 ? "" : "s"} extra.`;
    elements.finalTitle.setAttribute("tabindex", "-1");
    elements.finalTitle.focus();
  }

  elements.nextBtn.addEventListener("click", nextQuestion);
  elements.restartBtn.addEventListener("click", startQuiz);

  configurePage();
  loadQuestions();
})();
