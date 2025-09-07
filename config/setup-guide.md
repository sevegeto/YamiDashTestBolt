# Customer Service Chatbot Setup Guide

## Overview

This comprehensive guide will help you set up a production-ready customer service chatbot backend using Google Apps Script and Google Sheets, with AI integration (Gemini/Claude) and MercadoLibre API support.

## Prerequisites

- Google account with access to Google Drive, Sheets, and Apps Script
- MercadoLibre developer account (for API integration)
- Gemini API key (Google AI Studio)
- Claude API key (Anthropic) - optional
- Basic understanding of Google Sheets

## Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Chatbot Configuration and Logs"
4. Note the spreadsheet ID from the URL (the long string after `/d/` and before `/edit`)

## Step 2: Set up Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Name your project "Customer Service Chatbot"
4. Delete the default `Code.gs` file
5. Upload all the `.gs` files from the `src/` folder:
   - `main.gs`
   - `menuService.gs`
   - `aiService.gs`
   - `mercadolibreService.gs`
   - `chatService.gs`
   - `sheetsService.gs`
   - `configService.gs`
   - `loggingService.gs`

## Step 3: Configure Script Properties

1. In your Apps Script project, click on the gear icon (Project Settings)
2. Scroll down to "Script Properties"
3. Add the following properties (click "Add script property" for each):

### Required Properties

```
SPREADSHEET_ID = your_spreadsheet_id_from_step_1
GEMINI_API_KEY = your_gemini_api_key
```

### MercadoLibre API Properties (if using ML integration)

```
ML_CLIENT_ID = your_mercadolibre_client_id
ML_CLIENT_SECRET = your_mercadolibre_client_secret
ML_ACCESS_TOKEN = your_mercadolibre_access_token
ML_REFRESH_TOKEN = your_mercadolibre_refresh_token
ML_USER_ID = your_mercadolibre_user_id
ml_redirectUri = your_oauth_redirect_uri
```

### Optional Properties

```
CLAUDE_API_KEY = your_claude_api_key (optional)
SECRET_USPS = your_usps_secret (if using USPS)
SHIPPOTOKEN = your_shippo_token (if using Shippo)
```

### System State Properties (automatically managed)

```
estadoPaginacion = 0
ultimoOffset = 0
last_trigger_timestamp = 
MLM_CHECKPOINT = 
update_batchSize = 50
update_startRow = 2
update_totalRows = 0
update_lastProcessedRow = 0
update_timestamp = 
update_inProgress = false
update_acum_success = 0
update_acum_skipped = 0
```

## Step 4: Initial Setup

1. In the Apps Script editor, click on the function dropdown
2. Select `setupCredentials`
3. Click "Run" - this creates the initial property structure
4. Select `initializeSystem`
5. Click "Run" - this sets up the Google Sheets structure

## Step 5: Configure Google Sheets

After running the initialization, your spreadsheet will have three sheets:

### Menu_Config Sheet
Configure your chatbot menu options:
- **Número**: Menu option number (1, 2, 3, etc.)
- **Título**: Display text for the option
- **Tipo de Respuesta**: Type (`static`, `ai`, or `escalate`)
- **Respuesta Estática**: Static response text (for static type)
- **Proveedor IA**: AI provider (`gemini` or `claude`)
- **Contexto IA**: Context for AI responses
- **Mensaje Escalación**: Message for escalation during business hours
- **Mensaje Fuera Horario**: Message for after-hours escalation
- **Respuesta Fallback**: Fallback response if AI fails
- **Volver al Menú**: Whether to show menu after response (TRUE/FALSE)
- **Activo**: Whether this option is active (TRUE/FALSE)
- **Max Tokens**: Maximum tokens for AI responses

### Settings Sheet
Configure system behavior:
- **business_hours_start**: Start time (e.g., "09:00")
- **business_hours_end**: End time (e.g., "18:00")
- **business_days**: Active days (e.g., "Mon,Tue,Wed,Thu,Fri")
- **greeting_business_hours**: Greeting during business hours
- **greeting_after_hours**: Greeting after hours
- **footer_message**: Message shown after menu
- **default_ai_provider**: Default AI provider ("gemini" or "claude")
- **max_ai_tokens**: Default maximum tokens for AI

