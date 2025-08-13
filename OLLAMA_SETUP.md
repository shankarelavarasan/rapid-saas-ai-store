# Ollama Setup Guide - Free Local AI

This guide will help you set up Ollama for completely free AI-powered code generation in your Rapid SaaS AI Store.

## What is Ollama?

Ollama is a free, open-source tool that lets you run large language models locally on your machine. This means:
- ✅ **Completely Free** - No API costs
- ✅ **Privacy** - Your code never leaves your machine
- ✅ **Fast** - No network latency
- ✅ **Offline** - Works without internet

## Installation

### Windows
1. Download Ollama from: https://ollama.ai/download
2. Run the installer
3. Ollama will start automatically

### macOS
1. Download Ollama from: https://ollama.ai/download
2. Drag to Applications folder
3. Run Ollama from Applications

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Installing AI Models

After installing Ollama, you need to download AI models:

### Recommended Models for Code Generation

```bash
# CodeLlama - Best for code generation (3.8GB)
ollama pull codellama

# Llama 3.2 - General purpose, good for code (2GB)
ollama pull llama3.2

# DeepSeek Coder - Excellent for coding tasks (3.8GB)
ollama pull deepseek-coder

# Qwen2.5-Coder - Fast and efficient (4.7GB)
ollama pull qwen2.5-coder
```

### Model Sizes
- **Small models (1-3GB)**: Fast, good for simple tasks
- **Medium models (3-7GB)**: Balanced performance
- **Large models (7GB+)**: Best quality, slower

## Configuration

### 1. Update Your Environment Variables

Copy `.env.example` to `.env` and ensure these settings:

```env
# Use Ollama as your AI provider
TRAE_AI_PROVIDER=ollama
TRAE_AI_API_URL=http://localhost:11434
TRAE_AI_MODEL=codellama
TRAE_AI_API_KEY=
```

### 2. Test Your Setup

Start your development server:
```bash
npm run dev
```

Test the AI connection:
```bash
curl http://localhost:3000/api/traeai/health
```

You should see:
```json
{
  "success": true,
  "status": "Ollama server is running",
  "models": [...]
}
```

## Available Models

| Model | Size | Best For | Command |
|-------|------|----------|----------|
| CodeLlama | 3.8GB | Code generation | `ollama pull codellama` |
| Llama 3.2 | 2GB | General coding | `ollama pull llama3.2` |
| DeepSeek Coder | 3.8GB | Advanced coding | `ollama pull deepseek-coder` |
| Qwen2.5-Coder | 4.7GB | Fast coding | `ollama pull qwen2.5-coder` |
| Mistral | 4.1GB | Balanced performance | `ollama pull mistral` |

## Usage Examples

### Generate Code
```bash
curl -X POST http://localhost:3000/api/traeai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React component for a user profile card",
    "language": "javascript"
  }'
```

### Analyze Code
```bash
curl -X POST http://localhost:3000/api/traeai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript"
  }'
```

## Troubleshooting

### Ollama Not Running
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama (if not running)
ollama serve
```

### Model Not Found
```bash
# List installed models
ollama list

# Pull a model if missing
ollama pull codellama
```

### Performance Issues
- **Slow responses**: Try a smaller model like `llama3.2`
- **Out of memory**: Close other applications or use a smaller model
- **High CPU usage**: Normal during AI inference

### Connection Errors
- Ensure Ollama is running: `ollama serve`
- Check port 11434 is not blocked
- Verify `TRAE_AI_API_URL=http://localhost:11434`

## Switching Models

To use a different model, update your `.env` file:

```env
# For faster responses (smaller model)
TRAE_AI_MODEL=llama3.2

# For better code quality (larger model)
TRAE_AI_MODEL=deepseek-coder
```

Restart your server after changing models.

## System Requirements

### Minimum
- **RAM**: 8GB
- **Storage**: 10GB free space
- **CPU**: Any modern processor

### Recommended
- **RAM**: 16GB+
- **Storage**: 20GB+ free space
- **CPU**: Multi-core processor
- **GPU**: Optional, but speeds up inference

## Benefits of Local AI

1. **Cost**: Completely free after initial setup
2. **Privacy**: Your code stays on your machine
3. **Speed**: No network latency
4. **Reliability**: Works offline
5. **Customization**: Fine-tune models for your needs

## Next Steps

1. Install Ollama
2. Download a code model (`ollama pull codellama`)
3. Update your `.env` file
4. Test the integration
5. Start building AI-powered features!

## Support

- **Ollama Documentation**: https://ollama.ai/docs
- **Model Library**: https://ollama.ai/library
- **GitHub Issues**: https://github.com/ollama/ollama/issues

Enjoy your free, local AI-powered development experience! 🚀