odoo.define('@theme_ninja_quiz/js/lib/StateManager', ['@odoo/owl'], function (require) {
  'use strict';

  const { useState } = require('@odoo/owl');

  console.log('STATE_MANAGER.JS: Defining StateManager');

  class StateManager {
      static initState() {
          return useState({
              surveyId: null,
              surveyExists: true,
              token: null,
              questions: [],
              currentQuestion: null,
              currentIndex: 0,
              selectedOption: null,
              feedbackMessage: null,
              timeLeft: 15,
              isProcessing: false,
              isExiting: false,
              configParams: {},
              configParamsLoaded: false
          });
      }
  }

  console.log('STATE_MANAGER.JS: StateManager defined');
  return { StateManager };
});