import { NextApiRequest, NextApiResponse } from 'next';
import ClaudeAIService from '../../src/services/claudeAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Claude AI service instance to test
    const claudeService = new ClaudeAIService();
    
    // Check API key status
    const healthStatus = claudeService.getHealthStatus();
    
    // Get environment info
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
      anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 7) || 'none',
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      status: 'healthy',
      aiService: {
        status: healthStatus,
        available: healthStatus === 'healthy'
      },
      environment: environmentInfo,
      message: healthStatus === 'healthy' 
        ? 'AI service is operational' 
        : 'AI service is not available - check API key configuration'
    });

  } catch (error) {
    console.error('AI health check failed:', error);
    
    res.status(500).json({
      status: 'error',
      aiService: {
        status: 'unavailable',
        available: false
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
        anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 7) || 'none',
        timestamp: new Date().toISOString()
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AI service initialization failed'
    });
  }
}