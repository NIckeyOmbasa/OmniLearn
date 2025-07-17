// JavaScript for Admin Dashboard (OmniLearn)
import { supabase } from '../supabase.js';
import { aiService } from '../ai-service.js';
import { alertService } from '../alert-service.js';
import { userManagement } from '../user-management.js';

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

  attachUserDropdownListeners();

  // Automatically load dashboard content by default
  const menuLinks = document.querySelectorAll('.side-menu a');
  if (menuLinks[0]) menuLinks[0].click();

  // Sidebar navigation logic
  const dashboardMain = document.querySelector('.dashboard-main');
  const dashboardContent = dashboardMain ? dashboardMain.innerHTML : '';

  function setActive(link) {
    menuLinks.forEach(a => a.classList.remove('active'));
    link.classList.add('active');
  }

  // Dashboard
  menuLinks[0].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = dashboardContent;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
  });

  // User Roles
  menuLinks[1].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="admin-dashboard">
        <h1>👥 Assign User Roles</h1>
        <button id="assign-role-btn">Assign Role</button>
        <div id="roles-list">
          <p>Loading users...</p>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
    // Add event listener for assign role button
    const assignRoleBtn = document.getElementById('assign-role-btn');
    if (assignRoleBtn) {
      assignRoleBtn.addEventListener('click', function() {
        showAssignRoleModal();
      });
    }
    // Load users
    loadUsers();
  });

  // Manage Users
  menuLinks[2].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="admin-dashboard">
        <h1>🛡️ Manage Users & Authentication</h1>
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <button id="create-user-btn">Create User</button>
          <button id="bulk-actions-btn">Bulk Actions</button>
          <button id="export-users-btn">Export Users</button>
        </div>
        <div id="users-list">
          <p>Loading users...</p>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
    // Add event listeners
    const createUserBtn = document.getElementById('create-user-btn');
    const bulkActionsBtn = document.getElementById('bulk-actions-btn');
    const exportUsersBtn = document.getElementById('export-users-btn');
    
    if (createUserBtn) {
      createUserBtn.addEventListener('click', function() {
        showCreateUserModal();
      });
    }
    if (bulkActionsBtn) {
      bulkActionsBtn.addEventListener('click', function() {
        showBulkActionsModal();
      });
    }
    if (exportUsersBtn) {
      exportUsersBtn.addEventListener('click', function() {
        exportUsers();
      });
    }
    // Load users
    loadUsersForManagement();
  });

  // Site Preferences
  menuLinks[3].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="admin-dashboard">
        <h1>⚙️ Site Preferences</h1>
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <button id="save-preferences-btn">Save Preferences</button>
          <button id="reset-preferences-btn">Reset to Default</button>
        </div>
        <div id="site-preferences">
          <div style="background: #f7f9fb; border-radius: 12px; padding: 24px;">
            <h3 style="color: #4c6ddb; margin-bottom: 16px;">General Settings</h3>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Site Name</label>
              <input type="text" id="site-name" value="OmniLearn" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Site Description</label>
              <textarea id="site-description" rows="3" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; resize: vertical;">Advanced Learning Management System</textarea>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Maintenance Mode</label>
              <select id="maintenance-mode" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; color: #263a7a; font-weight: 600;">
                <input type="checkbox" id="email-notifications" checked style="width: 18px; height: 18px;">
                Enable Email Notifications
              </label>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; color: #263a7a; font-weight: 600;">
                <input type="checkbox" id="ai-features" checked style="width: 18px; height: 18px;">
                Enable AI Features
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
    // Add event listeners
    const savePreferencesBtn = document.getElementById('save-preferences-btn');
    const resetPreferencesBtn = document.getElementById('reset-preferences-btn');
    
    if (savePreferencesBtn) {
      savePreferencesBtn.addEventListener('click', function() {
        saveSitePreferences();
      });
    }
    if (resetPreferencesBtn) {
      resetPreferencesBtn.addEventListener('click', function() {
        resetSitePreferences();
      });
    }
  });

  // Announcements
  menuLinks[4].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="admin-dashboard">
        <h1>📢 Announcements</h1>
        <button id="post-announcement-btn">Post Announcement</button>
        <div id="announcements-list">
          <p>Control platform-wide announcements.</p>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
  });

  // Performance Metrics
  menuLinks[5].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="admin-dashboard">
        <h1>📊 Performance Metrics</h1>
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <button id="refresh-metrics-btn">Refresh Data</button>
          <button id="export-metrics-btn">Export Report</button>
        </div>
        <div id="performance-metrics">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; text-align: center;">
              <h3 style="color: #4c6ddb; margin-bottom: 8px;">Total Users</h3>
              <div id="total-users" style="font-size: 2rem; font-weight: bold; color: #263a7a;">Loading...</div>
            </div>
            <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; text-align: center;">
              <h3 style="color: #7ebe91; margin-bottom: 8px;">Active Courses</h3>
              <div id="active-courses" style="font-size: 2rem; font-weight: bold; color: #263a7a;">Loading...</div>
            </div>
            <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; text-align: center;">
              <h3 style="color: #ffb343; margin-bottom: 8px;">Total Assignments</h3>
              <div id="total-assignments" style="font-size: 2rem; font-weight: bold; color: #263a7a;">Loading...</div>
            </div>
            <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; text-align: center;">
              <h3 style="color: #dc3545; margin-bottom: 8px;">System Status</h3>
              <div id="system-status" style="font-size: 1.5rem; font-weight: bold; color: #7ebe91;">🟢 Online</div>
            </div>
          </div>
          <div style="background: #f7f9fb; border-radius: 12px; padding: 24px;">
            <h3 style="color: #4c6ddb; margin-bottom: 16px;">Recent Activity</h3>
            <div id="recent-activity">
              <p>Loading recent activity...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    if (window.userManagement) window.userManagement.setupUserMenu();
    if (window.userManagement) window.userManagement.setCurrentDashboardContent();
    attachUserDropdownListeners();
    // Add event listeners
    const refreshMetricsBtn = document.getElementById('refresh-metrics-btn');
    const exportMetricsBtn = document.getElementById('export-metrics-btn');
    
    if (refreshMetricsBtn) {
      refreshMetricsBtn.addEventListener('click', function() {
        loadPerformanceMetrics();
      });
    }
    if (exportMetricsBtn) {
      exportMetricsBtn.addEventListener('click', function() {
        exportPerformanceReport();
      });
    }
    // Load metrics
    loadPerformanceMetrics();
  });

  // Notice Board
  menuLinks[6].addEventListener('click', function(e) {
    e.preventDefault();
    setActive(this);
    dashboardMain.innerHTML = `
      <div class="admin-dashboard">
        <h1>📢 Notice Board</h1>
        <button id="post-notice-btn">Post Notice</button>
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
          const aiResponse = await aiService.sendMessage(message, userId, 'admin');
          
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
});

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
      noticeBoard.innerHTML = '<p>No notices yet. Post an update for your users!</p>';
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
      sender_role: profile?.role || 'admin',
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

// User Management Functions
async function loadUsers() {
  const rolesList = document.getElementById('roles-list');
  if (!rolesList) return;

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      rolesList.innerHTML = '<p style="color: red;">Error loading users: ' + error.message + '</p>';
      return;
    }

    if (!users || users.length === 0) {
      rolesList.innerHTML = '<p>No users found.</p>';
      return;
    }

    rolesList.innerHTML = `
      <div style="margin-top: 20px;">
        <h3>User Management (${users.length} users)</h3>
        ${users.map(user => `
          <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${getRoleColor(user.role)};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="color: #4c6ddb; margin: 0;">${user.full_name || user.email}</h4>
              <span style="background: ${getRoleColor(user.role)}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; text-transform: uppercase;">${user.role}</span>
            </div>
            <p style="color: #263a7a; margin-bottom: 10px;">Email: ${user.email}</p>
            <div style="display: flex; gap: 10px; align-items: center;">
              <select onchange="updateUserRole('${user.id}', this.value)" style="padding: 4px 8px; border: 1px solid #e6eefd; border-radius: 4px;">
                <option value="learner" ${user.role === 'learner' ? 'selected' : ''}>Learner</option>
                <option value="trainer" ${user.role === 'trainer' ? 'selected' : ''}>Trainer</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
              <button onclick="deleteUser('${user.id}')" style="background: #dc3545; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.9rem;">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (error) {
    rolesList.innerHTML = '<p style="color: red;">Error loading users: ' + error.message + '</p>';
  }
}

async function loadUsersForManagement() {
  const usersList = document.getElementById('users-list');
  if (!usersList) return;

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      usersList.innerHTML = '<p style="color: red;">Error loading users: ' + error.message + '</p>';
      return;
    }

    if (!users || users.length === 0) {
      usersList.innerHTML = '<p>No users found.</p>';
      return;
    }

    usersList.innerHTML = `
      <div style="margin-top: 20px;">
        <h3>All Users (${users.length})</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background: #4c6ddb; color: #fff;">
                <th style="padding: 12px; text-align: left;">Name</th>
                <th style="padding: 12px; text-align: left;">Email</th>
                <th style="padding: 12px; text-align: left;">Role</th>
                <th style="padding: 12px; text-align: left;">Status</th>
                <th style="padding: 12px; text-align: left;">Created</th>
                <th style="padding: 12px; text-align: left;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr style="border-bottom: 1px solid #e6eefd;">
                  <td style="padding: 12px;">${user.full_name || 'N/A'}</td>
                  <td style="padding: 12px;">${user.email}</td>
                  <td style="padding: 12px;">
                    <span style="background: ${getRoleColor(user.role)}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${user.role}</span>
                  </td>
                  <td style="padding: 12px;">
                    <span style="color: #7ebe91;">🟢 Active</span>
                  </td>
                  <td style="padding: 12px;">${new Date(user.created_at).toLocaleDateString()}</td>
                  <td style="padding: 12px;">
                    <button onclick="editUser('${user.id}')" style="background: #4c6ddb; color: #fff; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem; margin-right: 4px;">Edit</button>
                    <button onclick="deleteUser('${user.id}')" style="background: #dc3545; color: #fff; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch (error) {
    usersList.innerHTML = '<p style="color: red;">Error loading users: ' + error.message + '</p>';
  }
}

function getRoleColor(role) {
  switch (role) {
    case 'admin': return '#dc3545';
    case 'trainer': return '#ffb343';
    case 'learner': return '#7ebe91';
    default: return '#6c757d';
  }
}

function showAssignRoleModal() {
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
    <div style="background: #fff; border-radius: 16px; padding: 32px; width: 90%; max-width: 400px;">
      <h2 style="color: #4c6ddb; margin-bottom: 24px;">👥 Assign User Role</h2>
      <form id="assign-role-form">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">User Email</label>
          <input type="email" id="user-email" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Role</label>
          <select id="user-role" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
            <option value="learner">Learner</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" onclick="closeAssignRoleModal()" style="background: #6c757d; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
          <button type="submit" style="background: #4c6ddb; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Assign Role</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  const form = document.getElementById('assign-role-form');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    await assignUserRole();
  });
}

