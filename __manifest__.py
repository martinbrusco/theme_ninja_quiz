{
    'name': 'Theme Ninja Quiz',
    'description': 'Tema para Ninja Quiz',
    'version': '17.0.1.0.0',
    'category': 'Theme',
    'type': 'theme',
    'depends': ['ninja_quiz_auxiliar', 'website'],
    'data': [
        'views/homepage_template.xml',
        'views/play_page_template.xml',
        'views/components_library.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'theme_ninja_quiz/static/src/css/styles.scss',
        ],
    },
}