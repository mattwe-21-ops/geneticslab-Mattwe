// --- STATO ---
let hasDrawing = false;
let hasText = false;
let drawMode = 'pen';
let drawColor = '#4a90e2';
let isPainting = false;
let isPresenterMode = false;
let lastX = 0, lastY = 0;
let offsetX = 0, offsetY = 0;
let laserX = -100, laserY = -100;

// --- INIZIALIZZAZIONE GAMETI ---
function initGameteInputs() {
    const size = parseInt(document.getElementById('gridSize').value);
    const mContainer = document.getElementById('motherGametes');
    const fContainer = document.getElementById('fatherGametes');
    
    mContainer.innerHTML = '';
    fContainer.innerHTML = '';

    for (let i = 0; i < size; i++) {
        const mInput = document.createElement('input');
        mInput.type = 'text'; mInput.className = 'gamete-box'; mInput.maxLength = 1;
        mInput.value = i === 0 ? 'R' : 'r';
        mInput.onkeyup = drawPunnett;
        mContainer.appendChild(mInput);

        const fInput = document.createElement('input');
        fInput.type = 'text'; fInput.className = 'gamete-box'; fInput.maxLength = 1;
        fInput.value = i === 0 ? 'R' : 'r';
        fInput.onkeyup = drawPunnett;
        fContainer.appendChild(fInput);
    }
    drawPunnett();
}

// --- UI & TABS ---
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function toggleNotes() {
    const isChecked = document.getElementById('notesToggle').checked;
    document.getElementById('rightPanel').classList.toggle('hidden', !isChecked);
    document.getElementById('leftPanel').classList.toggle('fullscreen', !isChecked);
    setTimeout(() => { resizeDrawCanvas(); drawPunnett(); }, 400);
}

function checkContent() {
    const text = document.getElementById('textEditor').innerText.trim();
    hasText = text.length > 0 && text !== "Scrivi qui le tue osservazioni...";
    const label = document.getElementById('labelText');
    const check = document.getElementById('expText');
    label.style.opacity = hasText ? "1" : "0.5";
    check.disabled = !hasText;
    if(!hasText) check.checked = false;
}

function togglePresenterMode() {
    isPresenterMode = !isPresenterMode;
    document.getElementById('drawToolbar').style.display = isPresenterMode ? 'none' : 'flex';
    document.getElementById('presenterToolbar').style.display = isPresenterMode ? 'flex' : 'none';
    document.getElementById('presenterModeBadge').style.display = isPresenterMode ? 'block' : 'none';
    setDrawTool(isPresenterMode ? 'laser' : 'pen');
    redrawMainCanvas();
}

// --- DISEGNO ---
const dCanvas = document.getElementById('drawingCanvas');
const dCtx = dCanvas.getContext('2d');
const virtualCanvas = document.createElement('canvas');
const vCtx = virtualCanvas.getContext('2d');

function resizeDrawCanvas() {
    const rect = dCanvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        dCanvas.width = rect.width;
        dCanvas.height = rect.height;
        if(virtualCanvas.width === 0) {
            virtualCanvas.width = 3000; virtualCanvas.height = 3000;
            vCtx.fillStyle = "white"; vCtx.fillRect(0,0,3000,3000);
        }
        redrawMainCanvas();
    }
}

function redrawMainCanvas() {
    dCtx.fillStyle = "white";
    dCtx.fillRect(0,0,dCanvas.width, dCanvas.height);
    dCtx.drawImage(virtualCanvas, offsetX, offsetY);

    if (isPresenterMode && drawMode === 'laser') {
        dCtx.beginPath();
        dCtx.arc(laserX, laserY, 15, 0, Math.PI * 2);
        dCtx.fillStyle = "rgba(255, 0, 0, 0.4)";
        dCtx.fill();
        dCtx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        dCtx.stroke();
    }
}

dCanvas.onmousedown = (e) => { 
    if(drawMode === 'laser') return;
    isPainting = true; 
    [lastX, lastY] = [e.offsetX, e.offsetY]; 
    dCanvas.style.cursor = drawMode === 'pan' ? 'grabbing' : 'crosshair';
};

window.onmouseup = () => { 
    isPainting = false; 
    dCanvas.style.cursor = drawMode === 'pan' ? 'grab' : (drawMode === 'laser' ? 'none' : 'crosshair'); 
};

dCanvas.onmousemove = (e) => {
    if (drawMode === 'laser' && isPresenterMode) {
        laserX = e.offsetX; laserY = e.offsetY;
        redrawMainCanvas(); return;
    }
    if(!isPainting) return;
    
    if(drawMode === 'pan') {
        offsetX += (e.offsetX - lastX);
        offsetY += (e.offsetY - lastY);
        [lastX, lastY] = [e.offsetX, e.offsetY];
        redrawMainCanvas();
    } else {
        vCtx.beginPath();
        vCtx.moveTo(lastX - offsetX, lastY - offsetY);
        vCtx.lineTo(e.offsetX - offsetX, e.offsetY - offsetY);
        vCtx.strokeStyle = drawColor;
        vCtx.lineCap = 'round';
        vCtx.lineWidth = drawMode === 'pen' ? 3 : (drawMode === 'pencil' ? 1 : 25);
        vCtx.globalAlpha = drawMode === 'highlighter' ? 0.3 : 1;
        vCtx.stroke();
        vCtx.globalAlpha = 1;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        hasDrawing = true;
        updateDrawExportStatus();
        redrawMainCanvas();
    }
};

