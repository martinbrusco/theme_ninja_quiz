odoo.define('@theme_ninja_quiz/js/snippets', ['web.public.widget'], function (require) {
    'use strict';
    var publicWidget = require('web.public.widget');
    publicWidget.registry.SnippetsWidget = publicWidget.Widget.extend({
        selector: '.s_quiz_home, .s_quiz_play',
        start: function () {
            console.log('Snippets widget initialized');
        },
    });
    return publicWidget.registry.SnippetsWidget;
});