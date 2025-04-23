{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.0",
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": ["web", "website"],  
    "data": [
        "views/layout.xml",
        "views/footer.xml",
        "views/homepage.xml",  
        "views/components.xml",
        "views/play.xml"
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_ninja_quiz/static/src/scss/custom.scss",
            "theme_ninja_quiz/static/src/js/main.js",
            "theme_ninja_quiz/static/src/components/**/*",
        ],
        "web.assets_qweb": [
            "theme_ninja_quiz/static/src/xml/kahoot_survey_runner.xml",
        ],
    },
    "application": False,
    "auto_install": False
}
