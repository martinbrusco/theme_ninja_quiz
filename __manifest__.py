{
    'name': 'Theme Ninja Quiz',
    'description': '!Vamos que esta si va!',
    'version': '1.0',
    'category': 'Theme/Creative',
    'depends': ['website', 'survey', 'web'],
    'data': [
        'data/config.xml',
        'views/snippets/snippets.xml',
        'views/snippets/s_quiz_home.xml',  # Define theme_ninja_quiz_homepage
        'views/snippets/s_quiz_play.xml',
        'views/snippets/footer.xml',
        'views/components.xml',
        'views/kahoot_template.xml',
        'views/layout.xml',
        'views/survey_views.xml',
        'views/website_pages.xml',
        'views/homepage.xml',
    ],
    'assets': {
        'web.assets_common': [
            'theme_ninja_quiz/static/src/scss/custom.scss',
            'theme_ninja_quiz/static/src/js/lib/SurveyDataService.js',
            'theme_ninja_quiz/static/src/js/lib/StateManager.js',
            'theme_ninja_quiz/static/src/js/kahoot_survey_runner.js',
            'theme_ninja_quiz/static/src/js/lib/mountComponent.js',
        ],
    },
    'application': False,
    'auto_install': False,
}