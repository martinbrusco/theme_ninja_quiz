/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { mount } from "@odoo/owl";

// Definir el componente OWL
class KahootSurveyRunner extends Component {
    static template = "theme_ninja_quiz.KahootSurveyRunner";

    setup() {
        this.state = useState({
            questions: [],
            currentQuestion: null,
            currentIndex: 0,
        });
        console.log("KahootSurveyRunner component initialized!");
    }
}

// Función para montar el componente cuando la página se cargue
function mountKahootSurveyRunner() {
    console.log("Attempting to mount KahootSurveyRunner...");
    const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
    if (placeholder) {
        console.log("Placeholder found, mounting component...");
        mount(KahootSurveyRunner, placeholder);
        console.log("KahootSurveyRunner mounted!");
    } else {
        console.log("Placeholder #kahoot-survey-runner-placeholder not found!");
    }
}

// Registrar el componente para que se monte al cargar la página
registry.category("public_components").add("kahoot_survey_runner", {
    Component: KahootSurveyRunner,
    mount: mountKahootSurveyRunner,
});

// Ejecutar la función de montaje cuando la página se cargue
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded, calling mountKahootSurveyRunner...");
    mountKahootSurveyRunner();
});