### Chat_Logs Sheet
Automatically populated with:
- Timestamp
- Session ID
- Interaction Type
- User Message
- Bot Response
- AI Provider
- Response Time
- Status
- Metadata

## Step 6: Deploy as Web App (Optional)

For HTTP/REST API access:

1. Click "Deploy" > "New Deployment"
2. Choose "Web app" as the type
3. Set "Execute as" to "Me"
4. Set "Who has access" based on your needs:
   - "Anyone" for public access
   - "Anyone with Google account" for authenticated access
5. Click "Deploy"
6. Copy the web app URL for API calls

## Step 7: Testing

1. In the Apps Script editor, select `testSystem` function
2. Click "Run"
3. Check the execution log for test results
4. Verify that all services (AI, MercadoLibre) are working

## Step 8: Get API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy and add to Script Properties as `GEMINI_API_KEY`

### Claude API Key (Optional)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and navigate to API Keys
3. Generate a new API key
4. Copy and add to Script Properties as `CLAUDE_API_KEY`

### MercadoLibre API Setup

1. Go to [MercadoLibre Developers](https://developers.mercadolibre.com.ar/)
2. Create an application
3. Get your Client ID and Client Secret
4. Set up OAuth2 flow to get Access Token and Refresh Token
5. Add all tokens to Script Properties

## Usage Examples

### Web App API Calls

```javascript
// Get menu
fetch('YOUR_WEBAPP_URL?action=getMenu')
  .then(response => response.json())
  .then(data => console.log(data));

// Process selection
fetch('YOUR_WEBAPP_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'processSelection',
    userInput: '1',
    sessionId: 'user123'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Direct Function Calls

```javascript
// From another Apps Script project
function callChatbot() {
  const response = handleChatbotRequest({
    action: 'getMenu'
  });
  console.log(response);
}
```

## Maintenance

### Regular Tasks

1. **Monitor logs**: Check the Chat_Logs sheet regularly
2. **Clean up old logs**: Run `LoggingService.cleanupOldLogs(90)` to keep only recent logs
3. **Update menu**: Modify Menu_Config sheet as needed
4. **Token refresh**: MercadoLibre tokens are automatically refreshed
5. **Review analytics**: Use `LoggingService.getAnalytics()` for insights

### Troubleshooting

1. **Check execution log**: Apps Script > Executions tab
2. **Verify permissions**: Ensure all required permissions are granted
3. **Test individual services**: Use the test functions for each service
4. **Check API quotas**: Monitor your API usage limits
5. **Validate configuration**: Use `ConfigService.validateConfig()`

## Security Best Practices

1. **Never hard-code credentials**: Always use Script Properties
2. **Regular token rotation**: Refresh API tokens regularly
3. **Monitor access logs**: Keep track of who accesses your system
4. **Limit web app access**: Use appropriate access controls
5. **Sanitize inputs**: All user inputs are automatically sanitized

## Advanced Features

### Custom Integrations

The modular architecture allows easy addition of new services:

```javascript
// Example: Add WhatsApp integration
const WhatsAppService = {
  sendMessage(phoneNumber, message) {
    // Implementation here
  }
};
```

### Analytics and Reporting

Use the built-in analytics:

```javascript
function generateReport() {
  const analytics = LoggingService.getAnalytics({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  console.log(analytics);
}
```

### Custom AI Providers

Add new AI providers by extending AIService:

```javascript
// Add to AIService
callCustomAI(context) {
  // Implementation for your AI provider
}
```

## Support and Troubleshooting

### Common Issues

1. **"SPREADSHEET_ID not configured"**: Add your spreadsheet ID to Script Properties
2. **"No valid access token"**: Check MercadoLibre API credentials
3. **AI API errors**: Verify API keys and quotas
4. **Permission errors**: Grant necessary permissions to the script

### Getting Help

1. Check the execution logs in Google Apps Script
2. Review the error messages in Chat_Logs sheet
3. Use the test functions to isolate issues
4. Verify all Script Properties are correctly set

This setup provides a robust, scalable customer service chatbot that can handle thousands of conversations while maintaining security and providing detailed analytics.