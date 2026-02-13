/**
 * @file utils.js
 * @description Funções utilitárias do Cotador Oeste Saúde Assis
 * @projeto Cotador Oeste Saúde Assis
 * @versao 2.0
 */

// ============================================================================
// FORMATAÇÃO DE VALORES
// ============================================================================

/**
 * Formatar valor para moeda brasileira (R$)
 * @param {number} valor - Valor numérico
 * @returns {string} Valor formatado (Ex: R$ 1.250,00)
 */
const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Formatar telefone para exibição
 * @param {string} telefone - Telefone com ou sem formatação
 * @returns {string} Telefone formatado (XX) XXXXX-XXXX
 */
const formatarTelefone = (telefone) => {
    if (!telefone) return '';
    
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
        return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    } 
    else if (apenasNumeros.length === 10) {
        return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    }
    
    return telefone;
};

/**
 * Formatar CPF para exibição
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {string} CPF formatado XXX.XXX.XXX-XX
 */
const formatarCPF = (cpf) => {
    if (!cpf) return '';
    
    const apenasNumeros = cpf.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
        return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9)}`;
    }
    
    return cpf;
};

/**
 * Formatar data para formato brasileiro
 * @param {Date|string} data - Data
 * @returns {string} Data formatada DD/MM/YYYY
 */
const formatarData = (data) => {
    if (!data) return '';
    
    const dataObj = data instanceof Date ? data : new Date(data);
    
    if (isNaN(dataObj.getTime())) return '';
    
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
};

/**
 * Formatar data e hora para formato brasileiro
 * @param {Date|string} data - Data
 * @returns {string} Data e hora formatada DD/MM/YYYY HH:MM
 */
const formatarDataHora = (data) => {
    if (!data) return '';
    
    const dataObj = data instanceof Date ? data : new Date(data);
    
    if (isNaN(dataObj.getTime())) return '';
    
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minuto = String(dataObj.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
};

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Validar email
 * @param {string} email - Email para validar
 * @returns {boolean} True se válido
 */
const validarEmail = (email) => {
    if (!email) return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Validar telefone
 * @param {string} telefone - Telefone para validar
 * @returns {boolean} True se válido
 */
const validarTelefone = (telefone) => {
    if (!telefone) return false;
    
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    return apenasNumeros.length === 10 || apenasNumeros.length === 11;
};

/**
 * Validar CPF
 * @param {string} cpf - CPF para validar
 * @returns {boolean} True se válido
 */
const validarCPF = (cpf) => {
    if (!cpf) return false;
    
    const apenasNumeros = cpf.replace(/\D/g, '');
    
    if (apenasNumeros.length !== 11) return false;
    
    // Validação básica (todos os dígitos iguais)
    if (/^(\d)\1{10}$/.test(apenasNumeros)) return false;
    
    // Validação completa dos dígitos verificadores
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(apenasNumeros.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(apenasNumeros.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(apenasNumeros.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(apenasNumeros.substring(10, 11))) return false;
    
    return true;
};

/**
 * Validar campo obrigatório
 * @param {string} valor - Valor do campo
 * @param {number} [minLength=1] - Tamanho mínimo
 * @returns {boolean} True se válido
 */
const validarCampoObrigatorio = (valor, minLength = 1) => {
    if (!valor) return false;
    return valor.trim().length >= minLength;
};

// ============================================================================
// MÁSCARAS DE INPUT
// ============================================================================

/**
 * Aplicar máscara de telefone em input
 * @param {HTMLInputElement} input - Elemento input
 */
const aplicarMascaraTelefone = (input) => {
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 2) {
            value = value.replace(/(\d{0,2})/, '($1');
        } else if (value.length <= 6) {
            value = value.replace(/(\d{2})(\d{0,4})/, '($1) $2');
        } else if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        
        e.target.value = value;
    });
};

/**
 * Aplicar máscara de CPF em input
 * @param {HTMLInputElement} input - Elemento input
 */
const aplicarMascaraCPF = (input) => {
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 3) {
            value = value.replace(/(\d{0,3})/, '$1');
        } else if (value.length <= 6) {
            value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
        } else if (value.length <= 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        } else {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        }
        
        e.target.value = value;
    });
};

/**
 * Aplicar máscara de moeda em input
 * @param {HTMLInputElement} input - Elemento input
 */
const aplicarMascaraMoeda = (input) => {
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (parseInt(value) / 100).toFixed(2);
        value = value.replace('.', ',');
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        e.target.value = 'R$ ' + value;
    });
};

// ============================================================================
// CÁLCULOS
// ============================================================================

/**
 * Calcular total de pessoas selecionadas
 * @param {Map} faixas - Map de faixas selecionadas
 * @returns {number} Total de pessoas
 */
const calcularTotalPessoas = (faixas) => {
    if (!faixas || faixas.size === 0) return 0;
    
    let total = 0;
    faixas.forEach(qtd => {
        total += parseInt(qtd) || 0;
    });
    
    return total;
};

/**
 * Calcular valor total de um plano
 * @param {object} plano - Dados do plano
 * @param {Map} faixas - Faixas selecionadas
 * @returns {number} Valor total
 */
const calcularValorPlano = (plano, faixas) => {
    if (!plano || !faixas) return 0;
    
    let total = 0;
    
    faixas.forEach((qtd, faixa) => {
        const valorFaixa = plano[faixa] || 0;
        total += valorFaixa * qtd;
    });
    
    return total;
};

/**
 * Aplicar desconto percentual
 * @param {number} valor - Valor original
 * @param {number} percentual - Percentual de desconto (Ex: 15 para 15%)
 * @returns {number} Valor com desconto
 */
const aplicarDesconto = (valor, percentual) => {
    if (!valor || !percentual) return valor;
    
    return valor * (1 - percentual / 100);
};

// ============================================================================
// FAIXAS ETÁRIAS
// ============================================================================

/**
 * Obter informações de uma faixa
 * @param {string} faixa - ID da faixa (f1, f2, etc)
 * @returns {object} Informações da faixa
 */
const obterFaixaInfo = (faixa) => {
    const faixas = {
        f1: { label: 'F1 (0-18)', descricao: '0 a 18 anos', min: 0, max: 18 },
        f2: { label: 'F2 (19-23)', descricao: '19 a 23 anos', min: 19, max: 23 },
        f3: { label: 'F3 (24-28)', descricao: '24 a 28 anos', min: 24, max: 28 },
        f4: { label: 'F4 (29-33)', descricao: '29 a 33 anos', min: 29, max: 33 },
        f5: { label: 'F5 (34-38)', descricao: '34 a 38 anos', min: 34, max: 38 },
        f6: { label: 'F6 (39-43)', descricao: '39 a 43 anos', min: 39, max: 43 },
        f7: { label: 'F7 (44-48)', descricao: '44 a 48 anos', min: 44, max: 48 },
        f8: { label: 'F8 (49-53)', descricao: '49 a 53 anos', min: 49, max: 53 },
        f9: { label: 'F9 (54-58)', descricao: '54 a 58 anos', min: 54, max: 58 },
        f10: { label: 'F10 (59+)', descricao: '59 anos ou mais', min: 59, max: 999 }
    };
    
    return faixas[faixa] || {};
};

/**
 * Obter todas as faixas disponíveis
 * @returns {array} Array de faixas
 */
const obterTodasFaixas = () => {
    return [
        { id: 'f1', label: 'F1 (0-18)', descricao: '0 a 18 anos' },
        { id: 'f2', label: 'F2 (19-23)', descricao: '19 a 23 anos' },
        { id: 'f3', label: 'F3 (24-28)', descricao: '24 a 28 anos' },
        { id: 'f4', label: 'F4 (29-33)', descricao: '29 a 33 anos' },
        { id: 'f5', label: 'F5 (34-38)', descricao: '34 a 38 anos' },
        { id: 'f6', label: 'F6 (39-43)', descricao: '39 a 43 anos' },
        { id: 'f7', label: 'F7 (44-48)', descricao: '44 a 48 anos' },
        { id: 'f8', label: 'F8 (49-53)', descricao: '49 a 53 anos' },
        { id: 'f9', label: 'F9 (54-58)', descricao: '54 a 58 anos' },
        { id: 'f10', label: 'F10 (59+)', descricao: '59 anos ou mais' }
    ];
};

// ============================================================================
// MODAIS E UI
// ============================================================================

/**
 * Mostrar modal de tutorial/aviso
 * @param {number} tipo - Tipo do modal (1, 2, 3)
 */
function showTutorialModal(tipo) {
    const messages = {
        1: {
            titulo: '⚠️ Dados Obrigatórios',
            mensagem: 'Preencha todos os dados obrigatórios:\n\n✓ Nome do cliente\n✓ Telefone\n✓ Tipo de plano\n\nDepois clique em "Avançar"!'
        },
        2: {
            titulo: '⚠️ Faixas Não Selecionadas',
            mensagem: 'Selecione pelo menos uma faixa etária:\n\n✓ Escolha uma ou mais faixas\n✓ Informe a quantidade de pessoas\n\nDepois clique em "Avançar"!'
        },
        3: {
            titulo: '⚠️ Planos Não Selecionados',
            mensagem: 'Selecione pelo menos um plano:\n\n✓ Escolha de 1 a 4 planos\n✓ Clique nos planos desejados\n\nDepois clique em "Gerar Comparação"!'
        }
    };

    const config = messages[tipo];
    
    console.log(`%c📚 [UTILS] Modal de tutorial: ${config.titulo}`, 'color: #00A8B0; font-weight: bold;');

    // Criar overlay
    const modal = document.createElement('div');
    modal.id = 'tutorialModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000]';

    // Criar conteúdo do modal
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-11/12 text-center animate-slideUp">
            <h2 class="text-2xl font-bold text-oeste-azul-escuro mb-4">${config.titulo}</h2>
            <p class="text-oeste-cinza-escuro mb-6 whitespace-pre-wrap leading-relaxed">${config.mensagem}</p>
            <button 
                onclick="document.getElementById('tutorialModal').remove()" 
                class="w-full oeste-btn-primary py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
            >
                ✓ Entendi!
            </button>
        </div>
    `;

    // Fechar ao clicar no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