async function assignUserRole() {
  const email = document.getElementById('user-email').value.trim();
  const role = document.getElementById('user-role').value;

  if (!email) {
    alertService.error('Validation Error', 'Please enter a valid email address.');
    return;
  }

  // Show loading alert
  const loadingId = alertService.loading('Assigning Role', 'Please wait while we update the user role...');

  try {
    // First, get the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      alertService.updateLoading(loadingId, 'error', 'User Lookup Failed', 'Error finding user: ' + userError.message);
      return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      alertService.updateLoading(loadingId, 'error', 'User Not Found', 'No user found with this email address.');
      return;
    }

    // Update the user's role in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: role })
      .eq('id', user.id);

    if (updateError) {
      alertService.updateLoading(loadingId, 'error', 'Role Update Failed', 'Error updating user role: ' + updateError.message);
      return;
    }

    alertService.updateLoading(loadingId, 'success', 'Role Assigned!', `User role has been updated to "${role}" successfully.`);
    closeAssignRoleModal();
    loadUsers(); // Refresh the list
  } catch (error) {
    alertService.updateLoading(loadingId, 'error', 'Assignment Failed', 'Error assigning role: ' + error.message);
  }
}

window.closeAssignRoleModal = function() {
  const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
  if (modal) {
    modal.remove();
  }
};

