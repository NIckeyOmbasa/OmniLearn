import { supabase } from '../supabase.js';
import { aiService } from '../ai-service.js';
import { alertService } from '../alert-service.js';
import { userManagement } from '../user-management.js';

// JavaScript for Trainer Dashboard (OmniLearn)
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

document.addEventListener('DOMContentLoaded', function () {
  // User management is now handled by the userManagement module
  // The module will automatically set up the user menu and handle all user actions

  // Sidebar navigation logic
  const menuLinks = document.querySelectorAll('.side-menu a');
  const dashboardMain = document.querySelector('.dashboard-main');
  const dashboardContent = dashboardMain ? dashboardMain.innerHTML : '';

  function setActive(link) {
    menuLinks.forEach(a => a.classList.remove('active'));
    link.classList.add('active');
  }

  // --- DYNAMIC TRAINER DASHBOARD SUMMARY ---
  async function renderTrainerDashboardSummary() {
    const dashboardMain = document.querySelector('.dashboard-main');
    if (!dashboardMain) return;
    dashboardMain.innerHTML = '<div class="dashboard-loading">Loading dashboard...</div>';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const userId = user.id;

      // Fetch all courses created by this trainer
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      if (coursesError) throw coursesError;

      // Fetch all assignments created by this trainer
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, title, due_date, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      if (assignmentsError) throw assignmentsError;

      // Fetch all enrollments for trainer's courses
      let totalLearners = 0;
      if (courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const { count, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('learner_id', { count: 'exact', head: true })
          .in('course_id', courseIds);
        if (enrollmentsError) throw enrollmentsError;
        totalLearners = count || 0;
      }

      // Fetch recent notices by this trainer
      const { data: notices, error: noticesError } = await supabase
        .from('notices')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (noticesError) throw noticesError;

      // Render dashboard summary
      dashboardMain.innerHTML = `
        <div class="trainer-dashboard">
          <h1>👨‍🏫 Trainer Dashboard</h1>
          <div class="dashboard-section">
            <h2>📊 Overview</h2>
            <ul>
              <li><strong>Total Courses:</strong> ${courses.length}</li>
              <li><strong>Total Assignments:</strong> ${assignments.length}</li>
              <li><strong>Total Learners Enrolled:</strong> ${totalLearners}</li>
            </ul>
          </div>
          <div class="dashboard-section">
            <h2>🆕 Recent Courses</h2>
            <ul>
              ${courses.slice(0, 3).map(c => `<li>${c.title} <span style='color:#888;font-size:0.95em;'>(Created: ${new Date(c.created_at).toLocaleDateString()})</span></li>`).join('') || '<li>No courses yet.</li>'}
            </ul>
          </div>
          <div class="dashboard-section">
            <h2>📝 Recent Assignments</h2>
            <ul>
              ${assignments.slice(0, 3).map(a => `<li>${a.title} <span style='color:#888;font-size:0.95em;'>(Due: ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'})</span></li>`).join('') || '<li>No assignments yet.</li>'}
            </ul>
          </div>
          <div class="dashboard-section">
            <h2>📢 Recent Notices</h2>
            <ul>
              ${notices.length > 0 ? notices.map(n => `<li><strong>${n.title}</strong> <span style='color:#888;font-size:0.95em;'>(Posted: ${new Date(n.created_at).toLocaleDateString()})</span></li>`).join('') : '<li>No notices yet.</li>'}
            </ul>
          </div>
        </div>
      `;
    } catch (err) {
      dashboardMain.innerHTML = `<div class="dashboard-error">Error loading dashboard: ${err.message}</div>`;
    }
  }

  // Replace static dashboard with dynamic summary
  menuLinks[0].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    renderTrainerDashboardSummary();
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
  });

  // Courses & Assignments
  menuLinks[1].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="trainer-dashboard">
        <h1>📚 Manage Courses & Assignments</h1>
        <button id="create-course-btn">Create New Course</button>
        <button id="create-assignment-btn">Create New Assignment</button>
        <div id="courses-list">
          <p>Loading courses...</p>
        </div>
        <div id="assignments-list" style="margin-top: 30px;">
          <p>Loading assignments...</p>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
    // Add event listener for create course button
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
      createCourseBtn.addEventListener('click', function() {
        window.location.href = 'create-course.html';
      });
    }
    // Add event listener for create assignment button
    const createAssignmentBtn = document.getElementById('create-assignment-btn');
    if (createAssignmentBtn) {
      createAssignmentBtn.addEventListener('click', function() {
        window.location.href = 'create-assignment.html';
      });
    }
    // Load courses and assignments
    loadCourses();
    loadAssignments();
  });

  // --- Enhanced Learner Progress Section ---
  async function renderLearnerProgressSection() {
    const dashboardMain = document.querySelector('.dashboard-main');
    if (!dashboardMain) return;
    dashboardMain.innerHTML = `
      <div class="trainer-dashboard">
        <h1>📈 Learner Progress & Analytics</h1>
        <div id="courses-progress-list">
          <p>Loading your courses...</p>
        </div>
        <div id="course-learners-progress" style="margin-top: 32px;"></div>
      </div>
    `;
    // Fetch courses for this trainer
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        document.getElementById('courses-progress-list').innerHTML = '<p style="color: red;">You must be signed in to view progress.</p>';
        return;
      }
      const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      if (error || !courses || courses.length === 0) {
        document.getElementById('courses-progress-list').innerHTML = '<p>No courses found.</p>';
        return;
      }
      // For each course, fetch enrolled learners count
      let html = '<ul style="list-style:none; padding:0;">';
      for (const course of courses) {
        // Assume enrollments table: course_id, learner_id
        const { count, error: enrollError } = await supabase
          .from('enrollments')
          .select('learner_id', { count: 'exact', head: true })
          .eq('course_id', course.id);
        html += `<li style="margin-bottom:18px;">
          <button class="course-progress-btn" data-course-id="${course.id}" style="background:#f7f9fb; border:none; border-radius:8px; padding:16px 24px; width:100%; text-align:left; font-size:1.1rem; color:#263a7a; font-weight:600; box-shadow:0 2px 8px rgba(76,109,219,0.08); cursor:pointer;">
            ${course.title} <span style="color:#4c6ddb; font-weight:400;">(${count || 0} learners)</span>
          </button>
        </li>`;
      }
      html += '</ul>';
      document.getElementById('courses-progress-list').innerHTML = html;
      // Attach click listeners
      document.querySelectorAll('.course-progress-btn').forEach(btn => {
        btn.onclick = function() {
          const courseId = this.getAttribute('data-course-id');
          renderLearnersForCourse(courseId);
        };
      });
    } catch (err) {
      document.getElementById('courses-progress-list').innerHTML = '<p style="color: red;">Error loading courses.</p>';
    }
  }

  // Show learners and their progress for a course
  async function renderLearnersForCourse(courseId) {
    const container = document.getElementById('course-learners-progress');
    if (!container) return;
    container.innerHTML = '<p>Loading learners...</p>';
    try {
      // Get learners enrolled in this course
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('learner_id')
        .eq('course_id', courseId);
      if (enrollError || !enrollments || enrollments.length === 0) {
        container.innerHTML = '<p>No learners enrolled in this course.</p>';
        return;
      }
      // Get learner profiles
      const learnerIds = enrollments.map(e => e.learner_id);
      const { data: learners, error: learnerError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', learnerIds);
      if (learnerError || !learners) {
        container.innerHTML = '<p>Error loading learners.</p>';
        return;
      }
      // For each learner, fetch progress (e.g., from progress table or assignments)
      let html = `<h3>Learner Progress</h3><ul style="list-style:none; padding:0;">`;
      for (const learner of learners) {
        // Example: fetch progress percent from a progress table
        let progressPercent = 'N/A';
        const { data: progressData } = await supabase
          .from('progress')
          .select('percent')
          .eq('course_id', courseId)
          .eq('learner_id', learner.id)
          .single();
        if (progressData && typeof progressData.percent === 'number') {
          progressPercent = progressData.percent + '%';
        }
        html += `<li style="margin-bottom:14px; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(76,109,219,0.06); padding:12px 18px;">
          <span style="font-weight:600; color:#263a7a;">${learner.full_name || learner.email}</span>
          <span style="float:right; color:#4c6ddb; font-weight:500;">Progress: ${progressPercent}</span>
        </li>`;
      }
      html += '</ul>';
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = '<p style="color: red;">Error loading learner progress.</p>';
    }
  }

  // Replace Learner Progress sidebar handler:
  menuLinks[2].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    renderLearnerProgressSection();
  });

  // Notice Board
  menuLinks[3].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="trainer-dashboard">
        <h1>📢 Notice Board</h1>
        <button id="post-notice-btn">Post Update</button>
        <div id="notice-board">
          <p>Loading notices...</p>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
    // Add event listener for post notice button
    const postNoticeBtn = document.getElementById('post-notice-btn');
    if (postNoticeBtn) {
      postNoticeBtn.addEventListener('click', function() {
        showPostNoticeModal();
      });
    }
    // Load notices
    loadNotices();
  });

  // Live Classes
  menuLinks[4].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="trainer-dashboard">
        <h1>🟢 Live Classes</h1>
        <button id="schedule-class-btn">Schedule Live Class</button>
        <div id="live-classes-list">
          <p>No live classes scheduled. Schedule one now!</p>
        </div>
      </div>
    `;
  });

  // OmniLearn AI chatbox open/close logic
  const aiMenuItem = Array.from(menuLinks).find(a => a.textContent.trim().toLowerCase().includes('ai'));
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
          const aiResponse = await aiService.sendMessage(message, userId, 'trainer');
          
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
  attachUserDropdownListeners();
});

// Load courses from Supabase
async function loadCourses() {
  const coursesList = document.getElementById('courses-list');
  if (!coursesList) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      coursesList.innerHTML = '<p style="color: red;">You must be signed in to view courses.</p>';
      return;
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      coursesList.innerHTML = '<p style="color: red;">Error loading courses: ' + error.message + '</p>';
      return;
    }

    if (!courses || courses.length === 0) {
      coursesList.innerHTML = '<p>No courses yet. Start by creating one!</p>';
      return;
    }

    coursesList.innerHTML = `
      <div style="margin-top: 20px;">
        <h3>Your Courses (${courses.length})</h3>
        ${courses.map(course => `
          <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #4c6ddb;">
            <h4 style="color: #4c6ddb; margin-bottom: 8px;">${course.title}</h4>
            <p style="color: #263a7a; margin-bottom: 10px;">${course.description}</p>
            <div style="display: flex; gap: 10px; align-items: center;">
              <a href="course-details.html?id=${course.id}" style="color: #4c6ddb; text-decoration: none; font-weight: 500;">View Details</a>
              <span style="color: #7ebe91; font-size: 0.9rem;">Created: ${new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (error) {
    coursesList.innerHTML = '<p style="color: red;">Error loading courses: ' + error.message + '</p>';
  }
}

// Load assignments from Supabase
async function loadAssignments() {
  const assignmentsList = document.getElementById('assignments-list');
  if (!assignmentsList) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      assignmentsList.innerHTML = '<p style="color: red;">You must be signed in to view assignments.</p>';
      return;
    }

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses(title)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      assignmentsList.innerHTML = '<p style="color: red;">Error loading assignments: ' + error.message + '</p>';
      return;
    }

    if (!assignments || assignments.length === 0) {
      assignmentsList.innerHTML = '<h3>Your Assignments</h3><p>No assignments yet. Create one for your courses!</p>';
      return;
    }

    assignmentsList.innerHTML = `
      <h3>Your Assignments (${assignments.length})</h3>
      ${assignments.map(assignment => `
        <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #7ebe91;">
          <h4 style="color: #4c6ddb; margin-bottom: 8px;">${assignment.title}</h4>
          <p style="color: #263a7a; margin-bottom: 10px;">${assignment.description}</p>
          <div style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 0.9rem; color: #7ebe91;">
            <span>Course: ${assignment.courses?.title || 'Unknown'}</span>
            <span>Type: ${assignment.type}</span>
            <span>Points: ${assignment.points}</span>
            <span>Due: ${new Date(assignment.due_date).toLocaleDateString()}</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <a href="assignment-details.html?id=${assignment.id}" style="color: #4c6ddb; text-decoration: none; font-weight: 500;">View Details</a>
            <button onclick="editAssignment('${assignment.id}')" style="background: #4c6ddb; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.9rem;">Edit</button>
            <button onclick="deleteAssignment('${assignment.id}')" style="background: #dc3545; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.9rem;">Delete</button>
          </div>
        </div>
      `).join('')}
    `;

  } catch (error) {
    assignmentsList.innerHTML = '<p style="color: red;">Error loading assignments: ' + error.message + '</p>';
  }
}

