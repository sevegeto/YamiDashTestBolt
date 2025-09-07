/**
 * Configuration Service - Manages system configuration
 * 
 * This service handles configuration management:
 * - Reading settings from Google Sheets
 * - Caching configuration for performance
 * - Providing default values and validation
 * - Managing business hours and operational settings
 */

const ConfigService = {
  
  // Cache for configuration data
  _configCache: null,
  _cacheExpiry: null,
  _cacheTimeout: 5 * 60 * 1000, // 5 minutes
  
  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = null) {
    try {
      const config = this.getConfig();
      return config[key] !== undefined ? config[key] : defaultValue;
      
    } catch (error) {
      Logger.log(`Error getting config for ${key}: ${error.message}`);
      return defaultValue;
    }
  },
  
  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Value to set
   */
  set(key, value) {
    try {
      const sheet = SheetsService.getSheet(CONFIG.SHEETS.SETTINGS_SHEET);
      const data = sheet.getDataRange().getValues();
      
      // Find existing key
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          rowIndex = i + 1; // +1 for 1-based indexing
          break;
        }
      }
      
      if (rowIndex > 0) {
        // Update existing key
        sheet.getRange(rowIndex, 2).setValue(value);
      } else {
        // Add new key
        sheet.appendRow([key, value, '']);
      }
      
      // Clear cache to force reload
      this._configCache = null;
      this._cacheExpiry = null;
      
    } catch (error) {
      Logger.log(`Error setting config for ${key}: ${error.message}`);
    }
  },
  
  /**
   * Get all configuration as object
   * @returns {Object} Configuration object
   */
  getConfig() {
    try {
      // Check cache first
      if (this._configCache && this._cacheExpiry && Date.now() < this._cacheExpiry) {
        return this._configCache;
      }
      
      const sheet = SheetsService.getSheet(CONFIG.SHEETS.SETTINGS_SHEET);
      const data = sheet.getDataRange().getValues();
      
      const config = {};
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const [key, value] = data[i];
        if (key) {
          config[key] = this.parseConfigValue(value);
        }
      }
      
      // Cache the configuration
      this._configCache = config;
      this._cacheExpiry = Date.now() + this._cacheTimeout;
      
      return config;
      
    } catch (error) {
      Logger.log(`Error getting config: ${error.message}`);
      return this.getDefaultConfig();
    }
  },
  
  /**
   * Parse configuration value to appropriate type
   * @param {*} value - Raw value from sheet
   * @returns {*} Parsed value
   */
  parseConfigValue(value) {
    if (typeof value === 'string') {
      // Try to parse as number
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
      
      // Try to parse as boolean
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      
      // Return as string
      return value;
    }
    
    return value;
  },
  
  /**
   * Get business hours configuration
   * @returns {Object} Business hours object
   */
  getBusinessHours() {
    try {
      const config = this.getConfig();
      
      const startTime = config.business_hours_start || '09:00';
      const endTime = config.business_hours_end || '18:00';
      const businessDays = config.business_days || 'Mon,Tue,Wed,Thu,Fri';
      
      // Parse business days
      const daysMap = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3,
        'Thu': 4, 'Fri': 5, 'Sat': 6
      };
      
      const activeDays = businessDays.split(',').map(day => daysMap[day.trim()]);
      
      // Create schedule object
      const schedule = {};
      for (let i = 0; i < 7; i++) {
        schedule[i] = {
          open: activeDays.includes(i),
          start: startTime,
          end: endTime
        };
      }
      
      return {
        schedule: schedule,
        display: `${startTime} - ${endTime}, ${businessDays}`,
        timezone: 'America/Argentina/Buenos_Aires' // Adjust as needed
      };
      
    } catch (error) {
      Logger.log(`Error getting business hours: ${error.message}`);
      return this.getDefaultBusinessHours();
    }
  },
  
  /**
   * Get greeting messages
   * @returns {Object} Greeting messages
   */
  getGreetings() {
    const config = this.getConfig();
    
    return {
      businessHours: config.greeting_business_hours || 
        '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?',
      afterHours: config.greeting_after_hours || 
        'Hola. Actualmente estamos fuera del horario de atención, pero puedo ayudarte con algunas consultas básicas.'
    };
  },
  
  /**
   * Get footer message
   * @returns {string} Footer message
   */
  getFooterMessage() {
    const config = this.getConfig();
    return config.footer_message || 'Escribe el número de la opción que necesitas o describe tu consulta.';
  },
  
  /**
   * Get AI configuration
   * @returns {Object} AI configuration
   */
  getAIConfig() {
    const config = this.getConfig();
    
    return {
      defaultProvider: config.default_ai_provider || 'gemini',
      maxTokens: config.max_ai_tokens || 500,
      timeout: config.ai_timeout || 30000
    };
  },
  
  /**
   * Initialize configuration with default values
   */
  initializeConfig() {
    try {
      const sheet = SheetsService.getSheet(CONFIG.SHEETS.SETTINGS_SHEET);
      
      // Check if configuration is already initialized
      const existingData = sheet.getDataRange().getValues();
      if (existingData.length > 1) {
        Logger.log('Configuration already initialized');
        return;
      }
      
      Logger.log('Initializing default configuration...');
      
      // Configuration will be set up by setupSettingsSheet in SheetsService
      // This method just ensures the sheet exists
      
    } catch (error) {
      Logger.log(`Error initializing config: ${error.message}`);
    }
  },
  
  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      business_hours_start: '09:00',
      business_hours_end: '18:00',
      business_days: 'Mon,Tue,Wed,Thu,Fri',
      greeting_business_hours: '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?',
      greeting_after_hours: 'Hola. Actualmente estamos fuera del horario de atención, pero puedo ayudarte con algunas consultas básicas.',
      footer_message: 'Escribe el número de la opción que necesitas o describe tu consulta.',
      max_ai_tokens: 500,
      default_ai_provider: 'gemini',
      escalation_timeout: 300,
      session_timeout: 1800
    };
  },
  
  /**
   * Get default business hours
   * @returns {Object} Default business hours
   */
  getDefaultBusinessHours() {
    return {
      schedule: {
        0: { open: false }, // Sunday
        1: { open: true, start: '09:00', end: '18:00' }, // Monday
        2: { open: true, start: '09:00', end: '18:00' }, // Tuesday
        3: { open: true, start: '09:00', end: '18:00' }, // Wednesday
        4: { open: true, start: '09:00', end: '18:00' }, // Thursday
        5: { open: true, start: '09:00', end: '18:00' }, // Friday
        6: { open: false } // Saturday
      },
      display: '09:00 - 18:00, Mon-Fri',
      timezone: 'America/Argentina/Buenos_Aires'
    };
  },
  
  /**
   * Clear configuration cache
   */
  clearCache() {
    this._configCache = null;
    this._cacheExpiry = null;
  },
  
  /**
   * Validate configuration
   * @returns {Object} Validation result
   */
  validateConfig() {
    const errors = [];
    const config = this.getConfig();
    
    // Validate business hours
    if (!config.business_hours_start || !config.business_hours_end) {
      errors.push('Business hours not properly configured');
    }
    
    // Validate AI settings
    if (!config.default_ai_provider) {
      errors.push('Default AI provider not specified');
    }
    
    // Validate numeric values
    if (isNaN(config.max_ai_tokens)) {
      errors.push('Invalid max_ai_tokens value');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
};