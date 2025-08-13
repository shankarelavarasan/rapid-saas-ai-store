const axios = require('axios');

class TraeAIService {
  constructor() {
    // Default to Ollama for free local AI
    this.apiUrl = process.env.TRAE_AI_API_URL || 'http://localhost:11434';
    this.apiKey = process.env.TRAE_AI_API_KEY || null;
    this.model = process.env.TRAE_AI_MODEL || 'codellama';
    this.provider = process.env.TRAE_AI_PROVIDER || 'ollama';
    
    if (!this.apiKey && this.provider !== 'ollama') {
      console.warn('Trae AI API key not configured');
    }
  }

  async generateCode(prompt, language = 'javascript') {
    try {
      let response;
      
      if (this.provider === 'ollama') {
        // Ollama API format
        response = await axios.post(`${this.apiUrl}/api/generate`, {
          model: this.model,
          prompt: `Generate ${language} code for: ${prompt}\n\nCode:`,
          stream: false
        }, {
          timeout: 30000
        });
        
        return {
          success: true,
          code: response.data.response,
          explanation: `Generated ${language} code using ${this.model}`
        };
      } else {
        // Original Trae AI API format
        response = await axios.post(`${this.apiUrl}/generate`, {
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
      }
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
      let response;
      
      if (this.provider === 'ollama') {
        // Ollama API format
        response = await axios.post(`${this.apiUrl}/api/generate`, {
          model: this.model,
          prompt: `Analyze this ${language} code and provide suggestions for improvement:\n\n${code}\n\nAnalysis:`,
          stream: false
        }, {
          timeout: 20000
        });
        
        return {
          success: true,
          analysis: response.data.response,
          suggestions: ['Code analyzed using local AI model'],
          complexity: 'Unknown'
        };
      } else {
        // Original Trae AI API format
        response = await axios.post(`${this.apiUrl}/analyze`, {
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
      }
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
      let response;
      
      if (this.provider === 'ollama') {
        // Ollama API format
        response = await axios.post(`${this.apiUrl}/api/generate`, {
          model: this.model,
          prompt: `Optimize this ${language} code for better performance and readability:\n\n${code}\n\nOptimized code:`,
          stream: false
        }, {
          timeout: 30000
        });
        
        return {
          success: true,
          optimized_code: response.data.response,
          improvements: ['Code optimized using local AI model'],
          performance_gain: 'Estimated improvement'
        };
      } else {
        // Original Trae AI API format
        response = await axios.post(`${this.apiUrl}/optimize`, {
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
      }
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
      let response;
      
      if (this.provider === 'ollama') {
        // Ollama API format
        response = await axios.post(`${this.apiUrl}/api/generate`, {
          model: this.model,
          prompt: `Generate comprehensive documentation for this ${language} code in markdown format:\n\n${code}\n\nDocumentation:`,
          stream: false
        }, {
          timeout: 25000
        });
        
        return {
          success: true,
          documentation: response.data.response,
          api_docs: 'Generated using local AI model'
        };
      } else {
        // Original Trae AI API format
        response = await axios.post(`${this.apiUrl}/document`, {
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
      }
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
      let response;
      
      if (this.provider === 'ollama') {
        // Test Ollama connection
        response = await axios.get(`${this.apiUrl}/api/tags`, {
          timeout: 10000
        });
        
        return {
          success: true,
          status: 'Ollama server is running',
          version: 'Local Ollama instance',
          models: response.data.models || []
        };
      } else {
        // Original Trae AI API format
        response = await axios.get(`${this.apiUrl}/health`, {
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
      }
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