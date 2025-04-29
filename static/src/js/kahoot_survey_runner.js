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
        this.state= useState({
            questions: [], //Lista de preguntas
            currentQuestion: null, //Pregunta actual
            currentIndex: 0, //Índice de la pregunta actual
            selectedOption: null, //Opción seleccionada por el usuario
            feedbackMessage: null, //Mensaje de feedback
            surveyId: null, //ID del survey
        });

        console.log("Componente KahootSurveyRunner inicializado");
        this.loadQuestions();
    }

    //Cargar preguntas desde el backend
    async loadQuestions() {
        try {
            console.log("descargando surveys...");
            const result = await jsonrpc("/web/dataset/call_kw/survey.survey/search_read", {
                model: "survey.survey",
                method: "search_read",
                args: [[]], //Buscar todos los surveys
                kwargs: { fields: ["id", "title", "question_ids"] },
            });

            console.log("Surveys loaded:", result);

            if (result.length > 0) {
                const survey = result[0];
                this.state.surveyId = survey.id;
                console.log("survey ID Selecionado ", this.state.surveyId);
                console.log("Descargando preguntas del survey...");
                const questions = await jsonrpc("/web/dataset/call_kw/survey.question/search_read", {
                    model: "survey.question",
                    method: "search_read",
                    args: [[["id", "in", survey.question_ids]]],
                    kwargs: { fields: ["title", "suggested_answer_ids", "is_scored_question"] },
                });

                console.log("Preguntas cargadas: ", questions);

                const formattedQuestions = await Promise.all(
                    questions.map(async (question) => {
                        console.log("Descargando las opciones de las preguntas:", question.title);
                        const options = await jsonrpc("/web/dataset/call_kw/survey.question.answer/search_read", {
                            model: "survey.question.answer",
                            method: "search_read",
                            args: [[["id", "in", question.suggested_answer_ids]]],
                            kwargs: { fields: ["value", "is_correct"] },
                        });
                        console.log("Optiones descagadas por pregunta", question.title, ":", options);
                        return {
                            id: question.id,
                            title: typeof question.title === 'object' ? question.title['en_US'] : question.title,
                            options: options.map((opt) => {
                                console.log("Mapeando las opciones:", opt);
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
                if (formattedQuestions.length > 0) {
                    this.state.currentQuestion = formattedQuestions[0];
    
                } else {
                    this.state.feedbackMessage = "No se encontraron preguntas para esta encuesta.";
                }
            } else {
                console.log("No se encontraron surveys.");
                this.state.feedbackMessage = "No se encontraron encuestas.";
            }
        } catch (error) {
            console.error("Error descargando preguntas:", error);
            if (error.data && error.data.message) {
                this.state.feedbackMessage = `Error al cargar las preguntas: ${error.data.message}`;
            } else {
                this.state.feedbackMessage = "Error al cargar las preguntas.";
            }
        }
    }

    //Seleccionar una opción y enviar la respuesta al backend
    async selectOption(ev) {
        const optionId = parseInt(ev.currentTarget.dataset.optionId);
        console.log("opcion ID seleccionada:", optionId);

        this.state.selectedOption = optionId;

        //Verificar si la opción seleccionada es correcta
        const selectedOption = this.state.currentQuestion.options.find(opt => opt.id === optionId);
        const isCorrect = selectedOption ? selectedOption.isCorrect : false;
        this.state.feedbackMessage = isCorrect ? "¡Correcto!" : "Incorrecto";

        try {
            //Buscar un survey.user_input en progreso para la encuesta actual
            let userInput = await jsonrpc("/web/dataset/call_kw/survey.user_input/search_read", {
                model: "survey.user_input",
                method: "search_read",
                args: [[["survey_id", "=", this.state.surveyId], ["state", "=", "in_progress"]]],
                kwargs: { fields: ["id"], limit: 1 },
            });

            let userInputId;
            if (userInput.length === 0) {
                //Crear un nuevo user_input si no existe
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

            //Registrar la respuesta en survey.user_input.line
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

    //Aplicar clases dinámicas a las opciones
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
    console.log("DOM comletamente cargado");
    const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
    if (placeholder) {
        console.log("Placeholder encontrado, aplicando componente.");
        mount(KahootSurveyRunner, placeholder);
        console.log("KahootSurveyRunner listo!");
    } else {
        console.error("Placeholder #kahoot-survey-runner-placeholder no eesta");
    }
});

odoo.define('theme_ninja_quiz.KahootSurveyRunner', function (require) {
    'use strict';

    const publicWidget = require('web.public.widget');
    const core = require('web.core');
    const _t = core._t;

    const KahootSurveyRunner = publicWidget.Widget.extend({
        selector: '#kahoot-survey-runner-placeholder',
        xmlDependencies: [],

        start: function () {
            console.log("KahootSurveyRunner component initialized!");
            return this._super.apply(this, arguments).then(() => {
                console.log("Loading surveys...");
                this._loadSurveys();
            });
        },

        _loadSurveys: function () {
            this._rpc({
                model: 'survey.survey',
                method: 'search_read',
                args: [[]],
                kwargs: { fields: ['id', 'title'] },
            }).then(surveys => {
                console.log("Surveys loaded:", surveys);
                if (surveys.length === 0) {
                    this.$el.html('<p>' + _t('No surveys found.') + '</p>');
                    return;
                }

                this.surveys = surveys;
                this.currentSurveyId = surveys[0].id;
                console.log("Selected survey ID:", this.currentSurveyId);

                console.log("Loading questions for survey...");
                this._loadQuestions();
            });
        },

        _loadQuestions: function () {
            this._rpc({
                model: 'survey.question',
                method: 'search_read',
                args: [[['survey_id', '=', this.currentSurveyId]]],
                kwargs: { fields: ['id', 'title', 'question_type'] },
            }).then(questions => {
                console.log("Questions loaded:", questions);
                this.questions = questions.filter(q => q.question_type === 'simple_choice');
                this.questionOptions = {};

                const promises = this.questions.map(question => {
                    console.log("Loading options for question:", question.title);
                    return this._rpc({
                        model: 'survey.question.answer',
                        method: 'search_read',
                        args: [[['question_id', '=', question.id]]],
                        kwargs: { fields: ['id', 'value', 'is_correct'] },
                    }).then(options => {
                        console.log(`Options loaded for question ${question.title}:`, options);
                        this.questionOptions[question.id] = options.map(opt => ({
                            id: opt.id,
                            text: opt.value,
                            isCorrect: opt.is_correct,
                        }));
                        console.log("Mapping option:", options);
                    });
                });

                Promise.all(promises).then(() => {
                    console.log("Formatted questions:", this.questions);
                    this.currentQuestionIndex = 0;
                    this.currentQuestion = new Proxy(this.questions[this.currentQuestionIndex] || {}, {
                        get: (target, prop) => {
                            if (prop === 'options') {
                                return this.questionOptions[target.id] || [];
                            }
                            return target[prop];
                        },
                    });

                    console.log("Current question set:", this.currentQuestion);
                    this._renderQuestion();
                    this._startTimer(); // Iniciar el temporizador al cargar la primera pregunta
                });
            });
        },

        _startTimer: function () {
            this.timeRemaining = 10; // 10 segundos por pregunta
            this.$el.find('.timer-text').text(`${this.timeRemaining} s`);
            this.$el.find('.timer-progress').css('width', '100%');

            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }

            this.timerInterval = setInterval(() => {
                this.timeRemaining -= 1;
                this.$el.find('.timer-text').text(`${this.timeRemaining} s`);
                const progressWidth = (this.timeRemaining / 10) * 100;
                this.$el.find('.timer-progress').css('width', `${progressWidth}%`);

                if (this.timeRemaining <= 0) {
                    clearInterval(this.timerInterval);
                    this._submitAnswer(null); // Pasar a la siguiente pregunta si se acaba el tiempo
                }
            }, 1000);
        },

        _renderQuestion: function () {
            if (!this.currentQuestion.id) {
                this.$el.html('<p>' + _t('No questions available.') + '</p>');
                return;
            }

            const $questionContainer = $('<div class="question-container"/>');
            $questionContainer.append(`<h3>${this.currentQuestion.title}</h3>`);

            // Agregar el contenedor del temporizador
            const $timerContainer = $('<div class="timer-container"/>');
            $timerContainer.append('<div class="timer-bar"><div class="timer-progress"></div></div>');
            $timerContainer.append('<div class="timer-text">10 s</div>');
            $questionContainer.append($timerContainer);

            const $optionsList = $('<ul class="options-list"/>');
            this.currentQuestion.options.forEach(option => {
                const $option = $(`<li><button class="option-btn" data-id="${option.id}">${option.text}</button></li>`);
                $optionsList.append($option);
            });

            $questionContainer.append($optionsList);

            if (this.feedbackMessage) {
                const $feedback = $(`<div class="feedback-message ${this.feedbackMessage.type}">${this.feedbackMessage.text}</div>`);
                $questionContainer.append($feedback);
            }

            const $navigation = $('<div class="navigation"/>');
            const $prevButton = $('<button>' + _t('Previous') + '</button>').prop('disabled', this.currentQuestionIndex === 0);
            const $nextButton = $('<button>' + _t('Next') + '</button>').prop('disabled', this.currentQuestionIndex === this.questions.length - 1);
            $navigation.append($prevButton).append($nextButton);

            $questionContainer.append($navigation);

            this.$el.empty().append($questionContainer);

            this.$el.find('.option-btn').on('click', this._onOptionClick.bind(this));
            $prevButton.on('click', this._onPreviousClick.bind(this));
            $nextButton.on('click', this._onNextClick.bind(this));
        },

        _onOptionClick: function (ev) {
            const optionId = parseInt($(ev.currentTarget).data('id'));
            console.log("Selected option ID:", optionId);
            this._submitAnswer(optionId);
        },

        _submitAnswer: function (optionId) {
            const questionId = this.currentQuestion.id;
            const userInputData = {
                survey_id: this.currentSurveyId,
                question_id: questionId,
            };

            if (optionId !== null) {
                userInputData.answer_type = 'suggestion';
                userInputData.suggested_answer_id = optionId;
            } else {
                userInputData.answer_type = 'text';
                userInputData.value_text = 'Time out';
            }

            this._rpc({
                model: 'survey.user_input',
                method: 'search_read',
                args: [[['survey_id', '=', this.currentSurveyId]]],
                kwargs: { fields: ['id'] },
            }).then(userInputs => {
                let userInputId = userInputs.length > 0 ? userInputs[0].id : null;
                if (!userInputId) {
                    return this._rpc({
                        model: 'survey.user_input',
                        method: 'create',
                        args: [{ survey_id: this.currentSurveyId }],
                    }).then(newUserInput => {
                        userInputId = newUserInput;
                        return userInputId;
                    });
                }
                return userInputId;
            }).then(userInputId => {
                return this._rpc({
                    model: 'survey.user_input.line',
                    method: 'create',
                    args: [{
                        user_input_id: userInputId,
                        question_id: questionId,
                        answer_type: userInputData.answer_type,
                        suggested_answer_id: userInputData.suggested_answer_id || null,
                        value_text: userInputData.value_text || null,
                    }],
                });
            }).then(() => {
                console.log("Answer submitted successfully!");
                const selectedOption = this.currentQuestion.options.find(opt => opt.id === optionId);
                if (optionId !== null) {
                    this.feedbackMessage = selectedOption.isCorrect
                        ? { type: 'correct', text: _t('¡Correcto!') }
                        : { type: 'incorrect', text: _t('Incorrecto') };
                    this.$el.find(`.option-btn[data-id="${optionId}"]`).addClass(selectedOption.isCorrect ? 'correct' : 'incorrect');
                }

                setTimeout(() => {
                    this._goToNextQuestion();
                }, 1000);
            });
        },

        _goToNextQuestion: function () {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex += 1;
                this.currentQuestion = new Proxy(this.questions[this.currentQuestionIndex], {
                    get: (target, prop) => {
                        if (prop === 'options') {
                            return this.questionOptions[target.id] || [];
                        }
                        return target[prop];
                    },
                });
                this.feedbackMessage = null;
                this._renderQuestion();
                this._startTimer(); // Reiniciar el temporizador para la nueva pregunta
            } else {
                this.$el.html('<p>' + _t('Quiz terminado. ¡Gracias por participar!') + '</p>');
            }
        },

        _onPreviousClick: function () {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex -= 1;
                this.currentQuestion = new Proxy(this.questions[this.currentQuestionIndex], {
                    get: (target, prop) => {
                        if (prop === 'options') {
                            return this.questionOptions[target.id] || [];
                        }
                        return target[prop];
                    },
                });
                this.feedbackMessage = null;
                this._renderQuestion();
                this._startTimer(); // Reiniciar el temporizador al cambiar de pregunta
            }
        },

        _onNextClick: function () {
            this._goToNextQuestion();
        },
    });

    publicWidget.registry.KahootSurveyRunner = KahootSurveyRunner;

    $(document).ready(function () {
        console.log("DOM fully loaded, attempting to mount KahootSurveyRunner...");
        const $placeholder = $('#kahoot-survey-runner-placeholder');
        if ($placeholder.length) {
            console.log("Placeholder found, mounting component...");
            const widget = new KahootSurveyRunner(null);
            widget.attachTo($placeholder).then(() => {
                console.log("KahootSurveyRunner mounted!");
            });
        }
    });

    return KahootSurveyRunner;
});