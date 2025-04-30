from odoo import http
from odoo.http import request

class NinjaQuizController(http.Controller):
    @http.route('/play', type='http', auth='public', website=True)
    def play_page(self, **kwargs):
        return request.render('theme_ninja_quiz.play_page_template', {})
    
    @http.route('/get_survey_questions', type='json', auth="public", website=True)
    def get_survey_questions(self, survey_id=None):
        # Por ahora, buscamos un survey de ejemplo. Más adelante usaremos el PIN.
        survey = request.env['survey.survey'].sudo().search([], limit=1)
        if not survey:
            return {"error": "No survey found"}
        
        questions = survey.question_ids.mapped(lambda q: {
            'id': q.id,
            'title': q.question,
            'answers': q.suggested_answer_ids.mapped(lambda a: {
                'id': a.id,
                'text': a.value,
                'is_correct': a.is_correct if hasattr(a, 'is_correct') else False,
            }),
        })
        return {"questions": questions}

    @http.route('/submit_answer', type='json', auth="public", website=True)
    def submit_answer(self, question_id, answer_id):
        # Validar y guardar la respuesta
        question = request.env['survey.question'].sudo().browse(int(question_id))
        answer = request.env['survey.question.answer'].sudo().browse(int(answer_id))
        if question and answer:
            return {"correct": answer.is_correct if hasattr(answer, 'is_correct') else False}
        return {"error": "Invalid question or answer"}

    @http.route('/show_pin', type='http', auth="public", website=True, methods=['POST'])
    def show_pin(self, **post):
        pin = post.get('game_pin')
        return request.render("theme_ninja_quiz.show_pin_template", {'pin': pin})

    @http.route('/components', type='http', auth="public", website=True)
    def components(self, **kw):
        return request.render("theme_ninja_quiz.components_library", {})

    @http.route('/', type='http', auth="public", website=True)
    def homepage(self, **kw):
        return request.render("theme_ninja_quiz.homepage_template", {})

class NinjaQuizSurveyController(http.Controller):
    @http.route('/survey/submit', type='json', auth='public', website=True, methods=['POST'])
    def survey_submit(self, survey_id, question_id, answer_id):
        try:
            # Buscar o crear un survey.user_input
            user_input = request.env['survey.user_input'].sudo().search([
                ('survey_id', '=', int(survey_id)),
                ('state', '=', 'in_progress')
            ], limit=1)

            if not user_input:
                user_input = request.env['survey.user_input'].sudo().create({
                    'survey_id': int(survey_id),
                    'state': 'in_progress',
                })

            # Crear una línea de respuesta
            request.env['survey.user_input.line'].sudo().create({
                'user_input_id': user_input.id,
                'question_id': int(question_id),
                'answer_type': 'suggestion',
                'suggested_answer_id': int(answer_id),
            })

            # Verificar si la respuesta es correcta
            answer = request.env['survey.question.answer'].sudo().browse(int(answer_id))
            is_correct = answer.is_correct if hasattr(answer, 'is_correct') else False

            return {'success': True, 'correct': is_correct}
        except Exception as e:
            return {'success': False, 'error': str(e)}