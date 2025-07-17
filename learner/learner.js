import { supabase } from '../supabase.js';
import { aiService } from '../ai-service.js';
import { alertService } from '../alert-service.js';
import { userManagement } from '../user-management.js';

// JavaScript for Learner Dashboard (OmniLearn)
// Add interactivity here

function attachUserDropdownListeners() {
  const editProfile = document.getElementById('edit-profile');
  const preferences = document.getElementById('preferences');
  const logout = document.getElementById('logout');
  if (editProfile) {
    editProfile.onclick = function(e) {
      e.preventDefault();
      if (window.userManagement) window.userManagement.showEditProfileModal();
    };
  }
  if (preferences) {
    preferences.onclick = function(e) {
      e.preventDefault();
      if (window.userManagement) window.userManagement.showPreferencesModal();
    };
  }
  if (logout) {
    logout.onclick = function(e) {
      e.preventDefault();
      if (window.userManagement) window.userManagement.showLogoutConfirmation();
    };
  }
}

// --- DASHBOARD DYNAMIC FETCHING ---

async function fetchLearnerDashboardData() {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const userId = user.id;

  // Fetch enrollments with course and instructor info
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*, courses(*, created_by), courses:course_id(*, created_by), profiles:learner_id(full_name)')
    .eq('learner_id', userId);

  // Fetch courses for timetable and progress
  const courseIds = enrollments ? enrollments.map(e => e.course_id) : [];
  let courses = [];
  if (courseIds.length > 0) {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);
    courses = coursesData || [];
  }

  // Fetch assignments for assignments due
  let assignments = [];
  if (courseIds.length > 0) {
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .in('course_id', courseIds);
    assignments = assignmentsData || [];
  }

  // Fetch progress/grades
  let progress = [];
  if (courseIds.length > 0) {
    const { data: progressData } = await supabase
      .from('progress')
      .select('*')
      .eq('learner_id', userId)
      .in('course_id', courseIds);
    progress = progressData || [];
  }

  // Fetch quiz performance (from assignments or progress)
  // For simplicity, use assignments of type 'quiz' and their grades
  let quizPerformance = [];
  if (assignments.length > 0) {
    quizPerformance = assignments
      .filter(a => a.type === 'quiz' && a.grade !== undefined && a.grade !== null)
      .map(a => ({ label: courses.find(c => c.id === a.course_id)?.title || a.title, value: a.grade }));
  }

  // Completed units (from progress or enrollments with completed flag)
  let completedUnits = [];
  if (progress.length > 0) {
    completedUnits = progress.filter(p => p.completed).map(p => {
      const course = courses.find(c => c.id === p.course_id);
      return {
        code: course?.code || '',
        name: course?.title || '',
        instructor: course?.instructor || '',
        completedDate: p.completed_at ? new Date(p.completed_at).toLocaleDateString() : ''
      };
    });
  }

  // Certifications (if all units completed)
  let certifications = [];
  let allUnitsCompleted = false;
  if (courses.length > 0 && completedUnits.length === courses.length) {
    allUnitsCompleted = true;
    // Optionally fetch from certifications table
    // For now, simulate
    certifications = [{ course: 'OmniLearn Full Course', date: new Date().toLocaleDateString(), file: '#' }];
  }

  // Timetable: use courses with schedule fields (date, time, link)
  let timetable = courses.map(c => ({
    date: c.date || '',
    day: c.day || '',
    unit: c.title,
    code: c.code,
    instructor: c.instructor || '',
    time: c.time || '',
    link: c.meeting_link || '#'
  }));

  // Progress bar: average progress from progress table
  let overallProgress = 0;
  if (progress.length > 0) {
    overallProgress = Math.round(progress.reduce((sum, p) => sum + (p.progress || 0), 0) / progress.length);
  }

  // Assignments due: count assignments with due_date in future and not completed
  const now = new Date();
  const assignmentsDue = assignments.filter(a => a.due_date && new Date(a.due_date) > now && !a.completed).length;
  const totalAssignments = assignments.length;

  return {
    enrollments,
    courses,
    assignments,
    progress,
    quizPerformance,
    completedUnits,
    certifications,
    allUnitsCompleted,
    timetable,
    overallProgress,
    assignmentsDue,
    totalAssignments
  };
}

