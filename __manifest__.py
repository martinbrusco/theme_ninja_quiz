{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.0",
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": ["web", "website"],  # Asegúrate que "web" esté primero
    "data": [
        "views/layout.xml",
        "views/homepage.xml",  # Elimina assets.xml de aquí
        "views/play.xml"
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_ninja_quiz/static/src/scss/custom.scss"
        ]
    },
    "application": False,
    "auto_install": False
}