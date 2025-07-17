import { supabase } from '../supabase.js';
import { userManagement } from '../user-management.js';

// Get course ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');

// Helper: Get YouTube embed URL from search
async function getRecommendedYouTubeEmbed(query) {
  // Use YouTube Data API or fallback to search URL (for demo, use search URL)
  // In production, use a backend proxy to call YouTube Data API securely
  // For now, return a YouTube search embed
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
}

// Helper: Render progress bar
function renderProgressBar(progress) {
  return `<div class="course-progress-bar-bg">
    <div class="course-progress-bar-fill" style="width: ${progress || 0}%"></div>
  </div>
  <span style="color:#4c6ddb;font-weight:600;">${progress || 0}% complete</span>`;
}

// Helper: Calculate and update progress
async function updateLearnerProgress(courseId, totalItems, viewedItems) {
  const progress = Math.round((viewedItems / totalItems) * 100);
  // Update progress bar in UI
  const progressBar = document.querySelector('.course-progress-bar-fill');
  const progressLabel = progressBar?.parentElement?.nextElementSibling;
  if (progressBar) progressBar.style.width = progress + '%';
  if (progressLabel) progressLabel.textContent = progress + '% complete';
  // Update in Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Upsert progress
    await supabase.from('progress').upsert([
      { learner_id: user.id, course_id: courseId, progress }
    ], { onConflict: ['learner_id', 'course_id'] });
  }
}

