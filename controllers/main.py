from odoo import http
from odoo.http import request

class NinjaQuizController(http.Controller):

    @http.route('/play', type='http', auth="public", website=True)
    def play_page(self, **kw):
        return request.render("theme_ninja_quiz.play_page_template", {})

    @http.route('/show_pin', type='http', auth="public", website=True, methods=['POST'])
    def show_pin(self, **post):
        pin = post.get('game_pin')
        return request.render("theme_ninja_quiz.show_pin_template", {
            'pin': pin
        })
