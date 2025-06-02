odoo.define('@theme_ninja_quiz/js/kahoot_survey_runner', ['@odoo/owl'], function (require) {
    'use strict';

    const { Component, xml, useState } = require("@odoo/owl");

    console.log("KAHOOT_SURVEY_RUNNER.JS: Archivo analizado, definiendo KahootSurveyRunner ULTRA-MÍNIMO.");

    class KahootSurveyRunner extends Component {
        static template = xml`
            <div>
                <h1>KahootSurveyRunner ULTRA-MÍNIMO</h1>
                <p t-if="props.mensaje">Mensaje de Props: <t t-esc="props.mensaje"/></p>
                <p t-else="">KSR (ULTRA-MÍNIMO): props.mensaje NO recibido.</p>
                <p t-if="props.numero !== undefined">Número de Props: <t t-esc="props.numero"/></p>
                <p t-else="">KSR (ULTRA-MÍNIMO): props.numero NO recibido.</p>
                <p>Contador: <t t-esc="state.contador"/></p>
                <button t-on-click="incrementar">Incrementar</button>
            </div>
        `;

        setup(props) {
            console.log("KAHOOT_SURVEY_RUNNER.JS (ULTRA-MÍNIMO): setup() called.");
            console.log("KAHOOT_SURVEY_RUNNER.JS (ULTRA-MÍNIMO): Raw props received:", props); 
            if (props) {
                console.dir(props);
            } else {
                 console.error("KAHOOT_SURVEY_RUNNER.JS (ULTRA-MÍNIMO): Props son undefined o null.");
            }
            // Guardar props para el template si existen, o un objeto vacío si no.
            this.props = props || {}; 
            this.state = useState({ contador: (props && props.numeroInicial !== undefined) ? props.numeroInicial : 0 });
        }

        incrementar() {
            this.state.contador++;
        }
    }

    console.log("KAHOOT_SURVEY_RUNNER.JS: KahootSurveyRunner ULTRA-MÍNIMO definido. Retornando clase...");
    return KahootSurveyRunner; 
});