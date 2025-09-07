# Customer Service Chatbot Backend

A comprehensive, production-ready customer service chatbot backend built with Google Apps Script and Google Sheets, featuring AI integration (Gemini/Claude) and MercadoLibre API support.

## Features

### Core Functionality
- **Dynamic Menu System**: Menu options driven by Google Sheets configuration
- **AI-Powered Responses**: Integration with Gemini and Claude APIs for intelligent responses
- **MercadoLibre Integration**: Secure API integration for e-commerce operations
- **Real-time Logging**: Comprehensive interaction logging and analytics
- **Business Hours Management**: Automatic escalation based on operating hours
- **Session Management**: Context-aware conversations with session tracking

### Technical Highlights
- **Modular Architecture**: Clean separation of concerns for maintainability
- **Secure Credential Management**: All sensitive data stored in Google Apps Script Properties
- **CORS-Compliant**: Ready for web deployment with proper CORS handling
- **Error Handling**: Robust error handling with fallback mechanisms
- **Performance Optimized**: Caching and efficient data operations
- **Extensible Design**: Easy to add new integrations and features

### Security & Compliance
- **No Hard-coded Secrets**: All credentials managed through Script Properties
- **Input Sanitization**: Automatic sanitization of user inputs and logs
- **Audit Trails**: Complete logging of all interactions and system events
- **Token Management**: Automatic token refresh for MercadoLibre API

## Quick Start

### Prerequisites
- Google account with Drive, Sheets, and Apps Script access
- Gemini API key from Google AI Studio
- MercadoLibre developer account (optional)
- Claude API key from Anthropic (optional)

### Installation

1. **Create Google Spreadsheet**
   ```
   1. Go to Google Sheets
   2. Create new spreadsheet: "Chatbot Configuration"
   3. Note the spreadsheet ID from URL
   ```

2. **Set up Apps Script Project**
   ```
   1. Go to Google Apps Script
   2. Create new project: "Customer Service Chatbot"
   3. Upload all .gs files from src/ folder
   ```

3. **Configure Script Properties**
   ```javascript
   // Required properties
   SPREADSHEET_ID = "your_spreadsheet_id"
   GEMINI_API_KEY = "your_gemini_api_key"
   
   // Optional MercadoLibre properties
   ML_CLIENT_ID = "your_ml_client_id"
   ML_CLIENT_SECRET = "your_ml_client_secret"
   // ... other ML credentials
   ```

4. **Initialize System**
   ```javascript
   // Run these functions in order:
   setupCredentials()  // Creates property structure
   initializeSystem()  // Sets up sheets and configuration
   testSystem()       // Validates all connections
   ```

### Basic Usage

```javascript
// Get menu
const menu = handleChatbotRequest({
  action: 'getMenu'
});

// Process selection
const response = handleChatbotRequest({
  action: 'processSelection',
  userInput: '1',
  sessionId: 'user123'
});

// Chat message
const chatResponse = handleChatbotRequest({
  action: 'sendMessage',
  userInput: 'What is the status of my order?',
  sessionId: 'user123'
});
```

## Architecture

### File Structure
```
src/
├── main.gs              # Main entry point and web app handlers
├── menuService.gs       # Menu generation and selection processing
├── aiService.gs         # Gemini and Claude API integrations
├── mercadolibreService.gs # MercadoLibre API integration
├── chatService.gs       # Conversational chat handling
├── sheetsService.gs     # Google Sheets operations
├── configService.gs     # Configuration management
└── loggingService.gs    # Comprehensive logging system

docs/
├── setup-guide.md       # Detailed setup instructions
├── api-reference.md     # Complete API documentation
└── README.md           # This file
```

### Google Sheets Structure

The system uses three main sheets:

1. **Menu_Config**: Configure chatbot menu options
2. **Chat_Logs**: Automatic logging of all interactions
3. **Settings**: System configuration and business rules

## Configuration

### Menu Configuration
Configure your chatbot options in the Menu_Config sheet:

| Column | Purpose | Example |
|--------|---------|---------|
| Número | Menu option number | 1 |
| Título | Display text | "Order Status" |
| Tipo de Respuesta | Response type | "ai", "static", "escalate" |
| Proveedor IA | AI provider | "gemini", "claude" |
| Contexto IA | AI context | "Help with order inquiries" |

### Business Hours
Set operating hours in the Settings sheet:
- `business_hours_start`: "09:00"
- `business_hours_end`: "18:00"
- `business_days`: "Mon,Tue,Wed,Thu,Fri"

