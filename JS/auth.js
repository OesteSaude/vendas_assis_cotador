/**
 * @file auth.js
 * @description Autenticação de vendedores no Cotador Oeste Saúde Assis
 * @projeto Cotador Oeste Saúde Assis
 * @versao 2.0
 */

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================
let vendedorLogado = '';
let vendedorUID = '';
let vendedorDados = {};

// ============================================================================
// FORMATAÇÃO DE TELEFONE
// ============================================================================

/**
 * Formatar telefone para exibição
 * @param {string} telefone - Telefone no formato bruto
 * @returns {string} Telefone formatado (XX) XXXXX-XXXX
 */
function formatarTelefoneExibicao(telefone) {
    if (!telefone) return '';
    
    // Remove tudo que não é número
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    console.log('🔧 Formatando telefone:', telefone, '→', apenasNumeros);
    
    // Formata como (XX) XXXXX-XXXX (11 dígitos - celular)
    if (apenasNumeros.length === 11) {
        const formatado = `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
        console.log('✅ Formatado (11 dígitos):', formatado);
        return formatado;
    } 
    // Formata como (XX) XXXX-XXXX (10 dígitos - fixo)
    else if (apenasNumeros.length === 10) {
        const formatado = `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
        console.log('✅ Formatado (10 dígitos):', formatado);
        return formatado;
    }
    
    console.warn('⚠️ Telefone com tamanho inválido:', apenasNumeros.length);
    return telefone;
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Fazer login com email e senha do Firebase
 */
async function fazerLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginPassword').value.trim();

    if (!email || !senha) {
        alert('⚠️ Preencha email e senha!');
        return;
    }

    try {
        // Mostrar loading
        LOADING_SERVICE.show('🔐 Autenticando...', 'default');

        console.log('%c🔐 Tentando autenticar no Firebase...', 'color: #0066cc; font-weight: bold;', email);

        // Autenticar no Firebase
        const resultado = await firebase.auth().signInWithEmailAndPassword(email, senha);

        if (resultado.user) {
            vendedorUID = resultado.user.uid;

            console.log('%c🔐 Buscando dados do Firebase...', 'color: #0066cc; font-weight: bold;');

            // Buscar dados do Firebase
            const database = firebase.database();
            const snapshot = await database.ref(`users/${resultado.user.uid}`).get();

            if (snapshot.exists()) {
                const dadosVendedor = snapshot.val();
                
                // Guardar no localStorage
                localStorage.setItem('vendedorUID', vendedorUID);
                localStorage.setItem('vendedorEmail', dadosVendedor.email);
                localStorage.setItem('vendedorNome', dadosVendedor.nome);
                localStorage.setItem('vendedorTelefone', dadosVendedor.telefone);
                
                // Atualizar variáveis globais
                vendedorLogado = dadosVendedor.nome;
                vendedorDados = dadosVendedor;
                
                console.log('%c✅ Dados carregados do Firebase!', 'color: #16a34a; font-weight: bold;');
                console.log('Nome:', dadosVendedor.nome);
                console.log('Email:', dadosVendedor.email);
                console.log('Telefone:', dadosVendedor.telefone);

            } else {
                console.error('❌ Dados do vendedor não encontrados no Firebase');
                LOADING_SERVICE.error('❌ Erro ao carregar dados do vendedor!');
                return;
            }

            // 🆕 VERIFICAR SE PRECISA TROCAR SENHA
            if (senha === 'Senha123!') {
                console.log('%c⚠️ Senha padrão detectada!', 'color: #ea580c; font-weight: bold;');
                LOADING_SERVICE.hide();
                mostrarModalAlterarSenha();
                return;
            }

            // Carregar valores com loading
            LOADING_SERVICE.show('📥 Carregando dados...', 'default');
            const sucesso = await carregarValoresPlanos();

            if (sucesso) {
                // Preencher dados na tela
                preencherDadosVendedor();
                
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
                
                // 🔄 ADAPTADO: Removido gerarBotoesRegiao() (não existe mais)
                gerarFaixasEtarias();
                mudarAba(0);

                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';

                LOADING_SERVICE.success('✅ Bem-vindo!');

                // 🆕 VERIFICAR PRIMEIRO ACESSO E MOSTRAR ONBOARDING
                verificarPrimeiroAcesso();
            }
        }
    } catch (error) {
        console.error('%c❌ Erro ao fazer login:', 'color: #dc2626; font-weight: bold;', error.message);
        
        let mensagem = 'Erro ao fazer login.';
        
        if (error.code === 'auth/user-not-found') {
            mensagem = '❌ Email não encontrado.';
        } else if (error.code === 'auth/wrong-password') {
            mensagem = '❌ Senha incorreta.';
        } else if (error.code === 'auth/invalid-email') {
            mensagem = '❌ Email inválido.';
        } else if (error.code === 'auth/too-many-requests') {
            mensagem = '❌ Muitas tentativas. Aguarde alguns minutos.';
        }
        
        LOADING_SERVICE.error(mensagem);
    }
}

