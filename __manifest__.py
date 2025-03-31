{
    'name': 'Theme Ninja Quiz',
    'version': '17.0.1.0.0',
    'summary': 'Tema en Odoo 17',
    'author': 'Martin Brusco',
    'category': 'Website/Quiz',
    'license': 'LGPL-3',
    'depends': ['website'],
    'data': [
        'views/theme_templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'theme_ninja_quiz/static/css/style.css',
        ],
    },
    'installable': True,
    'application': False,
}
