/**
 * PlanExamen — Planificador Algorítmico de Estudio por Pesos, Dificultad y Dominio
 */

class ExamStore {
  constructor(storageKey = "planexamen_state_v1") {
    this.storageKey = storageKey;
    this.state = this.load() || this.createDefaultState();
  }

  getTodayISO() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
  }

  addDaysISO(baseISO, daysToAdd) {
    const [year, month, day] = baseISO.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + daysToAdd);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  createDefaultState() {
    return {
      config: {
        title: "Examen Parcial de Ingeniería",
        examDate: this.addDaysISO(this.getTodayISO(), 7),
        weekdayHours: 2.5,
        weekendHours: 4.5,
      },
      topics: [],
      completedBlocks: {},
    };
  }

  createDemoState() {
    const demoTopics = [
      { id: "t1", name: "Límites y Continuidad Multivariable", weight: 10, difficulty: 2, mastery: 80 },
      { id: "t2", name: "Derivadas Parciales y Regla de la Cadena", weight: 15, difficulty: 3, mastery: 65 },
      { id: "t3", name: "Gradiente, Derivada Direccional y Planos Tangentes", weight: 12, difficulty: 3, mastery: 50 },
      { id: "t4", name: "Optimización sin Restricciones y Multiplicadores de Lagrange", weight: 18, difficulty: 5, mastery: 20 },
      { id: "t5", name: "Integrales Dobles en Coordenadas Rectangulares y Polares", weight: 15, difficulty: 4, mastery: 40 },
      { id: "t6", name: "Integrales Triples en Coordenadas Cilíndricas y Esféricas", weight: 12, difficulty: 5, mastery: 15 },
      { id: "t7", name: "Campos Vectoriales, Rotacional y Divergencia", weight: 8, difficulty: 3, mastery: 60 },
      { id: "t8", name: "Teoremas de Green, Stokes y Gauss", weight: 10, difficulty: 5, mastery: 10 },
    ];

    return {
      config: {
        title: "Cálculo Vectorial — Examen Final",
        examDate: this.addDaysISO(this.getTodayISO(), 10),
        weekdayHours: 3,
        weekendHours: 5,
      },
      topics: demoTopics,
      completedBlocks: {},
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.config || !Array.isArray(parsed.topics)) return null;
      return {
        config: parsed.config,
        topics: parsed.topics,
        completedBlocks: parsed.completedBlocks || {},
      };
    } catch {
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (err) {
      console.error("Error guardando en localStorage:", err);
    }
  }

  updateConfig(partialConfig) {
    this.state.config = { ...this.state.config, ...partialConfig };
    this.save();
  }

  addTopic({ name, weight, difficulty, mastery }) {
    const id = `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.state.topics.push({
      id,
      name: name.trim(),
      weight: Number(weight),
      difficulty: Number(difficulty),
      mastery: Number(mastery),
    });
    this.save();
  }

  updateTopic(id, { name, weight, difficulty, mastery }) {
    const index = this.state.topics.findIndex((t) => t.id === id);
    if (index === -1) return;
    this.state.topics[index] = {
      ...this.state.topics[index],
      name: name.trim(),
      weight: Number(weight),
      difficulty: Number(difficulty),
      mastery: Number(mastery),
    };
    this.save();
  }

  deleteTopic(id) {
    this.state.topics = this.state.topics.filter((t) => t.id !== id);
    this.save();
  }

  toggleBlockCompletion(blockId, isCompleted) {
    if (isCompleted) {
      this.state.completedBlocks[blockId] = true;
    } else {
      delete this.state.completedBlocks[blockId];
    }
    this.save();
  }

  loadDemo() {
    this.state = this.createDemoState();
    this.save();
  }

  resetAll() {
    this.state = this.createDefaultState();
    this.save();
  }
}

class StudyScheduler {
  static DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  static MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  static parseLocalDate(isoStr) {
    const [y, m, d] = isoStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  static formatDisplayDate(dateObj) {
    const dayNum = String(dateObj.getDate()).padStart(2, "0");
    const monthName = this.MONTH_NAMES[dateObj.getMonth()];
    return `${dayNum} ${monthName} ${dateObj.getFullYear()}`;
  }

  static formatDuration(hoursDecimal) {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} h`;
    return `${hrs} h ${mins} min`;
  }

  static buildAvailableDays(examDateISO, weekdayHours, weekendHours) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = this.parseLocalDate(examDateISO);
    examDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((examDate - today) / 86400000);
    const totalDays = Math.max(1, diffDays);

    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const current = new Date(today);
      current.setDate(today.getDate() + i);
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const capacityHours = isWeekend ? Number(weekendHours) : Number(weekdayHours);

      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");

      days.push({
        dateISO: `${y}-${m}-${d}`,
        displayDate: this.formatDisplayDate(current),
        dayName: this.DAY_NAMES[dayOfWeek],
        isWeekend,
        capacityHours: Math.max(0, capacityHours),
      });
    }

    return days;
  }

  static computePlan(config, topics) {
    const days = this.buildAvailableDays(config.examDate, config.weekdayHours, config.weekendHours);
    const totalAvailableHours = days.reduce((acc, d) => acc + d.capacityHours, 0);

    const rawWeightSum = topics.reduce((acc, t) => acc + Number(t.weight || 0), 0);
    const reviewHours = totalAvailableHours * 0.15;
    const topicsBudgetHours = totalAvailableHours * 0.85;

    const scoredTopics = topics.map((topic) => {
      const normalizedWeight = rawWeightSum > 0 ? (topic.weight / rawWeightSum) * 100 : 0;
      const masteryFactor = 1 - topic.mastery / 100 + 0.1;
      const score = normalizedWeight * topic.difficulty * masteryFactor;
      return {
        ...topic,
        normalizedWeight,
        score,
        timeSharePct: 0,
        allocatedHours: 0,
      };
    });

    const totalScore = scoredTopics.reduce((acc, t) => acc + t.score, 0);

    scoredTopics.forEach((topic) => {
      if (totalScore > 0) {
        topic.timeSharePct = (topic.score / totalScore) * 100;
        topic.allocatedHours = (topic.score / totalScore) * topicsBudgetHours;
      }
    });

    const schedule = this.allocateDailyBlocks(days, scoredTopics, reviewHours);

    return {
      daysCount: days.length,
      totalAvailableHours,
      reviewHours,
      topicsBudgetHours,
      rawWeightSum,
      scoredTopics,
      schedule,
    };
  }

  static allocateDailyBlocks(days, scoredTopics, reviewHours) {
    if (days.length === 0 || scoredTopics.length === 0) {
      return days.map((d) => ({ ...d, blocks: [] }));
    }

    const queue = scoredTopics
      .filter((t) => t.allocatedHours > 0.016)
      .sort((a, b) => b.score - a.score)
      .map((t) => ({
        topicId: t.id,
        title: t.name,
        remainingHours: t.allocatedHours,
        isReview: false,
      }));

    if (reviewHours > 0.016) {
      queue.push({
        topicId: "review_simulacro",
        title: "Repaso General y Simulacro de Examen",
        remainingHours: reviewHours,
        isReview: true,
      });
    }

    const EPSILON = 0.016;
    let queueIndex = 0;

    return days.map((day) => {
      let dayRemaining = day.capacityHours;
      const blocks = [];
      let blockCounter = 1;

      while (dayRemaining > EPSILON && queueIndex < queue.length) {
        const currentItem = queue[queueIndex];
        if (currentItem.remainingHours <= EPSILON) {
          queueIndex++;
          continue;
        }

        const chunkHours = Math.min(dayRemaining, currentItem.remainingHours);
        const blockId = `${day.dateISO}_${currentItem.topicId}_${blockCounter++}`;

        blocks.push({
          blockId,
          topicId: currentItem.topicId,
          title: currentItem.title,
          hours: chunkHours,
          isReview: currentItem.isReview,
        });

        dayRemaining -= chunkHours;
        currentItem.remainingHours -= chunkHours;

        if (currentItem.remainingHours <= EPSILON) {
          queueIndex++;
        }
      }

      return {
        ...day,
        blocks,
      };
    });
  }
}

class AllocationChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
  }

  render(scoredTopics) {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(540, this.canvas.parentElement.clientWidth - 16);
    const displayHeight = 320;

    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (!scoredTopics || scoredTopics.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Agrega temas para visualizar la comparativa de Peso vs. Tiempo Asignado.", displayWidth / 2, displayHeight / 2);
      return;
    }

    const padTop = 28;
    const padRight = 24;
    const padBottom = 68;
    const padLeft = 48;

    const plotWidth = displayWidth - padLeft - padRight;
    const plotHeight = displayHeight - padTop - padBottom;

    const maxVal = Math.max(
      30,
      ...scoredTopics.map((t) => Math.max(t.normalizedWeight, t.timeSharePct))
    );
    const yMax = Math.ceil(maxVal / 10) * 10;

    const steps = 5;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= steps; i++) {
      const value = (yMax / steps) * i;
      const y = padTop + plotHeight - (value / yMax) * plotHeight;

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.fillText(`${Math.round(value)}%`, padLeft - 8, y);
    }

    const groupWidth = plotWidth / scoredTopics.length;
    const barWidth = Math.min(28, Math.max(10, (groupWidth - 18) / 2));

    scoredTopics.forEach((topic, idx) => {
      const groupCenterX = padLeft + groupWidth * idx + groupWidth / 2;

      const weightHeight = (topic.normalizedWeight / yMax) * plotHeight;
      const timeHeight = (topic.timeSharePct / yMax) * plotHeight;

      const xWeight = groupCenterX - barWidth - 2;
      const yWeight = padTop + plotHeight - weightHeight;

      const xTime = groupCenterX + 2;
      const yTime = padTop + plotHeight - timeHeight;

      ctx.fillStyle = "#94a3b8";
      this.drawRoundedTopRect(ctx, xWeight, yWeight, barWidth, weightHeight, 4);

      ctx.fillStyle = "#2563eb";
      this.drawRoundedTopRect(ctx, xTime, yTime, barWidth, timeHeight, 4);

      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      ctx.fillStyle = "#475569";
      ctx.fillText(`${topic.normalizedWeight.toFixed(0)}%`, xWeight + barWidth / 2, yWeight - 3);

      ctx.fillStyle = "#1d4ed8";
      ctx.fillText(`${topic.timeSharePct.toFixed(0)}%`, xTime + barWidth / 2, yTime - 3);

      ctx.fillStyle = "#1e293b";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textBaseline = "top";
      this.drawWrappedLabel(ctx, topic.name, groupCenterX, padTop + plotHeight + 8, groupWidth - 8);
    });
  }

  drawRoundedTopRect(ctx, x, y, width, height, radius) {
    if (height <= 0) return;
    const r = Math.min(radius, height / 2, width / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
  }

  drawWrappedLabel(ctx, text, centerX, startY, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    const visibleLines = lines.slice(0, 2);
    if (lines.length > 2) {
      visibleLines[1] = visibleLines[1].slice(0, Math.max(3, visibleLines[1].length - 3)) + "...";
    }

    visibleLines.forEach((line, i) => {
      ctx.fillText(line, centerX, startY + i * 14);
    });
  }
}

