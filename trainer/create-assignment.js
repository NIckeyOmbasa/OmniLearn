import { supabase } from '../supabase.js';
import { aiService } from '../ai-service.js';
import { alertService } from '../alert-service.js';
import { userManagement } from '../user-management.js';

// Quiz builder variables
let questions = [];
let questionCounter = 0;

// Load courses for the dropdown
async function loadCourses() {
  const courseSelect = document.getElementById('assignment-course');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      courseSelect.innerHTML = '<option value="">You must be signed in</option>';
      return;
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title')
      .eq('created_by', user.id)
      .order('title');

    if (error) {
      courseSelect.innerHTML = '<option value="">Error loading courses</option>';
      return;
    }

    if (!courses || courses.length === 0) {
      courseSelect.innerHTML = '<option value="">No courses available. Create a course first.</option>';
      return;
    }

    courseSelect.innerHTML = '<option value="">Select a course...</option>' +
      courses.map(course => `<option value="${course.id}">${course.title}</option>`).join('');

  } catch (error) {
    courseSelect.innerHTML = '<option value="">Error loading courses</option>';
  }
}

// Quiz builder functionality
function showQuizBuilder() {
  const quizBuilder = document.getElementById('quiz-builder');
  quizBuilder.style.display = 'block';
  if (questions.length === 0) {
    addQuestion(); // Add first question automatically
  }
}

function hideQuizBuilder() {
  const quizBuilder = document.getElementById('quiz-builder');
  quizBuilder.style.display = 'none';
  questions = [];
  questionCounter = 0;
  document.getElementById('questions-container').innerHTML = '';
}

function addQuestion() {
  questionCounter++;
  const questionId = `question-${questionCounter}`;
  
  const questionHTML = `
    <div class="question-block" id="${questionId}">
      <div class="question-header">
        <span class="question-number">Question ${questionCounter}</span>
        <button type="button" class="remove-btn" onclick="removeQuestion('${questionId}')">Remove Question</button>
      </div>
      <input type="text" class="question-input" placeholder="Enter your question here..." data-question-id="${questionId}">
      <div class="options-container">
        <div class="option-item">
          <span>A)</span>
          <input type="text" class="option-input" placeholder="Option A" data-question-id="${questionId}" data-option="A">
        </div>
        <div class="option-item">
          <span>B)</span>
          <input type="text" class="option-input" placeholder="Option B" data-question-id="${questionId}" data-option="B">
        </div>
        <div class="option-item">
          <span>C)</span>
          <input type="text" class="option-input" placeholder="Option C" data-question-id="${questionId}" data-option="C">
        </div>
        <div class="option-item">
          <span>D)</span>
          <input type="text" class="option-input" placeholder="Option D" data-question-id="${questionId}" data-option="D">
        </div>
      </div>
      <div class="correct-answer">
        <span>Correct Answer:</span>
        <select data-question-id="${questionId}">
          <option value="">Select correct answer</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
    </div>
  `;
  
  document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHTML);
}

// Global function for removing questions
window.removeQuestion = function(questionId) {
  const questionElement = document.getElementById(questionId);
  if (questionElement) {
    questionElement.remove();
    // Reorder question numbers
    const questions = document.querySelectorAll('.question-block');
    questions.forEach((q, index) => {
      const numberSpan = q.querySelector('.question-number');
      if (numberSpan) {
        numberSpan.textContent = `Question ${index + 1}`;
      }
    });
  }
};

// Handle assignment type change
document.querySelectorAll('input[name="type"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.value === 'quiz') {
      showQuizBuilder();
    } else {
      hideQuizBuilder();
    }
  });
});

// Add question button
document.getElementById('add-question-btn').addEventListener('click', addQuestion);

// Rich text editor functionality
const instructionsDiv = document.getElementById('assignment-instructions');
const toolbar = document.querySelector('.editor-toolbar');

toolbar.addEventListener('click', e => {
  if (e.target.dataset.cmd) {
    document.execCommand(e.target.dataset.cmd, false, null);
    instructionsDiv.focus();
  }
});

// File preview
function previewFiles(input) {
  const preview = document.getElementById('files-preview');
  if (input.files && input.files.length > 0) {
    const fileNames = Array.from(input.files).map(file => file.name).join(', ');
    preview.textContent = `Selected: ${fileNames}`;
  } else {
    preview.textContent = '';
  }
}

document.getElementById('assignment-files').addEventListener('change', function() {
  previewFiles(this);
});

// Set default due date to tomorrow
document.getElementById('assignment-due-date').value = 
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

