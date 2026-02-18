/**
 * @file cotador.js
 * @description Orquestrador principal do Cotador Oeste Saúde Assis
 * @projeto Cotador Oeste Saúde Assis
 * @versao 2.0
 */

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let abaAtual = 0;
let clienteDados = {};
let faixasSelecionadas = new Map();
let planosSelecionados = [];
let comparacaoAtual = null;

console.log('%c🚀 [COTADOR] Variáveis globais inicializadas', 'color: #8b5cf6; font-weight: bold;');

// ============================================================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================================================

/**
 * Mudar para aba específica
 * @param {number} numeroAba - Número da aba (0-3)
 */
function mudarAba(numeroAba) {
    console.log('%c🔄 [COTADOR] Mudando para aba:', 'color: #8b5cf6; font-weight: bold;', numeroAba);
    
    // Validar número da aba
    if (numeroAba < 0 || numeroAba > 3) {
        console.warn('%c⚠️ [COTADOR] Número de aba inválido:', 'color: #ea580c;', numeroAba);
        return;
    }
    
    // Esconder todas as abas
    document.querySelectorAll('.oeste-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const tabAlvo = document.getElementById(`tab${numeroAba}`);
    if (tabAlvo) {
        tabAlvo.classList.add('active');
        console.log('%c✅ [COTADOR] Aba ativada:', 'color: #16a34a;', `tab${numeroAba}`);
    } else {
        console.error('%c❌ [COTADOR] Aba não encontrada:', 'color: #dc2626;', `tab${numeroAba}`);
    }
    
    // Atualizar stepper
    atualizarStepper(numeroAba);
    
    // Atualizar aba atual
    abaAtual = numeroAba;
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Atualizar visual do stepper
 * @param {number} abaAtiva - Índice da aba ativa
 */
function atualizarStepper(abaAtiva) {
    console.log('%c🎨 [COTADOR] Atualizando stepper para aba:', 'color: #8b5cf6;', abaAtiva);
    
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index < abaAtiva) {
            step.classList.add('completed');
        } else if (index === abaAtiva) {
            step.classList.add('active');
        }
    });
}

/**
 * Voltar para aba anterior
 */
function voltarAba() {
    console.log('%c⬅️ [COTADOR] Voltando aba...', 'color: #8b5cf6; font-weight: bold;');
    
    if (abaAtual > 0) {
        mudarAba(abaAtual - 1);
    } else {
        console.warn('%c⚠️ [COTADOR] Já está na primeira aba', 'color: #ea580c;');
    }
}

// ============================================================================
// VALIDAÇÕES E AVANÇO DE ABAS
// ============================================================================

/**
 * Avançar da Aba 1 (Cliente) para Aba 2 (Faixas)
 */
function avancarAba1() {
    console.log('%c🚀 [COTADOR] Avançando para Aba 2...', 'color: #8b5cf6; font-weight: bold;');
    
    // ===== VALIDAR CAMPOS OBRIGATÓRIOS =====
    const nome = document.getElementById('clienteNome').value.trim();
    const telefone = document.getElementById('clienteTelefone').value.trim();
    const email = document.getElementById('clienteEmail').value.trim();
    
    if (!nome) {
        alert('❌ Por favor, preencha o nome do cliente.');
        document.getElementById('clienteNome').focus();
        return;
    }
    
    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
        alert('❌ Por favor, preencha um telefone válido.');
        document.getElementById('clienteTelefone').focus();
        return;
    }
    
    // ===== SALVAR DADOS (TIPO FIXO: Coletivo por Adesão) =====
    clienteDados = {
        nome: nome,
        telefone: telefone,
        email: email || '',
        tipo: 'Coletivo por Adesão' // ← FIXO AGORA
    };
    
    console.log('%c✅ [COTADOR] Dados do cliente salvos:', 'color: #10b981; font-weight: bold;', clienteDados);
    
    // ===== AVANÇAR PARA ABA 2 =====
    mudarAba(1);
}

