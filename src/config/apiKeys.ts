// Configuración de API Keys para Iconik Pro Gym
// IMPORTANTE: Para producción, usa EAS Secrets en lugar de hardcodear

export const API_KEYS = {
  // OpenAI API Key para análisis de nutrición con IA
  // Obtén tu key en: https://platform.openai.com/api-keys
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your_openai_api_key_here',
  
  // Hugging Face Token (alternativa gratuita)
  // Obtén tu token en: https://huggingface.co/settings/tokens
  HUGGING_FACE_TOKEN: process.env.EXPO_PUBLIC_HUGGING_FACE_TOKEN || 'hf_your_hugging_face_token_here',
  
  // Firebase ya está configurado en google-services.json y GoogleService-Info.plist
};

// Función para validar que las API keys estén configuradas
export const validateAPIKeys = () => {
  const issues: string[] = [];
  
  if (!API_KEYS.OPENAI_API_KEY || API_KEYS.OPENAI_API_KEY === 'your-openai-api-key-here') {
    issues.push('OpenAI API Key no configurada');
  }
  
  if (!API_KEYS.HUGGING_FACE_TOKEN || API_KEYS.HUGGING_FACE_TOKEN === 'hf_your_hugging_face_token_here') {
    issues.push('Hugging Face Token no configurado');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ API Keys no configuradas:', issues.join(', '));
    console.log('📝 Para configurar las API keys:');
    console.log('1. Crea un archivo .env en la raíz del proyecto');
    console.log('2. Agrega: EXPO_PUBLIC_OPENAI_API_KEY=tu_api_key_aqui');
    console.log('3. O modifica directamente este archivo');
  }
  
  return issues.length === 0;
};

// Función para verificar que la API key de OpenAI sea válida
export const validateOpenAIKey = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEYS.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ OpenAI API Key válida');
      return true;
    } else {
      console.warn('⚠️ OpenAI API Key inválida o expirada');
      return false;
    }
  } catch (error) {
    console.error('❌ Error validando OpenAI API Key:', error);
    return false;
  }
};

// Función para obtener el estado de las API keys
export const getAPIKeysStatus = () => {
  return {
    openai: {
      configured: !!API_KEYS.OPENAI_API_KEY && API_KEYS.OPENAI_API_KEY !== 'your-openai-api-key-here',
      key: API_KEYS.OPENAI_API_KEY ? `${API_KEYS.OPENAI_API_KEY.substring(0, 10)}...` : 'No configurada'
    },
    huggingface: {
      configured: !!API_KEYS.HUGGING_FACE_TOKEN && API_KEYS.HUGGING_FACE_TOKEN !== 'hf_your_hugging_face_token_here',
      token: API_KEYS.HUGGING_FACE_TOKEN ? `${API_KEYS.HUGGING_FACE_TOKEN.substring(0, 10)}...` : 'No configurado'
    }
  };
};

export default API_KEYS;
