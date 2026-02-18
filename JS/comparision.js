/**
 * @file comparison.js
 * @description Lógica de comparação de planos e integração com Google Sheets
 * @projeto Cotador Oeste Saúde Assis
 * @versao 2.0
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw2gBtauS6x3WefqKfEvOSRsf2AVnZfOm8GwTohAT_j-xN_u8uZoUuqaEfJhuaX4eXGIQ/exec';

console.log('%c✅ [COMPARISON] URL do Google Sheets:', 'color: #16a34a; font-weight: bold;', GOOGLE_SHEET_URL);

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let valoresPlanosBase = {};
let valoresCarregados = false;

// ============================================================================
// CARREGAMENTO DE VALORES
// ============================================================================

/**
 * Carregar valores dos planos do Google Sheets
 * @returns {Promise<boolean>} True se carregado com sucesso
 */
async function carregarValoresPlanos() {
    return new Promise((resolve, reject) => {
        console.log('%c📥 [COMPARISON] Iniciando carregamento de valores...', 'color: #0066cc; font-weight: bold;');
        
        LOADING_SERVICE.show('📥 Carregando valores dos planos...', 'default');
        
        // URL com cache-busting
        const url = `${GOOGLE_SHEET_URL}?t=${new Date().getTime()}`;
        
        console.log('%c🌐 [COMPARISON] Fazendo requisição via XMLHttpRequest:', 'color: #0066cc;', url);
        
        // Usar XMLHttpRequest ao invés de fetch (melhor compatibilidade)
        const xhr = new XMLHttpRequest();
        
        xhr.open('GET', url, true);
        
        xhr.onload = function() {
            console.log('%c📦 [COMPARISON] Status da resposta:', 'color: #0066cc;', xhr.status);
            
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    
                    console.log('%c📦 [COMPARISON] Resposta recebida:', 'color: #0066cc;', result);
                    
                    if (result.status === 'success') {
                        valoresPlanosBase = result.data;
                        valoresCarregados = true;
                        
                        console.log('%c✅ [COMPARISON] Valores carregados com sucesso!', 'color: #16a34a; font-weight: bold;');
                        console.log('%c📊 [COMPARISON] Estrutura dos dados:', 'color: #0066cc;', Object.keys(valoresPlanosBase));
                        
                        LOADING_SERVICE.hide();
                        resolve(true);
                    } else {
                        throw new Error(result.message || 'Erro desconhecido ao carregar valores');
                    }
                } catch (error) {
                    console.error('%c❌ [COMPARISON] Erro ao parsear JSON:', 'color: #dc2626; font-weight: bold;', error);
                    LOADING_SERVICE.error('❌ Erro ao processar dados da planilha.');
                    resolve(false);
                }
            } else {
                console.error('%c❌ [COMPARISON] Erro HTTP:', 'color: #dc2626; font-weight: bold;', xhr.status, xhr.statusText);
                LOADING_SERVICE.error('❌ Erro ao carregar valores da planilha.');
                resolve(false);
            }
        };
        
        xhr.onerror = function() {
            console.error('%c❌ [COMPARISON] Erro de rede ou CORS:', 'color: #dc2626; font-weight: bold;');
            console.error('%c💡 [COMPARISON] Possíveis causas:', 'color: #f59e0b;');
            console.error('  1. Firewall ou antivírus bloqueando a requisição');
            console.error('  2. Proxy corporativo');
            console.error('  3. Extensão do navegador (AdBlock, etc)');
            console.error('  4. Política de segurança do navegador');
            
            LOADING_SERVICE.error('❌ Erro de conexão. Verifique firewall/antivírus.');
            resolve(false);
        };
        
        xhr.ontimeout = function() {
            console.error('%c❌ [COMPARISON] Timeout da requisição', 'color: #dc2626; font-weight: bold;');
            LOADING_SERVICE.error('❌ Timeout ao carregar valores.');
            resolve(false);
        };
        
        xhr.timeout = 15000; // 15 segundos de timeout
        
        console.log('%c🚀 [COMPARISON] Enviando requisição...', 'color: #8b5cf6;');
        xhr.send();
    });
}