/**
 * Nova comparação - resetar sistema
 */
function novaComparacao() {
    console.log('%c🔄 [UTILS] Iniciando nova cotação...', 'color: #00A8B0; font-weight: bold;');
    
    // Limpar variáveis globais
    if (typeof clienteDados !== 'undefined') clienteDados = {};
    if (typeof faixasSelecionadas !== 'undefined') faixasSelecionadas.clear();
    if (typeof planosSelecionados !== 'undefined') planosSelecionados = [];
    
    // Limpar inputs
    const inputsTexto = ['clienteNome', 'clienteTelefone', 'clienteEmail'];
    inputsTexto.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = id === 'clienteTelefone' ? '(18) ' : '';
        }
    });
    
    // Limpar checkboxes e radios
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(rb => rb.checked = false);
    
    // Limpar faixas
    for (let i = 1; i <= 10; i++) {
        const input = document.getElementById(`faixa-f${i}`);
        if (input) input.value = '0';
    }
    
    // Resetar contador de planos
    const planosCount = document.getElementById('planosCount');
    if (planosCount) planosCount.textContent = '0';
    
    console.log('%c✅ [UTILS] Cotação limpa com sucesso!', 'color: #16a34a; font-weight: bold;');
    
    // Voltar para a primeira aba
    if (typeof mudarAba === 'function') {
        mudarAba(0);
    }
}

