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
        <!-- Contador de respuestas en la esquina superior derecha -->
        <div class="answer-counter">
          <span t-out="(state.questions.filter(q => q.answered)).length + ' Answers'"/>
        </div>
        <!-- Barra de progreso general -->
        <div class="progress-general">
          <span t-out="'Pregunta ' + (state.currentIndex + 1) + ' de ' + state.questions.length"/>
          <div class="progress-bar-general">
            <t t-foreach="state.questions" t-as="question" t-key="question.id">
              <div t-att-class="'progress-segment ' + (question.answered ? 'answered' : 'unanswered') + (state.currentIndex === question_index ? ' current' : '')">
                <span t-if="question.answered" class="answered-icon">✅</span>
              </div>
            </t>
          </div>
        </div>
        <!-- Temporizador por pregunta -->
        <div class="progress-timer">
          <span t-out="state.timeLeft + 's'"/>
          <div class="progress-bar">
            <div class="progress-fill" t-att-style="'width:' + (state.timeLeft / 15 * 100) + '%'"/>
          </div>
        </div>
        <!-- Pregunta centrada con animación de desvanecimiento -->
        <h3 class="question-title fade-in" t-key="state.currentIndex" t-out="state.currentQuestion ? state.currentQuestion.title : 'Cargando pregunta...'"/>
        <!-- Opciones con animación de desvanecimiento -->
        <ul class="options-list fade-in" t-key="state.currentIndex">
          <t t-foreach="state.currentQuestion ? state.currentQuestion.options : []" t-as="option" t-key="option.id">
            <li t-att-class="'option-' + option_index">
              <button t-on-click="selectOption" t-att-data-option-id="option.id" t-att-class="'option-button option-' + option_index + ' ' + getOptionClass(option.id)" t-att-disabled="state.isProcessing">
                <span class="option-shape"></span>
                <span class="option-text" t-out="option.text"/>
              </button>
            </li>
          </t>
        </ul>
        <!-- Mensaje de retroalimentación -->
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
        <!-- Botones de navegación -->
        <div class="navigation">
          <button t-on-click="previousQuestion" t-att-disabled="state.currentIndex === 0 || state.isProcessing" t-att-class="state.currentIndex === 0 ? '' : 'pulse'">Anterior</button>
          <button t-on-click="nextQuestion" t-att-disabled="state.currentIndex === state.questions.length - 1 || state.isProcessing" t-att-class="state.currentIndex === state.questions.length - 1 ? '' : 'pulse'">Siguiente</button>
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
      isProcessing: false,
    });

    console.log("KahootSurveyRunner component initialized!");
    this.loadQuestions();

    useEffect(() => {
      const timer = setInterval(() => {
        if (!this.state.selectedOption && !this.state.isProcessing && this.state.timeLeft > 0) {
          console.log("Timer tick: timeLeft =", this.state.timeLeft);
          this.state.timeLeft -= 1;
        }
        if (this.state.timeLeft <= 0 && !this.state.selectedOption && !this.state.isProcessing) {
          console.log("Time's up! Moving to next question...");
          this.nextQuestion();
        }
      }, 1000);

      return () => clearInterval(timer);
    }, () => [this.state.currentIndex, this.state.selectedOption, this.state.isProcessing]);
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
    if (this.state.isProcessing) {
      console.log("Already processing an option, ignoring click...");
      return;
    }

    this.state.isProcessing = true;
    const optionId = parseInt(ev.currentTarget.dataset.optionId);
    console.log("Selected option ID:", optionId);

    this.state.selectedOption = optionId;
    this.state.questions[this.state.currentIndex].answered = true;

    console.log("Current question explanation:", this.state.currentQuestion?.explanation || "<empty string>");

    try {
      console.log("Submitting answer to /survey/submit...");
      const response = await jsonrpc("/survey/submit", {
        survey_id: this.state.surveyId,
        question_id: this.state.currentQuestion.id,
        answer_id: optionId,
      });

      console.log("Backend response:", response);

      if (response.success) {
        console.log("Answer submitted successfully!");
        this.state.feedbackMessage = response.correct ? "¡Correcto!" : "Incorrecto";
        if (this.state.currentIndex < this.state.questions.length - 1) {
          console.log("Scheduling next question with 5000ms delay...");
          this.state.isExiting = true;

          await new Promise((resolve) => {
            setTimeout(() => {
              console.log("Advancing to next question after 5000ms...");
              resolve();
            }, 5000);
          });

          this.state.currentIndex++;
          this.state.currentQuestion = this.state.questions[this.state.currentIndex] || null;
          this.state.selectedOption = null;
          this.state.feedbackMessage = null;
          this.state.timeLeft = 15;
          this.state.isExiting = false;
          this.state.isProcessing = false;
          console.log("Moved to next question:", this.state.currentQuestion?.title || "No more questions");
        } else {
          console.log("No more questions to show.");
          this.state.isProcessing = false;
        }
      } else {
        this.state.feedbackMessage = "Error al enviar la respuesta: " + (response.error || "Respuesta no confirmada por el backend.");
        this.state.isProcessing = false;
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      let errorMessage = "Error al enviar la respuesta";
      if (error.data && error.data.message) {
        errorMessage += `: ${error.data.message}`;
      }
      this.state.feedbackMessage = errorMessage;
      this.state.isProcessing = false;
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
    if (this.state.currentIndex < this.state.questions.length - 1 && !this.state.isProcessing) {
      this.state.isExiting = true;
      this.state.currentIndex++;
      this.state.currentQuestion = this.state.questions[this.state.currentIndex] || null;
      this.state.selectedOption = null;
      this.state.feedbackMessage = null;
      this.state.timeLeft = 15;
      this.state.isExiting = false;
      console.log("Moved to next question (via timer or manual):", this.state.currentQuestion?.title || "No more questions");
    }
  }

  previousQuestion() {
    if (this.state.currentIndex > 0 && !this.state.isProcessing) {
      this.state.isExiting = true;
      this.state.currentIndex--;
      this.state.currentQuestion = this.state.questions[this.state.currentIndex] || null;
      this.state.selectedOption = null;
      this.state.feedbackMessage = null;
      this.state.timeLeft = 15;
      this.state.isExiting = false;
      console.log("Moved to previous question:", this.state.currentQuestion?.title || "No more questions");
    }
  }

  hasExplanation() {
    return this.state.currentQuestion && this.state.currentQuestion.explanation;
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