/** @odoo-module **/

import { Component, onMounted, useState } from "@odoo/owl";
export class KahootSurveyRunner extends Component {
    setup() {
        this.pin = this.props.pin;

        this.state = useState({
            loading: true,
            currentQuestion: null,
        });

        onMounted(async () => {
            const preguntas = await this.fetchQuestions(this.pin);
            this.state.currentQuestion = preguntas[0];
            this.state.loading = false;
        });
    }

    async fetchQuestions(pin) {
        console.log("Usando PIN:", pin);
        // Simulá preguntas por ahora
        return [
            {
                id: 1,
                texto: `¿Cuál es la capital de Francia? (PIN: ${pin})`,
                opciones: ["Madrid", "París", "Roma", "Berlín"],
                correcta: "París"
            }
        ];
    }

    selectAnswer(opcion) {
        alert(`Elegiste: ${opcion}`);
    }
}