/**
 * Avançar da Aba 2 (Faixas) para Aba 3 (Planos)
 */
function avancarAba2() {
    console.log('%c➡️ [COTADOR] Tentando avançar Aba 2 → Aba 3', 'color: #8b5cf6; font-weight: bold;');
    
    // Limpar faixas anteriores
    faixasSelecionadas.clear();
    
    // Coletar faixas
    for (let i = 1; i <= 10; i++) {
        const input = document.getElementById(`faixa-f${i}`);
        if (input) {
            const qtd = parseInt(input.value) || 0;
            if (qtd > 0) {
                faixasSelecionadas.set(`f${i}`, qtd);
            }
        }
    }
    
    console.log('%c📦 [COTADOR] Faixas coletadas:', 'color: #0066cc;', Array.from(faixasSelecionadas.entries()));
    
    // Validar
    if (faixasSelecionadas.size === 0) {
        alert('⚠️ Selecione pelo menos 1 pessoa em alguma faixa etária!');
        return;
    }
    
    const totalPessoas = UTILS.calcularTotalPessoas(faixasSelecionadas);
    console.log('%c👥 [COTADOR] Total de pessoas:', 'color: #0066cc; font-weight: bold;', totalPessoas);
    
    // Gerar checkboxes de planos
    gerarPlanos();
    
    // Avançar
    mudarAba(2);
}

// ============================================================================
// GERAÇÃO DINÂMICA
// ============================================================================

/**
 * Gerar inputs de faixas etárias (F1-F10)
 */
function gerarFaixasEtarias() {
    console.log('%c🎨 [COTADOR] Gerando faixas etárias F1-F10...', 'color: #8b5cf6; font-weight: bold;');
    
    const container = document.getElementById('faixasContainer');
    if (!container) {
        console.error('%c❌ [COTADOR] Container de faixas não encontrado!', 'color: #dc2626;');
        return;
    }
    
    container.innerHTML = '';
    
    const faixas = UTILS.obterTodasFaixas();
    
    faixas.forEach(faixa => {
        const div = document.createElement('div');
        div.className = 'faixa-item-inline';
        div.innerHTML = `
            <label class="faixa-label">${faixa.label}</label>
            <input 
                type="number" 
                id="faixa-${faixa.id}" 
                class="faixa-input" 
                min="0" 
                max="999" 
                value="0"
                placeholder="0"
            >
        `;
        container.appendChild(div);
    });
    
    console.log('%c✅ [COTADOR] Faixas etárias geradas:', 'color: #16a34a; font-weight: bold;', faixas.length);
}

/**
 * Gerar checkboxes de planos Premium II-IV
 */
function gerarPlanos() {
    console.log('%c🎨 [COTADOR] Gerando planos Premium II-IV...', 'color: #8b5cf6; font-weight: bold;');
    
    const container = document.getElementById('planosCheckboxesContainer');
    if (!container) {
        console.error('%c❌ [COTADOR] Container de planos não encontrado!', 'color: #dc2626;');
        return;
    }
    
    container.innerHTML = '';
    
    const planos = ['Premium II', 'Premium III', 'Premium IV']; // ← REMOVIDO Premium I
    
    planos.forEach(plano => {
        const label = document.createElement('label');
        label.className = 'plano-checkbox-card';
        label.innerHTML = `
            <input type="checkbox" name="plano" value="${plano}" class="plano-checkbox" onchange="contarPlanos()">
            <div class="plano-checkbox-content">
                <i class="fas fa-check-circle"></i>
                <span>${plano}</span>
            </div>
        `;
        container.appendChild(label);
    });
    
    console.log('%c✅ [COTADOR] Planos gerados:', 'color: #16a34a; font-weight: bold;', planos.length);
}

/**
 * Contar planos selecionados
 */
