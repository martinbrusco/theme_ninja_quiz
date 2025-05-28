from odoo import http
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

class NinjaQuizController(http.Controller):

    @http.route('/', type='http', auth="public", website=True)
    def homepage(self, **kw):
        error_message = kw.get('error_message') 
        qcontext = {}
        if error_message:
            qcontext['error_message'] = error_message
        # Renderiza la página 'theme_ninja_quiz_homepage' definida en website_pages.xml
        # Esta página a su vez llama al snippet s_quiz_home_template
        return request.render("theme_ninja_quiz.theme_ninja_quiz_homepage", qcontext)

    @http.route('/quiz/validate_pin', type='http', auth='public', methods=['POST'], website=True, csrf=True)
    def validate_pin(self, **kwargs):
        pin = kwargs.get('pin')
        error_message = None

        if not pin:
            error_message = 'Por favor, ingrese un PIN.'
        
        survey = None
        if pin: 
            survey = request.env['survey.survey'].sudo().search([('session_code', '=', pin)], limit=1)
            if not survey:
                error_message = 'PIN inválido. Por favor, intenta de nuevo.'

        if error_message:
            # Re-renderiza la página de inicio (que usa el snippet) pasándole el mensaje de error.
            return request.render('theme_ninja_quiz.theme_ninja_quiz_homepage', {
                'error_message': error_message
            })

        user = request.env.user
        partner_id = user.partner_id.id if user != request.env.ref('base.public_user') else False
        
        user_input = request.env['survey.user_input'].sudo().search([
            ('survey_id', '=', survey.id),
            ('access_token', '!=', False),
            ('partner_id', '=', partner_id),
            ('state', '=', 'in_progress'), # Considera si quieres permitir reanudar encuestas no completadas
        ], order='create_date desc', limit=1)

        if not user_input: 
            user_input_vals = {
                'survey_id': survey.id,
                'state': 'in_progress', # Siempre se crea en progreso
            }
            if partner_id:
                user_input_vals['partner_id'] = partner_id
            user_input = request.env['survey.user_input'].sudo().create(user_input_vals)
        elif user_input.state == 'done': # Si la encontrada está hecha, crea una nueva.
             user_input_vals = {
                'survey_id': survey.id,
                'state': 'in_progress',
            }
             if partner_id:
                user_input_vals['partner_id'] = partner_id
             user_input = request.env['survey.user_input'].sudo().create(user_input_vals)


        return request.redirect(f'/play/{survey.id}?token={user_input.access_token}')

    @http.route('/play/<int:survey_id>', type='http', auth='public', website=True)
    def play_page(self, survey_id, token=None, **kwargs):
        survey_record = request.env['survey.survey'].sudo().browse(survey_id) # Usar browse para mejor rendimiento si el ID es válido
        survey_exists = survey_record.exists()
        token_is_valid_for_game = False

        if survey_exists and token:
            user_input = request.env['survey.user_input'].sudo().search([
                ('survey_id', '=', survey_id),
                ('access_token', '=', token),
            ], limit=1)
            if user_input:
                if user_input.state == 'done':
                    # Opcional: Si la encuesta ya está completada con este token,
                    # podrías redirigir a una página de resultados o mostrar un mensaje.
                    # Por ahora, lo consideramos no válido para *iniciar* el juego de nuevo.
                    token_is_valid_for_game = False 
                    _logger.info(f"Play page: Attempt to play already completed survey. Survey ID: {survey_id}, Token: {token}")
                else: # 'new' o 'in_progress'
                    token_is_valid_for_game = True
        
        _logger.info(f"Play page context: survey_id={survey_id}, survey_exists={survey_exists}, token={token}, token_valid_for_game={token_is_valid_for_game}")

        qcontext = {
            'survey_id': survey_id, # Para data-survey-id
            'survey_exists_str': str(survey_exists).lower(), # Para data-survey-exists
            'token_str': token, # Para data-token
            'token_valid_for_page': token_is_valid_for_game, # Para la condición t-if en el snippet
            'play_page_title_from_controller': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.play_page_title', '¡Ninja Quiz!'),
        }
        # Renderiza la página contenedora 'theme_ninja_quiz_playpage_container'
        return request.render('theme_ninja_quiz.theme_ninja_quiz_playpage_container', qcontext)

    @http.route('/components', type='http', auth="public", website=True)
    def components(self, **kw):
        # Esta página debería estar definida en website_pages.xml o similar
        # y llamar a tu plantilla theme_ninja_quiz.components_library
        # Si theme_ninja_quiz.components_library es una página completa con website.layout, está bien.
        return request.render("theme_ninja_quiz.components_library", {})


