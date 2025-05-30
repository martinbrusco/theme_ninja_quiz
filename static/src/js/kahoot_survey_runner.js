

odoo.define('@theme_ninja_quiz/js/kahoot_survey_runner', ['@odoo/owl', '@theme_ninja_quiz/js/lib/SurveyDataService', '@theme_ninja_quiz/js/lib/StateManager'], function (require) {
    'use strict';
    const { Component, xml, useState, onMounted, onWillUnmount } = require("@odoo/owl");
    const { SurveyDataService } = require("@theme_ninja_quiz/js/lib/SurveyDataService");
    const { StateManager } = require("@theme_ninja_quiz/js/lib/StateManager");

    console.log('KAHOOT_SURVEY_RUNNER.JS: Defining KahootSurveyRunner component');
    class KahootSurveyRunner extends Component {
        static template = "theme_ninja_quiz.KahootSurveyRunner";

        setup() {
            this.state = StateManager.initState();
            this.surveyDataService = new SurveyDataService();
            this.state.surveyId = this.props.surveyId;
            this.state.surveyExists = this.props.surveyExists;
            this.state.token = this.props.token;

            // Temporizador
            this.timerInterval = null;

            onMounted(async () => {
                console.log('KAHOOT_SURVEY_RUNNER.JS: Component mounted, loading data');
                try {
                    // Cargar parámetros de configuración
                    const configParams = await this.surveyDataService.getConfigParams();
                    this.state.configParams = configParams;
                    this.state.configParamsLoaded = true;

                    if (this.state.surveyExists) {
                        // Cargar preguntas
                        const response = await this.surveyDataService.getQuestions(this.state.surveyId, this.state.token);
                        if (response.success) {
                            this.state.questions = response.questions;
                            this.state.currentQuestion = response.questions[0] || null;
                            this.startTimer();
                        } else {
                            this.state.feedbackMessage = response.error;
                        }
                    } else {
                        this.state.feedbackMessage = configParams.survey_not_found.replace('%s', this.state.surveyId);
                    }
                } catch (error) {
                    console.error('KAHOOT_SURVEY_RUNNER.JS: Error loading survey data:', error);
                    this.state.feedbackMessage = this.state.configParams.feedback_load_questions_error || 'Error loading survey';
                }
            });

            onWillUnmount(() => {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }
            });

            this.selectOption = this.selectOption.bind(this);
            this.nextQuestion = this.nextQuestion.bind(this);
            this.prevQuestion = this.prevQuestion.bind(this);
        }

        startTimer() {
            if (this.state.currentQuestion && !this.state.currentQuestion.answered) {
                this.state.timeLeft = 15; // 15 segundos por pregunta
                this.timerInterval = setInterval(() => {
                    if (this.state.timeLeft > 0) {
                        this.state.timeLeft--;
                    } else {
                        clearInterval(this.timerInterval);
                        this.state.feedbackMessage = this.state.configParams.feedback_timeout;
                        this.state.currentQuestion.answered = true;
                    }
                }, 1000);
            }
        }

        async selectOption(ev) {
            if (this.state.isProcessing || this.state.currentQuestion.answered) return;
            const optionId = ev.currentTarget.dataset.optionId;
            this.state.isProcessing = true;
            this.state.selectedOption = optionId;

            try {
                const response = await this.surveyDataService.submitAnswer(
                    this.state.surveyId,
                    this.state.currentQuestion.id,
                    optionId,
                    this.state.token
                );
                if (response.success) {
                    this.state.feedbackMessage = response.correct
                        ? this.state.configParams.feedback_correct
                        : this.state.configParams.feedback_incorrect;
                    this.state.currentQuestion.answered = true;
                    this.state.currentQuestion.correct = response.correct;
                    clearInterval(this.timerInterval);
                } else {
                    this.state.feedbackMessage = response.error;
                }
            } catch (error) {
                console.error('KAHOOT_SURVEY_RUNNER.JS: Error submitting answer:', error);
                this.state.feedbackMessage = this.state.configParams.feedback_submit_error;
            } finally {
                this.state.isProcessing = false;
            }
        }

        nextQuestion() {
            const currentIndex = this.state.currentIndex;
            if (currentIndex < this.state.questions.length - 1) {
                this.state.currentIndex = currentIndex + 1;
                this.state.currentQuestion = this.state.questions[currentIndex + 1];
                this.state.feedbackMessage = null;
                this.state.selectedOption = null;
                clearInterval(this.timerInterval);
                this.startTimer();
            }
        }

        prevQuestion() {
            const currentIndex = this.state.currentIndex;
            if (currentIndex > 0) {
                this.state.currentIndex = currentIndex - 1;
                this.state.currentQuestion = this.state.questions[currentIndex - 1];
                this.state.feedbackMessage = null;
                this.state.selectedOption = null;
                clearInterval(this.timerInterval);
                this.startTimer();
            }
        }

        formatText(key, ...args) {
            let text = this.state.configParams[key] || '';
            args.forEach((arg, index) => {
                text = text.replace(`%${index + 1}`, arg);
            });
            return text;
        }
    }

    console.log('KAHOOT_SURVEY_RUNNER.JS: KahootSurveyRunner component defined');
    return KahootSurveyRunner;
});