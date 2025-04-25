odoo.define('theme_ninja_quiz.SurveyRunner', ['web.core', 'web.Component', 'web.hooks', 'web.rpc'], function (require) {
    "use strict";

    const { Component, useState } = require('web.Component');
    const { useService } = require('web.hooks');
    const rpc = require('web.rpc');

    class SurveyRunner extends Component {
        setup() {
            this.state = useState({
                questions: [
                    {
                        id: 1,
                        title: "¿Cuál es la capital de Francia?",
                        options: [
                            { id: 1, text: "Madrid" },
                            { id: 2, text: "París", is_correct: true },
                            { id: 3, text: "Berlín" },
                            { id: 4, text: "Roma" }
                        ]
                    }
                ],
                currentQuestionIndex: 0
            });
        }
    }

    SurveyRunner.template = "theme_ninja_quiz.SurveyRunner";
    SurveyRunner.components = {};

    return SurveyRunner;
});