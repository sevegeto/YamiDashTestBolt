/**
 * Sheets Service - Handles Google Sheets operations
 * 
 * This service manages all Google Sheets interactions:
 * - Sheet initialization and structure setup
 * - Data reading and writing operations
 * - Template creation and validation
 * - Performance optimization with caching
 */

const SheetsService = {
  
  /**
   * Get spreadsheet instance
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} Spreadsheet object
   */
  getSpreadsheet() {
    try {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      
      if (!spreadsheetId) {
        throw new Error('SPREADSHEET_ID not configured in Script Properties');
      }
      
      return SpreadsheetApp.openById(spreadsheetId);
      
    } catch (error) {
      Logger.log(`Error getting spreadsheet: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get or create a specific sheet
   * @param {string} sheetName - Name of the sheet
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Sheet object
   */
  getSheet(sheetName) {
    try {
      const spreadsheet = this.getSpreadsheet();
      let sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        this.setupSheetStructure(sheet, sheetName);
      }
      
      return sheet;
      
    } catch (error) {
      Logger.log(`Error getting sheet ${sheetName}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Initialize all required sheets
   */
  initializeSheets() {
    try {
      Logger.log('Initializing sheets structure...');
      
      // Create menu configuration sheet
      const menuSheet = this.getSheet(CONFIG.SHEETS.MENU_SHEET);
      
      // Create logs sheet
      const logsSheet = this.getSheet(CONFIG.SHEETS.LOGS_SHEET);
      
      // Create settings sheet
      const settingsSheet = this.getSheet(CONFIG.SHEETS.SETTINGS_SHEET);
      
      Logger.log('Sheets initialization complete');
      
    } catch (error) {
      Logger.log(`Error initializing sheets: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Set up sheet structure based on sheet type
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet object
   * @param {string} sheetName - Name of the sheet
   */
  setupSheetStructure(sheet, sheetName) {
    try {
      switch (sheetName) {
        case CONFIG.SHEETS.MENU_SHEET:
          this.setupMenuSheet(sheet);
          break;
          
        case CONFIG.SHEETS.LOGS_SHEET:
          this.setupLogsSheet(sheet);
          break;
          
        case CONFIG.SHEETS.SETTINGS_SHEET:
          this.setupSettingsSheet(sheet);
          break;
          
        default:
          Logger.log(`Unknown sheet type: ${sheetName}`);
      }
      
    } catch (error) {
      Logger.log(`Error setting up sheet structure for ${sheetName}: ${error.message}`);
    }
  },
  
  /**
   * Set up menu configuration sheet
   */
  setupMenuSheet(sheet) {
    const headers = [
      'Número',
      'Título',
      'Tipo de Respuesta',
      'Respuesta Estática',
      'Proveedor IA',
      'Contexto IA',
      'Mensaje Escalación',
      'Mensaje Fuera Horario',
      'Respuesta Fallback',
      'Volver al Menú',
      'Activo',
      'Max Tokens'
    ];
    
    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4CAF50');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    
    // Add sample data
    const sampleData = [
      [1, 'Estado de mi pedido', 'ai', '', 'gemini', 'Ayuda con consultas sobre el estado de pedidos y seguimiento de envíos', '', '', 'Consulta el estado de tu pedido en tu cuenta', true, true, 300],
      [2, 'Información de productos', 'ai', '', 'gemini', 'Proporciona información sobre productos, precios y disponibilidad', '', '', 'Consulta nuestro catálogo en línea', true, true, 300],
      [3, 'Política de devoluciones', 'static', 'Puedes devolver productos dentro de 30 días. Visita nuestra sección de devoluciones para más detalles.', '', '', '', '', '', true, true, 0],
      [4, 'Hablar con un agente', 'escalate', '', '', '', 'Te conectamos con un agente humano', 'Fuera del horario de atención. Te contactaremos pronto.', '', false, true, 0],
      [0, 'Salir', 'static', 'Gracias por contactarnos. ¡Que tengas un excelente día!', '', '', '', '', '', false, true, 0]
    ];
    
    sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  },
  
  /**
   * Set up logs sheet
   */
  setupLogsSheet(sheet) {
    const headers = [
      'Timestamp',
      'Sesión ID',
      'Tipo Interacción',
      'Mensaje Usuario',
      'Respuesta Bot',
      'Proveedor IA',
      'Tiempo Respuesta (ms)',
      'Estado',
      'Metadata'
    ];
    
    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#2196F3');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  },
  
  /**
   * Set up settings sheet
   */
  setupSettingsSheet(sheet) {
    const settingsData = [
      ['Configuración', 'Valor', 'Descripción'],
      ['business_hours_start', '09:00', 'Hora de inicio de atención (HH:MM)'],
      ['business_hours_end', '18:00', 'Hora de fin de atención (HH:MM)'],
      ['business_days', 'Mon,Tue,Wed,Thu,Fri', 'Días de atención (separados por coma)'],
      ['greeting_business_hours', '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?', 'Saludo durante horario de atención'],
      ['greeting_after_hours', 'Hola. Actualmente estamos fuera del horario de atención, pero puedo ayudarte con algunas consultas básicas.', 'Saludo fuera del horario'],
      ['footer_message', 'Escribe el número de la opción que necesitas o describe tu consulta.', 'Mensaje al final del menú'],
      ['max_ai_tokens', '500', 'Límite máximo de tokens para respuestas IA'],
      ['default_ai_provider', 'gemini', 'Proveedor de IA por defecto (gemini/claude)'],
      ['escalation_timeout', '300', 'Tiempo límite para escalación (segundos)'],
      ['session_timeout', '1800', 'Tiempo límite de sesión (segundos)']
    ];
    
    // Set data
    sheet.getRange(1, 1, settingsData.length, settingsData[0].length).setValues(settingsData);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, settingsData[0].length);
    headerRange.setBackground('#FF9800');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, settingsData[0].length);
  },
  
  /**
   * Append data to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} data - Data array to append
   */
  appendData(sheetName, data) {
    try {
      const sheet = this.getSheet(sheetName);
      sheet.appendRow(data);
      
    } catch (error) {
      Logger.log(`Error appending data to ${sheetName}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get all data from a sheet
   * @param {string} sheetName - Name of the sheet
   * @returns {Array} Sheet data
   */
  getAllData(sheetName) {
    try {
      const sheet = this.getSheet(sheetName);
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        return []; // No data beyond headers
      }
      
      return sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      
    } catch (error) {
      Logger.log(`Error getting data from ${sheetName}: ${error.message}`);
      return [];
    }
  },
  
  /**
   * Update a specific cell
   * @param {string} sheetName - Name of the sheet
   * @param {number} row - Row number
   * @param {number} col - Column number
   * @param {*} value - Value to set
   */
  updateCell(sheetName, row, col, value) {
    try {
      const sheet = this.getSheet(sheetName);
      sheet.getRange(row, col).setValue(value);
      
    } catch (error) {
      Logger.log(`Error updating cell in ${sheetName}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Clear sheet data (keeping headers)
   * @param {string} sheetName - Name of the sheet
   */
  clearData(sheetName) {
    try {
      const sheet = this.getSheet(sheetName);
      const lastRow = sheet.getLastRow();
      
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
      }
      
    } catch (error) {
      Logger.log(`Error clearing data from ${sheetName}: ${error.message}`);
    }
  }
};