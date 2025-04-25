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
            "web/static/src/scss/bootstrap_overridden.scss",
            "theme_ninja_quiz/static/src/scss/custom.scss",
            "theme_ninja_quiz/static/src/js/survey_runner.js",
            "theme_ninja_quiz/static/src/js/survey_init.js",
        ],
        "web.assets_frontend_lazy": [
            "web/static/lib/owl/owl.js",
            "web/static/src/js/overlay/overlay_container.js",
            "web_editor/static/src/js/upload_progress_toast.js"
        ]
    },
    "application": False,
    "auto_install": False
}