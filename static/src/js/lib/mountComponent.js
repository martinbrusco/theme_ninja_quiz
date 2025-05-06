/** @odoo-module **/

import { mount } from "@odoo/owl";
import { KahootSurveyRunner } from "../kahoot_survey_runner";

export function mountKahootSurveyRunner() {
  // Usa un intervalo para intentar montar el componente hasta que el DOM esté listo
  const mountInterval = setInterval(() => {
    const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
    if (placeholder && document.readyState === "complete") {
      mount(KahootSurveyRunner, placeholder);
      clearInterval(mountInterval); // Detiene el intervalo una vez montado
    } else if (document.readyState === "complete") {
      console.error("Placeholder #kahoot-survey-runner-placeholder not found!");
      clearInterval(mountInterval); // Detiene el intervalo si el DOM está listo pero no se encuentra el placeholder
    }
  }, 100); // Revisa cada 100ms
}

// Ejecuta la función de montaje
mountKahootSurveyRunner();