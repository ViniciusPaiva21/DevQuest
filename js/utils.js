(function () {
  "use strict";

  function shuffle(array) {
    const copy = [...array];

    for (let index = copy.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }

    return copy;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getOptionContent(option) {
    if (typeof option === "string") return option;
    if (option && typeof option === "object") return String(option.conteudo ?? "");
    return "";
  }

  function isCodeOption(option) {
    return Boolean(option && typeof option === "object" && option.tipo === "codigo");
  }

  function comparableAnswer(value) {
    return getOptionContent(value).replace(/\r\n/g, "\n").trim();
  }

  function answersMatch(selected, expected) {
    return comparableAnswer(selected) === comparableAnswer(expected);
  }

  // PDF line wraps are not paragraph breaks. Keep actual lists and asserções separate.
  function proseBlocks(value) {
    const blocks = [];
    let current = null;
    const begin = (kind, text) => { current = { kind, text }; blocks.push(current); };
    for (const raw of String(value ?? "").replace(/\r\n?/g, "\n").split("\n")) {
      const line = raw.trim();
      if (!line) { current = null; continue; }
      if (/^(?:PORQUE|POIS)$/i.test(line)) { begin("connector", line); continue; }
      if (/^(?:VIII|VII|III|VI|IV|IX|II|I|V|X)[.)]\s+/.test(line)) { begin("statement", line); continue; }
      if (/^(?:\(\s*\)|[-•–]|\d+[.)])\s+/.test(line)) { begin("list", line); continue; }
      const instruction = /^(?:A respeito dess[ae]s|É correto|Est[áã] (?:\(ão\)\s*correta?|corret[ao]s?|\(ao\)\s*correta?)|Assinale|Marque|Selecione|Qual (?:das|dos|é|afirmação)|Com (?:base|relação)|Considerando|Avalie|Analise|Associe)\b/i.test(line);
      if (!current || current.kind === "connector" || instruction) begin("paragraph", line);
      else current.text += "\n" + line;
    }
    return blocks;
  }
  function renderProse(value, render = escapeHtml) {
    return proseBlocks(value).map(({kind,text}) => '<div class="dq-prose-' + kind + '">' + render(text).replace(/\n/g, " ") + '</div>').join('');
  }

  window.DevQuestUtils = Object.freeze({
    proseBlocks,
    renderProse,
    answersMatch,
    escapeHtml,
    getOptionContent,
    isCodeOption,
    shuffle
  });
})();