class NinjaQuizSurveyController(http.Controller):

    @http.route('/survey/submit', type='json', auth='public', website=True, methods=['POST'])
    def survey_submit(self, survey_id, question_id, answer_id, access_token):
        try:
            user_input = request.env['survey.user_input'].sudo().search([
                ('survey_id', '=', int(survey_id)),
                ('access_token', '=', access_token),
                ('state', '=', 'in_progress')
            ], limit=1)

            if not user_input:
                _logger.warning(f"Submit attempt with invalid token or survey not in progress. Survey ID: {survey_id}, Token: {access_token}")
                submit_error = request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.submit_error', 'Error: Sesión no válida o encuesta no en progreso.')
                return {'success': False, 'error': submit_error}

            existing_line = request.env['survey.user_input.line'].sudo().search([
                ('user_input_id', '=', user_input.id),
                ('question_id', '=', int(question_id))
            ], limit=1)

            if existing_line:
                _logger.info(f"Question {question_id} already answered for user_input {user_input.id}. Updating answer.")
                existing_line.sudo().write({
                    'suggested_answer_id': int(answer_id),
                    'answer_type': 'suggestion',
                    'skipped': False # Marcar como no saltada si se responde
                })
            else:
                request.env['survey.user_input.line'].sudo().create({
                    'user_input_id': user_input.id,
                    'question_id': int(question_id),
                    'answer_type': 'suggestion',
                    'suggested_answer_id': int(answer_id),
                })

            answer = request.env['survey.question.answer'].sudo().browse(int(answer_id))
            is_correct = answer.is_correct

            return {'success': True, 'correct': is_correct}
        except Exception as e:
            _logger.error("Error submitting survey answer: %s", str(e), exc_info=True)
            submit_error_generic = request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.submit_error', 'Error al procesar la respuesta.')
            return {'success': False, 'error': submit_error_generic}

    @http.route('/survey/get_data', type='json', auth='public', website=True, methods=['POST'])
    def get_survey_data(self, survey_id=None, access_token=None):
        try:
            if not survey_id or not access_token:
                _logger.warning("Get_survey_data attempt with missing survey_id or access_token.")
                return {'success': False, 'error': "Parámetros incompletos."}

            user_input = request.env['survey.user_input'].sudo().search([
                ('survey_id', '=', int(survey_id)),
                ('access_token', '=', access_token),
            ], limit=1)

            if not user_input:
                _logger.warning(f"Get_survey_data attempt with invalid token/survey combination. Survey ID: {survey_id}, Token: {access_token}")
                invalid_token_msg = request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.invalid_token', 'Token o ID de encuesta inválido.')
                return {'success': False, 'error': invalid_token_msg}

            survey_model = request.env['survey.survey'].sudo().browse(int(survey_id))
            if not survey_model.exists():
                _logger.warning(f"Survey with ID {survey_id} not found during get_survey_data.")
                survey_not_found_msg = request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.survey_not_found', 'Encuesta no encontrada.')
                return {'success': False, 'error': survey_not_found_msg % survey_id}

            questions_domain = [('survey_id', '=', survey_model.id)]
            # Filtrar preguntas ya respondidas en este user_input si es necesario para un modo "kahoot" donde no se repiten
            # O manejar la lógica de "ya respondida" en el frontend/OWL
            
            questions_data = request.env['survey.question'].sudo().search_read(
                domain=questions_domain,
                fields=["id", "title", "question_type", "suggested_answer_ids", "is_scored_question", "explanation"],
                order='sequence, id'
            )

            formatted_questions = []
            for q_data in questions_data:
                options = []
                if q_data['suggested_answer_ids']:
                    option_details = request.env['survey.question.answer'].sudo().search_read(
                        domain=[('id', 'in', q_data['suggested_answer_ids'])],
                        fields=["id", "value", "is_correct"],
                        order='sequence, id'
                    )
                    options = [{
                        'id': opt['id'],
                        'text': opt['value']['en_US'] if isinstance(opt['value'], dict) and 'en_US' in opt['value'] else opt['value'],
                        'isCorrect': opt['is_correct'] or False,
                    } for opt in option_details]

                formatted_question = {
                    'id': q_data['id'],
                    'title': q_data['title']['en_US'] if isinstance(q_data['title'], dict) and 'en_US' in q_data['title'] else q_data['title'],
                    'question_type': q_data['question_type'],
                    'options': options,
                    'isScored': q_data['is_scored_question'],
                    'explanation': q_data['explanation'] or "",
                }
                formatted_questions.append(formatted_question)
            
            # No es un error si no hay preguntas, el frontend debe manejarlo.
            # if not formatted_questions:
            #     _logger.info(f"No questions found for survey ID {survey_id} in get_survey_data.")

            return {
                'success': True,
                'surveyId': survey_model.id,
                'surveyTitle': survey_model.title, # Título de la encuesta
                'questions': formatted_questions
            }
        except Exception as e:
            _logger.error("Error in get_survey_data: %s", str(e), exc_info=True)
            error_msg_generic = request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_load_questions_error', 'Error al cargar los datos de la encuesta.')
            return {'success': False, 'error': error_msg_generic}

    @http.route('/survey/validate_token', type='json', auth='public', website=True, methods=['POST'])
    def validate_token(self, survey_id, access_token):
        try:
            if not survey_id or not access_token:
                return {'success': False, 'error': "Parámetros incompletos."}
                
            user_input = request.env['survey.user_input'].sudo().search([
                ('survey_id', '=', int(survey_id)),
                ('access_token', '=', access_token),
            ], limit=1)
            return {'success': bool(user_input)}
        except Exception as e:
            _logger.error("Error validating token: %s", str(e), exc_info=True)
            return {'success': False, 'error': "Error al validar el token."}

    @http.route('/survey/get_config_params', type='json', auth='public', website=True)
    def get_config_params(self):
        params = {
            'survey_not_found': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.survey_not_found', '¡Ups! El quiz con ID %s no existe.'),
            'back_to_home': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.back_to_home', 'Volver al inicio'),
            'loading_questions': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.loading_questions', '¡Cargando preguntas...'),
            'session_expired': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.session_expired', 'sesión ha expirado'),
            'login': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.login', 'Iniciar sesión'),
            'answers_count': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.answers_count', '%s Answers'),
            'question_progress': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.question_progress', 'Pregunta %s de %s'),
            'timer_format': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.timer_format', '%ss'),
            'loading_question': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.loading_question', 'Cargando pregunta...'),
            'icon_skipped': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.icon_skipped', '❓'),
            'icon_correct': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.icon_correct', '✅'),
            'icon_incorrect': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.icon_incorrect', '❌'),
            'feedback_correct': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_correct', '¡Correcto! 🎉'),
            'feedback_incorrect': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_incorrect', 'Incorrecto ❌'),
            'submit_error': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.submit_error', 'Error al enviar la respuesta.'),
            'submit_error_with_message': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.submit_error_with_message', 'Error al enviar la respuesta: %s'),
            'previous_button': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.previous_button', 'Anterior'),
            'next_button': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.next_button', 'Siguiente'),
            'invalid_token': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.invalid_token', '¡Token inválido! Por favor, ingresa un PIN válido.'),
            'feedback_config_error': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_config_error', 'Error al cargar la configuración o las preguntas.'),
            'feedback_no_questions': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_no_questions', 'No hay preguntas disponibles.'),
            'feedback_load_questions_error': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_load_questions_error', 'Error al cargar las preguntas.'),
            'feedback_submit_error': request.env['ir.config_parameter'].sudo().get_param('theme_ninja_quiz.feedback_submit_error', 'Error al enviar la respuesta.'),
        }
        return params