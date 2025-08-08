import os
import requests
import logging
import json
from openai import OpenAI

# Configure logging
logger = logging.getLogger(__name__)

# Configure API keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

# Initialize OpenAI client if key is available
client = None
if OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_api_key_here':
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
        client = None
else:
    logger.warning("OpenAI API key not properly configured")

# Verify API keys
if not any([OPENAI_API_KEY, ANTHROPIC_API_KEY]):
    error_msg = "Neither OPENAI_API_KEY nor ANTHROPIC_API_KEY is set in environment variables"
    logger.error(error_msg)
    raise ValueError(error_msg)

if not YOUTUBE_API_KEY or YOUTUBE_API_KEY == 'your_youtube_api_key_here':
    logger.warning("YOUTUBE_API_KEY is not properly configured. YouTube integration will be disabled.")
    YOUTUBE_API_KEY = None

def generate_summary(topic, max_retries=2):
    """Generate a summary for the given topic using available AI services.
    
    Tries OpenAI first, falls back to Claude AI if available.
    """
    # Try OpenAI first if available
    if client:
        try:
            logger.info(f"Generating summary using OpenAI for topic: {topic}")
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful learning assistant."},
                    {"role": "user", "content": f"Provide a concise 3-paragraph summary about {topic}"}
                ]
            )
            
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
                
        except Exception as e:
            logger.warning(f"OpenAI API error: {str(e)}")
            if "quota" in str(e).lower() or "limit" in str(e).lower():
                logger.info("OpenAI quota exceeded, falling back to Claude AI")
            else:
                logger.error(f"OpenAI API error: {str(e)}")
    
    # Fall back to Claude AI if OpenAI fails or is not available
    if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != 'your_anthropic_api_key_here':
        try:
            logger.info(f"Falling back to Claude AI for topic: {topic}")
            
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "content-type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            data = {
                "model": "claude-3-opus-20240229",
                "max_tokens": 1000,
                "messages": [
                    {"role": "user", "content": f"Provide a concise 3-paragraph summary about {topic}"}
                ]
            }
            
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=data,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            if "content" in result and result["content"]:
                # Extract text from Claude's response
                return "\n".join([block["text"] for block in result["content"] if block["type"] == "text"])
                
        except Exception as e:
            logger.error(f"Claude AI API error: {str(e)}")
    
    # If all else fails, return a default message
    error_msg = "Unable to generate a summary at this time. Please try again later."
    logger.error(error_msg)
    return error_msg

def get_youtube_videos(topic, max_results=5):
    """Search for YouTube videos related to the given topic."""
    if not YOUTUBE_API_KEY:
        logger.warning("YouTube API key not configured")
        return []
        
    try:
        logger.info(f"Searching YouTube for videos about: {topic}")
        
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': topic,
            'type': 'video',
            'maxResults': min(max_results, 10),  # Limit to 10 results max
            'key': YOUTUBE_API_KEY,
            'safeSearch': 'moderate',  # Filter out inappropriate content
            'relevanceLanguage': 'en',  # Prefer English results
            'order': 'relevance'  # Sort by relevance
        }
        
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        
        items = response.json().get('items', [])
        videos = []
        
        for item in items:
            try:
                # Extract video details
                video_id = item.get('id', {}).get('videoId')
                snippet = item.get('snippet', {})
                
                if not video_id:
                    logger.warning("Skipping video - missing videoId")
                    continue
                
                videos.append({
                    'title': snippet.get('title', 'No title available'),
                    'videoId': video_id,
                    'channelTitle': snippet.get('channelTitle', 'Unknown channel'),
                    'thumbnail': snippet.get('thumbnails', {})
                                 .get('high', {})
                                 .get('url', ''),
                    'publishedAt': snippet.get('publishedAt', ''),
                    'description': snippet.get('description', '')
                })
                
                # Stop if we've reached the requested number of results
                if len(videos) >= max_results:
                    break
                    
            except Exception as e:
                logger.warning(f"Error processing YouTube video item: {str(e)}")
                continue
                
        logger.info(f"Found {len(videos)} videos for topic: {topic}")
        return videos
        
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if hasattr(e, 'response') else 'unknown'
        error_msg = f"YouTube API request failed with status {status_code}"
        
        if status_code == 403:
            error_detail = e.response.json().get('error', {}).get('message', 'No additional details')
            logger.error(f"{error_msg}: {error_detail}")
            return [{
                'error': 'YouTube API quota exceeded or access denied',
                'details': error_detail
            }]
        elif status_code == 400:
            logger.error(f"Bad request to YouTube API: {str(e)}")
        else:
            logger.error(f"YouTube API error: {str(e)}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request to YouTube API failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in get_youtube_videos: {str(e)}", exc_info=True)
        
    return []

