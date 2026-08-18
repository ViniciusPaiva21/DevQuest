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

  window.DevQuestUtils = Object.freeze({
    answersMatch,
    escapeHtml,
    getOptionContent,
    isCodeOption,
    shuffle
  });
})();
