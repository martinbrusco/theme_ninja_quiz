/** @odoo-module **/

import { Component, useState, xml } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { mount } from "@odoo/owl";
import { rpc } from "@web/core/network/rpc";

// Componente OWL para el quiz
class KahootSurveyRunner extends Component {
    static template = xml`
        <div class="survey-runner">
            <h2>Bienvenido al Quiz</h2>
            <t t-if="state.questions.length === 0">
                <p>¡Cargando preguntas...</p>
            </t>
            <t t-else="">
                <div class="question-container">
                    <h3 t-esc="state.currentQuestion.title"/>
                    <ul class="options-list">
                        <t t-foreach="state.currentQuestion.options" t-as="option" t-key="option.id">
                            <li>
                                <button t-on-click="() => selectOption(option.id)" t-att-class="getOptionClass(option.id)">
                                    <t t-esc="option.text"/>
                                </button>
                            </li>
                        </t>
                    </ul>
                    <t t-if="state.feedbackMessage">
                        <p class="feedback-message" t-att-class="state.feedbackMessage.includes('Correct') ? 'correct' : 'incorrect'">
                            <t t-esc="state.feedbackMessage"/>
                        </p>
                    </t>
                    <div class="navigation">
                        <button t-on-click="previousQuestion" t-att-disabled="state.currentIndex === 0">Anterior</button>
                        <button t-on-click="nextQuestion" t-att-disabled="state.currentIndex === state.questions.length - 1">Siguiente</button>
                    </div>
                </div>
            </t>
        </div>
    `;

    setup() {
        this.state = useState({
            questions: [],          // Lista de preguntas
            currentQuestion: null,  // Pregunta actual
            currentIndex: 0,        // Índice de la pregunta actual
            selectedOption: null,   // Opción seleccionada por el usuario
            feedbackMessage: null,  // Mensaje de feedback
            surveyId: null,         // ID del survey
        });

        console.log("KahootSurveyRunner component initialized!");
        this.loadQuestions();
    }

    // Cargar preguntas desde el backend
    async loadQuestions() {
        try {
            const result = await rpc({
                model: "survey.survey",
                method: "search_read",
                args: [[]],  // Buscar todos los surveys (puedes filtrar por ID si necesitas uno específico)
                fields: ["id", "title", "question_ids"],
            });

            if (result.length > 0) {
                const survey = result[0];
                this.state.surveyId = survey.id;  // Almacenar el ID del survey
                const questions = await rpc({
                    model: "survey.question",
                    method: "search_read",
                    args: [[["id", "in", survey.question_ids]]],
                    fields: ["title", "suggested_answer_ids", "is_scored_question", "correct_answer_ids"],
                });

                const formattedQuestions = await Promise.all(
                    questions.map(async (question) => {
                        const options = await rpc({
                            model: "survey.label",
                            method: "search_read",
                            args: [[["id", "in", question.suggested_answer_ids]]],
                            fields: ["value"],
                        });
                        return {
                            id: question.id,
                            title: question.title,
                            options: options.map((opt) => ({
                                id: opt.id,
                                text: opt.value,
                            })),
                            isScored: question.is_scored_question,
                            correctAnswerIds: question.correct_answer_ids || [],
                        };
                    })
                );

                this.state.questions = formattedQuestions;
                if (formattedQuestions.length > 0) {
                    this.state.currentQuestion = formattedQuestions[0];
                }
            }
        } catch (error) {
            console.error("Error loading questions:", error);
        }
    }

    // Seleccionar una opción y enviar la respuesta al backend
    async selectOption(optionId) {
        this.state.selectedOption = optionId;

        // Verificar si la respuesta es correcta (si la pregunta es puntuada)
        if (this.state.currentQuestion.isScored) {
            const isCorrect = this.state.currentQuestion.correctAnswerIds.includes(optionId);
            this.state.feedbackMessage = isCorrect ? "¡Correcto!" : "Incorrecto";
        } else {
            this.state.feedbackMessage = "Respuesta registrada";
        }

        // Enviar la respuesta al backend
        try {
            await rpc({
                model: "survey.user_input",
                method: "create_answer",
                args: [{
                    survey_id: this.state.surveyId,
                    question_id: this.state.currentQuestion.id,
                    answer_id: optionId,
                }],
            });
            console.log("Answer submitted successfully!");
        } catch (error) {
            console.error("Error submitting answer:", error);
            this.state.feedbackMessage = "Error al enviar la respuesta";
        }
    }

    // Aplicar clases dinámicas a las opciones
    getOptionClass(optionId) {
        if (this.state.selectedOption === optionId) {
            if (this.state.feedbackMessage) {
                return this.state.feedbackMessage.includes("Correct") ? "selected correct" : "selected incorrect";
            }
            return "selected";
        }
        return "";
    }

    // Navegar a la pregunta siguiente
    nextQuestion() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex++;
            this.state.currentQuestion = this.state.questions[this.state.currentIndex];
            this.state.selectedOption = null;
            this.state.feedbackMessage = null;
        }
    }

    // Navegar a la pregunta anterior
    previousQuestion() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this.state.currentQuestion = this.state.questions[this.state.currentIndex];
            this.state.selectedOption = null;
            this.state.feedbackMessage = null;
        }
    }
}

// Función para montar el componente
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

// Registrar el componente
registry.category("public_components").add("kahoot_survey_runner", {
    Component: KahootSurveyRunner,
    mount: mountKahootSurveyRunner,
});

// Montar el componente al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded, calling mountKahootSurveyRunner...");
    mountKahootSurveyRunner();
});