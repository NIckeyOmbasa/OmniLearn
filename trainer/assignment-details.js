import { supabase } from '../supabase.js';

// Get assignment ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const assignmentId = urlParams.get('id');

// Load and display assignment details
async function loadAssignmentDetails() {
  const assignmentContent = document.getElementById('assignment-content');
  
  if (!assignmentId) {
    assignmentContent.innerHTML = '<p style="color: red;">No assignment ID provided.</p>';
    return;
  }

  try {
    // Fetch assignment from Supabase with course details
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses(title)
      `)
      .eq('id', assignmentId)
      .single();

    if (error) {
      assignmentContent.innerHTML = '<p style="color: red;">Error loading assignment: ' + error.message + '</p>';
      return;
    }

    if (!assignment) {
      assignmentContent.innerHTML = '<p style="color: red;">Assignment not found.</p>';
      return;
    }

    // Determine assignment status
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    let status = 'active';
    let statusClass = 'status-active';
    
    if (dueDate < now) {
      status = 'overdue';
      statusClass = 'status-overdue';
    }

    // Generate quiz questions HTML if it's a quiz
    let quizSection = '';
    if (assignment.type === 'quiz' && assignment.quiz_data && assignment.quiz_data.length > 0) {
      quizSection = `
        <div class="instructions-section">
          <h2>📝 Quiz Questions</h2>
          ${assignment.quiz_data.map((q, index) => `
            <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #7ebe91;">
              <h4 style="color: #4c6ddb; margin-bottom: 10px;">Question ${index + 1}</h4>
              <p style="color: #263a7a; margin-bottom: 15px; font-weight: 500;">${q.question}</p>
              <div style="margin-bottom: 15px;">
                ${Object.entries(q.options).map(([key, value]) => `
                  <div style="margin-bottom: 8px; padding: 8px; background: ${q.correct_answer === key ? '#d4edda' : '#fff'}; border-radius: 6px; border: 1px solid #e6eefd;">
                    <span style="font-weight: 600; color: #4c6ddb;">${key})</span> 
                    <span style="color: #263a7a;">${value}</span>
                    ${q.correct_answer === key ? '<span style="color: #155724; margin-left: 10px;">✓ Correct Answer</span>' : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Display assignment details
    assignmentContent.innerHTML = `
      <div class="assignment-header">
        <h1 class="assignment-title">${assignment.title}</h1>
        <p class="assignment-description">${assignment.description}</p>
        <div class="assignment-meta">
          <span class="meta-item">Course: ${assignment.courses?.title || 'Unknown'}</span>
          <span class="meta-item">Type: ${assignment.type}</span>
          <span class="meta-item">Points: ${assignment.points}</span>
          <span class="meta-item">Due: ${new Date(assignment.due_date).toLocaleDateString()}</span>
          <span class="meta-item">Created: ${new Date(assignment.created_at).toLocaleDateString()}</span>
          <span class="status-badge ${statusClass}">${status.toUpperCase()}</span>
        </div>
      </div>

      ${quizSection}

      ${assignment.instructions ? `
        <div class="instructions-section">
          <h2>📝 Assignment Instructions</h2>
          <div class="instructions-content">
            ${assignment.instructions}
          </div>
        </div>
      ` : ''}

      ${assignment.file_urls && assignment.file_urls.length > 0 ? `
        <div class="files-section">
          <h2>📎 Assignment Files</h2>
          ${assignment.file_urls.map((fileUrl, index) => {
            const fileName = fileUrl.split('/').pop().split('_').slice(1).join('_');
            return `
              <div class="file-item">
                <span class="file-icon">📄</span>
                <a href="${fileUrl}" target="_blank" class="file-link">${fileName}</a>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;

  } catch (error) {
    assignmentContent.innerHTML = '<p style="color: red;">Error loading assignment details: ' + error.message + '</p>';
  }
}

// Load assignment details when page loads
document.addEventListener('DOMContentLoaded', loadAssignmentDetails); 