// ============================================================================
// OBTER VALOR DE PLANO
// ============================================================================

/**
 * Obter valor de um plano para uma faixa específica
 * @param {string} tipo - Tipo de plano (Empresarial 2-29, Empresarial 30+, Coletivo por Adesão)
 * @param {string} plano - Nome do plano (Premium I, Premium II, Premium III, Premium IV)
 * @param {string} faixaChave - Chave da faixa (f1, f2, ..., f10)
 * @returns {number} Valor do plano para a faixa
 */
function obterValorPlano(tipo, plano, faixaChave) {
    if (!valoresCarregados) {
        console.warn('%c⚠️ [COMPARISON] Valores ainda não foram carregados!', 'color: #ea580c; font-weight: bold;');
        return 0;
    }
    
    console.log('%c🔍 [COMPARISON] Buscando valor:', 'color: #0066cc;', { tipo, plano, faixaChave });
    
    // Estrutura esperada: valoresPlanosBase[tipo][plano][faixaChave]
    if (valoresPlanosBase[tipo] && 
        valoresPlanosBase[tipo][plano] && 
        valoresPlanosBase[tipo][plano][faixaChave] !== undefined) {
        
        const valor = parseFloat(valoresPlanosBase[tipo][plano][faixaChave]) || 0;
        
        console.log('%c✅ [COMPARISON] Valor encontrado:', 'color: #16a34a;', valor);
        
        return valor;
    }
    
    console.warn(`%c⚠️ [COMPARISON] Valor não encontrado para: ${tipo} > ${plano} > ${faixaChave}`, 'color: #ea580c; font-weight: bold;');
    return 0;
}

// ============================================================================
// GERAR COMPARAÇÃO
// ============================================================================

/**
 * Gerar comparação de planos
 */
