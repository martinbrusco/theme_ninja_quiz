/** @odoo-module **/

import { mount } from "@odoo/owl";
import { KahootSurveyRunner } from "../components/kahoot_survey_runner/kahoot_survey_runner";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ main.js se cargó");

    const el = document.getElementById("kahoot_survey_app");
    if (el) {
        console.log("✅ kahoot_survey_app encontrado, montando componente OWL...");
        await mount(KahootSurveyRunner, { target: el });
    } else {
        console.warn("❌ Elemento #kahoot_survey_app no encontrado.");
    }
});
