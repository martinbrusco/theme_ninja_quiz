{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.0",
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": ["web", "website", "survey"],
    "data": [
        "views/homepage.xml",
        "data/config.xml",
        "views/layout.xml",
        "views/footer.xml",
        "views/components.xml",
        "views/play.xml",
        "views/survey_views.xml",
        "views/snippets.xml",
    ],
    "assets": {
        "web.assets_common": [
            "web.public.widget",
            "theme_ninja_quiz/static/src/js/lib/SurveyDataService.js",
            "theme_ninja_quiz/static/src/js/lib/StateManager.js",
        ],
        "web.assets_frontend": [
            "theme_ninja_quiz/static/src/scss/custom.scss",
        ],
        "web.assets_frontend_lazy": [],
        "website.assets_editor": [
            "web.public.widget",
            "theme_ninja_quiz/static/src/xml/snippets.xml",
            "theme_ninja_quiz/static/src/js/snippets.js",
            "theme_ninja_quiz/static/src/js/kahoot_survey_runner.js",
        ],
    },
    "application": False,
    "auto_install": False,
}