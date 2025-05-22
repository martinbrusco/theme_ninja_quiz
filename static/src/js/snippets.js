/** @odoo-module **/

import { mount } from "@odoo/owl";
import { KahootSurveyRunner } from "./kahoot_survey_runner";
import { useService } from "@web/core/utils/hooks";

const { Component, onMounted } = owl;

export class QuizPlaySnippet extends Component {
    static template = "theme_ninja_quiz.s_quiz_play";

    setup() {
        this.rpc = useService("rpc");
        onMounted(() => this.mountQuizComponent());
    }

    async mountQuizComponent() {
        const placeholder = this.el.querySelector("#kahoot-survey-runner-placeholder");
        if (placeholder) {
            const surveyId = parseInt(placeholder.dataset.surveyId) || null;
            const token = placeholder.dataset.token || null;
            const surveyExists = placeholder.dataset.surveyExists === "true";

            if (surveyId && token) {
                mount(KahootSurveyRunner, placeholder, {
                    props: {
                        surveyId,
                        token,
                        surveyExists,
                    },
                });
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const quizPlays = document.querySelectorAll(".s_quiz_play");
    quizPlays.forEach((el) => {
        mount(QuizPlaySnippet, el);
    });
});