// --- MAIN DASHBOARD RENDER ---
async function renderDashboard() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading dashboard...</div>';
  try {
    const data = await fetchLearnerDashboardData();
    // Render main dashboard content
    dashboardMain.innerHTML = `
      <div class="learner-dashboard">
        <h1>👩‍🎓 Learner Dashboard</h1>
        <div class="dashboard-section">
          <h2>📅 Upcoming Classes</h2>
          <div class="timetable-wrapper">
            <table class="timetable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Unit Name</th>
                  <th>Time</th>
                  <th>Meeting Link</th>
                </tr>
              </thead>
              <tbody id="timetable-body">
                ${data.timetable.map(row => `
                  <tr>
                    <td>${row.date}</td>
                    <td>${row.unit}</td>
                    <td>${row.time}</td>
                    <td><a href="${row.link}" class="meeting-link" target="_blank">Join</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="dashboard-section">
          <h2>📊 Progress & Performance</h2>
          <div class="progress-visuals">
            <div class="progress-bar-section">
              <label for="overall-progress">Overall Progress</label>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="overall-progress-bar" style="width: ${data.overallProgress}%"></div>
              </div>
              <span id="overall-progress-label">${data.overallProgress}%</span>
            </div>
            <div class="circular-progress-section">
              <label>Assignments Due</label>
              <div class="circular-progress" id="assignments-progress" style="background: conic-gradient(#ffb343 0% ${Math.round((data.assignmentsDue / (data.totalAssignments || 1)) * 100)}%, #e6eefd ${Math.round((data.assignmentsDue / (data.totalAssignments || 1)) * 100)}% 100%)">
                <span id="assignments-due-label">${data.assignmentsDue}</span>
              </div>
            </div>
            <div class="bar-chart-section">
              <label>Quiz Performance</label>
              <div class="bar-chart" id="quiz-bar-chart">
                ${data.quizPerformance.map(q => `
                  <div class="bar" style="height: ${q.value}%">
                    <span class="bar-label">${q.value}%</span><div class="bar-x-label">${q.label}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="dashboard-section">
          <h2>🏅 Current Level & Improvement Areas</h2>
          <ul>
            <li>Your current level: <span class="level-badge">Beginner</span></li>
            <li>See strengths and areas for improvement</li>
          </ul>
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading dashboard: ${err.message}</div>`;
  }
}

// --- ENROLLED UNITS ---
async function renderEnrolledUnits() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading enrolled units...</div>';
  try {
    const data = await fetchLearnerDashboardData();
    dashboardMain.innerHTML = `
      <div class="enrolled-units-section">
        <h2>📚 Enrolled Units</h2>
        <div class="enrolled-units-list">
          ${data.courses.map(unit => `
            <div class="enrolled-unit-card">
              <div class="unit-code">${unit.code || ''}</div>
              <div class="unit-name">${unit.title || ''}</div>
              <div class="unit-instructor">Instructor: ${unit.instructor || ''}</div>
              <div class="unit-progress-bar-bg">
                <div class="unit-progress-bar-fill" style="width: ${unit.progress || 0}%"></div>
              </div>
              <div class="unit-progress-label">${unit.progress || 0}% complete</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading enrolled units: ${err.message}</div>`;
  }
}

// --- TIMETABLE ---
async function renderFullTimetable() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading timetable...</div>';
  try {
    const data = await fetchLearnerDashboardData();
    dashboardMain.innerHTML = `
      <div class="timetable-section">
        <h2>📅 Full Timetable</h2>
        <div class="timetable-wrapper">
          <table class="timetable">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Unit Name</th>
                <th>Unit Code</th>
                <th>Instructor</th>
                <th>Meeting Link</th>
              </tr>
            </thead>
            <tbody>
              ${data.timetable.map(row => `
                <tr>
                  <td>${row.day}</td>
                  <td>${row.time}</td>
                  <td>${row.unit}</td>
                  <td>${row.code}</td>
                  <td>${row.instructor}</td>
                  <td><a href="${row.link}" class="meeting-link" target="_blank">Join</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading timetable: ${err.message}</div>`;
  }
}

// --- GRADING ---
async function renderGrading() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading grading...</div>';
  try {
    const data = await fetchLearnerDashboardData();
    // Group grades by course
    const gradingData = data.progress.map(p => {
      const course = data.courses.find(c => c.id === p.course_id);
      return {
        unit: course?.title || '',
        code: course?.code || '',
        quizzes: p.quizzes || [], // Assume quizzes is an array of {grade, date}
      };
    });
    let total = 0, count = 0;
    gradingData.forEach(row => {
      row.quizzes.forEach(q => { total += q.grade; count++; });
    });
    const avg = count ? (total / count).toFixed(2) : 'N/A';
    dashboardMain.innerHTML = `
      <div class="grading-section">
        <h2>📝 Grading</h2>
        <div class="grading-table-wrapper">
          <table class="grading-table">
            <thead>
              <tr>
                <th>Unit Name</th>
                <th>Unit Code</th>
                <th>Quiz Grades (Date)</th>
                <th>Unit Average</th>
              </tr>
            </thead>
            <tbody>
              ${gradingData.map(row => {
                const unitAvg = row.quizzes.length ? (row.quizzes.reduce((a,b) => a+b.grade,0)/row.quizzes.length).toFixed(2) : 'N/A';
                return `<tr>
                  <td>${row.unit}</td>
                  <td>${row.code}</td>
                  <td>${row.quizzes.map(q => `<span class='quiz-grade'>${q.grade} <span class='quiz-date'>(${q.date})</span></span>`).join(', ')}</td>
                  <td>${unitAvg}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="grading-average">Overall Average: <span>${avg}</span></div>
        <div class="grading-recommendations">
          ${(() => {
            const weakUnits = gradingData.filter(row => {
              if (!row.quizzes.length) return false;
              const unitAvg = row.quizzes.reduce((a,b) => a+b.grade,0)/row.quizzes.length;
              return unitAvg < 80;
            });
            if (weakUnits.length === 0) {
              return '<span class="congrats">🎉 Great job! You are performing well in all units.</span>';
            } else {
              return '<span class="recommend-title">Recommendations:</span> ' + weakUnits.map(row => `<span class="recommend-unit">${row.unit}</span>`).join(', ') + '<span class="recommend-msg"> — Focus on these areas to improve your performance.</span>';
            }
          })()}
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading grading: ${err.message}</div>`;
  }
}

// --- COMPLETED UNITS ---
async function renderCompletedUnits() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading completed units...</div>';
  try {
    const data = await fetchLearnerDashboardData();
    dashboardMain.innerHTML = `
      <div class="completed-units-section">
        <h2>✅ Completed Units</h2>
        <div class="completed-units-list">
          ${data.completedUnits.length === 0 ? '<div class="no-completed">No units completed yet.</div>' :
            data.completedUnits.map(unit => `
              <div class="completed-unit-card">
                <div class="unit-code">${unit.code}</div>
                <div class="unit-name">${unit.name}</div>
                <div class="unit-instructor">Instructor: ${unit.instructor}</div>
                <div class="unit-completed-date">Completed: ${unit.completedDate}</div>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading completed units: ${err.message}</div>`;
  }
}

// --- CERTIFICATIONS ---
async function renderCertifications() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading certifications...</div>';
  try {
    const data = await fetchLearnerDashboardData();
    dashboardMain.innerHTML = `
      <div class="certifications-section">
        <h2>🎓 Certifications</h2>
        <div class="certifications-list">
          ${data.allUnitsCompleted && data.certifications.length > 0 ?
            data.certifications.map(cert => `
              <div class="cert-card">
                <div class="cert-title">${cert.course}</div>
                <div class="cert-date">Awarded: ${cert.date}</div>
                <a href="${cert.file}" class="cert-download" download>Download Certificate</a>
              </div>
            `).join('') :
            '<div class="no-cert">Certificates are only available when all units are completed at 100%.</div>'}
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading certifications: ${err.message}</div>`;
  }
}

// --- NOTICE BOARD ---
async function renderNoticeBoard() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading">Loading notices...</div>';
  try {
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      dashboardMain.innerHTML = `
        <div class="notice-board-section">
          <h2>📢 Notice Board</h2>
          <div class="notice-list">
            <div class="no-notice">Error loading notices: ${error.message}</div>
          </div>
        </div>
      `;
      return;
    }

    dashboardMain.innerHTML = `
      <div class="notice-board-section">
        <h2>📢 Notice Board</h2>
        <div class="notice-list">
          ${!notices || notices.length === 0 ? '<div class="no-notice">No notices at this time.</div>' :
            notices.map(notice => `
              <div class="notice-card ${notice.sender_role ? notice.sender_role.toLowerCase() : ''}" style="border-left-color: ${getPriorityColor(notice.priority)}; position: relative;">
                ${notice.is_pinned ? '<div style=\"position: absolute; top: 10px; right: 10px; background: #ffb343; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;\">📌 PINNED</div>' : ''}
                <div class="notice-header">
                  <span class="notice-sender">${notice.sender_name || ''} ${notice.sender_role ? '(' + notice.sender_role + ')' : ''}</span>
                  <span class="notice-date">${notice.created_at ? new Date(notice.created_at).toLocaleDateString() : ''}</span>
                </div>
                <div class="notice-title">${notice.title}</div>
                <div class="notice-message">${notice.message}</div>
                ${notice.expires_at ? `<div style=\"margin-top: 8px; font-size: 0.8rem; color: #ffb343;\">⏰ Expires: ${new Date(notice.expires_at).toLocaleDateString()}</div>` : ''}
              </div>
            `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    dashboardMain.innerHTML = `
      <div class="notice-board-section">
        <h2>📢 Notice Board</h2>
        <div class="notice-list">
          <div class="no-notice">Error loading notices: ${error.message}</div>
        </div>
      </div>
    `;
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent': return '#dc3545';
    case 'high': return '#ffb343';
    case 'normal': return '#4c6ddb';
    case 'low': return '#7ebe91';
    default: return '#4c6ddb';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // User management is now handled by the userManagement module
  // The module will automatically set up the user menu and handle all user actions

  // OmniLearn AI chatbox open/close logic
  const aiMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('ai'));
  const aiChatbox = document.getElementById('ai-chatbox');
  const closeAiChatbox = document.getElementById('close-ai-chatbox');
  const aiForm = document.getElementById('ai-chatbox-form');
  const aiInput = document.getElementById('ai-chatbox-input');
  const aiMessages = document.getElementById('ai-chatbox-messages');
  
  if (aiMenuItem && aiChatbox && closeAiChatbox) {
    aiMenuItem.addEventListener('click', function (e) {
      e.preventDefault();
      aiChatbox.style.display = 'flex';
    });
    closeAiChatbox.addEventListener('click', function () {
      aiChatbox.style.display = 'none';
    });
  }

  // Handle AI chatbox form submission
  if (aiForm && aiInput && aiMessages) {
    aiForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const message = aiInput.value.trim();
      if (message) {
        // Add user message
        aiMessages.innerHTML += `
          <div style="margin-bottom: 10px; text-align: right;">
            <div style="background: #4c6ddb; color: #fff; padding: 8px 12px; border-radius: 12px; display: inline-block; max-width: 80%;">
              ${message}
            </div>
          </div>
        `;
        
        // Clear input and show loading
        aiInput.value = '';
        aiInput.disabled = true;
        aiInput.placeholder = 'AI is thinking...';
        
        // Scroll to bottom
        aiMessages.scrollTop = aiMessages.scrollHeight;
        
        try {
          // Get current user ID or use a default
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user ? user.id : 'anonymous';
          
          // Get AI response
          const aiResponse = await aiService.sendMessage(message, userId, 'learner');
          
          // Add AI response
          aiMessages.innerHTML += `
            <div style="margin-bottom: 10px;">
              <div style="background: #f7f9fb; color: #263a7a; padding: 8px 12px; border-radius: 12px; display: inline-block; max-width: 80%;">
                🤖 ${aiResponse}
              </div>
            </div>
          `;
        } catch (error) {
          // Add error message
          aiMessages.innerHTML += `
            <div style="margin-bottom: 10px;">
              <div style="background: #ffebee; color: #c62828; padding: 8px 12px; border-radius: 12px; display: inline-block; max-width: 80%;">
                🤖 Sorry, I'm having trouble connecting right now. Please try again later.
              </div>
            </div>
          `;
        } finally {
          // Re-enable input
          aiInput.disabled = false;
          aiInput.placeholder = 'Type your question...';
          aiMessages.scrollTop = aiMessages.scrollHeight;
        }
      }
    });
  }

  // Timetable dynamic content
  const timetableData = [
    {
      date: '2024-06-01',
      day: 'Monday',
      unit: 'Mathematics 101',
      code: 'MATH101',
      instructor: 'Dr. Smith',
      time: '09:00 - 10:30 AM',
      link: '#'
    },
    {
      date: '2024-06-01',
      day: 'Monday',
      unit: 'Physics 201',
      code: 'PHYS201',
      instructor: 'Prof. Johnson',
      time: '11:00 - 12:30 PM',
      link: '#'
    },
    {
      date: '2024-06-02',
      day: 'Tuesday',
      unit: 'Chemistry 102',
      code: 'CHEM102',
      instructor: 'Dr. Lee',
      time: '01:00 - 02:30 PM',
      link: '#'
    },
    {
      date: '2024-06-02',
      day: 'Tuesday',
      unit: 'Computer Science 150',
      code: 'CS150',
      instructor: 'Dr. Patel',
      time: '03:00 - 04:30 PM',
      link: '#'
    }
  ];
  const timetableBody = document.getElementById('timetable-body');
  if (timetableBody) {
    timetableBody.innerHTML = '';
    timetableData.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.date}</td>
        <td>${row.unit}</td>
        <td>${row.time}</td>
        <td><a href="${row.link}" class="meeting-link" target="_blank">Join</a></td>
      `;
      timetableBody.appendChild(tr);
    });
  }

  // Progress & Performance dynamic visuals
  // 1. Overall Progress
  const overallProgress = 68; // percent
  const progressBar = document.getElementById('overall-progress-bar');
  const progressLabel = document.getElementById('overall-progress-label');
  if (progressBar && progressLabel) {
    progressBar.style.width = overallProgress + '%';
    progressLabel.textContent = overallProgress + '%';
  }

  // 2. Assignments Due (circular progress)
  const assignmentsDue = 2;
  const totalAssignments = 8;
  const assignmentsPercent = Math.round((assignmentsDue / totalAssignments) * 100);
  const assignmentsProgress = document.getElementById('assignments-progress');
  const assignmentsLabel = document.getElementById('assignments-due-label');
  if (assignmentsProgress && assignmentsLabel) {
    assignmentsProgress.style.background = `conic-gradient(#ffb343 0% ${assignmentsPercent}%, #e6eefd ${assignmentsPercent}% 100%)`;
    assignmentsLabel.textContent = assignmentsDue;
  }

  // 3. Quiz Performance (bar chart)
  const quizPerformance = [
    { label: 'Math', value: 80 },
    { label: 'Physics', value: 60 },
    { label: 'Chem', value: 90 },
    { label: 'CS', value: 70 }
  ];
  const quizBarChart = document.getElementById('quiz-bar-chart');
  if (quizBarChart) {
    quizBarChart.innerHTML = '';
    quizPerformance.forEach(q => {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = q.value + '%';
      bar.innerHTML = `<span class="bar-label">${q.value}%</span><div class="bar-x-label">${q.label}</div>`;
      quizBarChart.appendChild(bar);
    });
  }

  // --- EVENT LISTENERS ---

  const enrolledMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('enrolled'));
  const timetableMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('timetable'));
  const gradingMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('grading'));
  const completedMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('completed'));
  const certificationsMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('certification'));
  const dashboardMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase() === 'dashboard');

  if (enrolledMenuItem) {
    enrolledMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderEnrolledUnits();
      if (window.userManagement) window.userManagement.setupUserMenu();
      if (window.userManagement) window.userManagement.setCurrentDashboardContent();
      attachUserDropdownListeners();
    });
  }
  if (timetableMenuItem) {
    timetableMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderFullTimetable();
    });
  }
  if (gradingMenuItem) {
    gradingMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderGrading();
    });
  }
  if (completedMenuItem) {
    completedMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderCompletedUnits();
    });
  }
  if (certificationsMenuItem) {
    certificationsMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderCertifications();
    });
  }
  if (dashboardMenuItem) {
    dashboardMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderDashboard();
      if (window.userManagement) window.userManagement.setupUserMenu();
      if (window.userManagement) window.userManagement.setCurrentDashboardContent();
      attachUserDropdownListeners();
    });
  }

  // Notice Board dynamic content
  const noticeMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('notice'));
  if (noticeMenuItem) {
    noticeMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderNoticeBoard();
    });
  }

  // Side menu active state logic
  const sideMenuLinks = document.querySelectorAll('.side-menu a');
  sideMenuLinks.forEach(link => {
    link.addEventListener('click', function() {
      sideMenuLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
  attachUserDropdownListeners();
}); 