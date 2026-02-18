/**
 * @file vendedor-service.js
 * @description Serviço de gerenciamento de dados de vendedores
 * @projeto Cotador Oeste Saúde Assis
 * @versao 2.0
 */

const VENDEDOR_SERVICE = {
    // Cache em memória para evitar múltiplas consultas
    _cache: {},
    _cacheTimeout: 5 * 60 * 1000, // 5 minutos

    /**
     * Obter instância do database (compatibilidade)
     * @returns {object} Instância do Firebase Database
     */
    _getDatabase() {
        return window.database || firebase.database();
    },

    /**
     * Verificar se o cache é válido
     * @param {string} uid - UID do vendedor
     * @returns {boolean} True se o cache é válido
     */
    _isCacheValid(uid) {
        if (!this._cache[uid]) return false;
        
        const now = Date.now();
        const cacheAge = now - this._cache[uid].timestamp;
        
        return cacheAge < this._cacheTimeout;
    },

    /**
     * Obter dados do vendedor pelo UID
     * @param {string} uid - O UID do vendedor
     * @returns {Promise<object|null>} Os dados do vendedor ou null se não encontrado/erro
     */
    async obterDadosVendedor(uid) {
        try {
            console.log('%c🔍 [VENDEDOR_SERVICE] Buscando dados do vendedor...', 'color: #0066cc; font-weight: bold;', uid);

            // Verificar cache primeiro
            if (this._isCacheValid(uid)) {
                console.log('%c⚡ [VENDEDOR_SERVICE] Usando dados do cache', 'color: #10b981; font-weight: bold;');
                return this._cache[uid].data;
            }

            const database = this._getDatabase();
            const ref = database.ref(`users/${uid}`);
            
            // Timeout para query lenta (10 segundos)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Query demorou mais de 10 segundos')), 10000);
            });

            const snapshot = await Promise.race([ref.get(), timeoutPromise]);

            if (snapshot.exists()) {
                const dados = snapshot.val();
                
                // Salvar no cache
                this._cache[uid] = {
                    data: dados,
                    timestamp: Date.now()
                };
                
                console.log('%c✅ [VENDEDOR_SERVICE] Dados do vendedor encontrados:', 'color: #16a34a; font-weight: bold;', dados);
                return dados;
            } else {
                console.warn('%c⚠️ [VENDEDOR_SERVICE] Dados do vendedor não encontrados no Firebase', 'color: #ea580c; font-weight: bold;');
                return null;
            }
        } catch (erro) {
            console.error('%c❌ [VENDEDOR_SERVICE] Erro ao buscar dados do vendedor:', 'color: #dc2626; font-weight: bold;', erro.message);
            
            // Tentar fallback do localStorage
            console.log('%c🔄 [VENDEDOR_SERVICE] Tentando fallback do localStorage...', 'color: #f59e0b; font-weight: bold;');
            return this.obterDadosVendedorLocal();
        }
    },

    /**
     * Obter dados do vendedor do localStorage (fallback rápido)
     * @param {string} [nomeCustom] - Nome customizado (opcional)
     * @returns {object} Os dados do vendedor
     */
    obterDadosVendedorLocal(nomeCustom) {
        console.log('%c👤 [VENDEDOR_SERVICE] Buscando dados do vendedor no localStorage...', 'color: #0066cc; font-weight: bold;');
        
        const vendedorNome = nomeCustom || localStorage.getItem('vendedorNome') || 'Vendedor';
        const vendedorEmail = localStorage.getItem('vendedorEmail') || 'email@exemplo.com';
        const vendedorTelefone = localStorage.getItem('vendedorTelefone') || '(18) 00000-0000';
        const vendedorUID = localStorage.getItem('vendedorUID') || '';
        
        const dados = {
            nome: vendedorNome,
            email: vendedorEmail,
            telefone: vendedorTelefone,
            uid: vendedorUID,
            _source: 'localStorage' // Flag para identificar origem
        };
        
        console.log('%c✅ [VENDEDOR_SERVICE] Dados obtidos do localStorage:', 'color: #16a34a; font-weight: bold;', dados);
        
        return dados;
    },

    /**
     * Salvar/Atualizar dados do vendedor
     * @param {string} uid - O UID do vendedor
     * @param {object} dados - O objeto de dados a ser salvo
     * @returns {Promise<boolean>} True se salvo com sucesso, false caso contrário
     */
    async salvarDadosVendedor(uid, dados) {
        try {
            console.log('%c💾 [VENDEDOR_SERVICE] Salvando dados do vendedor...', 'color: #0066cc; font-weight: bold;', { uid, dados });

            const database = this._getDatabase();
            const ref = database.ref(`users/${uid}`);
            
            // Adicionar timestamp de última atualização
            const dadosComTimestamp = {
                ...dados,
                ultimaAtualizacao: Date.now()
            };
            
            await ref.set(dadosComTimestamp);

            // Invalidar cache
            delete this._cache[uid];
            
            // Atualizar localStorage também
            if (dados.nome) localStorage.setItem('vendedorNome', dados.nome);
            if (dados.email) localStorage.setItem('vendedorEmail', dados.email);
            if (dados.telefone) localStorage.setItem('vendedorTelefone', dados.telefone);

            console.log('%c✅ [VENDEDOR_SERVICE] Dados salvos com sucesso!', 'color: #16a34a; font-weight: bold;');
            return true;
        } catch (erro) {
            console.error('%c❌ [VENDEDOR_SERVICE] Erro ao salvar dados:', 'color: #dc2626; font-weight: bold;', erro.message);
            return false;
        }
    },

    /**
     * Atualizar apenas alguns campos de um vendedor
     * @param {string} uid - O UID do vendedor
     * @param {object} campos - Um objeto contendo os campos a serem atualizados
     * @returns {Promise<boolean>} True se atualizado com sucesso, false caso contrário
     */
    async atualizarDadosVendedor(uid, campos) {
        try {
            console.log('%c✏️ [VENDEDOR_SERVICE] Atualizando dados do vendedor...', 'color: #0066cc; font-weight: bold;', { uid, campos });

            const database = this._getDatabase();
            const ref = database.ref(`users/${uid}`);
            
            // Adicionar timestamp de última atualização
            const camposComTimestamp = {
                ...campos,
                ultimaAtualizacao: Date.now()
            };
            
            await ref.update(camposComTimestamp);

            // Invalidar cache
            delete this._cache[uid];
            
            // Atualizar localStorage se necessário
            if (campos.nome) localStorage.setItem('vendedorNome', campos.nome);
            if (campos.email) localStorage.setItem('vendedorEmail', campos.email);
            if (campos.telefone) localStorage.setItem('vendedorTelefone', campos.telefone);

            console.log('%c✅ [VENDEDOR_SERVICE] Dados atualizados com sucesso!', 'color: #16a34a; font-weight: bold;');
            return true;
        } catch (erro) {
            console.error('%c❌ [VENDEDOR_SERVICE] Erro ao atualizar dados:', 'color: #dc2626; font-weight: bold;', erro.message);
            return false;
        }
    },

    /**
     * Sincronizar dados do Firebase com localStorage
     * @param {string} uid - O UID do vendedor
     * @returns {Promise<boolean>} True se sincronizado com sucesso
     */
    async sincronizarComLocalStorage(uid) {
        try {
            console.log('%c🔄 [VENDEDOR_SERVICE] Sincronizando dados com localStorage...', 'color: #0066cc; font-weight: bold;');

            const dados = await this.obterDadosVendedor(uid);
            
            if (dados) {
                localStorage.setItem('vendedorUID', uid);
                localStorage.setItem('vendedorNome', dados.nome || '');
                localStorage.setItem('vendedorEmail', dados.email || '');
                localStorage.setItem('vendedorTelefone', dados.telefone || '');
                
                console.log('%c✅ [VENDEDOR_SERVICE] Sincronização concluída!', 'color: #16a34a; font-weight: bold;');
                return true;
            }
            
            return false;
        } catch (erro) {
            console.error('%c❌ [VENDEDOR_SERVICE] Erro ao sincronizar:', 'color: #dc2626; font-weight: bold;', erro.message);
            return false;
        }
    },

    /**
     * Limpar cache (útil para testes ou logout)
     */
    limparCache() {
        console.log('%c🗑️ [VENDEDOR_SERVICE] Limpando cache...', 'color: #f59e0b; font-weight: bold;');
        this._cache = {};
    },

    /**
     * Verificar se vendedor existe no Firebase
     * @param {string} uid - O UID do vendedor
     * @returns {Promise<boolean>} True se existe
     */
    async vendedorExiste(uid) {
        try {
            const database = this._getDatabase();
            const ref = database.ref(`users/${uid}`);
            const snapshot = await ref.get();
            
            const existe = snapshot.exists();
            console.log('%c🔍 [VENDEDOR_SERVICE] Vendedor existe?', 'color: #0066cc; font-weight: bold;', existe);
            
            return existe;
        } catch (erro) {
            console.error('%c❌ [VENDEDOR_SERVICE] Erro ao verificar existência:', 'color: #dc2626; font-weight: bold;', erro.message);
            return false;
        }
    }
};

// Disponibilizar globalmente
window.VENDEDOR_SERVICE = VENDEDOR_SERVICE;

console.log('%c✅ [ASSIS] vendedor-service.js carregado', 'color: #16a34a; font-weight: bold;');