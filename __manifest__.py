{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.2", 
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": ["website", "survey"],
    "data": [
        "data/config.xml",
        "views/layout.xml",
        "views/footer.xml",
        "views/components.xml", 
        "views/survey_views.xml",
        "views/snippets/s_quiz_home.xml",  
        "views/snippets/s_quiz_play.xml",  
        "views/snippets/snippets.xml",     
        "views/website_pages.xml",      
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_ninja_quiz/static/src/scss/custom.scss",
            # OWL component and related JS for KahootSurveyRunner
            "theme_ninja_quiz/static/src/js/lib/SurveyDataService.js",
            "theme_ninja_quiz/static/src/js/lib/StateManager.js", 
            "theme_ninja_quiz/static/src/js/kahoot_survey_runner.js", 
            "theme_ninja_quiz/static/src/js/lib/mountComponent.js", 
        ],
    },
    "application": False,
    "auto_install": False,
    "installable": True,
}