from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_integration import generate_summary, get_youtube_videos, generate_quiz_questions
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Verify required environment variables
required_vars = ['OPENAI_API_KEY', 'YOUTUBE_API_KEY']
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
    logger.error(error_msg)
    raise EnvironmentError(error_msg)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
                "origins": ["http://localhost:5501", "http://127.0.0.1:5500", "http://127.0.0.1:5501"],  # Common frontend origins
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})  # Enable CORS for all routes


@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    """Generate learning content for a given topic."""
    try:
        logger.info("Received request to /api/generate-content")
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        if not data or 'topic' not in data:
            logger.error("Missing 'topic' in request data")
            return jsonify({'error': 'Topic is required'}), 400
            
        topic = data.get('topic')
        logger.info(f"Generating content for topic: {topic}")
        
        # Generate summary and get videos in parallel
        logger.debug("Generating summary...")
        summary = generate_summary(topic)
        logger.debug("Fetching YouTube videos...")
        topic = data['topic']
        logger.info(f"Generating content for topic: {topic}")
        
        # Generate summary
        summary = generate_summary(topic)
        
        # Get YouTube videos
        videos = get_youtube_videos(topic)
        
        logger.info(f"Successfully generated content for topic: {topic}")
        return jsonify({
            'summary': summary,
            'videos': videos
        })
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/start-quiz', methods=['POST'])
def start_quiz():
    """Start a new quiz with questions about the given topic."""
    try:
        data = request.get_json()
        logger.info(f"Starting quiz with data: {data}")
        
        if not data or 'topic' not in data or 'difficulty' not in data:
            logger.error("Missing required fields in quiz request")
            return jsonify({'error': 'Topic and difficulty are required'}), 400
            
        questions = generate_quiz_questions(
            topic=data['topic'],
            difficulty=data['difficulty'],
            count=data.get('count', 5)
        )
        
        logger.info(f"Generated {len(questions)} quiz questions")
        return jsonify({'questions': questions})
        
    except Exception as e:
        logger.error(f"Error starting quiz: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to generate quiz questions'}), 500


@app.route('/api/submit-answer', methods=['POST'])
def submit_answer():
    """Submit and validate a quiz answer."""
    try:
        data = request.get_json()
        logger.debug(f"Submitted answer data: {data}")
        
        if not data or 'question' not in data or 'answer' not in data:
            logger.error("Missing required fields in answer submission")
            return jsonify({'error': 'Question and answer are required'}), 400
            
        # In a real app, you would check the answer against the correct one
        # For now, we'll just return a mock response
        response = {
            'correct': True,
            'explanation': 'This is a placeholder explanation.'
        }
        
        logger.info("Answer submitted successfully")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing answer: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to process answer'}), 500


if __name__ == '__main__':
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Configure file handler for better log management
    file_handler = logging.FileHandler('logs/app.log')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    
    # Get the root logger and add the file handler
    root_logger = logging.getLogger()
    root_logger.addHandler(file_handler)
    
    logger.info("Starting Flask application")
    app.run(debug=True, host='0.0.0.0', port=5000)