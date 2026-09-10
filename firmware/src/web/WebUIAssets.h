#ifndef TARA_WEBUIASSETS_H
#define TARA_WEBUIASSETS_H

#include <Arduino.h>

// Embedded responsive Web UI for TARA served from ESP32 PROGMEM / Flash
// Compact and lightweight for standard ESP32 dual-core

static const char TARA_INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TARA Companion Robot</title>
<style>
:root{--bg:#0b0f19;--card:#151c2e;--accent:#00f0ff;--amber:#ffb800;--text:#e2e8f0;--muted:#64748b;--border:#1e293b}
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}
body{background:var(--bg);color:var(--text);display:flex;min-height:100vh;flex-direction:column}
header{padding:14px 20px;background:rgba(21,28,46,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;letter-spacing:1px;color:var(--accent)}
.logo-icon{width:28px;height:28px;background:linear-gradient(135deg,var(--accent),#3b82f6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#000;font-size:14px}
.badge{background:#10b98122;color:#10b981;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid #10b98144}
nav{display:flex;overflow-x:auto;padding:10px 16px;gap:8px;background:#0d1424;border-bottom:1px solid var(--border)}
nav button{background:transparent;border:1px solid transparent;color:var(--muted);padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:.2s}
nav button.active{background:var(--card);color:var(--accent);border-color:var(--border)}
main{flex:1;padding:16px;max-width:800px;margin:0 auto;width:100%}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.card-title{font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.metric{background:#0d1424;padding:12px;border-radius:10px;border:1px solid #1e293b}
.metric-label{font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:4px}
.metric-val{font-size:16px;font-weight:700;color:var(--accent)}
.form-group{margin-bottom:14px}
label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px}
input,select,textarea{width:100%;padding:10px 12px;background:#0d1424;border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;outline:none}
input:focus{border-color:var(--accent)}
.btn{background:var(--accent);color:#000;border:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.btn-secondary{background:#1e293b;color:var(--text)}
.btn-danger{background:#ef4444;color:#fff}
.face-box{background:#000;border:2px solid #334155;border-radius:12px;height:120px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:16px}
.eye{width:42px;height:52px;background:var(--accent);border-radius:12px;display:inline-block;margin:0 18px;box-shadow:0 0 15px var(--accent)}
.tab-content{display:none}
.tab-content.active{display:block}
</style>
</head>
<body>
<header>
  <div class="logo"><div class="logo-icon">&#9678;</div> TARA <span style="font-size:11px;color:var(--muted);font-weight:400">ESP32</span></div>
  <div id="statusBadge" class="badge">CONNECTING...</div>
</header>
<nav id="navbar">
  <button class="active" onclick="switchTab('tab-dashboard')">Dashboard</button>
  <button onclick="switchTab('tab-wifi')">Wi-Fi</button>
  <button onclick="switchTab('tab-brain')">Brain</button>
  <button onclick="switchTab('tab-voice')">Voice</button>
  <button onclick="switchTab('tab-personality')">Personality</button>
  <button onclick="switchTab('tab-memory')">Memory</button>
  <button onclick="switchTab('tab-face')">Face</button>
  <button onclick="switchTab('tab-hardware')">Hardware</button>
  <button onclick="switchTab('tab-cloud')">Cloud</button>
  <button onclick="switchTab('tab-system')">System</button>
  <button onclick="switchTab('tab-ota')">OTA</button>
</nav>
<main>
  <!-- DASHBOARD -->
  <div id="tab-dashboard" class="tab-content active">
    <div class="face-box">
      <div class="eye" id="webEyeL"></div>
      <div class="eye" id="webEyeR"></div>
    </div>
    <div class="card">
      <div class="card-title">Companion Status</div>
      <div class="grid">
        <div class="metric"><div class="metric-label">Robot State</div><div class="metric-val" id="mState">IDLE</div></div>
        <div class="metric"><div class="metric-label">Current Emotion</div><div class="metric-val" id="mEmotion">CALM</div></div>
        <div class="metric"><div class="metric-label">Local IPv4</div><div class="metric-val" id="mIP">--</div></div>
        <div class="metric"><div class="metric-label">Wi-Fi Signal</div><div class="metric-val" id="mRSSI">--</div></div>
        <div class="metric"><div class="metric-label">Free RAM Heap</div><div class="metric-val" id="mHeap">--</div></div>
        <div class="metric"><div class="metric-label">Uptime</div><div class="metric-val" id="mUptime">0s</div></div>
      </div>
    </div>
  </div>

  <!-- WI-FI -->
  <div id="tab-wifi" class="tab-content">
    <div class="card">
      <div class="card-title">Wi-Fi Network Setup</div>
      <form id="wifiForm" onsubmit="saveWiFi(event)">
        <div class="form-group">
          <label>Home Wi-Fi SSID</label>
          <input type="text" id="wifiSSID" required placeholder="Enter network name">
        </div>
        <div class="form-group">
          <label>Wi-Fi Password</label>
          <input type="password" id="wifiPass" placeholder="Enter network password">
        </div>
        <button type="submit" class="btn">Connect & Save</button>
      </form>
    </div>
  </div>

  <!-- BRAIN -->
  <div id="tab-brain" class="tab-content">
    <div class="card">
      <div class="card-title">Model Router & AI Brain</div>
      <form id="brainForm" onsubmit="saveBrain(event)">
        <div class="form-group">
          <label>Provider Type</label>
          <select id="brainProvider"><option value="cloud">Cloud API (OpenAI / Gemini / Custom)</option><option value="local">Local Network (Ollama / HomeServer)</option></select>
        </div>
        <div class="form-group">
          <label>API Endpoint URL</label>
          <input type="url" id="brainEndpoint" placeholder="https://api.openai.com/v1/chat/completions">
        </div>
        <div class="form-group">
          <label>API Secret Key (Stored securely)</label>
          <input type="password" id="brainKey" placeholder="sk-...">
        </div>
        <div class="form-group">
          <label>Model Name</label>
          <input type="text" id="brainModel" placeholder="gpt-4o-mini / gemini-1.5-flash">
        </div>
        <button type="submit" class="btn">Save AI Configuration</button>
      </form>
    </div>
  </div>

  <!-- SYSTEM -->
  <div id="tab-system" class="tab-content">
    <div class="card">
      <div class="card-title">Device Controls</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="restartRobot()">Restart ESP32</button>
        <button class="btn btn-danger" onclick="factoryReset()">Factory Reset</button>
      </div>
    </div>
  </div>
</main>
<script>
function switchTab(id){
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(el=>el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}
async function loadStatus(){
  try{
    const r=await fetch('/api/status');
    const d=await r.json();
    document.getElementById('mState').innerText=d.state;
    document.getElementById('mEmotion').innerText=d.emotion;
    document.getElementById('mIP').innerText=d.wifi.ip;
    document.getElementById('mRSSI').innerText=d.wifi.rssi+' dBm';
    document.getElementById('mHeap').innerText=Math.round(d.system.free_heap/1024)+' KB';
    document.getElementById('mUptime').innerText=d.system.uptime+'s';
    document.getElementById('statusBadge').innerText=d.state;
  }catch(e){}
}
async function saveWiFi(e){
  e.preventDefault();
  const ssid=document.getElementById('wifiSSID').value;
  const password=document.getElementById('wifiPass').value;
  await fetch('/api/wifi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssid,password})});
  alert('Connecting to '+ssid+'! Check IP on OLED screen.');
}
async function restartRobot(){
  if(confirm('Reboot TARA ESP32?')){fetch('/api/restart',{method:'POST'});}
}
async function factoryReset(){
  if(confirm('Erase all credentials and reset?')){fetch('/api/reset',{method:'POST'});}
}
setInterval(loadStatus,3000);
loadStatus();
</script>
</body>
</html>
)rawliteral";

#endif // TARA_WEBUIASSETS_H
