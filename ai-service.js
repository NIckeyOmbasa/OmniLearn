// AI Service for OmniLearn Chatbot using OpenRouter
class AIService {
  constructor() {
    this.apiKey = 'AIzaSyB-_sGIZrm3h60seCPU93wfkK4XRz43TT8';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.defaultModel = 'gemini-pro';
    
    console.log('AIService initialized with OpenRouter API');
    console.log('API URL:', this.apiUrl);
    console.log('Model:', this.defaultModel);
    
    this.conversationHistory = new Map(); // Store conversation history per user
    this.requestQueue = []; // Queue for rate limiting
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // Minimum 1 second between requests
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  // Get conversation history for a specific user
  getConversationHistory(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId);
  }

  // Add message to conversation history
  addToHistory(userId, role, content) {
    const history = this.getConversationHistory(userId);
    history.push({ role, content });
    
    // Keep only last 10 messages to manage context length
    if (history.length > 10) {
      history.splice(0, 2); // Remove oldest user and assistant messages
    }
  }

  // Generate system prompt based on context
  getSystemPrompt(context = 'general') {
    const basePrompt = `You are OmniLearn AI, an intelligent assistant for an educational learning management system. You help students, trainers, and administrators with their educational needs. Be helpful, friendly, and professional. Keep responses concise but informative. Always respond directly to the user's question or request.`;

    switch (context) {
      case 'learner':
        return `${basePrompt} You are specifically helping a learner. You can assist with course content, assignments, progress tracking, and general learning questions. Respond as if you're talking to a student.`;
      case 'trainer':
        return `${basePrompt} You are specifically helping a trainer. You can assist with course creation, assignment management, student progress, and teaching strategies. Respond as if you're talking to a teacher.`;
      case 'admin':
        return `${basePrompt} You are specifically helping an administrator. You can assist with user management, system settings, analytics, and platform administration. Respond as if you're talking to a system administrator.`;
      case 'course-creation':
        return `${basePrompt} You are helping with course creation. Provide specific, actionable guidance on structuring courses, writing descriptions, creating outlines, and best practices for educational content. Give practical examples and step-by-step advice.`;
      case 'assignment-creation':
        return `${basePrompt} You are helping with assignment creation. Provide specific guidance on writing clear instructions, creating effective quizzes, setting appropriate due dates, and assessment strategies. Give practical examples and templates.`;
      default:
        return basePrompt;
    }
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Make API request using OpenRouter
  async makeAPIRequest(messages, attempt = 1) {
    await this.waitForRateLimit();
    const prompt = messages.map(m => m.content).join('\n');
    const url = this.apiUrl + '?key=' + this.apiKey;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      let aiResponse = '';
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        aiResponse = data.candidates[0].content.parts.map(p => p.text).join(' ');
      }
      return aiResponse;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // If OpenRouter fails, use fallback response
      if (attempt < this.retryAttempts) {
        console.log(`Retrying in ${this.retryDelay}ms (attempt ${attempt}/${this.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.makeAPIRequest(messages, attempt + 1);
      } else {
        throw new Error('AI service temporarily unavailable. Please try again later.');
      }
    }
  }

  // Send message to OpenAI and get response
  async sendMessage(message, userId, context = 'general') {
    try {
      console.log('Starting AI request for user:', userId, 'context:', context);
      
      const history = this.getConversationHistory(userId);
      
      // Prepare messages array for OpenAI
      const messages = [
        { role: 'system', content: this.getSystemPrompt(context) },
        ...history,
        { role: 'user', content: message }
      ];

      console.log('Sending messages:', messages.length, 'total messages');
      
      const aiResponse = await this.makeAPIRequest(messages);
      
      console.log('AI response received:', aiResponse.substring(0, 100) + '...');
      
      // Add to conversation history
      this.addToHistory(userId, 'user', message);
      this.addToHistory(userId, 'assistant', aiResponse);
      
      return aiResponse;

    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Provide user-friendly error messages with fallback responses
      if (error.message.includes('Incorrect API key') || error.message.includes('sk-or-v1-')) {
        return `The AI service is not properly configured. Please contact the administrator to set up a valid API key. The current key format is not compatible with this service.`;
      } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
        return `I'm currently experiencing high traffic. Please wait a moment and try again. If this persists, you may have reached your API usage limit.`;
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return `Authentication error with AI service. Please contact support.`;
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        return `The AI service is temporarily unavailable. Please try again in a few minutes.`;
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        return `Network connection issue. Please check your internet connection and try again.`;
      } else if (error.message.includes('Anthropic')) {
        return `Claude AI service error. Please try again or contact support if the issue persists.`;
      } else {
        // Use fallback response for other errors
        return this.getFallbackResponse(message, context);
      }
    }
  }