// ============================================================================
// 🆕 ONBOARDING (PRIMEIRO ACESSO)
// ============================================================================

/**
 * Verifica se é o primeiro acesso do vendedor e mostra o modal de onboarding
 */
async function verificarPrimeiroAcesso() {
    if (!vendedorUID) return;

    try {
        const database = firebase.database();
        const refUser = database.ref(`users/${vendedorUID}`);
        const snapshot = await refUser.get();

        if (snapshot.exists()) {
            const dados = snapshot.val();
            
            // Verifica se é o primeiro acesso (campo não existe ou é true)
            const primeiroAcesso = dados.primeiroAcesso !== false;

            console.log('%c👋 Primeiro acesso:', 'color: #0066cc; font-weight: bold;', primeiroAcesso);

            if (primeiroAcesso) {
                // Mostrar modal de onboarding
                mostrarOnboarding();
            }
        }
    } catch (error) {
        console.error('%c❌ Erro ao verificar primeiro acesso:', 'color: #dc2626; font-weight: bold;', error);
    }
}

/**
 * Mostra o modal de onboarding
 */
function mostrarOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.add('active');
        console.log('%c🎉 Modal de onboarding exibido', 'color: #16a34a; font-weight: bold;');
    } else {
        console.error('❌ Modal de onboarding não encontrado no HTML');
    }
}

/**
 * Fecha o modal de onboarding
 */
function fecharOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    salvarPreferenciaOnboarding();
}

/**
 * Inicia o uso do cotador após o onboarding
 */
function iniciarCotador() {
    salvarPreferenciaOnboarding();
    fecharOnboarding();
    
    // Foca no primeiro campo do formulário
    const primeiroInput = document.querySelector('#dashboard input');
    if (primeiroInput) {
        primeiroInput.focus();
    }
}

/**
 * Salva a preferência de não mostrar o onboarding novamente
 */
async function salvarPreferenciaOnboarding() {
    if (!vendedorUID) return;

    const naoMostrar = document.getElementById('naoMostrarNovamente');
    
    // Se o checkbox "não mostrar novamente" estiver marcado, atualiza no Firebase
    if (naoMostrar && naoMostrar.checked) {
        try {
            const database = firebase.database();
            await database.ref(`users/${vendedorUID}`).update({
                primeiroAcesso: false
            });
            console.log('%c✅ Preferência de onboarding salva', 'color: #16a34a; font-weight: bold;');
        } catch (error) {
            console.error('%c❌ Erro ao salvar preferência:', 'color: #dc2626; font-weight: bold;', error);
        }
    }
}

// ============================================================================
// ALTERAÇÃO DE SENHA
// ============================================================================

/**
 * Mostrar modal sugestivo de alteração de senha
 */
function mostrarModalAlterarSenha() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('changePasswordModal').classList.remove('hidden');
}

/**
 * Alterar senha (OPCIONAL)
 */
