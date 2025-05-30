odoo.define('@theme_ninja_quiz/js/lib/SurveyDataService', ['@web'], function (require) {
    'use strict';

    const { jsonrpc } = require("@web/core/network/rpc_service");

    class SurveyDataService {
        async getQuestions(surveyId, token) {
            if (!surveyId || !token) {
                console.warn('SURVEY_DATA_SERVICE.JS: Invalid surveyId or token', { surveyId, token });
                return { success: false, error: 'Missing survey ID or token' };
            }
            console.log(`SURVEY_DATA_SERVICE.JS: Fetching questions for surveyId=${surveyId}, token=${token}`);
            try {
                const response = await jsonrpc("/survey/get_data", {
                    survey_id: parseInt(surveyId, 10),
                    access_token: token
                });
                console.log('SURVEY_DATA_SERVICE.JS: Response from /survey/get_data:', response);

                if (!response || typeof response.success === 'undefined') {
                    console.error('SURVEY_DATA_SERVICE.JS: Invalid response structure', response);
                    return { success: false, error: 'Invalid server response' };
                }
                return response;
            } catch (error) {
                console.error('SURVEY_DATA_SERVICE.JS: Error fetching questions:', error);
                return { success: false, error: error.message || 'Failed to fetch questions' };
            }
        }

        async submitAnswer(surveyId, questionId, answerId, token) {
            if (!surveyId || !questionId || !answerId || !token) {
                console.warn('SURVEY_DATA_SERVICE.JS: Invalid parameters', { surveyId, questionId, answerId, token });
                return { success: false, error: 'Missing required parameters' };
            }
            console.log(`SURVEY_DATA_SERVICE.JS: Submitting answer: surveyId=${surveyId}, questionId=${questionId}, answerId=${answerId}, token=${token}`);
            try {
                const response = await jsonrpc("/survey/submit", {
                    survey_id: parseInt(surveyId, 10),
                    question_id: parseInt(questionId, 10),
                    answer_id: parseInt(answerId, 10),
                    access_token: token
                });
                console.log('SURVEY_DATA_SERVICE.JS: Response from /survey/submit:', response);
                return response || {};
            } catch (error) {
                console.error('SURVEY_DATA_SERVICE.JS: Error submitting answer:', error);
                return { success: false, error: 'Failed to submit answer' };
            }
        }

        async validateToken(surveyId, token) {
            if (!surveyId || !token) {
                console.warn('SURVEY_DATA_SERVICE.JS: Invalid surveyId or token', { surveyId, token });
                return { success: false };
            }
            console.log(`SURVEY_DATA_SERVICE.JS: Validating token for surveyId=${surveyId}, token=${token}`);
            try {
                const response = await jsonrpc("/survey/validate_token", {
                    survey_id: parseInt(surveyId, 10),
                    access_token: token
                });
                console.log('SURVEY_DATA_SERVICE.JS: Response from /survey/validate_token:', response);
                return { success: response.valid || false };
            } catch (error) {
                console.error('SURVEY_DATA_SERVICE.JS: Error validating token:', error);
                return { success: false };
            }
        }

        async getConfigParams() {
            console.log('SURVEY_DATA_SERVICE.JS: Fetching config parameters');
            try {
                const response = await jsonrpc("/survey/get_config_params", {});
                console.log('SURVEY_DATA_SERVICE.JS: Response from /survey/get_config_params:', response);
                return response || {};
            } catch (error) {
                console.error('SURVEY_DATA_SERVICE.JS: Error fetching config params:', error);
                return {};
            }
        }
    }

    console.log('SURVEY_DATA_SERVICE.JS: SurveyDataService defined');
    return { SurveyDataService };
});