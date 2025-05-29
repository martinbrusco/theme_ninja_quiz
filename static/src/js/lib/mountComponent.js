console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log A) Inicio Archivo.");

odoo.define('@theme_ninja_quiz/js/lib/mountComponent', ['@odoo/owl'], function(require) {
    'use strict';

    console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log B) Inicio odoo.define.");

    const { Component, mount, xml, useState } = require("@odoo/owl");

    console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log C) Owl importado.");

    // --- Definición del Componente SÚPER SÚPER SÚPER SIMPLE (local) ---
    class FinalLocalTestComponent extends Component {
        static template = xml`
            <div>
                <h1>Test Definitivo Props Locales</h1>
                <p>Prop 'mensajeDirecto': <t t-esc="props.mensajeDirecto || '--- MENSAJE PROPS NO LLEGÓ ---'"/></p>
                <p>Prop 'numeroDirecto': <t t-esc="props.numeroDirecto === undefined ? '--- NÚMERO PROPS NO LLEGÓ ---' : props.numeroDirecto"/></p>
                <hr/>
                <p>Estado contador: <t t-esc="state.contador"/></p>
                <button t-on-click="incrementar">Incrementar</button>
            </div>
        `;

        setup(props) {
            console.log("FINAL_LOCAL_TEST_COMPONENT: setup() INVOCADO.");
            console.log("FINAL_LOCAL_TEST_COMPONENT: Valor CRUDO de 'props' recibido:", props);
            
            if (props) {
                console.log("FINAL_LOCAL_TEST_COMPONENT: Tipo de 'props':", typeof props);
                try {
                    console.log("FINAL_LOCAL_TEST_COMPONENT: 'props' como JSON:", JSON.stringify(props));
                } catch (e) {
                    console.warn("FINAL_LOCAL_TEST_COMPONENT: No se pudo convertir 'props' a JSON:", e);
                }
                console.dir(props); // Inspección detallada
            } else {
                console.error("FINAL_LOCAL_TEST_COMPONENT: ¡CRÍTICO! 'props' es null o undefined en setup.");
            }
            
            // Para mostrar en el template, Owl hace que `this.props` esté disponible si se pasan.
            // No necesitamos this.propsReceivedAtSetup si accedemos a props.* directamente en el template.

            this.state = useState({ contador: (props && props.valorInicialContador !== undefined) ? props.valorInicialContador : 0 });
            console.log("FINAL_LOCAL_TEST_COMPONENT: Estado inicializado. Contador:", this.state.contador);
        }

        incrementar() {
            this.state.contador++;
            console.log("FINAL_LOCAL_TEST_COMPONENT: Contador incrementado a", this.state.contador);
        }
    }
    console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log D) Clase FinalLocalTestComponent definida.");
    // --- Fin Definición Componente ---

    const placeholderId = "kahoot-survey-runner-placeholder";
    let attempts = 0;
    const maxAttempts = 5; // Reducido para ver logs más rápido
    let mountInterval;

    function tryMountFinalLocalTestComponent() {
        console.log(`MOUNTCOMPONENT.JS: (v53-TEST FINAL Log E) tryMountFinalLocalTestComponent, intento #${attempts + 1}`);
        attempts++;
        
        const placeholder = document.getElementById(placeholderId);
        
        if (placeholder) {
            console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log F) Placeholder ENCONTRADO:", placeholderId);
            clearInterval(mountInterval); 

            if (!placeholder.classList.contains('owl-final-local-test-mounted')) {
                placeholder.dataset.owlMountingFinalLocal = 'true'; 
                
                const propsDefinitivas = {
                    mensajeDirecto: "¡Props SÍ LLEGARON al Componente Local!",
                    numeroDirecto: 2024,
                    valorInicialContador: 7
                };
                console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log G) 'propsDefinitivas' a pasar:", propsDefinitivas);

                try {
                    mount(FinalLocalTestComponent, placeholder, { props: propsDefinitivas }); 
                    console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log H) LLAMADA a mount(FinalLocalTestComponent) REALIZADA.");
                    placeholder.classList.add('owl-final-local-test-mounted'); 
                    delete placeholder.dataset.owlMountingFinalLocal;
                } catch (err) {
                    console.error("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log I) ERROR EN mount() para FinalLocalTestComponent:", err);
                    delete placeholder.dataset.owlMountingFinalLocal;
                }
            } else {
                console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log J) FinalLocalTestComponent ya montado.");
            }
        } else {
            console.log(`MOUNTCOMPONENT.JS: (v53-TEST FINAL Log K) Placeholder #${placeholderId} NO encontrado en intento ${attempts}.`);
            if (attempts >= maxAttempts) {
                clearInterval(mountInterval);
                console.error(`MOUNTCOMPONENT.JS: (v53-TEST FINAL Log L) Placeholder #${placeholderId} NO encontrado tras ${maxAttempts} intentos.`);
            }
        }
    }
    
    console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log M) Programando setInterval.");
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log N) DOM ya cargado. Iniciando.");
        mountInterval = setInterval(tryMountFinalLocalTestComponent, 600); // Intervalo corto
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log O) DOMContentLoaded. Iniciando.");
            mountInterval = setInterval(tryMountFinalLocalTestComponent, 600);
        });
    }

    console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log P) Fin de odoo.define.");
    return {}; 
});

console.log("MOUNTCOMPONENT.JS: (v53-TEST FINAL Log Q) Fin de análisis del archivo.");