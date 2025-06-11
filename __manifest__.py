{
    'name': 'Theme Ninja Quiz',
    'description': 'Tema visual para el motor de Quiz Kahoot. Emula la apariencia de Kahoot.',
    'type': 'theme', 
    'category': 'Theme/Creative',
    'version': '17.0.1.0',
    'author': 'Martin Brusco',
    'license': 'LGPL-3',
    'depends': [
        'quiz_kahoot_functional',
    ],
    'data': [
        'views/homepage_template.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'theme_ninja_quiz/static/src/scss/custom.scss',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}