// Global functions for assignment actions
window.editAssignment = function(assignmentId) {
  window.location.href = `edit-assignment.html?id=${assignmentId}`;
};

window.deleteAssignment = async function(assignmentId) {
  if (confirm('Are you sure you want to delete this assignment?')) {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) {
        alert('Error deleting assignment: ' + error.message);
        return;
      }
      
      alert('Assignment deleted successfully!');
      loadAssignments(); // Refresh the list
    } catch (error) {
      alert('Error deleting assignment: ' + error.message);
    }
  }
};

// Noticeboard Functions
async function loadNotices() {
  const noticeBoard = document.getElementById('notice-board');
  if (!noticeBoard) return;

  try {
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      noticeBoard.innerHTML = '<p style="color: red;">Error loading notices: ' + error.message + '</p>';
      return;
    }

    if (!notices || notices.length === 0) {
      noticeBoard.innerHTML = '<p>No notices yet. Post an update for your learners!</p>';
      return;
    }

    noticeBoard.innerHTML = `
      <div style="margin-top: 20px;">
        <h3>Recent Notices (${notices.length})</h3>
        ${notices.map(notice => `
          <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${getPriorityColor(notice.priority)}; position: relative;">
            ${notice.is_pinned ? '<div style="position: absolute; top: 10px; right: 10px; background: #ffb343; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">📌 PINNED</div>' : ''}
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h4 style="color: #4c6ddb; margin: 0;">${notice.title}</h4>
              <span style="background: ${getPriorityColor(notice.priority)}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">${notice.priority}</span>
            </div>
            <p style="color: #263a7a; margin-bottom: 10px; line-height: 1.5;">${notice.message}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #7ebe91;">
              <span>By: ${notice.sender_name} (${notice.sender_role})</span>
              <span>${new Date(notice.created_at).toLocaleDateString()}</span>
            </div>
            ${notice.expires_at ? `<div style="margin-top: 8px; font-size: 0.8rem; color: #ffb343;">⏰ Expires: ${new Date(notice.expires_at).toLocaleDateString()}</div>` : ''}
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 12px;">
              <button onclick="editNotice('${notice.id}')" style="background: #4c6ddb; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.9rem;">Edit</button>
              <button onclick="deleteNotice('${notice.id}')" style="background: #dc3545; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.9rem;">Delete</button>
              <button onclick="togglePinNotice('${notice.id}', ${notice.is_pinned})" style="background: ${notice.is_pinned ? '#ffb343' : '#6c757d'}; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.9rem;">${notice.is_pinned ? 'Unpin' : 'Pin'}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (error) {
    noticeBoard.innerHTML = '<p style="color: red;">Error loading notices: ' + error.message + '</p>';
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

function showPostNoticeModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="background: #fff; border-radius: 16px; padding: 32px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
      <h2 style="color: #4c6ddb; margin-bottom: 24px;">📢 Post New Notice</h2>
      <form id="post-notice-form">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Title</label>
          <input type="text" id="notice-title" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Message</label>
          <textarea id="notice-message" required rows="4" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; resize: vertical;"></textarea>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Priority</label>
          <select id="notice-priority" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
            <option value="low">Low</option>
            <option value="normal" selected>Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Expires At (Optional)</label>
          <input type="datetime-local" id="notice-expires" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 24px;">
          <label style="display: flex; align-items: center; gap: 8px; color: #263a7a; font-weight: 600;">
            <input type="checkbox" id="notice-pinned" style="width: 18px; height: 18px;">
            Pin this notice to the top
          </label>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" onclick="closePostNoticeModal()" style="background: #6c757d; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
          <button type="submit" style="background: #4c6ddb; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Post Notice</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  const form = document.getElementById('post-notice-form');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    await postNotice();
  });
}

