/**@odoo-module */

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
const { Component, useState, onWillStart } = owl;

export class OwlQuizDashboard extends Component {
    setup() {
        this.state = useState({
            title: " ",
        });

        onWillStart(async () => {
            console.log("onWillStart");
            this.state.title = "Hola Theme Ninja Quiz Dashboard";
            console.log("this.state.title", this.state.title);
        });
    }
}

OwlQuizDashboard.template = "owl.QuizDashboard";
registry.category("actions").add("owl.quiz_dashboard", OwlQuizDashboard);


