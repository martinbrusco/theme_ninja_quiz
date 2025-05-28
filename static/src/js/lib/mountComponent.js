// theme_ninja_quiz/static/src/js/lib/mountComponent.js

console.log("MOUNTCOMPONENT.JS: (Log 1) El archivo está siendo analizado por el navegador.");

odoo.define('@theme_ninja_quiz/js/lib/mountComponent', ['@odoo/owl', '@theme_ninja_quiz/js/kahoot_survey_runner'], function(require) {
    'use strict';

    console.log("MOUNTCOMPONENT.JS: (Log 2) Callback de odoo.define iniciado.");

    const { mount } = require("@odoo/owl");
    const { KahootSurveyRunner } = require("@theme_ninja_quiz/js/kahoot_survey_runner"); 

    console.log("MOUNTCOMPONENT.JS: (Log 3) Owl mount:", mount, "KahootSurveyRunner:", KahootSurveyRunner);

    function tryMountComponent() {
        console.log("MOUNTCOMPONENT.JS: (Log TryMount) tryMountComponent() INVOCADA.");
        const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
        
        if (placeholder) {
            console.log("MOUNTCOMPONENT.JS: (Log 5 - TryMount) Placeholder ENCONTRADO:", placeholder);
            console.log("MOUNTCOMPONENT.JS: (Log 5b - TryMount) Contenido actual del placeholder:", placeholder.innerHTML);
            console.log("MOUNTCOMPONENT.JS: (Log 5c - TryMount) Atributos de datos del placeholder:", JSON.parse(JSON.stringify(placeholder.dataset)));

            const surveyIdAttr = placeholder.dataset.surveyId;
            const tokenAttr = placeholder.dataset.token;
            const surveyExistsAttr = placeholder.dataset.surveyExists;

            if (surveyIdAttr && tokenAttr && typeof surveyExistsAttr !== 'undefined') {
                console.log("MOUNTCOMPONENT.JS: (Log 6 - TryMount) Placeholder tiene surveyId, token y surveyExists. surveyExistsAttr:", surveyExistsAttr);
                
                if (!placeholder.classList.contains('owl-mounted') && !placeholder.dataset.owlMounting) {
                    console.log("MOUNTCOMPONENT.JS: (Log 7 - TryMount) Intentando llamar a mount(KahootSurveyRunner, placeholder)...");
                    placeholder.dataset.owlMounting = 'true'; 
                    try {
                        if (typeof KahootSurveyRunner !== 'function') { 
                             console.error("MOUNTCOMPONENT.JS: (Log 7b - TryMount) ¡KahootSurveyRunner NO es una función/clase válida!", KahootSurveyRunner);
                             delete placeholder.dataset.owlMounting;
                             return; 
                        }

                        const surveyProps = {
                            surveyId: parseInt(surveyIdAttr),
                            token: tokenAttr,
                            surveyExists: surveyExistsAttr.toLowerCase() === 'true'
                        };
                        console.log("MOUNTCOMPONENT.JS: (Log 7c - TryMount) Props a pasar:", surveyProps);

                        mount(KahootSurveyRunner, placeholder, { props: surveyProps }); 
                        
                        console.log("MOUNTCOMPONENT.JS: (Log 8 - TryMount) LLAMADA a mount(KahootSurveyRunner, placeholder) REALIZADA con props.");
                        placeholder.classList.add('owl-mounted'); 
                        delete placeholder.dataset.owlMounting;

                    } catch (err) {
                        console.error("MOUNTCOMPONENT.JS: (Log 9 - TryMount) ERROR DIRECTO DE mount() o en el setup/render inicial del componente:", err);
                        delete placeholder.dataset.owlMounting;
                    }
                } else {
                    console.log("MOUNTCOMPONENT.JS: (Log 10 - TryMount) KahootSurveyRunner ya montado o montaje en progreso.");
                }
            } else {
                console.warn("MOUNTCOMPONENT.JS: (Log 11 - TryMount) Placeholder encontrado, pero FALTA data-survey-id, data-token o data-survey-exists.", placeholder.dataset);
            }
        } else {
            console.log("MOUNTCOMPONENT.JS: (Log 12 - TryMount) Placeholder #kahoot-survey-runner-placeholder NO encontrado en este intento.");
        }
    }

    console.log("MOUNTCOMPONENT.JS: (Log MainCall) Programando tryMountComponent con un setTimeout de 2000ms.");
    setTimeout(() => {
        console.log("MOUNTCOMPONENT.JS: (Log MainCall) --- setTimeout de 2000ms DISPARADO --- Llamando a tryMountComponent.");
        try {
            tryMountComponent();
        } catch (e) {
            console.error("MOUNTCOMPONENT.JS: (Log MainCall) ERROR DENTRO del setTimeout al llamar a tryMountComponent:", e);
        }
    }, 2000);

    console.log("MOUNTCOMPONENT.JS: (Log 16) Fin del callback de odoo.define.");
    return {}; 
});

console.log("MOUNTCOMPONENT.JS: (Log 17) Fin del análisis del archivo por el navegador.");