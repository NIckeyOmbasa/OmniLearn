import { supabase } from '../supabase.js';
import { aiService } from '../ai-service.js';
import { alertService } from '../alert-service.js';
import { userManagement } from '../user-management.js';

// --- Dynamic Outline Builder with Content and Formatting ---
const outlineList = document.getElementById('outline-list');
const addTopicBtn = document.getElementById('add-topic-btn');
const topicTemplate = document.getElementById('topic-template');
const subtopicTemplate = document.getElementById('subtopic-template');
let outline = [];

function renderOutline() {
  outlineList.innerHTML = '';
  outline.forEach((topic, tIdx) => {
    const topicNode = topicTemplate.content.cloneNode(true);
    const topicBlock = topicNode.querySelector('.topic-block');
    const titleInput = topicBlock.querySelector('.topic-title');
    const contentDiv = topicBlock.querySelector('.topic-content');
    titleInput.value = topic.title;
    contentDiv.innerHTML = topic.content || '';
    // Toolbar events
    const toolbar = topicBlock.querySelector('.editor-toolbar');
    toolbar.addEventListener('click', e => {
      if (e.target.dataset.cmd) {
        document.execCommand(e.target.dataset.cmd, false, null);
        contentDiv.focus();
      }
    });
    // Content sync
    contentDiv.addEventListener('input', () => {
      outline[tIdx].content = contentDiv.innerHTML;
    });
    titleInput.addEventListener('input', () => {
      outline[tIdx].title = titleInput.value;
    });
    // Remove topic
    topicBlock.querySelector('.remove-btn').addEventListener('click', () => {
      outline.splice(tIdx, 1);
      renderOutline();
    });
    // Subtopics
    const subtopicList = topicBlock.querySelector('.subtopic-list');
    topic.subtopics.forEach((sub, sIdx) => {
      const subNode = subtopicTemplate.content.cloneNode(true);
      const subBlock = subNode.querySelector('.subtopic-block');
      const subTitleInput = subBlock.querySelector('.subtopic-title');
      const subContentDiv = subBlock.querySelector('.subtopic-content');
      subTitleInput.value = sub.title;
      subContentDiv.innerHTML = sub.content || '';
      // Toolbar events
      const subToolbar = subBlock.querySelector('.editor-toolbar');
      subToolbar.addEventListener('click', e => {
        if (e.target.dataset.cmd) {
          document.execCommand(e.target.dataset.cmd, false, null);
          subContentDiv.focus();
        }
      });
      // Content sync
      subContentDiv.addEventListener('input', () => {
        outline[tIdx].subtopics[sIdx].content = subContentDiv.innerHTML;
      });
      subTitleInput.addEventListener('input', () => {
        outline[tIdx].subtopics[sIdx].title = subTitleInput.value;
      });
      // Remove subtopic
      subBlock.querySelector('.remove-btn').addEventListener('click', () => {
        outline[tIdx].subtopics.splice(sIdx, 1);
        renderOutline();
      });
      subtopicList.appendChild(subBlock);
    });
    // Add subtopic
    topicBlock.querySelector('.add-btn').addEventListener('click', () => {
      outline[tIdx].subtopics.push({ title: '', content: '' });
      renderOutline();
    });
    outlineList.appendChild(topicBlock);
  });
}

addTopicBtn.addEventListener('click', () => {
  outline.push({ title: '', content: '', subtopics: [] });
  renderOutline();
});

// --- File Previews ---
function previewFile(input, previewId) {
  const preview = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    preview.textContent = input.files[0].name;
  } else {
    preview.textContent = '';
  }
}
document.getElementById('course-image').addEventListener('change', function() {
  previewFile(this, 'image-preview');
});
document.getElementById('course-doc').addEventListener('change', function() {
  previewFile(this, 'doc-preview');
});
document.getElementById('video-upload').addEventListener('change', function() {
  previewFile(this, 'video-preview');
});

// --- Course Creation Logic ---
document.getElementById('create-course-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const title = document.getElementById('course-title').value.trim();
  const description = document.getElementById('course-description').value.trim();
  const videoLink = document.getElementById('course-video').value.trim();
  const imageFile = document.getElementById('course-image').files[0];
  const docFile = document.getElementById('course-doc').files[0];
  const videoFile = document.getElementById('video-upload').files[0];

  // Validate outline
  if (!outline.length || outline.some(t => !t.title)) {
    alertService.error('Validation Error', 'Please add at least one topic with a title.');
    return;
  }

  // Show loading alert
  const loadingId = alertService.loading('Creating Course', 'Please wait while we create your course...');

  // Upload files to Supabase Storage
  let imageUrl = '', docUrl = '', videoUrl = '';
  try {
    if (imageFile) {
      const { data, error } = await supabase.storage.from('course-assets').upload(`images/${Date.now()}_${imageFile.name}`, imageFile, { upsert: true });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('course-assets').getPublicUrl(data.path);
      imageUrl = publicUrl.publicUrl;
    }
    if (docFile) {
      const { data, error } = await supabase.storage.from('course-assets').upload(`docs/${Date.now()}_${docFile.name}`, docFile, { upsert: true });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('course-assets').getPublicUrl(data.path);
      docUrl = publicUrl.publicUrl;
    }
    if (videoFile) {
      const { data, error } = await supabase.storage.from('course-assets').upload(`videos/${Date.now()}_${videoFile.name}`, videoFile, { upsert: true });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('course-assets').getPublicUrl(data.path);
      videoUrl = publicUrl.publicUrl;
    }
  } catch (err) {
    alertService.updateLoading(loadingId, 'error', 'Upload Failed', 'File upload failed: ' + (err.message || err.error_description));
    return;
  }

  // Get current user (trainer)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alertService.updateLoading(loadingId, 'error', 'Authentication Error', 'You must be signed in to create a course.');
    return;
  }

  // Insert course into Supabase
  const { error: courseError } = await supabase.from('courses').insert([{
    title,
    description,
    outline: outline.map(t => ({
      title: t.title,
      content: t.content,
      subtopics: t.subtopics.map(s => ({ title: s.title, content: s.content }))
    })),
    image_url: imageUrl,
    doc_url: docUrl,
    video_url: videoUrl || videoLink,
    created_by: user.id,
    created_at: new Date().toISOString()
  }]);
  if (courseError) {
    alertService.updateLoading(loadingId, 'error', 'Database Error', courseError.message);
    return;
  }
  
  alertService.updateLoading(loadingId, 'success', 'Course Created!', 'Your course has been created successfully. Redirecting...');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
});

// Initial render
renderOutline();

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
            const aiResponse = await aiService.sendMessage(message, userId, 'course-creation');
            
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