odoo.define('@theme_ninja_quiz/js/kahoot_survey_runner', ['@odoo/owl', '@theme_ninja_quiz/js/lib/SurveyDataService'], function (require) {
    'use strict';

    const { Component, xml, useState, onMounted, onWillUnmount } = require("@odoo/owl");
    const { SurveyDataService } = require("@theme_ninja_quiz/js/lib/SurveyDataService");

    class KahootSurveyRunner extends Component {
        static template = xml`
            <div class="survey-runner">
                <t t-if="state.configParamsLoaded">
                    <t t-if="!state.tokenValid">
                        <p class="feedback-message incorrect" t-out="(state.configParams &amp;&amp; state.configParams.invalid_token) || 'Token no válido o expirado.'"/>
                        <a href="/" class="btn-subscribe" t-out="(state.configParams &amp;&amp; state.configParams.back_to_home) || 'Volver al Inicio'"/>
                    </t>
                    <t t-elif="!state.surveyExists">
                        <p class="feedback-message" t-out="formatText('survey_not_found', state.surveyId || 'IDdesconocido')"/>
                        <a href="/" class="btn-subscribe" t-out="(state.configParams &amp;&amp; state.configParams.back_to_home) || 'Volver al Inicio'"/>
                    </t>
                    <t t-elif="state.isError">
                        <p class="feedback-message incorrect" t-out="state.feedbackMessage || 'Ha ocurrido un error.'"/>
                         <a href="/" class="btn-subscribe" t-out="(state.configParams &amp;&amp; state.configParams.back_to_home) || 'Volver al Inicio'"/>
                    </t>
                    <t t-elif="state.isLoading &amp;&amp; state.questions.length === 0">
                        <p t-out="state.feedbackMessage || (state.configParams &amp;&amp; state.configParams.loading_questions) || 'Cargando preguntas...'"/>
                    </t>
                    <t t-elif="state.questions.length === 0 &amp;&amp; !state.isLoading">
                        <p class="feedback-message" t-out="state.feedbackMessage || (state.configParams &amp;&amp; state.configParams.feedback_no_questions) || 'No hay preguntas disponibles para esta encuesta.'"/>
                        <a href="/" class="btn-subscribe" t-out="(state.configParams &amp;&amp; state.configParams.back_to_home) || 'Volver al Inicio'"/>
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
                        <h3 class="question-title fade-in" t-key="state.currentIndex" t-out="state.currentQuestion ? state.currentQuestion.title : (state.configParams &amp;&amp; state.configParams.loading_question)"/>
                        <ul class="options-list fade-in" t-key="state.currentIndex">
                            <t t-foreach="state.currentQuestion ? state.currentQuestion.options : []" t-as="option" t-key="option.id">
                                <li t-att-class="'option-' + option_index">
                                    <button t-on-click.prevent="(ev) => selectOption(ev)" t-att-data-option-id="option.id" t-att-class="'option-button option-' + option_index + ' ' + getOptionClass(option.id)" t-att-disabled="isOptionDisabled()">
                                        <span class="option-shape"></span>
                                        <span class="option-text" t-out="option.text"/>
                                    </button>
                                </li>
                            </t>
                        </ul>
                        <t t-if="state.feedbackMessage &amp;&amp; state.selectedOption !== null">
                            <p class="feedback-message" 
                               t-att-class="(state.currentQuestion &amp;&amp; state.currentQuestion.correct) ? 'correct' : 'incorrect'">
                                <t t-out="state.feedbackMessage"/>
                            </p>
                            <t t-if="hasExplanation()">
                                <p class="explanation">
                                    <t t-out="state.currentQuestion.explanation"/>
                                </p>
                            </t>
                        </t>
                    </t>
                </t>
                <t t-else="">
                    <p>Cargando configuración inicial del componente...</p>
                </t>
            </div>
        `;
    
        setup(props) {
            console.log("KAHOOT_SURVEY_RUNNER.JS: setup() called.");
            console.log("KAHOOT_SURVEY_RUNNER.JS: Raw props received in setup:", props); 
            if (props) {
                console.log("KAHOOT_SURVEY_RUNNER.JS: Props object IS defined. Keys:", Object.keys(props));
                console.log("KAHOOT_SURVEY_RUNNER.JS: Props content --> surveyId:", props.surveyId, "token:", props.token, "surveyExists:", props.surveyExists);
            } else {
                console.error("KAHOOT_SURVEY_RUNNER.JS: ¡ERROR CRÍTICO! Props son undefined o null en setup().");
                this.state = useState({ 
                    isError: true, 
                    feedbackMessage: "Error interno: Props no recibidas por el componente.", 
                    configParamsLoaded: true, 
                    isLoading: false, 
                    questions:[],
                    surveyId: null, token: null, surveyExists: false, tokenValid: false, 
                    currentQuestion: null, currentIndex: 0, selectedOption: null, timeLeft:0,
                    configParams: {}, isProcessing: false, feedbackTimeout: null
                });
                return; 
            }

            this.dataService = new SurveyDataService();
            this.state = useState({
                surveyId: (props && typeof props.surveyId === 'number') ? props.surveyId : null,
                token: (props && typeof props.token === 'string') ? props.token : null,
                surveyExists: (props && typeof props.surveyExists === 'boolean') ? props.surveyExists : false,
                tokenValid: false, 
                questions: [],
                currentQuestion: null,
                currentIndex: 0,
                selectedOption: null,
                feedbackMessage: null,
                timeLeft: 15,
                isProcessing: false,
                configParams: {},
                configParamsLoaded: false,
                isLoading: true,
                isError: false,
                feedbackTimeout: null,
            });
            
            console.log("KAHOOT_SURVEY_RUNNER.JS: Estado inicial después de procesar props - surveyId:", this.state.surveyId, "token:", this.state.token, "surveyExists:", this.state.surveyExists);

            if (this.state.surveyId === null || this.state.token === null || typeof this.state.surveyExists !== 'boolean') {
                 console.error("KAHOOT_SURVEY_RUNNER.JS: surveyId, token o surveyExists no se inicializaron correctamente desde props.");
                 this.state.feedbackMessage = "Error de inicialización: faltan datos esenciales del juego.";
                 this.state.isError = true;
                 this.state.isLoading = false;
                 this.state.configParamsLoaded = true;
            }

            onMounted(async () => {
                console.log("KAHOOT_SURVEY_RUNNER.JS: onMounted() called. Current state (stringified):", JSON.stringify(this.state));
                if (this.state.isError || !this.state.surveyId || !this.state.token) {
                    console.log("KAHOOT_SURVEY_RUNNER.JS: onMounted - Bailing due to error state or missing surveyId/token from setup.");
                    this.state.isLoading = false; 
                    this.state.configParamsLoaded = true; 
                    return;
                }
    
                try {
                    console.log("KAHOOT_SURVEY_RUNNER.JS: onMounted - Attempting to load config params...");
                    const configParams = await this.dataService.getConfigParams();
                    this.state.configParams = configParams;
                    this.state.configParamsLoaded = true; 
                    console.log("KAHOOT_SURVEY_RUNNER.JS: onMounted - Config params loaded:", this.state.configParams);
    
                    if (!this.state.surveyExists) {
                        console.warn("KAHOOT_SURVEY_RUNNER.JS: onMounted - Survey does not exist (según props).");
                        this.state.feedbackMessage = this.formatText('survey_not_found', String(this.state.surveyId));
                        this.state.isLoading = false;
                        this.state.isError = true; 
                        return;
                    }
                    
                    this.state.tokenValid = true; 
                    
                    if (this.state.tokenValid) { 
                        console.log("KAHOOT_SURVEY_RUNNER.JS: onMounted - Token considerado válido. Attempting to load questions...");
                        this.state.feedbackMessage = (this.state.configParams && this.state.configParams.loading_questions) || "Cargando preguntas...";
                        this.state.isLoading = true; 
                        await this.loadQuestions();
                    } else { 
                        this.state.feedbackMessage = (this.state.configParams && this.state.configParams.invalid_token) || "Token inválido (lógica interna onMounted).";
                        this.state.isLoading = false;
                        this.state.isError = true;
                    }
                } catch (error) {
                    console.error("KAHOOT_SURVEY_RUNNER.JS: onMounted - Error in main try block:", error);
                    this.state.feedbackMessage = (this.state.configParams && this.state.configParams.feedback_config_error) || "Error crítico al cargar la configuración del juego.";
                    this.state.isError = true;
                    this.state.isLoading = false;
                    this.state.configParamsLoaded = true;
                }
            });
    
            onWillUnmount(() => {
                console.log("KAHOOT_SURVEY_RUNNER.JS: onWillUnmount() called. Clearing timers.");
                this.clearTimers();
            });
        }
        
        async loadQuestions() {
            console.log("KAHOOT_SURVEY_RUNNER.JS: loadQuestions() called for surveyId:", this.state.surveyId);
            this.state.isLoading = true;
            this.state.isError = false; 
            try {
                const surveyDataResponse = await this.dataService.getQuestions(this.state.surveyId, this.state.token);
                console.log("KAHOOT_SURVEY_RUNNER.JS: Data received from getQuestions (dataService):", JSON.parse(JSON.stringify(surveyDataResponse)));
                
                if (surveyDataResponse && surveyDataResponse.success && surveyDataResponse.questions && surveyDataResponse.questions.length > 0) {
                    this.state.questions = surveyDataResponse.questions.map(q => ({
                        ...q,
                        answered: false, 
                        correct: false,
                        skipped: false
                    }));
                    this.state.currentIndex = 0;
                    this.state.currentQuestion = this.state.questions[0];
                    this.state.selectedOption = null;
                    this.state.feedbackMessage = null; 
                    console.log("KAHOOT_SURVEY_RUNNER.JS: Questions processed. Current question:", JSON.parse(JSON.stringify(this.state.currentQuestion)));
                    this.startQuestionTimer();
                } else {
                    this.state.questions = [];
                    this.state.feedbackMessage = (surveyDataResponse && surveyDataResponse.error) || (this.state.configParams && this.state.configParams.feedback_no_questions) || "No hay preguntas disponibles.";
                    console.warn("KAHOOT_SURVEY_RUNNER.JS: No questions in surveyData or surveyData.questions is empty. Server error message:", (surveyDataResponse && surveyDataResponse.error));
                    if (!surveyDataResponse || !surveyDataResponse.success) {
                        this.state.isError = true; 
                    }
                }
            } catch (error) {
                console.error("KAHOOT_SURVEY_RUNNER.JS: Error loading questions in loadQuestions():", error);
                this.state.feedbackMessage = (this.state.configParams && this.state.configParams.feedback_load_questions_error) || "Error al cargar las preguntas.";
                this.state.isError = true;
            } finally {
                this.state.isLoading = false;
                console.log("KAHOOT_SURVEY_RUNNER.JS: loadQuestions() finished. isLoading:", this.state.isLoading, "isError:", this.state.isError, "feedback:", this.state.feedbackMessage);
            }
        }
    
        async selectOption(ev) {
            console.log("KAHOOT_SURVEY_RUNNER.JS: selectOption called. Event target:", ev.currentTarget);
            if (this.state.isProcessing || this.state.selectedOption !== null || this.state.timeLeft <= 0) {
                console.log("KAHOOT_SURVEY_RUNNER.JS: selectOption - processing, already selected, or time up. Bailing.");
                return;
            }
    
            const rawOptionId = ev.currentTarget.dataset.optionId;
            const optionId = parseInt(rawOptionId);
            console.log("KAHOOT_SURVEY_RUNNER.JS: Option ID from dataset:", rawOptionId, "Parsed as:", optionId);
    
            if (isNaN(optionId)) {
                console.error("KAHOOT_SURVEY_RUNNER.JS: Invalid option ID (NaN). Element:", ev.currentTarget);
                return;
            }
    
            this.state.selectedOption = optionId;
            this.state.isProcessing = true;
            this.clearTimers(); 
            console.log("KAHOOT_SURVEY_RUNNER.JS: Option selected, state.selectedOption:", this.state.selectedOption, "isProcessing:", this.state.isProcessing);
            await this.checkAnswer();
        }
    
        async checkAnswer() {
            console.log("KAHOOT_SURVEY_RUNNER.JS: checkAnswer() called for optionId:", this.state.selectedOption);
            if (!this.state.currentQuestion || !this.state.currentQuestion.options || this.state.currentQuestion.options.length === 0) {
                console.error("KAHOOT_SURVEY_RUNNER.JS: checkAnswer - currentQuestion or its options are undefined/empty.");
                this.state.isProcessing = false;
                return;
            }
            
            try {
                const response = await this.dataService.submitAnswer(
                    this.state.surveyId,
                    this.state.currentQuestion.id,
                    this.state.selectedOption,
                    this.state.token
                );
                console.log("KAHOOT_SURVEY_RUNNER.JS: Response from submitAnswer:", response);
    
                if (response.success) {
                    this.state.currentQuestion.answered = true;
                    this.state.currentQuestion.correct = response.correct; 
                    this.state.feedbackMessage = response.correct ? 
                        (this.state.configParams.feedback_correct || "¡Correcto!") : 
                        (this.state.configParams.feedback_incorrect || "Incorrecto");
                    
                    if (this.state.feedbackTimeout) clearTimeout(this.state.feedbackTimeout);
                    this.state.feedbackTimeout = setTimeout(() => {
                        console.log("KAHOOT_SURVEY_RUNNER.JS: Feedback timeout, calling nextQuestion().");
                        this.nextQuestion();
                    }, 4000); 
                } else {
                    this.state.feedbackMessage = response.error || (this.state.configParams.feedback_submit_error || "Error al procesar la respuesta.");
                }
            } catch (error) {
                console.error("KAHOOT_SURVEY_RUNNER.JS: Error in checkAnswer's try block (calling submitAnswer):", error);
                this.state.feedbackMessage = (this.state.configParams && this.state.configParams.feedback_submit_error) || "Error al enviar la respuesta.";
            } finally {
                this.state.isProcessing = false;
                console.log("KAHOOT_SURVEY_RUNNER.JS: checkAnswer() finished. isProcessing:", this.state.isProcessing);
            }
        }
    
        nextQuestion() {
            console.log("KAHOOT_SURVEY_RUNNER.JS: nextQuestion() called. Current index:", this.state.currentIndex);
            this.clearTimers(); 
    
            if (this.state.currentIndex < this.state.questions.length - 1) {
                this.state.currentIndex += 1;
                this.state.currentQuestion = this.state.questions[this.state.currentIndex];
                this.state.selectedOption = null;
                this.state.feedbackMessage = null; 
                this.state.isProcessing = false; 
                console.log("KAHOOT_SURVEY_RUNNER.JS: Moving to next question, index:", this.state.currentIndex, "New question:", JSON.parse(JSON.stringify(this.state.currentQuestion)));
                this.startQuestionTimer();
            } else {
                console.log("KAHOOT_SURVEY_RUNNER.JS: End of survey reached.");
                this.state.feedbackMessage = "¡Has completado el quiz!"; 
            }
        }
    
        startQuestionTimer() {
            console.log("KAHOOT_SURVEY_RUNNER.JS: startQuestionTimer() called.");
            this.clearTimers(); 
            this.state.timeLeft = 15; 
    
            this.timer = setInterval(() => {
                if (this.state.isProcessing) return; 
                if (this.state.timeLeft > 0) {
                    this.state.timeLeft -= 1;
                } else {
                    console.log("KAHOOT_SURVEY_RUNNER.JS: Time ran out for question index", this.state.currentIndex);
                    if (this.state.currentQuestion && !this.state.currentQuestion.answered) {
                        this.state.currentQuestion.skipped = true; 
                        this.state.currentQuestion.answered = true; 
                        this.state.feedbackMessage = "¡Tiempo agotado!"; 
                    }
                    if (this.state.feedbackTimeout) clearTimeout(this.state.feedbackTimeout);
                    this.state.feedbackTimeout = setTimeout(() => {
                        this.nextQuestion(); 
                    }, 2000); 
                }
            }, 1000);
            console.log("KAHOOT_SURVEY_RUNNER.JS: Timer started with interval ID:", this.timer);
        }
    
        clearTimers() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            if (this.state.feedbackTimeout) {
                clearTimeout(this.state.feedbackTimeout);
                this.state.feedbackTimeout = null;
            }
        }
    
        getIndicatorSymbol(question) {
            if (!this.state.configParamsLoaded) return "";
            if (question.skipped) {
                return this.state.configParams.icon_skipped || "?";
            }
            if (question.answered) { 
                return question.correct ? (this.state.configParams.icon_correct || "✓") : (this.state.configParams.icon_incorrect || "X");
            }
            return "";
        }
    
        getProgressClass(question, currentIndex, questionIndex) {
            if (questionIndex < currentIndex) { 
                 return question.correct ? 'answered correct-segment' : 'answered incorrect-segment';
            }
            if (questionIndex === currentIndex) return 'current';
            return 'future';
        }
    
        getOptionClass(optionId) {
            if (this.state.selectedOption === optionId) {
                if (this.state.currentQuestion && this.state.currentQuestion.answered && this.state.currentQuestion.options.find(o => o.id === optionId)) {
                     if (this.state.currentQuestion.correct) return 'correct'; 
                     else return 'incorrect'; 
                }
                return 'selected'; 
            }
            return '';
        }
    
        isOptionDisabled() {
            return this.state.isProcessing || this.state.selectedOption !== null || this.state.timeLeft <= 0;
        }
    
        hasExplanation() {
            return this.state.currentQuestion && this.state.currentQuestion.explanation && this.state.currentQuestion.answered;
        }
    
        formatText(key, ...args) {
            if (!this.state.configParamsLoaded || !this.state.configParams[key]) {
                let fallbackText = key;
                args.forEach(arg => fallbackText += ` ${String(arg)}`);
                return fallbackText;
            }
            let text = this.state.configParams[key];
            args.forEach((arg) => {
                text = text.replace('%s', String(arg)); 
            });
            return text;
        }
    }

    return { KahootSurveyRunner };
});