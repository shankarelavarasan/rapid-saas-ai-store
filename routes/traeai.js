const express = require('express');
const router = express.Router();
const traeAI = require('../services/traeAI');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Test Trae AI connection
router.get('/health', auth, async (req, res) => {
  try {
    const result = await traeAI.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Trae AI connection successful',
        data: result
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Trae AI service unavailable',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Trae AI health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Generate code using Trae AI
router.post('/generate', [
  auth,
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('language').optional().isString().withMessage('Language must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { prompt, language = 'javascript' } = req.body;
    
    const result = await traeAI.generateCode(prompt, language);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Code generated successfully',
        data: {
          code: result.code,
          explanation: result.explanation,
          language,
          prompt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Code generation failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Analyze code using Trae AI
router.post('/analyze', [
  auth,
  body('code').notEmpty().withMessage('Code is required'),
  body('language').optional().isString().withMessage('Language must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { code, language = 'javascript' } = req.body;
    
    const result = await traeAI.analyzeCode(code, language);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Code analyzed successfully',
        data: {
          analysis: result.analysis,
          suggestions: result.suggestions,
          complexity: result.complexity,
          language
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Code analysis failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Code analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Optimize code using Trae AI
router.post('/optimize', [
  auth,
  body('code').notEmpty().withMessage('Code is required'),
  body('language').optional().isString().withMessage('Language must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { code, language = 'javascript' } = req.body;
    
    const result = await traeAI.optimizeCode(code, language);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Code optimized successfully',
        data: {
          original_code: code,
          optimized_code: result.optimized_code,
          improvements: result.improvements,
          performance_gain: result.performance_gain,
          language
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Code optimization failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Code optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Generate documentation using Trae AI
router.post('/document', [
  auth,
  body('code').notEmpty().withMessage('Code is required'),
  body('language').optional().isString().withMessage('Language must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { code, language = 'javascript' } = req.body;
    
    const result = await traeAI.generateDocumentation(code, language);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Documentation generated successfully',
        data: {
          code,
          documentation: result.documentation,
          api_docs: result.api_docs,
          language
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Documentation generation failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Documentation generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;