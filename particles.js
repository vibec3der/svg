/**
 * Lightweight, theme-aware particle system for EduLearn
 * Performance-focused (canvas-based)
 */

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            // If not found, try to find by class
            this.canvas = document.querySelector('.particle-canvas');
        }
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.baseColor = '#ffffff';
        this.accentColor = '#ad9cff';
        this.animationFrame = null;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.init();
        this.start();
    }

    resize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        if (this.particles.length > 0) {
            const targetCount = this.calculateParticleCount();
            if (Math.abs(this.particles.length - targetCount) > 20) {
                this.init();
            }
        }
    }

    calculateParticleCount() {
        const area = this.width * this.height;
        let count = Math.floor(area / 15000);
        return Math.min(count, 120);
    }

    init() {
        this.particles = [];
        const count = this.calculateParticleCount();
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            blinkSpeed: Math.random() * 0.02 + 0.005,
            blinkDir: Math.random() > 0.5 ? 1 : -1
        };
    }

    updateColors(accent) {
        this.accentColor = accent;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;
            
            p.opacity += p.blinkSpeed * p.blinkDir;
            if (p.opacity > 0.8) p.blinkDir = -1;
            if (p.opacity < 0.2) p.blinkDir = 1;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            
            if (this.accentColor) {
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = this.accentColor;
            }
            
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    start() {
        if (this.animationFrame) return;
        const animate = () => {
            const settings = JSON.parse(localStorage.getItem('edulearn_settings') || '{}');
            const enabled = settings.particlesEnabled !== false;
            
            if (enabled) {
                this.canvas.style.display = 'block';
                this.draw();
            } else {
                this.canvas.style.display = 'none';
            }
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

// Global instance
window.edulearnParticles = null;
function initEdulearnParticles() {
    if (!window.edulearnParticles) {
        window.edulearnParticles = new ParticleSystem('particles-js');
    }
}

window.addEventListener('DOMContentLoaded', initEdulearnParticles);
window.addEventListener('load', initEdulearnParticles);
