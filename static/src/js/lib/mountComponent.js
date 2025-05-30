odoo.define('@theme_ninja_quiz/js/lib/mountComponent', ['@odoo/owl', '@theme_ninja_quiz/js/kahoot_survey_runner'], function(require) {
    'use strict';
    const { mount } = require("@odoo/owl");
    const KahootSurveyRunner = require("@theme_ninja_quiz/js/kahoot_survey_runner");

    console.log('MOUNTCOMPONENT.JS: Initializing mount script');

    const placeholderId = "kahoot-survey-runner-placeholder";
    let attempts = 0;
    const maxAttempts = 10; // Más intentos para asegurar que el DOM esté listo
    let mountInterval;

    function tryMountKahootSurveyRunner() {
        console.log(`MOUNTCOMPONENT.JS: Attempt #${attempts + 1} to mount KahootSurveyRunner`);
        attempts++;
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            console.log(`MOUNTCOMPONENT.JS: Placeholder #${placeholderId} found`);
            clearInterval(mountInterval);
            if (!placeholder.classList.contains('owl-kahoot-survey-mounted')) {
                placeholder.dataset.owlMounting = 'true';
                const props = {
                    surveyId: parseInt(placeholder.dataset.surveyId, 10),
                    surveyExists: placeholder.dataset.surveyExists === 'true',
                    token: placeholder.dataset.token || ''
                };
                console.log(`MOUNTCOMPONENT.JS: Mounting with props:`, props);
                try {
                    mount(KahootSurveyRunner, placeholder, { props });
                    placeholder.classList.add('owl-kahoot-survey-mounted');
                    delete placeholder.dataset.owlMounting;
                    console.log(`MOUNTCOMPONENT.JS: KahootSurveyRunner mounted successfully`);
                } catch (err) {
                    console.error(`MOUNTCOMPONENT.JS: Error mounting KahootSurveyRunner:`, err);
                    delete placeholder.dataset.owlMounting;
                }
            }
        } else if (attempts >= maxAttempts) {
            clearInterval(mountInterval);
            console.error(`MOUNTCOMPONENT.JS: Placeholder #${placeholderId} not found after ${maxAttempts} attempts`);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log(`MOUNTCOMPONENT.JS: DOM ready, starting mount attempts`);
        mountInterval = setInterval(tryMountKahootSurveyRunner, 1000); // Intervalo de 1 segundo
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            console.log(`MOUNTCOMPONENT.JS: DOMContentLoaded, starting mount attempts`);
            mountInterval = setInterval(tryMountKahootSurveyRunner, 1000);
        });
    }

    console.log('MOUNTCOMPONENT.JS: Mount script defined');
    return {};
});