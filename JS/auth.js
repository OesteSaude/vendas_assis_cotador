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
    
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log('%c🔥 Usuário do Firebase:', 'color: #ea580c; font-weight: bold;', user.email);
                console.log('%c✅ Usuário autenticado:', 'color: #16a34a; font-weight: bold;', user.email);
                console.log('%c🆔 UID do usuário:', 'color: #0066cc; font-weight: bold;', user.uid);
                
                try {
                    console.log('%c👤 Carregando dados do vendedor...', 'color: #8b5cf6; font-weight: bold;');
                    
                    // ===== SEMPRE USAR O UID DO FIREBASE AUTH =====
                    const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
                    const userData = snapshot.val();
                    
                    if (userData) {
                        console.log('%c📦 Dados do usuário:', 'color: #0066cc;', userData);
                        
                        // ===== SINCRONIZAR COM LOCALSTORAGE =====
                        console.log('%c💾 Sincronizando com localStorage...', 'color: #8b5cf6;');
                        localStorage.setItem('vendedorUID', user.uid);
                        localStorage.setItem('vendedorNome', userData.nome || '');
                        localStorage.setItem('vendedorEmail', userData.email || user.email);
                        localStorage.setItem('vendedorTelefone', userData.telefone || '');
                        console.log('%c✅ localStorage sincronizado!', 'color: #10b981;');
                        
                        // Atualizar header
                        document.getElementById('nomeVendedor').textContent = userData.nome;
                        document.getElementById('telefoneVendedor').textContent = userData.telefone || '-';
                        
                        // Esconder loading e login, mostrar dashboard
                        document.getElementById('loadingScreenInicial').classList.add('hidden');
                        document.getElementById('loginScreen').classList.add('hidden');
                        document.getElementById('dashboard').classList.remove('hidden');
                        
                        // Salvar vendedor logado
                        vendedorLogado = userData.nome;
                        
                        console.log('%c✅ Dashboard carregado com sucesso!', 'color: #16a34a; font-weight: bold;');
                        
                        resolve(true);
                    } else {
                        console.error('%c❌ Dados do usuário não encontrados no Firebase', 'color: #dc2626;');
                        await fazerLogout();
                        resolve(false);
                    }
                } catch (error) {
                    console.error('%c❌ Erro ao carregar dados:', 'color: #dc2626; font-weight: bold;', error);
                    LOADING_SERVICE.error('❌ Erro ao carregar dados do usuário.');
                    await fazerLogout();
                    resolve(false);
                }
            } else {
                console.log('%c🚫 Nenhum usuário autenticado', 'color: #6b7280; font-weight: bold;');
                
                // Esconder loading e dashboard, mostrar login
                document.getElementById('loadingScreenInicial').classList.add('hidden');
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('loginScreen').classList.remove('hidden');
                
                resolve(false);
            }
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

