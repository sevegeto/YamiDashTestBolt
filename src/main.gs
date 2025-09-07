/**
 * Customer Service Chatbot Backend - Main Entry Point
 * 
 * This is the main entry point for the chatbot system. It handles:
 * - Initial setup and configuration validation
 * - Request routing to appropriate modules
 * - Web app deployment endpoints
 * - CORS handling for browser-based calls
 * 
 * Security: All sensitive credentials are stored in Script Properties
 * Architecture: Modular design with clear separation of concerns
 */

// Global configuration
const CONFIG = {
  SHEETS: {
    MENU_SHEET: 'Menu_Config',
    LOGS_SHEET: 'Chat_Logs',
    SETTINGS_SHEET: 'Settings'
  },
  AI_PROVIDERS: {
    GEMINI: 'gemini',
    CLAUDE: 'claude'
  },
  RESPONSE_TYPES: {
    STATIC: 'static',
    AI: 'ai',
    ESCALATE: 'escalate'
  }
};

/**
 * Main function to handle chatbot interactions
 * @param {Object} params - Request parameters
 * @returns {Object} Response object with menu or answer
 */
function handleChatbotRequest(params = {}) {
  try {
    // Initialize system if needed
    if (!isSystemInitialized()) {
      initializeSystem();
    }

    const { action, userInput, sessionId } = params;
    
    switch (action) {
      case 'getMenu':
        return MenuService.getMenu();
        
      case 'processSelection':
        return MenuService.processSelection(userInput, sessionId);
        
      case 'sendMessage':
        return ChatService.processMessage(userInput, sessionId);
        
      default:
        return MenuService.getMenu();
    }
    
  } catch (error) {
    Logger.log(`Error in handleChatbotRequest: ${error.message}`);
    LoggingService.logError('handleChatbotRequest', error, params);
    
    return {
      success: false,
      error: 'Lo siento, ocurrió un error. Por favor intenta nuevamente.',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Web app entry point for HTTP requests
 * Handles CORS and routing for browser-based clients
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const response = handleChatbotRequest(params);
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log(`Error in doGet: ${error.message}`);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests with CORS support
 */
function doPost(e) {
  try {
    // Handle CORS preflight
    if (e.postData && e.postData.type === 'application/json') {
      const data = JSON.parse(e.postData.contents);
      const response = handleChatbotRequest(data);
      
      const output = ContentService
        .createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
      
      // Add CORS headers
      return addCorsHeaders(output);
    }
    
    return doGet(e);
    
  } catch (error) {
    Logger.log(`Error in doPost: ${error.message}`);
    
    const errorResponse = ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid request format'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
    return addCorsHeaders(errorResponse);
  }
}

/**
 * Add CORS headers to response for browser compatibility
 */
function addCorsHeaders(output) {
  // Note: In production, replace '*' with specific domains
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  Object.keys(headers).forEach(key => {
    output.addHeader(key, headers[key]);
  });
  
  return output;
}

/**
 * Initialize system on first run
 */
function initializeSystem() {
  try {
    Logger.log('Initializing chatbot system...');
    
    // Create required sheets if they don't exist
    SheetsService.initializeSheets();
    
    // Set up default configuration
    ConfigService.initializeConfig();
    
    // Mark system as initialized
    PropertiesService.getScriptProperties().setProperty('SYSTEM_INITIALIZED', 'true');
    
    Logger.log('System initialization complete');
    
  } catch (error) {
    Logger.log(`Error initializing system: ${error.message}`);
    throw error;
  }
}

/**
 * Check if system has been initialized
 */
function isSystemInitialized() {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty('SYSTEM_INITIALIZED') === 'true';
}

/**
 * Manual setup function for initial configuration
 * Run this once after deployment to set up credentials
 */
function setupCredentials() {
  const properties = PropertiesService.getScriptProperties();
  
  // Set placeholder values - replace with actual credentials
  const credentials = {
    // Spreadsheet Configuration
    'SPREADSHEET_ID': 'your_spreadsheet_id_here',
    
    // MercadoLibre API Credentials
    'ML_CLIENT_ID': 'your_ml_client_id',
    'ML_CLIENT_SECRET': 'your_ml_client_secret',
    'ML_ACCESS_TOKEN': 'your_ml_access_token',
    'ML_REFRESH_TOKEN': 'your_ml_refresh_token',
    'ML_ACCESS_TOKEN_FECHA_EXPIRA': '',
    'ML_USER_ID': 'your_ml_user_id',
    'ml_redirectUri': 'your_redirect_uri',
    
    // AI API Keys
    'GEMINI_API_KEY': 'your_gemini_api_key',
    'CLAUDE_API_KEY': 'your_claude_api_key',
    
    // Shipping APIs
    'SECRET_USPS': 'your_usps_secret',
    'SHIPPOTOKEN': 'your_shippo_token',
    
    // System State
    'estadoPaginacion': '0',
    'ultimoOffset': '0',
    'last_trigger_timestamp': '',
    'MLM_CHECKPOINT': '',
    
    // Batch Processing Settings
    'update_batchSize': '50',
    'update_startRow': '2',
    'update_totalRows': '0',
    'update_lastProcessedRow': '0',
    'update_timestamp': '',
    'update_inProgress': 'false',
    'update_acum_success': '0',
    'update_acum_skipped': '0'
  };
  
  // Set all credentials
  properties.setProperties(credentials);
  
  Logger.log('Credentials setup complete. Please update with actual values.');
  Logger.log('Remember to update SPREADSHEET_ID with your actual spreadsheet ID');
}

/**
 * Test function to verify system functionality
 */
function testSystem() {
  try {
    Logger.log('Running system tests...');
    
    // Test menu retrieval
    const menu = MenuService.getMenu();
    Logger.log(`Menu test: ${menu.success ? 'PASSED' : 'FAILED'}`);
    
    // Test AI services
    const aiTest = AIService.testConnection();
    Logger.log(`AI service test: ${aiTest.success ? 'PASSED' : 'FAILED'}`);
    
    // Test MercadoLibre API
    const mlTest = MercadoLibreService.testConnection();
    Logger.log(`MercadoLibre test: ${mlTest.success ? 'PASSED' : 'FAILED'}`);
    
    Logger.log('System tests complete');
    
  } catch (error) {
    Logger.log(`Test failed: ${error.message}`);
  }
}