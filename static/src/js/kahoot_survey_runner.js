/** @odoo-module **/

import { Component, useState, xml, mount, useEffect } from "@odoo/owl";
import { jsonrpc } from "@web/core/network/rpc_service";

class KahootSurveyRunner extends Component {
  static template = xml`
    <div class="survey-runner">
      <t t-if="state.questions.length === 0">
        <p t-if="!state.feedbackMessage">¡Cargando preguntas...</p>
        <p t-if="state.feedbackMessage" class="feedback-message">
          <t t-out="state.feedbackMessage"/>
        </p>
      </t>
      <t t-else="">
        <!-- Barra de progreso general -->
        <div class="progress-general">
          <span t-out="'Pregunta ' + (state.currentIndex + 1) + ' de ' + state.questions.length"/>
          <div class="progress-bar-general">
            <t t-foreach="state.questions" t-as="question" t-key="question.id">
              <div t-att-class="'progress-segment ' + (question.answered ? 'answered' : 'unanswered') + (state.currentIndex === question_index ? ' current' : '')"/>
            </t>
          </div>
        </div>
        <!-- Temporizador por pregunta -->
        <div class="progress-timer">
          <span t-out="'Tiempo restante: ' + state.timeLeft + 's'"/>
          <div class="progress-bar">
            <div class="progress-fill" t-att-style="'width:' + (state.timeLeft / 15 * 100) + '%'"/>
          </div>
        </div>
        <div t-key="state.currentIndex" class="question-container" t-att-class="state.isExiting ? 'exiting' : ''">
          <h3 t-out="state.currentQuestion.title"/>
          <ul class="options-list">
            <t t-foreach="state.currentQuestion.options" t-as="option" t-key="option.id">
              <li>
                <button t-on-click="selectOption" t-att-data-option-id="option.id" t-att-class="getOptionClass(option.id)">
                  <t t-out="option.text"/>
                </button>
              </li>
            </t>
          </ul>
          <t t-if="state.feedbackMessage">
            <p class="feedback-message" t-att-class="state.feedbackMessage.includes('Correct') ? 'correct' : 'incorrect'">
              <t t-out="state.feedbackMessage"/>
            </p>
            <t t-if="state.currentQuestion.explanation">
              <p class="explanation">
                <t t-out="state.currentQuestion.explanation"/>
              </p>
            </t>
          </t>
          <div class="navigation">
            <button t-on-click="previousQuestion" t-att-disabled="state.currentIndex === 0" t-att-class="state.currentIndex === 0 ? '' : 'pulse'">Anterior</button>
            <button t-on-click="nextQuestion" t-att-disabled="state.currentIndex === state.questions.length - 1" t-att-class="state.currentIndex === state.questions.length - 1 ? '' : 'pulse'">Siguiente</button>
          </div>
        </div>
      </t>
    </div>
  `;

  setup() {
    this.state = useState({
      questions: [],
      currentQuestion: null,
      currentIndex: 0,
      selectedOption: null,
      feedbackMessage: null,
      surveyId: null,
      timeLeft: 15,
      isExiting: false,
    });

    console.log("KahootSurveyRunner component initialized!");
    this.loadQuestions();

    useEffect(() => {
      const timer = setInterval(() => {
        if (this.state.timeLeft > 0 && !this.state.selectedOption) {
          this.state.timeLeft -= 1;
        } else if (this.state.timeLeft <= 0 && !this.state.selectedOption) {
          this.nextQuestion();
        }
      }, 1000);

      return () => clearInterval(timer);
    }, () => [this.state.currentIndex, this.state.selectedOption]);
  }

