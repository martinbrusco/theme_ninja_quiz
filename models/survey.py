from odoo import models, fields

# Extiende el modelo survey.user_input para manejar respuestas
class SurveyUserInput(models.Model):
    _inherit = "survey.user_input"

    # Crea una nueva respuesta para una encuesta
    def create_answer(self, vals):
        # Crea un nuevo registro de survey.user_input
        user_input = self.env["survey.user_input"].create({
            "survey_id": vals.get("survey_id"),  # ID de la encuesta
            "partner_id": self.env.user.partner_id.id,  # Asocia al usuario actual
            "state": "in_progress",  # Estado inicial
        })

        # Crea una línea de respuesta para la pregunta
        self.env["survey.user_input.line"].create({
            "user_input_id": user_input.id,  # ID del input del usuario
            "question_id": vals.get("question_id"),  # ID de la pregunta
            "answer_type": "suggestion",  # Tipo de respuesta
            "suggested_answer_id": vals.get("answer_id"),  # ID de la opción seleccionada
        })

        return user_input.id  # Retorna el ID del input creado

# Extiende el modelo survey.question para agregar el campo explanation
class SurveyQuestion(models.Model):
    _inherit = "survey.question"

    # Campo para almacenar una explicación que se muestra tras responder
    explanation = fields.Text("Explicación", help="Explicación que se muestra después de responder la pregunta.")