// ============================================================================
// HELPERS DIVERSOS
// ============================================================================

/**
 * Copiar texto para clipboard
 * @param {string} texto - Texto para copiar
 * @returns {Promise<boolean>} True se copiado com sucesso
 */
const copiarParaClipboard = async (texto) => {
    try {
        await navigator.clipboard.writeText(texto);
        console.log('%c✅ [UTILS] Texto copiado para clipboard', 'color: #16a34a; font-weight: bold;');
        return true;
    } catch (erro) {
        console.error('%c❌ [UTILS] Erro ao copiar texto:', 'color: #dc2626; font-weight: bold;', erro);
        return false;
    }
};

/**
 * Debounce de função
 * @param {Function} func - Função para debounce
 * @param {number} delay - Delay em ms
 * @returns {Function} Função com debounce
 */
const debounce = (func, delay = 300) => {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Gerar ID único
 * @returns {string} ID único
 */
const gerarID = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// LISTENER DE ESC (FECHAR MODAIS)
// ============================================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        console.log('%c⌨️ [UTILS] ESC pressionado - fechando modais...', 'color: #ea580c; font-weight: bold;');
        
        // Fechar todos os modais visíveis
        const modais = document.querySelectorAll('[id*="modal"]:not(.hidden), [id*="Modal"]:not(.hidden)');
        
        modais.forEach(modal => {
            modal.classList.add('hidden');
            // Ou remover se for modal temporário
            if (modal.id === 'tutorialModal') {
                modal.remove();
            }
        });
        
        // Fechar modal de onboarding
        const onboarding = document.getElementById('onboardingModal');
        if (onboarding && onboarding.classList.contains('active')) {
            if (typeof fecharOnboarding === 'function') {
                fecharOnboarding();
            }
        }
    }
});

// ============================================================================
// DISPONIBILIZAR GLOBALMENTE
// ============================================================================

window.UTILS = {
    // Formatação
    formatarMoeda,
    formatarTelefone,
    formatarCPF,
    formatarData,
    formatarDataHora,
    
    // Validação
    validarEmail,
    validarTelefone,
    validarCPF,
    validarCampoObrigatorio,
    
    // Máscaras
    aplicarMascaraTelefone,
    aplicarMascaraCPF,
    aplicarMascaraMoeda,
    
    // Cálculos
    calcularTotalPessoas,
    calcularValorPlano,
    aplicarDesconto,
    
    // Faixas
    obterFaixaInfo,
    obterTodasFaixas,
    
    // UI
    showTutorialModal,
    novaComparacao,
    
    // Helpers
    copiarParaClipboard,
    debounce,
    gerarID
};

console.log('%c✅ [ASSIS] utils.js carregado', 'color: #16a34a; font-weight: bold;');