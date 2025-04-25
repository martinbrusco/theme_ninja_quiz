from odoo import models, fields

class SurveyUserInput(models.Model):
    _inherit = "survey.user_input"

    def create_answer(self, vals):
        # Crear una nueva respuesta del usuario
        user_input = self.env["survey.user_input"].create({
            "survey_id": vals.get("survey_id"),
            "partner_id": self.env.user.partner_id.id,  # Asociar al usuario actual
            "state": "in_progress",
        })

        # Registrar la respuesta a la pregunta
        self.env["survey.user_input.line"].create({
            "user_input_id": user_input.id,
            "question_id": vals.get("question_id"),
            "answer_type": "suggestion",
            "suggested_answer_id": vals.get("answer_id"),
        })

        return user_input.id