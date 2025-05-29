odoo.define('@theme_ninja_quiz/js/kahoot_survey_runner', ['@odoo/owl', '@theme_ninja_quiz/js/lib/SurveyDataService'], function (require) {
    'use strict';

    const { Component, xml, useState, onMounted, onWillUnmount } = require("@odoo/owl");
    const { SurveyDataService } = require("@theme_ninja_quiz/js/lib/SurveyDataService"); // Re-añadimos SurveyDataService

    console.log("KAHOOT_SURVEY_RUNNER.JS: Archivo analizado, definiendo KSR con useState y onMounted básicos.");

    class KahootSurveyRunner extends Component {
        // Mantenemos el template del MÍN
        static template = xml`
            <div>
                <h1>KahootSurveyRunner - Props Test</h1>
                <h2>Props Recibidas:</h2>
                <p t-if="props.mensaje">Prueba Mensaje: <t t-esc="props.mensaje"/></p>
                <p t-if="props.numero !== undefined">Prueba Número: <t t-esc="props.numero"/></p>
                <hr/>
                <p t-if="state.surveyId !== null">Survey ID (del estado): <t t-esc="state.surveyId"/></p>
                <p t-else="">Estado: props.surveyId NO asignado o es null.</p>
                <p t-if="state.token !== null">Token (del estado): <t t-esc="state.token"/></p>
                <p t-else="">Estado: props.token NO asignado o es null.</p>
                <p t-if="state.surveyExists !== null">Survey Exists (del estado): <t t-esc="state.surveyExists"/></p>
                <p t-else="">Estado: props.surveyExists NO asignado o es null.</p>
                <hr/>
                <p>Estado configParamsLoaded: <t t-esc="state.configParamsLoaded"/></p>
                <p>Estado isLoading: <t t-esc="state.isLoading"/></p>
                <p>Estado isError: <t t-esc="state.isError"/></p>
                <p>Estado tokenValid: <t t-esc="state.tokenValid"/></p>
            </div>
        `;

        setup(props) {
            console.log("KAHOOT_SURVEY_RUNNER.JS (v3 - con useState): setup() called.");
            console.log("KAHOOT_SURVEY_RUNNER.JS (v3 - con useState): Raw props received:", props);
            if (props) {
                console.dir(props);
            } else {
                console.error("KAHOOT_SURVEY_RUNNER.JS (v3 - con useState): Props son undefined o null.");
                
                this.state = useState({
                    isError: true, feedbackMessage: "Props no recibidas en setup",
                    surveyId: null, token: null, surveyExists: null, tokenValid: false,
                    questions: [], currentQuestion: null, currentIndex: 0, selectedOption: null,
                    timeLeft: 0, isProcessing: false, configParams: {},
                    configParamsLoaded: true, isLoading: false, feedbackTimeout: null
                });
                return; 
            }

            this.dataService = new SurveyDataService();
            
            this.state = useState({
                surveyId: (props.surveyId !== undefined && !isNaN(parseInt(props.surveyId))) ? parseInt(props.surveyId) : null,
                token: (typeof props.token === 'string') ? props.token : null,
                surveyExists: (typeof props.surveyExists === 'boolean') ? props.surveyExists : null, // Ahora esperamos un booleano
                
                
                tokenValid: false, 
                questions: [],
                currentQuestion: null,
                currentIndex: 0,
                selectedOption: null,
                feedbackMessage: null,
                timeLeft: 15,
                isProcessing: false,
                configParams: {},
                configParamsLoaded: false, //
                isLoading: true,          //
                isError: false,
                feedbackTimeout: null,
            });

            console.log("KAHOOT_SURVEY_RUNNER.JS (v3 - con useState): Estado INICIALIZADO con props:");
            console.log("this.state.surveyId:", this.state.surveyId);
            console.log("this.state.token:", this.state.token);
            console.log("this.state.surveyExists:", this.state.surveyExists);


            onMounted(async () => {
                console.log("KAHOOT_SURVEY_RUNNER.JS (v3 - con useState): onMounted() llamado.");
                
            });
    
            onWillUnmount(() => {
                console.log("KAHOOT_SURVEY_RUNNER.JS (v3 - con useState): onWillUnmount() called.");
                // this.clearTimers(); // Si tuvieras timers
            });
        }

  
        // formatText(key, ...args) { /* ... */ }
        // getIndicatorSymbol(question) { /* ... */ }
        // getProgressClass(question, currentIndex, questionIndex) { /* ... */ }
        // getOptionClass(optionId) { /* ... */ }
        // isOptionDisabled() { /* ... */ }
        // hasExplanation() { /* ... */ }
    }

    console.log("KAHOOT_SURVEY_RUNNER.JS: KahootSurveyRunner (v3 - con useState) definido. Retornando clase...");
    return KahootSurveyRunner;
});