// Load and display course details
async function loadCourseDetails() {
  const courseContent = document.getElementById('course-content');
  // Show loader
  courseContent.innerHTML = `<div class="dashboard-loading" id="course-details-loader">
    <div class="spinner"></div>
    <div class="loader-text">Loading course details...</div>
  </div>`;
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
    if (error || !course) {
      courseContent.innerHTML = '<p style="color: red;">Error loading course or course not found.</p>';
      return;
    }

    // Fetch instructor name
    let instructorName = course.instructor || '';
    if (!instructorName && course.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', course.created_by)
        .maybeSingle();
      instructorName = profile?.full_name || '';
    }

    // --- Progress tracking setup ---
    // Count total topics + subtopics
    const { data: { user } } = await supabase.auth.getUser();
    let totalItems = 0;
    if (course.outline && course.outline.length > 0) {
      course.outline.forEach((topic, tIdx) => {
        totalItems++;
        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((sub, sIdx) => {
            totalItems++;
          });
        }
      });
    }
    const progressKey = `progress_${courseId}_${user?.id}`;
    let viewedMap = JSON.parse(localStorage.getItem(progressKey) || '{}');
    let localViewedCount = 0;
    if (course.outline && course.outline.length > 0) {
      course.outline.forEach((topic, tIdx) => {
        if (viewedMap[`t${tIdx}`]) localViewedCount++;
        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((sub, sIdx) => {
            if (viewedMap[`t${tIdx}_s${sIdx}`]) localViewedCount++;
          });
        }
      });
    }
    // Always fetch Supabase progress and sync
    let supabaseViewedCount = 0;
    if (user) {
      const { data: progressData } = await supabase
        .from('progress')
        .select('progress')
        .eq('learner_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (progressData && progressData.progress > 0 && totalItems > 0) {
        supabaseViewedCount = Math.round((progressData.progress / 100) * totalItems);
      }
    }
    // If Supabase progress is higher, use it
    if (supabaseViewedCount > localViewedCount) {
      // Mark the first N items as viewed
      let n = 0;
      viewedMap = {};
      course.outline.forEach((topic, tIdx) => {
        if (n < supabaseViewedCount) { viewedMap[`t${tIdx}`] = true; n++; }
        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((sub, sIdx) => {
            if (n < supabaseViewedCount) { viewedMap[`t${tIdx}_s${sIdx}`] = true; n++; }
          });
        }
      });
      localStorage.setItem(progressKey, JSON.stringify(viewedMap));
      localViewedCount = supabaseViewedCount;
    }
    // If local progress is higher, update Supabase
    if (localViewedCount > supabaseViewedCount && user) {
      const progress = Math.round((localViewedCount / totalItems) * 100);
      await supabase.from('progress').upsert([
        { learner_id: user.id, course_id: courseId, progress }
      ], { onConflict: ['learner_id', 'course_id'] });
    }
    // Now count viewed items again (in case of update)
    let viewedItems = 0;
    if (course.outline && course.outline.length > 0) {
      course.outline.forEach((topic, tIdx) => {
        if (viewedMap[`t${tIdx}`]) viewedItems++;
        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((sub, sIdx) => {
            if (viewedMap[`t${tIdx}_s${sIdx}`]) viewedItems++;
          });
        }
      });
    }
    // Initial progress update (from the now-synced localStorage)
    await updateLearnerProgress(courseId, totalItems, viewedItems);

    // Render course banner
    let bannerHtml = `<div class="course-banner">
      ${course.image_url ? `<img src="${course.image_url}" alt="Course Banner" class="course-banner-image" />` : ''}
      <div class="course-banner-info">
        <div class="course-title">${course.title}</div>
        <div class="course-description">${course.description || ''}</div>
        <div class="course-meta">Instructor: ${instructorName}</div>
        ${renderProgressBar(viewedItems / totalItems * 100)}
      </div>
    </div>`;

    // Render topics and subtopics (collapsible)
    let outlineHtml = '';
    if (course.outline && course.outline.length > 0) {
      outlineHtml = `<div class="outline-section">
        <h2>📚 Course Content</h2>
        ${await Promise.all(course.outline.map(async (topic, tIdx) => {
          // Recommended video for topic
          const videoEmbedUrl = await getRecommendedYouTubeEmbed(`${course.title} ${topic.title}`);
          return `<div class="topic-item" data-topic-idx="${tIdx}">
            <div class="topic-title">${tIdx + 1}. ${topic.title}</div>
            <div class="topic-content">${topic.content || ''}
              ${topic.subtopics && topic.subtopics.length > 0 ? topic.subtopics.map((sub, sIdx) => `
                <div class="subtopic-item" data-subtopic-idx="${sIdx}">
                  <div class="subtopic-title">${tIdx + 1}.${sIdx + 1} ${sub.title}</div>
                  <div class="subtopic-content">${sub.content || ''}</div>
                </div>
              `).join('') : ''}
              <div class="video-section">
                <h4>🎥 Recommended Video</h4>
                <iframe src="${videoEmbedUrl}" frameborder="0" allowfullscreen></iframe>
              </div>
              ${topic.links && topic.links.length > 0 ? `<div class="links-section"><h4>🔗 Related Links</h4><ul>${topic.links.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}</ul></div>` : ''}
            </div>
          </div>`;
        })).then(items => items.join(''))}
      </div>`;
    } else {
      outlineHtml = '<p>No course outline available.</p>';
    }

    // Course materials (if any)
    let materialsHtml = '';
    if (course.doc_url || course.video_url) {
      materialsHtml = `<div class="files-section">
        <h2>📎 Course Materials</h2>
        ${course.doc_url ? `<div class="file-item"><span class="file-icon">📄</span><a href="${course.doc_url}" target="_blank" class="file-link">Download Course Document</a></div>` : ''}
        ${course.video_url ? `<div class="file-item"><span class="file-icon">🎥</span><a href="${course.video_url}" target="_blank" class="file-link">Watch Video</a></div>` : ''}
      </div>`;
    }

    courseContent.innerHTML = bannerHtml + outlineHtml + materialsHtml;

    // Collapsible topics/subtopics with progress tracking
    document.querySelectorAll('.topic-title').forEach((title, tIdx) => {
      title.addEventListener('click', function() {
        const parent = this.closest('.topic-item');
        parent.classList.toggle('open');
        if (!viewedMap[`t${tIdx}`]) {
          viewedMap[`t${tIdx}`] = true;
          localStorage.setItem(progressKey, JSON.stringify(viewedMap));
          viewedItems++;
          updateLearnerProgress(courseId, totalItems, viewedItems);
        }
      });
    });
    document.querySelectorAll('.subtopic-title').forEach((title, idx) => {
      // Find tIdx and sIdx from DOM
      const subtopicItem = title.closest('.subtopic-item');
      const topicItem = title.closest('.topic-item');
      const tIdx = topicItem ? parseInt(topicItem.getAttribute('data-topic-idx')) : 0;
      const sIdx = subtopicItem ? parseInt(subtopicItem.getAttribute('data-subtopic-idx')) : 0;
      title.addEventListener('click', function() {
        subtopicItem.classList.toggle('open');
        if (!viewedMap[`t${tIdx}_s${sIdx}`]) {
          viewedMap[`t${tIdx}_s${sIdx}`] = true;
          localStorage.setItem(progressKey, JSON.stringify(viewedMap));
          viewedItems++;
          updateLearnerProgress(courseId, totalItems, viewedItems);
        }
      });
    });
  } catch (error) {
    courseContent.innerHTML = '<p style="color: red;">Error loading course details: ' + error.message + '</p>';
  }
}

// Set user name in header
async function setUserName() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    document.getElementById('user-name').textContent = profile?.full_name || 'User';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setUserName();
  if (window.userManagement) window.userManagement.setupUserMenu();
  if (window.userManagement) window.userManagement.setCurrentDashboardContent && window.userManagement.setCurrentDashboardContent();
  loadCourseDetails();
});