async function alterarSenhaOpcional() {
    const novaSenha = document.getElementById('novaSenha').value.trim();
    const confirmarSenha = document.getElementById('confirmarSenha').value.trim();

    if (!novaSenha || !confirmarSenha) {
        alert('⚠️ Preencha todos os campos!');
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert('❌ As senhas não conferem!');
        return;
    }

    if (novaSenha.length < 6) {
        alert('❌ A senha deve ter no mínimo 6 caracteres!');
        return;
    }

    try {
        LOADING_SERVICE.show('🔐 Alterando senha...', 'default');

        const user = firebase.auth().currentUser;
        await user.updatePassword(novaSenha);

        console.log('%c✅ Senha alterada com sucesso!', 'color: #16a34a; font-weight: bold;');

        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmarSenha').value = '';

        document.getElementById('changePasswordModal').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

        preencherDadosVendedor();

        LOADING_SERVICE.show('📥 Carregando dashboard...', 'default');
        const sucesso = await carregarValoresPlanos();
        
        if (sucesso) {
            gerarFaixasEtarias();
            mudarAba(0);
            LOADING_SERVICE.success('✅ Senha alterada!');
        }
    } catch (error) {
        console.error('%c❌ Erro ao alterar senha:', 'color: #dc2626; font-weight: bold;', error.message);
        LOADING_SERVICE.error('❌ Erro ao alterar senha');
    }
}

/**
 * Fechar modal de alteração de senha sem trocar
 */
function fecharModalAlterarSenha() {
    console.log('%c⏭️ Usuário optou por não trocar a senha agora', 'color: #ea580c; font-weight: bold;');
    
    document.getElementById('changePasswordModal').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    preencherDadosVendedor();

    carregarValoresPlanos().then(sucesso => {
        if (sucesso) {
            gerarFaixasEtarias();
            mudarAba(0);
            LOADING_SERVICE.success('✅ Bem-vindo!');
            
            // 🆕 VERIFICAR PRIMEIRO ACESSO APÓS FECHAR MODAL DE SENHA
            verificarPrimeiroAcesso();
        }
    });
}

/**
 * Mostrar/Ocultar formulário de alteração de senha
 */
function toggleFormAlterarSenha() {
    const form = document.getElementById('formAlterarSenha');
    const botoes = document.getElementById('botoesConfirmacao');
    const btnTrocar = document.getElementById('btnTrocar');
    const btnNaoTrocar = document.getElementById('btnNaoTrocar');

    form.classList.toggle('hidden');
    botoes.classList.toggle('hidden');
    btnTrocar.classList.toggle('hidden');
    btnNaoTrocar.classList.toggle('hidden');
}

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * Abre modal de confirmação de logout e executa a lógica se confirmado
 */
