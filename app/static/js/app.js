const API_ROOT = "/api/tasks";

async function apiFetch(path = "", opts = {}) {
    const res = await fetch(API_ROOT + path, Object.assign({
        headers: { "Content-Type": "application/json" }
    }, opts));
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${txt}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

function qs(sel, el = document) { return el.querySelector(sel) }
function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)) }

function formatDateTime(dtStr) {
    if (!dtStr) return "";
    const dt = new Date(dtStr);
    const pad = n => n.toString().padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function formatLocalForCurl(dtStr) {
    if (!dtStr) return null;
    const dt = new Date(dtStr);
    const pad = n => n.toString().padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

async function loadTasks() {
    const container = qs("#tasksWrap");
    try {
        const tasks = await apiFetch("/");
        if (!tasks.length) {
            container.innerHTML = `<p class="muted">No tasks</p>`;
            return;
        }

        const grouped = {};
        tasks.forEach(t => {
            const dateKey = t.due_date ? t.due_date.split("T")[0] : "No due date";
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(t);
        });

        container.innerHTML = Object.entries(grouped).map(([date, ts]) => `
            <div class="task-section">
                <h3>${date}</h3>
                ${ts.map(t => renderCard(t)).join("")}
            </div>
        `).join("");

    } catch (err) {
        container.innerHTML = `<p class="muted">Error: ${err.message}</p>`;
    }
}

function renderCard(t) {
    const status = t.completed ? "Completed" : "Pending";
    const colorVar = `var(--importance-${t.importance || "default"})`;
    const dueAttr = t.due_date ? `data-due="${t.due_date}"` : "";
    return `
<div class="task-card" data-id="${t.id}" data-completed="${t.completed}" style="border-left: 5px solid ${colorVar};">
    <div class="task-header">
        <strong>${t.title}</strong>
        <span>${status} ${t.due_date ? '| <span class="countdown" ' + dueAttr + '>loading...</span>' : ''}</span>
    </div>
    <div class="task-body hidden">
        <p>${t.description || ""}</p>
        <p><strong>Importance:</strong> ${t.importance}</p>
        <p><strong>Due:</strong> ${t.due_date ? formatDateTime(t.due_date) : "—"}</p>
        <div class="task-actions">
            <button class="btn small-btn toggle">${t.completed ? "Undo" : "Mark as done"}</button>
            <button class="btn small-btn edit">Edit</button>
            <button class="btn small-btn danger delete">Delete</button>
        </div>
    </div>
</div>`;
}

function updateCountdowns() {
    qsa(".countdown").forEach(el => {
        const due = new Date(el.dataset.due);
        const now = new Date();
        let diff = Math.floor((due - now) / 1000);

        if (diff <= 0) {
            el.textContent = "Time expired!";
            return;
        }

        const hours = Math.floor(diff / 3600);
        diff %= 3600;
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        el.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    });
}

setInterval(updateCountdowns, 1000);

loadTasks().then(updateCountdowns);

const modal = qs("#modal");
const taskForm = qs("#taskForm");
let editId = null;

function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}
function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    editId = null;
    taskForm.reset();
    qs("#modalTitle").textContent = "New Task";
}

qs("#tasksWrap").addEventListener("click", async (ev) => {
    const card = ev.target.closest(".task-card");
    if (!card) return;
    const id = card.dataset.id;
    const body = qs(".task-body", card);

    if (ev.target.matches(".toggle")) {
        ev.stopPropagation();
        const completed = card.dataset.completed === "true" ? false : true;
        await apiFetch(`/${id}`, { method: "PATCH", body: JSON.stringify({ completed }) });
        await loadTasks();
        return;
    }
    if (ev.target.matches(".delete")) {
        ev.stopPropagation();
        if (!confirm("Delete this task?")) return;
        await apiFetch(`/${id}`, { method: "DELETE" });
        await loadTasks();
        return;
    }
    if (ev.target.matches(".edit")) {
        ev.stopPropagation();
        await openEditModal(id);
        return;
    }

    if (ev.target.closest(".task-header")) {
        body.classList.toggle("hidden");
    }
});

taskForm.addEventListener("input", () => {
    const data = {
        title: qs("#title").value.trim(),
        description: qs("#description").value.trim() || null,
        importance: Number(qs("#importance").value) || 1,
        due_date: qs("#due_date").value ? formatLocalForCurl(qs("#due_date").value) : null
    };
    updateCurlPreview(data);
});

taskForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const data = {
        title: qs("#title").value.trim(),
        description: qs("#description").value.trim() || null,
        importance: Number(qs("#importance").value) || 1,
        due_date: qs("#due_date").value ? new Date(qs("#due_date").value).toISOString() : null
    };
    try {
        if (editId) {
            await apiFetch(`/${editId}`, { method: "PATCH", body: JSON.stringify(data) });
        } else {
            await apiFetch("/", { method: "POST", body: JSON.stringify(data) });
        }
        closeModal();
        await loadTasks();
    } catch (e) {
        alert("Error: " + e.message);
    }
});

async function openEditModal(id) {
    try {
        const t = await apiFetch(`/${id}`);
        editId = id;
        qs("#modalTitle").textContent = "Edit Task";
        qs("#title").value = t.title || "";
        qs("#description").value = t.description || "";
        qs("#importance").value = t.importance || 1;
        qs("#due_date").value = t.due_date ? t.due_date.split("T")[0] + "T" + t.due_date.split("T")[1].slice(0,5) : "";

        const data = {
            title: qs("#title").value.trim(),
            description: qs("#description").value.trim() || null,
            importance: Number(qs("#importance").value) || 1,
            due_date: qs("#due_date").value ? formatLocalForCurl(qs("#due_date").value) : null
        };
        updateCurlPreview(data);

        openModal();
    } catch (e) {
        alert("Error loading task: " + e.message);
    }
}

function updateCurlPreview(data) {
    const url = editId ? `${API_ROOT}/${editId}` : API_ROOT + "/";
    const method = editId ? "PATCH" : "POST";
    const body = JSON.stringify(data, null, 2);

    const curlStr = `curl -X ${method} \\
  "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;

    qs("#curlOutput").textContent = curlStr;
}

document.addEventListener("DOMContentLoaded", () => {
    qs("#addBtn").addEventListener("click", openModal);
    qs("#closeModal").addEventListener("click", closeModal);
    qs("#cancelBtn").addEventListener("click", closeModal);
    qs("#refreshBtn").addEventListener("click", loadTasks);

    loadTasks();
});