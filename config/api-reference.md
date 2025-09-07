# API Reference

## Overview

This document describes the API endpoints and functions available in the Customer Service Chatbot system.

## Web App Endpoints

When deployed as a web app, the system exposes the following HTTP endpoints:

### Base URL
```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

## Endpoints

### GET /
Get chatbot menu or process simple requests.

**Parameters:**
- `action` (string): Action to perform
  - `getMenu`: Get the current menu
  - `processSelection`: Process a menu selection
  - `sendMessage`: Send a chat message
- `userInput` (string): User input (required for processSelection and sendMessage)
- `sessionId` (string): Session identifier (optional but recommended)

**Example:**
```
GET /?action=getMenu
```

### POST /
Process complex requests with JSON payload.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "action": "processSelection",
  "userInput": "1",
  "sessionId": "user123"
}
```

## Response Format

All endpoints return JSON responses with the following structure:

```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {},
  "error": null
}
```

## Core Functions

### handleChatbotRequest(params)

Main entry point for chatbot interactions.

**Parameters:**
- `params` (Object): Request parameters
  - `action` (string): Action to perform
  - `userInput` (string): User input
  - `sessionId` (string): Session identifier

**Returns:**
- `Object`: Response object with menu or answer

**Example:**
```javascript
const response = handleChatbotRequest({
  action: 'getMenu'
});
```

## Menu Service

### MenuService.getMenu()

Retrieves the current menu based on configuration.

**Returns:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "businessHours": true,
  "greeting": "¡Hola! Bienvenido...",
  "options": [
    {
      "number": 1,
      "title": "Estado de mi pedido",
      "responseType": "ai",
      "active": true
    }
  ],
  "footer": "Escribe el número..."
}
```

### MenuService.processSelection(selection, sessionId)

Processes a user's menu selection.

**Parameters:**
- `selection` (string): User's selection
- `sessionId` (string): Session identifier

**Returns:**
- Response object based on selection type

## AI Service

### AIService.generateResponse(provider, context)

Generates AI response using specified provider.

**Parameters:**
- `provider` (string): AI provider ('gemini' or 'claude')
- `context` (Object): Query context
  - `userQuery` (string): User's query
  - `context` (string): Additional context
  - `maxTokens` (number): Maximum response tokens

**Returns:**
```json
{
  "success": true,
  "content": "AI generated response",
  "provider": "gemini",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## MercadoLibre Service

### MercadoLibreService.getUserOrders(userId, filters)

Retrieves user orders from MercadoLibre.

**Parameters:**
- `userId` (string): MercadoLibre user ID
- `filters` (Object): Optional filters
  - `status` (string): Order status filter
  - `limit` (number): Results limit
  - `offset` (number): Results offset

**Returns:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "paging": {...}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### MercadoLibreService.getOrderDetails(orderId)

Retrieves detailed information about a specific order.

**Parameters:**
- `orderId` (string): MercadoLibre order ID

**Returns:**
- Order details object

### MercadoLibreService.getProductInfo(itemId)

Retrieves product information from MercadoLibre.

**Parameters:**
- `itemId` (string): MercadoLibre item ID

**Returns:**
- Product information object

## Chat Service

### ChatService.processMessage(message, sessionId)

Processes a chat message from the user.

**Parameters:**
- `message` (string): User message
- `sessionId` (string): Session identifier

**Returns:**
- Response object based on message analysis

## Configuration Service

### ConfigService.get(key, defaultValue)

Retrieves a configuration value.

**Parameters:**
- `key` (string): Configuration key
- `defaultValue` (any): Default value if key not found

**Returns:**
- Configuration value

### ConfigService.set(key, value)

Sets a configuration value.

**Parameters:**
- `key` (string): Configuration key
- `value` (any): Value to set

### ConfigService.getBusinessHours()

Retrieves business hours configuration.

**Returns:**
```json
{
  "schedule": {
    "0": {"open": false},
    "1": {"open": true, "start": "09:00", "end": "18:00"}
  },
  "display": "09:00 - 18:00, Mon-Fri",
  "timezone": "America/Argentina/Buenos_Aires"
}
```

## Logging Service

### LoggingService.logInteraction(interactionType, sessionId, data)

Logs a user interaction.

**Parameters:**
- `interactionType` (string): Type of interaction
- `sessionId` (string): Session identifier
- `data` (Object): Interaction data

### LoggingService.getLogs(filters)

Retrieves interaction logs with optional filtering.

**Parameters:**
- `filters` (Object): Filter options
  - `startDate` (string): Start date filter
  - `endDate` (string): End date filter
  - `interactionType` (string): Interaction type filter
  - `sessionId` (string): Session ID filter
  - `limit` (number): Maximum results

**Returns:**
- Array of log entries

### LoggingService.getAnalytics(dateRange)

Generates analytics summary.

**Parameters:**
- `dateRange` (Object): Date range options
  - `startDate` (string): Start date
  - `endDate` (string): End date

**Returns:**
```json
{
  "totalInteractions": 1500,
  "interactionsByType": {
    "menu_display": 800,
    "ai_response": 400,
    "escalation": 50
  },
  "successRate": 95,
  "averageResponseTime": 1200,
  "escalationRate": 8,
  "aiUsage": {
    "gemini": 350,
    "claude": 50
  }
}
```

## Sheets Service

### SheetsService.getSheet(sheetName)

Gets or creates a specific sheet.

**Parameters:**
- `sheetName` (string): Name of the sheet

**Returns:**
- Google Sheets Sheet object

### SheetsService.appendData(sheetName, data)

Appends data to a sheet.

**Parameters:**
- `sheetName` (string): Target sheet name
- `data` (Array): Data array to append

## Error Handling

All functions return error information in the response object:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Response Types

### Menu Response
```json
{
  "success": true,
  "type": "menu",
  "businessHours": true,
  "greeting": "Welcome message",
  "options": [...],
  "footer": "Footer message"
}
```

### Static Response
```json
{
  "success": true,
  "type": "static",
  "title": "Option title",
  "message": "Static response message",
  "showMenu": true
}
```

### AI Response
```json
{
  "success": true,
  "type": "ai",
  "title": "Option title",
  "message": "AI generated response",
  "provider": "gemini",
  "showMenu": true
}
```

### Escalation Response
```json
{
  "success": true,
  "type": "escalation",
  "title": "Option title",
  "message": "Escalation message",
  "businessHours": false,
  "showMenu": false
}
```

## CORS Headers

When deployed as a web app, the following CORS headers are automatically added:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Rate Limits

- **AI APIs**: Subject to provider limits (Gemini: 60 requests/minute, Claude: varies)
- **MercadoLibre API**: Subject to ML rate limits
- **Google Apps Script**: 6 minutes execution time limit per request

## Authentication

- **Web App**: Uses Google Apps Script authentication
- **Direct calls**: No additional authentication required
- **API keys**: Stored securely in Script Properties

This API provides comprehensive functionality for building customer service chatbots with AI integration and MercadoLibre e-commerce support.