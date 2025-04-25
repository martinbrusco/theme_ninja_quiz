odoo.define('theme_ninja_quiz.survey_init', ['web.core', 'web.App', 'theme_ninja_quiz.SurveyRunner'], function (require) {
    "use strict";

    require('web.dom_ready');
    const { App, mount } = require('web.App');
    const SurveyRunner = require('theme_ninja_quiz.SurveyRunner');

    document.addEventListener('DOMContentLoaded', function() {
        const target = document.querySelector('.survey-runner-mount');
        if (target) {
            const app = new App(SurveyRunner);
            mount(app, target);
        }
    });
});