const axios = require('axios');

class TraeAIService {
  constructor() {
    this.apiUrl = process.env.TRAE_AI_API_URL || 'https://api.trae.ai';
    this.apiKey = process.env.TRAE_AI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('Trae AI API key not configured');
    }
  }

  async generateCode(prompt, language = 'javascript') {
    try {
      const response = await axios.post(`${this.apiUrl}/generate`, {
        prompt,
        language,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        code: response.data.code,
        explanation: response.data.explanation
      };
    } catch (error) {
      console.error('Trae AI code generation error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeCode(code, language = 'javascript') {
    try {
      const response = await axios.post(`${this.apiUrl}/analyze`, {
        code,
        language
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      return {
        success: true,
        analysis: response.data.analysis,
        suggestions: response.data.suggestions,
        complexity: response.data.complexity
      };
    } catch (error) {
      console.error('Trae AI code analysis error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async optimizeCode(code, language = 'javascript') {
    try {
      const response = await axios.post(`${this.apiUrl}/optimize`, {
        code,
        language,
        optimization_level: 'balanced'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        optimized_code: response.data.optimized_code,
        improvements: response.data.improvements,
        performance_gain: response.data.performance_gain
      };
    } catch (error) {
      console.error('Trae AI code optimization error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateDocumentation(code, language = 'javascript') {
    try {
      const response = await axios.post(`${this.apiUrl}/document`, {
        code,
        language,
        format: 'markdown'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      });

      return {
        success: true,
        documentation: response.data.documentation,
        api_docs: response.data.api_docs
      };
    } catch (error) {
      console.error('Trae AI documentation generation error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      return {
        success: true,
        status: response.data.status,
        version: response.data.version
      };
    } catch (error) {
      console.error('Trae AI connection test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TraeAIService();