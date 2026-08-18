import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const subjectFiles = {
  "data/frontend.json": "frontend",
  "data/ux.json": "uxui",
  "data/engenharia.json": "engenharia",
  "data/backend.json": "backend",
  "data/estruturas.json": "estruturasDeDados",
  "data/adrii.json": "adrii",
  "data/sistemas.json": "sistemas",
  "data/designthinking.json": "designThinking",
  "data/logica.json": "logica",
  "data/estruturascc.json": "estruturascc",
  "data/arquiteturasistemas.json": "arquiteturaSistemas",
  "data/fundamentosredes.json": "fundamentosRedes",
  "data/governancati.json": "governancaTI"
};

const errors = [];
let totalQuestions = 0;

function optionContent(option) {
  if (typeof option === "string") return option;
  if (option && typeof option === "object") return String(option.conteudo ?? "");
  return "";
}

function comparable(value) {
  return optionContent(value).replace(/\r\n/g, "\n").trim();
}

function report(file, questionNumber, message) {
  errors.push(`${file} · questão ${questionNumber}: ${message}`);
}

for (const [relativeFile, jsonKey] of Object.entries(subjectFiles)) {
  const absoluteFile = path.join(projectRoot, relativeFile);
  const data = JSON.parse(fs.readFileSync(absoluteFile, "utf8"));
  const questions = data[jsonKey];

  if (!Array.isArray(questions)) {
    errors.push(`${relativeFile}: a chave "${jsonKey}" não contém uma lista.`);
    continue;
  }

  totalQuestions += questions.length;

  questions.forEach((question, index) => {
    const number = index + 1;

    if (!question || typeof question !== "object") {
      report(relativeFile, number, "registro inválido.");
      return;
    }

    if (question.tipo === "discursiva") {
      report(relativeFile, number, "questões discursivas não são permitidas.");
    }

    if (!question.titulo && !question.descricao) {
      report(relativeFile, number, "título e descrição estão vazios.");
    }

    if (!Array.isArray(question.opcoes) || question.opcoes.length < 2) {
      report(relativeFile, number, "deve possuir pelo menos duas alternativas.");
      return;
    }

    if (typeof question.resposta !== "string" || !question.resposta.trim()) {
      report(relativeFile, number, "resposta correta ausente.");
      return;
    }

    const options = question.opcoes.map(optionContent);
    if (options.some((option) => !option.trim())) {
      report(relativeFile, number, "há uma alternativa vazia.");
    }

    if (new Set(options).size !== options.length) {
      report(relativeFile, number, "há alternativas duplicadas.");
    }

    const correctMatches = options.filter((option) => comparable(option) === comparable(question.resposta));
    if (correctMatches.length !== 1) {
      report(relativeFile, number, `a resposta correta aparece ${correctMatches.length} vez(es) nas alternativas.`);
    }

    if (question.imagem) {
      const imagePath = path.resolve(projectRoot, question.imagem);
      if (!imagePath.startsWith(projectRoot + path.sep) || !fs.existsSync(imagePath)) {
        report(relativeFile, number, `imagem inexistente ou inválida: ${question.imagem}`);
      }
    }
  });
}

if (errors.length > 0) {
  console.error(`Validação falhou com ${errors.length} problema(s):\n`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`DevQuest validado: ${totalQuestions} questões objetivas sem inconsistências.`);
