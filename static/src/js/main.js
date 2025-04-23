/** @odoo-module **/

import { mount } from "@odoo/owl";
import KahootSurveyRunner from "../components/kahoot_survey_runner";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ DOM listo. Buscando #kahoot_survey_app...");

    const container = document.querySelector("#kahoot_survey_app");

    if (!container) {
        console.warn("🚫 No se encontró el contenedor #kahoot_survey_app.");
        return;
    }

    console.log("🎯 Contenedor encontrado:", container);

    const pinElement = document.querySelector(".pin-number");
    const pin = pinElement ? pinElement.textContent.trim() : null;

    if (!pin) {
        console.warn("⚠️ No se pudo obtener el PIN.");
    } else {
        console.log("📌 PIN capturado para OWL:", pin);
    }

    try {
        await mount(KahootSurveyRunner, {
            target: container,
            props: { pin },
        });
        console.log("✅ Componente OWL montado exitosamente.");
    } catch (error) {
        console.error("❌ Error al montar el componente OWL:", error);
    }
});
