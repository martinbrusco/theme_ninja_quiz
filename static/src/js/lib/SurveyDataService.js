/** @odoo-module **/

import { jsonrpc } from "@web/core/network/rpc_service";

export class SurveyDataService {
  async loadQuestions(state) {
    try {
      const response = await jsonrpc("/survey/get_data", {
        survey_id: state.surveyId
      });
      if (!response.success) {
        state.feedbackMessage = response.error || "No se encontraron encuestas.";
        return;
      }

      state.surveyId = response.surveyId;
      state.questions = response.questions;

      if (state.questions.length === 0) {
        state.feedbackMessage = "No se encontraron preguntas para esta encuesta.";
      }
    } catch (error) {
      state.feedbackMessage = "Error al cargar las preguntas: " + (error.message || "Error desconocido");
      console.error("Error loading survey data:", error);
      throw error;
    }
  }

  async submitAnswer(surveyId, questionId, answerId) {
    try {
      return await jsonrpc("/survey/submit", {
        survey_id: surveyId,
        question_id: questionId,
        answer_id: answerId,
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw error;
    }
  }
}