async function fazerLogout() {
    // Verifica se o modal já existe para evitar duplicatas
    let logoutModal = document.getElementById('customLogoutModal');
    if (logoutModal) {
        logoutModal.remove();
    }

    // Cria o elemento do modal
    logoutModal = document.createElement('div');
    logoutModal.id = 'customLogoutModal';
    logoutModal.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
    logoutModal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="fas fa-sign-out-alt mr-2 text-red-500"></i> Desconectar
                </h3>
                <button id="closeLogoutModalBtn" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-gray-700 mb-6">Tem certeza que deseja sair?</p>
            <div class="flex justify-end space-x-3">
                <button id="cancelLogoutBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancelar
                </button>
                <button id="confirmLogoutBtn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Sair
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(logoutModal);

    // Adiciona listeners para os botões do modal
    const closeBtn = document.getElementById('closeLogoutModalBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');

    const closeAndRemoveModal = () => {
        if (logoutModal) {
            logoutModal.remove();
        }
    };

    closeBtn.addEventListener('click', closeAndRemoveModal);
    cancelBtn.addEventListener('click', closeAndRemoveModal);

    confirmBtn.addEventListener('click', async () => {
        closeAndRemoveModal();
        console.log('%c🗑️ Iniciando logout...', 'color: #ea580c; font-weight: bold;');

        try {
            LOADING_SERVICE.show('👋 Desconectando...', 'default');

            // Remover do localStorage
            localStorage.removeItem('vendedorUID');
            localStorage.removeItem('vendedorEmail');
            localStorage.removeItem('vendedorNome');
            localStorage.removeItem('vendedorTelefone');

            // Limpar variáveis globais
            vendedorLogado = '';
            vendedorUID = '';
            vendedorDados = {};
            
            // 🔄 ADAPTADO: Remover variáveis do novo sistema
            if (typeof nomeCliente !== 'undefined') nomeCliente = '';
            if (typeof emailCliente !== 'undefined') emailCliente = '';
            if (typeof telefoneCliente !== 'undefined') telefoneCliente = '';
            if (typeof tipoPlano !== 'undefined') tipoPlano = '';
            if (typeof planosSelecionados !== 'undefined') planosSelecionados = [];
            if (typeof faixasSelecionadas !== 'undefined') faixasSelecionadas.clear();
            if (typeof comparacaoAtual !== 'undefined') comparacaoAtual = {};
            if (typeof valoresPlanosBase !== 'undefined') valoresPlanosBase = {};
            if (typeof valoresCarregados !== 'undefined') valoresCarregados = false;

            // Desautenticar no Firebase
            await firebase.auth().signOut();

            console.log('%c✅ Logout realizado', 'color: #16a34a; font-weight: bold;');

            // Esconder tudo
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('changePasswordModal').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');

            // Limpar campos de login
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';

            LOADING_SERVICE.hide();

            alert('Até logo! Você foi desconectado com sucesso.');

            console.log('%c🚀 Voltando para tela de login', 'color: #0066cc; font-weight: bold;');

        } catch (erro) {
            console.error('%c❌ Erro ao fazer logout:', 'color: #dc2626; font-weight: bold;', erro.message);
            LOADING_SERVICE.error('❌ Erro ao desconectar');
            LOADING_SERVICE.hide();
        }
    });
}

// ============================================================================
// VERIFICAÇÃO DE CACHE (AUTO-LOGIN)
// ============================================================================

/**
 * Verifica se há vendedor logado em cache e faz login automático
 */
