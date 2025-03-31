{
    'name': 'Theme Ninja Quiz',
    "version": "17.0.1.0",
    'summary': 'Theme Ninja Quiz',
    'description': "Tema Ninja para Quiz",
    'category': 'Demo',
    'author': 'Martin',
    'images': ['static/description/icon.png'],
    'website': 'https://www.google.com',
    'license': 'AGPL-3',
    'depends': ['base', 'web'],
    'data': [
        'views/quiz_dashboard.xml'
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
    'assets': {
        'web.assets_backend': [
            'theme_ninja_quiz/static/src/components/quiz_dashboard.js',
            'theme_ninja_quiz/static/src/components/quiz_dashboard.xml',
        ],
    }

}
