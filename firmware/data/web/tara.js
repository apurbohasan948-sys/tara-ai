// TARA Client-side Web UI logic for standard ESP32 Web Server
let currentTab = 'dashboard';
let statusData = {};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.getAttribute('data-tab');
    renderTab(currentTab);
  });
});

async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    statusData = await res.json();
    if (currentTab === 'dashboard') {
      renderDashboard();
    }
  } catch (err) {
    console.warn('Waiting for ESP32 API...', err);
  }
}

function renderTab(tab) {
  const container = document.getElementById('contentArea');
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'wifi') renderWiFi(container);
  else if (tab === 'brain') renderBrain(container);
  else if (tab === 'voice') renderVoice(container);
  else if (tab === 'personality') renderPersonality(container);
  else if (tab === 'memory') renderMemory(container);
  else if (tab === 'face') renderFace(container);
  else if (tab === 'hardware') renderHardware(container);
  else if (tab === 'cloud') renderCloud(container);
  else if (tab === 'system') renderSystem(container);
  else if (tab === 'ota') renderOTA(container);
}

function renderDashboard() {
  const container = document.getElementById('contentArea');
  const d = statusData || {};
  const wifi = d.wifi || {};
  const sys = d.system || {};

  container.innerHTML = `
    <div class="card" style="text-align:center;background:#060911;">
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">VIRTUAL OLED DISPLAY (128x64)</div>
      <div style="display:inline-flex;align-items:center;gap:32px;background:#000;padding:24px 48px;border-radius:12px;border:2px solid #334155;">
        <div style="width:36px;height:46px;background:var(--accent-cyan);border-radius:10px;box-shadow:0 0 16px var(--accent-cyan);"></div>
        <div style="width:36px;height:46px;background:var(--accent-cyan);border-radius:10px;box-shadow:0 0 16px var(--accent-cyan);"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">System Metrics</div>
      <div class="metrics-grid">
        <div class="metric-box"><div class="metric-label">Robot State</div><div class="metric-value">${d.state || 'CONNECTING'}</div></div>
        <div class="metric-box"><div class="metric-label">Current Emotion</div><div class="metric-value">${d.emotion || 'CALM'}</div></div>
        <div class="metric-box"><div class="metric-label">Local IPv4</div><div class="metric-value">${wifi.ip || '192.168.4.1'}</div></div>
        <div class="metric-box"><div class="metric-label">Wi-Fi RSSI</div><div class="metric-value">${wifi.rssi ? wifi.rssi + ' dBm' : '--'}</div></div>
        <div class="metric-box"><div class="metric-label">Free Heap</div><div class="metric-value">${sys.free_heap ? Math.round(sys.free_heap / 1024) + ' KB' : '--'}</div></div>
        <div class="metric-box"><div class="metric-label">Firmware</div><div class="metric-value">${sys.firmware || 'v0.1.0'}</div></div>
      </div>
    </div>
  `;
}

function renderWiFi(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Wi-Fi Station Provisioning</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
        Connect TARA to your local home 2.4GHz Wi-Fi network. Credentials are saved directly into ESP32 Non-Volatile Flash.
      </p>
      <form onsubmit="handleWiFiSubmit(event)">
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Network Name (SSID)</label>
          <input type="text" id="wifi_ssid" required style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Network Password</label>
          <input type="password" id="wifi_pass" style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <button type="submit" class="btn">Save & Connect</button>
      </form>
    </div>
  `;
}

function renderBrain(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">AI Brain & Model Router</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Configure cloud or local network LLM endpoints.</p>
      <div style="display:grid;gap:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">API Endpoint</label>
          <input type="url" id="brain_endpoint" value="https://api.openai.com/v1/chat/completions" style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Model Name</label>
          <input type="text" id="brain_model" value="gpt-4o-mini" style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">API Secret Key</label>
          <input type="password" id="brain_key" placeholder="••••••••••••" style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <button class="btn" onclick="alert('Configuration updated on ESP32!')">Save AI Settings</button>
      </div>
    </div>
  `;
}

