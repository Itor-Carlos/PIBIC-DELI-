function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}

async function fetchGlossaryData() {
    try {
        const response = await fetch('requests.php');
        const result = await response.json();

        const glossaryData = result.data.map(category => ({
            category: category.nome,
            icon: category.icon,
            items: category.palavras.map(palavra => ({
                word: palavra.nome,
                id: palavra.id_palavra,
                demonstrations: palavra.demonstracoes.map((demo, index) => ({
                    id: demo.id,
                    signwriting: `../fotos/${category.nome}/${demo.midia}`,
                    videoUrl: demo.link || 'about:blank',
                    description: demo.explicacao || 'Sem descrição disponível.'
                }))
            }))
        }));
        
        renderCategoryMenu(glossaryData);
        
        // Ao carregar, mostrar a primeira categoria ao invés de todas
        if (glossaryData.length > 0) {
            const firstCategory = glossaryData[0].category;
            document.getElementById('selectedCategoryTitle').textContent = firstCategory;
            renderCategoryWords(glossaryData, firstCategory);
        }
        
        handleSearch(glossaryData);
    } catch (error) {
        console.error('Error fetching glossary data:', error);
        document.getElementById('wordContainer').innerHTML = 
            '<p style="text-align: center; padding: 2rem; color: var(--text-light);">Erro ao carregar dados. Por favor, tente novamente mais tarde.</p>';
    }
}

function renderCategoryMenu(data) {
    const menuContainer = document.getElementById('categoryMenu');

    // Removendo a categoria "Todas as categorias"
    const categoriesHtml = data.map((category, index) => `
        <div class="category-item ${index === 0 ? 'active' : ''}" data-category="${category.category}">
            <span style="font-size: 1.2rem;">${category.icon}</span>
            <span>${category.category}</span>
        </div>
    `).join('');

    menuContainer.innerHTML = categoriesHtml;

    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            
            item.classList.add('active');
            
            const selectedCategory = item.getAttribute('data-category');
            document.getElementById('selectedCategoryTitle').textContent = selectedCategory;
            renderCategoryWords(data, selectedCategory);
        });
    });
}

function renderAllWords(data) {
    const container = document.getElementById('wordContainer');

    let allWordsHtml = '';

    data.forEach(category => {
        allWordsHtml += `
            <div class="category-section">
                <div class="category-header">
                    <span style="font-size: 1.5rem;">${category.icon}</span>
                    <h3>${category.category}</h3>
                </div>
                <div class="word-list">
                    ${renderWordItems(category.items, false)}
                </div>
            </div>
        `;
    });

    container.innerHTML = allWordsHtml;

    setupWordToggles();
    setupDemonstrationNavigation();
}

function renderCategoryWords(data, categoryName) {
    const container = document.getElementById('wordContainer');

    const category = data.find(cat => cat.category === categoryName);

    if (!category) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-light);">Categoria não encontrada.</p>';
        return;
    }

    container.innerHTML = `
        <div class="category-section">
            <div class="word-list">
                ${renderWordItems(category.items, true)}
            </div>
        </div>
    `;

    setupWordToggles();
    setupDemonstrationNavigation();
}

