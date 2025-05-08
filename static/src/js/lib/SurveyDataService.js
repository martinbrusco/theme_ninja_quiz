/** @odoo-module */

import { jsonrpc } from "@web/core/network/rpc_service";

export class SurveyDataService {
    async getQuestions(surveyId) {
        try {
            const response = await jsonrpc("/survey/get_data", {
                survey_id: surveyId
            });
            if (!response.success) {
                throw new Error(response.error || "No se encontraron encuestas.");
            }
            return response.questions.map(question => ({
                id: question.id,
                title: question.title['en_US'] || question.title,
                options: question.options.map(opt => ({
                    id: opt.id,
                    text: opt.text['en_US'] || opt.text,
                    isCorrect: opt.isCorrect
                })),
                explanation: question.explanation,
                answered: false,
                correct: false,
                skipped: false
            }));
        } catch (error) {
            console.error("Error loading questions:", error);
            throw error;
        }
    }

    async submitAnswer(surveyId, questionId, answerId) {
        try {
            const response = await jsonrpc("/survey/submit", {
                survey_id: surveyId,
                question_id: questionId,
                answer_id: answerId
            });
            return response;
        } catch (error) {
            console.error("Error submitting answer:", error);
            throw error;
        }
    }

    async getConfigParams() {
        try {
            return await jsonrpc("/survey/get_config_params");
        } catch (error) {
            console.error("Error loading config params:", error);
            return {};
        }
    }
}