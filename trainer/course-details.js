import { supabase } from '../supabase.js';

// Get course ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

// Load and display course details
async function loadCourseDetails() {
  const courseContent = document.getElementById('course-content');
  
  if (!courseId) {
    courseContent.innerHTML = '<p style="color: red;">No course ID provided.</p>';
    return;
  }

  try {
    // Fetch course from Supabase
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      courseContent.innerHTML = '<p style="color: red;">Error loading course: ' + error.message + '</p>';
      return;
    }

    if (!course) {
      courseContent.innerHTML = '<p style="color: red;">Course not found.</p>';
      return;
    }

    // Display course details
    courseContent.innerHTML = `
      <div class="course-header">
        <h1 class="course-title">${course.title}</h1>
        <p class="course-description">${course.description}</p>
        <div class="course-meta">
          <span>Created: ${new Date(course.created_at).toLocaleDateString()}</span>
          <span>Topics: ${course.outline ? course.outline.length : 0}</span>
        </div>
      </div>

      ${course.image_url ? `
        <div class="course-image-section">
          <img src="${course.image_url}" alt="Course Cover" class="course-image" />
        </div>
      ` : ''}

      ${course.outline && course.outline.length > 0 ? `
        <div class="outline-section">
          <h2>📚 Course Outline</h2>
          ${course.outline.map((topic, index) => `
            <div class="topic-item">
              <h3 class="topic-title">${index + 1}. ${topic.title}</h3>
              ${topic.content ? `<div class="topic-content">${topic.content}</div>` : ''}
              ${topic.subtopics && topic.subtopics.length > 0 ? `
                ${topic.subtopics.map((subtopic, subIndex) => `
                  <div class="subtopic-item">
                    <h4 class="subtopic-title">${index + 1}.${subIndex + 1} ${subtopic.title}</h4>
                    ${subtopic.content ? `<div class="subtopic-content">${subtopic.content}</div>` : ''}
                  </div>
                `).join('')}
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : '<p>No course outline available.</p>'}

      ${(course.doc_url || course.video_url) ? `
        <div class="files-section">
          <h2>📎 Course Materials</h2>
          ${course.doc_url ? `
            <div class="file-item">
              <span class="file-icon">📄</span>
              <a href="${course.doc_url}" target="_blank" class="file-link">Download Course Document</a>
            </div>
          ` : ''}
          ${course.video_url ? `
            <div class="file-item">
              <span class="file-icon">🎥</span>
              ${course.video_url.includes('youtube.com') || course.video_url.includes('youtu.be') ? `
                <a href="${course.video_url}" target="_blank" class="file-link">Watch Video</a>
                <div class="video-container">
                  <iframe src="${getEmbedUrl(course.video_url)}" frameborder="0" allowfullscreen></iframe>
                </div>
              ` : course.video_url.includes('vimeo.com') ? `
                <a href="${course.video_url}" target="_blank" class="file-link">Watch Video</a>
                <div class="video-container">
                  <iframe src="${getVimeoEmbedUrl(course.video_url)}" frameborder="0" allowfullscreen></iframe>
                </div>
              ` : `
                <a href="${course.video_url}" target="_blank" class="file-link">Download Video</a>
              `}
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

  } catch (error) {
    courseContent.innerHTML = '<p style="color: red;">Error loading course details: ' + error.message + '</p>';
  }
}

// Helper function to get YouTube embed URL
function getEmbedUrl(url) {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1];
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

// Helper function to get Vimeo embed URL
function getVimeoEmbedUrl(url) {
  const videoId = url.split('vimeo.com/')[1];
  return `https://player.vimeo.com/video/${videoId}`;
}

// Load course details when page loads
document.addEventListener('DOMContentLoaded', loadCourseDetails); 