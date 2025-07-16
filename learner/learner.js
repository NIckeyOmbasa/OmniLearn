// JavaScript for Learner Dashboard (OmniLearn)
// Add interactivity here

document.addEventListener('DOMContentLoaded', function () {
  const userIcon = document.getElementById('user-icon');
  const submenu = document.getElementById('profile-submenu');
  // Example: Set username dynamically (replace with actual user data)
  document.getElementById('user-name').textContent = 'User'; // Replace 'User' with actual name from auth

  function closeMenu(e) {
    if (!submenu.contains(e.target) && !userIcon.contains(e.target)) {
      submenu.classList.remove('active');
      document.removeEventListener('mousedown', closeMenu);
    }
  }

  userIcon.addEventListener('click', function (e) {
    submenu.classList.toggle('active');
    if (submenu.classList.contains('active')) {
      setTimeout(() => document.addEventListener('mousedown', closeMenu), 0);
    } else {
      document.removeEventListener('mousedown', closeMenu);
    }
  });

  // Optional: Keyboard accessibility
  userIcon.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      submenu.classList.toggle('active');
      if (submenu.classList.contains('active')) {
        setTimeout(() => document.addEventListener('mousedown', closeMenu), 0);
      } else {
        document.removeEventListener('mousedown', closeMenu);
      }
    }
  });

  // OmniLearn AI chatbox open/close logic
  const aiMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('ai'));
  const aiChatbox = document.getElementById('ai-chatbox');
  const closeAiChatbox = document.getElementById('close-ai-chatbox');
  if (aiMenuItem && aiChatbox && closeAiChatbox) {
    aiMenuItem.addEventListener('click', function (e) {
      e.preventDefault();
      aiChatbox.style.display = 'flex';
    });
    closeAiChatbox.addEventListener('click', function () {
      aiChatbox.style.display = 'none';
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

  // Enrolled Units dynamic content
  const enrolledMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('enrolled'));
  const dashboardMain = document.querySelector('.dashboard-main');
  const dashboardContent = dashboardMain ? dashboardMain.innerHTML : '';
  const enrolledUnitsData = [
    { code: 'MATH101', name: 'Mathematics 101', instructor: 'Dr. Smith', progress: 75 },
    { code: 'PHYS201', name: 'Physics 201', instructor: 'Prof. Johnson', progress: 60 },
    { code: 'CHEM102', name: 'Chemistry 102', instructor: 'Dr. Lee', progress: 90 },
    { code: 'CS150', name: 'Computer Science 150', instructor: 'Dr. Patel', progress: 40 }
  ];
  function renderEnrolledUnits() {
    if (!dashboardMain) return;
    dashboardMain.innerHTML = `
      <div class="enrolled-units-section">
        <h2>📚 Enrolled Units</h2>
        <div class="enrolled-units-list">
          ${enrolledUnitsData.map(unit => `
            <div class="enrolled-unit-card">
              <div class="unit-code">${unit.code}</div>
              <div class="unit-name">${unit.name}</div>
              <div class="unit-instructor">Instructor: ${unit.instructor}</div>
              <div class="unit-progress-bar-bg">
                <div class="unit-progress-bar-fill" style="width: ${unit.progress}%"></div>
              </div>
              <div class="unit-progress-label">${unit.progress}% complete</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  if (enrolledMenuItem && dashboardMain) {
    enrolledMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderEnrolledUnits();
    });
  }
  // Restore dashboard on Dashboard menu click
  const dashboardMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase() === 'dashboard');
  if (dashboardMenuItem && dashboardMain) {
    dashboardMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      dashboardMain.innerHTML = dashboardContent;
      // Re-initialize visuals and chatbox logic after restoring dashboard
      setTimeout(() => {
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new Event('DOMContentLoaded'));
        }
      }, 0);
    });
  }

  // Timetable dynamic content
  const timetableMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('timetable'));
  function renderFullTimetable() {
    if (!dashboardMain) return;
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
              ${timetableData.map(row => `
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
  }
  if (timetableMenuItem && dashboardMain) {
    timetableMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderFullTimetable();
    });
  }

  // Grading dynamic content
  const gradingMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('grading'));
  const gradingData = [
    { unit: 'Mathematics 101', code: 'MATH101', quizzes: [
      { grade: 85, date: '2024-06-01' },
      { grade: 90, date: '2024-06-08' },
      { grade: 78, date: '2024-06-15' }
    ] },
    { unit: 'Physics 201', code: 'PHYS201', quizzes: [
      { grade: 70, date: '2024-06-02' },
      { grade: 75, date: '2024-06-09' },
      { grade: 80, date: '2024-06-16' }
    ] },
    { unit: 'Chemistry 102', code: 'CHEM102', quizzes: [
      { grade: 92, date: '2024-06-03' },
      { grade: 88, date: '2024-06-10' },
      { grade: 95, date: '2024-06-17' }
    ] },
    { unit: 'Computer Science 150', code: 'CS150', quizzes: [
      { grade: 88, date: '2024-06-04' },
      { grade: 84, date: '2024-06-11' },
      { grade: 91, date: '2024-06-18' }
    ] }
  ];
  function renderGrading() {
    if (!dashboardMain) return;
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
  }
  if (gradingMenuItem && dashboardMain) {
    gradingMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderGrading();
    });
  }

  // Completed Units dynamic content
  const completedMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('completed'));
  const completedUnitsData = [
    { code: 'ENG101', name: 'English 101', instructor: 'Dr. Adams', completedDate: '2024-05-20' },
    { code: 'BIO110', name: 'Biology 110', instructor: 'Dr. Green', completedDate: '2024-05-15' }
  ];
  function renderCompletedUnits() {
    if (!dashboardMain) return;
    dashboardMain.innerHTML = `
      <div class="completed-units-section">
        <h2>✅ Completed Units</h2>
        <div class="completed-units-list">
          ${completedUnitsData.length === 0 ? '<div class="no-completed">No units completed yet.</div>' :
            completedUnitsData.map(unit => `
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
  }
  if (completedMenuItem && dashboardMain) {
    completedMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderCompletedUnits();
    });
  }

  // Certifications dynamic content
  const certificationsMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('certification'));
  // Sample: all units completed at 100% for demonstration
  const certificationsData = [
    { course: 'OmniLearn Full Course', date: '2024-06-20', file: 'certificate-omnilearn.pdf' }
  ];
  // Simulate completion check: all units at 100%
  const allUnitsCompleted = true; // Set to false to test the incomplete state
  function renderCertifications() {
    if (!dashboardMain) return;
    dashboardMain.innerHTML = `
      <div class="certifications-section">
        <h2>🎓 Certifications</h2>
        <div class="certifications-list">
          ${allUnitsCompleted && certificationsData.length > 0 ?
            certificationsData.map(cert => `
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
  }
  if (certificationsMenuItem && dashboardMain) {
    certificationsMenuItem.addEventListener('click', function(e) {
      e.preventDefault();
      renderCertifications();
    });
  }

  // Notice Board dynamic content
  const noticeMenuItem = Array.from(document.querySelectorAll('.side-menu a')).find(a => a.textContent.trim().toLowerCase().includes('notice'));
  const noticeData = [
    { sender: 'Admin', date: '2024-06-18', title: 'System Maintenance', message: 'The platform will be down for maintenance on June 20th from 2am to 4am.' },
    { sender: 'Trainer', date: '2024-06-17', title: 'Assignment Reminder', message: 'Don’t forget to submit your Physics assignment by Friday.' },
    { sender: 'Admin', date: '2024-06-16', title: 'Welcome!', message: 'Welcome to the new semester. Check your timetable for updates.' }
  ];
  function renderNoticeBoard() {
    if (!dashboardMain) return;
    dashboardMain.innerHTML = `
      <div class="notice-board-section">
        <h2>📢 Notice Board</h2>
        <div class="notice-list">
          ${noticeData.length === 0 ? '<div class="no-notice">No notices at this time.</div>' :
            noticeData.map(notice => `
              <div class="notice-card ${notice.sender.toLowerCase()}">
                <div class="notice-header">
                  <span class="notice-sender">${notice.sender}</span>
                  <span class="notice-date">${notice.date}</span>
                </div>
                <div class="notice-title">${notice.title}</div>
                <div class="notice-message">${notice.message}</div>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  }
  if (noticeMenuItem && dashboardMain) {
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
}); 