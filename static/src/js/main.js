/** @odoo-module **/

import { mount } from "@odoo/owl";
import { KahootSurveyRunner } from "@theme_ninja_quiz/components/kahoot_survey_runner";

console.log("💡 Ninja Quiz main.js cargado!");

document.addEventListener("DOMContentLoaded", async () => {
    const target = document.querySelector("#kahoot_survey_app");
    if (!target) return;                          // no estamos en /show_pin
    const pin = document.querySelector(".pin-number")?.textContent.trim();
    await mount(KahootSurveyRunner, { target, props: { pin } });
});

