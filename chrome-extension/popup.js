// ORCHESTR Chrome Extension - Popup Script

class OrchestrExtension {
  constructor() {
    this.settings = {
      apiUrl: '',
      apiKey: ''
    };
    this.missions = [];
    this.currentProfile = null;
    
    this.init();
  }

  async init() {
    // Load settings
    await this.loadSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check if we're on LinkedIn
    await this.checkCurrentPage();
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['apiUrl', 'apiKey']);
    this.settings.apiUrl = result.apiUrl || '';
    this.settings.apiKey = result.apiKey || '';
  }

  async saveSettings() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiUrl || !apiKey) {
      this.showResult('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    this.settings.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.settings.apiKey = apiKey;
    
    await chrome.storage.local.set({
      apiUrl: this.settings.apiUrl,
      apiKey: this.settings.apiKey
    });
    
    this.showResult('Paramètres enregistrés!', 'success');
    
    // Reload missions and show capture panel
    await this.loadMissions();
    await this.checkCurrentPage();
  }

  setupEventListeners() {
    // Save settings
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.showPanel('settings');
      document.getElementById('apiUrl').value = this.settings.apiUrl;
      document.getElementById('apiKey').value = this.settings.apiKey;
    });
    
    // Capture button
    document.getElementById('captureBtn').addEventListener('click', () => {
      this.captureProfile();
    });
  }

  async checkCurrentPage() {
    // If not configured, show settings
    if (!this.settings.apiUrl || !this.settings.apiKey) {
      this.showPanel('settings');
      this.updateStatus('warning');
      return;
    }
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('linkedin.com/in/')) {
      this.showPanel('notLinkedIn');
      this.updateStatus('warning');
      return;
    }
    
    // We're on a LinkedIn profile - extract data
    this.updateStatus('success');
    await this.loadMissions();
    await this.extractCurrentProfile(tab.id);
  }

  async extractCurrentProfile(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'extractProfile' });
      
      if (response.success) {
        this.currentProfile = response.data;
        this.updateProfilePreview();
        this.showPanel('capture');
      } else {
        this.showPanel('notLinkedIn');
      }
    } catch (error) {
      console.error('Error extracting profile:', error);
      // Content script might not be loaded yet
      this.showPanel('notLinkedIn');
    }
  }

  updateProfilePreview() {
    if (!this.currentProfile) return;
    
    const nameEl = document.getElementById('profileName');
    const headlineEl = document.getElementById('profileHeadline');
    
    nameEl.textContent = `${this.currentProfile.firstName} ${this.currentProfile.lastName}`;
    headlineEl.textContent = this.currentProfile.headline || 'Aucun headline';
  }

  async loadMissions() {
    if (!this.settings.apiUrl || !this.settings.apiKey) return;
    
    try {
      const response = await fetch(`${this.settings.apiUrl}/api/extension/capture`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.missions = data.missions || [];
        this.updateMissionSelect();
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    }
  }

  updateMissionSelect() {
    const select = document.getElementById('missionSelect');
    select.innerHTML = '<option value="">Vivier uniquement</option>';
    
    this.missions.forEach(mission => {
      const option = document.createElement('option');
      option.value = mission.id;
      option.textContent = `${mission.title} (${mission.clientName}) - ${mission.candidateCount} candidats`;
      select.appendChild(option);
    });
  }

  async captureProfile() {
    if (!this.currentProfile) {
      this.showResult('Aucun profil détecté', 'error');
      return;
    }
    
    const missionId = document.getElementById('missionSelect').value;
    
    this.showLoading(true);
    
    try {
      const response = await fetch(`${this.settings.apiUrl}/api/extension/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileData: this.currentProfile,
          missionId: missionId || undefined
        })
      });
      
      const data = await response.json();
      
      this.showLoading(false);
      
      if (response.ok) {
        let message = data.isNew ? 'Candidat ajouté!' : 'Candidat mis à jour!';
        
        if (data.score) {
          const scoreClass = data.score >= 70 ? 'high' : data.score >= 50 ? 'medium' : 'low';
          message += ` <span class="score-badge ${scoreClass}">${data.score}%</span>`;
        }
        
        this.showResult(message, 'success');
      } else {
        this.showResult(data.error || 'Erreur lors de la capture', 'error');
      }
    } catch (error) {
      console.error('Capture error:', error);
      this.showLoading(false);
      this.showResult('Erreur de connexion à l\'API', 'error');
    }
  }

  showPanel(panelName) {
    // Hide all panels
    document.getElementById('notLinkedIn').classList.add('hidden');
    document.getElementById('settingsPanel').classList.add('hidden');
    document.getElementById('capturePanel').classList.add('hidden');
    document.getElementById('loadingState').classList.add('hidden');
    
    // Show requested panel
    switch (panelName) {
      case 'notLinkedIn':
        document.getElementById('notLinkedIn').classList.remove('hidden');
        break;
      case 'settings':
        document.getElementById('settingsPanel').classList.remove('hidden');
        break;
      case 'capture':
        document.getElementById('capturePanel').classList.remove('hidden');
        break;
    }
  }

  showLoading(show) {
    const loadingEl = document.getElementById('loadingState');
    const capturePanel = document.getElementById('capturePanel');
    
    if (show) {
      capturePanel.classList.add('hidden');
      loadingEl.classList.remove('hidden');
    } else {
      loadingEl.classList.add('hidden');
      capturePanel.classList.remove('hidden');
    }
  }

  showResult(message, type) {
    const resultEl = document.getElementById('resultMessage');
    resultEl.innerHTML = message;
    resultEl.className = `result-message ${type}`;
    resultEl.classList.remove('hidden');
    
    // Auto hide after 5 seconds for success
    if (type === 'success') {
      setTimeout(() => {
        resultEl.classList.add('hidden');
      }, 5000);
    }
  }

  updateStatus(status) {
    const indicator = document.getElementById('statusIndicator');
    indicator.className = `status-indicator ${status}`;
  }
}

// Initialize extension when popup opens
document.addEventListener('DOMContentLoaded', () => {
  new OrchestrExtension();
});

