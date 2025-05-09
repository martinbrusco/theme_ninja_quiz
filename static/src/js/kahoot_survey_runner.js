/** @odoo-module */

import { Component, xml, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { SurveyDataService } from "./lib/SurveyDataService";
import { StateManager } from "./lib/StateManager";

export class KahootSurveyRunner extends Component {
    static template = xml`
        <div class="survey-runner">
            <t t-if="state.configParamsLoaded">
                <t t-if="!state.surveyExists">
                    <p class="feedback-message" t-out="formatText('survey_not_found', state.surveyId)"/>
                    <a href="/" class="btn-subscribe" t-out="state.configParams.back_to_home"/>
                </t>
                <t t-elif="state.questions.length === 0">
                    <p t-if="!state.feedbackMessage" t-out="state.configParams.loading_questions"/>
                    <p t-if="state.feedbackMessage" class="feedback-message">
                        <t t-out="state.feedbackMessage"/>
                        <t t-if="state.feedbackMessage.includes(state.configParams.session_expired)">
                            <br/>
                            <a t-att-href="'/web/login?redirect=/play/' + state.surveyId" t-out="state.configParams.login"/>
                        </t>
                    </p>
                </t>
                <t t-else="">
                    <div class="answer-counter">
                        <span t-out="formatText('answers_count', state.questions.filter(q => q.answered).length)"/>
                    </div>
                    <div class="progress-general">
                        <span t-out="formatText('question_progress', state.currentIndex + 1, state.questions.length)"/>
                        <div class="progress-bar-general">
                            <t t-foreach="state.questions" t-as="question" t-key="question.id">
                                <div t-att-class="'progress-segment ' + getProgressClass(question, state.currentIndex, question_index)">
                                    <span class="answered-icon" t-out="getIndicatorSymbol(question)"/>
                                </div>
                            </t>
                        </div>
                    </div>
                    <div class="progress-timer">
                        <span t-out="formatText('timer_format', state.timeLeft)"/>
                        <div class="progress-bar">
                            <div class="progress-fill" t-att-style="'width:' + (state.timeLeft / 15 * 100) + '%'"/>
                        </div>
                    </div>
                    <h3 class="question-title fade-in" t-key="state.currentIndex" t-out="state.currentQuestion ? state.currentQuestion.title : state.configParams.loading_question"/>
                    <ul class="options-list fade-in" t-key="state.currentIndex">
                        <t t-foreach="state.currentQuestion ? state.currentQuestion.options : []" t-as="option" t-key="option.id">
                            <li t-att-class="'option-' + option_index">
                                <button t-on-click="selectOption" t-att-data-option-id="option.id" t-att-class="'option-button option-' + option_index + ' ' + getOptionClass(option.id)" t-att-disabled="isOptionDisabled()">
                                    <span class="option-shape"></span>
                                    <span class="option-text" t-out="option.text"/>
                                </button>
                            </li>
                        </t>
                    </ul>
                    <t t-if="state.feedbackMessage">
                        <p class="feedback-message" t-att-class="state.feedbackMessage.includes(state.configParams.feedback_correct) ? 'correct' : 'incorrect'">
                            <t t-out="state.feedbackMessage"/>
                        </p>
                        <t t-if="hasExplanation()">
                            <p class="explanation">
                                <t t-out="state.currentQuestion.explanation"/>
                            </p>
                        </t>
                    </t>
                    <div class="navigation">
                        <button t-on-click="showPreviousMessage" t-att-class="state.currentIndex > 0 ? 'pulse' : ''" t-out="state.configParams.previous_button"/>
                        <button t-on-click="nextQuestion" t-att-disabled="state.currentIndex === state.questions.length - 1 || state.isProcessing" t-att-class="state.currentIndex === state.questions.length - 1 ? '' : 'pulse'" t-out="state.configParams.next_button"/>
                    </div>
                </t>
            </t>
            <t t-else="">
                <p>Cargando configuración...</p>
            </t>
        </div>
    `;

    setup() {
        // Inicializa el estado reactivo con los parámetros iniciales del quiz
        this.state = useState({
            surveyId: null,
            questions: [],
            currentQuestion: null,
            currentIndex: 0,
            selectedOption: null,
            feedbackMessage: null,
            timeLeft: 15,
            isProcessing: false,
            isExiting: false,
            surveyExists: false,
            configParams: {},
            configParamsLoaded: false,
            feedbackTimeout: null, // Nuevo estado para el temporizador de feedback
        });
        this.dataService = new SurveyDataService();
        this.timer = null;

        // Obtiene los datos del placeholder en el DOM y configura el surveyId
        const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
        this.state.surveyId = placeholder ? parseInt(placeholder.dataset.surveyId) : null;
        const surveyExistsRaw = placeholder ? placeholder.dataset.surveyExists : 'false';
        this.state.surveyExists = surveyExistsRaw.toLowerCase() === 'true';

        // Carga la configuración y las preguntas al montar el componente
        onMounted(async () => {
            try {
                const configParams = await this.dataService.getConfigParams();
                this.state.configParams = configParams;
                this.state.configParamsLoaded = true;

                if (this.state.surveyExists) {
                    await this.loadQuestions();
                    if (this.state.questions.length > 0) {
                        this.startTimer();
                    }
                }
            } catch (error) {
                console.error("Error al cargar la configuración o las preguntas:", error);
                this.state.feedbackMessage = this.state.configParams.feedback_config_error || "Error al cargar la configuración o las preguntas.";
                this.state.configParamsLoaded = true;
            }
        });

        // Limpia el temporizador al desmontar el componente
        onWillUnmount(() => {
            this.clearTimer();
            this.clearFeedbackTimeout();
        });
    }

    async loadQuestions() {
        // Carga las preguntas desde el backend y las inicializa en el estado
        try {
            const questions = await this.dataService.getQuestions(this.state.surveyId);
            this.state.questions = questions.map(q => ({
                ...q,
                answered: false,
                correct: false,
                skipped: false // Inicialmente no skipped
            }));
            if (questions.length > 0) {
                this.state.currentQuestion = this.state.questions[0];
                this.validateOptions();
            } else {
                this.state.feedbackMessage = this.state.configParams.feedback_no_questions || "No hay preguntas disponibles.";
            }
        } catch (error) {
            console.error("Error al cargar las preguntas:", error);
            this.state.feedbackMessage = this.state.configParams.feedback_load_questions_error || "Error al cargar las preguntas.";
        }
    }

    validateOptions() {
        // Valida que las opciones de cada pregunta tengan IDs válidos y los registra en la consola
        this.state.questions.forEach((q, index) => {
            if (!q.options || q.options.length === 0) {
                console.warn(`La pregunta ${index + 1} no tiene opciones o son inválidas.`);
            } else {
                q.options.forEach(opt => {
                    if (!opt.id || typeof opt.id !== 'number') {
                        console.error(`ID de opción inválido en la pregunta ${index + 1}:`, opt);
                        opt.id = parseInt(opt.id) || 0;
                    }
                });
                console.log(`Opciones para la pregunta ${index + 1}:`, q.options.map(opt => opt.id));
            }
        });
    }

    startTimer() {
        // Inicia el temporizador para controlar el tiempo por pregunta
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            if (this.state.timeLeft > 0) {
                this.state.timeLeft -= 1;
            } else {
                this.state.currentQuestion.skipped = true; // Marca como skipped si no se responde
                this.nextQuestion();
            }
        }, 1000);
    }

    clearTimer() {
        // Detiene y limpia el temporizador
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    clearFeedbackTimeout() {
        // Detiene y limpia el temporizador de feedback
        if (this.state.feedbackTimeout) {
            clearTimeout(this.state.feedbackTimeout);
            this.state.feedbackTimeout = null;
        }
    }

    async selectOption(ev) {
        // Maneja la selección de una opción por parte del usuario
        if (this.state.isProcessing || this.state.selectedOption !== null) return;

        const rawOptionId = ev.currentTarget.dataset.optionId;
        const optionId = parseInt(rawOptionId);
        console.log("Opción seleccionada desde el DOM:", rawOptionId, "Parseada como:", optionId);

        if (isNaN(optionId)) {
            console.error("ID de opción inválido: NaN. Elemento del evento:", ev.currentTarget);
            this.state.isProcessing = false;
            return;
        }

        this.state.selectedOption = optionId;
        this.state.isProcessing = true;
        this.clearTimer();
        await this.checkAnswer();
    }

    async checkAnswer() {
        // Verifica la respuesta seleccionada con el backend
        if (!this.state.currentQuestion || !this.state.currentQuestion.options || this.state.currentQuestion.options.length === 0) {
            console.error("La pregunta actual o sus opciones están indefinidas o vacías.");
            this.state.isProcessing = false;
            return;
        }

        console.log("Verificando respuesta. Opción seleccionada:", this.state.selectedOption);
        console.log("Opciones disponibles:", this.state.currentQuestion.options.map(opt => ({ id: opt.id, text: opt.text })));

        const selectedOption = this.state.currentQuestion.options.find(opt => opt.id === this.state.selectedOption);
        if (!selectedOption) {
            console.error("Opción seleccionada no encontrada. Opciones:", JSON.stringify(this.state.currentQuestion.options.map(opt => opt.id)));
            this.state.isProcessing = false;
            return;
        }

        try {
            const response = await this.dataService.submitAnswer(this.state.surveyId, this.state.currentQuestion.id, this.state.selectedOption);
            if (response.success) {
                this.state.currentQuestion.answered = true;
                this.state.currentQuestion.correct = response.correct;
                this.state.feedbackMessage = response.correct ? this.state.configParams.feedback_correct : this.state.configParams.feedback_incorrect;

                // Limpiar cualquier temporizador anterior y programar el siguiente
                this.clearFeedbackTimeout();
                this.state.feedbackTimeout = setTimeout(() => {
                    this.nextQuestion();
                }, 4000);
            } else {
                this.state.feedbackMessage = this.state.configParams.feedback_submit_error || "Error al procesar la respuesta.";
            }
        } catch (error) {
            console.error("Error al enviar la respuesta:", error);
            this.state.feedbackMessage = this.state.configParams.feedback_submit_error || "Error al enviar la respuesta.";
        } finally {
            this.state.isProcessing = false;
        }
    }

    nextQuestion() {
        // Avanza a la siguiente pregunta o finaliza el quiz
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex += 1;
            this.state.currentQuestion = this.state.questions[this.state.currentIndex];
            this.state.selectedOption = null;
            this.state.feedbackMessage = null;
            this.state.timeLeft = 15;
            this.state.isProcessing = false;
            this.state.isExiting = false;
            this.clearFeedbackTimeout(); // Limpiar antes de iniciar un nuevo temporizador
            this.startTimer();
        } else {
            this.state.isExiting = true;
        }
    }

    showPreviousMessage() {
        // No realiza ninguna acción, pero mantiene los efectos visuales en el template
        // (La clase 'pulse' se controla con t-att-class en el botón)
    }

    getIndicatorSymbol(question) {
        // Determina el símbolo a mostrar en el indicador de progreso según el estado de la pregunta
        if (question.skipped) {
            return this.state.configParams.icon_skipped || "?";
        }
        if (question.answered) {
            return question.correct ? this.state.configParams.icon_correct || "✓" : this.state.configParams.icon_incorrect || "X";
        }
        return ""; // No muestra nada si no está respondida ni skipped
    }

    getProgressClass(question, currentIndex, index) {
        // Determina la clase CSS para el segmento de progreso según la posición
        if (index < currentIndex) return 'past';
        if (index === currentIndex) return 'current';
        return 'future';
    }

    getOptionClass(optionId) {
        // Asigna una clase CSS a la opción seleccionada según si es correcta o incorrecta
        if (this.state.selectedOption === optionId) {
            return this.state.currentQuestion.correct ? 'correct' : 'incorrect';
        }
        return '';
    }

    isOptionDisabled() {
        // Determina si las opciones deben estar deshabilitadas
        return this.state.isProcessing || this.state.selectedOption !== null || this.state.timeLeft <= 0;
    }

    hasExplanation() {
        // Verifica si la pregunta actual tiene una explicación
        return this.state.currentQuestion && this.state.currentQuestion.explanation;
    }

    formatText(key, ...args) {
        // Formatea el texto usando parámetros de configuración
        let text = this.state.configParams[key] || '';
        args.forEach((arg, index) => {
            text = text.replace('%s', arg);
        });
        return text;
    }
}