/**
 * MercadoLibre Service - Handles ML API integrations
 * 
 * This service manages MercadoLibre API interactions:
 * - Token management and refresh
 * - Order and product queries
 * - Customer information retrieval
 * - Secure credential handling
 */

const MercadoLibreService = {
  
  /**
   * Get user orders from MercadoLibre
   * @param {string} userId - ML user ID
   * @param {Object} filters - Optional filters
   * @returns {Object} Orders data
   */
  getUserOrders(userId, filters = {}) {
    try {
      const token = this.getValidAccessToken();
      if (!token) {
        throw new Error('No valid access token available');
      }
      
      let endpoint = `https://api.mercadolibre.com/orders/search/recent?seller=${userId}`;
      
      // Add filters if provided
      if (filters.status) {
        endpoint += `&order.status=${filters.status}`;
      }
      if (filters.limit) {
        endpoint += `&limit=${filters.limit}`;
      }
      if (filters.offset) {
        endpoint += `&offset=${filters.offset}`;
      }
      
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200) {
        return {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`ML API error: ${responseData.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      Logger.log(`Error getting user orders: ${error.message}`);
      LoggingService.logError('getUserOrders', error, { userId, filters });
      
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Get order details by order ID
   * @param {string} orderId - MercadoLibre order ID
   * @returns {Object} Order details
   */
  getOrderDetails(orderId) {
    try {
      const token = this.getValidAccessToken();
      if (!token) {
        throw new Error('No valid access token available');
      }
      
      const endpoint = `https://api.mercadolibre.com/orders/${orderId}`;
      
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200) {
        return {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`ML API error: ${responseData.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      Logger.log(`Error getting order details: ${error.message}`);
      LoggingService.logError('getOrderDetails', error, { orderId });
      
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Get product information
   * @param {string} itemId - MercadoLibre item ID
   * @returns {Object} Product details
   */
  getProductInfo(itemId) {
    try {
      // Public endpoint - no authentication required
      const endpoint = `https://api.mercadolibre.com/items/${itemId}`;
      
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200) {
        return {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`ML API error: ${responseData.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      Logger.log(`Error getting product info: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Get valid access token, refreshing if necessary
   * @returns {string|null} Valid access token
   */
  getValidAccessToken() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const currentToken = properties.getProperty('ML_ACCESS_TOKEN');
      const expirationDate = properties.getProperty('ML_ACCESS_TOKEN_FECHA_EXPIRA');
      
      // Check if token exists and is not expired
      if (currentToken && expirationDate) {
        const expiry = new Date(expirationDate);
        const now = new Date();
        
        // Add 5-minute buffer before expiration
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (now.getTime() < (expiry.getTime() - bufferTime)) {
          return currentToken;
        }
      }
      
      // Token is expired or doesn't exist, try to refresh
      return this.refreshAccessToken();
      
    } catch (error) {
      Logger.log(`Error getting valid access token: ${error.message}`);
      return null;
    }
  },
  
  /**
   * Refresh access token using refresh token
   * @returns {string|null} New access token
   */
  refreshAccessToken() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const clientId = properties.getProperty('ML_CLIENT_ID');
      const clientSecret = properties.getProperty('ML_CLIENT_SECRET');
      const refreshToken = properties.getProperty('ML_REFRESH_TOKEN');
      
      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing required credentials for token refresh');
      }
      
      const endpoint = 'https://api.mercadolibre.com/oauth/token';
      
      const payload = {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      };
      
      const options = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        payload: Object.keys(payload)
          .map(key => `${key}=${encodeURIComponent(payload[key])}`)
          .join('&')
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200 && responseData.access_token) {
        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + responseData.expires_in);
        
        // Store new token and expiration
        const newProperties = {
          'ML_ACCESS_TOKEN': responseData.access_token,
          'ML_ACCESS_TOKEN_FECHA_EXPIRA': expirationDate.toISOString()
        };
        
        // Update refresh token if provided
        if (responseData.refresh_token) {
          newProperties['ML_REFRESH_TOKEN'] = responseData.refresh_token;
        }
        
        properties.setProperties(newProperties);
        
        Logger.log('Access token refreshed successfully');
        return responseData.access_token;
        
      } else {
        throw new Error(`Token refresh failed: ${responseData.error_description || 'Unknown error'}`);
      }
      
    } catch (error) {
      Logger.log(`Error refreshing access token: ${error.message}`);
      LoggingService.logError('refreshAccessToken', error);
      return null;
    }
  },
  
  /**
   * Test MercadoLibre API connection
   * @returns {Object} Test result
   */
  testConnection() {
    try {
      const token = this.getValidAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Could not obtain valid access token'
        };
      }
      
      // Test with a simple API call
      const properties = PropertiesService.getScriptProperties();
      const userId = properties.getProperty('ML_USER_ID');
      
      if (!userId) {
        return {
          success: false,
          error: 'ML_USER_ID not configured'
        };
      }
      
      const endpoint = `https://api.mercadolibre.com/users/${userId}`;
      
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = UrlFetchApp.fetch(endpoint, options);
      
      if (response.getResponseCode() === 200) {
        return {
          success: true,
          message: 'MercadoLibre API connection successful',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: `API test failed with status: ${response.getResponseCode()}`
        };
      }
      
    } catch (error) {
      Logger.log(`ML API test error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};