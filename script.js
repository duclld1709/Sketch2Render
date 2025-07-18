class SketchToRenderApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.drawingHistory = [];
        this.currentPath = [];
        this.renderedImageUrl = null;

        this.initializeCanvas();
        this.setupEventListeners();
        this.saveCanvasState();
    }

    initializeCanvas() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        document.getElementById('brushSize').addEventListener('input', (e) => {
            document.getElementById('brushSizeValue').textContent = e.target.value + 'px';
        });

        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('generateBtn').addEventListener('click', () => this.generateRender());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.currentPath = [pos];

        this.ctx.strokeStyle = document.getElementById('brushColor').value;
        this.ctx.lineWidth = document.getElementById('brushSize').value;

        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);
        this.currentPath.push(pos);

        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveCanvasState();
        }
    }

    saveCanvasState() {
        this.drawingHistory.push(this.canvas.toDataURL());
        if (this.drawingHistory.length > 20) {
            this.drawingHistory.shift();
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveCanvasState();
    }

    undo() {
        if (this.drawingHistory.length > 1) {
            this.drawingHistory.pop();
            const previousState = this.drawingHistory[this.drawingHistory.length - 1];
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = previousState;
        }
    }

    async generateRender() {
        if (!this.isCanvasEmpty()) {
            this.showLoading(true);
            this.hideError();

            try {
                const analysisResult = await this.analyzeSketchWithGemini();
                const imageUrl = await this.generateImageFromDescription(analysisResult.description);
                this.displayResults(imageUrl, analysisResult.score, analysisResult.prediction);
            } catch (error) {
                console.error(error);
                this.showError(`Lỗi: ${error.message}`);
            } finally {
                this.showLoading(false);
            }
        } else {
            this.showError('Vui lòng vẽ gì đó trước khi tạo render');
        }
    }

    isCanvasEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return imageData.data.every((pixel, index) => {
            if ((index + 1) % 4 === 0) return true;
            return pixel === 255;
        });
    }

    async analyzeSketchWithGemini() {
        const canvasDataURL = this.canvas.toDataURL('image/png');
        const base64Data = canvasDataURL.split(',')[1];

        const prompt = `Hãy phân tích bức vẽ sketch sau và cung cấp:

1. ĐIỂM SỐ: Đánh giá độ thẩm mỹ của sketch theo thang 6–10 (dựa trên tiêu chí khả năng dễ hình dung)

2. DỰ ĐOÁN: Tên ngắn gọn của vật thể được vẽ (ví dụ: "Mèo", "Ngôi nhà", "Hoa")

3. MÔ TẢ: Viết mô tả ngắn gọn bằng tiếng Anh, mô tả nội dung sketch dùng cho AI vẽ lại. Bao gồm:

      - Miêu tả đối tượng

      - Phong cách: cute, line-art style, soft pastel colors, minimalist illustration

      - Tránh chi tiết phức tạp, ưu tiên phong cách đơn giản, đáng yêu

Định dạng phản hồi:

ĐIỂM: [1–10]

DỰ ĐOÁN: [Tên đối tượng]

MÔ TẢ: ["A cute [object] in line-art style, with soft pastel colors, minimalist illustration..."]`;

        const geminiApiKey = ''; // api tai day
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/png",
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return this.parseGeminiResponse(text);
    }

    parseGeminiResponse(text) {
        const score = parseInt(text.match(/ĐIỂM[:\s]*(\d+)/i)?.[1] || 7);
        const prediction = (text.match(/DỰ ĐOÁN[:\s]*(.*)/i)?.[1] || 'Không xác định').trim();
        const description = (text.match(/MÔ TẢ[:\s]*([\s\S]*)/i)?.[1] || 'simple line drawing').trim();
        return { score, prediction, description };
    }

    // Stability API
    async generateImageFromDescription(description) {
        const enhancedPrompt = `${description}`;
        const seed = Math.floor(Math.random() * 1e6);

        const engineId = 'stable-diffusion-xl-1024-v1-0';
        const url = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;
      

        const STABILITY_API_KEY = ''; // api tai day

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${STABILITY_API_KEY}`
            },
            body: JSON.stringify({
                text_prompts: [{ text: enhancedPrompt }],
                cfg_scale: 7,
                width: 1024,
                height: 1024,
                samples: 1,
                steps: 30,
                seed: seed
            })
        });

        const data = await response.json();
        const base64 = data.artifacts[0].base64;
        return `data:image/png;base64,${base64}`;
    }


    // Pollinations API
    // async generateImageFromDescription(description) {
    //     // Using Pollinations AI (free image generation API)
    //     // This creates an image based on the description from Gemini
    //     const enhancedPrompt = `${description}, high quality, detailed artwork, colored pencil, cute illustration`;
    //     const encodedPrompt = encodeURIComponent(enhancedPrompt);
        
    //     // Generate a unique seed to avoid caching
    //     const seed = Math.floor(Math.random() * 1000000);
    //     const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=512&model=flux`;
        
    //     // Verify the image loads
    //     return new Promise((resolve, reject) => {
    //         const img = new Image();
    //         img.onload = () => resolve(imageUrl);
    //         img.onerror = () => reject(new Error('Không thể tạo ảnh render'));
    //         img.src = imageUrl;
    //     });
    // }
    

    displayResults(imageUrl, score, prediction) {
        const imageContainer = document.getElementById('imageContainer');
        imageContainer.innerHTML = `<img src="${imageUrl}" alt="Rendered Image" class="rendered-image">`;
        this.renderedImageUrl = imageUrl;
        document.getElementById('downloadBtn').style.display = 'block';
        document.getElementById('scoreDisplay').textContent = `${score}/10`;
        document.getElementById('predictionText').textContent = prediction;
        document.getElementById('resultContent').style.display = 'block';
    }

    downloadImage() {
        if (this.renderedImageUrl) {
            const link = document.createElement('a');
            link.download = `sketch-render-${Date.now()}.png`;
            link.href = this.renderedImageUrl;
            link.click();
        }
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('resultContent').style.display = show ? 'none' : 'block';
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }
}

// Khởi tạo khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    new SketchToRenderApp();
});