function renderWordItems(items, loadVideos) {
    return items.map(item => {
        const hasDemonstrations = item.demonstrations && item.demonstrations.length > 0;
        const demonstration = hasDemonstrations ? item.demonstrations[0] : {
            signwriting: 'about:blank',
            videoUrl: 'about:blank',
            description: 'Sem demonstração disponível.'
        };
        
        return `
        <div class="word-item" data-word-id="${item.id || ''}">
            <div class="word-main" onclick="toggleContent(this)">
                <span>${item.word}</span>
                <span style="color: var(--primary)">▼</span>
            </div>
            <div class="word-content">
                ${hasDemonstrations && item.demonstrations.length > 1 ? `
                <div class="demonstration-nav">
                    <button class="nav-button prev-demo" data-current="0" data-total="${item.demonstrations.length}" disabled>&lt;</button>
                    <span class="demonstration-count">Demonstração 1 de ${item.demonstrations.length}</span>
                    <button class="nav-button next-demo" data-current="0" data-total="${item.demonstrations.length}">&gt;</button>
                </div>
                ` : ''}
                <div class="demonstration-container" data-current-demo="0">
                    ${hasDemonstrations ? 
                        item.demonstrations.map((demo, index) => `
                        <div class="demonstration" data-demo-index="${index}" style="display: ${index === 0 ? 'block' : 'none'}">
                            <div class="media-container">
                                <div class="signwriting-section">
                                    <h3 class="section-title">Escrita de Sinais</h3>
                                    <img src="${demo.signwriting}" alt="Escrita de sinais para ${item.word}" class="signwriting-image">
                                </div>
                                <div class="video-section">
                                    <h3 class="section-title">Vídeo do Sinal</h3>
                                    <div class="video-wrapper">
                                        ${loadVideos ? 
                                            `<iframe src="${demo.videoUrl}" title="${item.word} em Libras" allowfullscreen loading="lazy"></iframe>` : 
                                            `<div class="video-placeholder" data-video-url="${demo.videoUrl}" data-title="${item.word} em Libras">
                                                <span>Clique para carregar o vídeo</span>
                                            </div>`
                                        }
                                    </div>
                                </div>
                            </div>
                            <div class="description-section">
                                <h3 class="section-title">Descrição</h3>
                                <p class="description-text">${demo.description}</p>
                            </div>
                        </div>
                        `).join('') :
                        `
                        <div class="media-container">
                            <div class="signwriting-section">
                                <h3 class="section-title">Escrita de Sinais</h3>
                                <img src="${demonstration.signwriting}" alt="Escrita de sinais para ${item.word}" class="signwriting-image">
                            </div>
                            <div class="video-section">
                                <h3 class="section-title">Vídeo do Sinal</h3>
                                <div class="video-wrapper">
                                    ${loadVideos ? 
                                        `<iframe src="${demonstration.videoUrl}" title="${item.word} em Libras" allowfullscreen loading="lazy"></iframe>` : 
                                        `<div class="video-placeholder" data-video-url="${demonstration.videoUrl}" data-title="${item.word} em Libras">
                                            <span>Clique para carregar o vídeo</span>
                                        </div>`
                                    }
                                </div>
                            </div>
                        </div>
                        <div class="description-section">
                            <h3 class="section-title">Descrição</h3>
                            <p class="description-text">${demonstration.description}</p>
                        </div>
                        `
                    }
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function setupWordToggles() {
    const wordMains = document.querySelectorAll('.word-main');
    wordMains.forEach(item => {
        item.addEventListener('click', function() {
            // Esta função está vazia no código original
            // Aqui verificamos se há placeholders de vídeo para carregar
            const content = this.nextElementSibling;
            const videoPlaceholders = content.querySelectorAll('.video-placeholder');
            
            if (videoPlaceholders.length > 0) {
                videoPlaceholders.forEach(placeholder => {
                    const videoUrl = placeholder.getAttribute('data-video-url');
                    const videoTitle = placeholder.getAttribute('data-title');
                    const iframe = document.createElement('iframe');
                    
                    iframe.src = videoUrl;
                    iframe.title = videoTitle;
                    iframe.setAttribute('allowfullscreen', '');
                    iframe.setAttribute('loading', 'lazy');
                    
                    placeholder.parentNode.replaceChild(iframe, placeholder);
                });
            }
        });
    });
}

function setupDemonstrationNavigation() {
    document.querySelectorAll('.prev-demo').forEach(button => {
        button.addEventListener('click', function() {
            navigateDemonstration(this, -1);
        });
    });

    document.querySelectorAll('.next-demo').forEach(button => {
        button.addEventListener('click', function() {
            navigateDemonstration(this, 1);
        });
    });
}

function navigateDemonstration(button, direction) {
    const container = button.closest('.word-content');
    const demoNav = button.closest('.demonstration-nav');
    const demoContainer = container.querySelector('.demonstration-container');
    const currentIndex = parseInt(demoContainer.getAttribute('data-current-demo'));
    const totalDemos = parseInt(button.getAttribute('data-total'));

    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= totalDemos) return;

    demoContainer.setAttribute('data-current-demo', newIndex);

    const prevButton = demoNav.querySelector('.prev-demo');
    const nextButton = demoNav.querySelector('.next-demo');
    prevButton.disabled = newIndex === 0;
    nextButton.disabled = newIndex === totalDemos - 1;

    demoNav.querySelector('.demonstration-count').textContent = `Demonstração ${newIndex + 1} de ${totalDemos}`;

    container.querySelectorAll('.demonstration').forEach((demo, index) => {
        demo.style.display = index === newIndex ? 'block' : 'none';
        
        // Carrega o vídeo quando a demonstração se torna visível
        if (index === newIndex) {
            const videoPlaceholder = demo.querySelector('.video-placeholder');
            if (videoPlaceholder) {
                const videoUrl = videoPlaceholder.getAttribute('data-video-url');
                const videoTitle = videoPlaceholder.getAttribute('data-title');
                const iframe = document.createElement('iframe');
                
                iframe.src = videoUrl;
                iframe.title = videoTitle;
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('loading', 'lazy');
                
                videoPlaceholder.parentNode.replaceChild(iframe, videoPlaceholder);
            }
        }
    });
}

function toggleContent(element) {
    const content = element.nextElementSibling;
    const arrow = element.querySelector('span:last-child');

    content.classList.toggle('active');

    arrow.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : '';

    if (content.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + "px";
    } else {
        content.style.maxHeight = "0";
    }
}

function handleSearch(data) {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            // Se a busca estiver vazia e houver categorias, mostre a primeira categoria
            if (data.length > 0) {
                const firstCategory = data[0].category;
                document.getElementById('selectedCategoryTitle').textContent = firstCategory;
                renderCategoryWords(data, firstCategory);
                
                // Atualiza o menu para mostrar a primeira categoria como ativa
                const categoryItems = document.querySelectorAll('.category-item');
                categoryItems.forEach((item, index) => {
                    item.classList.toggle('active', index === 0);
                });
            }
            return;
        }
        
        const filteredData = data.map(category => {
            const filteredItems = category.items.filter(item => 
                item.word.toLowerCase().includes(searchTerm) ||
                (item.demonstrations && item.demonstrations.some(demo => 
                    demo.description && demo.description.toLowerCase().includes(searchTerm)
                ))
            );
            
            return {
                ...category,
                items: filteredItems
            };
        }).filter(category => category.items.length > 0);
        
        const container = document.getElementById('wordContainer');
        
        if (filteredData.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-light);">Nenhuma palavra encontrada para esta pesquisa.</p>';
            return;
        }
        
        let filteredHtml = '<h3>Resultados da busca:</h3>';
        
        filteredData.forEach(category => {
            filteredHtml += `
                <div class="category-section">
                    <div class="category-header">
                        <span style="font-size: 1.5rem;">${category.icon}</span>
                        <h3>${category.category}</h3>
                    </div>
                    <div class="word-list">
                        ${renderWordItems(category.items, false)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = filteredHtml;
        
        setupWordToggles();
        setupDemonstrationNavigation();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    fetchGlossaryData();
});