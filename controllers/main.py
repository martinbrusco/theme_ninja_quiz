from odoo import http
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

class NinjaQuiz(http.Controller):

    @http.route('/', type='http', auth='public', website=True)
    def quiz_home(self, **kwargs):
        error_message = kwargs.get('error_message')
        return request.render('theme_ninja_quiz.theme_ninja_quiz_homepage', {
            'error_message': error_message,
        })

    @http.route('/quiz/validate_pin', type='http', auth='public', website=True, methods=['POST'], csrf=True)
    def validate_pin(self, **post):
        pin = post.get('pin')
        _logger.info(f"Validating PIN: {pin}")

        if not pin:
            return request.redirect('/?error_message=Por favor, ingresa un PIN.')

        Survey = request.env['survey.survey']
        survey = Survey.sudo().search([('session_code', '=', pin)], limit=1)

        if not survey:
            return request.redirect('/?error_message=PIN inválido. Intenta de nuevo.')

        UserInput = request.env['survey.user_input']
        user_input = UserInput.sudo().search([
            ('survey_id', '=', survey.id),
            ('state', '=', 'in_progress')
        ], limit=1)

        if not user_input:
            user_input = UserInput.sudo().create({
                'survey_id': survey.id,
                'state': 'in_progress',
                'partner_id': request.env.user.partner_id.id if not request.env.user.is_public else False,
            })

        access_token = user_input.access_token
        _logger.info(f"Redirecting to quiz with survey_id: {survey.id}, token: {access_token}")

        return request.redirect(f'/play/{survey.id}?token={access_token}')

    @http.route('/play/<int:survey_id>', type='http', auth='public', website=True)
    def play_quiz(self, survey_id, token=None, **kwargs):
        Survey = request.env['survey.survey']
        survey = Survey.sudo().search([('id', '=', survey_id)], limit=1)

        if not survey:
            return request.redirect('/?error_message=Encuesta no encontrada.')

        UserInput = request.env['survey.user_input']
        user_input = UserInput.sudo().search([
            ('survey_id', '=', survey.id),
            ('access_token', '=', token),
            ('state', '=', 'in_progress')
        ], limit=1)

        token_valid = bool(user_input)
        survey_exists = bool(survey)

        qcontext = {
            'survey_id': survey_id,
            'survey_exists_str': str(survey_exists).lower(),
            'token_str': token or '',
            'token_valid_for_page': token_valid,
            'play_page_title_from_controller': survey.title if survey else '¡Ninja Quiz!',
        }

        _logger.info(f"Rendering template theme_ninja_quiz.theme_ninja_quiz_playpage_container with context: {qcontext}")
        return request.render('theme_ninja_quiz.theme_ninja_quiz_playpage_container', qcontext)