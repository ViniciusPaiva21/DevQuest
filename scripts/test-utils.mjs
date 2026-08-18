import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ window: {} });

for (const file of ["js/subjects.js", "js/utils.js"]) {
  const source = fs.readFileSync(path.join(projectRoot, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

const { answersMatch, escapeHtml, getOptionContent } = context.window.DevQuestUtils;
const subjects = context.window.DEVQUEST_SUBJECTS;
const courses = context.window.DEVQUEST_COURSES;
const featuredSubjects = context.window.DEVQUEST_FEATURED_SUBJECTS;

assert.equal(Object.keys(subjects).length, 13);
assert.equal(courses.ADS.subjects.length, 10);
assert.equal(courses.CC.subjects.length, 8);
assert.deepEqual(Array.from(featuredSubjects), ["arquiteturasistemas", "fundamentosredes", "governancati"]);

assert.equal(answersMatch("|", ">"), false);
assert.equal(answersMatch("// Comentário", "# Comentário"), false);
assert.equal(answersMatch("p ∧ ~q", "p ∨ q"), false);
assert.equal(answersMatch({ tipo: "codigo", conteudo: "x += 1" }, "x += 1"), true);
assert.equal(getOptionContent({ tipo: "codigo", conteudo: "print('ok')" }), "print('ok')");
assert.equal(escapeHtml("<script>"), "&lt;script&gt;");

console.log("Utilitários validados: comparação exata, opções de código e escape de HTML funcionando.");
