{
    'name': 'Quiz Game',
    'version': '1.0',
    'summary': 'Quiz game',
    'category': 'Tools',
    'author': 'Martin',
    'depends': ['base', 'web', 'website'],
    'data': [
        'views/quiz_templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'ninja_quiz/static/src/css/quiz_styles.css',
        ],
    },
    'installable': True,
    'application': True,
}
