/* ── CONSTANTS ── */

const STORAGE_KEY_TASKS    = 'tld_tasks';
const STORAGE_KEY_LINKS    = 'tld_links';
const STORAGE_KEY_THEME    = 'tld_theme';
const STORAGE_KEY_SORT     = 'tld_sort';
const SORT_OPTIONS         = ['insertion', 'az', 'za', 'incomplete-first', 'complete-first'];
const MAX_TASK_LENGTH      = 500;
const MAX_LINK_LABEL_LENGTH = 50;
const MAX_LINKS            = 20;
const TIMER_DURATION       = 1500;

/* ── STORAGE HELPERS ── */

function showCorruptionNotice(type) {
  if (type === 'tasks') {
    const el = document.getElementById('todo-storage-warning');
    if (el) {
      el.textContent = 'Saved data was corrupted and has been reset.';
      el.removeAttribute('hidden');
    }
  } else if (type === 'links') {
    const el = document.getElementById('links-storage-warning');
    if (el) {
      el.textContent = 'Saved data was corrupted and has been reset.';
      el.removeAttribute('hidden');
    }
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    showCorruptionNotice('tasks');
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    showCorruptionNotice('links');
    return [];
  }
}

function saveLinks(links) {
  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
    return true;
  } catch {
    return false;
  }
}

/* ── THEME ── */

function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore — fall through to system preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // silently ignore — session-only fallback
  }
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

function initTheme() {
  applyTheme(loadTheme());
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}

/* ── GREETING ── */

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES   = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night';
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDate(date) {
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const dd      = String(date.getDate()).padStart(2, '0');
  const month   = MONTH_NAMES[date.getMonth()];
  const yyyy    = date.getFullYear();
  return `${weekday}, ${dd} ${month} ${yyyy}`;
}

function tickClock() {
  const now  = new Date();
  const hour = now.getHours();
  document.getElementById('greeting-text').textContent = getGreeting(hour);
  document.getElementById('clock-time').textContent    = formatTime(now);
  document.getElementById('clock-date').textContent    = formatDate(now);
}

function initGreeting() {
  tickClock();
  setInterval(tickClock, 60000);
}

/* ── FOCUS TIMER ── */

let timerSeconds = TIMER_DURATION;
let timerInterval = null;

function formatCountdown(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function startTimer() {
  if (timerInterval !== null || timerSeconds <= 0) return;
  timerInterval = setInterval(function () {
    timerSeconds -= 1;
    document.getElementById('timer-display').textContent = formatCountdown(timerSeconds);
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      const msg = document.getElementById('timer-message');
      msg.textContent = 'Session complete!';
      msg.removeAttribute('hidden');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = TIMER_DURATION;
  document.getElementById('timer-display').textContent = '25:00';
  document.getElementById('timer-message').setAttribute('hidden', '');
}

function initTimer() {
  document.getElementById('timer-display').textContent = formatCountdown(timerSeconds);
  document.getElementById('timer-start').addEventListener('click', startTimer);
  document.getElementById('timer-stop').addEventListener('click', stopTimer);
  document.getElementById('timer-reset').addEventListener('click', resetTimer);
}

/* ── TODO LIST ── */

let tasks = [];
let currentSort = 'insertion';

function loadSort() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SORT);
    if (SORT_OPTIONS.includes(stored)) return stored;
    // Missing, null, or invalid — reset to insertion order
    saveSort('insertion');
    return 'insertion';
  } catch {
    return 'insertion';
  }
}

function saveSort(order) {
  try {
    localStorage.setItem(STORAGE_KEY_SORT, order);
  } catch {
    // silently ignore errors
  }
}