function gerarComparacao() {
    console.log('%c🎯 [COMPARISON] Iniciando geração de comparação...', 'color: #8b5cf6; font-weight: bold;');
    
    // ===== VALIDAÇÃO 1: Faixas selecionadas =====
    if (!faixasSelecionadas || faixasSelecionadas.size === 0) {
        console.warn('%c⚠️ [COMPARISON] Nenhuma faixa selecionada', 'color: #ea580c; font-weight: bold;');
        UTILS.showTutorialModal(2);
        return;
    }
    
    // ===== VALIDAÇÃO 2: Contar total de pessoas =====
    const faixasComQuantidade = [];
    let totalPessoas = 0;
    
    faixasSelecionadas.forEach((qtd, faixa) => {
        if (qtd > 0) {
            const info = UTILS.obterFaixaInfo(faixa);
            faixasComQuantidade.push({ 
                chave: faixa,
                nome: info.label, 
                descricao: info.descricao,
                qtd: qtd 
            });
            totalPessoas += qtd;
        }
    });
    
    console.log('%c👥 [COMPARISON] Total de pessoas:', 'color: #0066cc; font-weight: bold;', totalPessoas);
    console.log('%c📦 [COMPARISON] Faixas com quantidade:', 'color: #0066cc;', faixasComQuantidade);
    
    if (faixasComQuantidade.length === 0) {
        console.warn('%c⚠️ [COMPARISON] Nenhuma faixa com quantidade válida', 'color: #ea580c; font-weight: bold;');
        UTILS.showTutorialModal(2);
        return;
    }
    
    // ===== VALIDAÇÃO 3: Planos selecionados =====
    if (!planosSelecionados || planosSelecionados.length === 0) {
        console.warn('%c⚠️ [COMPARISON] Nenhum plano selecionado', 'color: #ea580c; font-weight: bold;');
        UTILS.showTutorialModal(3);
        return;
    }
    
    console.log('%c✅ [COMPARISON] Validações passaram!', 'color: #16a34a; font-weight: bold;');
    
    // ===== CALCULAR VALORES =====
    const tipo = clienteDados.tipo;
    
    console.log('%c💰 [COMPARISON] Calculando valores...', 'color: #8b5cf6; font-weight: bold;');
    
    let resultados = planosSelecionados.map(plano => {
        console.log(`%c📊 [COMPARISON] Calculando: ${plano}`, 'color: #0066cc; font-weight: bold;');
        
        let subtotal = 0;
        
        faixasComQuantidade.forEach(f => {
            const valorUnitario = obterValorPlano(tipo, plano, f.chave);
            const valorFaixa = valorUnitario * f.qtd;
            
            console.log(`  - ${f.nome}: ${f.qtd} x ${UTILS.formatarMoeda(valorUnitario)} = ${UTILS.formatarMoeda(valorFaixa)}`);
            
            subtotal += valorFaixa;
        });
        
        console.log(`%c  ✅ Subtotal ${plano}: ${UTILS.formatarMoeda(subtotal)}`, 'color: #16a34a; font-weight: bold;');
        
        return { 
            plano, 
            subtotal,
            valorFinal: subtotal 
        };
    });
    
    // ===== ORDENAR PLANOS (IV → III → II → I) =====
    const ordemPlanos = ['Premium IV', 'Premium III', 'Premium II', 'Premium I'];
    resultados.sort((a, b) => {
        const indexA = ordemPlanos.findIndex(p => a.plano.includes(p));
        const indexB = ordemPlanos.findIndex(p => b.plano.includes(p));
        return indexA - indexB;
    });
    
    // ===== SALVAR COMPARAÇÃO ATUAL =====
    comparacaoAtual = {
        vendedor: vendedorLogado,
        tipo: tipo,
        cliente: clienteDados.nome,
        telefoneCliente: clienteDados.telefone,
        emailCliente: clienteDados.email,
        planos: planosSelecionados,
        faixas: faixasComQuantidade,
        resultados: resultados,
        totalPessoas: totalPessoas,
        timestamp: new Date().getTime()
    };
    
    console.log('%c✅ [COMPARISON] Comparação gerada:', 'color: #16a34a; font-weight: bold;', comparacaoAtual);
    
    // ===== RENDERIZAR RESULTADO =====
    renderizarResultado();
    
    // ===== AVANÇAR PARA ABA DE RESULTADO =====
    mudarAba(3);
}

// ============================================================================
// RENDERIZAR RESULTADO
// ============================================================================

/**
 * Renderizar tabela de resultado
 */
/**
 * Renderizar tabela de resultado
 */
