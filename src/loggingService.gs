/**
 * Logging Service - Handles comprehensive system logging
 * 
 * This service manages all logging operations:
 * - User interactions and bot responses
 * - System errors and debugging information
 * - Performance metrics and analytics
 * - Escalation tracking and audit trails
 */

const LoggingService = {
  
  /**
   * Log user interaction with the chatbot
   * @param {string} interactionType - Type of interaction
   * @param {string} sessionId - User session ID
   * @param {Object} data - Interaction data
   */
  logInteraction(interactionType, sessionId, data) {
    try {
      const timestamp = new Date().toISOString();
      const startTime = Date.now();
      
      const logEntry = [
        timestamp,
        sessionId || 'anonymous',
        interactionType,
        this.sanitizeMessage(data.userMessage || data.selection || ''),
        this.sanitizeMessage(data.message || data.botResponse?.message || ''),
        data.provider || data.aiProvider || '',
        data.responseTime || (Date.now() - startTime),
        data.success !== false ? 'success' : 'error',
        JSON.stringify(this.sanitizeMetadata(data))
      ];
      
      SheetsService.appendData(CONFIG.SHEETS.LOGS_SHEET, logEntry);
      
      // Also log to Apps Script logger for debugging
      Logger.log(`Interaction logged: ${interactionType} - Session: ${sessionId}`);
      
    } catch (error) {
      // Use console.error to avoid recursive logging
      console.error(`Error logging interaction: ${error.message}`);
    }
  },
  
  /**
   * Log system errors
   * @param {string} operation - Operation that caused the error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(operation, error, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      const logEntry = [
        timestamp,
        context.sessionId || 'system',
        'error',
        operation,
        error.message,
        '',
        0,
        'error',
        JSON.stringify({
          stack: error.stack,
          context: this.sanitizeMetadata(context),
          operation: operation
        })
      ];
      
      SheetsService.appendData(CONFIG.SHEETS.LOGS_SHEET, logEntry);
      
      // Also log to Apps Script logger
      Logger.log(`ERROR in ${operation}: ${error.message}`);
      
    } catch (logError) {
      console.error(`Error logging error: ${logError.message}`);
    }
  },
  
  /**
   * Log escalation events
   * @param {string} sessionId - User session ID
   * @param {string} reason - Escalation reason
   * @param {string} status - Escalation status
   */
  logEscalation(sessionId, reason, status) {
    try {
      const timestamp = new Date().toISOString();
      
      const logEntry = [
        timestamp,
        sessionId,
        'escalation',
        this.sanitizeMessage(reason),
        `Escalation status: ${status}`,
        '',
        0,
        status,
        JSON.stringify({
          escalationReason: reason,
          escalationStatus: status,
          businessHours: status !== 'after_hours'
        })
      ];
      
      SheetsService.appendData(CONFIG.SHEETS.LOGS_SHEET, logEntry);
      
      // Log to Apps Script logger
      Logger.log(`Escalation logged: ${sessionId} - Status: ${status}`);
      
    } catch (error) {
      console.error(`Error logging escalation: ${error.message}`);
    }
  },
  
  /**
   * Log AI service performance
   * @param {string} provider - AI provider
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} success - Whether the call was successful
   * @param {Object} metadata - Additional metadata
   */
  logAIPerformance(provider, responseTime, success, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      const logEntry = [
        timestamp,
        metadata.sessionId || 'system',
        'ai_performance',
        `${provider} API call`,
        success ? 'Success' : 'Failed',
        provider,
        responseTime,
        success ? 'success' : 'error',
        JSON.stringify({
          provider: provider,
          responseTime: responseTime,
          success: success,
          ...this.sanitizeMetadata(metadata)
        })
      ];
      
      SheetsService.appendData(CONFIG.SHEETS.LOGS_SHEET, logEntry);
      
    } catch (error) {
      console.error(`Error logging AI performance: ${error.message}`);
    }
  },
  
  /**
   * Log MercadoLibre API usage
   * @param {string} endpoint - API endpoint called
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} success - Whether the call was successful
   * @param {Object} metadata - Additional metadata
   */
  logMLAPIUsage(endpoint, responseTime, success, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      const logEntry = [
        timestamp,
        metadata.sessionId || 'system',
        'ml_api_usage',
        `ML API: ${endpoint}`,
        success ? 'Success' : 'Failed',
        'mercadolibre',
        responseTime,
        success ? 'success' : 'error',
        JSON.stringify({
          endpoint: endpoint,
          responseTime: responseTime,
          success: success,
          ...this.sanitizeMetadata(metadata)
        })
      ];
      
      SheetsService.appendData(CONFIG.SHEETS.LOGS_SHEET, logEntry);
      
    } catch (error) {
      console.error(`Error logging ML API usage: ${error.message}`);
    }
  },
  
  /**
   * Get interaction logs with filtering
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    try {
      const allData = SheetsService.getAllData(CONFIG.SHEETS.LOGS_SHEET);
      
      let filteredData = allData;
      
      // Filter by date range
      if (filters.startDate || filters.endDate) {
        filteredData = filteredData.filter(row => {
          const logDate = new Date(row[0]);
          
          if (filters.startDate && logDate < new Date(filters.startDate)) {
            return false;
          }
          
          if (filters.endDate && logDate > new Date(filters.endDate)) {
            return false;
          }
          
          return true;
        });
      }
      
      // Filter by interaction type
      if (filters.interactionType) {
        filteredData = filteredData.filter(row => row[2] === filters.interactionType);
      }
      
      // Filter by session ID
      if (filters.sessionId) {
        filteredData = filteredData.filter(row => row[1] === filters.sessionId);
      }
      
      // Filter by status
      if (filters.status) {
        filteredData = filteredData.filter(row => row[7] === filters.status);
      }
      
      // Limit results
      if (filters.limit) {
        filteredData = filteredData.slice(0, filters.limit);
      }
      
      return filteredData;
      
    } catch (error) {
      Logger.log(`Error getting logs: ${error.message}`);
      return [];
    }
  },
  
  /**
   * Get analytics summary
   * @param {Object} dateRange - Date range for analytics
   * @returns {Object} Analytics summary
   */
  getAnalytics(dateRange = {}) {
    try {
      const logs = this.getLogs(dateRange);
      
      const analytics = {
        totalInteractions: logs.length,
        interactionsByType: {},
        successRate: 0,
        averageResponseTime: 0,
        escalationRate: 0,
        aiUsage: {},
        topErrors: [],
        busyHours: {},
        dailyStats: {}
      };
      
      // Process logs
      let totalResponseTime = 0;
      let successfulInteractions = 0;
      let escalations = 0;
      
      logs.forEach(log => {
        const [timestamp, sessionId, interactionType, userMessage, botResponse, provider, responseTime, status, metadata] = log;
        
        // Count by interaction type
        analytics.interactionsByType[interactionType] = 
          (analytics.interactionsByType[interactionType] || 0) + 1;
        
        // Calculate success rate
        if (status === 'success') {
          successfulInteractions++;
        }
        
        // Count escalations
        if (interactionType === 'escalation') {
          escalations++;
        }
        
        // AI usage stats
        if (provider) {
          analytics.aiUsage[provider] = (analytics.aiUsage[provider] || 0) + 1;
        }
        
        // Response time stats
        if (responseTime && !isNaN(responseTime)) {
          totalResponseTime += Number(responseTime);
        }
        
        // Busy hours analysis
        const hour = new Date(timestamp).getHours();
        analytics.busyHours[hour] = (analytics.busyHours[hour] || 0) + 1;
        
        // Daily stats
        const date = new Date(timestamp).toISOString().split('T')[0];
        if (!analytics.dailyStats[date]) {
          analytics.dailyStats[date] = { total: 0, successful: 0, escalations: 0 };
        }
        analytics.dailyStats[date].total++;
        if (status === 'success') {
          analytics.dailyStats[date].successful++;
        }
        if (interactionType === 'escalation') {
          analytics.dailyStats[date].escalations++;
        }
      });
      
      // Calculate rates and averages
      analytics.successRate = logs.length > 0 ? 
        Math.round((successfulInteractions / logs.length) * 100) : 0;
      
      analytics.escalationRate = logs.length > 0 ? 
        Math.round((escalations / logs.length) * 100) : 0;
      
      analytics.averageResponseTime = logs.length > 0 ? 
        Math.round(totalResponseTime / logs.length) : 0;
      
      return analytics;
      
    } catch (error) {
      Logger.log(`Error getting analytics: ${error.message}`);
      return {
        error: error.message,
        totalInteractions: 0
      };
    }
  },
  
  /**
   * Clean up old logs to manage storage
   * @param {number} daysToKeep - Number of days to keep logs
   */
  cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const sheet = SheetsService.getSheet(CONFIG.SHEETS.LOGS_SHEET);
      const data = sheet.getDataRange().getValues();
      
      // Find rows to keep (header + recent logs)
      const rowsToKeep = [data[0]]; // Keep header
      
      for (let i = 1; i < data.length; i++) {
        const logDate = new Date(data[i][0]);
        if (logDate >= cutoffDate) {
          rowsToKeep.push(data[i]);
        }
      }
      
      // Clear sheet and write kept data
      sheet.clear();
      if (rowsToKeep.length > 0) {
        sheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length)
              .setValues(rowsToKeep);
      }
      
      Logger.log(`Log cleanup complete. Kept ${rowsToKeep.length - 1} recent logs.`);
      
    } catch (error) {
      Logger.log(`Error cleaning up logs: ${error.message}`);
    }
  },
  
  // Helper methods
  
  /**
   * Sanitize message content for logging
   * @param {string} message - Message to sanitize
   * @returns {string} Sanitized message
   */
  sanitizeMessage(message) {
    if (typeof message !== 'string') {
      return String(message || '');
    }
    
    // Remove potential sensitive information
    return message
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]') // Credit card numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email addresses
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]') // Phone numbers
      .substring(0, 500); // Limit length
  },
  
  /**
   * Sanitize metadata for logging
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   */
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credential'];
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
};