const canvas = document.getElementById("heatmap");
const ctx = canvas.getContext("2d");
const numBins = 128;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const audioBufferSize = 2048;
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const multiplier = 1.2;
let matrixSize = 100;
let matrix = Array.from({ length: numBins }, () => new Array(matrixSize).fill(0));
let spectrogramData = new Array(bufferLength).fill(0);

// Draw heatmap function
function drawHeatmap() {
  const rectWidth = (canvas.width - numBins - 50) / matrixSize;
  const rectHeight = Math.floor(canvas.height / numBins);

  // Draw grayscale heatmap in first (matrixSize-1) columns
  for (let i = 0; i < matrixSize - 1; i++) {
    for (let j = 0; j < numBins; j++) {
      const value = matrix[j][i];
      const color = `rgb(${(1 - value * multiplier) * 255}, ${(1 - value * multiplier) * 255}, ${(1 - value * multiplier) * 255})`;
      const rectX = i * rectWidth;
      const rectY = j * rectHeight;
      ctx.fillStyle = color;
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    }
  }

  // Draw spectrogram data in last column
  const lastColumn = matrixSize - 1;
  for (let j = 0; j < numBins; j++) {
    const value = spectrogramData[j]; // scale all amplitude values by a constant factor of 5
    const r = 255 * Math.max(0, value - 0.5) * 2;
    const g = 255 * Math.abs(value - 0.5) * 2;
    const b = 255 * Math.max(0, 0.5 - value) * 2;
    const color = `rgb(${r}, ${g}, ${b})`;
    const rectX = lastColumn * rectWidth;
    const rectY = j * rectHeight;
    ctx.fillStyle = color;
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  }

  // Draw y-axis tick marks and labels on the right side
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.font = "12px Arial";
  for (let j = 0; j < numBins; j++) {
    const freq = j * audioCtx.sampleRate / audioBufferSize;
    const label = freq >= 1000 ? (freq / 1000).toFixed(1) + " kHz" : freq.toFixed(0) + " Hz";
    const tickX = canvas.width - 170;
    const tickY = j * rectHeight;
    ctx.fillRect(tickX, tickY, 10, 1);
    ctx.fillText(label, tickX + 12, tickY + 4);
  }

  // Draw y-axis label
  const yLabel = "Frequency (Hz)";
  const yLabelX = canvas.width - 90;
  const yLabelY = canvas.height / 2;
  ctx.save();
  ctx.translate(yLabelX, yLabelY);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

// Hamming Window function
function hammingWindow(n, N) {
  return 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
}

// Update spectrogram data
function updateSpectrogramData() {
  analyser.getByteFrequencyData(dataArray);

  // Apply Hamming window
  for (let i = 0; i < numBins; i++) {
    dataArray[i] *= hammingWindow(i, numBins);
  }

  for (let i = 0; i < numBins; i++) {
    const value = dataArray[i] / 255;
    const scaledValue = value * multiplier;
    spectrogramData[i] = scaledValue;
    for (let j = 0; j < matrixSize - 2; j++) {
      matrix[i][j] = matrix[i][j + 1];
    }
    matrix[i][matrixSize - 2] = value;
  }
}

// Start capturing audio
function startCapture() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    const draw = () => {
      updateSpectrogramData();
      drawHeatmap();
      requestAnimationFrame(draw);
    };
    draw();
  });
}

// Start capturing audio on page load
window.addEventListener("load", startCapture);

// Resize canvas function
function resizeCanvas() {
  const html = document.querySelector('html');
  const body = document.querySelector('body');
  const rectWidth = (canvas.width - numBins - 50) / (matrixSize - 1);
  const rectHeight = Math.floor(canvas.height / numBins);
  canvas.width = html.clientWidth;
  canvas.height = body.clientHeight;
  heatmap.width = html.clientWidth;
  heatmap.height = body.clientHeight;
  drawHeatmap();
}

window.addEventListener("load", () => {
  resizeCanvas();
  startCapture();
});

// Debounced resize canvas function
const debouncedResizeCanvas = _.debounce(resizeCanvas, 100);
window.addEventListener("resize", debouncedResizeCanvas);