function contarPlanos() {
    const checkboxes = document.querySelectorAll('input[name="plano"]:checked');
    const count = checkboxes.length;
    
    const countSpan = document.getElementById('planosCount');
    if (countSpan) {
        countSpan.textContent = count;
    }
    
    // Coletar planos selecionados
    planosSelecionados = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('%c📊 [COTADOR] Planos selecionados:', 'color: #0066cc;', planosSelecionados);
}

/**
 * Copiar imagem para WhatsApp (vendedor para baixo)
 */
async function copiarParaWhatsApp() {
    console.log('%c💬 [COTADOR] Gerando imagem para WhatsApp...', 'color: #25D366; font-weight: bold;');
    
    if (!comparacaoAtual) {
        alert('⚠️ Nenhuma comparação disponível!');
        return;
    }

    const btn = document.getElementById('btnWhatsAppText');
    const originalText = btn ? btn.textContent : 'Copiar para WhatsApp';

    try {
        if (btn) btn.textContent = 'Capturando...';
        
        // Capturar apenas a área de captura
        const areaCaptura = document.getElementById('areaCaptura');
        
        if (!areaCaptura) {
            alert('❌ Área de captura não encontrada!');
            if (btn) btn.textContent = originalText;
            return;
        }
        
        console.log('%c📸 [COTADOR] Capturando área...', 'color: #8b5cf6; font-weight: bold;');
        
        const canvas = await html2canvas(areaCaptura, {
            scale: 2.5,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: false,
            width: areaCaptura.scrollWidth,
            height: areaCaptura.scrollHeight
        });

        console.log('%c✅ [COTADOR] Imagem capturada!', 'color: #16a34a; font-weight: bold;');

        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                
                if (btn) {
                    btn.textContent = '✅ Copiado!';
                    setTimeout(() => { btn.textContent = originalText; }, 2000);
                }
                
                console.log('%c✅ [COTADOR] Imagem copiada para área de transferência!', 'color: #16a34a; font-weight: bold;');
                
            } catch (err) {
                console.error('%c❌ [COTADOR] Erro ao copiar:', 'color: #dc2626; font-weight: bold;', err);
                alert('❌ Erro ao copiar. Tente novamente!');
                if (btn) btn.textContent = originalText;
            }
        }, 'image/png');
        
    } catch (error) {
        console.error('%c❌ [COTADOR] Erro ao capturar imagem:', 'color: #dc2626; font-weight: bold;', error);
        alert('❌ Erro ao capturar imagem. Tente novamente!');
        if (btn) btn.textContent = originalText;
    }
}

/**
 * Obter URL da imagem baseada na COMBINAÇÃO de planos selecionados
 * @param {Array} planosArray - Array com os planos selecionados (ex: ['Premium II', 'Premium IV'])
 * @returns {string|null} URL da imagem do Imgur
 */
function obterImagemPlano(planosArray) {
    console.log('%c🖼️ [COTADOR] Buscando imagem para combinação:', 'color: #8b5cf6; font-weight: bold;', planosArray);
    
    // Ordenar alfabeticamente para criar chave única
    const chave = planosArray.sort().join(' + ');
    
    console.log('%c🔑 [COTADOR] Chave gerada:', 'color: #8b5cf6;', chave);
    
    // Mapeamento de COMBINAÇÕES para URLs do Imgur
    const imagensCombinacoes = {
        // ===== PLANOS INDIVIDUAIS =====
        'Premium II': 'https://i.imgur.com/LINK_APENAS_II.png',
        'Premium III': 'https://i.imgur.com/LINK_APENAS_III.png',
        'Premium IV': 'https://i.imgur.com/LINK_APENAS_IV.png',
        
        // ===== COMBINAÇÕES DE 2 PLANOS =====
        'Premium II + Premium III': 'https://i.imgur.com/LINK_II_E_III.png',
        'Premium II + Premium IV': 'https://i.imgur.com/LINK_II_E_IV.png',
        'Premium III + Premium IV': 'https://i.imgur.com/LINK_III_E_IV.png',
        
        // ===== COMBINAÇÃO DE 3 PLANOS =====
        'Premium II + Premium III + Premium IV': 'https://i.imgur.com/LINK_II_III_IV.png'
    };
    
    const urlImagem = imagensCombinacoes[chave] || null;
    
    if (urlImagem) {
        console.log('%c✅ [COTADOR] Imagem encontrada:', 'color: #16a34a; font-weight: bold;', urlImagem);
    } else {
        console.warn('%c⚠️ [COTADOR] Nenhuma imagem encontrada para:', 'color: #ea580c; font-weight: bold;', chave);
    }
    
    return urlImagem;
}

