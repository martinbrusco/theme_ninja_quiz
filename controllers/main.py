from odoo import http
from odoo.http import request

class QuizController(http.Controller):

    @http.route('/play', type='http', auth='public', website=True)
    def quiz_play(self, **kw):
        return request.render('ninja_quiz.quiz_play_template', {})

    @http.route('/join', type='http', auth="public", methods=["POST"], website=True)
    def quiz_join(self, **post):
        pin = post.get('pin')
        return request.render('ninja_quiz.quiz_join_template', {'pin': pin})
