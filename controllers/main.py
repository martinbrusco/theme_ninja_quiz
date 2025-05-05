from odoo import http
from odoo.http import request

class NinjaQuizController(http.Controller):
    @http.route('/play', type='http', auth='public', website=True)
    def play_page(self, **kwargs):
        return request.render('theme_ninja_quiz.play_page_template', {})
    
    
    
    
    @http.route('/get_survey_questions', type='json', auth="public", website=True)
    def get_survey_questions(self, survey_id=None):
        survey = request.env['survey.survey'].sudo().search([], limit=1)
        if not survey:
            return {"error": "No survey found"}
        
        questions = survey.question_ids.mapped(lambda q: {
            'id': q.id,
            'title': q.question,
            'answers': q.suggested_answer_ids.mapped(lambda a: {
                'id': a.id,
                'text': a.value,
                'is_correct': a.is_correct_answer if hasattr(a, 'is_correct_answer') else False,
            }),
        })
        return {"questions": questions}

    @http.route('/submit_answer', type='json', auth="public", website=True)
    def submit_answer(self, question_id, answer_id):
        # Validar y guardar la respuesta
        question = request.env['survey.question'].sudo().browse(int(question_id))
        answer = request.env['survey.question.answer'].sudo().browse(int(answer_id))
        if question and answer:
            return {"correct": answer.is_correct_answer if hasattr(answer, 'is_correct_answer') else False}
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