// Collect quiz data
function collectQuizData() {
  const questions = [];
  const questionBlocks = document.querySelectorAll('.question-block');
  
  questionBlocks.forEach((block, index) => {
    const questionId = block.id;
    const questionText = block.querySelector('.question-input').value;
    const correctAnswer = block.querySelector('select').value;
    
    const options = {};
    ['A', 'B', 'C', 'D'].forEach(option => {
      const optionInput = block.querySelector(`[data-option="${option}"]`);
      if (optionInput) {
        options[option] = optionInput.value;
      }
    });
    
    if (questionText && correctAnswer) {
      questions.push({
        question: questionText,
        options: options,
        correct_answer: correctAnswer
      });
    }
  });
  
  return questions;
}

// Assignment creation
document.getElementById('create-assignment-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const msg = document.getElementById('assignment-message');
  msg.style.color = 'red';
  msg.textContent = '';

  const title = document.getElementById('assignment-title').value.trim();
  const courseId = document.getElementById('assignment-course').value;
  const description = document.getElementById('assignment-description').value.trim();
  const type = document.querySelector('input[name="type"]:checked')?.value;
  const dueDate = document.getElementById('assignment-due-date').value;
  const points = document.getElementById('assignment-points').value;
  const instructions = instructionsDiv.innerHTML;
  const files = document.getElementById('assignment-files').files;

  // Validation
  if (!courseId) {
    msg.textContent = 'Please select a course.';
    return;
  }
  if (!type) {
    msg.textContent = 'Please select an assignment type.';
    return;
  }

  // Quiz validation
  let quizData = null;
  if (type === 'quiz') {
    quizData = collectQuizData();
    if (quizData.length === 0) {
      msg.textContent = 'Please add at least one quiz question.';
      return;
    }
    // Validate each question
    for (let i = 0; i < quizData.length; i++) {
      const q = quizData[i];
      if (!q.question.trim()) {
        msg.textContent = `Question ${i + 1} is empty.`;
        return;
      }
      if (!q.correct_answer) {
        msg.textContent = `Please select correct answer for question ${i + 1}.`;
        return;
      }
      // Check if all options are filled
      const emptyOptions = Object.values(q.options).filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        msg.textContent = `Please fill all options for question ${i + 1}.`;
        return;
      }
    }
  }

  // Upload files to Supabase Storage
  let fileUrls = [];
  try {
    if (files && files.length > 0) {
      for (let file of files) {
        const { data, error } = await supabase.storage
          .from('assignment-files')
          .upload(`${Date.now()}_${file.name}`, file, { upsert: true });
        
        if (error) throw error;
        
        const { data: publicUrl } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(data.path);
        
        fileUrls.push(publicUrl.publicUrl);
      }
    }
  } catch (err) {
    msg.textContent = 'File upload failed: ' + (err.message || err.error_description);
    return;
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    msg.textContent = 'You must be signed in to create an assignment.';
    return;
  }

  // Insert assignment into Supabase
  const { error: assignmentError } = await supabase.from('assignments').insert([{
    title,
    description,
    course_id: courseId,
    type,
    due_date: dueDate,
    points: parseInt(points),
    instructions,
    file_urls: fileUrls,
    quiz_data: quizData, // Add quiz data for quiz assignments
    created_by: user.id,
    created_at: new Date().toISOString()
  }]);

  if (assignmentError) {
    msg.textContent = assignmentError.message;
    return;
  }

  msg.style.color = 'green';
  msg.textContent = 'Assignment created successfully! Redirecting...';
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
});

// Load courses when page loads
document.addEventListener('DOMContentLoaded', loadCourses);

// AI Chatbox functionality
document.addEventListener('DOMContentLoaded', function() {
  const floatingAiIcon = document.getElementById('floating-ai-icon');
  const aiChatbox = document.getElementById('ai-chatbox');
  const closeAiChatbox = document.getElementById('close-ai-chatbox');
  
  if (floatingAiIcon && aiChatbox && closeAiChatbox) {
    // Open chatbox when floating icon is clicked
    floatingAiIcon.addEventListener('click', function() {
      aiChatbox.style.display = 'flex';
      floatingAiIcon.style.display = 'none'; // Hide icon when chatbox is open
    });
    
    // Close chatbox when X button is clicked
    closeAiChatbox.addEventListener('click', function() {
      aiChatbox.style.display = 'none';
      floatingAiIcon.style.display = 'flex'; // Show icon when chatbox is closed
    });
    
    // Handle form submission (placeholder for AI integration)
    const aiForm = document.getElementById('ai-chatbox-form');
    const aiInput = document.getElementById('ai-chatbox-input');
    const aiMessages = document.getElementById('ai-chatbox-messages');
    
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
          
          // Clear input
          aiInput.value = '';
          
          // Scroll to bottom
          aiMessages.scrollTop = aiMessages.scrollHeight;
          
          // Get AI response
          try {
            // Get current user ID or use a default
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user ? user.id : 'anonymous';
            
            // Get AI response
            const aiResponse = await aiService.sendMessage(message, userId, 'assignment-creation');
            
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
          }
        }
      });
    }
  }
}); 