/**
 * Imprimir PDF
 */
function imprimirPDF() {
    console.log('%c🖨️ [COTADOR] Iniciando impressão...', 'color: #0066cc; font-weight: bold;');
    
    if (!comparacaoAtual || !comparacaoAtual.resultados) {
        alert('⚠️ Gere a comparação primeiro!');
        return;
    }

    // ===== OBTER IMAGEM DA COMBINAÇÃO DE PLANOS =====
    const planosArray = comparacaoAtual.planos; // Array com os planos selecionados
    const imageUrl = obterImagemPlano(planosArray);
    
    console.log('%c📋 [COTADOR] Planos selecionados:', 'color: #0066cc;', planosArray);
    console.log('%c🖼️ [COTADOR] URL da imagem:', 'color: #8b5cf6;', imageUrl);
    
    if (!imageUrl) {
        console.warn('%c⚠️ [COTADOR] Sem imagem, imprimindo apenas cotação...', 'color: #ea580c;');
        window.print();
        return;
    }
    
    // ===== VERIFICAR E CRIAR CONTAINER =====
    let container = document.getElementById('printImageContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'printImageContainer';
        document.body.appendChild(container);
    }
    
    // ===== CRIAR OU OBTER IMAGEM =====
    let img = container.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        container.appendChild(img);
    }
    
    // ===== CARREGAR IMAGEM =====
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = () => {
        console.log('%c✅ [COTADOR] Imagem carregada!', 'color: #16a34a;');
        img.src = imageUrl;
        
        setTimeout(() => {
            console.log('%c🖨️ [COTADOR] Imprimindo...', 'color: #0066cc;');
            window.print();
        }, 500);
    };
    
    tempImg.onerror = () => {
        console.error('%c❌ [COTADOR] Erro ao carregar imagem!', 'color: #dc2626;');
        alert('❌ Erro ao carregar imagem. Imprimindo sem ela.');
        window.print();
    };
    
    tempImg.src = imageUrl;
}

// ============================================================================
// RESET E NOVA COMPARAÇÃO
// ============================================================================

/**
 * Iniciar nova comparação (limpar tudo)
 */
