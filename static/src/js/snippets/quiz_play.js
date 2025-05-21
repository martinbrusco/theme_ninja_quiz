/** @odoo-module **/

import KahootSurveyRunner from "@theme_ninja_quiz/js/kahoot_survey_runner";
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

// Componente para reproducir el cuestionario
class QuizPlay extends Component {
    static template = "theme_ninja_quiz.QuizPlayTemplate"; // Plantilla QWeb asociada
    static components = { KahootSurveyRunner }; // Registrar el componente KahootSurveyRunner

    setup() {
        console.log("Quiz Play loaded, using KahootSurveyRunner:", KahootSurveyRunner);
    }
}

// Registrar el componente
registry.category("snippets").add("quiz_play", QuizPlay);

export default QuizPlay;