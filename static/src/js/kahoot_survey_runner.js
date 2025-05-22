// static/src/js/kahoot_survey_runner.js
odoo.define('@theme_ninja_quiz/js/kahoot_survey_runner', ['web.public.widget'], function (require) {
    'use strict';
    var publicWidget = require('web.public.widget');

    publicWidget.registry.KahootSurveyRunner = publicWidget.Widget.extend({
        selector: '.s_quiz_play',
        start: function () {
            console.log('Kahoot Survey Runner initialized');
        },
    });

    return publicWidget.registry.KahootSurveyRunner;
});