  // Clear conversation history for a user
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Get conversation history length for a user
  getHistoryLength(userId) {
    const history = this.getConversationHistory(userId);
    return history.length;
  }

  // Get service status
  getServiceStatus() {
    return {
      isAvailable: true,
      lastRequestTime: this.lastRequestTime,
      queueLength: this.requestQueue.length
    };
  }

  // Test API connection
  async testConnection() {
    try {
      console.log('Testing OpenRouter connection...');
      const testMessages = [
        { role: 'user', content: 'Test message' }
      ];
      
      const response = await this.makeAPIRequest(testMessages);
      console.log('Connection test successful:', response);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Fallback responses when AI service is unavailable
  getFallbackResponse(message, context = 'general') {
    const lowerMessage = message.toLowerCase();
    
    // Common greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! I'm OmniLearn AI. I'm here to help you with your educational needs. How can I assist you today?`;
    }
    
    // Help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you with:
• Course content and assignments
• Learning strategies and study tips
• Platform navigation and features
• General educational questions

What would you like to know more about?`;
    }
    
    // Course-related queries
    if (lowerMessage.includes('course') || lowerMessage.includes('class')) {
      if (context === 'learner') {
        return `I can help you with course-related questions! You can:
• Ask about course content and materials
• Get help with assignments
• Request study tips and strategies
• Navigate through your courses

What specific course question do you have?`;
      } else if (context === 'trainer') {
        return `I can help you with course management! You can:
• Get tips for creating engaging course content
• Learn about effective teaching strategies
• Manage assignments and assessments
• Track student progress

What would you like to work on?`;
      }
    }
    
    // Assignment-related queries
    if (lowerMessage.includes('assignment') || lowerMessage.includes('homework') || lowerMessage.includes('quiz')) {
      if (context === 'learner') {
        return `Need help with assignments? I can assist with:
• Understanding assignment requirements
• Study strategies and time management
• Breaking down complex tasks
• Finding relevant resources

What assignment are you working on?`;
      } else if (context === 'trainer') {
        return `Assignment creation tips! Consider:
• Clear, specific instructions
• Appropriate difficulty levels
• Real-world applications
• Multiple assessment types
• Fair grading criteria

What type of assignment are you creating?`;
      }
    }
    
    // Default fallback
    return `I'm currently experiencing technical difficulties, but I'm here to help! You can:
• Ask about courses and assignments
• Get learning tips and strategies
• Navigate platform features
• Request general educational guidance

Please try your question again, or contact support if the issue persists.`;
  }
}

// Create global AI service instance
const aiService = new AIService();

// Test function for OpenRouter
window.testOpenRouter = async function() {
  try {
    console.log('=== OPENROUTER TEST START ===');
    console.log('1. Testing AI service initialization...');
    
    if (!aiService) {
      console.error('❌ AI Service not initialized');
      return false;
    }
    
    console.log('✅ AI Service initialized');
    console.log('2. API URL:', aiService.apiUrl);
    console.log('3. Model:', aiService.defaultModel);
    console.log('4. API Key (first 10 chars):', aiService.apiKey.substring(0, 10) + '...');
    
    // Test basic API call
    console.log('5. Testing basic API call...');
    
    try {
      const result = await aiService.testConnection();
      if (result) {
        console.log('✅ OpenRouter API test successful!');
        console.log('=== OPENROUTER TEST END ===');
        return true;
      } else {
        console.error('❌ OpenRouter API test failed');
        return false;
      }
    } catch (apiError) {
      console.error('❌ API test failed:', apiError);
      return false;
    }
  } catch (error) {
    console.error('❌ OpenRouter test failed:', error);
    return false;
  }
};

// Export for use in other modules
export { aiService };