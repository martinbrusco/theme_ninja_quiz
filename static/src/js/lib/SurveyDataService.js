/** @odoo-module **/

import { jsonrpc } from "@web/core/network/rpc_service";

export class SurveyDataService {
  async loadQuestions(state) {
    const surveys = await jsonrpc("/web/dataset/call_kw/survey.survey/search_read", {
      model: "survey.survey",
      method: "search_read",
      args: [[]],
      kwargs: { fields: ["id", "title", "question_ids"] },
    });

    if (surveys.length === 0) {
      state.feedbackMessage = "No se encontraron encuestas.";
      return;
    }

    const survey = surveys[0];
    state.surveyId = survey.id;

    const questions = await jsonrpc("/web/dataset/call_kw/survey.question/search_read", {
      model: "survey.question",
      method: "search_read",
      args: [[["id", "in", survey.question_ids]]],
      kwargs: { fields: ["title", "suggested_answer_ids", "is_scored_question", "explanation"] },
    });

    state.questions = await Promise.all(
      questions.map(async (question) => {
        const options = await jsonrpc("/web/dataset/call_kw/survey.question.answer/search_read", {
          model: "survey.question.answer",
          method: "search_read",
          args: [[["id", "in", question.suggested_answer_ids]]],
          kwargs: { fields: ["value", "is_correct"] },
        });

        return {
          id: question.id,
          title: typeof question.title === "object" ? question.title["en_US"] : question.title,
          options: options.map((opt) => ({
            id: opt.id,
            text: typeof opt.value === "object" ? opt.value["en_US"] : opt.value,
            isCorrect: opt.is_correct || false,
          })),
          isScored: question.is_scored_question,
          explanation: question.explanation || "",
          answered: false,
        };
      })
    );

    if (state.questions.length === 0) {
      state.feedbackMessage = "No se encontraron preguntas para esta encuesta.";
    }
  }

  async submitAnswer(surveyId, questionId, answerId) {
    return await jsonrpc("/survey/submit", {
      survey_id: surveyId,
      question_id: questionId,
      answer_id: answerId,
    });
  }
}