odoo.define('@theme_ninja_quiz/js/lib/SurveyDataService', ['@web/core/network/rpc_service'], function (require) {
    'use strict';

    const { jsonrpc } = require("@web/core/network/rpc_service");

    class SurveyDataService {
        async getQuestions(surveyId, token) {
            console.log("SURVEY_DATA_SERVICE.JS: getQuestions called with surveyId:", surveyId, "token:", token);
            try {
                const response = await jsonrpc("/survey/get_data", {
                    survey_id: surveyId,
                    access_token: token
                });
                console.log("SURVEY_DATA_SERVICE.JS: Response from /survey/get_data:", JSON.parse(JSON.stringify(response)));
                
                if (!response || typeof response.success === 'undefined') {
                    console.error("SURVEY_DATA_SERVICE.JS: Invalid response structure from /survey/get_data", response);
                    throw new Error("Respuesta inválida del servidor al obtener preguntas.");
                }
                return response; 

            } catch (error) {
                console.error("SURVEY_DATA_SERVICE.JS: Error in getQuestions() rpc call:", error);
                throw error; 
            }
        }

        async submitAnswer(surveyId, questionId, answerId, token) {
            console.log("SURVEY_DATA_SERVICE.JS: submitAnswer called with surveyId:", surveyId, "questionId:", questionId, "answerId:", answerId, "token:", token);
            try {
                const response = await jsonrpc("/survey/submit", {
                    survey_id: surveyId,
                    question_id: questionId,
                    answer_id: answerId, 
                    access_token: token
                });
                console.log("SURVEY_DATA_SERVICE.JS: Response from /survey/submit:", response);
                return response;
            } catch (error) {
                console.error("SURVEY_DATA_SERVICE.JS: Error in submitAnswer() rpc call:", error);
                throw error;
            }
        }

        async validateToken(surveyId, token) {
            console.log("SURVEY_DATA_SERVICE.JS: validateToken called with surveyId:", surveyId, "token:", token);
            try {
                const response = await jsonrpc("/survey/validate_token", {
                    survey_id: surveyId,
                    access_token: token 
                });
                console.log("SURVEY_DATA_SERVICE.JS: Response from /survey/validate_token:", response);
                return response.success; 
            } catch (error) {
                console.error("SURVEY_DATA_SERVICE.JS: Error in validateToken() rpc call:", error);
                return false; 
            }
        }

        async getConfigParams() {
            console.log("SURVEY_DATA_SERVICE.JS: getConfigParams called");
            try {
                const response = await jsonrpc("/survey/get_config_params");
                console.log("SURVEY_DATA_SERVICE.JS: Response from /survey/get_config_params:", response);
                return response;
            } catch (error) {
                console.error("SURVEY_DATA_SERVICE.JS: Error in getConfigParams() rpc call:", error);
                return {}; 
            }
        }
    }

    return { SurveyDataService };
});