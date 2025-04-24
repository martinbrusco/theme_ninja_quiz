/** @odoo-module **/

import { mount } from "@odoo/owl";
import { KahootSurveyRunner } from "@theme_ninja_quiz/components/kahoot_survey_runner";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("#kahoot_survey_app");
    if (!container) return;

    const pin = document.querySelector(".pin-number")?.textContent.trim();
    await mount(KahootSurveyRunner, { target: container, props: { pin } });
});
