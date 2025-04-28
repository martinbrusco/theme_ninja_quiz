/** @odoo-module **/

import { Component, useState, xml, mount } from "@odoo/owl";
import { jsonrpc } from "@web/core/network/rpc_service";

// Componente OWL para el quiz
class KahootSurveyRunner extends Component {
    static template = xml`
        <div class="survey-runner">
            <h2>Bienvenido al Quiz</h2>
            <t t-if="state.questions.length === 0">
                <p t-if="!state.feedbackMessage">¡Cargando preguntas...</p>
                <p t-if="state.feedbackMessage" class="feedback-message">
                    <t t-esc="state.feedbackMessage"/>
                </p>
            </t>
            <t t-else="">
                <div class="question-container">
                    <h3 t-esc="state.currentQuestion.title"/>
                    <ul class="options-list">
                        <t t-foreach="state.currentQuestion.options" t-as="option" t-key="option.id">
                            <li>
                                <button t-on-click="selectOption" t-att-data-option-id="option.id" t-att-class="getOptionClass(option.id)">
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
            questions: [], // Lista de preguntas
            currentQuestion: null, // Pregunta actual
            currentIndex: 0, // Índice de la pregunta actual
            selectedOption: null, // Opción seleccionada por el usuario
            feedbackMessage: null, // Mensaje de feedback
            surveyId: null, // ID del survey
        });

        console.log("KahootSurveyRunner component initialized!");
        this.loadQuestions();
    }

    // Cargar preguntas desde el backend
    async loadQuestions() {
        try {
            console.log("Loading surveys...");
            const result = await jsonrpc("/web/dataset/call_kw/survey.survey/search_read", {
                model: "survey.survey",
                method: "search_read",
                args: [[]], // Buscar todos los surveys
                kwargs: { fields: ["id", "title", "question_ids"] },
            });

            console.log("Surveys loaded:", result);

            if (result.length > 0) {
                const survey = result[0];
                this.state.surveyId = survey.id;
                console.log("Selected survey ID:", this.state.surveyId);
                console.log("Loading questions for survey...");
                const questions = await jsonrpc("/web/dataset/call_kw/survey.question/search_read", {
                    model: "survey.question",
                    method: "search_read",
                    args: [[["id", "in", survey.question_ids]]],
                    kwargs: { fields: ["title", "suggested_answer_ids", "is_scored_question"] },
                });

                console.log("Questions loaded:", questions);

                const formattedQuestions = await Promise.all(
                    questions.map(async (question) => {
                        console.log("Loading options for question:", question.title);
                        const options = await jsonrpc("/web/dataset/call_kw/survey.question.answer/search_read", {
                            model: "survey.question.answer",
                            method: "search_read",
                            args: [[["id", "in", question.suggested_answer_ids]]],
                            kwargs: { fields: ["value", "is_correct"] },
                        });
                        console.log("Options loaded for question", question.title, ":", options);
                        return {
                            id: question.id,
                            title: typeof question.title === 'object' ? question.title['en_US'] : question.title,
                            options: options.map((opt) => {
                                console.log("Mapping option:", opt);
                                return {
                                    id: opt.id,
                                    text: typeof opt.value === 'object' ? opt.value['en_US'] : opt.value,
                                    isCorrect: opt.is_correct || false,
                                };
                            }),
                            isScored: question.is_scored_question,
                        };
                    })
                );

                this.state.questions = formattedQuestions;
                console.log("Formatted questions:", formattedQuestions);
                if (formattedQuestions.length > 0) {
                    this.state.currentQuestion = formattedQuestions[0];
                    console.log("Current question set:", this.state.currentQuestion);
                } else {
                    this.state.feedbackMessage = "No se encontraron preguntas para esta encuesta.";
                }
            } else {
                console.log("No surveys found.");
                this.state.feedbackMessage = "No se encontraron encuestas.";
            }
        } catch (error) {
            console.error("Error loading questions:", error);
            if (error.data && error.data.message) {
                this.state.feedbackMessage = `Error al cargar las preguntas: ${error.data.message}`;
            } else {
                this.state.feedbackMessage = "Error al cargar las preguntas.";
            }
        }
    }

    // Seleccionar una opción y enviar la respuesta al backend
    async selectOption(ev) {
        const optionId = parseInt(ev.currentTarget.dataset.optionId);
        console.log("Selected option ID:", optionId);

        this.state.selectedOption = optionId;

        // Verificar si la opción seleccionada es correcta
        const selectedOption = this.state.currentQuestion.options.find(opt => opt.id === optionId);
        const isCorrect = selectedOption ? selectedOption.isCorrect : false;
        this.state.feedbackMessage = isCorrect ? "¡Correcto!" : "Incorrecto";

        try {
            // Buscar un survey.user_input en progreso para la encuesta actual
            let userInput = await jsonrpc("/web/dataset/call_kw/survey.user_input/search_read", {
                model: "survey.user_input",
                method: "search_read",
                args: [[["survey_id", "=", this.state.surveyId], ["state", "=", "in_progress"]]],
                kwargs: { fields: ["id"], limit: 1 },
            });

            let userInputId;
            if (userInput.length === 0) {
                // Crear un nuevo user_input si no existe
                userInput = await jsonrpc("/web/dataset/call_kw/survey.user_input/create", {
                    model: "survey.user_input",
                    method: "create",
                    args: [{
                        survey_id: this.state.surveyId,
                        state: "in_progress",
                    }],
                    kwargs: {},
                });
                userInputId = userInput;
            } else {
                userInputId = userInput[0].id;
            }

            // Registrar la respuesta en survey.user_input.line
            await jsonrpc("/web/dataset/call_kw/survey.user_input.line/create", {
                model: "survey.user_input.line",
                method: "create",
                args: [{
                    user_input_id: userInputId,
                    question_id: this.state.currentQuestion.id,
                    answer_type: "suggestion",
                    suggested_answer_id: optionId,
                }],
                kwargs: {},
            });

            console.log("Answer submitted successfully!");
        } catch (error) {
            console.error("Error submitting answer:", error);
            let errorMessage = "Error al enviar la respuesta";
            if (error.data && error.data.message) {
                errorMessage += `: ${error.data.message}`;
            }
            this.state.feedbackMessage = errorMessage;
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

// Montar el componente manualmente
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded, attempting to mount KahootSurveyRunner...");
    const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
    if (placeholder) {
        console.log("Placeholder found, mounting component...");
        mount(KahootSurveyRunner, placeholder);
        console.log("KahootSurveyRunner mounted!");
    } else {
        console.error("Placeholder #kahoot-survey-runner-placeholder not found!");
    }
});