function abrirModalCriarConta() {
    console.log('%c✨ [CADASTRO] Abrindo modal...', 'color: #00758C; font-weight: bold;');

    // Remove modal existente
    const existingModal = document.getElementById('modalCriarConta');
    if (existingModal) {
        existingModal.remove();
    }

    // Cria overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modalCriarConta';
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modalOverlay.style.opacity = '0';

    // Cria conteúdo
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-2xl shadow-2xl max-w-md w-full transform scale-95 transition-all duration-300';

    modalContent.innerHTML = `
        <!-- Header com gradiente -->
        <div class="bg-gradient-to-r from-[#003D58] to-[#00758C] text-white p-6 rounded-t-2xl">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold mb-1">
                        <i class="fas fa-user-plus mr-2"></i>Criar Conta
                    </h2>
                    <p class="text-sm opacity-90">Preencha seus dados para começar</p>
                </div>
                <button onclick="fecharModalCriarConta()" class="text-white hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center transition-all">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>

        <!-- Body -->
        <div class="p-6">
            <!-- Nome -->
            <div class="mb-4">
                <label class="block text-xs font-semibold oeste-text-primary mb-2">
                    <i class="fas fa-signature mr-1"></i> Nome Completo <span class="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    id="cadastroNome" 
                    placeholder="Ex: João Silva"
                    class="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-oeste-turqueza focus:border-transparent"
                    required
                />
            </div>

            <!-- Email -->
            <div class="mb-4">
                <label class="block text-xs font-semibold oeste-text-primary mb-2">
                    <i class="fas fa-envelope mr-1"></i> Email <span class="text-red-500">*</span>
                </label>
                <input 
                    type="email" 
                    id="cadastroEmail" 
                    placeholder="seu.email@email.com.br"
                    class="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-oeste-turqueza focus:border-transparent"
                    required
                />
                <small class="text-xs text-gray-500 mt-1 block">
                    <i class="fas fa-info-circle"></i> Utilize seu email corporativo.
                </small>
            </div>

            <!-- Telefone -->
            <div class="mb-4">
                <label class="block text-xs font-semibold oeste-text-primary mb-2">
                    <i class="fas fa-phone mr-1"></i> Telefone <span class="text-red-500">*</span>
                </label>
                <input 
                    type="tel" 
                    id="cadastroTelefone" 
                    placeholder="(18) 99999-9999"
                    class="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-oeste-turqueza focus:border-transparent"
                    required
                />
            </div>

            <!-- Senha -->
            <div class="mb-4">
                <label class="block text-xs font-semibold oeste-text-primary mb-2">
                    <i class="fas fa-lock mr-1"></i> Senha <span class="text-red-500">*</span>
                </label>
                <input 
                    type="password" 
                    id="cadastroSenha" 
                    placeholder="Crie uma senha (mínimo 6 caracteres)"
                    class="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-oeste-turqueza focus:border-transparent"
                    required
                />
            </div>

            <!-- Confirmar Senha -->
            <div class="mb-6">
                <label class="block text-xs font-semibold oeste-text-primary mb-2">
                    <i class="fas fa-lock mr-1"></i> Confirmar Senha <span class="text-red-500">*</span>
                </label>
                <input 
                    type="password" 
                    id="cadastroConfirmarSenha" 
                    placeholder="Digite a senha novamente"
                    class="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-oeste-turqueza focus:border-transparent"
                    required
                />
            </div>

            <!-- Botões -->
            <div class="flex gap-3">
                <button onclick="fecharModalCriarConta()" class="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold text-base transition-all">
                    Cancelar
                </button>
                <button onclick="confirmarCriarConta()" class="flex-1 oeste-btn-primary py-3 text-base">
                    <i class="fas fa-check mr-2"></i>Criar Conta
                </button>
            </div>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Animação de entrada
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);

    // Fechar ao clicar fora
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            fecharModalCriarConta();
        }
    });

    // Aplicar máscara de telefone
    const telefoneInput = document.getElementById('cadastroTelefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        }
        e.target.value = value;
    });

    console.log('%c✅ [CADASTRO] Modal aberto', 'color: #10b981;');
}

/**
 * Fecha o modal de criar conta
 */
function fecharModalCriarConta() {
    console.log('%c🚪 [CADASTRO] Fechando modal...', 'color: #6b7280;');
    const modal = document.getElementById('modalCriarConta');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Confirma e cria a conta no Firebase
 */
async function confirmarCriarConta() {
    console.log('%c🚀 [CADASTRO] Iniciando criação de conta...', 'color: #00758C; font-weight: bold;');

    try {
        // Coletar dados
        const nome = document.getElementById('cadastroNome').value.trim();
        const email = document.getElementById('cadastroEmail').value.trim();
        const telefone = document.getElementById('cadastroTelefone').value.trim();
        const senha = document.getElementById('cadastroSenha').value;
        const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

        // ===== VALIDAÇÕES =====
        if (!nome) {
            alert('❌ Por favor, preencha seu nome completo.');
            return;
        }

        if (!email || !email.includes('@')) {
            alert('❌ Por favor, insira um email válido.');
            return;
        }

        if (!telefone || telefone.replace(/\D/g, '').length < 10) {
            alert('❌ Por favor, insira um telefone válido.');
            return;
        }

        if (!senha || senha.length < 6) {
            alert('❌ A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (senha !== confirmarSenha) {
            alert('❌ As senhas não coincidem.');
            return;
        }

        LOADING_SERVICE.show('🔐 Criando sua conta...');

        // ===== CRIAR NO FIREBASE AUTH =====
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha);
        const user = userCredential.user;

        console.log('%c✅ [CADASTRO] Usuário criado no Auth:', 'color: #10b981;', user.uid);

        // ===== SALVAR NO DATABASE =====
        await firebase.database().ref(`users/${user.uid}`).set({
            nome: nome,
            email: email,
            telefone: telefone,
            senhaAlterada: true, // Como o usuário criou a senha, não precisa alterar
            timestamp: Date.now()
        });

        console.log('%c✅ [CADASTRO] Dados salvos no Database', 'color: #10b981;');

        // ===== FECHAR MODAL =====
        fecharModalCriarConta();

        // ===== MOSTRAR SUCESSO =====
        LOADING_SERVICE.hide();
        mostrarSucessoCadastro(nome);

        // ===== AGUARDAR 2 SEGUNDOS E ENTRAR NO SISTEMA =====
        setTimeout(() => {
            // Já está logado automaticamente, só precisa carregar o dashboard
            carregarDashboard();
        }, 2000);

    } catch (error) {
        console.error('%c❌ [CADASTRO] Erro:', 'color: #ef4444; font-weight: bold;', error);

        let errorMessage = 'Erro ao criar conta. Tente novamente.';

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está cadastrado. Faça login.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de email inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
        }

        LOADING_SERVICE.error(`❌ ${errorMessage}`);
    }
}

/**
 * Mostra tela de sucesso após cadastro
 */
function mostrarSucessoCadastro(nome) {
    console.log('%c🎉 [CADASTRO] Mostrando tela de sucesso', 'color: #10b981; font-weight: bold;');

    const successOverlay = document.createElement('div');
    successOverlay.id = 'successCadastro';
    successOverlay.className = 'fixed inset-0 bg-gradient-to-br from-[#003D58] to-[#00758C] flex items-center justify-center z-50 p-4';
    successOverlay.style.opacity = '0';

    successOverlay.innerHTML = `
        <div class="text-center text-white transform scale-95 transition-all duration-300">
            <div class="text-7xl mb-6 animate-bounce">🎉</div>
            <h1 class="text-4xl font-bold mb-4">Bem-vindo(a), ${nome}!</h1>
            <p class="text-xl mb-6 opacity-90">Sua conta foi criada com sucesso!</p>
            <div class="flex justify-center gap-2">
                <div class="w-2 h-2 rounded-full bg-white animate-bounce" style="animation-delay: 0s;"></div>
                <div class="w-2 h-2 rounded-full bg-white animate-bounce" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 rounded-full bg-white animate-bounce" style="animation-delay: 0.4s;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(successOverlay);

    setTimeout(() => {
        successOverlay.style.opacity = '1';
        successOverlay.querySelector('div').style.transform = 'scale(1)';
    }, 10);

    // Remove após 2 segundos
    setTimeout(() => {
        successOverlay.style.opacity = '0';
        setTimeout(() => successOverlay.remove(), 300);
    }, 2000);
}

