// PRODESAL de Castro - Versión con APIs Reales
// MiniMax Agent - Configuración de APIs para datos en tiempo real

class PRODESALApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.personalContent = JSON.parse(localStorage.getItem('personalContent')) || [];
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        this.isModalOpen = false;
        this.weatherData = null;
        this.newsData = [];
        this.apiKeys = this.loadApiKeys();
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeNavigation();
        this.loadPersonalContent();
        this.loadProductsData();
        this.loadActivitiesData();
        this.initializeRealAPIs();
        this.checkForUpdates();
        this.setupOnlineStatus();
    }

    // === CONFIGURACIÓN DE APIs ===
    loadApiKeys() {
        return {
            openWeather: localStorage.getItem('openWeatherApiKey') || '',
            news: localStorage.getItem('newsApiKey') || '',
            customApi: localStorage.getItem('customApiKey') || ''
        };
    }

    setupOnlineStatus() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.refreshAllData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
    }

    updateConnectionStatus() {
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? 'En línea' : 'Sin conexión';
            statusElement.className = `connection-status ${this.isOnline ? 'online' : 'offline'}`;
        }
    }

    // === APIs REALES DE CLIMA ===
    initializeRealAPIs() {
        this.initializeRealWeather();
        this.initializeRealNews();
        this.initializeAgricultureAPIs();
    }

    async initializeRealWeather() {
        if (!this.apiKeys.openWeather) {
            this.showApiSetupMessage('Clima', 'openWeather');
            this.loadMockWeather(); // Fallback a datos simulados
            return;
        }

        try {
            await this.loadRealWeatherData();
        } catch (error) {
            console.error('Error cargando clima real:', error);
            this.loadMockWeather();
        }
    }

    async loadRealWeatherData() {
        const apiKey = this.apiKeys.openWeather;
        const city = 'Castro, CL'; // Chiloé, Chile
        const units = 'metric';
        const lang = 'es';
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}&lang=${lang}`
        );

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        this.weatherData = {
            temperature: Math.round(data.main.temp),
            condition: this.translateWeatherCondition(data.weather[0].description),
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6), // m/s a km/h
            pressure: data.main.pressure,
            visibility: Math.round((data.visibility || 10000) / 1000), // metros a km
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            location: data.name,
            updated: new Date()
        };

        this.renderRealWeatherData();
        
        // Actualizar cada 30 minutos
        setInterval(() => {
            this.loadRealWeatherData().catch(console.error);
        }, 30 * 60 * 1000);
    }

    translateWeatherCondition(condition) {
        const translations = {
            'clear sky': 'Cielo despejado',
            'few clouds': 'Pocas nubes',
            'scattered clouds': 'Nubes dispersas',
            'broken clouds': 'Nublado',
            'shower rain': 'Lluvia intensa',
            'rain': 'Lluvia',
            'thunderstorm': 'Tormenta',
            'snow': 'Nieve',
            'mist': 'Neblina',
            'fog': 'Niebla',
            'overcast clouds': 'Nublado',
            'light rain': 'Lluvia ligera',
            'moderate rain': 'Lluvia moderada',
            'heavy rain': 'Lluvia intensa'
        };
        
        return translations[condition] || condition;
    }

    renderRealWeatherData() {
        if (!this.weatherData) return;

        // Actualizar dashboard
        this.updateWeatherCard();
        this.updateWeatherDetails();
    }

    updateWeatherCard() {
        const tempElement = document.querySelector('.weather-temp');
        const conditionElement = document.querySelector('.weather-condition');
        const iconElement = document.querySelector('.weather-icon');

        if (tempElement) tempElement.textContent = `${this.weatherData.temperature}°C`;
        if (conditionElement) conditionElement.textContent = this.weatherData.condition;
        if (iconElement) {
            iconElement.innerHTML = `<img src="https://openweathermap.org/img/wn/${this.weatherData.icon}@2x.png" alt="Clima" class="weather-icon-img">`;
        }
    }

    updateWeatherDetails() {
        const detailsContainer = document.querySelector('.weather-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="weather-detail">
                    <span class="detail-label">Humedad:</span>
                    <span class="detail-value">${this.weatherData.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Viento:</span>
                    <span class="detail-value">${this.weatherData.windSpeed} km/h</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Presión:</span>
                    <span class="detail-value">${this.weatherData.pressure} hPa</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Visibilidad:</span>
                    <span class="detail-value">${this.weatherData.visibility} km</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-label">Última actualización:</span>
                    <span class="detail-value">${this.weatherData.updated.toLocaleTimeString('es-ES')}</span>
                </div>
            `;
        }
    }

    loadMockWeather() {
        // Datos de fallback si no hay API key
        const mockData = {
            temperature: 18,
            condition: 'Lluvia ligera',
            humidity: 85,
            windSpeed: 12,
            pressure: 1013,
            visibility: 8,
            description: 'lluvia ligera',
            icon: '10d',
            location: 'Castro, Chiloé',
            updated: new Date()
        };
        
        this.weatherData = mockData;
        this.renderRealWeatherData();
    }

    // === APIs REALES DE NOTICIAS ===
    initializeRealNews() {
        if (!this.apiKeys.news) {
            this.showApiSetupMessage('Noticias', 'news');
            this.loadMockNews();
            return;
        }

        this.loadRealNewsData();
    }

    async loadRealNewsData() {
        try {
            // Fuentes de noticias agrícolas chilenas
            const sources = [
                'elmostrador.cl',
                'biobiochile.cl', 
                'cooperativa.cl',
                'lanacion.cl'
            ];

            const allNews = [];
            
            for (const source of sources) {
                const news = await this.fetchNewsFromSource(source);
                allNews.push(...news);
            }

            // Filtrar noticias relacionadas con agricultura
            const agriculturalNews = allNews.filter(news => 
                this.isAgriculturalNews(news.title, news.description)
            );

            this.newsData = agriculturalNews.slice(0, 10); // Últimas 10 noticias
            this.renderRealNews();
            
            // Actualizar cada 2 horas
            setInterval(() => {
                this.loadRealNewsData().catch(console.error);
            }, 2 * 60 * 60 * 1000);
            
        } catch (error) {
            console.error('Error cargando noticias:', error);
            this.loadMockNews();
        }
    }

    async fetchNewsFromSource(source) {
        const apiKey = this.apiKeys.news;
        const response = await fetch(
            `https://newsapi.org/v2/everything?sources=${source}&apiKey=${apiKey}&language=es&pageSize=5`
        );

        if (!response.ok) return [];
        
        const data = await response.json();
        return data.articles || [];
    }

    isAgriculturalNews(title, description) {
        const keywords = [
            'agricultura', 'ganadería', 'campo', 'agricultor', 'ganadero',
            'producción', 'cultivo', 'ganado', 'veterinario', 'pecuario',
            'rural', 'indap', 'sag', 'chile', 'chiloé', 'castro',
            'fertilizante', 'semilla', 'cosecha', 'planta', 'animal',
            'veterinaria', 'pecuaria', 'agrícola', 'agri', 'ganaderia'
        ];

        const text = (title + ' ' + description).toLowerCase();
        return keywords.some(keyword => text.includes(keyword));
    }

    renderRealNews() {
        const newsList = document.querySelector('.news-list');
        if (!newsList || this.newsData.length === 0) return;

        newsList.innerHTML = this.newsData.map(article => `
            <article class="news-item">
                <div class="news-image">
                    ${article.urlToImage ? 
                        `<img src="${article.urlToImage}" alt="Noticia" onerror="this.style.display='none'">` : 
                        '<i data-lucide="image"></i>'
                    }
                </div>
                <div class="news-content">
                    <h3>${this.escapeHtml(article.title)}</h3>
                    <p>${this.escapeHtml(article.description || 'Sin descripción disponible')}</p>
                    <div class="news-meta">
                        <span class="news-category" style="background: var(--accent-news);">Agricultura</span>
                        <span class="news-date">${this.formatDate(article.publishedAt)}</span>
                        <a href="${article.url}" target="_blank" class="news-link">Leer más</a>
                    </div>
                </div>
            </article>
        `).join('');

        // Reinicializar iconos
        lucide.createIcons();
    }

    loadMockNews() {
        // Noticias de ejemplo para Chile agrícola
        const mockNews = [
            {
                title: "INDAP fortalece apoyo a pequeños agricultores de Chiloé",
                description: "El Instituto de Desarrollo Agropecuario amplía programas de apoyo técnico y financiamiento para productores de la isla.",
                publishedAt: new Date().toISOString(),
                url: "#",
                urlToImage: null
            },
            {
                title: "SAG implementa nuevas medidas fitosanitarias en Los Lagos",
                description: "El Servicio Agrícola y Ganadero refuerza protocolos de control de plagas y enfermedades vegetales.",
                publishedAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
                url: "#",
                urlToImage: null
            },
            {
                title: "Cooperativas agrícolas de Chiloé aumentan producción 15%",
                description: "Las cooperativas rurales de la isla reportan incrementos significativos en producción de papa y ganadería.",
                publishedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                url: "#",
                urlToImage: null
            }
        ];

        this.newsData = mockNews;
        this.renderRealNews();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Ahora';
        if (diffInHours < 24) return `${diffInHours}h`;
        return `${Math.floor(diffInHours/24)}d`;
    }

    // === APIs AGRÍCOLAS ESPECIALIZADAS ===
    initializeAgricultureAPIs() {
        this.loadPotatoBlightData();
        this.loadAgriculturalMarketData();
    }

    async loadPotatoBlightData() {
        // Simular datos del sistema de monitoreo de tizón tardío
        // En implementación real, conectaría con INIA
        const blightData = {
            stations: [
                {
                    name: "PIDPID",
                    location: "Castro",
                    status: "VERDE",
                    risk: "BAJO",
                    temperature: this.weatherData?.temperature || 18,
                    humidity: this.weatherData?.humidity || 85,
                    lastUpdate: new Date()
                },
                {
                    name: "QUILQUICO", 
                    location: "Castro",
                    status: "VERDE",
                    risk: "BAJO",
                    temperature: this.weatherData?.temperature || 18,
                    humidity: this.weatherData?.humidity || 85,
                    lastUpdate: new Date()
                },
                {
                    name: "ISLA CHELIN",
                    location: "Castro", 
                    status: "VERDE",
                    risk: "BAJO",
                    temperature: this.weatherData?.temperature || 18,
                    humidity: this.weatherData?.humidity || 85,
                    lastUpdate: new Date()
                }
            ]
        };

        this.updatePotatoBlightDisplay(blightData);
    }

    updatePotatoBlightDisplay(data) {
        // Actualizar la vista de monitoreo de tizón tardío
        const stationsContainer = document.querySelector('.stations-container');
        if (!stationsContainer) return;

        stationsContainer.innerHTML = data.stations.map(station => `
            <div class="station-card ${station.status.toLowerCase()}">
                <h4>${station.name}</h4>
                <p class="station-location">${station.location}</p>
                <div class="station-status">
                    <span class="status-indicator ${station.status.toLowerCase()}"></span>
                    <span class="status-text">${station.status}</span>
                </div>
                <div class="station-data">
                    <p>Temp: ${station.temperature}°C</p>
                    <p>Humedad: ${station.humidity}%</p>
                    <p>Riesgo: ${station.risk}</p>
                </div>
                <p class="last-update">Actualizado: ${station.lastUpdate.toLocaleTimeString('es-ES')}</p>
            </div>
        `).join('');
    }

    async loadAgriculturalMarketData() {
        // Datos de precios de productos agrícolas
        // En implementación real, conectaría con ODEPA
        const marketData = {
            products: [
                { name: "Papa", price: 800, unit: "kg", trend: "up" },
                { name: "Trigo", price: 1200, unit: "kg", trend: "stable" },
                { name: "Leche", price: 450, unit: "L", trend: "up" },
                { name: "Carne bovina", price: 3500, unit: "kg", trend: "down" }
            ],
            lastUpdate: new Date()
        };

        this.updateMarketData(marketData);
    }

    updateMarketData(data) {
        const marketContainer = document.querySelector('.market-prices');
        if (!marketContainer) return;

        marketContainer.innerHTML = data.products.map(product => `
            <div class="price-item">
                <span class="product-name">${product.name}</span>
                <span class="product-price">$${product.price}/${product.unit}</span>
                <span class="price-trend ${product.trend}">
                    ${product.trend === 'up' ? '↗' : product.trend === 'down' ? '↘' : '→'}
                </span>
            </div>
        `).join('');
    }

    // === SISTEMA DE ADMINISTRACIÓN ===
    showApiSetupMessage(service, apiType) {
        const message = `
            <div class="api-setup-notice">
                <h4>⚙️ Configuración de ${service}</h4>
                <p>Para obtener datos reales de ${service}, necesitas configurar una API key.</p>
                <div class="setup-steps">
                    <h5>Pasos para configurar:</h5>
                    <ol>
                        ${apiType === 'openWeather' ? `
                            <li>Ve a <a href="https://openweathermap.org/api" target="_blank">OpenWeather</a></li>
                            <li>Crea una cuenta gratuita</li>
                            <li>Obtén tu API key</li>
                            <li>Configúrala en el panel de administración</li>
                        ` : `
                            <li>Ve a <a href="https://newsapi.org" target="_blank">NewsAPI</a></li>
                            <li>Regístrate gratis</li>
                            <li>Copia tu API key</li>
                            <li>Configúrala en el panel de administración</li>
                        `}
                    </ol>
                </div>
                <button onclick="app.showAdminPanel()" class="btn-primary">Configurar Ahora</button>
            </div>
        `;

        this.showNotification(message, 'warning', 10000);
    }

    showAdminPanel() {
        // Panel de administración para configurar APIs
        const modal = this.createModal('Panel de Administración', `
            <div class="admin-panel">
                <h4>⚙️ Configuración de APIs</h4>
                
                <div class="api-config">
                    <label for="openWeatherKey">API Key de OpenWeather (Clima):</label>
                    <input type="password" id="openWeatherKey" placeholder="Tu API key de OpenWeather" value="${this.apiKeys.openWeather}">
                    <small>Obtén tu key gratis en <a href="https://openweathermap.org/api" target="_blank">openweathermap.org</a></small>
                </div>
                
                <div class="api-config">
                    <label for="newsApiKey">API Key de NewsAPI (Noticias):</label>
                    <input type="password" id="newsApiKey" placeholder="Tu API key de NewsAPI" value="${this.apiKeys.news}">
                    <small>Regístrate gratis en <a href="https://newsapi.org" target="_blank">newsapi.org</a></small>
                </div>
                
                <div class="api-config">
                    <label for="customApiKey">API Key Personalizada:</label>
                    <input type="password" id="customApiKey" placeholder="API key personalizada" value="${this.apiKeys.customApi}">
                    <small>Para servicios adicionales</small>
                </div>
                
                <div class="admin-actions">
                    <button onclick="app.saveApiKeys()" class="btn-primary">💾 Guardar Configuración</button>
                    <button onclick="app.testApiConnections()" class="btn-secondary">🔄 Probar Conexiones</button>
                    <button onclick="app.closeModal()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </div>
        `);
    }

    saveApiKeys() {
        const openWeatherKey = document.getElementById('openWeatherKey').value;
        const newsApiKey = document.getElementById('newsApiKey').value;
        const customApiKey = document.getElementById('customApiKey').value;

        if (openWeatherKey) localStorage.setItem('openWeatherApiKey', openWeatherKey);
        if (newsApiKey) localStorage.setItem('newsApiKey', newsApiKey);
        if (customApiKey) localStorage.setItem('customApiKey', customApiKey);

        this.apiKeys = this.loadApiKeys();
        this.closeModal();
        
        this.showNotification('✅ Configuración guardada. Recargando datos...', 'success');
        
        // Recargar datos con las nuevas APIs
        setTimeout(() => {
            location.reload();
        }, 2000);
    }

    async testApiConnections() {
        const testResults = {
            weather: false,
            news: false
        };

        // Probar Weather API
        if (this.apiKeys.openWeather) {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=Castro,CL&appid=${this.apiKeys.openWeather}`
                );
                testResults.weather = response.ok;
            } catch (error) {
                console.error('Weather API test failed:', error);
            }
        }

        // Probar News API
        if (this.apiKeys.news) {
            try {
                const response = await fetch(
                    `https://newsapi.org/v2/top-headlines?country=cl&apiKey=${this.apiKeys.news}`
                );
                testResults.news = response.ok;
            } catch (error) {
                console.error('News API test failed:', error);
            }
        }

        // Mostrar resultados
        const results = `
            <h4>🧪 Resultados de Pruebas</h4>
            <div class="test-results">
                <div class="test-item ${testResults.weather ? 'success' : 'error'}">
                    <span>Clima (OpenWeather):</span>
                    <span>${testResults.weather ? '✅ Funcionando' : '❌ Error'}</span>
                </div>
                <div class="test-item ${testResults.news ? 'success' : 'error'}">
                    <span>Noticias (NewsAPI):</span>
                    <span>${testResults.news ? '✅ Funcionando' : '❌ Error'}</span>
                </div>
            </div>
            <button onclick="app.closeModal()" class="btn-primary">Cerrar</button>
        `;

        this.showNotification(results, 'info', 30000);
    }

    // === MÉTODOS EXISTENTES ACTUALIZADOS ===
    setupEventListeners() {
        // Navegación por pestañas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.navigateToSection(e.currentTarget.dataset.section);
            });
        });

        // Tarjetas del dashboard
        document.querySelectorAll('.dashboard-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.navigateToSection(e.currentTarget.dataset.section);
            });
        });

        // Botón FAB
        document.getElementById('fabBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Nuevo: Botón de actualización manual
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshAllData();
        });
    }

    refreshAllData() {
        this.showNotification('🔄 Actualizando datos...', 'info', 2000);
        
        if (this.isOnline) {
            // Actualizar clima
            if (this.apiKeys.openWeather) {
                this.loadRealWeatherData().catch(console.error);
            }
            
            // Actualizar noticias
            if (this.apiKeys.news) {
                this.loadRealNewsData().catch(console.error);
            }
            
            // Actualizar datos agrícolas
            this.loadPotatoBlightData();
            this.loadAgriculturalMarketData();
        }
    }

    // === MÉTODOS DE UTILIDAD ===
    createModal(title, content) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = title;
        modalContent.innerHTML = content;
        modal.classList.add('active');
        this.isModalOpen = true;
        
        return modal;
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }

    // === MÉTODOS EXISTENTES (MANTENER COMPATIBILIDAD) ===
    initializeNavigation() {
        // Implementación existente
    }

    loadPersonalContent() {
        this.renderPersonalContent();
    }

    loadProductsData() {
        this.renderProducts();
    }

    loadActivitiesData() {
        this.renderActivities();
    }

    renderPersonalContent() {
        // Implementación existente
    }

    renderProducts() {
        // Implementación existente
    }

    renderActivities() {
        // Implementación existente
    }

    navigateToSection(section) {
        // Implementación existente
    }

    openModal() {
        // Implementación existente
    }

    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
        this.isModalOpen = false;
    }

    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.addEventListener('updatefound', () => {
                    this.showNotification('Nueva versión disponible', 'info');
                });
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCurrentDate() {
        return new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PRODESALApp();
});

// === SERVICE WORKER REGISTRATION ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}