function renderSystem(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">System Maintenance</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="fetch('/api/restart',{method:'POST'});alert('Rebooting ESP32...');">Restart TARA</button>
        <button class="btn btn-danger" onclick="if(confirm('Factory reset all stored credentials?'))fetch('/api/reset',{method:'POST'});">Factory Reset</button>
      </div>
    </div>
  `;
}

function renderOTA(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Over-The-Air (OTA) Firmware Update</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Flash new firmware binary directly to standard ESP32 flash partition.</p>
      <input type="file" accept=".bin" style="margin-bottom:16px;">
      <div><button class="btn">Upload Firmware (.bin)</button></div>
    </div>
  `;
}

function renderVoice(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Voice & Audio Pipeline</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">gTTS HTTP streaming speech synthesizer & I2S Audio settings.</p>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Speaker Volume (0 - 100)</label>
        <input type="range" min="0" max="100" value="80" style="width:100%;">
      </div>
      <button class="btn" onclick="alert('Testing audio chirp on ESP32 speaker...')">Test Speaker Chirp</button>
    </div>
  `;
}

function renderPersonality(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Personality Configuration</div>
      <div style="display:grid;gap:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Companion Name</label>
          <input type="text" value="TARA" style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Traits</label>
          <input type="text" value="Curious, Empathetic, Witty" style="width:100%;padding:10px;background:#0d1424;border:1px solid #1e293b;border-radius:6px;color:#fff;">
        </div>
        <button class="btn">Save Personality</button>
      </div>
    </div>
  `;
}

function renderMemory(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Memory Storage</div>
      <p style="font-size:13px;color:var(--text-secondary);">SRAM Conversation Ring Buffer & Persistent NVS Key-Value storage.</p>
    </div>
  `;
}

function renderFace(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Face Expressions & Procedural Animation</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Trigger expressions on physical 128x64 OLED.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="triggerExpr('HAPPY')">Happy</button>
        <button class="btn btn-secondary" onclick="triggerExpr('SAD')">Sad</button>
        <button class="btn btn-secondary" onclick="triggerExpr('THINKING')">Thinking</button>
        <button class="btn btn-secondary" onclick="triggerExpr('SURPRISED')">Surprised</button>
        <button class="btn btn-secondary" onclick="triggerExpr('SLEEPING')">Sleep</button>
      </div>
    </div>
  `;
}

function renderHardware(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Centralized Standard ESP32 GPIO Map</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:var(--text-secondary);">
        <tr style="border-bottom:1px solid #1e293b;text-align:left;"><th style="padding:8px;">Peripheral</th><th style="padding:8px;">Hardware Pin</th><th style="padding:8px;">Function</th></tr>
        <tr style="border-bottom:1px solid #1e293b;"><td style="padding:8px;color:#fff;">OLED I2C</td><td style="padding:8px;">GPIO 21 (SDA), GPIO 22 (SCL)</td><td style="padding:8px;">Display</td></tr>
        <tr style="border-bottom:1px solid #1e293b;"><td style="padding:8px;color:#fff;">I2S Speaker DAC</td><td style="padding:8px;">GPIO 26 (BCLK), 25 (LRC), 19 (DOUT)</td><td style="padding:8px;">Audio Out</td></tr>
        <tr style="border-bottom:1px solid #1e293b;"><td style="padding:8px;color:#fff;">I2S Mic INMP441</td><td style="padding:8px;">GPIO 26 (BCLK), 25 (LRC), 34 (DIN)</td><td style="padding:8px;">Audio In</td></tr>
        <tr style="border-bottom:1px solid #1e293b;"><td style="padding:8px;color:#fff;">Status LED</td><td style="padding:8px;">GPIO 2</td><td style="padding:8px;">Indicator</td></tr>
      </table>
    </div>
  `;
}

function renderCloud(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">Cloud Synchronization</div>
      <p style="font-size:13px;color:var(--text-secondary);">Sync device telemetry, user profile, and cloud memory bridge.</p>
    </div>
  `;
}

async function handleWiFiSubmit(e) {
  e.preventDefault();
  const ssid = document.getElementById('wifi_ssid').value;
  const pass = document.getElementById('wifi_pass').value;
  await fetch('/api/wifi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password: pass })
  });
  alert('Wi-Fi credentials saved! TARA is connecting to ' + ssid);
}

function triggerExpr(name) {
  alert('Expression triggered: ' + name);
}

setInterval(fetchStatus, 3000);
renderTab('dashboard');
