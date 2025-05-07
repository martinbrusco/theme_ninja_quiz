from odoo import http
from odoo.http import request

class NinjaQuizController(http.Controller):
    @http.route('/', type='http', auth="public", website=True)
    def homepage(self, **kw):
        return request.render("theme_ninja_quiz.homepage_template", {})

    @http.route('/play/<int:survey_id>', type='http', auth='public', website=True)
    def play_page(self, survey_id, **kwargs):
        # Verify if the survey exists
        survey = request.env['survey.survey'].sudo().browse(survey_id)
        if not survey.exists():
            return request.render('website.404')
        return request.render('theme_ninja_quiz.play_page_template', {'survey_id': survey_id})

    @http.route('/components', type='http', auth="public", website=True)
    def components(self, **kw):
        return request.render("theme_ninja_quiz.components_library", {})

    @http.route('/show_pin', type='http', auth="public", website=True, methods=['POST'])
    def show_pin(self, **post):
        pin = post.get('game_pin')
        return request.render("theme_ninja_quiz.show_pin_template", {'pin': pin})

class NinjaQuizSurveyController(http.Controller):
    @http.route('/survey/submit', type='json', auth='public', website=True, methods=['POST'])
    def survey_submit(self, survey_id, question_id, answer_id):
        try:
            # Usa sudo para evitar problemas de permisos
            user_input = request.env['survey.user_input'].sudo().search([
                ('survey_id', '=', int(survey_id)),
                ('state', '=', 'in_progress')
            ], limit=1)

            if not user_input:
                user_input = request.env['survey.user_input'].sudo().create({
                    'survey_id': int(survey_id),
                    'state': 'in_progress',
                })

            request.env['survey.user_input.line'].sudo().create({
                'user_input_id': user_input.id,
                'question_id': int(question_id),
                'answer_type': 'suggestion',
                'suggested_answer_id': int(answer_id),
            })

            answer = request.env['survey.question.answer'].sudo().browse(int(answer_id))
            is_correct = answer.is_correct if hasattr(answer, 'is_correct') else False

            return {'success': True, 'correct': is_correct}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/survey/get_data', type='json', auth='public', website=True, methods=['POST'])
    def get_survey_data(self, survey_id=None):
        try:
            # Filter surveys by the provided survey_id
            domain = [('id', '=', int(survey_id))] if survey_id else []
            surveys = request.env['survey.survey'].sudo().search_read(
                domain=domain,
                fields=["id", "title", "question_ids"]
            )

            if not surveys:
                return {'success': False, 'error': 'No se encontraron encuestas.'}

            survey = surveys[0]
            survey_id = survey['id']

            # Carga las preguntas
            questions = request.env['survey.question'].sudo().search_read(
                domain=[('id', 'in', survey['question_ids'])],
                fields=["title", "suggested_answer_ids", "is_scored_question", "explanation"]
            )

            # Carga las opciones de respuesta
            formatted_questions = []
            for question in questions:
                options = request.env['survey.question.answer'].sudo().search_read(
                    domain=[('id', 'in', question['suggested_answer_ids'])],
                    fields=["value", "is_correct"]
                )

                formatted_question = {
                    'id': question['id'],
                    'title': question['title']['en_US'] if isinstance(question['title'], dict) else question['title'],
                    'options': [{
                        'id': opt['id'],
                        'text': opt['value']['en_US'] if isinstance(opt['value'], dict) else opt['value'],
                        'isCorrect': opt['is_correct'] or False,
                    } for opt in options],
                    'isScored': question['is_scored_question'],
                    'explanation': question['explanation'] or "",
                    'answered': False,
                }
                formatted_questions.append(formatted_question)

            if not formatted_questions:
                return {'success': False, 'error': 'No se encontramos preguntas para esta encuesta.'}

            return {
                'success': True,
                'surveyId': survey_id,
                'questions': formatted_questions
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}