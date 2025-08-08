document.addEventListener('DOMContentLoaded', async () => {
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackSection = document.getElementById('feedback-section');
    const feedbackText = document.getElementById('feedback-text');
    const explanationText = document.getElementById('explanation-text');
    const nextQuestionBtn = document.getElementById('next-question');
    const questionCounter = document.getElementById('question-counter');
    const scoreDisplay = document.getElementById('score');
    
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || sessionStorage.getItem('currentTopic') || 'General Knowledge';
    const currentDifficulty = urlParams.get('difficulty') || 'easy';

    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // Store the current topic in session storage for potential reloads
    sessionStorage.setItem('currentTopic', topic);
    
    // Fetch initial questions
    await fetchQuestions();
    displayQuestion();
    
    async function fetchQuestions() {
        const questionCount = 10;
        const prompt = `
            Generate a JSON array of ${questionCount} quiz questions about "${topic || 'General Knowledge'}" with a difficulty level of "${currentDifficulty}".
            Each question object must have the following structure:
            {
                "question": "<The question text>",
                "options": ["<Option 1>", "<Option 2>", "<Option 3>", "<Option 4>"],
                "correct_answer": "<The correct option text>",
                "explanation": "<A brief explanation of the correct answer>"
            }
            Only return the JSON array, with no other text or explanations outside the JSON structure.
        `;

        try {
            questionText.textContent = 'Generating your quiz...';
            const response = await puter.ai.chat(prompt, { model: 'claude-sonnet-4' });
            const aiResponseText = response.message.content[0].text;

            // Find the start and end of the JSON array
            const jsonStart = aiResponseText.indexOf('[');
            const jsonEnd = aiResponseText.lastIndexOf(']');

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('AI did not return a valid JSON array.');
            }

            const jsonString = aiResponseText.substring(jsonStart, jsonEnd + 1);
            const parsedQuestions = JSON.parse(jsonString);

            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                throw new Error('Parsed JSON is not a valid array of questions.');
            }

            currentQuestions = parsedQuestions;

        } catch (error) {
            console.error('Error generating quiz with Puter.js:', error);
            questionText.textContent = 'Failed to generate quiz questions. Please try again.';
            optionsContainer.innerHTML = '';
            currentQuestions = [];
        }
    }
    
    function displayQuestion() {
        if (currentQuestionIndex >= currentQuestions.length || currentQuestions.length === 0) {
            endQuiz();
            return;
        }

        const question = currentQuestions[currentQuestionIndex];
        questionText.textContent = question.question;
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
        optionsContainer.innerHTML = '';

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => checkAnswer(option, button));
            optionsContainer.appendChild(button);
        });

        feedbackSection.classList.add('hidden');
    }

    function checkAnswer(selectedAnswer, selectedButton) {
        const question = currentQuestions[currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correct_answer;

        if (isCorrect) {
            score += 10; // 10 points for each correct answer
            selectedButton.classList.add('correct');
        } else {
            selectedButton.classList.add('incorrect');
        }

        scoreDisplay.textContent = `Score: ${score}`;
        feedbackText.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        explanationText.textContent = question.explanation;
        feedbackSection.classList.remove('hidden');

        Array.from(optionsContainer.children).forEach(btn => {
            if (btn.textContent === question.correct_answer) {
                btn.classList.add('correct');
            }
            btn.disabled = true;
        });

        // No need to send answer data for now, simplifying the logic
        // sendAnswerData(isCorrect);
    }
    
    async function sendAnswerData(isCorrect) {
        try {
            await fetch('http://localhost:5000/api/submit-answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_difficulty: currentDifficulty,
                    is_correct: isCorrect
                })
            });
        } catch (error) {
            console.error('Error sending answer data:', error);
        }
    }
    
    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        feedbackSection.classList.add('hidden');
        displayQuestion();
    });
    
    function endQuiz() {
        // Store results in localStorage to pass to the results page
        localStorage.setItem('quizScore', score);
        localStorage.setItem('quizTopic', topic);
        localStorage.setItem('quizDifficulty', currentDifficulty);

        // Redirect to the results page
        window.location.href = 'results.html';
    }
});