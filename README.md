# PlanExamen — Distribuidor Inteligente de Estudio por Pesos

> **Enlaces del proyecto**

**Link:** `https://hunabbohorquez.github.io/PlanExamen/`

**Repositorio en GitHub:** `https://github.com/HunabBohorquez/PlanExamen`

> 📝 **Nota:** este proyecto tiene los **mismos archivos** que el repositorio de GitLab
> (`index.html`, `styles.css`, `app.js`, `README.md`). Solo cambia la plataforma de alojamiento.

---

## Descripción del Proyecto

**PlanExamen** es una aplicación web desarrollada íntegramente con tecnologías estándar del navegador (**HTML5**, **CSS3** y **JavaScript ES6+ Vanilla**, sin frameworks ni dependencias externas) diseñada para optimizar la preparación de exámenes universitarios y técnicos.

A diferencia de los calendarios tradicionales que dividen el tiempo de manera uniforme, PlanExamen pondera cada tema según su **peso real en la calificación**, su **nivel de dificultad** y el **dominio actual** del estudiante, reservando además un margen final dedicado exclusivamente a consolidación y simulacro de examen.

### Características Principales
- **Configuración Temporal Adaptativa:** Cálculo automático de días disponibles desde la fecha actual hasta el examen (mínimo 1 día), diferenciando la disponibilidad horaria entre semana (Lunes–Viernes) y fin de semana (Sábado–Domingo).
- **Gestor CRUD de Temario con Normalización:** Alta, edición y eliminación de temas con alerta automática cuando la suma de pesos difiere del 100%, aplicando normalización proporcional sin interrumpir el flujo de cálculo.
- **Visualización Nativa en `<canvas>`:** Gráfico de barras agrupadas con soporte HiDPI/Retina que contrasta el porcentaje de peso en el examen frente al porcentaje real de horas de estudio asignadas.
- **Seguimiento Interactivo y Exportación:** Cronograma diario con casillas de verificación (`Estudiado`), barra de progreso global en tiempo real, persistencia automática en `localStorage` y exportación directa a **CSV** o lista de tareas en **Markdown**.

---

## Fórmula Algorítmica de Priorización

Para cada tema $i$, el motor de cálculo (`StudyScheduler`) determina la puntuación de necesidad de estudio mediante:

$$\text{Score}_i = \text{PesoNormalizado}_i \times \text{Dificultad}_i \times \left(1 - \frac{\text{Dominio}_i}{100} + 0.1\right)$$

Donde:
- **$\text{PesoNormalizado}_i$:** $\left(\frac{\text{Peso}_i}{\sum \text{Pesos}}\right) \times 100$. Si los pesos ingresados suman $100\%$, coincide exactamente con el peso original.
- **$\text{Dificultad}_i \in \{1, 2, 3, 4, 5\}$:** Factor multiplicador de complejidad conceptual/operativa.
- **$\left(1 - \frac{\text{Dominio}_i}{100} + 0.1\right)$:** Brecha de aprendizaje con un piso mínimo de $0.1$ ($10\%$) para garantizar que incluso los temas dominados al $100\%$ reciban un tiempo básico de refresco.

### Regla de Distribución del Tiempo Total ($T_{\text{total}}$)
1. **15% de Reserva Final ($0.15 \times T_{\text{total}}$):** Se asigna al final del calendario al bloque **"Repaso General y Simulacro de Examen"**.
2. **85% de Estudio por Temas ($0.85 \times T_{\text{total}}$):** Se reparte proporcionalmente al $\text{Score}_i$ de cada tema:
   $$\text{Horas}_i = \left(\frac{\text{Score}_i}{\sum_{j=1}^{n} \text{Score}_j}\right) \times (0.85 \times T_{\text{total}})$$

---

## Instrucciones de Ejecución

No requiere instalación de paquetes, compilación ni servidor backend:

1. Descarga o clona los 4 archivos (`index.html`, `styles.css`, `app.js`, `README.md`) dentro de una misma carpeta.
2. Haz doble clic sobre `index.html` o ábrelo directamente en cualquier navegador moderno (Chrome, Firefox, Edge, Safari).
3. Pulsa **"Cargar Examen Demo"** en la barra superior para poblar un escenario completo de prueba o comienza a registrar tus propios temas.

---

## Pruebas Verificables (Escenario "Cargar Examen Demo")

Al pulsar el botón **"Cargar Examen Demo"**, se carga la materia **Cálculo Vectorial — Examen Final** con fecha a **10 días**, **$3.0\text{ h}$ entre semana** y **$5.0\text{ h}$ en fin de semana**.

> **Nota sobre el calendario:** En un horizonte de 10 días consecutivos desde hoy, siempre existen exactamente **7 días entre semana** (Lunes–Viernes) y **3 días de fin de semana** (Sábado–Domingo), independientemente del día de la semana en que se ejecute la prueba.

### 1. Presupuesto Horario Total
- **Días entre semana:** $7 \times 3.0\text{ h} = 21.00\text{ h}$
- **Días de fin de semana:** $3 \times 5.0\text{ h} = 15.00\text{ h}$
- **Tiempo Total Disponible ($T_{\text{total}}$):** **$36.00\text{ h}$** ($36\text{ h } 0\text{ min}$)
- **Presupuesto 85% para Temario:** $36.00 \times 0.85 =$ **$30.60\text{ h}$** ($30\text{ h } 36\text{ min}$)
- **Reserva 15% Repaso General y Simulacro:** $36.00 \times 0.15 =$ **$5.40\text{ h}$** ($5\text{ h } 24\text{ min}$)

### 2. Desglose Matemático Exacto por Tema ($\sum \text{Score} = 259.60$)

| # | Tema | Peso (%) | Dif. | Dominio (%) | Score | % Tiempo (del 85%) | Horas Asignadas | Duración Exacta |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | Optimización sin Restricciones y Multiplicadores de Lagrange | 18% | 5 | 20% | **81.00** | **31.20%** | 9.547 h | **9 h 33 min** |
| 2 | Integrales Triples en Coordenadas Cilíndricas y Esféricas | 12% | 5 | 15% | **57.00** | **21.96%** | 6.719 h | **6 h 43 min** |
| 3 | Teoremas de Green, Stokes y Gauss | 10% | 5 | 10% | **50.00** | **19.26%** | 5.894 h | **5 h 54 min** |
| 4 | Integrales Dobles en Coordenadas Rectangulares y Polares | 15% | 4 | 40% | **42.00** | **16.18%** | 4.951 h | **4 h 57 min** |
| 5 | Derivadas Parciales y Regla de la Cadena | 15% | 3 | 65% | **20.25** | **7.80%** | 2.387 h | **2 h 23 min** |
| 6 | Gradiente, Derivada Direccional y Planos Tangentes | 12% | 3 | 50% | **21.60** | **8.32%** | 2.546 h | **2 h 33 min** |
| 7 | Campos Vectoriales, Rotacional y Divergencia | 8% | 3 | 60% | **12.00** | **4.62%** | 1.414 h | **1 h 25 min** |
| 8 | Límites y Continuidad Multivariable | 10% | 2 | 80% | **6.00** | **2.31%** | 0.707 h | **42 min** |
| — | **Suma Temario (85%)** | **100%** | — | — | **289.85** | **100.00%** | **30.600 h** | **30 h 36 min** |
| — | **Repaso General y Simulacro (15%)** | — | — | — | — | — | **5.400 h** | **5 h 24 min** |
| — | **TOTAL GENERAL (100%)** | — | — | — | — | — | **36.000 h** | **36 h 0 min** |

*(Nota: Al renderizar la tabla, los temas aparecen en el orden de captura y en el cronograma diario se ordenan automáticamente de mayor a menor Score, iniciando por Optimización y Multiplicadores de Lagrange).*
