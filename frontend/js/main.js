const API_BASE_URL = 'https://omnilearn.onrender.com'; // Replace with your live backend URL when deployed

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const topicInput = document.getElementById('topic-input');
    const learnBtn = document.getElementById('learn-btn');
    const contentDisplay = document.getElementById('content-display');
    const summaryContent = document.getElementById('summary-content');
    const videosContainer = document.getElementById('videos-container');
    const startQuizBtn = document.getElementById('start-quiz');
    const searchBox = document.querySelector('.search-box');
    
    let currentTopic = '';
    let isLoading = false;

    // Add loading state to search box
    const setLoading = (isLoading) => {
        if (isLoading) {
            learnBtn.disabled = true;
            learnBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Learning...';
            searchBox.classList.add('searching');
        } else {
            learnBtn.disabled = false;
            learnBtn.textContent = 'Start Learning';
            searchBox.classList.remove('searching');
        }
    };

    // Handle search submission
    const handleSearch = async (e) => {
        e.preventDefault();
        
        currentTopic = topicInput.value.trim();
        if (!currentTopic || isLoading) return;
        
        try {
            setLoading(true);

            // Create all promises to run in parallel
            const summaryPrompt = `Provide a concise 3-paragraph summary about ${currentTopic}. Also, identify key concepts and bold them by wrapping them in double asterisks, like **this**.`;
            const summaryPromise = puter.ai.chat(summaryPrompt, { model: 'claude-sonnet-4' });

            const flashcardPrompt = `Generate a JSON array of 5-7 key terms and their definitions from the topic "${currentTopic}". Each object must have a "term" and a "definition" key. Only return the JSON array.`;
            const flashcardsPromise = puter.ai.chat(flashcardPrompt, { model: 'claude-sonnet-4' });

            const videosPromise = fetch(`${API_BASE_URL}/api/generate-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ topic: currentTopic })
            });

            // Wait for all promises to resolve
            const [aiResponse, flashcardsResponse, videoResponse] = await Promise.all([summaryPromise, flashcardsPromise, videosPromise]);

            // Process and display AI summary
            const summaryTitle = document.getElementById('summary-title');
            if (aiResponse && aiResponse.message && aiResponse.message.content[0].text) {
                summaryTitle.textContent = currentTopic;
                let summary = aiResponse.message.content[0].text;

                // Replace **text** with <strong>text</strong> for bolding
                summary = summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                summaryContent.innerHTML = summary
                    .split('\n')
                    .filter(para => para.trim() !== '')
                    .map(para => `<p>${para}</p>`)
                    .join('');
            } else {
                summaryContent.innerHTML = '<p>Could not generate a summary. Please try again.</p>';
                throw new Error('Failed to generate summary from AI.');
            }

            // Process and display flashcards
            const flashcardsContainer = document.getElementById('flashcards-container');
            const flashcardsSection = document.getElementById('flashcards-section');
            try {
                const flashcardText = flashcardsResponse.message.content[0].text;
                const jsonStart = flashcardText.indexOf('[');
                const jsonEnd = flashcardText.lastIndexOf(']');
                const jsonString = flashcardText.substring(jsonStart, jsonEnd + 1);
                const flashcards = JSON.parse(jsonString);

                if (Array.isArray(flashcards) && flashcards.length > 0) {
                    flashcardsContainer.innerHTML = flashcards.map(card => `
                        <div class="flashcard">
                            <div class="flashcard-front">
                                <p>${card.term}</p>
                            </div>
                            <div class="flashcard-back">
                                <p>${card.definition}</p>
                            </div>
                        </div>
                    `).join('');
                    flashcardsSection.classList.remove('hidden');
                } else {
                    flashcardsSection.classList.add('hidden');
                }
            } catch (e) {
                console.error("Failed to parse or display flashcards", e);
                flashcardsSection.classList.add('hidden');
            }

            // Process and display videos
            if (videoResponse.ok) {
                const videoData = await videoResponse.json();
                if (videoData.videos && videoData.videos.length > 0) {
                    videosContainer.innerHTML = videoData.videos.map((video, index) => `
                        <div class="video-card card" style="animation: fadeIn ${0.3 + (index * 0.1)}s ease-out">
                            <img src="${video.thumbnail || 'https://via.placeholder.com/120x90?text=No+Thumbnail'}" 
                                 alt="${video.title || 'Video Thumbnail'}" 
                                 onerror="this.src='https://via.placeholder.com/120x90?text=Thumbnail+Error'">
                            <div class="video-info">
                                <h3>${video.title || 'Untitled Video'}</h3>
                                ${video.channelTitle ? `<p class="channel">${video.channelTitle}</p>` : ''}
                                <a href="https://youtube.com/watch?v=${video.videoId}" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   class="watch-btn">
                                    <i class="fas fa-play"></i> Watch Now
                                </a>
                            </div>
                        </div>
                    `).join('');
                } else {
                    videosContainer.innerHTML = '<p class="no-videos">No videos found for this topic.</p>';
                }
            } else {
                console.error('Failed to fetch videos from backend.');
                videosContainer.innerHTML = '<p class="no-videos">Could not load video recommendations.</p>';
            }
            
            // UI Updates
            contentDisplay.classList.remove('hidden');
            contentDisplay.style.opacity = '0';
            contentDisplay.style.animation = 'fadeIn 0.5s ease-out forwards';
            
            startQuizBtn.classList.remove('hidden');
            startQuizBtn.style.opacity = '0';
            startQuizBtn.style.animation = 'fadeIn 0.5s ease-out 0.3s forwards';

            contentDisplay.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Content Generation Error:', error);
            showNotification(error.message || 'An error occurred. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Show notification message
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }, 100);
    };

    // Event Listeners
    learnBtn.addEventListener('click', handleSearch);
    
    // Allow search on Enter key
    topicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    });
    
    startQuizBtn.addEventListener('click', () => {
        if (!currentTopic) {
            showNotification('Please search for a topic first', 'error');
            return;
        }
        // Store topic in session storage for quiz page
        sessionStorage.setItem('currentTopic', currentTopic);
        window.location.href = 'quiz.html';
    });
});
