from odoo import http
from odoo.http import request

class QuizController(http.Controller):

    @http.route('/quiz/play', type='http', auth='public', website=True)
    def quiz_play(self, **kw):
        return request.render('theme_ninja_quiz.quiz_play_template', {})

    @http.route('/quiz/join', type='http', auth="public", methods=["POST"], website=True)
    def quiz_join(self, **post):
        pin = post.get('pin')
        return request.render('theme_ninja_quiz.quiz_join_template', {'pin': pin})
