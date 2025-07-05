class SketchToRenderApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.drawingHistory = [];
        this.currentPath = [];
        this.renderedImageUrl = null;
        
        // API Key được nhúng trực tiếp trong code
        this.apiKey = ''; // Thay thế bằng API key thực tế
        
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
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
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

        // Control events
        document.getElementById('brushSize').addEventListener('input', (e) => {
            document.getElementById('brushSizeValue').textContent = e.target.value + 'px';
        });

        document.getElementById('clearCanvas').addEventListener('click', () => {
            this.clearCanvas();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateRender();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImage();
        });
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
        if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            this.showError('Vui lòng cấu hình API Key trong source code');
            return;
        }

        // Check if canvas is empty
        if (this.isCanvasEmpty()) {
            this.showError('Vui lòng vẽ gì đó trước khi tạo render');
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            // Step 1: Analyze sketch with Gemini
            const analysisResult = await this.analyzeSketchWithGemini();
            console.log('Analysis result:', analysisResult);
            
            // Step 2: Generate image using the description from Gemini
            const imageUrl = await this.generateImageFromDescription(analysisResult.description);
            
            // Step 3: Display results
            this.displayResults(imageUrl, analysisResult.score, analysisResult.prediction);

        } catch (error) {
            console.error('Error:', error);
            this.showError(`Lỗi: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    isCanvasEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return imageData.data.every((pixel, index) => {
            if ((index + 1) % 4 === 0) return true; // Alpha channel
            return pixel === 255; // White pixels
        });
    }

    async analyzeSketchWithGemini() {
        const canvasDataURL = this.canvas.toDataURL('image/png');
        const base64Data = canvasDataURL.split(',')[1];

        const prompt = `Phân tích bức vẽ sketch này và cung cấp:

1. ĐIỂM SỐ: Đánh giá chất lượng và độ rõ ràng từ 1–10, với tiêu chuẩn thoải mái (hình được vẽ bởi người bình thường bằng bút đen trên canvas, không yêu cầu đường nét hoàn hảo).
2. DỰ ĐOÁN: Tên ngắn gọn của sự vật được vẽ (VD: "Mèo", "Ngôi nhà", "Hoa")  
3. MÔ TẢ: Mô tả ngắn gọn để tạo ảnh render (viết bằng tiếng Anh, phong cách artistic)

Định dạng trả lời:
ĐIỂM: [số]
DỰ ĐOÁN: [tên sự vật]
MÔ TẢ: [mô tả ngắn gọn bằng tiếng Anh]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const result = data.candidates[0].content.parts[0].text;
            return this.parseGeminiResponse(result);
        } else {
            throw new Error('Không có kết quả từ Gemini API');
        }
    }

    parseGeminiResponse(text) {
        console.log('Gemini response:', text);
        
        // Extract score
        const scoreMatch = text.match(/ĐIỂM[:\s]*(\d+)/i) || text.match(/score[:\s]*(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;

        // Extract prediction  
        const predictionMatch = text.match(/DỰ ĐOÁN[:\s]*([^\n]+)/i) || text.match(/prediction[:\s]*([^\n]+)/i);
        const prediction = predictionMatch ? predictionMatch[1].trim() : 'Không xác định';

        // Extract description
        const descriptionMatch = text.match(/MÔ TẢ[:\s]*([^]*)/i) || text.match(/description[:\s]*([^]*)/i);
        let description = descriptionMatch ? descriptionMatch[1].trim() : text;
        
        // If no specific description found, use the whole response
        if (!descriptionMatch) {
            // Try to extract the most descriptive part
            const lines = text.split('\n').filter(line => line.trim().length > 20);
            description = lines.length > 0 ? lines[lines.length - 1] : text;
        }

        return {
            score: Math.min(Math.max(score, 1), 10), // Ensure score is between 1-10
            prediction: prediction.replace(/^["']|["']$/g, ''), // Remove quotes
            description: description.replace(/^["']|["']$/g, '') // Remove quotes
        };
    }

    async generateImageFromDescription(description) {
        // Using Pollinations AI (free image generation API)
        // This creates an image based on the description from Gemini
        const enhancedPrompt = `${description}, high quality, detailed artwork, professional illustration`;
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        
        // Generate a unique seed to avoid caching
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=512&model=flux`;
        
        // Verify the image loads
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(imageUrl);
            img.onerror = () => reject(new Error('Không thể tạo ảnh render'));
            img.src = imageUrl;
        });
    }

    displayResults(imageUrl, score, prediction) {
        // Display rendered image
        const imageContainer = document.getElementById('imageContainer');
        imageContainer.innerHTML = `<img src="${imageUrl}" alt="Rendered Image" class="rendered-image">`;
        
        this.renderedImageUrl = imageUrl;
        document.getElementById('downloadBtn').style.display = 'block';
        
        // Display results
        document.getElementById('scoreDisplay').textContent = `${score}/10`;
        document.getElementById('predictionText').textContent = prediction;

        // Show results
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

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SketchToRenderApp();
});