/** @odoo-module **/

import { Component, xml, useState, useEffect } from "@odoo/owl";
import { SurveyDataService } from "./lib/SurveyDataService";
import { StateManager } from "./lib/StateManager";

export class KahootSurveyRunner extends Component {
  static template = xml`
    <div class="survey-runner">
      <t t-if="state.questions.length === 0">
        <p t-if="!state.feedbackMessage">¡Cargando preguntas...</p>
        <p t-if="state.feedbackMessage" class="feedback-message">
          <t t-out="state.feedbackMessage"/>
          <t t-if="state.feedbackMessage.includes('sesión ha expirado')">
            <br/>
            <a href="/web/login?redirect=/play">Iniciar sesión</a>
          </t>
        </p>
      </t>
      <t t-else="">
        <div class="answer-counter">
          <span t-out="(state.questions.filter(q => q.answered)).length + ' Answers'"/>
        </div>
        <div class="progress-general">
          <span t-out="'Pregunta ' + (state.currentIndex + 1) + ' de ' + state.questions.length"/>
          <div class="progress-bar-general">
            <t t-foreach="state.questions" t-as="question" t-key="question.id">
              <div t-att-class="'progress-segment ' + getProgressClass(question, state.currentIndex, question_index)">
                <span t-if="question.answered || question.skipped" class="answered-icon">
                  <t t-if="question.skipped">❓</t>
                  <t t-elif="question.answered">
                    <t t-if="question.correct">✅</t>
                    <t t-else="">❌</t>
                  </t>
                </span>
              </div>
            </t>
          </div>
        </div>
        <div class="progress-timer">
          <span t-out="state.timeLeft + 's'"/>
          <div class="progress-bar">
            <div class="progress-fill" t-att-style="'width:' + (state.timeLeft / 15 * 100) + '%'"/>
          </div>
        </div>
        <h3 class="question-title fade-in" t-key="state.currentIndex" t-out="state.currentQuestion ? state.currentQuestion.title : 'Cargando pregunta...'"/>
        <ul class="options-list fade-in" t-key="state.currentIndex">
          <t t-foreach="state.currentQuestion ? state.currentQuestion.options : []" t-as="option" t-key="option.id">
            <li t-att-class="'option-' + option_index">
              <button t-on-click="selectOption" t-att-data-option-id="option.id" t-att-class="'option-button option-' + option_index + ' ' + getOptionClass(option.id)" t-att-disabled="isOptionDisabled()">
                <span class="option-shape"></span>
                <span class="option-text" t-out="option.text"/>
              </button>
            </li>
          </t>
        </ul>
        <t t-if="state.feedbackMessage">
          <p class="feedback-message" t-att-class="state.feedbackMessage.includes('Correct') ? 'correct' : 'incorrect'">
            <t t-out="state.feedbackMessage"/>
          </p>
          <t t-if="hasExplanation()">
            <p class="explanation">
              <t t-out="state.currentQuestion.explanation"/>
            </p>
          </t>
        </t>
        <div class="navigation">
          <button t-on-click="showPreviousMessage" t-att-class="state.currentIndex > 0 ? 'pulse' : ''">Anterior</button>
          <button t-on-click="nextQuestion" t-att-disabled="state.currentIndex === state.questions.length - 1 || state.isProcessing || state.isExiting" t-att-class="state.currentIndex === state.questions.length - 1 ? '' : 'pulse'">Siguiente</button>
        </div>
      </t>
    </div>
  `;

  setup() {
    this.state = StateManager.initState();
    this.dataService = new SurveyDataService();

    this.loadQuestions();

    useEffect(
      () => {
        let timer;
        if (this.state.timeLeft > 0 && !this.state.selectedOption && !this.state.isProcessing && !this.state.isExiting) {
          timer = setInterval(() => {
            this.state.timeLeft -= 1;
            if (this.state.timeLeft <= 0 && !this.state.selectedOption && !this.state.isProcessing) {
              this.state.questions[this.state.currentIndex].skipped = true;
              if (this.state.currentIndex < this.state.questions.length - 1) {
                this.nextQuestion();
              }
            }
          }, 1000);
        }
        return () => clearInterval(timer);
      },
      () => [this.state.currentIndex, this.state.selectedOption, this.state.isProcessing, this.state.isExiting, this.state.timeLeft]
    );
  }

  async loadQuestions() {
    try {
      await this.dataService.loadQuestions(this.state);
      if (this.state.questions.length > 0) {
        this.state.currentQuestion = this.state.questions[0];
        this.state.timeLeft = 15;
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  }

  async selectOption(ev) {
    if (this.state.isProcessing || this.state.isExiting || this.state.timeLeft <= 0) return;

    this.state.isProcessing = true;
    this.state.isExiting = true;
    const optionId = parseInt(ev.currentTarget.dataset.optionId);
    this.state.selectedOption = optionId;
    this.state.questions[this.state.currentIndex].answered = true;

    try {
      const response = await this.dataService.submitAnswer(
        this.state.surveyId,
        this.state.currentQuestion.id,
        optionId
      );

      if (response.success) {
        this.state.feedbackMessage = response.correct ? "¡Correcto! 🎉" : "Incorrecto ❌";
        this.state.questions[this.state.currentIndex].correct = response.correct;

        if (this.state.currentIndex < this.state.questions.length - 1) {
          setTimeout(() => {
            this.nextQuestion();
            this.state.isExiting = false;
          }, 4000);
        } else {
          setTimeout(() => {
            this.state.isExiting = false;
          }, 4000);
        }
      } else {
        this.state.feedbackMessage = response.error || "Error al enviar la respuesta.";
        this.state.isExiting = false;
      }
    } catch (error) {
      this.state.feedbackMessage = "Error al enviar la respuesta: " + (error.message || "Error desconocido");
      this.state.isExiting = false;
      console.error("Error submitting answer:", error);
    } finally {
      this.state.isProcessing = false;
    }
  }

  getOptionClass(optionId) {
    if (this.state.selectedOption === optionId) {
      return this.state.feedbackMessage?.includes("Correct") ? "selected correct" : "selected incorrect";
    }
    return "";
  }

  getProgressClass(question, currentIndex, questionIndex) {
    let baseClass = "progress-segment ";
    if (question.answered) {
      baseClass += question.correct ? "answered correct" : "answered incorrect";
    } else if (question.skipped) {
      baseClass += "skipped";
    } else {
      baseClass += "unanswered";
    }
    if (currentIndex === questionIndex) {
      baseClass += " current";
    }
    return baseClass;
  }

  nextQuestion() {
    if (this.state.currentIndex < this.state.questions.length - 1 && !this.state.isProcessing) {
      this.state.currentIndex++;
      this.state.currentQuestion = this.state.questions[this.state.currentIndex] || null;
      this.resetQuestionState();
    }
  }

  showPreviousMessage() {
    alert("No se puede ir atrás.");
  }

  resetQuestionState() {
    this.state.selectedOption = null;
    this.state.feedbackMessage = null;
    this.state.timeLeft = 15;
    this.state.isExiting = false;
  }

  hasExplanation() {
    return this.state.currentQuestion?.explanation;
  }

  isOptionDisabled() {
    return this.state.isProcessing || this.state.isExiting || this.state.timeLeft <= 0 || this.state.selectedOption !== null;
  }
}