/**
 * Carrega o dashboard após cadastro/login
 */
/**
 * Carrega o dashboard após cadastro/login
 */
async function carregarDashboard() {
    console.log('%c📊 [CADASTRO] Carregando dashboard...', 'color: #00758C;');

    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('%c❌ [CADASTRO] Usuário não autenticado', 'color: #ef4444;');
        return;
    }

    // Buscar dados do usuário
    const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
    const userData = snapshot.val();

    if (!userData) {
        console.error('%c❌ [CADASTRO] Dados do usuário não encontrados', 'color: #ef4444;');
        return;
    }

    console.log('%c📦 [CADASTRO] Dados do usuário:', 'color: #0066cc;', userData);

    // ===== SINCRONIZAR COM LOCALSTORAGE ===== 
    console.log('%c💾 [CADASTRO] Salvando dados no localStorage...', 'color: #8b5cf6;');
    localStorage.setItem('vendedorUID', user.uid);
    localStorage.setItem('vendedorNome', userData.nome || '');
    localStorage.setItem('vendedorEmail', userData.email || '');
    localStorage.setItem('vendedorTelefone', userData.telefone || '');
    console.log('%c✅ [CADASTRO] Dados salvos no localStorage', 'color: #10b981;');

    // Atualizar header
    document.getElementById('nomeVendedor').textContent = userData.nome;
    document.getElementById('telefoneVendedor').textContent = userData.telefone || '-';

    // Esconder login e mostrar dashboard
    document.getElementById('loadingScreenInicial').classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    console.log('%c✅ [CADASTRO] Dashboard carregado', 'color: #10b981;');

    // ===== MOSTRAR MODAL DE BOAS-VINDAS =====
    setTimeout(() => {
        const jaViu = localStorage.getItem('onboardingVisto');
        if (!jaViu) {
            console.log('%c🎉 [ONBOARDING] Mostrando modal de boas-vindas', 'color: #8b5cf6;');
            const modal = document.getElementById('onboardingModal');
            if (modal) {
                // FORÇAR reset completo do modal
                modal.style.opacity = '1';
                modal.style.transform = 'none';
                modal.style.transition = 'none';
                modal.style.display = 'flex';
                modal.classList.add('active');
                
                console.log('%c✅ [ONBOARDING] Modal exibido com sucesso', 'color: #10b981;');
            } else {
                console.error('%c❌ [ONBOARDING] Modal não encontrado no DOM', 'color: #ef4444;');
            }
        } else {
            console.log('%c⏭️ [ONBOARDING] Modal já foi visto antes', 'color: #6b7280;');
        }
    }, 500);
}