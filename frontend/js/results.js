document.addEventListener('DOMContentLoaded', () => {
    const finalScore = localStorage.getItem('quizScore') || 0;
    const topic = localStorage.getItem('quizTopic') || 'your recent';

    const finalScoreEl = document.getElementById('final-score');
    const quizTopicTitleEl = document.getElementById('quiz-topic-title');
    const levelBadgeEl = document.getElementById('level-badge');
    const retryBtn = document.getElementById('retry-quiz');
    const newTopicBtn = document.getElementById('new-topic');

    finalScoreEl.textContent = finalScore;
    quizTopicTitleEl.textContent = topic;

    // Update badge and score circle based on score
    let level = 'Beginner';
    if (finalScore >= 80) {
        level = 'Expert';
    } else if (finalScore >= 50) {
        level = 'Intermediate';
    }
    levelBadgeEl.textContent = level;

    // Animate score circle
    const scoreCircle = document.querySelector('.score-circle');
    if (scoreCircle) {
        const percentage = (finalScore / 100) * 360; // Assuming max score is 100
        scoreCircle.style.background = `conic-gradient(var(--primary-color) ${percentage}deg, #e5e7eb ${percentage}deg)`;
    }

    retryBtn.addEventListener('click', () => {
        // Get the last used difficulty or default to medium
        const difficulty = localStorage.getItem('quizDifficulty') || 'medium';
        window.location.href = `quiz.html?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`;
    });

    newTopicBtn.addEventListener('click', () => {
        // Clear session storage for a fresh start
        localStorage.removeItem('quizTopic');
        localStorage.removeItem('quizScore');
        localStorage.removeItem('quizDifficulty');
        window.location.href = 'index.html';
    });
});