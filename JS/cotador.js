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
    console.log('%c➡️ [COTADOR] Tentando avançar Aba 1 → Aba 2', 'color: #8b5cf6; font-weight: bold;');
    
    // Coletar dados
    const nome = document.getElementById('clienteNome').value.trim();
    const telefone = document.getElementById('clienteTelefone').value.trim();
    const email = document.getElementById('clienteEmail').value.trim();
    const tipo = document.querySelector('input[name="clienteTipo"]:checked')?.value;
    
    console.log('%c📦 [COTADOR] Dados coletados:', 'color: #0066cc;', { nome, telefone, email, tipo });
    
    // Validar
    if (!nome || nome.length < 3) {
        alert('⚠️ Preencha o nome do cliente (mínimo 3 caracteres)!');
        document.getElementById('clienteNome').focus();
        return;
    }
    
    if (!telefone || telefone.length < 14) {
        alert('⚠️ Preencha o telefone completo!');
        document.getElementById('clienteTelefone').focus();
        return;
    }
    
    if (!tipo) {
        alert('⚠️ Selecione o tipo de plano!');
        return;
    }
    
    // Salvar dados
    clienteDados = { nome, telefone, email, tipo };
    
    console.log('%c✅ [COTADOR] Dados do cliente salvos:', 'color: #16a34a; font-weight: bold;', clienteDados);
    
    // Gerar faixas etárias
    gerarFaixasEtarias();
    
    // Avançar
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
 * Gerar checkboxes de planos Premium I-IV
 */
function gerarPlanos() {
    console.log('%c🎨 [COTADOR] Gerando planos Premium I-IV...', 'color: #8b5cf6; font-weight: bold;');
    
    const container = document.getElementById('planosCheckboxesContainer');
    if (!container) {
        console.error('%c❌ [COTADOR] Container de planos não encontrado!', 'color: #dc2626;');
        return;
    }
    
    container.innerHTML = '';
    
    const planos = ['Premium I', 'Premium II', 'Premium III', 'Premium IV'];
    
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

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

/**
 * Copiar comparação para WhatsApp
 */
function copiarParaWhatsApp() {
    console.log('%c💬 [COTADOR] Gerando texto para WhatsApp...', 'color: #25D366; font-weight: bold;');
    
    if (!comparacaoAtual) {
        alert('⚠️ Nenhuma comparação disponível!');
        return;
    }
    
    let texto = `🏥 *COTAÇÃO OESTE SAÚDE ASSIS*\n\n`;
    texto += `📋 *Dados da Cotação*\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `👤 Cliente: ${comparacaoAtual.cliente}\n`;
    texto += `📞 Telefone: ${comparacaoAtual.telefoneCliente}\n`;
    if (comparacaoAtual.emailCliente) {
        texto += `📧 Email: ${comparacaoAtual.emailCliente}\n`;
    }
    texto += `🏷️ Tipo: ${comparacaoAtual.tipo}\n`;
    texto += `👥 Total: ${comparacaoAtual.totalPessoas} pessoa${comparacaoAtual.totalPessoas > 1 ? 's' : ''}\n\n`;
    
    texto += `👥 *Faixas Etárias Selecionadas:*\n`;
    comparacaoAtual.faixas.forEach(f => {
        texto += `• ${f.nome}: ${f.qtd} pessoa${f.qtd > 1 ? 's' : ''}\n`;
    });
    texto += `\n`;
    
    texto += `💰 *Valores dos Planos:*\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━\n`;
    comparacaoAtual.resultados.forEach(r => {
        texto += `\n📌 *${r.plano}*\n`;
        texto += `   Subtotal: ${UTILS.formatarMoeda(r.subtotal)}\n`;
        texto += `   *Total: ${UTILS.formatarMoeda(r.valorFinal)}*\n`;
    });
    
    // Identificar melhor valor
    const menorValor = Math.min(...comparacaoAtual.resultados.map(r => r.valorFinal));
    const melhorPlano = comparacaoAtual.resultados.find(r => r.valorFinal === menorValor);
    
    texto += `\n⭐ *MELHOR CUSTO-BENEFÍCIO:*\n`;
    texto += `${melhorPlano.plano} - ${UTILS.formatarMoeda(menorValor)}\n\n`;
    
    texto += `━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `👤 Vendedor: ${comparacaoAtual.vendedor}\n`;
    const dadosVendedor = VENDEDOR_SERVICE.obterDadosVendedorLocal();
    texto += `📞 Contato: ${dadosVendedor.telefone}\n`;
    texto += `📧 Email: ${dadosVendedor.email}\n\n`;
    texto += `📅 Gerado em: ${UTILS.formatarDataHora(new Date())}\n`;
    
    console.log('%c📝 [COTADOR] Texto gerado:', 'color: #0066cc;', texto);
    
    // Copiar para clipboard
    UTILS.copiarParaClipboard(texto).then(sucesso => {
        if (sucesso) {
            // Feedback visual
            const btn = event.target.closest('button');
            const textoOriginal = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            btn.classList.add('bg-green-600');
            
            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.classList.remove('bg-green-600');
            }, 2000);
            
            console.log('%c✅ [COTADOR] Texto copiado para WhatsApp!', 'color: #16a34a; font-weight: bold;');
        } else {
            alert('❌ Erro ao copiar. Tente novamente.');
        }
    });
}

/**
 * Imprimir comparação em PDF
 */
function imprimirPDF() {
    console.log('%c🖨️ [COTADOR] Preparando impressão...', 'color: #8b5cf6; font-weight: bold;');
    
    if (!comparacaoAtual) {
        alert('⚠️ Nenhuma comparação disponível!');
        return;
    }
    
    // Abrir diálogo de impressão
    window.print();
    
    console.log('%c✅ [COTADOR] Diálogo de impressão aberto', 'color: #16a34a; font-weight: bold;');
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
    
    // Limpar tipo
    document.querySelectorAll('input[name="clienteTipo"]').forEach(radio => {
        radio.checked = false;
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
    
    // Radios de tipo
    document.querySelectorAll('input[name="clienteTipo"]').forEach(radio => {
        radio.addEventListener('change', validarFormularioCliente);
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
    const tipo = document.querySelector('input[name="clienteTipo"]:checked');
    
    const valido = nome.length >= 3 && telefone.length >= 14 && tipo;
    
    const btnAvancar = document.getElementById('btnAvancarCliente');
    if (btnAvancar) {
        btnAvancar.disabled = !valido;
    }
    
    console.log('%c🔍 [COTADOR] Validação cliente:', 'color: #0066cc;', { 
        nome: nome.length >= 3, 
        telefone: telefone.length >= 14, 
        tipo: !!tipo,
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
        
        // 3. Configurar event listeners
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