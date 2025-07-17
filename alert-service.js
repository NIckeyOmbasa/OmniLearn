// Modern Alert Service for OmniLearn
class AlertService {
  constructor() {
    this.container = null;
    this.alerts = new Map();
    this.alertCounter = 0;
    this.init();
  }

  init() {
    // Create alert container if it doesn't exist
    if (!document.querySelector('.alert-container')) {
      this.container = document.createElement('div');
      this.container.className = 'alert-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.alert-container');
    }
  }

  // Show alert with timeout
  show(type, title, message, timeout = 5000) {
    const id = `alert-${++this.alertCounter}`;
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.id = id;
    
    // Get icon based on type
    const icon = this.getIcon(type);
    
    alert.innerHTML = `
      <div class="alert-icon">${icon}</div>
      <div class="alert-content">
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
      </div>
      <button class="alert-close" onclick="alertService.close('${id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      ${timeout > 0 ? '<div class="alert-progress"><div class="alert-progress-bar"></div></div>' : ''}
    `;
    
    // Add to container
    this.container.appendChild(alert);
    this.alerts.set(id, { element: alert, timeout: null, progress: null });
    
    // Trigger animation
    requestAnimationFrame(() => {
      alert.classList.add('show');
    });
    
    // Start progress bar if timeout is set
    if (timeout > 0) {
      const progressBar = alert.querySelector('.alert-progress-bar');
      if (progressBar) {
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${timeout}ms linear`;
        requestAnimationFrame(() => {
          progressBar.style.width = '0%';
        });
      }
      
      // Set timeout to close
      const timeoutId = setTimeout(() => {
        this.close(id);
      }, timeout);
      
      this.alerts.get(id).timeout = timeoutId;
    }
    
    return id;
  }

  // Close specific alert
  close(id) {
    const alertData = this.alerts.get(id);
    if (!alertData) return;
    
    const { element, timeout, progress } = alertData;
    
    // Clear timeout if exists
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Animate out
    element.classList.add('hide');
    
    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.alerts.delete(id);
    }, 300);
  }

  // Close all alerts
  closeAll() {
    this.alerts.forEach((alertData, id) => {
      this.close(id);
    });
  }

  // Get icon for alert type
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  // Convenience methods
  success(title, message, timeout = 5000) {
    return this.show('success', title, message, timeout);
  }

  error(title, message, timeout = 7000) {
    return this.show('error', title, message, timeout);
  }

  warning(title, message, timeout = 6000) {
    return this.show('warning', title, message, timeout);
  }

  info(title, message, timeout = 5000) {
    return this.show('info', title, message, timeout);
  }

  // Show loading alert (no timeout)
  loading(title, message) {
    return this.show('info', title, message, 0);
  }

  // Update loading alert to success/error
  updateLoading(id, type, title, message, timeout = 3000) {
    const alertData = this.alerts.get(id);
    if (!alertData) return;
    
    const { element } = alertData;
    
    // Update content
    const icon = element.querySelector('.alert-icon');
    const titleEl = element.querySelector('.alert-title');
    const messageEl = element.querySelector('.alert-message');
    const progress = element.querySelector('.alert-progress');
    
    // Update classes
    element.className = `alert alert-${type}`;
    
    // Update content
    icon.textContent = this.getIcon(type);
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Add progress bar if timeout is set
    if (timeout > 0 && !progress) {
      const progressDiv = document.createElement('div');
      progressDiv.className = 'alert-progress';
      progressDiv.innerHTML = '<div class="alert-progress-bar"></div>';
      element.appendChild(progressDiv);
      
      const progressBar = progressDiv.querySelector('.alert-progress-bar');
      progressBar.style.width = '100%';
      progressBar.style.transition = `width ${timeout}ms linear`;
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });
      
      // Set timeout to close
      const timeoutId = setTimeout(() => {
        this.close(id);
      }, timeout);
      
      this.alerts.get(id).timeout = timeoutId;
    }
  }
}

// Create global alert service instance
const alertService = new AlertService();

// Export for use in other modules
export { alertService }; 