function getSortedTasks(taskList, order) {
  const copy = [...taskList];
  if (order === 'az') {
    copy.sort(function (a, b) { return a.description.localeCompare(b.description); });
  } else if (order === 'za') {
    copy.sort(function (a, b) { return b.description.localeCompare(a.description); });
  } else if (order === 'incomplete-first') {
    copy.sort(function (a, b) {
      // false (incomplete) sorts before true (complete)
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  } else if (order === 'complete-first') {
    copy.sort(function (a, b) {
      // true (complete) sorts before false (incomplete)
      if (a.completed === b.completed) return 0;
      return a.completed ? -1 : 1;
    });
  }
  // 'insertion' — no sort, original order preserved
  return copy;
}

function validateTaskDescription(text) {
  if (text.trim() === '') {
    return { valid: false, message: 'Task cannot be empty.' };
  }
  if (text.length > MAX_TASK_LENGTH) {
    return { valid: false, message: 'Task must be 500 characters or fewer.' };
  }
  return { valid: true, message: '' };
}

function isDuplicateTask(description, taskList, excludeIndex = -1) {
  const normalised = description.trim().toLowerCase();
  for (let i = 0; i < taskList.length; i++) {
    if (i === excludeIndex) continue;
    if (taskList[i].description.trim().toLowerCase() === normalised) {
      return true;
    }
  }
  return false;
}

function renderTasks(taskList) {
  const ul = document.getElementById('todo-items');
  ul.innerHTML = '';

  // Build sorted list while preserving the original index from taskList.
  // data-id must store the original index so toggle/edit/delete operate on
  // the correct element in the tasks array regardless of sort order.
  getSortedTasks(taskList, currentSort).forEach(function (task) {
    const originalIndex = taskList.indexOf(task);
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = String(originalIndex);

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-check';
    checkbox.checked = task.completed;

    // Description span
    const span = document.createElement('span');
    span.className = 'todo-desc';
    span.textContent = task.description;
    if (task.completed) {
      span.style.textDecoration = 'line-through';
    }

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'todo-edit-btn';
    editBtn.textContent = 'Edit';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete-btn';
    deleteBtn.textContent = 'Delete';

    // Inline error paragraph (hidden by default)
    const errorP = document.createElement('p');
    errorP.className = 'todo-item-error';
    errorP.setAttribute('hidden', '');

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    li.appendChild(errorP);

    ul.appendChild(li);
  });
}

function addTask(description) {
  const result = validateTaskDescription(description);
  const errorEl = document.getElementById('todo-error');

  if (!result.valid) {
    errorEl.textContent = result.message;
    errorEl.removeAttribute('hidden');
    return;
  }

  if (isDuplicateTask(description, tasks)) {
    errorEl.textContent = 'A task with this description already exists.';
    errorEl.removeAttribute('hidden');
    // Do NOT clear the input — preserve the value so the user can see what they typed
    return;
  }

  const newTask = { description: description, completed: false };
  tasks.push(newTask);

  const saved = saveTasks(tasks);
  if (!saved) {
    tasks.pop();
    errorEl.textContent = 'Could not save — storage quota exceeded.';
    errorEl.removeAttribute('hidden');
    return;
  }

  document.getElementById('todo-input').value = '';
  errorEl.setAttribute('hidden', '');
  renderTasks(tasks);
}

function editTask(index) {
  const ul = document.getElementById('todo-items');
  const li = ul.querySelector(`[data-id="${index}"]`);
  if (!li) return;

  // Replace span with text input
  const span = li.querySelector('.todo-desc');
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.maxLength = 500;
  editInput.value = tasks[index].description;
  li.replaceChild(editInput, span);

  // Add Save and Cancel buttons before the Edit button
  const editBtn = li.querySelector('.todo-edit-btn');

  const saveBtn = document.createElement('button');
  saveBtn.className = 'todo-save-btn';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'todo-cancel-btn';
  cancelBtn.textContent = 'Cancel';

  li.insertBefore(saveBtn, editBtn);
  li.insertBefore(cancelBtn, editBtn);

  // Hide the Edit button
  editBtn.setAttribute('hidden', '');

  // Dismiss the item error when the user modifies the edit field
  const errorP = li.querySelector('.todo-item-error');
  editInput.addEventListener('input', function () {
    if (errorP) {
      errorP.setAttribute('hidden', '');
    }
  });
}

function saveEditTask(index, newText) {
  const ul = document.getElementById('todo-items');
  const li = ul.querySelector(`[data-id="${index}"]`);
  const errorP = li ? li.querySelector('.todo-item-error') : null;

  const result = validateTaskDescription(newText);
  if (!result.valid) {
    if (errorP) {
      errorP.textContent = result.message;
      errorP.removeAttribute('hidden');
    }
    return;
  }

  if (isDuplicateTask(newText, tasks, index)) {
    if (errorP) {
      errorP.textContent = 'A task with this description already exists.';
      errorP.removeAttribute('hidden');
    }
    // Preserve the edit field value — do not revert or close edit mode
    return;
  }

  const oldDescription = tasks[index].description;
  tasks[index].description = newText;

  const saved = saveTasks(tasks);
  if (!saved) {
    tasks[index].description = oldDescription;
    if (errorP) {
      errorP.textContent = 'Could not save — storage quota exceeded.';
      errorP.removeAttribute('hidden');
    }
    return;
  }

  renderTasks(tasks);
}

function cancelEditTask(index) {
  renderTasks(tasks);
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;

  const saved = saveTasks(tasks);
  if (!saved) {
    // Revert the flip
    tasks[index].completed = !tasks[index].completed;
    const ul = document.getElementById('todo-items');
    const li = ul.querySelector(`[data-id="${index}"]`);
    const errorP = li ? li.querySelector('.todo-item-error') : null;
    if (errorP) {
      errorP.textContent = 'Could not save — storage quota exceeded.';
      errorP.removeAttribute('hidden');
    }
    return;
  }

  renderTasks(tasks);
}

function deleteTask(index) {
  const removed = tasks.splice(index, 1);

  const saved = saveTasks(tasks);
  if (!saved) {
    // Re-insert the removed item
    tasks.splice(index, 0, removed[0]);
    const ul = document.getElementById('todo-items');
    const li = ul.querySelector(`[data-id="${index}"]`);
    const errorP = li ? li.querySelector('.todo-item-error') : null;
    if (errorP) {
      errorP.textContent = 'Could not save — storage quota exceeded.';
      errorP.removeAttribute('hidden');
    }
    return;
  }

  renderTasks(tasks);
}

function initTodoList() {
  tasks = loadTasks();
  currentSort = loadSort();
  document.getElementById('todo-sort').value = currentSort;
  renderTasks(tasks);

  // Wire sort control
  document.getElementById('todo-sort').addEventListener('change', function (event) {
    currentSort = event.target.value;
    saveSort(currentSort);
    renderTasks(tasks);
  });

  // Wire form submit to addTask
  document.getElementById('todo-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const input = document.getElementById('todo-input');
    addTask(input.value);
  });

  // Dismiss #todo-error when the user modifies the input field (Requirement 8.5)
  document.getElementById('todo-input').addEventListener('input', function () {
    const errorEl = document.getElementById('todo-error');
    errorEl.setAttribute('hidden', '');
  });

  // Event delegation on #todo-items
  document.getElementById('todo-items').addEventListener('click', function (event) {
    const li = event.target.closest('[data-id]');
    if (!li) return;

    const index = parseInt(li.dataset.id, 10);
    const target = event.target;

    if (target.classList.contains('todo-edit-btn')) {
      editTask(index);
    } else if (target.classList.contains('todo-save-btn')) {
      const editInput = li.querySelector('.todo-edit-input');
      if (editInput) {
        saveEditTask(index, editInput.value);
      }
    } else if (target.classList.contains('todo-cancel-btn')) {
      cancelEditTask(index);
    } else if (target.classList.contains('todo-check')) {
      toggleTask(index);
    } else if (target.classList.contains('todo-delete-btn')) {
      deleteTask(index);
    }
  });
}

/* ── QUICK LINKS ── */

let links = [];

function validateLinkLabel(text) {
  if (text.trim() === '') {
    return { valid: false, message: 'Label cannot be empty.' };
  }
  if (text.length > MAX_LINK_LABEL_LENGTH) {
    return { valid: false, message: 'Label must be 50 characters or fewer.' };
  }
  return { valid: true, message: '' };
}

function validateLinkUrl(url) {
  if (url.trim() === '') {
    return { valid: false, message: 'URL cannot be empty.' };
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, message: 'URL must start with http:// or https://.' };
  }
  const domain = url.startsWith('https://') ? url.slice('https://'.length) : url.slice('http://'.length);
  if (domain === '') {
    return { valid: false, message: 'URL must include a domain.' };
  }
  return { valid: true, message: '' };
}