window.updateUserRole = async function(userId, newRole) {
  // Show loading alert
  const loadingId = alertService.loading('Updating Role', 'Please wait while we update the user role...');

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alertService.updateLoading(loadingId, 'error', 'Update Failed', 'Error updating user role: ' + error.message);
      return;
    }

    alertService.updateLoading(loadingId, 'success', 'Role Updated!', 'User role has been updated successfully.');
    loadUsers(); // Refresh the list
  } catch (error) {
    alertService.updateLoading(loadingId, 'error', 'Update Failed', 'Error updating user role: ' + error.message);
  }
};

window.deleteUser = async function(userId) {
  // Show confirmation dialog using modern alert
  const confirmId = alertService.show('warning', 'Delete User', 
    'Are you sure you want to delete this user? This action cannot be undone.', 0);
  
  // Create confirmation buttons
  const alertElement = document.getElementById(confirmId);
  if (alertElement) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: flex-end;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    `;
    cancelBtn.onclick = () => alertService.close(confirmId);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.cssText = `
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    `;
    deleteBtn.onclick = async () => {
      alertService.close(confirmId);
      
      // Show loading for delete operation
      const deleteLoadingId = alertService.loading('Deleting User', 'Please wait while we delete the user...');
      
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) {
          alertService.updateLoading(deleteLoadingId, 'error', 'Delete Failed', 'Error deleting user: ' + error.message);
          return;
        }

        alertService.updateLoading(deleteLoadingId, 'success', 'User Deleted!', 'User has been deleted successfully.');
        loadUsers(); // Refresh the list
        loadUsersForManagement(); // Refresh management view too
      } catch (error) {
        alertService.updateLoading(deleteLoadingId, 'error', 'Delete Failed', 'Error deleting user: ' + error.message);
      }
    };
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(deleteBtn);
    
    const contentDiv = alertElement.querySelector('.alert-content');
    contentDiv.appendChild(buttonContainer);
  }
};

window.editUser = function(userId) {
  // TODO: Implement edit user functionality
  alertService.info('Coming Soon', 'Edit user functionality will be available in the next update!');
};

// --- SITE PREFERENCES: Supabase Integration ---

// Helper: fetch site preferences from Supabase
async function fetchSitePreferences() {
  const { data, error } = await supabase
    .from('site_preferences')
    .select('*')
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
  return data;
}

// Helper: upsert site preferences to Supabase
async function upsertSitePreferences(prefs) {
  const { error } = await supabase
    .from('site_preferences')
    .upsert([{ id: 1, ...prefs, updated_at: new Date().toISOString() }], { onConflict: ['id'] });
  if (error) throw error;
}

// Update Site Preferences section to load from Supabase
async function renderSitePreferences() {
  const siteNameInput = document.getElementById('site-name');
  const siteDescriptionInput = document.getElementById('site-description');
  const maintenanceModeSelect = document.getElementById('maintenance-mode');
  const emailNotificationsCheckbox = document.getElementById('email-notifications');
  const aiFeaturesCheckbox = document.getElementById('ai-features');

  try {
    const prefs = await fetchSitePreferences();
    if (prefs) {
      if (siteNameInput) siteNameInput.value = prefs.site_name || 'OmniLearn';
      if (siteDescriptionInput) siteDescriptionInput.value = prefs.site_description || 'Advanced Learning Management System';
      if (maintenanceModeSelect) maintenanceModeSelect.value = String(prefs.maintenance_mode === true ? 'true' : 'false');
      if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = !!prefs.email_notifications;
      if (aiFeaturesCheckbox) aiFeaturesCheckbox.checked = !!prefs.ai_features;
    }
  } catch (error) {
    // Optionally show error
  }
}

// Save Site Preferences to Supabase
async function saveSitePreferences() {
  const siteName = document.getElementById('site-name').value;
  const siteDescription = document.getElementById('site-description').value;
  const maintenanceMode = document.getElementById('maintenance-mode').value === 'true';
  const emailNotifications = document.getElementById('email-notifications').checked;
  const aiFeatures = document.getElementById('ai-features').checked;

  // Show loading alert
  const loadingId = alertService.loading('Saving Preferences', 'Please wait while we save your site preferences...');

  try {
    await upsertSitePreferences({
      site_name: siteName,
      site_description: siteDescription,
      maintenance_mode: maintenanceMode,
      email_notifications: emailNotifications,
      ai_features: aiFeatures
    });
    alertService.updateLoading(loadingId, 'success', 'Preferences Saved!', 'Your site preferences have been updated successfully.');
  } catch (error) {
    alertService.updateLoading(loadingId, 'error', 'Save Failed', 'Error saving preferences: ' + error.message);
  }
}

// Reset Site Preferences to default values in Supabase
async function resetSitePreferences() {
  // Show confirmation dialog using modern alert
  const confirmId = alertService.show('warning', 'Reset Preferences', 
    'Are you sure you want to reset all site preferences to default values? This action cannot be undone.', 0);
  // Create confirmation buttons
  const alertElement = document.getElementById(confirmId);
  if (alertElement) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end;`;
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `background: #6c757d; color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-weight: 600;`;
    cancelBtn.onclick = () => alertService.close(confirmId);
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = `background: #f59e0b; color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-weight: 600;`;
    resetBtn.onclick = async () => {
      alertService.close(confirmId);
      // Show loading for reset operation
      const resetLoadingId = alertService.loading('Resetting Preferences', 'Please wait while we reset your preferences...');
      try {
        await upsertSitePreferences({
          site_name: 'OmniLearn',
          site_description: 'Advanced Learning Management System',
          maintenance_mode: false,
          email_notifications: true,
          ai_features: true
        });
        // Update form values
        await renderSitePreferences();
        alertService.updateLoading(resetLoadingId, 'success', 'Preferences Reset!', 'All site preferences have been reset to default values.');
      } catch (error) {
        alertService.updateLoading(resetLoadingId, 'error', 'Reset Failed', 'Error resetting preferences: ' + error.message);
      }
    };
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(resetBtn);
    const contentDiv = alertElement.querySelector('.alert-content');
    contentDiv.appendChild(buttonContainer);
  }
}

