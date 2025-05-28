{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.2", # Incrementa la versión por los cambios
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": ["website", "survey"],
    "data": [
        "data/config.xml",
        "views/layout.xml",
        "views/footer.xml",
        "views/components.xml", # Si aún lo usas y está definido
        "views/survey_views.xml",
        "views/snippets/s_quiz_home.xml",   # Define el snippet de inicio
        "views/snippets/s_quiz_play.xml",   # Define el snippet de juego
        "views/snippets/snippets.xml",      # Registra los snippets en el editor
        "views/website_pages.xml",          # Define las páginas contenedoras
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_ninja_quiz/static/src/scss/custom.scss",
            # OWL component and related JS for KahootSurveyRunner
            "theme_ninja_quiz/static/src/js/lib/SurveyDataService.js",
            "theme_ninja_quiz/static/src/js/lib/StateManager.js", # Si es necesario para KahootSurveyRunner
            "theme_ninja_quiz/static/src/js/kahoot_survey_runner.js", # Tu componente OWL principal
            "theme_ninja_quiz/static/src/js/lib/mountComponent.js", # El script que monta el componente
        ],
    },
    "application": False,
    "auto_install": False,
    "installable": True,
}