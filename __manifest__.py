# addons/theme_ninja_quiz/__manifest__.py
{
    "name": "Theme Ninja Quiz",
    "description": "Un tema que emula una página de ingreso de PIN para un quiz",
    "category": "Theme/Creative",
    "version": "1.0",
    "author": "Martin Brusco",
    "license": "LGPL-3",
    "depends": [
        "web",
        "website",
    ],

    # 1️⃣ Vistas, plantillas y controllers que se cargan en la base de datos
    "data": [
        "views/layout.xml",
        "views/footer.xml",
        "views/homepage.xml",
        "views/components.xml",
        "views/play.xml",
    ],

    # 2️⃣ Assets para el bundle público de Website
    "assets": {
        # CSS y JS que se incrustan/enlazan en páginas frontend
        "website.assets_frontend": [
            # SCSS (se compila a CSS automáticamente)
            "theme_ninja_quiz/static/src/scss/custom.scss",
            # Script principal que monta OWL
            "theme_ninja_quiz/static/src/js/main.js",
            # Entrada a los componentes OWL (opcional si main.js ya lo importa)
            "theme_ninja_quiz/static/src/components/kahoot_survey_runner/index.js",
        ],
        # Plantillas QWeb (cliente) necesarias para OWL
        "website.assets_qweb": [
            "theme_ninja_quiz/static/src/xml/kahoot_survey_runner.xml",
        ],
    },

    # 3️⃣ Opciones
    "application": False,
    "auto_install": False,
}