class UIController {
  constructor(store, chart) {
    this.store = store;
    this.chart = chart;
    this.latestPlan = null;

    this.cacheDOM();
    this.bindEvents();
    this.syncConfigInputs();
    this.refresh();
  }

  cacheDOM() {
    this.dom = {
      examTitle: document.getElementById("examTitle"),
      examDate: document.getElementById("examDate"),
      weekdayHours: document.getElementById("weekdayHours"),
      weekendHours: document.getElementById("weekendHours"),
      totalAvailableHours: document.getElementById("totalAvailableHours"),
      daysRemainingBadge: document.getElementById("daysRemainingBadge"),

      weightSumBadge: document.getElementById("weightSumBadge"),
      weightAlert: document.getElementById("weightAlert"),

      topicForm: document.getElementById("topicForm"),
      editingTopicId: document.getElementById("editingTopicId"),
      topicName: document.getElementById("topicName"),
      topicWeight: document.getElementById("topicWeight"),
      topicDifficulty: document.getElementById("topicDifficulty"),
      topicMastery: document.getElementById("topicMastery"),
      topicMasteryDisplay: document.getElementById("topicMasteryDisplay"),
      btnSaveTopic: document.getElementById("btnSaveTopic"),
      btnCancelEdit: document.getElementById("btnCancelEdit"),

      topicsTableBody: document.getElementById("topicsTableBody"),
      scheduleContainer: document.getElementById("scheduleContainer"),
      scheduleMetaText: document.getElementById("scheduleMetaText"),

      globalProgressText: document.getElementById("globalProgressText"),
      globalProgressBar: document.getElementById("globalProgressBar"),
      globalHoursSummary: document.getElementById("globalHoursSummary"),

      btnLoadDemo: document.getElementById("btnLoadDemo"),
      btnResetAll: document.getElementById("btnResetAll"),
      btnExportCsv: document.getElementById("btnExportCsv"),
      btnCopyMarkdown: document.getElementById("btnCopyMarkdown"),
      toastNotification: document.getElementById("toastNotification"),
    };
  }

