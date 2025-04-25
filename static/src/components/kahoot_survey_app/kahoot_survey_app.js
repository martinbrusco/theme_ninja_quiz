/** @odoo-module **/

import { Component, xml } from "@odoo/owl";

export class KahootSurveyApp extends Component {
    static template = xml/* xml */`
        <div class="quiz-start">
            <h2>Esperando jugadores...</h2>
            <p>Pronto iniciaremos el juego.</p>
        </div>
    `;
}