async function verificarCacheVendedor() {
    console.log('%c🔍 Verificando autenticação...', 'color: #0066cc; font-weight: bold;');

    // Mostrar loading inicial e desabilitar scroll
    const loadingScreenInicial = document.getElementById('loadingScreenInicial');
    if (loadingScreenInicial) {
        loadingScreenInicial.classList.remove('hidden');
        document.body.classList.add('loading-active');
    }

    const vendedorUIDLocal = localStorage.getItem('vendedorUID');
    const vendedorEmailLocal = localStorage.getItem('vendedorEmail');
    const vendedorNomeLocal = localStorage.getItem('vendedorNome');
    const vendedorTelefoneLocal = localStorage.getItem('vendedorTelefone');

    console.log('%c📦 Dados do localStorage:', 'color: #0066cc; font-weight: bold;');
    console.log('UID:', vendedorUIDLocal);
    console.log('Email:', vendedorEmailLocal);
    console.log('Nome:', vendedorNomeLocal);
    console.log('Telefone:', vendedorTelefoneLocal);

    return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
            console.log('%c🔥 Usuário do Firebase:', 'color: #0066cc; font-weight: bold;', user ? user.email : 'Nenhum');

            if (user && vendedorUIDLocal && vendedorEmailLocal) {
                console.log('%c✅ Usuário autenticado:', 'color: #16a34a; font-weight: bold;', vendedorEmailLocal);

                vendedorLogado = vendedorNomeLocal || vendedorEmailLocal;
                vendedorUID = vendedorUIDLocal;

                // Carregar dados do vendedor do Firebase
                console.log('%c👤 Carregando dados do vendedor...', 'color: #0066cc; font-weight: bold;');
                const database = firebase.database();
                const snapshot = await database.ref(`users/${vendedorUID}`).get();

                if (snapshot.exists()) {
                    const dadosVendedor = snapshot.val();
                    vendedorDados = dadosVendedor;
                    
                    // Atualizar localStorage com dados frescos
                    localStorage.setItem('vendedorNome', dadosVendedor.nome);
                    localStorage.setItem('vendedorEmail', dadosVendedor.email);
                    localStorage.setItem('vendedorTelefone', dadosVendedor.telefone);
                    
                    console.log('%c✅ Dados do vendedor carregados:', 'color: #16a34a; font-weight: bold;', dadosVendedor);
                } else {
                    console.warn('%c⚠️ Dados do vendedor não encontrados no Firebase', 'color: #ea580c; font-weight: bold;');
                }

                // Carregar valores dos planos
                console.log('%c📥 Carregando valores dos planos...', 'color: #0066cc; font-weight: bold;');
                const sucesso = await carregarValoresPlanos();

                if (sucesso) {
                    // Preencher todos os dados na tela
                    preencherDadosVendedor();
                    
                    // Esconder loading inicial e habilitar scroll
                    if (loadingScreenInicial) {
                        loadingScreenInicial.classList.add('hidden');
                        document.body.classList.remove('loading-active');
                    }

                    // Mostrar dashboard
                    document.getElementById('loginScreen').classList.add('hidden');
                    document.getElementById('changePasswordModal').classList.add('hidden');
                    document.getElementById('dashboard').classList.remove('hidden');
                    
                    gerarFaixasEtarias();
                    mudarAba(0);

                    console.log('%c🚀 Login automático realizado!', 'color: #16a34a; font-weight: bold; font-size: 14px;');
                    LOADING_SERVICE.success('✅ Bem-vindo de volta!');

                    // 🆕 VERIFICAR PRIMEIRO ACESSO E MOSTRAR ONBOARDING
                    verificarPrimeiroAcesso();
                } else {
                    console.error('%c❌ Erro ao carregar valores dos planos', 'color: #dc2626; font-weight: bold;');
                    LOADING_SERVICE.error('❌ Erro ao carregar dados');
                }
            } else {
                console.log('%c⚠️ Nenhum usuário autenticado', 'color: #ea580c; font-weight: bold;');
                
                // Esconder loading inicial e mostrar login
                if (loadingScreenInicial) {
                    loadingScreenInicial.classList.add('hidden');
                    document.body.classList.remove('loading-active');
                }

                document.getElementById('loginScreen').classList.remove('hidden');
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('changePasswordModal').classList.add('hidden');
            }

            unsubscribe();
            resolve();
        });
    });
}

// ============================================================================
// PREENCHIMENTO DE DADOS NA TELA
// ============================================================================

/**
 * Preenche os dados do vendedor nos elementos da tela
 */
function preencherDadosVendedor() {
    const nome = localStorage.getItem('vendedorNome');
    const email = localStorage.getItem('vendedorEmail');
    const telefone = localStorage.getItem('vendedorTelefone');
    
    console.log('📦 Dados do localStorage:', { nome, email, telefone });
    
    if (nome && email && telefone) {
        // Formatar telefone para exibição
        const telefoneFormatado = formatarTelefoneExibicao(telefone);
        
        console.log('📱 Telefone formatado:', telefoneFormatado);
        
        // Preencher no header
        const nomeVendedorEl = document.getElementById('nomeVendedor');
        const telefoneVendedorEl = document.getElementById('telefoneVendedor');
        
        if (nomeVendedorEl) nomeVendedorEl.textContent = nome;
        if (telefoneVendedorEl) telefoneVendedorEl.textContent = telefoneFormatado;
        
        // Preencher nos cards de preview
        const previewVendedorEl = document.getElementById('previewVendedor');
        const previewEmailEl = document.getElementById('previewEmail');
        const previewTelefoneEl = document.getElementById('previewTelefone');
        
        if (previewVendedorEl) previewVendedorEl.textContent = nome;
        if (previewEmailEl) previewEmailEl.textContent = email;
        if (previewTelefoneEl) previewTelefoneEl.textContent = telefoneFormatado;
        
        console.log('✅ Todos os dados preenchidos!');
    } else {
        console.error('❌ Dados não encontrados no localStorage');
    }
}

// ============================================================================
// LOG DE CARREGAMENTO
// ============================================================================
console.log('%c✅ [ASSIS] auth.js carregado', 'color: #16a34a; font-weight: bold;');