/**
 * Chat Service - Handles conversational interactions
 * 
 * This service manages ongoing chat conversations:
 * - Message processing and context management
 * - Session handling and state tracking
 * - Integration with AI services for dynamic responses
 * - Fallback to human escalation when needed
 */

const ChatService = {
  
  /**
   * Process user message in chat context
   * @param {string} message - User message
   * @param {string} sessionId - Session identifier
   * @returns {Object} Chat response
   */
  processMessage(message, sessionId) {
    try {
      // Get or create session context
      const sessionContext = this.getSessionContext(sessionId);
      
      // Determine response strategy
      const responseStrategy = this.determineResponseStrategy(message, sessionContext);
      
      let response;
      
      switch (responseStrategy.type) {
        case 'menu_request':
          response = MenuService.getMenu();
          break;
          
        case 'order_inquiry':
          response = this.handleOrderInquiry(message, sessionId, responseStrategy.context);
          break;
          
        case 'product_inquiry':
          response = this.handleProductInquiry(message, sessionId, responseStrategy.context);
          break;
          
        case 'general_ai':
          response = this.handleGeneralAI(message, sessionId, responseStrategy.context);
          break;
          
        case 'escalation':
          response = this.handleChatEscalation(message, sessionId);
          break;
          
        default:
          response = this.handleDefault(message, sessionId);
      }
      
      // Update session context
      this.updateSessionContext(sessionId, {
        lastMessage: message,
        lastResponse: response,
        timestamp: new Date().toISOString()
      });
      
      // Log interaction
      LoggingService.logInteraction('chat_message', sessionId, {
        userMessage: message,
        responseType: responseStrategy.type,
        botResponse: response
      });
      
      return response;
      
    } catch (error) {
      Logger.log(`Error processing message: ${error.message}`);
      LoggingService.logError('processMessage', error, { message, sessionId });
      
      return {
        success: false,
        message: 'Lo siento, ocurrió un error procesando tu mensaje. ¿Podrías intentar nuevamente?',
        showMenu: true,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Determine the best response strategy for user message
   * @param {string} message - User message
   * @param {Object} context - Session context
   * @returns {Object} Response strategy
   */
  determineResponseStrategy(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Menu request patterns
    if (lowerMessage.includes('menú') || lowerMessage.includes('menu') || 
        lowerMessage.includes('opciones') || lowerMessage.includes('ayuda')) {
      return { type: 'menu_request' };
    }
    
    // Order inquiry patterns
    if (this.containsOrderKeywords(lowerMessage)) {
      return { 
        type: 'order_inquiry',
        context: this.extractOrderContext(message)
      };
    }
    
    // Product inquiry patterns
    if (this.containsProductKeywords(lowerMessage)) {
      return {
        type: 'product_inquiry',
        context: this.extractProductContext(message)
      };
    }
    
    // Escalation patterns
    if (this.containsEscalationKeywords(lowerMessage)) {
      return { type: 'escalation' };
    }
    
    // Default to general AI
    return {
      type: 'general_ai',
      context: { userMessage: message, sessionContext: context }
    };
  },
  
  /**
   * Handle order-related inquiries
   */
  handleOrderInquiry(message, sessionId, context) {
    try {
      // Try to extract order ID or use ML API to search
      const orderId = this.extractOrderId(message);
      
      if (orderId) {
        const orderDetails = MercadoLibreService.getOrderDetails(orderId);
        
        if (orderDetails.success) {
          const orderInfo = this.formatOrderInfo(orderDetails.data);
          
          return {
            success: true,
            type: 'order_info',
            message: orderInfo,
            data: orderDetails.data,
            showMenu: true,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // If no specific order found, provide general order help
      const aiContext = {
        userQuery: message,
        context: 'El usuario está preguntando sobre pedidos. Proporciona información general sobre cómo consultar pedidos, estados de envío, y políticas de devolución.',
        maxTokens: 300
      };
      
      return AIService.generateResponse(CONFIG.AI_PROVIDERS.GEMINI, aiContext);
      
    } catch (error) {
      Logger.log(`Error handling order inquiry: ${error.message}`);
      return this.handleDefault(message, sessionId);
    }
  },
  
  /**
   * Handle product-related inquiries
   */
  handleProductInquiry(message, sessionId, context) {
    try {
      const productId = this.extractProductId(message);
      
      if (productId) {
        const productInfo = MercadoLibreService.getProductInfo(productId);
        
        if (productInfo.success) {
          const formattedInfo = this.formatProductInfo(productInfo.data);
          
          return {
            success: true,
            type: 'product_info',
            message: formattedInfo,
            data: productInfo.data,
            showMenu: true,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // General product inquiry with AI
      const aiContext = {
        userQuery: message,
        context: 'El usuario está preguntando sobre productos. Ayuda con información sobre disponibilidad, características, precios, y recomendaciones.',
        maxTokens: 300
      };
      
      return AIService.generateResponse(CONFIG.AI_PROVIDERS.GEMINI, aiContext);
      
    } catch (error) {
      Logger.log(`Error handling product inquiry: ${error.message}`);
      return this.handleDefault(message, sessionId);
    }
  },
  
  /**
   * Handle general AI conversations
   */
  handleGeneralAI(message, sessionId, context) {
    const aiContext = {
      userQuery: message,
      context: 'Conversación general de atención al cliente. Mantén un tono amigable y profesional.',
      maxTokens: 400
    };
    
    const aiResponse = AIService.generateResponse(CONFIG.AI_PROVIDERS.GEMINI, aiContext);
    
    if (aiResponse.success) {
      return {
        success: true,
        type: 'ai_chat',
        message: aiResponse.content,
        showMenu: true,
        timestamp: new Date().toISOString()
      };
    } else {
      return this.handleDefault(message, sessionId);
    }
  },
  
  /**
   * Handle chat escalation to human agents
   */
  handleChatEscalation(message, sessionId) {
    const currentTime = new Date();
    const businessHours = ConfigService.getBusinessHours();
    const isBusinessHours = MenuService.isWithinBusinessHours(currentTime, businessHours);
    
    LoggingService.logEscalation(sessionId, message, isBusinessHours ? 'pending' : 'after_hours');
    
    const escalationMessage = isBusinessHours 
      ? 'Te conectaré con un agente humano. Por favor espera un momento mientras te transfiero.'
      : 'Actualmente estamos fuera del horario de atención. Tu consulta será atendida en el próximo horario hábil.';
    
    return {
      success: true,
      type: 'escalation',
      message: escalationMessage,
      businessHours: isBusinessHours,
      showMenu: false,
      timestamp: currentTime.toISOString()
    };
  },
  
  /**
   * Default fallback response
   */
  handleDefault(message, sessionId) {
    return {
      success: true,
      type: 'default',
      message: 'Entiendo tu consulta. ¿Te gustaría ver el menú de opciones disponibles o prefieres que te conecte con un agente humano?',
      showMenu: true,
      timestamp: new Date().toISOString()
    };
  },
  
  // Helper methods
  
  getSessionContext(sessionId) {
    const properties = PropertiesService.getScriptProperties();
    const contextKey = `SESSION_${sessionId}`;
    const contextData = properties.getProperty(contextKey);
    
    return contextData ? JSON.parse(contextData) : {};
  },
  
  updateSessionContext(sessionId, updates) {
    const properties = PropertiesService.getScriptProperties();
    const contextKey = `SESSION_${sessionId}`;
    const currentContext = this.getSessionContext(sessionId);
    
    const newContext = { ...currentContext, ...updates };
    properties.setProperty(contextKey, JSON.stringify(newContext));
  },
  
  containsOrderKeywords(message) {
    const orderKeywords = ['pedido', 'orden', 'compra', 'envío', 'seguimiento', 'rastreo', 'entrega'];
    return orderKeywords.some(keyword => message.includes(keyword));
  },
  
  containsProductKeywords(message) {
    const productKeywords = ['producto', 'artículo', 'disponibilidad', 'precio', 'stock', 'característica'];
    return productKeywords.some(keyword => message.includes(keyword));
  },
  
  containsEscalationKeywords(message) {
    const escalationKeywords = ['agente', 'humano', 'persona', 'hablar', 'representante', 'ayuda directa'];
    return escalationKeywords.some(keyword => message.includes(keyword));
  },
  
  extractOrderId(message) {
    // Look for ML order ID patterns
    const orderIdPattern = /\b\d{12,}\b/;
    const match = message.match(orderIdPattern);
    return match ? match[0] : null;
  },
  
  extractProductId(message) {
    // Look for ML product ID patterns (MLA followed by numbers)
    const productIdPattern = /MLA\d+/i;
    const match = message.match(productIdPattern);
    return match ? match[0] : null;
  },
  
  formatOrderInfo(orderData) {
    return `📦 **Información del Pedido**
    
**Número:** ${orderData.id}
**Estado:** ${orderData.status}
**Total:** $${orderData.total_amount}
**Fecha:** ${new Date(orderData.date_created).toLocaleDateString()}

¿Necesitas más información sobre este pedido?`;
  },
  
  formatProductInfo(productData) {
    return `🛍️ **${productData.title}**
    
**Precio:** $${productData.price}
**Disponibles:** ${productData.available_quantity}
**Condición:** ${productData.condition}

¿Te interesa este producto o necesitas más información?`;
  }
};