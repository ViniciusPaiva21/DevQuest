(function () {
  "use strict";

  const { escapeHtml, getOptionContent, answersMatch, shuffle } = window.DevQuestUtils;

  // Text and answer identify a question, independently of its position or option order.
  function questionKey(question) {
    const text = JSON.stringify([
      question.titulo || "", question.descricao || "", question.codigo || "",
      question.descricaoAposImagem || "", question.afirmacoes || [], question.resposta
    ]);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  function questionFields(question) {
    const fields = Object.fromEntries(
      ["titulo", "descricao", "descricaoAposImagem", "codigo"].map(key => [key, question[key] || ""])
    );
    (question.afirmacoes || []).forEach((item, index) => {
      fields[`afirmacoes.${index}`] = typeof item === "string" ? item : item.texto || "";
    });
    return fields;
  }

  // Escape the full source in fragments; only our own <mark> tags become HTML.
  // Each cue is highlighted once, even when its text occurs several times.
  function highlight(text, cues) {
    text = String(text ?? "");
    const ranges = [];
    for (const cue of (cues || []).slice(0, 2)) {
      if (typeof cue !== "string" || !cue) continue;
      const start = text.indexOf(cue);
      const end = start + cue.length;
      if (start < 0 || ranges.some(range => start < range.end && end > range.start)) continue;
      ranges.push({ start, end });
    }
    ranges.sort((a, b) => a.start - b.start);
    let cursor = 0;
    let html = "";
    for (const range of ranges) {
      html += escapeHtml(text.slice(cursor, range.start));
      html += `<mark class="decoreba-keyword">${escapeHtml(text.slice(range.start, range.end))}</mark>`;
      cursor = range.end;
    }
    return html + escapeHtml(text.slice(cursor));
  }

  function validateCues(question, cues) {
    const fields = questionFields(question);
    return Boolean(cues && Array.isArray(cues.pergunta) && Array.isArray(cues.resposta) &&
      cues.pergunta.length >= 1 && cues.pergunta.length <= 2 &&
      cues.resposta.length >= 1 && cues.resposta.length <= 2 &&
      cues.pergunta.every(cue => typeof cue.texto === "string" && cue.texto &&
        fields[cue.campo]?.includes(cue.texto)) &&
      cues.resposta.every(cue => typeof cue === "string" && cue && question.resposta.includes(cue)));
  }

  function validateOptionCues(question, optionCues) {
    if (!Array.isArray(optionCues) || optionCues.length !== question.opcoes.length) return false;
    const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return question.opcoes.every(option => optionCues.some(cue => cue.texto === getOptionContent(option) && typeof cue.chave === "string" && cue.chave.trim() && typeof cue.trecho === "string" && cue.trecho && cue.texto.includes(cue.trecho))) &&
      optionCues.every((cue, i) => optionCues.every((other, j) => i === j || normalize(cue.chave) !== normalize(other.chave) || cue.texto === other.texto));
  }

  function prepareSession(questions, subjectCues, pilotCues) {
    if (!Array.isArray(questions) || !questions.length) throw new Error("Banco de questões vazio.");
    return shuffle(questions).map(question => {
      if (!Array.isArray(question.opcoes) || question.opcoes.filter(option => answersMatch(option, question.resposta)).length !== 1) {
        throw new Error("Questão sem um gabarito único.");
      }
      const cues = subjectCues?.[questionKey(question)];
      if (!validateCues(question, cues)) throw new Error("Destaques ausentes ou desatualizados.");
      const optionCues = pilotCues?.[questionKey(question)];
      if (pilotCues && !validateOptionCues(question, optionCues)) throw new Error("Chaves das alternativas ausentes ou incompatíveis.");
      return { question, cues, options: shuffle(question.opcoes), optionCues };
    });
  }

  function renderQuestion(entry, attempt = null) {
    const { question, cues, options } = entry;
    const fields = questionFields(question);
    const render = field => {
      const html = highlight(fields[field], cues.pergunta.filter(cue => cue.campo === field).map(cue => cue.texto));
      if (field === "codigo" || question.descricaoMonoespacada) return html;
      return html.replace(/\r\n/g, "\n").replace(/\n(?!\n|\s*(?:[IVX]+[.)]|\d+[.)]|[-•])\s)/g, " ").replace(/\n+/g, "<br><br>");
    };
    const title = question.titulo ? `<h2 class="decoreba-question-title">${render("titulo")}</h2>` : "";
    const description = fields.descricao ? `<p class="decoreba-prompt${question.descricaoMonoespacada ? " decoreba-monospace" : ""}">${render("descricao")}</p>` : "";
    const figure = question.imagem ? `<figure class="decoreba-figure"><img src="${escapeHtml(question.imagem)}" alt="${escapeHtml(question.titulo || "Figura da questão")}" loading="lazy"><a href="${escapeHtml(question.imagem)}" target="_blank" rel="noopener">Ampliar figura ↗</a></figure>` : "";
    const after = fields.descricaoAposImagem ? `<p class="decoreba-prompt">${render("descricaoAposImagem")}</p>` : "";
    const code = fields.codigo ? `<pre class="decoreba-code"><code>${render("codigo")}</code></pre>` : "";
    const statements = (question.afirmacoes || []).map((item, index) =>
      `<li><strong>${escapeHtml(typeof item === "string" ? `${index + 1}.` : item.id)}</strong><span>${render(`afirmacoes.${index}`)}</span></li>`
    ).join("");
    const optionHtml = options.map((option, index) => {
      const correct = answersMatch(option, question.resposta);
      const content = getOptionContent(option);
      const pilot = Boolean(entry.optionCues && attempt);
      const answered = pilot && attempt.selected !== null;
      const visibleCorrect = correct && (!pilot || answered);
      const inlineCue = pilot ? entry.optionCues.find(item => item.texto === content).trecho : null;
      const highlighted = highlight(content, correct ? (pilot ? ((attempt.revealed || answered) ? [inlineCue] : []) : cues.resposta) : []);
      const body = option && typeof option === "object" && option.tipo === "codigo"
        ? `<pre class="decoreba-code"><code>${highlighted}</code></pre>`
        : `<span class="decoreba-option-copy">${highlighted}</span>`;
      if (pilot) {
        const selected = attempt.selected === index;
        const label = answered ? (correct ? '✓ Resposta correta' : selected ? '✕ Sua resposta' : '') : '';
        return `<li><button type="button" class="decoreba-option decoreba-choice${visibleCorrect ? ' decoreba-option--correct' : ''}${answered && selected && !correct ? ' decoreba-option--wrong' : ''}" data-option-index="${index}" ${answered ? 'disabled' : ''}>
          <span class="decoreba-letter">${String.fromCharCode(65 + index)})</span>
          <span class="decoreba-option-body">${label ? `<span class="decoreba-correct-label">${label}</span>` : ''}${body}</span>
        </button></li>`;
      }
      return `<li class="decoreba-option${correct ? " decoreba-option--correct" : ""}" data-correct="${correct}">
        <span class="decoreba-letter" aria-hidden="true">${String.fromCharCode(65 + index)})</span>
        <div class="decoreba-option-body">${correct ? '<span class="decoreba-correct-label">✓ Resposta correta</span>' : ""}${body}</div>
      </li>`;
    }).join("");
    return `<div class="decoreba-question">${title}${description}${figure}${after}${code}${statements ? `<ol class="decoreba-statements">${statements}</ol>` : ""}</div>
      <ol class="decoreba-options" aria-label="${attempt ? 'Escolha uma alternativa' : 'Alternativas; a resposta correta está destacada'}">${optionHtml}</ol>`;
  }

  window.DevQuestDecoreba = Object.freeze({ questionKey, questionFields, highlight, validateCues, validateOptionCues, prepareSession, renderQuestion });
})();
