# -*- coding: utf-8 -*-
{
    'name': "Ninja Quiz Theme Extension",
    'summary': """
        Extiende la funcionalidad de Encuestas para crear quizzes interactivos
        tipo Kahoot con acceso por PIN y feedback en tiempo real.""",
    'description': """
        Módulo para Odoo 17 que permite:
        - Crear quizzes basados en el módulo Survey.
        - Acceso a quizzes mediante un PIN único.
        - Interfaz de juego interactiva con Owl Framework.
        - Preguntas cronometradas.
        - Feedback instantáneo por pregunta.
        - Explicaciones detalladas para las respuestas.
        - Barra de progreso visual.
        - Textos del frontend configurables desde el backend.
    """,
    'author': "Tu Nombre/Empresa",
    'website': "https://www.tuwebsite.com",
    'category': 'Website/Survey',
    'version': '2.0.0',
    'license': 'LGPL-3', # O la licencia que prefieras
    'depends': [
        'base',
        'website',
        'survey', # Dependencia fundamental
    ],
    'data': [
        # Archivos de seguridad (si los hubiera, ej. ir.model.access.csv)
        # 'security/ir.model.access.csv',

        # Vistas de Modelos (Backend)
        'views/survey_survey_views.xml',
        'views/survey_question_views.xml',
        # 'views/survey_user_input_views.xml', # Si necesitas extender vistas de user_input

        # Plantillas QWeb del Sitio Web (Frontend)
        'views/templates_quiz_pages.xml',

        # Definición de Assets (JS/CSS/Owl Templates)
        'views/assets.xml',

        # Datos de demostración (opcional)
        # 'data/survey_quiz_demo_data.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            # Owl Framework (ya es parte de Odoo 17, pero si necesitaras algo específico)
            # CSS (si tienes estilos personalizados)
            # 'theme_ninja_quiz/static/src/css/quiz_styles.css',

            # JavaScript y Plantillas Owl
            # El orden puede ser importante si hay dependencias entre los JS
            'theme_ninja_quiz/static/src/js/survey_data_service.js',
            'theme_ninja_quiz/static/src/js/kahoot_survey_runner.js',
            'theme_ninja_quiz/static/src/js/mount_component.js',
            # Las plantillas XML de Owl se declaran en assets.xml como 'web.assets_qweb'
            # o directamente en el componente JS si son pequeñas.
            # Para archivos XML separados, se declaran en 'web.assets_qweb' dentro de assets.xml
        ],
    },
    'installable': True,
    'application': True, # Si es una aplicación principal
    'auto_install': False,
}