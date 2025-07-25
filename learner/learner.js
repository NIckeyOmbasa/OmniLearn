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
    .select('*, courses(*), profiles:learner_id(full_name)')
    .eq('learner_id', userId);
  console.log('Fetched enrollments:', enrollments);

  // Use joined course data directly for enrolled courses
  const courses = (enrollments || [])
    .map(e => e.courses)
    .filter(Boolean);

  // Fetch assignments for assignments due
  let assignments = [];
  if (courses.length > 0) {
    const courseIds = courses.map(c => c.id);
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .in('course_id', courseIds);
    assignments = assignmentsData || [];
  }

  // Fetch progress/grades
  let progress = [];
  if (courses.length > 0) {
    const courseIds = courses.map(c => c.id);
    const { data: progressData } = await supabase
      .from('progress')
      .select('*')
      .eq('learner_id', userId)
      .in('course_id', courseIds);
    progress = progressData || [];
  }

  // Fetch quiz performance (from assignments or progress)
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

  // Fetch all offered courses
  let allCourses = [];
  const { data: allCoursesData } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true);
  allCourses = allCoursesData || [];
  console.debug('All offered courses:', allCourses);

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
    totalAssignments,
    allCourses // add allCourses to return
  };
}

// --- MAIN DASHBOARD RENDER ---
async function renderDashboard() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading dashboard...</div></div>';
  try {
    const data = await fetchLearnerDashboardData();
    // --- Quiz Weak Topics (from localStorage) ---
    const userId = (await supabase.auth.getUser()).data.user.id;
    let allWeakTopics = {};
    (data.courses || []).forEach(course => {
      let quizHistory = JSON.parse(localStorage.getItem(`quizHistory_${userId}_${course.id}`) || '[]');
      quizHistory.forEach(q => {
        if (q.weakTopics) {
          for (const topic in q.weakTopics) {
            allWeakTopics[topic] = (allWeakTopics[topic] || 0) + q.weakTopics[topic];
          }
        }
      });
    });
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
                    ${Object.keys(allWeakTopics).length ? `<li><b>Weak Topics:</b> ${Object.keys(allWeakTopics).join(', ')}</li>` : ''}
                  </ul>
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
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading enrolled units...</div></div>';
  try {
    const data = await fetchLearnerDashboardData();
    const enrolledIds = new Set(data.courses.map(c => c.id));
    // Build a map of course_id to progress
    const progressMap = {};
    (data.progress || []).forEach(p => { progressMap[p.course_id] = p.progress || 0; });
    dashboardMain.innerHTML = `
      <div class="enrolled-units-section">
        <h2>📚 Enrolled Courses</h2>
        <div class="enrolled-units-list">
          ${data.courses.length === 0 ? '<div class="no-enrolled">You are not enrolled in any courses yet.</div>' :
            data.courses.map(unit => `
              <div class="enrolled-unit-card">
                <div class="unit-code">${unit.code || ''}</div>
                <div class="unit-name">${unit.title || ''}</div>
                <div class="unit-instructor">Instructor: ${unit.instructor || ''}</div>
                <div class="unit-progress-bar-bg">
                  <div class="unit-progress-bar-fill" style="width: ${progressMap[unit.id] || 0}%"></div>
                </div>
                <div class="unit-progress-label">${progressMap[unit.id] || 0}% complete</div>
                <div class="enrolled-unit-actions">
                  <button class="continue-learning-btn" data-course-id="${unit.id}">Continue Learning</button>
                  <button class="unenroll-btn" data-course-id="${unit.id}">Unenroll</button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
      <div class="offered-courses-section">
        <h2>🌐 All Courses</h2>
        <div class="offered-courses-list">
          ${data.allCourses.length === 0 ? '<div class="no-offered">No courses available.</div>' :
            data.allCourses.map(course => {
              const isEnrolled = enrolledIds.has(course.id);
              return `
                <div class="offered-course-card">
                  <div class="unit-code">${course.code || ''}</div>
                  <div class="unit-name">${course.title || ''}</div>
                  <div class="unit-instructor">Instructor: ${course.instructor || ''}</div>
                  ${isEnrolled
                    ? `<button class="continue-learning-btn" data-course-id="${course.id}">Continue Learning</button>`
                    : `<button class="enroll-btn" data-course-id="${course.id}">Enroll & Start Learning</button>`}
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
    // Add enroll button listeners
    document.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const courseId = this.getAttribute('data-course-id');
        this.disabled = true;
        this.textContent = 'Enrolling...';
        // Prevent duplicate enrollment
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase
          .from('enrollments')
          .select('id')
          .eq('learner_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();
        if (existing) {
          showCustomAlert('You are already enrolled in this course.');
          renderEnrolledUnits();
          return;
        }
        // Insert enrollment in DB
        const { error } = await supabase
          .from('enrollments')
          .insert([{ learner_id: user.id, course_id: courseId }]);
        if (!error) {
          showCustomAlert('Enrolled successfully!');
          renderEnrolledUnits();
        } else {
          this.disabled = false;
          this.textContent = 'Enroll & Start Learning';
          showCustomAlert('Error enrolling: ' + error.message);
        }
      });
    });
    // Add continue learning button listeners
    document.querySelectorAll('.continue-learning-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const courseId = this.getAttribute('data-course-id');
        window.location.href = `/omnilearn/learner/course-details.html?courseId=${courseId}`;
      });
    });
    // Add unenroll button listeners
    document.querySelectorAll('.unenroll-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const courseId = this.getAttribute('data-course-id');
        if (!confirm('Are you sure you want to unenroll from this course?')) return;
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('enrollments')
          .delete()
          .eq('learner_id', user.id)
          .eq('course_id', courseId);
        if (!error) {
          showCustomAlert('Unenrolled successfully!');
          renderEnrolledUnits();
        } else {
          showCustomAlert('Error unenrolling: ' + error.message);
        }
      });
    });
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading enrolled units: ${err.message}</div>`;
  }
}

// --- TIMETABLE ---
async function renderFullTimetable() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading timetable...</div></div>';
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
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading grading...</div></div>';
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
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading completed units...</div></div>';
  try {
    const data = await fetchLearnerDashboardData();
    // For each enrolled course, calculate content progress and assignments percentage
    const userId = (await supabase.auth.getUser()).data.user.id;
    const enrolledCourses = data.courses;
    const progressMap = {};
    (data.progress || []).forEach(p => { progressMap[p.course_id] = p.progress || 0; });
    // Assignments: group by course and calculate percent complete
    const assignmentsByCourse = {};
    (data.assignments || []).forEach(a => {
      if (!assignmentsByCourse[a.course_id]) assignmentsByCourse[a.course_id] = [];
      assignmentsByCourse[a.course_id].push(a);
    });
    dashboardMain.innerHTML = `
      <div class="completed-units-section">
        <h2>✅ Completed Units</h2>
        <div class="completed-units-list">
          ${enrolledCourses.length === 0 ? '<div class="no-completed">No units enrolled yet.</div>' :
            enrolledCourses.map(unit => {
              const contentProgress = progressMap[unit.id] || 0;
              const assignments = assignmentsByCourse[unit.id] || [];
              const totalAssignments = assignments.length;
              const completedAssignments = assignments.filter(a => a.completed).length;
              const assignmentsPercent = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
              const isComplete = contentProgress === 100 && assignmentsPercent >= 70;
              return `
                <div class="completed-unit-card">
                  <div class="unit-code">${unit.code || ''}</div>
                  <div class="unit-name">${unit.title || ''}</div>
                  <div class="unit-instructor">Instructor: ${unit.instructor || ''}</div>
                  <div class="unit-progress-label">Course Content: <b>${contentProgress}%</b></div>
                  <div class="unit-progress-label">Assignments: <b>${assignmentsPercent}%</b></div>
                  <div class="unit-completed-date">Status: <span style="color:${isComplete ? '#7ebe91' : '#e74c3c'};font-weight:700;">${isComplete ? 'Complete' : 'Incomplete'}</span></div>
                </div>
              `;
            }).join('')}
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
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading certifications...</div></div>';
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
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading notices...</div></div>';
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

// --- ASSIGNMENTS ---
async function renderAssignments() {
  const dashboardMain = document.querySelector('.dashboard-main');
  if (!dashboardMain) return;
  dashboardMain.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Loading assignments...</div></div>';
  try {
    const data = await fetchLearnerDashboardData();
    const assignments = data.assignments;
    const courses = data.courses;
    if (!assignments.length) {
      dashboardMain.innerHTML = '<div class="dashboard-section"><h2>📑 Assignments</h2><div>No assignments found for your enrolled courses.</div></div>';
    } else {
      dashboardMain.innerHTML = `
        <div class="assignments-section">
          <h2>📑 Assignments</h2>
          <div class="assignments-list">
            ${assignments.map(a => {
              const course = courses.find(c => c.id === a.course_id);
              return `
                <div class="assignment-card${a.completed ? ' completed' : ''}">
                  <div class="assignment-title">${a.title}</div>
                  <div class="assignment-course">Course: ${course ? course.title : 'Unknown'}</div>
                  <div class="assignment-desc">${a.description || ''}</div>
                  <div class="assignment-due">Due: ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}</div>
                  <div class="assignment-status">Status: <span>${a.completed ? 'Completed' : 'Pending'}</span></div>
                  ${!a.completed ? `<button class="complete-assignment-btn" data-id="${a.id}">Mark as Complete</button>` : '<span class="assignment-complete-label">✔️ Completed</span>'}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    // Add event listeners for complete buttons
    document.querySelectorAll('.complete-assignment-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const assignmentId = this.getAttribute('data-id');
        this.disabled = true;
        this.textContent = 'Marking...';
        // Mark assignment as complete in DB (simulate with update)
        const { error } = await supabase
          .from('assignments')
          .update({ completed: true })
          .eq('id', assignmentId);
        if (!error) {
          this.parentElement.classList.add('completed');
          this.parentElement.querySelector('.assignment-status span').textContent = 'Completed';
          this.remove();
        } else {
          this.disabled = false;
          this.textContent = 'Mark as Complete';
          alert('Error marking assignment as complete.');
        }
      });
    });
    // --- QUIZZES SECTION ---
    const quizzesSection = document.createElement('div');
    quizzesSection.className = 'quizzes-section';
    quizzesSection.innerHTML = `
      <h2>📝 Quizzes</h2>
      <div id="quiz-controls">
        <label for="quiz-course-select">Select Course:</label>
        <select id="quiz-course-select">
          ${courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
        </select>
        <button id="start-quiz-btn">Start New Quiz</button>
      </div>
      <div id="quiz-area"></div>
    `;
    dashboardMain.appendChild(quizzesSection);
    document.getElementById('start-quiz-btn').addEventListener('click', async function() {
      const courseId = document.getElementById('quiz-course-select').value;
      if (!courseId) {
        showCustomAlert('Please select a course before starting a quiz.');
        return;
      }
      await startQuiz(courseId, courses);
    });
  } catch (err) {
    dashboardMain.innerHTML = `<div class="dashboard-error">Error loading assignments: ${err.message}</div>`;
  }
}

// --- SMART QUIZ GENERATION SYSTEM ---
async function generateQuizWithGemini(courseContent) {
  const apiKey = 'AIzaSyB-_sGIZrm3h60seCPU93wfkK4XRz43TT8';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
  const prompt = `Generate a 20-question multiple choice quiz based on the following content. Each question should have 4 options, one correct answer, and a brief explanation. Format as JSON: [{question, options, answer, explanation}]. Content: ${courseContent}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  let quizText = '';
  if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
    quizText = data.candidates[0].content.parts.map(p => p.text).join(' ');
  }
  let quiz;
  try {
    quiz = JSON.parse(quizText);
  } catch (e) {
    const match = quizText.match(/\[.*\]/s);
    quiz = match ? JSON.parse(match[0]) : [];
  }
  return quiz;
}

async function startQuiz(courseId, courses) {
  const quizArea = document.getElementById('quiz-area');
  quizArea.innerHTML = '<div class="dashboard-loading"><div class="spinner"></div><div class="loader-text">Generating quiz...</div></div>';
  // Fetch course content for the selected course
  const course = courses.find(c => c.id == courseId);
  const courseContent = course && course.outline ? course.outline.map(t => t.title + ': ' + (t.content || '') + (t.subtopics ? t.subtopics.map(s => s.title + ': ' + (s.content || '')).join(' ') : '')).join(' ') : '';
  let quizQuestions = [];
  try {
    quizQuestions = await generateQuizWithGemini(courseContent);
  } catch (e) {
    quizArea.innerHTML = '<div class="dashboard-error">Failed to generate quiz. Please try again.</div>';
    return;
  }
  // Render quiz UI
  let currentQ = 0;
  let score = 0;
  let userAnswers = [];
  function renderQuestion() {
    if (currentQ >= quizQuestions.length) {
      // Quiz complete
      quizArea.innerHTML = `<div class="quiz-result">
        <h3>Quiz Complete!</h3>
        <div>Score: ${score} / ${quizQuestions.length} (${Math.round((score/quizQuestions.length)*100)}%)</div>
        <div class="quiz-review-list">
          ${quizQuestions.map((q, i) => {
            const userAns = userAnswers[i];
            const isCorrect = userAns && userAns.answer === q.answer;
            return `<div class="quiz-review-item" style="margin-bottom:16px;">
              <div><b>Q${i+1}:</b> ${q.question}</div>
              <div>Your answer: <span style="color:${isCorrect ? '#7ebe91' : '#e74c3c'};font-weight:600;">${userAns ? userAns.answer : 'No answer'}</span></div>
              <div>Correct answer: <b>${q.answer}</b></div>
              <div>Explanation: <i>${q.explanation || 'No explanation provided.'}</i></div>
            </div>`;
          }).join('')}
        </div>
        <button id="retake-quiz-btn">Retake Quiz</button>
      </div>`;
      document.getElementById('retake-quiz-btn').onclick = () => startQuiz(courseId, courses);
      return;
    }
    const q = quizQuestions[currentQ];
    quizArea.innerHTML = `<div class="quiz-question">
      <div class="quiz-q-title"><b>Q${currentQ+1}:</b> ${q.question}</div>
      <div class="quiz-q-options">
        ${q.options.map((opt, i) => `<label><input type="radio" name="quiz-q" value="${opt}"> ${opt}</label><br>`).join('')}
      </div>
      <button id="submit-q-btn">Submit Answer</button>
    </div>`;
    document.getElementById('submit-q-btn').onclick = () => {
      const selected = document.querySelector('input[name="quiz-q"]:checked');
      if (!selected) return alert('Please select an answer.');
      userAnswers.push({q: q.question, answer: selected.value});
      if (selected.value === q.answer) score++;
      currentQ++;
      renderQuestion();
    };
  }
  renderQuestion();
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
  const assignmentsMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('assignments'));

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
  if (assignmentsMenuItem) {
    assignmentsMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderAssignments();
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
  renderDashboard();

  // Responsive menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sideMenu = document.getElementById('side-menu');
  if (menuToggle && sideMenu) {
    menuToggle.addEventListener('click', function() {
      sideMenu.classList.toggle('open');
    });
    // Close menu when clicking outside (mobile)
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 900 && sideMenu.classList.contains('open')) {
        if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          sideMenu.classList.remove('open');
        }
      }
    });
    // Hide sidebar when a menu link is clicked (mobile)
    sideMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 900) {
          sideMenu.classList.remove('open');
        }
      });
    });
  }
}); 

function showCustomAlert(message) {
  let alertBox = document.querySelector('.custom-alert');
  if (!alertBox) {
    alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    document.body.appendChild(alertBox);
  }
  alertBox.textContent = message;
  alertBox.classList.add('show');
  setTimeout(() => {
    alertBox.classList.remove('show');
  }, 5000);
} 