  bindEvents() {
    const handleConfigChange = () => {
      this.store.updateConfig({
        title: this.dom.examTitle.value.trim() || "Examen sin título",
        examDate: this.dom.examDate.value || this.store.getTodayISO(),
        weekdayHours: Math.max(0, parseFloat(this.dom.weekdayHours.value) || 0),
        weekendHours: Math.max(0, parseFloat(this.dom.weekendHours.value) || 0),
      });
      this.refresh();
    };

    this.dom.examTitle.addEventListener("input", handleConfigChange);
    this.dom.examDate.addEventListener("change", handleConfigChange);
    this.dom.weekdayHours.addEventListener("input", handleConfigChange);
    this.dom.weekendHours.addEventListener("input", handleConfigChange);

    this.dom.topicMastery.addEventListener("input", () => {
      this.dom.topicMasteryDisplay.textContent = `${this.dom.topicMastery.value}%`;
    });

    this.dom.topicForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const payload = {
        name: this.dom.topicName.value,
        weight: parseFloat(this.dom.topicWeight.value),
        difficulty: parseInt(this.dom.topicDifficulty.value, 10),
        mastery: parseInt(this.dom.topicMastery.value, 10),
      };

      if (!payload.name.trim() || isNaN(payload.weight) || payload.weight <= 0) return;

      const editId = this.dom.editingTopicId.value;
      if (editId) {
        this.store.updateTopic(editId, payload);
        this.resetTopicForm();
      } else {
        this.store.addTopic(payload);
        this.resetTopicForm();
      }
      this.refresh();
    });

    this.dom.btnCancelEdit.addEventListener("click", () => this.resetTopicForm());

    this.dom.btnLoadDemo.addEventListener("click", () => {
      this.store.loadDemo();
      this.resetTopicForm();
      this.syncConfigInputs();
      this.refresh();
      this.showToast("Examen Demo cargado con 8 temas de Cálculo Vectorial (10 días).");
    });

    this.dom.btnResetAll.addEventListener("click", () => {
      this.store.resetAll();
      this.resetTopicForm();
      this.syncConfigInputs();
      this.refresh();
      this.showToast("Planificador reiniciado.");
    });

    this.dom.btnExportCsv.addEventListener("click", () => this.exportToCSV());
    this.dom.btnCopyMarkdown.addEventListener("click", () => this.copyMarkdownChecklist());

    window.addEventListener("resize", () => {
      if (this.latestPlan) {
        this.chart.render(this.latestPlan.scoredTopics);
      }
    });
  }

  syncConfigInputs() {
    const { title, examDate, weekdayHours, weekendHours } = this.store.state.config;
    this.dom.examTitle.value = title;
    this.dom.examDate.value = examDate;
    this.dom.weekdayHours.value = weekdayHours;
    this.dom.weekendHours.value = weekendHours;
  }

  resetTopicForm() {
    this.dom.editingTopicId.value = "";
    this.dom.topicName.value = "";
    this.dom.topicWeight.value = "";
    this.dom.topicDifficulty.value = "3";
    this.dom.topicMastery.value = "40";
    this.dom.topicMasteryDisplay.textContent = "40%";
    this.dom.btnSaveTopic.textContent = "Agregar Tema";
    this.dom.btnCancelEdit.classList.add("hidden");
  }

  startEditTopic(topicId) {
    const topic = this.store.state.topics.find((t) => t.id === topicId);
    if (!topic) return;
    this.dom.editingTopicId.value = topic.id;
    this.dom.topicName.value = topic.name;
    this.dom.topicWeight.value = topic.weight;
    this.dom.topicDifficulty.value = String(topic.difficulty);
    this.dom.topicMastery.value = String(topic.mastery);
    this.dom.topicMasteryDisplay.textContent = `${topic.mastery}%`;
    this.dom.btnSaveTopic.textContent = "Guardar Cambios";
    this.dom.btnCancelEdit.classList.remove("hidden");
    this.dom.topicName.focus();
  }

  refresh() {
    const { config, topics } = this.store.state;
    const plan = StudyScheduler.computePlan(config, topics);
    this.latestPlan = plan;

    this.renderConfigStats(plan);
    this.renderWeightValidation(plan);
    this.renderTopicsTable(plan.scoredTopics);
    this.chart.render(plan.scoredTopics);
    this.renderSchedule(plan);
    this.updateGlobalProgress(plan);
  }

  renderConfigStats(plan) {
    const label = plan.daysCount === 1 ? "1 día disponible" : `${plan.daysCount} días disponibles`;
    this.dom.daysRemainingBadge.textContent = label;
    this.dom.totalAvailableHours.value = `${plan.totalAvailableHours.toFixed(1)} h (${StudyScheduler.formatDuration(plan.totalAvailableHours)})`;
  }

  renderWeightValidation(plan) {
    const sum = Number(plan.rawWeightSum.toFixed(2));
    this.dom.weightSumBadge.textContent = `Suma de pesos: ${sum}%`;

    if (this.store.state.topics.length === 0) {
      this.dom.weightSumBadge.className = "pill pill-info";
      this.dom.weightAlert.classList.add("hidden");
      return;
    }

    if (Math.abs(sum - 100) > 0.01) {
      this.dom.weightSumBadge.className = "pill pill-warn";
      this.dom.weightAlert.textContent = `Aviso: Los pesos ingresados suman ${sum}% (distinto de 100%). El algoritmo normalizó automáticamente cada tema proporcionalmente al 100%.`;
      this.dom.weightAlert.classList.remove("hidden");
    } else {
      this.dom.weightSumBadge.className = "pill pill-ok";
      this.dom.weightAlert.classList.add("hidden");
    }
  }

  renderTopicsTable(scoredTopics) {
    if (scoredTopics.length === 0) {
      this.dom.topicsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">No hay temas registrados. Agrega uno o carga el Examen Demo.</td>
        </tr>`;
      return;
    }

    this.dom.topicsTableBody.innerHTML = scoredTopics
      .map((t) => {
        const stars = "★".repeat(t.difficulty) + "☆".repeat(5 - t.difficulty);
        const weightLabel =
          Math.abs(t.weight - t.normalizedWeight) > 0.05
            ? `${t.weight}% <small>(norm: ${t.normalizedWeight.toFixed(1)}%)</small>`
            : `${t.weight}%`;

        return `
          <tr>
            <td><strong>${this.escapeHTML(t.name)}</strong></td>
            <td>${weightLabel}</td>
            <td><span class="stars" title="Dificultad ${t.difficulty}/5">${stars}</span></td>
            <td>${t.mastery}%</td>
            <td><strong>${t.score.toFixed(2)}</strong></td>
            <td>${StudyScheduler.formatDuration(t.allocatedHours)} <small>(${t.timeSharePct.toFixed(1)}%)</small></td>
            <td>
              <div class="action-cell">
                <button type="button" class="btn-icon" data-action="edit" data-id="${t.id}" title="Editar">✏️</button>
                <button type="button" class="btn-icon delete" data-action="delete" data-id="${t.id}" title="Eliminar">🗑️</button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    this.dom.topicsTableBody.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { action, id } = btn.dataset;
        if (action === "edit") this.startEditTopic(id);
        if (action === "delete") {
          this.store.deleteTopic(id);
          if (this.dom.editingTopicId.value === id) this.resetTopicForm();
          this.refresh();
        }
      });
    });
  }

  renderSchedule(plan) {
    if (this.store.state.topics.length === 0 || plan.totalAvailableHours <= 0) {
      this.dom.scheduleContainer.innerHTML = `<p class="empty-state">Configura al menos 1 hora de estudio y agrega temas para generar el cronograma.</p>`;
      this.dom.scheduleMetaText.textContent = "Sin bloques programados.";
      return;
    }

    this.dom.scheduleMetaText.textContent = `85% Estudio por temas (${StudyScheduler.formatDuration(plan.topicsBudgetHours)}) + 15% Repaso/Simulacro (${StudyScheduler.formatDuration(plan.reviewHours)}).`;

    const completedMap = this.store.state.completedBlocks;

    this.dom.scheduleContainer.innerHTML = plan.schedule
      .map((day, idx) => {
        const blocksHTML =
          day.blocks.length === 0
            ? `<div class="study-block"><span class="block-tag">Día sin horas asignadas (descanso).</span></div>`
            : day.blocks
                .map((block) => {
                  const checked = Boolean(completedMap[block.blockId]);
                  const blockClasses = [
                    "study-block",
                    block.isReview ? "is-review" : "",
                    checked ? "is-completed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return `
                    <div class="${blockClasses}">
                      <div class="block-left">
                        <input
                          type="checkbox"
                          id="chk_${block.blockId}"
                          class="block-checkbox"
                          data-block-id="${block.blockId}"
                          ${checked ? "checked" : ""}
                        />
                        <label for="chk_${block.blockId}" style="cursor:pointer;">
                          <span class="block-title">${this.escapeHTML(block.title)}</span>
                          <span class="block-tag">${block.isReview ? "Fase Final • Simulacro y Consolidación" : "Bloque Priorizado por Score"}</span>
                        </label>
                      </div>
                      <span class="block-duration">${StudyScheduler.formatDuration(block.hours)}</span>
                    </div>`;
                })
                .join("");

        return `
          <div class="day-card">
            <div class="day-card-header">
              <div>
                <strong>Día ${idx + 1} • ${day.dayName}, ${day.displayDate}</strong>
              </div>
              <span class="day-hours-tag">${StudyScheduler.formatDuration(day.capacityHours)}</span>
            </div>
            <div class="day-blocks">${blocksHTML}</div>
          </div>`;
      })
      .join("");

    this.dom.scheduleContainer.querySelectorAll(".block-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const blockId = e.target.dataset.blockId;
        this.store.toggleBlockCompletion(blockId, e.target.checked);
        const parentRow = e.target.closest(".study-block");
        if (parentRow) {
          parentRow.classList.toggle("is-completed", e.target.checked);
        }
        this.updateGlobalProgress(this.latestPlan);
      });
    });
  }

  updateGlobalProgress(plan) {
    let totalPlannedHours = 0;
    let completedHours = 0;
    const completedMap = this.store.state.completedBlocks;

    plan.schedule.forEach((day) => {
      day.blocks.forEach((block) => {
        totalPlannedHours += block.hours;
        if (completedMap[block.blockId]) {
          completedHours += block.hours;
        }
      });
    });

    const pct = totalPlannedHours > 0 ? (completedHours / totalPlannedHours) * 100 : 0;
    this.dom.globalProgressText.textContent = `${pct.toFixed(1)}%`;
    this.dom.globalProgressBar.style.width = `${Math.min(100, pct)}%`;
    this.dom.globalHoursSummary.textContent = `${completedHours.toFixed(1)} h completadas de ${totalPlannedHours.toFixed(1)} h planificadas`;
  }

  exportToCSV() {
    if (!this.latestPlan || this.store.state.topics.length === 0) {
      this.showToast("No hay datos de cronograma para exportar.");
      return;
    }

    const rows = [["Dia", "Fecha", "Dia_Semana", "Tema_o_Bloque", "Tipo", "Horas", "Duracion", "Estado"]];
    const completedMap = this.store.state.completedBlocks;

    this.latestPlan.schedule.forEach((day, idx) => {
      day.blocks.forEach((block) => {
        rows.push([
          `Día ${idx + 1}`,
          day.dateISO,
          day.dayName,
          `"${block.title.replace(/"/g, '""')}"`,
          block.isReview ? "Repaso y Simulacro" : "Estudio de Tema",
          block.hours.toFixed(2),
          StudyScheduler.formatDuration(block.hours),
          completedMap[block.blockId] ? "Estudiado" : "Pendiente",
        ]);
      });
    });

    const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `PlanExamen_${this.store.state.config.title.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast("Archivo CSV descargado correctamente.");
  }

  async copyMarkdownChecklist() {
    if (!this.latestPlan || this.store.state.topics.length === 0) {
      this.showToast("No hay cronograma para copiar.");
      return;
    }

    const { title, examDate } = this.store.state.config;
    const completedMap = this.store.state.completedBlocks;
    const lines = [
      `# Plan de Estudio: ${title}`,
      `- **Fecha del Examen:** ${examDate}`,
      `- **Tiempo Total Planificado:** ${this.latestPlan.totalAvailableHours.toFixed(1)} horas`,
      "",
    ];

    this.latestPlan.schedule.forEach((day, idx) => {
      lines.push(`### Día ${idx + 1} — ${day.dayName}, ${day.displayDate} (${StudyScheduler.formatDuration(day.capacityHours)})`);
      if (day.blocks.length === 0) {
        lines.push(`- *Sin bloques programados*`);
      } else {
        day.blocks.forEach((block) => {
          const mark = completedMap[block.blockId] ? "x" : " ";
          lines.push(`- [${mark}] **${block.title}** — ${StudyScheduler.formatDuration(block.hours)}`);
        });
      }
      lines.push("");
    });

    const mdText = lines.join("\n");

    try {
      await navigator.clipboard.writeText(mdText);
      this.showToast("Lista de tareas en Markdown copiada al portapapeles.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = mdText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      this.showToast("Lista de tareas en Markdown copiada al portapapeles.");
    }
  }

  showToast(message) {
    this.dom.toastNotification.textContent = message;
    this.dom.toastNotification.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.dom.toastNotification.classList.add("hidden");
    }, 3200);
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const store = new ExamStore();
  const canvas = document.getElementById("allocationChart");
  const chart = new AllocationChart(canvas);
  new UIController(store, chart);
});
