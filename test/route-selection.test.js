import assert from "node:assert/strict";
import test from "node:test";

import { BUNDLED_KNOWLEDGE_BASE, loadKnowledgeBase } from "../src/knowledge-base.js";
import { resolveConcept } from "../src/route-selection.js";

const { concepts } = loadKnowledgeBase(BUNDLED_KNOWLEDGE_BASE);

for (const [name, prompt, concept] of [
  ["run deck", "Can I edit the sound speed profile through `perun.inp`?", "umpe"],
  ["file list deck", "Configure `pefiles.inp` before running a split-step Fourier model.", "umpe"],
  ["real deck after an earlier lookalike", "I have peenv.inp.bak. How do I set the sound speed profile in peenv.inp?", "umpe"],
  ["hyphenated filename lookalike", "Can I edit my-perun.inp for a parabolic equation model?", "parabolic_equation"],
  ["backup filename lookalike", "Can I edit pefiles.inp.bak for a parabolic equation model?", "parabolic_equation"],
  ["standalone solver", "UMPE?", "umpe"],
]) {
  test(`route selection: ${name}`, () => {
    assert.equal(resolveConcept(prompt, concepts)?.key, concept);
  });
}

test("route selection: a solver name inside another word does not select UMPE", () => {
  assert.notEqual(resolveConcept("The dumped data was saved.", concepts)?.key, "umpe");
});

const deck = "./examples/ex3/PEENV.INP";
const runHistory = `I ran UMPE with ${deck}.`;
const theory = "How does the sound speed profile affect refraction?";
const attachment = `Attached: ${deck}`;

for (const [name, prompt, expected] of [
  ["history after the question", `${theory} ${runHistory}`, "sound_speed_profile"],
  ["history before the question", `${runHistory} ${theory}`, "sound_speed_profile"],
  ["the question names only the short concept", `${runHistory} Why does the SSP bend rays?`, "sound_speed_profile"],
  ["run is background within the question", `How does the sound speed profile affect refraction when I run UMPE with ${deck}?`, "sound_speed_profile"],
  ["a learned configuration is background", `Yesterday I learned how to configure ${deck}. ${theory}`, "sound_speed_profile"],
  ["a different clause asks about format", `I ran UMPE with ${deck}. Which format should I use for a sound speed profile plot?`, "sound_speed_profile"],
  ["input syntax", `What is the syntax for a sound speed profile in ${deck}?`, "umpe"],
  ["fronted deck path", `In ${deck}, what format should I use for the sound speed profile?`, "umpe"],
  ["Chinese input syntax", `${deck} 里 sound speed profile 的语法是什么？`, "umpe"],
  ["Chinese input format", `在 ${deck} 里，sound speed profile 应该用什么格式？`, "umpe"],
  ["Chinese configuration imperative", `在 ${deck} 里配置 sound speed profile`, "umpe"],
  ["English syntax as a short request", `Input syntax for the sound speed profile in ${deck}`, "umpe"],
  ["Chinese history before a theory request", `之前用 ${deck} 运行了 UMPE。声速剖面为什么会影响折射？`, "sound_speed_profile"],
  ["completed deck setup before why", "在 peenv.inp 中设置好声速剖面后为什么声速剖面会导致折射？", "sound_speed_profile"],
  ["same setup with a comma", "在 peenv.inp 中设置好声速剖面后，为什么声速剖面会导致折射？", "sound_speed_profile"],
  ["completed run before a short theory question", `运行 ${deck} 之后为何 SSP 会影响折射？`, "sound_speed_profile"],
  ["what format in the configuration clause", `在 ${deck} 里应把 sound speed profile 设置为什么格式？`, "umpe"],
  ["format request following setup", `在 ${deck} 里设置好频率后应该用什么格式填写 sound speed profile？`, "umpe"],
  ["why the deck requires a particular format", `在 ${deck} 里设置好频率后为什么 sound speed profile 必须用这种格式？`, "umpe"],
  ["configuration request with deck attachment", `How do I set the sound speed profile for UMPE ex3? ${attachment}`, "umpe"],
  ["deck attachment before syntax request", `${attachment}\nWhat is the sound speed profile syntax for this file?`, "umpe"],
  ["file attached in prose", `I attached \`${deck}\`. How do I enter my sound speed profile?`, "umpe"],
  ["bare attachment path", `How do I enter my sound speed profile?\n${deck}`, "umpe"],
  ["same attachment with a theory request", `${theory} ${attachment}`, "sound_speed_profile"],
]) {
  test(`mixed deck intent: ${name}`, () => {
    assert.equal(resolveConcept(prompt, concepts)?.key, expected);
  });
}