function setDrawTool(tool) {
    drawMode = tool;
    document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
    const id = isPresenterMode && tool === 'pan' ? 'tool-pan-p' : 'tool-' + tool;
    if(document.getElementById(id)) document.getElementById(id).classList.add('active');
    dCanvas.style.cursor = tool === 'pan' ? 'grab' : (tool === 'laser' ? 'none' : 'crosshair');
    if(tool !== 'laser') { laserX = -100; redrawMainCanvas(); }
}

function updateDrawExportStatus() {
    const label = document.getElementById('labelDraw');
    const check = document.getElementById('expDraw');
    label.style.opacity = hasDrawing ? "1" : "0.5";
    check.disabled = !hasDrawing;
    if(hasDrawing && !check.checked) check.checked = true;
}

function clearDrawing() { 
    vCtx.fillStyle = "white"; vCtx.fillRect(0,0,3000,3000);
    hasDrawing = false; updateDrawExportStatus(); redrawMainCanvas();
}

function updateDrawColor() {
    drawColor = document.getElementById('drawColor').value;
}

// --- PUNNETT ---
const pCanvas = document.getElementById('punnettCanvas');
const pCtx = pCanvas.getContext('2d');

function drawPunnett() {
    const size = parseInt(document.getElementById('gridSize').value);
    const mInputs = document.querySelectorAll('#motherGametes input');
    const fInputs = document.querySelectorAll('#fatherGametes input');
    const gM = Array.from(mInputs).map(i => i.value || '?');
    const gF = Array.from(fInputs).map(i => i.value || '?');

    pCtx.clearRect(0,0,pCanvas.width, pCanvas.height);
    const cellSize = pCanvas.width / (size + 1);
    pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';

    let redCount = 0;
    const totalCells = size * size;

    for(let i = 0; i <= size; i++) {
        for(let j = 0; j <= size; j++) {
            const x = i * cellSize; const y = j * cellSize;
            
            // Colore sfondo
            pCtx.fillStyle = (i === 0 || j === 0) ? '#f0f4f8' : '#fff';
            pCtx.fillRect(x, y, cellSize, cellSize);
            pCtx.strokeStyle = '#cbd5e0'; pCtx.strokeRect(x, y, cellSize, cellSize);

            pCtx.fillStyle = '#2d3436';
            pCtx.font = `bold ${cellSize/3}px sans-serif`;

            if(i === 0 && j === 0) {
                pCtx.font = `bold ${cellSize/5}px sans-serif`;
                pCtx.fillText('♀ \\ ♂', cellSize/2, cellSize/2);
            } else if(i === 0 && j > 0) {
                pCtx.fillText(gM[j-1], cellSize/2, y + cellSize/2);
            } else if(j === 0 && i > 0) {
                pCtx.fillText(gF[i-1], x + cellSize/2, cellSize/2);
            } else if(i > 0 && j > 0) {
                const allele1 = gF[i-1];
                const allele2 = gM[j-1];
                const comb = (allele1 === allele1.toUpperCase()) ? allele1 + allele2 : allele2 + allele1;
                
                const isRed = comb.toUpperCase().includes('R');
                if(isRed) redCount++;
                
                pCtx.fillStyle = isRed ? '#e53e3e' : '#718096';
                pCtx.fillText(comb, x + cellSize/2, y + cellSize/2);
            }
        }
    }
    
    const redPerc = ((redCount/totalCells)*100).toFixed(1);
    const whitePerc = (100 - redPerc).toFixed(1);
    document.getElementById('statsBox').innerHTML = `
        <strong>Analisi Fenotipica (${size}x${size}):</strong><br>
        🔴 Rossi: ${redCount} (${redPerc}%) | ⚪ Bianchi: ${totalCells - redCount} (${whitePerc}%)
    `;
}

// --- EXPORT ---
function showExportNotification() { document.getElementById('export-modal').style.display = 'flex'; }
function openExportTab() {
    closeModal('export-modal');
    const win = window.open('');
    const punnett = pCanvas.toDataURL();
    const draw = dCanvas.toDataURL();
    const text = document.getElementById('textEditor').innerHTML;
    win.document.write(`
        <html><head><title>Report Genetica</title><style>body{font-family:sans-serif;padding:40px;} .sec{margin:20px 0; border-bottom:1px solid #eee;}</style></head><body>
        <h1>Report Laboratorio Genetica - Mattwe</h1>
        ${document.getElementById('expPunnett').checked ? `<div class="sec"><h2>Quadrato di Punnett</h2><img src="${punnett}"></div>` : ''}
        ${document.getElementById('expDraw').checked ? `<div class="sec"><h2>Schizzi</h2><img src="${draw}"></div>` : ''}
        ${document.getElementById('expText').checked ? `<div class="sec"><h2>Note</h2><div>${text}</div></div>` : ''}
        </body></html>`);
    win.document.close();
}

function switchNoteTab(t) {
    const isT = t === 'text';
    document.getElementById('textEditor').style.display = isT ? 'block' : 'none';
    document.getElementById('drawingCanvas').style.display = isT ? 'none' : 'block';
    document.getElementById('textToolbar').style.display = isT ? 'flex' : 'none';
    document.getElementById('drawToolbar').style.display = isT ? 'none' : (isPresenterMode ? 'none' : 'flex');
    document.getElementById('presenterToolbar').style.display = (!isT && isPresenterMode) ? 'flex' : 'none';
    document.getElementById('tabText').classList.toggle('active', isT);
    document.getElementById('tabDraw').classList.toggle('active', !isT);
    if(!isT) resizeDrawCanvas();
}

function formatText(c) { document.execCommand(c, false, null); checkContent(); }

window.onload = () => { initGameteInputs(); resizeDrawCanvas(); checkContent(); };
window.onresize = resizeDrawCanvas;