def generate_quiz_questions(topic, difficulty, count=5):
    """Generate quiz questions using available AI services.
    
    Tries OpenAI first, falls back to Claude AI if available.
    """
    # Try OpenAI first if available
    if client:
        try:
            logger.info(f"Generating {count} {difficulty} quiz questions about {topic} using OpenAI")
            
            prompt = f"""
            Generate {count} {difficulty} difficulty multiple-choice questions about {topic}.
            Format as a JSON array where each question has this structure:
            {{
                "question": "...",
                "options": ["...", "...", "...", "..."],
                "correct_answer": "...",
                "explanation": "..."
            }}
            """
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a quiz generator. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            if response.choices and response.choices[0].message.content:
                content = response.choices[0].message.content
                try:
                    # Try to parse the response as JSON
                    result = json.loads(content)
                    # If the response is a dictionary with a questions key, use that
                    if isinstance(result, dict) and 'questions' in result:
                        questions = result['questions']
                    # Otherwise, try to parse the entire response as an array
                    elif isinstance(result, list):
                        questions = result
                    else:
                        questions = [result]
                    
                    # Ensure we have the correct number of questions
                    questions = questions[:count]
                    logger.info(f"Successfully generated {len(questions)} quiz questions")
                    return questions
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse OpenAI response as JSON: {str(e)}")
                    logger.debug(f"Raw OpenAI response: {content}")
            
        except Exception as e:
            logger.warning(f"OpenAI API error: {str(e)}")
            if "quota" in str(e).lower() or "limit" in str(e).lower():
                logger.info("OpenAI quota exceeded, falling back to Claude AI")
            else:
                logger.error(f"OpenAI API error: {str(e)}")
    
    # Fall back to Claude AI if OpenAI fails or is not available
    if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != 'your_anthropic_api_key_here':
        try:
            logger.info(f"Falling back to Claude AI for quiz questions about: {topic}")
            
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "content-type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            system_prompt = f"""You are a quiz generator. Generate {count} {difficulty} difficulty 
            multiple-choice questions about {topic}. Format your response as a JSON array where each 
            question has this structure:
            {{
                "question": "...",
                "options": ["...", "...", "...", "..."],
                "correct_answer": "...",
                "explanation": "..."
            }}"""
            
            data = {
                "model": "claude-3-opus-20240229",
                "max_tokens": 2000,
                "system": system_prompt,
                "messages": [
                    {
                        "role": "user",
                        "content": f"Please generate {count} {difficulty} multiple-choice questions about {topic}."
                    }
                ]
            }
            
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=data,
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            if "content" in result and result["content"]:
                # Extract text from Claude's response
                content = "".join([block["text"] for block in result["content"] if block["type"] == "text"])
                
                # Try to extract JSON from the response
                try:
                    # Sometimes the response might be wrapped in markdown code blocks
                    if '```json' in content:
                        content = content.split('```json')[1].split('```')[0].strip()
                    elif '```' in content:
                        content = content.split('```')[1].split('```')[0].strip()
                    
                    # Parse the JSON
                    questions = json.loads(content)
                    
                    # If the response is a dictionary with a questions key, use that
                    if isinstance(questions, dict) and 'questions' in questions:
                        questions = questions['questions']
                    # Ensure we have a list
                    elif not isinstance(questions, list):
                        questions = [questions]
                    
                    # Ensure we have the correct number of questions
                    questions = questions[:count]
                    logger.info(f"Successfully generated {len(questions)} quiz questions using Claude AI")
                    return questions
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Claude AI response as JSON: {str(e)}")
                    logger.debug(f"Raw Claude AI response: {content}")
        
        except Exception as e:
            logger.error(f"Claude AI API error: {str(e)}")
    
    # If all else fails, return some default questions
    logger.error("Failed to generate quiz questions - using fallback questions")
    return [
        {
            "question": f"What is the main concept of {topic}?",
            "options": [
                "Option 1",
                "Option 2",
                "Option 3",
                "Option 4"
            ],
            "correct_answer": "Option 1",
            "explanation": f"This is a placeholder explanation for a question about {topic}."
        }
    ][:1]  # Return just one question as a fallback