async function postNotice() {
  const title = document.getElementById('notice-title').value.trim();
  const message = document.getElementById('notice-message').value.trim();
  const priority = document.getElementById('notice-priority').value;
  const expiresAt = document.getElementById('notice-expires').value;
  const isPinned = document.getElementById('notice-pinned').checked;

  if (!title || !message) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be signed in to post a notice.');
      return;
    }

    // Get user profile for name and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    const noticeData = {
      title,
      message,
      sender_id: user.id,
      sender_name: profile?.full_name || user.email,
      sender_role: profile?.role || 'trainer',
      priority,
      is_pinned: isPinned,
      expires_at: expiresAt || null
    };

    const { error } = await supabase
      .from('notices')
      .insert([noticeData]);

    if (error) {
      alert('Error posting notice: ' + error.message);
      return;
    }

    alert('Notice posted successfully!');
    closePostNoticeModal();
    loadNotices(); // Refresh the list
  } catch (error) {
    alert('Error posting notice: ' + error.message);
  }
}

window.closePostNoticeModal = function() {
  const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
  if (modal) {
    modal.remove();
  }
};

window.editNotice = function(noticeId) {
  // TODO: Implement edit notice functionality
  alert('Edit notice functionality coming soon!');
};

window.deleteNotice = async function(noticeId) {
  if (confirm('Are you sure you want to delete this notice?')) {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId);
      
      if (error) {
        alert('Error deleting notice: ' + error.message);
        return;
      }
      
      alert('Notice deleted successfully!');
      loadNotices(); // Refresh the list
    } catch (error) {
      alert('Error deleting notice: ' + error.message);
    }
  }
};

window.togglePinNotice = async function(noticeId, currentPinned) {
  try {
    const { error } = await supabase
      .from('notices')
      .update({ is_pinned: !currentPinned })
      .eq('id', noticeId);
    
    if (error) {
      alert('Error updating notice: ' + error.message);
      return;
    }
    
    loadNotices(); // Refresh the list
  } catch (error) {
    alert('Error updating notice: ' + error.message);
  }
}; 