  async loadQuestions() {
    try {
      console.log("Loading surveys...");
      const result = await jsonrpc("/web/dataset/call_kw/survey.survey/search_read", {
        model: "survey.survey",
        method: "search_read",
        args: [[]],
        kwargs: { fields: ["id", "title", "question_ids"] },
      });

      console.log("Surveys loaded:", result);

      if (result.length > 0) {
        const survey = result[0];
        this.state.surveyId = survey.id;
        console.log("Selected survey ID:", this.state.surveyId);
        console.log("Loading questions for survey...");
        const questions = await jsonrpc("/web/dataset/call_kw/survey.question/search_read", {
          model: "survey.question",
          method: "search_read",
          args: [[["id", "in", survey.question_ids]]],
          kwargs: { fields: ["title", "suggested_answer_ids", "is_scored_question", "explanation"] },
        });

        console.log("Questions loaded:", questions);

        const formattedQuestions = await Promise.all(
          questions.map(async (question) => {
            console.log("Loading options for question:", question.title);
            const options = await jsonrpc("/web/dataset/call_kw/survey.question.answer/search_read", {
              model: "survey.question.answer",
              method: "search_read",
              args: [[["id", "in", question.suggested_answer_ids]]],
              kwargs: { fields: ["value", "is_correct"] },
            });
            console.log("Options loaded for question", question.title, ":", options);
            return {
              id: question.id,
              title: typeof question.title === 'object' ? question.title['en_US'] : question.title,
              options: options.map((opt) => {
                console.log("Mapping option:", opt);
                return {
                  id: opt.id,
                  text: typeof opt.value === 'object' ? opt.value['en_US'] : opt.value,
                  isCorrect: opt.is_correct || false,
                };
              }),
              isScored: question.is_scored_question,
              explanation: question.explanation || "",
              answered: false,
            };
          })
        );

        this.state.questions = formattedQuestions;
        console.log("Formatted questions:", formattedQuestions);
        formattedQuestions.forEach((q, index) => {
          console.log(`Question ${index + 1} explanation:`, q.explanation);
        });
        if (formattedQuestions.length > 0) {
          this.state.currentQuestion = formattedQuestions[0];
          console.log("Current question set:", this.state.currentQuestion);
        } else {
          this.state.feedbackMessage = "No se encontraron preguntas para esta encuesta.";
        }
      } else {
        console.log("No surveys found.");
        this.state.feedbackMessage = "No se encontraron encuestas.";
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      if (error.data && error.data.message) {
        this.state.feedbackMessage = `Error al cargar las preguntas: ${error.data.message}`;
      } else {
        this.state.feedbackMessage = "Error al cargar las preguntas.";
      }
    }
  }

  async selectOption(ev) {
    const optionId = parseInt(ev.currentTarget.dataset.optionId);
    console.log("Selected option ID:", optionId);

    this.state.selectedOption = optionId;

    const selectedOption = this.state.currentQuestion.options.find(opt => opt.id === optionId);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;
    this.state.feedbackMessage = isCorrect ? "¡Correcto!" : "Incorrecto";

    this.state.questions[this.state.currentIndex].answered = true;

    console.log("Current question explanation:", this.state.currentQuestion.explanation);

    try {
      let userInput = await jsonrpc("/web/dataset/call_kw/survey.user_input/search_read", {
        model: "survey.user_input",
        method: "search_read",
        args: [[["survey_id", "=", this.state.surveyId], ["state", "=", "in_progress"]]],
        kwargs: { fields: ["id"], limit: 1 },
      });

      let userInputId;
      if (userInput.length === 0) {
        userInput = await jsonrpc("/web/dataset/call_kw/survey.user_input/create", {
          model: "survey.user_input",
          method: "create",
          args: [{
            survey_id: this.state.surveyId,
            state: "in_progress",
          }],
          kwargs: {},
        });
        userInputId = userInput;
      } else {
        userInputId = userInput[0].id;
      }

      await jsonrpc("/web/dataset/call_kw/survey.user_input.line/create", {
        model: "survey.user_input.line",
        method: "create",
        args: [{
          user_input_id: userInputId,
          question_id: this.state.currentQuestion.id,
          answer_type: "suggestion",
          suggested_answer_id: optionId,
        }],
        kwargs: {},
      });

      console.log("Answer submitted successfully!");

      if (this.state.currentIndex < this.state.questions.length - 1) {
        console.log("Scheduling next question in 2 seconds...");
        setTimeout(() => {
          console.log("Advancing to next question...");
          this.state.isExiting = true;
          setTimeout(() => {
            this.nextQuestion();
            this.state.isExiting = false;
          }, 300);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      let errorMessage = "Error al enviar la respuesta";
      if (error.data && error.data.message) {
        errorMessage += `: ${error.data.message}`;
      }
      this.state.feedbackMessage = errorMessage;
    }
  }

  getOptionClass(optionId) {
    if (this.state.selectedOption === optionId) {
      if (this.state.feedbackMessage) {
        return this.state.feedbackMessage.includes("Correct") ? "selected correct" : "selected incorrect";
      }
      return "selected";
    }
    return "";
  }

  nextQuestion() {
    if (this.state.currentIndex < this.state.questions.length - 1) {
      this.state.isExiting = true;
      setTimeout(() => {
        this.state.currentIndex++;
        this.state.currentQuestion = this.state.questions[this.state.currentIndex];
        this.state.selectedOption = null;
        this.state.feedbackMessage = null;
        this.state.timeLeft = 15;
        this.state.isExiting = false;
      }, 300);
    }
  }

  previousQuestion() {
    if (this.state.currentIndex > 0) {
      this.state.isExiting = true;
      setTimeout(() => {
        this.state.currentIndex--;
        this.state.currentQuestion = this.state.questions[this.state.currentIndex];
        this.state.selectedOption = null;
        this.state.feedbackMessage = null;
        this.state.timeLeft = 15;
        this.state.isExiting = false;
      }, 300);
    }
  }
}

let isMounted = false;
document.addEventListener("DOMContentLoaded", () => {
  if (isMounted) {
    console.log("KahootSurveyRunner already mounted, skipping...");
    return;
  }
  console.log("DOM fully loaded, attempting to mount KahootSurveyRunner...");
  const placeholder = document.getElementById("kahoot-survey-runner-placeholder");
  if (placeholder) {
    console.log("Placeholder found, mounting component...");
    mount(KahootSurveyRunner, placeholder);
    isMounted = true;
    console.log("KahootSurveyRunner mounted!");
  } else {
    console.error("Placeholder #kahoot-survey-runner-placeholder not found!");
  }
});