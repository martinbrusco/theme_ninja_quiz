// theme_ninja_quiz/static/src/js/lib/mountComponent.js

console.log("MOUNTCOMPONENT.JS: (Log 1) El archivo está siendo analizado por el navegador.");

odoo.define('@theme_ninja_quiz/js/lib/mountComponent', ['@odoo/owl', '@theme_ninja_quiz/js/kahoot_survey_runner'], function(require) {
    'use strict';

    console.log("MOUNTCOMPONENT.JS: (Log 2) Callback de odoo.define iniciado.");

    const { mount } = require("@odoo/owl");
    // Importación directa (asumiendo que kahoot_survey_runner.js retorna la clase)
    const KahootSurveyRunner = require("@theme_ninja_quiz/js/kahoot_survey_runner"); 

    console.log("MOUNTCOMPONENT.JS: (Log 3) Owl mount:", mount, "KahootSurveyRunner:", KahootSurveyRunner);
    
    if (typeof KahootSurveyRunner !== 'function') {
        console.error("MOUNTCOMPONENT.JS: ¡KahootSurveyRunner NO es una función/clase válida después del require!", KahootSurveyRunner);
        return {}; 
    }

    const placeholderId = "kahoot-survey-runner-placeholder";
    let attempts = 0;
    const maxAttempts = 10;
    let mountInterval;

    function tryMountComponentWithInterval() {
        // Log para ver si esta función se ejecuta
        console.log(`MOUNTCOMPONENT.JS: tryMountComponentWithInterval EJECUTÁNDOSE, intento #${attempts + 1}`);
        attempts++;
        
        const placeholder = document.getElementById(placeholderId);
        
        if (placeholder) {
            console.log("MOUNTCOMPONENT.JS: (Log 5 - TryMount) Placeholder ENCONTRADO:", placeholder);
            console.log("MOUNTCOMPONENT.JS: (Log 5b - TryMount) Contenido actual del placeholder:", placeholder.innerHTML);
            console.log("MOUNTCOMPONENT.JS: (Log 5c - TryMount) Atributos de datos del placeholder:", JSON.parse(JSON.stringify(placeholder.dataset)));
            
            clearInterval(mountInterval); 

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
                             console.error("MOUNTCOMPONENT.JS: (Log 7b - TryMount) ¡KahootSurveyRunner NO es una función/clase válida en este punto!", KahootSurveyRunner);
                             delete placeholder.dataset.owlMounting;
                             return; 
                        }

                        // Usamos las props reales del placeholder, no las de prueba
                        const surveyProps = {
                            surveyId: parseInt(surveyIdAttr),
                            token: tokenAttr,
                            surveyExists: surveyExistsAttr.toLowerCase() === 'true',
                            // Añadimos las props de prueba también para ver si el KSR Mínimo las recoge
                            mensaje: "Props reales + prueba para KSR Mínimo",
                            numero: 777,
                            numeroInicial: 10
                        };
                        console.log("MOUNTCOMPONENT.JS: (Log 7c - TryMount) Props REALES + PRUEBA a pasar a KahootSurveyRunner MÍNIMO:", surveyProps);

                        mount(KahootSurveyRunner, placeholder, { props: surveyProps }); 
                        
                        console.log("MOUNTCOMPONENT.JS: (Log 8 - TryMount) LLAMADA a mount(KahootSurveyRunner, placeholder) REALIZADA con props REALES + PRUEBA.");
                        placeholder.classList.add('owl-mounted'); 
                        delete placeholder.dataset.owlMounting;

                    } catch (err) {
                        console.error("MOUNTCOMPONENT.JS: (Log 9 - TryMount) ERROR DIRECTO DE mount() o en el setup/render inicial de KSR:", err);
                        delete placeholder.dataset.owlMounting;
                    }
                } else {
                    console.log("MOUNTCOMPONENT.JS: (Log 10 - TryMount) KahootSurveyRunner ya montado o montaje en progreso.");
                }
            } else {
                console.warn("MOUNTCOMPONENT.JS: (Log 11 - TryMount) Placeholder encontrado, pero FALTA data-survey-id, data-token o data-survey-exists.", placeholder.dataset);
            }
        } else {
            console.log(`MOUNTCOMPONENT.JS: (Log 12 - TryMount) Placeholder #${placeholderId} NO encontrado en intento ${attempts}.`);
            if (attempts >= maxAttempts) {
                clearInterval(mountInterval);
                console.error(`MOUNTCOMPONENT.JS: (Log 13 - TryMount) Placeholder #${placeholderId} NO encontrado después de ${maxAttempts} intentos. Dejando de intentar.`);
            }
        }
    }
    
    console.log("MOUNTCOMPONENT.JS: (Log Pre-Interval) Programando setInterval para tryMountComponentWithInterval.");
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("MOUNTCOMPONENT.JS: (Log MainCall) DOM ya cargado/interactivo. Iniciando intentos de montaje para KahootSurveyRunner.");
        mountInterval = setInterval(tryMountComponentWithInterval, 500);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("MOUNTCOMPONENT.JS: (Log MainCall) Evento DOMContentLoaded DISPARADO. Iniciando intentos de montaje para KahootSurveyRunner.");
            mountInterval = setInterval(tryMountComponentWithInterval, 500);
        });
    }

    console.log("MOUNTCOMPONENT.JS: (Log 16) Fin del callback de odoo.define. Intentos de montaje programados.");
    return {}; 
});

console.log("MOUNTCOMPONENT.JS: (Log 17) Fin del análisis del archivo por el navegador.");