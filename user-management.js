// User Management Module for OmniLearn
import { supabase } from './supabase.js';
import { alertService } from './alert-service.js';

class UserManagement {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.init();
  }

  async init() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.currentUser = user;
      await this.loadUserProfile();
      this.setupUserMenu();
    }
  }

  async loadUserProfile() {
    if (!this.currentUser) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      this.userProfile = profile;
      this.updateUserDisplay();
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  updateUserDisplay() {
    // Update user name display
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && this.userProfile) {
      userNameElement.textContent = this.userProfile.full_name || 'User';
    }
  }

  setupUserMenu() {
    const userIcon = document.getElementById('user-icon');
    const submenu = document.getElementById('profile-submenu');
    if (userIcon && submenu) {
      // Remove previous listeners to avoid duplicates
      userIcon.onclick = null;
      userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        submenu.classList.toggle('active');
      });
      document.addEventListener('click', function(e) {
        if (!submenu.contains(e.target) && !userIcon.contains(e.target)) {
          submenu.classList.remove('active');
        }
      });
      // Setup menu items
      this.setupEditProfile();
      this.setupPreferences();
      this.setupLogout();
    }
  }

  setupEditProfile() {
    const editProfileLink = document.getElementById('edit-profile');
    if (editProfileLink) {
      editProfileLink.onclick = (e) => {
        e.preventDefault();
        this.showEditProfileModal();
      };
    }
  }
  setupPreferences() {
    const preferencesLink = document.getElementById('preferences');
    if (preferencesLink) {
      preferencesLink.onclick = (e) => {
        e.preventDefault();
        this.showPreferencesModal();
      };
    }
  }
  setupLogout() {
    const logoutLink = document.getElementById('logout');
    if (logoutLink) {
      logoutLink.onclick = (e) => {
        e.preventDefault();
        this.showLogoutConfirmation();
      };
    }
  }

  // Render Edit Profile form in dashboard main area
  renderEditProfileInDashboard() {
    const main = document.querySelector('.dashboard-main');
    if (!main) return;
    // Save current content for restoration
    if (!this._originalDashboardContent) {
      this._originalDashboardContent = main.innerHTML;
    }
    main.innerHTML = `
      <div class="user-dashboard-section">
        <h1>Edit Profile</h1>
        <form id="edit-profile-form" class="user-dashboard-form">
          <div class="form-group">
            <label for="profile-full-name">Full Name</label>
            <input type="text" id="profile-full-name" value="${this.userProfile?.full_name || ''}" required>
          </div>
          <div class="form-group">
            <label for="profile-email">Email</label>
            <input type="email" id="profile-email" value="${this.currentUser?.email || ''}" readonly>
            <small>Email cannot be changed</small>
          </div>
          <div class="form-group">
            <label for="profile-bio">Bio</label>
            <textarea id="profile-bio" rows="3" placeholder="Tell us about yourself...">${this.userProfile?.bio || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="profile-phone">Phone Number</label>
            <input type="tel" id="profile-phone" value="${this.userProfile?.phone || ''}" placeholder="+1234567890">
          </div>
          <div class="form-group">
            <label for="profile-location">Location</label>
            <input type="text" id="profile-location" value="${this.userProfile?.location || ''}" placeholder="City, Country">
          </div>
          <div class="form-actions">
            <button type="button" id="back-to-dashboard" class="btn-secondary">Back to Dashboard</button>
            <button type="submit" class="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('back-to-dashboard').onclick = () => this.restoreDashboardContent();
    document.getElementById('edit-profile-form').onsubmit = async (e) => {
      e.preventDefault();
      await this.updateProfile();
    };
  }

  // Render Preferences form in dashboard main area
  renderPreferencesInDashboard() {
    const main = document.querySelector('.dashboard-main');
    if (!main) return;
    if (!this._originalDashboardContent) {
      this._originalDashboardContent = main.innerHTML;
    }
    main.innerHTML = `
      <div class="user-dashboard-section">
        <h1>User Preferences</h1>
        <form id="preferences-form" class="user-dashboard-form">
          <div class="preferences-section">
            <h3>Notifications</h3>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="email-notifications" ${this.userProfile?.email_notifications ? 'checked' : ''}>
                Email Notifications
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="push-notifications" ${this.userProfile?.push_notifications ? 'checked' : ''}>
                Push Notifications
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="assignment-reminders" ${this.userProfile?.assignment_reminders ? 'checked' : ''}>
                Assignment Reminders
              </label>
            </div>
          </div>
          <div class="preferences-section">
            <h3>Display</h3>
            <div class="form-group">
              <label for="theme-preference">Theme</label>
              <select id="theme-preference">
                <option value="light" ${this.userProfile?.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${this.userProfile?.theme === 'dark' ? 'selected' : ''}>Dark</option>
                <option value="auto" ${this.userProfile?.theme === 'auto' ? 'selected' : ''}>Auto</option>
              </select>
            </div>
            <div class="form-group">
              <label for="language-preference">Language</label>
              <select id="language-preference">
                <option value="en" ${this.userProfile?.language === 'en' ? 'selected' : ''}>English</option>
                <option value="es" ${this.userProfile?.language === 'es' ? 'selected' : ''}>Spanish</option>
                <option value="fr" ${this.userProfile?.language === 'fr' ? 'selected' : ''}>French</option>
              </select>
            </div>
          </div>
          <div class="preferences-section">
            <h3>Privacy</h3>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="profile-visible" ${this.userProfile?.profile_visible ? 'checked' : ''}>
                Make profile visible to other users
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="show-progress" ${this.userProfile?.show_progress ? 'checked' : ''}>
                Show progress to instructors
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" id="back-to-dashboard" class="btn-secondary">Back to Dashboard</button>
            <button type="submit" class="btn-primary">Save Preferences</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('back-to-dashboard').onclick = () => this.restoreDashboardContent();
    document.getElementById('preferences-form').onsubmit = async (e) => {
      e.preventDefault();
      await this.updatePreferences();
    };
  }

  // Call this whenever dashboard content changes to keep the latest as the original
  setCurrentDashboardContent() {
    const main = document.querySelector('.dashboard-main');
    if (main) {
      this._originalDashboardContent = main.innerHTML;
    }
  }

  restoreDashboardContent() {
    const main = document.querySelector('.dashboard-main');
    if (main && this._originalDashboardContent) {
      main.innerHTML = this._originalDashboardContent;
      // After restoring, update the reference again
      this.setCurrentDashboardContent();
      this._originalDashboardContent = null;
    }
  }

  showEditProfileModal() {
    console.log('Opening Edit Profile modal');
    const modal = this.createModal('Edit Profile', `
      <form id="edit-profile-form">
        <div class="form-group">
          <label for="profile-full-name">Full Name</label>
          <input type="text" id="profile-full-name" value="${this.userProfile?.full_name || ''}" required>
        </div>
        <div class="form-group">
          <label for="profile-email">Email</label>
          <input type="email" id="profile-email" value="${this.currentUser?.email || ''}" readonly>
          <small>Email cannot be changed</small>
        </div>
        <div class="form-group">
          <label for="profile-bio">Bio</label>
          <textarea id="profile-bio" rows="3" placeholder="Tell us about yourself...">${this.userProfile?.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="profile-phone">Phone Number</label>
          <input type="tel" id="profile-phone" value="${this.userProfile?.phone || ''}" placeholder="+1234567890">
        </div>
        <div class="form-group">
          <label for="profile-location">Location</label>
          <input type="text" id="profile-location" value="${this.userProfile?.location || ''}" placeholder="City, Country">
        </div>
        <div class="form-actions">
          <button type="button" onclick="userManagement.closeModal()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    `);

    // Handle form submission
    const form = document.getElementById('edit-profile-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updateProfile();
    });
  }

  showPreferencesModal() {
    console.log('Opening Preferences modal');
    const modal = this.createModal('User Preferences', `
      <form id="preferences-form">
        <div class="preferences-section">
          <h3>Notifications</h3>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="email-notifications" ${this.userProfile?.email_notifications ? 'checked' : ''}>
              Email Notifications
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="push-notifications" ${this.userProfile?.push_notifications ? 'checked' : ''}>
              Push Notifications
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="assignment-reminders" ${this.userProfile?.assignment_reminders ? 'checked' : ''}>
              Assignment Reminders
            </label>
          </div>
        </div>
        
        <div class="preferences-section">
          <h3>Display</h3>
          <div class="form-group">
            <label for="theme-preference">Theme</label>
            <select id="theme-preference">
              <option value="light" ${this.userProfile?.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${this.userProfile?.theme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="auto" ${this.userProfile?.theme === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
          </div>
          <div class="form-group">
            <label for="language-preference">Language</label>
            <select id="language-preference">
              <option value="en" ${this.userProfile?.language === 'en' ? 'selected' : ''}>English</option>
              <option value="es" ${this.userProfile?.language === 'es' ? 'selected' : ''}>Spanish</option>
              <option value="fr" ${this.userProfile?.language === 'fr' ? 'selected' : ''}>French</option>
            </select>
          </div>
        </div>

        <div class="preferences-section">
          <h3>Privacy</h3>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="profile-visible" ${this.userProfile?.profile_visible ? 'checked' : ''}>
              Make profile visible to other users
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="show-progress" ${this.userProfile?.show_progress ? 'checked' : ''}>
              Show progress to instructors
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" onclick="userManagement.closeModal()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Save Preferences</button>
        </div>
      </form>
    `);

    // Handle form submission
    const form = document.getElementById('preferences-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updatePreferences();
    });
  }

  showLogoutConfirmation() {
    const confirmId = alertService.show('warning', 'Logout', 
      'Are you sure you want to logout? Any unsaved changes will be lost.', 0);
    
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
      
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.style.cssText = `
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
      `;
      logoutBtn.onclick = async () => {
        alertService.close(confirmId);
        await this.logout();
      };
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(logoutBtn);
      
      const contentDiv = alertElement.querySelector('.alert-content');
      contentDiv.appendChild(buttonContainer);
    }
  }

  async updateProfile() {
    const fullName = document.getElementById('profile-full-name').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const location = document.getElementById('profile-location').value.trim();

    if (!fullName) {
      alertService.error('Validation Error', 'Full name is required.');
      return;
    }

    const loadingId = alertService.loading('Updating Profile', 'Please wait while we save your changes...');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          phone: phone,
          location: location,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id);

      if (error) {
        alertService.updateLoading(loadingId, 'error', 'Update Failed', 'Error updating profile: ' + error.message);
        return;
      }

      // Update local profile
      this.userProfile = { ...this.userProfile, full_name: fullName, bio, phone, location };
      this.updateUserDisplay();

      alertService.updateLoading(loadingId, 'success', 'Profile Updated!', 'Your profile has been updated successfully.');
      this.closeModal();
    } catch (error) {
      alertService.updateLoading(loadingId, 'error', 'Update Failed', 'Error updating profile: ' + error.message);
    }
  }

  async updatePreferences() {
    const emailNotifications = document.getElementById('email-notifications').checked;
    const pushNotifications = document.getElementById('push-notifications').checked;
    const assignmentReminders = document.getElementById('assignment-reminders').checked;
    const theme = document.getElementById('theme-preference').value;
    const language = document.getElementById('language-preference').value;
    const profileVisible = document.getElementById('profile-visible').checked;
    const showProgress = document.getElementById('show-progress').checked;

    const loadingId = alertService.loading('Saving Preferences', 'Please wait while we save your preferences...');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          assignment_reminders: assignmentReminders,
          theme: theme,
          language: language,
          profile_visible: profileVisible,
          show_progress: showProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id);

      if (error) {
        alertService.updateLoading(loadingId, 'error', 'Save Failed', 'Error saving preferences: ' + error.message);
        return;
      }

      // Update local profile
      this.userProfile = {
        ...this.userProfile,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        assignment_reminders: assignmentReminders,
        theme: theme,
        language: language,
        profile_visible: profileVisible,
        show_progress: showProgress
      };

      alertService.updateLoading(loadingId, 'success', 'Preferences Saved!', 'Your preferences have been updated successfully.');
      this.closeModal();
    } catch (error) {
      alertService.updateLoading(loadingId, 'error', 'Save Failed', 'Error saving preferences: ' + error.message);
    }
  }

  async logout() {
    const loadingId = alertService.loading('Logging Out', 'Please wait...');

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        alertService.updateLoading(loadingId, 'error', 'Logout Failed', 'Error logging out: ' + error.message);
        return;
      }

      alertService.updateLoading(loadingId, 'success', 'Logged Out', 'You have been logged out successfully.');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1500);
    } catch (error) {
      alertService.updateLoading(loadingId, 'error', 'Logout Failed', 'Error logging out: ' + error.message);
    }
  }

  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'user-modal';
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
      <div class="modal-content" style="
        background: #fff;
        border-radius: 16px;
        padding: 32px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      ">
        <div class="modal-header" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e6eefd;
        ">
          <h2 style="color: #4c6ddb; margin: 0; font-size: 1.5rem;">${title}</h2>
          <button onclick="userManagement.closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  closeModal() {
    const modal = document.querySelector('.user-modal');
    if (modal) {
      modal.remove();
    }
  }
}

// Create global instance
const userManagement = new UserManagement();

// Export for use in other modules
export { userManagement }; 

// Ensure userManagement is globally available
window.userManagement = userManagement;

// Fallback: Always enable dropdown if user-management.js fails or is not initialized early enough
(function() {
  const userIcon = document.getElementById('user-icon');
  const submenu = document.getElementById('profile-submenu');
  if (userIcon && submenu) {
    userIcon.onclick = function(e) {
      e.stopPropagation();
      submenu.classList.toggle('active');
    };
    document.addEventListener('click', function(e) {
      if (!submenu.contains(e.target) && !userIcon.contains(e.target)) {
        submenu.classList.remove('active');
      }
    });
  }
})(); 