function renderizarResultado() {
    console.log('%c🎨 [COMPARISON] Renderizando resultado...', 'color: #8b5cf6; font-weight: bold;');
    
    const { vendedor, tipo, cliente, faixas, resultados, telefoneCliente, emailCliente } = comparacaoAtual;
    
    // ===== PREENCHER DADOS DO VENDEDOR =====
    const dadosVendedor = VENDEDOR_SERVICE.obterDadosVendedorLocal(vendedor);
    
    document.getElementById('previewVendedor').textContent = dadosVendedor.nome;
    document.getElementById('previewTelefone').textContent = UTILS.formatarTelefone(dadosVendedor.telefone);
    document.getElementById('previewEmail').textContent = dadosVendedor.email;
    
    // ===== PREENCHER DADOS DA COTAÇÃO =====
    document.getElementById('previewTipo').textContent = tipo;
    document.getElementById('previewCliente').textContent = cliente;
    
    // ===== DATA/HORA =====
    const agora = new Date();
    document.getElementById('dataComparacao').textContent = UTILS.formatarDataHora(agora);
    
    // ===== IDENTIFICAR MELHOR VALOR =====
    const menorValor = Math.min(...resultados.map(r => r.valorFinal));
    
    console.log('%c⭐ [COMPARISON] Melhor valor:', 'color: #fbbf24; font-weight: bold;', UTILS.formatarMoeda(menorValor));
    
    // ===== GERAR TABELA HTML =====
    let tabelaHTML = '<table class="w-full border-collapse" style="width: 100%; border-collapse: collapse;"><thead>';
    tabelaHTML += '<tr style="background-color: #f3f4f6;">';
    tabelaHTML += '<th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold; font-size: 14px;">Faixa Etária</th>';
    tabelaHTML += '<th style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: bold; font-size: 14px;">Qtd</th>';
    
    resultados.forEach(r => {
        tabelaHTML += `<th style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: bold; font-size: 14px;">${r.plano}</th>`;
    });
    
    tabelaHTML += '</tr></thead><tbody>';
    
    // ===== LINHAS DE FAIXAS =====
    faixas.forEach(f => {
        tabelaHTML += '<tr>';
        tabelaHTML += `<td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600; font-size: 13px;">${f.nome}</td>`;
        tabelaHTML += `<td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-size: 13px;">${f.qtd}</td>`;
        
        resultados.forEach(r => {
            const valorUnitario = obterValorPlano(tipo, r.plano, f.chave);
            tabelaHTML += `<td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-size: 13px;">${UTILS.formatarMoeda(valorUnitario)}</td>`;
        });
        
        tabelaHTML += '</tr>';
    });
    
    // ===== LINHA DE SUBTOTAL =====
    tabelaHTML += '<tr class="bg-blue-50" style="background-color: #eff6ff;">';
    tabelaHTML += '<td colspan="2" style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold; font-size: 13px;">SUBTOTAL</td>';
    
    resultados.forEach(r => {
        tabelaHTML += `<td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: bold; font-size: 13px; background-color: #eff6ff;">${UTILS.formatarMoeda(r.subtotal)}</td>`;
    });
    
    tabelaHTML += '</tr>';
    
    // ===== LINHA DE TOTAL =====
    tabelaHTML += '<tr class="total-row" style="background: linear-gradient(to right, #003D58, #00758C); color: white;">';
    tabelaHTML += '<td colspan="2" style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold; font-size: 13px; color: white;">VALOR TOTAL</td>';
    
    resultados.forEach(r => {
        const isMelhor = r.valorFinal === menorValor;
        
        tabelaHTML += `<td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: bold; font-size: 13px; color: white; background: ${isMelhor ? '#00758C' : 'transparent'};">
            ${UTILS.formatarMoeda(r.valorFinal)}
            ${isMelhor ? '<br><span style="font-size: 11px; color: white; font-weight: bold;">⭐ MELHOR</span>' : ''}
        </td>`;
    });
    
    tabelaHTML += '</tr>';
    tabelaHTML += '</tbody></table>';
    
    // ===== ADICIONAR DESTAQUE DO MELHOR =====
    const melhorPlano = resultados.find(r => r.valorFinal === menorValor);
    tabelaHTML += `
        <div class="bg-yellow-50" style="margin-top: 16px; padding: 12px; background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; text-align: center;">
            <p style="font-size: 13px; font-weight: bold; color: #92400e;">
                <i class="fas fa-star" style="color: #fbbf24;"></i>
                Melhor Custo-Benefício: ${melhorPlano.plano} - ${UTILS.formatarMoeda(menorValor)}
            </p>
        </div>
    `;
    
    // ===== INSERIR NO DOM =====
    document.getElementById('tabelaComparativa').innerHTML = tabelaHTML;
    
    console.log('%c✅ [COMPARISON] Tabela renderizada com sucesso!', 'color: #16a34a; font-weight: bold;');
}

// ============================================================================
// DISPONIBILIZAR GLOBALMENTE
// ============================================================================

window.COMPARISON = {
    carregarValoresPlanos,
    obterValorPlano,
    gerarComparacao,
    renderizarResultado
};

console.log('%c✅ [ASSIS] comparison.js carregado', 'color: #16a34a; font-weight: bold;');