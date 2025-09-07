/**
 * AI Service - Handles integrations with Gemini and Claude APIs
 * 
 * This service manages AI integrations:
 * - Gemini API calls with proper authentication
 * - Claude API integration via Anthropic
 * - Response processing and error handling
 * - Token management and rate limiting
 */

const AIService = {
  
  /**
   * Generate AI response based on provider and context
   * @param {string} provider - AI provider (gemini or claude)
   * @param {Object} context - Query context and parameters
   * @returns {Object} AI response object
   */
  generateResponse(provider, context) {
    try {
      switch (provider) {
        case CONFIG.AI_PROVIDERS.GEMINI:
          return this.callGemini(context);
          
        case CONFIG.AI_PROVIDERS.CLAUDE:
          return this.callClaude(context);
          
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
      
    } catch (error) {
      Logger.log(`Error generating AI response: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: provider
      };
    }
  },
  
  /**
   * Call Gemini API for response generation
   * @param {Object} context - Query context
   * @returns {Object} Gemini response
   */
  callGemini(context) {
    try {
      const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      
      const prompt = this.buildPrompt(context);
      
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: context.maxTokens || 500,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      };
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload)
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200 && responseData.candidates) {
        const content = responseData.candidates[0]?.content?.parts[0]?.text;
        
        if (content) {
          return {
            success: true,
            content: content.trim(),
            provider: 'gemini',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      throw new Error('Invalid response from Gemini API');
      
    } catch (error) {
      Logger.log(`Gemini API error: ${error.message}`);
      return {
        success: false,
        error: `Gemini API error: ${error.message}`,
        provider: 'gemini'
      };
    }
  },
  
  /**
   * Call Claude API for response generation
   * @param {Object} context - Query context
   * @returns {Object} Claude response
   */
  callClaude(context) {
    try {
      const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
      if (!apiKey) {
        throw new Error('Claude API key not configured');
      }
      
      const endpoint = 'https://api.anthropic.com/v1/messages';
      
      const prompt = this.buildPrompt(context);
      
      const payload = {
        model: 'claude-3-sonnet-20240229',
        max_tokens: context.maxTokens || 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        payload: JSON.stringify(payload)
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200 && responseData.content) {
        const content = responseData.content[0]?.text;
        
        if (content) {
          return {
            success: true,
            content: content.trim(),
            provider: 'claude',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      throw new Error('Invalid response from Claude API');
      
    } catch (error) {
      Logger.log(`Claude API error: ${error.message}`);
      return {
        success: false,
        error: `Claude API error: ${error.message}`,
        provider: 'claude'
      };
    }
  },
  
  /**
   * Build AI prompt with context and guidelines
   * @param {Object} context - Query context
   * @returns {string} Formatted prompt
   */
  buildPrompt(context) {
    const systemContext = `Eres un asistente de atención al cliente para una tienda en línea. 
    Tu objetivo es proporcionar respuestas útiles, precisas y amigables.
    
    Contexto específico: ${context.context || 'Consulta general de atención al cliente'}
    
    Instrucciones:
    - Mantén un tono profesional pero cercano
    - Proporciona información específica y accionable
    - Si no tienes información suficiente, sugiere contactar con un agente humano
    - Mantén las respuestas concisas pero completas
    - Incluye pasos específicos cuando sea apropiado
    
    Consulta del usuario: ${context.userQuery}
    
    Respuesta:`;
    
    return systemContext;
  },
  
  /**
   * Test AI service connections
   * @returns {Object} Test results
   */
  testConnection() {
    try {
      const testContext = {
        userQuery: 'Test connection',
        context: 'This is a test query',
        maxTokens: 50
      };
      
      // Test Gemini
      const geminiTest = this.callGemini(testContext);
      
      // Test Claude (if key is available)
      const claudeKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
      let claudeTest = { success: false, error: 'API key not configured' };
      
      if (claudeKey) {
        claudeTest = this.callClaude(testContext);
      }
      
      return {
        success: geminiTest.success || claudeTest.success,
        gemini: geminiTest.success,
        claude: claudeTest.success,
        details: {
          gemini: geminiTest,
          claude: claudeTest
        }
      };
      
    } catch (error) {
      Logger.log(`AI service test error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};