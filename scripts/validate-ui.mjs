import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {} };
const configSource = fs.readFileSync(path.join(projectRoot, "js/subjects.js"), "utf8");
const homeSource = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const catalogSource = fs.readFileSync(path.join(projectRoot, "disciplinas.html"), "utf8");
const themedPages = ["index.html", "disciplinas.html", "quiz.html", "infernus.html"];
const errors = [];

vm.runInNewContext(configSource, context);

const subjects = context.window.DEVQUEST_SUBJECTS;
const courses = context.window.DEVQUEST_COURSES;
const featuredSubjects = context.window.DEVQUEST_FEATURED_SUBJECTS;
const colors = [];

for (const courseId of ["ADS", "CC"]) {
  const course = courses?.[courseId];

  if (!course) {
    errors.push(`Configuração da trilha ${courseId} ausente.`);
    continue;
  }

  if (course.subjects.length !== course.cardColors.length) {
    errors.push(`${courseId}: total de matérias e total de cores não coincidem.`);
  }

  course.subjects.forEach((subjectId, index) => {
    if (!subjects?.[subjectId]) errors.push(`${courseId}: matéria inexistente "${subjectId}".`);

    const color = course.cardColors[index];
    if (!/^#[0-9a-f]{6}$/i.test(color || "")) {
      errors.push(`${courseId}: cor inválida no card ${index + 1}.`);
    }
    colors.push(color?.toLowerCase());
  });
}

if (new Set(colors).size !== colors.length) {
  errors.push("As cores de hover dos cards precisam ser todas diferentes.");
}

for (const requiredId of ["destaques", "featuredCardsGrid", "infernus"]) {
  if (!homeSource.includes(`id="${requiredId}"`)) errors.push(`index.html: #${requiredId} ausente.`);
}

if (!homeSource.includes('href="disciplinas.html"')) {
  errors.push("index.html: acesso ao catálogo completo ausente.");
}

if (homeSource.indexOf('id="destaques"') > homeSource.indexOf('id="infernus"')) {
  errors.push("As matérias em destaque precisam aparecer antes do Modo Infernus.");
}

for (const requiredId of ["trilhas", "ads", "adsCardsGrid", "cc", "ccCardsGrid"]) {
  if (!catalogSource.includes(`id="${requiredId}"`)) errors.push(`disciplinas.html: #${requiredId} ausente.`);
}

const expectedFeatured = ["arquiteturasistemas", "fundamentosredes", "governancati"];
if (JSON.stringify(featuredSubjects) !== JSON.stringify(expectedFeatured)) {
  errors.push("A página inicial precisa destacar exatamente as três novas matérias de ADS.");
}

for (const subjectId of featuredSubjects || []) {
  if (!courses.ADS.subjects.includes(subjectId)) {
    errors.push(`Destaque inválido: "${subjectId}" não pertence à trilha ADS.`);
  }
}

for (const pageName of themedPages) {
  const pageSource = fs.readFileSync(path.join(projectRoot, pageName), "utf8");
  if (!pageSource.includes('src="js/theme.js"')) errors.push(`${pageName}: sistema de temas ausente.`);
  if (!pageSource.includes('href="css/themes.css"')) errors.push(`${pageName}: estilos de tema ausentes.`);
  if (!pageSource.includes("data-theme-slot")) errors.push(`${pageName}: seletor de temas ausente.`);
}

if (errors.length > 0) {
  console.error(`Validação visual falhou com ${errors.length} problema(s):\n`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Interface validada: 3 destaques na página inicial, ${colors.length} cards com cores exclusivas no catálogo e 2 trilhas visíveis.`);
