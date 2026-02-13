/**
 * @file firebase-config.js
 * @description Configuração do Firebase para o Cotador Oeste Saúde Assis.
 * @projeto Cotador Oeste Saúde Assis
 * @versao 2.0
 */

// ============================================================================
// VERIFICAÇÃO DO SDK
// ============================================================================
if (typeof firebase === 'undefined') {
    console.error('❌ [ASSIS] Firebase SDK não carregado. Verifique se os scripts COMPAT estão no HTML.');
    throw new Error('Firebase SDK não encontrado. Impossível continuar.');
}

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE - OESTE SAÚDE ASSIS
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyA7QXiEfzMqbO_kqyz28nrhvdtHMWfMiYM",
    authDomain: "sistema-assis.firebaseapp.com",
    databaseURL: "https://sistema-assis-default-rtdb.firebaseio.com",
    projectId: "sistema-assis",
    storageBucket: "sistema-assis.firebasestorage.app",
    messagingSenderId: "359044378563",
    appId: "1:359044378563:web:eab4648e6caa06335d5776",
    measurementId: "G-Q34B1QCJ4T"
};

// ============================================================================
// INICIALIZAÇÃO DO FIREBASE
// ============================================================================
if (!firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('🚀 [ASSIS] Firebase inicializado com sucesso!');
        console.log('📦 [ASSIS] Projeto:', firebaseConfig.projectId);
    } catch (error) {
        console.error('❌ [ASSIS] Erro ao inicializar Firebase:', error);
        throw error;
    }
} else {
    console.log('✅ [ASSIS] Firebase já estava inicializado.');
}

// ============================================================================
// INSTÂNCIAS DO FIREBASE
// ============================================================================
const auth = firebase.auth();
const database = firebase.database();

// Verifica se as instâncias foram criadas
if (!auth || !database) {
    console.error('❌ [ASSIS] Erro ao criar instâncias do Firebase.');
    throw new Error('Falha na inicialização das instâncias Firebase.');
}

// ============================================================================
// CONFIGURAÇÕES ADICIONAIS
// ============================================================================

// Persistência de autenticação (mantém usuário logado)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('✅ [ASSIS] Persistência de autenticação: LOCAL');
    })
    .catch((error) => {
        console.warn('⚠️ [ASSIS] Erro ao configurar persistência:', error);
    });

// ============================================================================
// DISPONIBILIZA GLOBALMENTE (IMPORTANTE!)
// ============================================================================
window.firebaseApp = firebase;
window.auth = auth;
window.database = database;

// ============================================================================
// LOGS DE CONFIRMAÇÃO
// ============================================================================
console.log('✅ [ASSIS] firebase-config.js carregado.');
console.log('📊 [ASSIS] Auth:', auth ? 'OK' : 'FALHA');
console.log('💾 [ASSIS] Database:', database ? 'OK' : 'FALHA');