function isDuplicateUrl(url, linkList) {
  return linkList.some(function (link) { return link.url === url; });
}

function renderLinks(linkList) {
  const container = document.getElementById('links-container');
  container.innerHTML = '';

  linkList.forEach(function (link, i) {
    const div = document.createElement('div');
    div.className = 'quick-link-item';

    const linkBtn = document.createElement('button');
    linkBtn.className = 'quick-link-btn';
    linkBtn.dataset.url = link.url;
    linkBtn.textContent = link.label;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'quick-link-delete-btn';
    deleteBtn.dataset.index = String(i);
    deleteBtn.textContent = '×';

    div.appendChild(linkBtn);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}

function addLink(label, url) {
  const errorEl = document.getElementById('links-error');

  const labelResult = validateLinkLabel(label);
  if (!labelResult.valid) {
    errorEl.textContent = labelResult.message;
    errorEl.removeAttribute('hidden');
    return;
  }

  const urlResult = validateLinkUrl(url);
  if (!urlResult.valid) {
    errorEl.textContent = urlResult.message;
    errorEl.removeAttribute('hidden');
    return;
  }

  if (isDuplicateUrl(url, links)) {
    errorEl.textContent = 'This URL is already in your Quick Links.';
    errorEl.removeAttribute('hidden');
    return;
  }

  if (links.length >= MAX_LINKS) {
    errorEl.textContent = 'Maximum of 20 links reached.';
    errorEl.removeAttribute('hidden');
    return;
  }

  const newLink = { label: label, url: url };
  links.push(newLink);

  const saved = saveLinks(links);
  if (!saved) {
    links.pop();
    errorEl.textContent = 'Could not save — storage quota exceeded.';
    errorEl.removeAttribute('hidden');
    return;
  }

  document.getElementById('link-label-input').value = '';
  document.getElementById('link-url-input').value = '';
  errorEl.setAttribute('hidden', '');
  renderLinks(links);
}

function deleteLink(index) {
  const removed = links.splice(index, 1);

  const saved = saveLinks(links);
  if (!saved) {
    links.splice(index, 0, removed[0]);
    const errorEl = document.getElementById('links-error');
    errorEl.textContent = 'Could not save — storage quota exceeded.';
    errorEl.removeAttribute('hidden');
    return;
  }

  renderLinks(links);
}

function initQuickLinks() {
  links = loadLinks();
  renderLinks(links);

  document.getElementById('links-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const label = document.getElementById('link-label-input').value;
    const url   = document.getElementById('link-url-input').value;
    addLink(label, url);
  });

  document.getElementById('links-container').addEventListener('click', function (event) {
    if (event.target.classList.contains('quick-link-btn')) {
      window.open(event.target.dataset.url, '_blank');
    } else if (event.target.classList.contains('quick-link-delete-btn')) {
      deleteLink(parseInt(event.target.dataset.index, 10));
    }
  });
}

/* ── BOOTSTRAP ── */

function init() {
  initTheme();
  initGreeting();
  initTimer();
  initTodoList();
  initQuickLinks();
}

document.addEventListener('DOMContentLoaded', init);
