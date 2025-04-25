{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.0",
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": ["web", "website", "survey"],
    "data": [
        "views/layout.xml",
        "views/footer.xml",
        "views/homepage.xml",
        "views/components.xml",
        "views/play.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            # Dependencias esenciales para OWL
            "web/static/lib/owl/owl.js",              # Framework OWL
            "web/static/src/env.js",                 # Entorno de OWL
            # Dependencias para el registry y los servicios
            "web/static/src/core/registry.js",       # Registry para servicios
            "web/static/src/core/browser/browser.js", # Dependencia para el servicio RPC
            # Dependencias para RPC
            "web/static/src/core/errors/error_service.js",  # Manejo de errores
            "web/static/src/core/utils/functions.js",       # Utilidades necesarias para RPC
            "web/static/src/core/network/rpc_service.js",   # Módulo RPC
            # Nuestros archivos
            "theme_ninja_quiz/static/src/js/kahoot_survey_runner.js",
            "theme_ninja_quiz/static/src/scss/custom.scss",
        ],
    },
    "application": False,
    "auto_install": False,
}