import React, { useState } from 'react';
import { 
  Bot, 
  FileSpreadsheet, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Code,
  MessageSquare,
  Zap,
  Database,
  Key,
  Cloud
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<'setup' | 'test' | 'usage'>('setup');
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'spreadsheet',
      title: '1. Create Google Spreadsheet',
      description: 'Create a new Google Sheets document for configuration',
      completed: false
    },
    {
      id: 'apps-script',
      title: '2. Set up Google Apps Script',
      description: 'Create and configure the Apps Script project',
      completed: false
    },
    {
      id: 'properties',
      title: '3. Configure Script Properties',
      description: 'Add API keys and credentials',
      completed: false
    },
    {
      id: 'initialize',
      title: '4. Initialize System',
      description: 'Run setup functions to create sheets and configuration',
      completed: false
    },
    {
      id: 'test',
      title: '5. Test System',
      description: 'Verify all components are working',
      completed: false
    }
  ]);

  const toggleStepCompletion = (stepId: string) => {
    setSetupSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const SetupGuide = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
        <div className="flex justify-center mb-4">
          <Bot className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Customer Service Chatbot Setup
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A comprehensive AI-powered chatbot backend with Google Apps Script, 
          Google Sheets, and MercadoLibre integration.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Setup Progress</h2>
          <span className="text-sm text-gray-500">
            {setupSteps.filter(s => s.completed).length} of {setupSteps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
            style={{ width: `${(setupSteps.filter(s => s.completed).length / setupSteps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-6">
        {setupSteps.map((step, index) => (
          <div key={step.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleStepCompletion(step.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {step.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Details */}
            <div className="px-6 pb-6 border-t bg-gray-50">
              {step.id === 'spreadsheet' && <SpreadsheetSetup />}
              {step.id === 'apps-script' && <AppsScriptSetup />}
              {step.id === 'properties' && <PropertiesSetup />}
              {step.id === 'initialize' && <InitializeSetup />}
              {step.id === 'test' && <TestSetup />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SpreadsheetSetup = () => (
    <div className="pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
        <FileSpreadsheet className="w-4 h-4" />
        <span>Google Sheets Setup</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</div>
          <div>
            <p className="text-sm font-medium text-gray-900">Create New Spreadsheet</p>
            <p className="text-sm text-gray-600">Go to Google Sheets and create a new spreadsheet named "Chatbot Configuration and Logs"</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</div>
          <div>
            <p className="text-sm font-medium text-gray-900">Copy Spreadsheet ID</p>
            <p className="text-sm text-gray-600">From the URL, copy the long string after '/d/' and before '/edit'</p>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
              https://docs.google.com/spreadsheets/d/<span className="bg-yellow-200">SPREADSHEET_ID_HERE</span>/edit
            </div>
          </div>
        </div>
      </div>

      <a 
        href="https://sheets.google.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <ExternalLink className="w-4 h-4" />
        <span>Open Google Sheets</span>
      </a>
    </div>
  );

  const AppsScriptSetup = () => (
    <div className="pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
        <Code className="w-4 h-4" />
        <span>Google Apps Script Setup</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">1</div>
          <div>
            <p className="text-sm font-medium text-gray-900">Create New Project</p>
            <p className="text-sm text-gray-600">Go to Google Apps Script and create a new project named "Customer Service Chatbot"</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">2</div>
          <div>
            <p className="text-sm font-medium text-gray-900">Upload Source Files</p>
            <p className="text-sm text-gray-600">Delete default Code.gs and upload these files from the src/ folder:</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {['main.gs', 'menuService.gs', 'aiService.gs', 'mercadolibreService.gs', 'chatService.gs', 'sheetsService.gs', 'configService.gs', 'loggingService.gs'].map(file => (
                <div key={file} className="p-2 bg-gray-100 rounded font-mono">{file}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <a 
        href="https://script.google.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <ExternalLink className="w-4 h-4" />
        <span>Open Google Apps Script</span>
      </a>
    </div>
  );

  const PropertiesSetup = () => (
    <div className="pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
        <Key className="w-4 h-4" />
        <span>Script Properties Configuration</span>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Required Properties</p>
            <p className="text-sm text-yellow-700">Add these properties in Apps Script → Project Settings → Script Properties</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Required</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <code className="text-sm font-mono">SPREADSHEET_ID</code>
                  <button 
                    onClick={() => copyToClipboard('SPREADSHEET_ID')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your spreadsheet ID from step 1</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <code className="text-sm font-mono">GEMINI_API_KEY</code>
                  <button 
                    onClick={() => copyToClipboard('GEMINI_API_KEY')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Get from Google AI Studio</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Optional</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <code className="text-sm font-mono">CLAUDE_API_KEY</code>
                <p className="text-xs text-gray-500 mt-1">Anthropic Claude API</p>
              </div>
              <div className="p-3 border rounded-lg">
                <code className="text-sm font-mono">ML_CLIENT_ID</code>
                <p className="text-xs text-gray-500 mt-1">MercadoLibre integration</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Get API Keys:</h4>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
            >
              <span>Gemini API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://console.anthropic.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm"
            >
              <span>Claude API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://developers.mercadolibre.com.ar/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-sm"
            >
              <span>MercadoLibre API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const InitializeSetup = () => (
    <div className="pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
        <Settings className="w-4 h-4" />
        <span>System Initialization</span>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-gray-600">Run these functions in order in the Apps Script editor:</p>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">setupCredentials()</code>
                <button 
                  onClick={() => copyToClipboard('setupCredentials()')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Creates initial property structure</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">initializeSystem()</code>
                <button 
                  onClick={() => copyToClipboard('initializeSystem()')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Sets up sheets and default configuration</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            After running these functions, your spreadsheet will have three sheets:
            <br />• <strong>Menu_Config</strong> - Configure chatbot options
            <br />• <strong>Chat_Logs</strong> - Automatic interaction logging  
            <br />• <strong>Settings</strong> - System configuration
          </p>
        </div>
      </div>
    </div>
  );

  const TestSetup = () => (
    <div className="pt-4 space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
        <Play className="w-4 h-4" />
        <span>System Testing</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">1</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">testSystem()</code>
              <button 
                onClick={() => copyToClipboard('testSystem()')}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Runs comprehensive system tests</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            This function will test:
            <br />• Menu generation and configuration
            <br />• AI service connections (Gemini/Claude)
            <br />• MercadoLibre API integration
            <br />• Google Sheets operations
          </p>
        </div>
      </div>
    </div>
  );

  const TestInterface = () => (
    <div className="space-y-6">
      <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8">
        <div className="flex justify-center mb-4">
          <MessageSquare className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Test Your Chatbot
        </h2>
        <p className="text-gray-600">
          Interactive testing interface for your chatbot system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Direct Function Testing</h3>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono">handleChatbotRequest({`{action: 'getMenu'}`})</code>
              <p className="text-xs text-gray-500 mt-2">Returns the current menu configuration</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono">handleChatbotRequest({`{action: 'processSelection', userInput: '1', sessionId: 'test123'}`})</code>
              <p className="text-xs text-gray-500 mt-2">Process menu option selection</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Web App Testing</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Deploy as web app for HTTP API access:</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <code className="text-xs font-mono">
{`fetch('YOUR_WEBAPP_URL?action=getMenu')
.then(r => r.json())
.then(console.log)`}
              </code>
            </div>
            <p className="text-xs text-gray-500">Replace YOUR_WEBAPP_URL with your deployment URL</p>
          </div>
        </div>
      </div>
    </div>
  );

  const UsageGuide = () => (
    <div className="space-y-6">
      <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8">
        <div className="flex justify-center mb-4">
          <Zap className="w-16 h-16 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How to Use Your Chatbot
        </h2>
        <p className="text-gray-600">
          Integration options and usage examples
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cloud className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Web App Deployment</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Deploy as a web app for REST API access:</p>
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-2">
              <p><span className="font-semibold">1.</span> Apps Script → Deploy → New Deployment</p>
              <p><span className="font-semibold">2.</span> Type: Web app</p>
              <p><span className="font-semibold">3.</span> Execute as: Me</p>
              <p><span className="font-semibold">4.</span> Access: Anyone (or as needed)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Customize your chatbot via Google Sheets:</p>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <span className="font-semibold">Menu_Config:</span> Add/edit menu options
              </div>
              <div className="p-2 bg-green-50 rounded">
                <span className="font-semibold">Settings:</span> Business hours, AI settings
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <span className="font-semibold">Chat_Logs:</span> View interaction analytics
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">WhatsApp Integration</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <code className="text-xs font-mono">
{`// Webhook endpoint
app.post('/webhook', (req, res) => {
  const response = handleChatbotRequest({
    action: 'sendMessage',
    userInput: req.body.message,
    sessionId: req.body.from
  });
  
  // Send to WhatsApp API
  sendWhatsAppMessage(req.body.from, response.message);
});`}
              </code>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Website Chat Widget</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <code className="text-xs font-mono">
{`// JavaScript integration
const chatbot = {
  sendMessage: async (message) => {
    const response = await fetch(WEBAPP_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'sendMessage',
        userInput: message,
        sessionId: getUserSession()
      })
    });
    return response.json();
  }
};`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border">
            {[
              { id: 'setup', label: 'Setup Guide', icon: Settings },
              { id: 'test', label: 'Testing', icon: Play },
              { id: 'usage', label: 'Usage', icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'setup' && <SetupGuide />}
        {activeTab === 'test' && <TestInterface />}
        {activeTab === 'usage' && <UsageGuide />}
      </div>
    </div>
  );
}

export default App;