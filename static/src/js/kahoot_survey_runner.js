/** @odoo-module **/

import { Component, useState, xml, mount, useEffect } from "@odoo/owl";

// JSON de ejemplo
const surveyData = {
  surveys: [
    {
      id: 1,
      title: "Trivia de Conocimientos Generales",
      questions: [
        {
          id: 1,
          title: "¿Cuál es la capital de Francia?",
          options: [
            { id: 1, text: "Madrid", isCorrect: false },
            { id: 2, text: "París", isCorrect: true },
            { id: 3, text: "Roma", isCorrect: false },
            { id: 4, text: "Berlín", isCorrect: false }
          ],
          isScored: true,
          explanation: "¡La capital de Francia es París! Fun fact: París es conocida como 'La Ciudad de la Luz' porque fue una de las primeras ciudades en adoptar alumbrado público.",
          answered: false
        },
        {
          id: 2,
          title: "¿Qué planeta es conocido como el planeta rojo?",
          options: [
            { id: 5, text: "Júpiter", isCorrect: false },
            { id: 6, text: "Marte", isCorrect: true },
            { id: 7, text: "Venus", isCorrect: false },
            { id: 8, text: "Mercurio", isCorrect: false }
          ],
          isScored: true,
          explanation: "¡Marte es el planeta rojo! Su color se debe al óxido de hierro en su superficie. ¿Sabías que Marte tiene el volcán más grande del sistema solar, el Monte Olimpo?",
          answered: false
        },
        {
          id: 3,
          title: "¿Cuál es el animal terrestre más rápido?",
          options: [
            { id: 9, text: "León", isCorrect: false },
            { id: 10, text: "Elefante", isCorrect: false },
            { id: 11, text: "Guepardo", isCorrect: true },
            { id: 12, text: "Caballo", isCorrect: false }
          ],
          isScored: true,
          explanation: "¡El guepardo es el animal terrestre más rápido! Puede alcanzar velocidades de hasta 100 km/h. Dato curioso: solo puede mantener esa velocidad por unos pocos segundos.",
          answered: false
        }
      ]
    }
  ]
};

// Simulación de una llamada al backend
const simulateBackendCall = (data, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// Simulación del endpoint /survey/submit
const simulateSurveySubmit = (payload) => {
  return simulateBackendCall({ success: true }, 500); // Simula una respuesta exitosa después de 500ms
};

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
              <div t-att-class="'progress-segment ' + (question.answered ? 'answered' : 'unanswered') + (state.currentIndex === question_index ? ' current' : '')">
                <span t-if="question.answered" class="answered-icon">✅</span>
              </div>
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
              <p class="explanation slide-in">
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
      console.log("Loading survey data from 'backend'...");
      // Simulamos la carga de datos desde el backend
      const result = await simulateBackendCall(surveyData.surveys, 1000);

      console.log("Surveys loaded:", result);

      if (result.length > 0) {
        const survey = result[0];
        this.state.surveyId = survey.id;
        console.log("Selected survey:", survey.title);

        const formattedQuestions = survey.questions.map(question => ({
          id: question.id,
          title: question.title,
          options: question.options,
          isScored: question.isScored,
          explanation: question.explanation,
          answered: question.answered
        }));

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
      this.state.feedbackMessage = "Error al cargar las preguntas.";
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
      // Simulamos el envío de la respuesta al backend
      console.log("Submitting answer to 'backend'...");
      const response = await simulateSurveySubmit({
        survey_id: this.state.surveyId,
        question_id: this.state.currentQuestion.id,
        answer_id: optionId,
      });

      console.log("Backend response:", response);

      if (response.success) {
        console.log("Answer submitted successfully!");
        // Agregar un retraso de 4 segundos antes de avanzar
        this.state.isExiting = true;
        setTimeout(() => {
          if (this.state.currentIndex < this.state.questions.length - 1) {
            this.nextQuestion();
          }
          this.state.isExiting = false;
        }, 4000); // 4000 ms = 4 segundos
      } else {
        this.state.feedbackMessage = "Error al enviar la respuesta: Respuesta no confirmada por el backend.";
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      this.state.feedbackMessage = "Error al enviar la respuesta.";
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