function novaComparacao() {
    console.log('%c🔄 [COTADOR] Iniciando nova comparação...', 'color: #8b5cf6; font-weight: bold;');
    
    // Limpar variáveis
    clienteDados = {};
    faixasSelecionadas.clear();
    planosSelecionados = [];
    comparacaoAtual = null;
    
    // Limpar inputs
    const inputs = ['clienteNome', 'clienteTelefone', 'clienteEmail'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = id === 'clienteTelefone' ? '(18) ' : '';
        }
    });
    
    // Limpar faixas
    for (let i = 1; i <= 10; i++) {
        const input = document.getElementById(`faixa-f${i}`);
        if (input) input.value = '0';
    }
    
    // Limpar planos
    document.querySelectorAll('input[name="plano"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Resetar contador
    const countSpan = document.getElementById('planosCount');
    if (countSpan) countSpan.textContent = '0';
    
    // Desabilitar botão de avançar
    const btnAvancar = document.getElementById('btnAvancarCliente');
    if (btnAvancar) btnAvancar.disabled = true;
    
    console.log('%c✅ [COTADOR] Sistema resetado com sucesso!', 'color: #16a34a; font-weight: bold;');
    
    // Voltar para primeira aba
    mudarAba(0);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Configurar event listeners do sistema
 */
function configurarEventListeners() {
    console.log('%c🎧 [COTADOR] Configurando event listeners...', 'color: #8b5cf6; font-weight: bold;');
    
    // ===== VALIDAÇÃO EM TEMPO REAL (ABA CLIENTE) =====
    const inputs = ['clienteNome', 'clienteTelefone'];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', validarFormularioCliente);
        }
    });
    
    // ===== MÁSCARA DE TELEFONE =====
    const inputTelefone = document.getElementById('clienteTelefone');
    if (inputTelefone) {
        UTILS.aplicarMascaraTelefone(inputTelefone);
        
        // Pré-preencher com DDD 18
        inputTelefone.value = '(18) ';
        
        inputTelefone.addEventListener('focus', function() {
            if (this.value === '' || this.value === '(__) _____-____') {
                this.value = '(18) ';
            }
        });
        
        console.log('%c✅ [COTADOR] Máscara de telefone aplicada', 'color: #16a34a;');
    }
    
    console.log('%c✅ [COTADOR] Event listeners configurados!', 'color: #16a34a; font-weight: bold;');
}

/**
 * Validar formulário do cliente em tempo real
 */
function validarFormularioCliente() {
    const nome = document.getElementById('clienteNome').value.trim();
    const telefone = document.getElementById('clienteTelefone').value.trim();
    
    // Validar apenas nome e telefone (tipo é fixo agora)
    const valido = nome.length >= 3 && telefone.length >= 14;
    
    const btnAvancar = document.getElementById('btnAvancarCliente');
    if (btnAvancar) {
        btnAvancar.disabled = !valido;
    }
    
    console.log('%c🔍 [COTADOR] Validação cliente:', 'color: #0066cc;', { 
        nome: nome.length >= 3, 
        telefone: telefone.length >= 14,
        valido 
    });
}

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

/**
 * Inicializar sistema quando DOM estiver pronto
 */
async function inicializarSistema() {
    console.log('%c🚀 [COTADOR] Inicializando sistema...', 'color: #8b5cf6; font-weight: bold; font-size: 16px;');
    
    try {
        // 1. Verificar autenticação
        console.log('%c🔐 [COTADOR] Verificando autenticação...', 'color: #0066cc;');
        await verificarCacheVendedor();
        
        // 2. Carregar valores dos planos
        console.log('%c📥 [COTADOR] Carregando valores dos planos...', 'color: #0066cc;');
        const valoresCarregados = await COMPARISON.carregarValoresPlanos();
        
        if (!valoresCarregados) {
            console.error('%c❌ [COTADOR] Falha ao carregar valores!', 'color: #dc2626; font-weight: bold;');
            return;
        }
        
        // 3. Gerar faixas etárias
        console.log('%c🎨 [COTADOR] Gerando faixas etárias...', 'color: #0066cc;');
        gerarFaixasEtarias();
        
        // 4. Configurar event listeners
        console.log('%c🎧 [COTADOR] Configurando listeners...', 'color: #0066cc;');
        configurarEventListeners();
        
        console.log('%c✅ [COTADOR] Sistema inicializado com sucesso!', 'color: #16a34a; font-weight: bold; font-size: 16px;');
        
    } catch (erro) {
        console.error('%c❌ [COTADOR] Erro na inicialização:', 'color: #dc2626; font-weight: bold;', erro);
    }
}

// ============================================================================
// AUTO-INICIALIZAÇÃO
// ============================================================================

// Aguardar DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistema);
} else {
    // DOM já está pronto
    inicializarSistema();
}

console.log('%c✅ [ASSIS] cotador.js carregado', 'color: #16a34a; font-weight: bold;');