### AI Configuration
- `default_ai_provider`: "gemini"
- `max_ai_tokens`: 500
- Custom context per menu option

## API Integration

### Gemini AI
```javascript
// Automatic integration with context-aware prompts
const response = AIService.generateResponse('gemini', {
  userQuery: "What's my order status?",
  context: "E-commerce customer service",
  maxTokens: 300
});
```

### MercadoLibre
```javascript
// Secure API calls with automatic token refresh
const orders = MercadoLibreService.getUserOrders(userId, {
  status: 'pending',
  limit: 10
});
```

## Deployment Options

### 1. Web App (HTTP API)
```javascript
// Deploy as web app for REST API access
// Supports GET and POST with CORS headers
fetch('YOUR_WEBAPP_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'getMenu',
    sessionId: 'user123'
  })
});
```

### 2. Direct Function Calls
```javascript
// Call directly from other Apps Script projects
const response = handleChatbotRequest({
  action: 'processSelection',
  userInput: '2'
});
```

### 3. Webhook Integration
Perfect for integration with:
- Google Chat
- Slack
- WhatsApp Business API
- Custom chat interfaces

## Analytics & Monitoring

### Real-time Analytics
```javascript
const analytics = LoggingService.getAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Returns:
// - Total interactions
// - Success rates
// - Response times
// - AI usage statistics
// - Escalation rates
// - Peak usage hours
```

### Comprehensive Logging
- All user interactions
- AI service performance
- API call metrics
- Error tracking with stack traces
- Session management

## Advanced Features

### Custom AI Context
Each menu option can have specific AI context:
```javascript
// Menu option with specialized context
{
  title: "Product Recommendations",
  responseType: "ai",
  aiContext: "You are a product specialist. Help customers find the best products based on their needs. Focus on features and benefits."
}
```

### Intelligent Escalation
- Business hours detection
- Keyword-based escalation triggers
- Queue management integration ready

### Session Persistence
- Context-aware conversations
- Session timeout management
- Cross-session analytics

## Security Features

### Credential Management
- Zero hard-coded secrets
- Encrypted property storage
- Automatic token rotation
- Access logging

### Data Protection
- Input sanitization
- PII detection and masking
- Secure logging practices
- GDPR-compliant data handling

## Performance

### Optimizations
- Configuration caching
- Batch operations
- Efficient sheet operations
- Response time monitoring

### Scalability
- Handles thousands of concurrent users
- Automatic load balancing via Google infrastructure
- Efficient resource usage

## Maintenance

### Regular Tasks
```javascript
// Clean up old logs (run monthly)
LoggingService.cleanupOldLogs(90);

// Validate configuration
const validation = ConfigService.validateConfig();

// Generate analytics report
const report = LoggingService.getAnalytics();
```

### Monitoring
- Check execution logs regularly
- Monitor API quotas and usage
- Review analytics for optimization opportunities
- Update menu configurations as needed

## Extension Examples

### Add WhatsApp Integration
```javascript
const WhatsAppService = {
  sendMessage(phoneNumber, message) {
    // WhatsApp Business API integration
  }
};
```

### Custom AI Provider
```javascript
// Extend AIService with new providers
callOpenAI(context) {
  // OpenAI API integration
}
```

### CRM Integration
```javascript
const CRMService = {
  createTicket(sessionId, issue) {
    // Salesforce/HubSpot integration
  }
};
```

## Troubleshooting

### Common Issues
1. **"SPREADSHEET_ID not configured"**: Check Script Properties
2. **AI API errors**: Verify API keys and quotas
3. **MercadoLibre token issues**: Check OAuth configuration
4. **Permission errors**: Grant necessary Google permissions

### Debug Mode
```javascript
// Enable detailed logging
Logger.log('Debug info');
// Check execution transcript in Apps Script
```

## Contributing

This system is designed for easy extension:
1. Follow the modular architecture patterns
2. Add proper error handling and logging
3. Update documentation for new features
4. Test thoroughly with the test functions

## License

MIT License - see LICENSE file for details.

## Support

- Review the setup guide in `docs/setup-guide.md`
- Check the API reference in `docs/api-reference.md`
- Use the built-in test functions for troubleshooting
- Monitor logs in the Chat_Logs sheet

This chatbot backend provides enterprise-grade functionality while remaining easy to configure and maintain. Perfect for businesses looking to automate customer service with AI while maintaining human oversight and control.