// main.js - Main JS for Task Manager App

$(document).ready(function() {
  // Dark mode toggle logic
  function setDarkMode(enabled) {
    if (enabled) {
      $('body').addClass('dark-mode');
      $('#darkModeToggle span').removeClass('bi-moon').addClass('bi-sun');
      $('#darkModeToggle').attr('aria-label', 'Switch to light mode');
    } else {
      $('body').removeClass('dark-mode');
      $('#darkModeToggle span').removeClass('bi-sun').addClass('bi-moon');
      $('#darkModeToggle').attr('aria-label', 'Switch to dark mode');
    }
  }

  // Check localStorage on load
  const darkModePref = localStorage.getItem('darkMode') === 'true';
  setDarkMode(darkModePref);

  // Toggle on button click
  $('#darkModeToggle').on('click', function() {
    const isDark = !$('body').hasClass('dark-mode');
    setDarkMode(isDark);
    localStorage.setItem('darkMode', isDark);
  });

  // --- Tasks Page Logic ---
  if (window.location.pathname.includes('tasks.html')) {
    // Helper: Get tasks from localStorage
    function getTasks() {
      return JSON.parse(localStorage.getItem('tasks') || '[]');
    }
    // Helper: Save tasks to localStorage
    function saveTasks(tasks) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    // Helper: Update summary
    function updateSummary(tasks) {
      $('#total-tasks').text(tasks.length);
      $('#pending-tasks').text(tasks.filter(t => t.status === 'pending').length);
      $('#completed-tasks').text(tasks.filter(t => t.status === 'completed').length);
    }
    // Helper: Priority badge
    function priorityBadge(priority) {
      let color = 'secondary';
      if (priority === 'High') color = 'danger';
      else if (priority === 'Medium') color = 'warning';
      else if (priority === 'Low') color = 'success';
      return `<span class="badge bg-${color}">${priority}</span>`;
    }
    // Render tasks with filtering and sorting
    function renderTasks() {
      let tasks = getTasks();
      // Filtering
      const status = $('#filterStatus').val() || 'all';
      const priority = $('#filterPriority').val() || 'all';
      if (status !== 'all') {
        tasks = tasks.filter(t => t.status === status);
      }
      if (priority !== 'all') {
        tasks = tasks.filter(t => t.priority === priority);
      }
      // Sorting
      const sortBy = $('#sortBy').val() || 'dueDate';
      tasks.sort((a, b) => {
        if (sortBy === 'dueDate') {
          return a.dueDate.localeCompare(b.dueDate);
        } else if (sortBy === 'taskName') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
      updateSummary(getTasks()); // Always show summary for all tasks
      const tbody = $('#task-table tbody');
      tbody.empty();
      if (tasks.length === 0) {
        tbody.append('<tr><td colspan="6" class="text-center">No tasks found.</td></tr>');
        return;
      }
      getTasks().forEach((task, idx) => {
        if (
          (status === 'all' || task.status === status) &&
          (priority === 'all' || task.priority === priority)
        ) {
          tbody.append(`
            <tr data-idx="${idx}">
              <td>${task.name}</td>
              <td>${task.description}</td>
              <td>${task.dueDate}</td>
              <td>${priorityBadge(task.priority)}</td>
              <td>${task.status === 'completed' ? '<span class="badge bg-success">Completed</span>' : '<span class="badge bg-secondary">Pending</span>'}</td>
              <td>
                <button class="btn btn-sm btn-success complete-task" ${task.status === 'completed' ? 'disabled' : ''} title="Mark as completed"><i class="bi bi-check-lg"></i></button>
                <button class="btn btn-sm btn-primary edit-task" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-task" title="Delete"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `);
        }
      });
    }
    // Add activity log helper
    function logActivity(msg) {
      const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
      log.unshift(msg);
      localStorage.setItem('activityLog', JSON.stringify(log.slice(0, 20)));
    }
    // Add task
    $('#task-form').on('submit', function(e) {
      e.preventDefault();
      const name = $('#taskName').val().trim();
      const description = $('#taskDescription').val().trim();
      const dueDate = $('#taskDueDate').val();
      const priority = $('#taskPriority').val();
      if (!name || !description || !dueDate || !priority) {
        $(this)[0].classList.add('was-validated');
        return;
      }
      const tasks = getTasks();
      tasks.push({ name, description, dueDate, priority, status: 'pending' });
      logActivity(`Added task: <strong>${name}</strong> (Due: ${dueDate})`);
      saveTasks(tasks);
      renderTasks();
      this.reset();
      $(this)[0].classList.remove('was-validated');
    });
    // Mark as completed
    $('#task-table').on('click', '.complete-task', function() {
      const idx = $(this).closest('tr').data('idx');
      const tasks = getTasks();
      tasks[idx].status = 'completed';
      logActivity(`Completed task: <strong>${tasks[idx].name}</strong>`);
      saveTasks(tasks);
      renderTasks();
    });
    // Delete task
    $('#task-table').on('click', '.delete-task', function() {
      const idx = $(this).closest('tr').data('idx');
      let tasks = getTasks();
      const removed = tasks.splice(idx, 1)[0];
      logActivity(`Deleted task: <strong>${removed.name}</strong>`);
      saveTasks(tasks);
      renderTasks();
    });
    // Filter and sort event listeners
    $('#filterStatus, #filterPriority, #sortBy').on('change', function() {
      renderTasks();
    });
    // Edit task: open modal
    $('#task-table').on('click', '.edit-task', function() {
      const idx = $(this).closest('tr').data('idx');
      const tasks = getTasks();
      const task = tasks[idx];
      $('#editTaskIdx').val(idx);
      $('#editTaskName').val(task.name);
      $('#editTaskDescription').val(task.description);
      $('#editTaskDueDate').val(task.dueDate);
      $('#editTaskPriority').val(task.priority);
      const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
      modal.show();
    });
    // Save edited task
    $('#edit-task-form').on('submit', function(e) {
      e.preventDefault();
      const idx = $('#editTaskIdx').val();
      const name = $('#editTaskName').val().trim();
      const description = $('#editTaskDescription').val().trim();
      const dueDate = $('#editTaskDueDate').val();
      const priority = $('#editTaskPriority').val();
      if (!name || !description || !dueDate || !priority) {
        $(this)[0].classList.add('was-validated');
        return;
      }
      const tasks = getTasks();
      logActivity(`Edited task: <strong>${tasks[idx].name}</strong> → <strong>${name}</strong>`);
      tasks[idx] = { ...tasks[idx], name, description, dueDate, priority };
      saveTasks(tasks);
      renderTasks();
      const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
      modal.hide();
      this.reset();
      $(this)[0].classList.remove('was-validated');
    });
    // Initial render
    renderTasks();
  }

  // --- Contact Page Logic ---
  if (window.location.pathname.includes('contact.html')) {
    // Add modal to body if not present
    if (!$('#contactModal').length) {
      $('body').append(`
        <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="contactModalLabel">Message Sent</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contactModalBody"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `);
    }
    // Form validation and pop-up
    $('#contact-form').on('submit', function(e) {
      e.preventDefault();
      const form = this;
      if (!form.checkValidity()) {
        e.stopPropagation();
        $(form).addClass('was-validated');
        return;
      }
      const name = $('#contactName').val();
      const email = $('#contactEmail').val();
      const subject = $('#contactSubject').val();
      const message = $('#contactMessage').val();
      const modalBody = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
      `;
      $('#contactModalBody').html(modalBody);
      const modal = new bootstrap.Modal(document.getElementById('contactModal'));
      modal.show();
      form.reset();
      $(form).removeClass('was-validated');
    });
  }

  // --- Calendar Page Logic ---
  if (window.location.pathname.includes('calendar.html')) {
    // Helper: Get tasks from localStorage
    function getTasks() {
      return JSON.parse(localStorage.getItem('tasks') || '[]');
    }
    // Calendar state
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    function renderCalendar(month, year) {
      $('#calendarMonth').text(`${monthNames[month]} ${year}`);
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let html = '<table class="table table-bordered calendar-table"><thead><tr>';
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(d => html += `<th scope="col">${d}</th>`);
      html += '</tr></thead><tbody><tr>';
      let day = 1;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 && j < firstDay) {
            html += '<td></td>';
          } else if (day > daysInMonth) {
            html += '<td></td>';
          } else {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasks = getTasks().filter(t => t.dueDate === dateStr);
            html += `<td class="calendar-day" data-date="${dateStr}" style="cursor:pointer;">
              <div>${day}</div>
              ${tasks.length > 0 ? `<span class="badge bg-primary mt-1">${tasks.length} task${tasks.length > 1 ? 's' : ''}</span>` : ''}
            </td>`;
            day++;
          }
        }
        html += '</tr>';
        if (day > daysInMonth) break;
        if (i < 5) html += '<tr>';
      }
      html += '</tbody></table>';
      $('#calendarGrid').html(html);
    }
    // Initial render
    renderCalendar(currentMonth, currentYear);
    // Month navigation
    $('#prevMonth').on('click', function() {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentMonth, currentYear);
    });
    $('#nextMonth').on('click', function() {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentMonth, currentYear);
    });
    // Show tasks for a day
    $('#calendarGrid').on('click', '.calendar-day', function() {
      const date = $(this).data('date');
      const tasks = getTasks().filter(t => t.dueDate === date);
      $('#modalDate').text(date);
      if (tasks.length === 0) {
        $('#dayTasksList').html('<p>No tasks for this day.</p>');
      } else {
        let html = '<ul class="list-group">';
        tasks.forEach(t => {
          html += `<li class="list-group-item d-flex justify-content-between align-items-center">
            <span><strong>${t.name}</strong><br><small>${t.description}</small></span>
            <span class="badge bg-${t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning text-dark' : 'success'}">${t.priority}</span>
          </li>`;
        });
        html += '</ul>';
        $('#dayTasksList').html(html);
      }
      const modal = new bootstrap.Modal(document.getElementById('dayTasksModal'));
      modal.show();
    });
  }

  // --- Latest Activity on Home Page ---
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
    function renderLatestActivity() {
      const activity = JSON.parse(localStorage.getItem('activityLog') || '[]');
      const $list = $('#latest-activity');
      $list.empty();
      if (activity.length === 0) {
        $list.append('<li class="list-group-item">No recent activity yet.</li>');
        return;
      }
      activity.slice(0, 5).forEach(item => {
        $list.append(`<li class="list-group-item">${item}</li>`);
      });
    }
    renderLatestActivity();
  }
}); 