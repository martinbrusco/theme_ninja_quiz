from odoo import http

class SaludoController(http.Controller):
    @http.route('/quiz/hola', type='http', auth='public', website=True)
    def hola(self, **kw):
        return "¡Hola desde el módulo quiz!"
