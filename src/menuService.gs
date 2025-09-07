/**
 * Menu Service - Handles menu generation and user selections
 * 
 * This service manages the dynamic menu system:
 * - Reads menu configuration from Google Sheets
 * - Generates formatted menus for users
 * - Processes user selections and routes to appropriate handlers
 * - Manages escalation logic and business hours
 */

const MenuService = {
  
  /**
   * Get the current menu based on configuration
   * @returns {Object} Menu object with options and metadata
   */
  getMenu() {
    try {
      const menuConfig = this.getMenuConfig();
      const currentTime = new Date();
      const businessHours = ConfigService.getBusinessHours();
      
      const isBusinessHours = this.isWithinBusinessHours(currentTime, businessHours);
      
      const menu = {
        success: true,
        timestamp: currentTime.toISOString(),
        businessHours: isBusinessHours,
        greeting: this.getGreeting(isBusinessHours),
        options: menuConfig.filter(option => option.active),
        footer: this.getFooter()
      };
      
      // Log menu display
      LoggingService.logInteraction('menu_display', null, menu);
      
      return menu;
      
    } catch (error) {
      Logger.log(`Error getting menu: ${error.message}`);
      return {
        success: false,
        error: 'No se pudo cargar el menú. Intenta nuevamente.',
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Process user menu selection
   * @param {string} selection - User's menu selection
   * @param {string} sessionId - User session identifier
   * @returns {Object} Response based on selection
   */
  processSelection(selection, sessionId) {
    try {
      const menuConfig = this.getMenuConfig();
      const selectedOption = menuConfig.find(option => 
        option.number.toString() === selection.toString() && option.active
      );
      
      if (!selectedOption) {
        return {
          success: false,
          message: 'Selección inválida. Por favor elige una opción del menú.',
          showMenu: true
        };
      }
      
      // Log the selection
      LoggingService.logInteraction('menu_selection', sessionId, {
        selection: selection,
        option: selectedOption.title
      });
      
      // Route based on response type
      switch (selectedOption.responseType) {
        case CONFIG.RESPONSE_TYPES.STATIC:
          return this.handleStaticResponse(selectedOption, sessionId);
          
        case CONFIG.RESPONSE_TYPES.AI:
          return this.handleAIResponse(selectedOption, sessionId);
          
        case CONFIG.RESPONSE_TYPES.ESCALATE:
          return this.handleEscalation(selectedOption, sessionId);
          
        default:
          return {
            success: false,
            message: 'Configuración inválida para esta opción.',
            showMenu: true
          };
      }
      
    } catch (error) {
      Logger.log(`Error processing selection: ${error.message}`);
      LoggingService.logError('processSelection', error, { selection, sessionId });
      
      return {
        success: false,
        message: 'Error procesando tu selección. Intenta nuevamente.',
        showMenu: true
      };
    }
  },
  
  /**
   * Handle static response options
   */
  handleStaticResponse(option, sessionId) {
    const response = {
      success: true,
      type: 'static',
      title: option.title,
      message: option.response,
      showMenu: option.returnToMenu !== false,
      timestamp: new Date().toISOString()
    };
    
    LoggingService.logInteraction('static_response', sessionId, response);
    return response;
  },
  
  /**
   * Handle AI-powered response options
   */
  handleAIResponse(option, sessionId) {
    try {
      // Get AI provider preference
      const aiProvider = option.aiProvider || CONFIG.AI_PROVIDERS.GEMINI;
      
      // Prepare context for AI
      const context = {
        userQuery: option.title,
        context: option.aiContext || '',
        maxTokens: option.maxTokens || 500
      };
      
      // Get AI response
      const aiResponse = AIService.generateResponse(aiProvider, context);
      
      if (aiResponse.success) {
        const response = {
          success: true,
          type: 'ai',
          title: option.title,
          message: aiResponse.content,
          provider: aiProvider,
          showMenu: option.returnToMenu !== false,
          timestamp: new Date().toISOString()
        };
        
        LoggingService.logInteraction('ai_response', sessionId, response);
        return response;
      } else {
        // Fallback to static response if AI fails
        return this.handleStaticResponse({
          ...option,
          response: option.fallbackResponse || 'Lo siento, no puedo procesar tu consulta en este momento.'
        }, sessionId);
      }
      
    } catch (error) {
      Logger.log(`Error in AI response: ${error.message}`);
      return this.handleStaticResponse({
        ...option,
        response: option.fallbackResponse || 'Error en el servicio de IA. Intenta nuevamente.'
      }, sessionId);
    }
  },
  
  /**
   * Handle escalation to human agents
   */
  handleEscalation(option, sessionId) {
    const currentTime = new Date();
    const businessHours = ConfigService.getBusinessHours();
    const isBusinessHours = this.isWithinBusinessHours(currentTime, businessHours);
    
    let message;
    if (isBusinessHours) {
      message = option.escalationMessage || 'Te estoy conectando con un agente humano. Por favor espera un momento.';
      
      // Here you would integrate with your ticketing system
      // For now, we'll just log the escalation
      LoggingService.logEscalation(sessionId, option.title, 'pending');
      
    } else {
      message = option.afterHoursMessage || 
        `Actualmente estamos fuera del horario de atención (${businessHours.display}). ` +
        'Tu consulta será atendida en el próximo horario hábil.';
        
      LoggingService.logEscalation(sessionId, option.title, 'after_hours');
    }
    
    const response = {
      success: true,
      type: 'escalation',
      title: option.title,
      message: message,
      businessHours: isBusinessHours,
      showMenu: false,
      timestamp: currentTime.toISOString()
    };
    
    return response;
  },
  
  /**
   * Get menu configuration from sheets
   */
  getMenuConfig() {
    try {
      const sheet = SheetsService.getSheet(CONFIG.SHEETS.MENU_SHEET);
      const data = sheet.getDataRange().getValues();
      
      // Skip header row
      const menuItems = data.slice(1).map(row => ({
        number: row[0],
        title: row[1],
        responseType: row[2],
        response: row[3],
        aiProvider: row[4],
        aiContext: row[5],
        escalationMessage: row[6],
        afterHoursMessage: row[7],
        fallbackResponse: row[8],
        returnToMenu: row[9] !== false,
        active: row[10] !== false,
        maxTokens: row[11] || 500
      }));
      
      return menuItems.filter(item => item.number && item.title);
      
    } catch (error) {
      Logger.log(`Error getting menu config: ${error.message}`);
      return [];
    }
  },
  
  /**
   * Check if current time is within business hours
   */
  isWithinBusinessHours(currentTime, businessHours) {
    try {
      const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      const daySchedule = businessHours.schedule[currentDay];
      if (!daySchedule || !daySchedule.open) {
        return false;
      }
      
      const openTime = this.parseTime(daySchedule.start);
      const closeTime = this.parseTime(daySchedule.end);
      
      return currentTimeMinutes >= openTime && currentTimeMinutes <= closeTime;
      
    } catch (error) {
      Logger.log(`Error checking business hours: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Parse time string to minutes
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },
  
  /**
   * Get greeting message based on business hours
   */
  getGreeting(isBusinessHours) {
    const greetings = ConfigService.getGreetings();
    return isBusinessHours ? greetings.businessHours : greetings.afterHours;
  },
  
  /**
   * Get footer message
   */
  getFooter() {
    return ConfigService.getFooterMessage();
  }
};