// --- HOOK UP PREFERENCES LOADING TO UI ---
// When Site Preferences section is loaded, fetch from Supabase
const observer = new MutationObserver(() => {
  if (document.getElementById('site-name')) {
    renderSitePreferences();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Performance Metrics Functions
async function loadPerformanceMetrics() {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active courses
    const { count: activeCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // Get total assignments
    const { count: totalAssignments } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });

    // Update the metrics display
    const totalUsersEl = document.getElementById('total-users');
    const activeCoursesEl = document.getElementById('active-courses');
    const totalAssignmentsEl = document.getElementById('total-assignments');
    const recentActivityEl = document.getElementById('recent-activity');

    if (totalUsersEl) totalUsersEl.textContent = totalUsers || 0;
    if (activeCoursesEl) activeCoursesEl.textContent = activeCourses || 0;
    if (totalAssignmentsEl) totalAssignmentsEl.textContent = totalAssignments || 0;

    // Load recent activity
    if (recentActivityEl) {
      const { data: recentNotices } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      recentActivityEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${recentNotices && recentNotices.length > 0 ? 
            recentNotices.map(notice => `
              <div style="padding: 12px; background: #fff; border-radius: 8px; border-left: 4px solid ${getPriorityColor(notice.priority)};">
                <div style="font-weight: 600; color: #4c6ddb;">${notice.title}</div>
                <div style="font-size: 0.9rem; color: #7ebe91;">By ${notice.sender_name} - ${new Date(notice.created_at).toLocaleDateString()}</div>
              </div>
            `).join('') :
            '<p style="color: #888;">No recent activity</p>'
          }
        </div>
      `;
    }

  } catch (error) {
    console.error('Error loading performance metrics:', error);
  }
}

function exportPerformanceReport() {
  // Create a simple CSV report
  const reportData = [
    ['Metric', 'Value'],
    ['Total Users', document.getElementById('total-users')?.textContent || '0'],
    ['Active Courses', document.getElementById('active-courses')?.textContent || '0'],
    ['Total Assignments', document.getElementById('total-assignments')?.textContent || '0'],
    ['System Status', 'Online'],
    ['Report Generated', new Date().toLocaleString()]
  ];

  const csvContent = reportData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omnilearn-performance-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// User Management Functions
function showCreateUserModal() {
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
    <div style="background: #fff; border-radius: 16px; padding: 32px; width: 90%; max-width: 400px;">
      <h2 style="color: #4c6ddb; margin-bottom: 24px;">👤 Create New User</h2>
      <form id="create-user-form">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Full Name</label>
          <input type="text" id="new-user-name" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Email</label>
          <input type="email" id="new-user-email" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Password</label>
          <input type="password" id="new-user-password" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Role</label>
          <select id="new-user-role" required style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
            <option value="learner">Learner</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" onclick="closeCreateUserModal()" style="background: #6c757d; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
          <button type="submit" style="background: #4c6ddb; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Create User</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  const form = document.getElementById('create-user-form');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    await createUser();
  });
}

async function createUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const password = document.getElementById('new-user-password').value;
  const role = document.getElementById('new-user-role').value;

  if (!name || !email || !password) {
    alertService.error('Validation Error', 'Please fill in all required fields.');
    return;
  }

  // Show loading alert
  const loadingId = alertService.loading('Creating User', 'Please wait while we create the new user account...');

  try {
    // Create user in Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authError) {
      alertService.updateLoading(loadingId, 'error', 'User Creation Failed', 'Error creating user: ' + authError.message);
      return;
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        full_name: name,
        email: email,
        role: role
      }]);

    if (profileError) {
      alertService.updateLoading(loadingId, 'error', 'Profile Creation Failed', 'Error creating user profile: ' + profileError.message);
      return;
    }

    alertService.updateLoading(loadingId, 'success', 'User Created!', `User "${name}" has been created successfully with role: ${role}`);
    closeCreateUserModal();
    loadUsersForManagement(); // Refresh the list
  } catch (error) {
    alertService.updateLoading(loadingId, 'error', 'Creation Failed', 'Error creating user: ' + error.message);
  }
}

window.closeCreateUserModal = function() {
  const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
  if (modal) {
    modal.remove();
  }
};

function showBulkActionsModal() {
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
    <div style="background: #fff; border-radius: 16px; padding: 32px; width: 90%; max-width: 400px;">
      <h2 style="color: #4c6ddb; margin-bottom: 24px;">📋 Bulk Actions</h2>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">Action</label>
        <select id="bulk-action" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
          <option value="delete">Delete Selected Users</option>
          <option value="change-role">Change Role</option>
          <option value="activate">Activate Users</option>
          <option value="deactivate">Deactivate Users</option>
        </select>
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #263a7a; font-weight: 600;">User IDs (comma-separated)</label>
        <textarea id="bulk-user-ids" rows="3" placeholder="Enter user IDs separated by commas" style="width: 100%; padding: 12px; border: 2px solid #e6eefd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; resize: vertical;"></textarea>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button onclick="closeBulkActionsModal()" style="background: #6c757d; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
        <button onclick="executeBulkAction()" style="background: #dc3545; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer;">Execute</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

window.closeBulkActionsModal = function() {
  const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
  if (modal) {
    modal.remove();
  }
};

window.executeBulkAction = async function() {
  const action = document.getElementById('bulk-action').value;
  const userIds = document.getElementById('bulk-user-ids').value.trim().split(',').map(id => id.trim()).filter(id => id);

  if (userIds.length === 0) {
    alert('Please enter at least one user ID.');
    return;
  }

  if (confirm(`Are you sure you want to ${action} ${userIds.length} users?`)) {
    try {
      switch (action) {
        case 'delete':
          // Delete users
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .in('id', userIds);
          
          if (deleteError) {
            alert('Error deleting users: ' + deleteError.message);
            return;
          }
          break;
        
        case 'change-role':
          const newRole = prompt('Enter new role (learner/trainer/admin):');
          if (newRole && ['learner', 'trainer', 'admin'].includes(newRole)) {
            const { error: roleError } = await supabase
              .from('profiles')
              .update({ role: newRole })
              .in('id', userIds);
            
            if (roleError) {
              alert('Error updating roles: ' + roleError.message);
              return;
            }
          } else {
            alert('Invalid role specified.');
            return;
          }
          break;
        
        default:
          alert('This action is not yet implemented.');
          return;
      }

      alert(`Bulk action completed successfully!`);
      closeBulkActionsModal();
      loadUsersForManagement(); // Refresh the list
    } catch (error) {
      alert('Error executing bulk action: ' + error.message);
    }
  }
};

function exportUsers() {
  // This would typically fetch all users and create a CSV
  alert('User export functionality coming soon!');
} 