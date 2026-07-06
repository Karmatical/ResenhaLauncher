/**
 * AuthManager
 * 
 * This module aims to abstract login procedures. Results from Mojang's REST api
 * are retrieved through our Mojang module. These results are processed and stored,
 * if applicable, in the config using the ConfigManager. All login procedures should
 * be made through this module.
 * 
 * @module authmanager
 */

const ConfigManager          = require('./configmanager')
const { LoggerUtil }         = require('helios-core')
const { RestResponseStatus } = require('helios-core/common')
const { MojangRestAPI, MojangErrorCode } = require('helios-core/mojang')
const Lang = require('./langloader')

const log = LoggerUtil.getLogger('AuthManager')

/**
 * Adiciona uma conta offline (pirata) diretamente no ConfigManager.
 * * @param {string} username O nick desejado pelo jogador.
 * @returns {Promise.<Object>} Retorna o objeto da conta configurada.
 */
exports.addAccount = async function(username) {
    try {
        // Gera um UUID persistente baseado apenas no nick (padrão offline clássico)
        // Substitui caracteres inválidos para simular um UUID válido de 32 dígitos
        const cleanName = username.toLowerCase().replace(/[^a-z0-9]/g, '0');
        const paddedName = (cleanName + '00000000000000000000000000000000').substring(0, 32);

        // O Helios usa o addMojangAuthAccount internamente, mas podemos estruturar
        // o retorno e salvar diretamente.
        const ret = ConfigManager.addMojangAuthAccount(
            paddedName,          // UUID fictício
            "offline_token",     // Access Token fictício
            username,            // Username / Email
            username             // Display Name dentro do jogo
        )

        // Força o tipo para 'offline' para sabermos diferenciar nas validações
        ret.type = 'offline'
        
        ConfigManager.save()
        return ret
    } catch (err) {
        log.error('Erro ao criar conta offline:', err)
        return Promise.reject({
            title: "Erro Inesperado",
            desc: "Não foi possível criar o perfil offline."
        })
    }
}

/**
 * Remove a Mojang account. This will invalidate the access token associated
 * with the account and then remove it from the database.
 * 
 * @param {string} uuid The UUID of the account to be removed.
 * @returns {Promise.<void>} Promise which resolves to void when the action is complete.
 */
exports.removeMojangAccount = async function(uuid){
    try {
        const authAcc = ConfigManager.getAuthAccount(uuid)
        const response = await MojangRestAPI.invalidate(authAcc.accessToken, ConfigManager.getClientToken())
        if(response.responseStatus === RestResponseStatus.SUCCESS) {
            ConfigManager.removeAuthAccount(uuid)
            ConfigManager.save()
            return Promise.resolve()
        } else {
            log.error('Error while removing account', response.error)
            return Promise.reject(response.error)
        }
    } catch (err){
        log.error('Error while removing account', err)
        return Promise.reject(err)
    }
}

/**
 * Validate the selected auth account.
 * 
 * @returns {Promise.<boolean>} Offline account promise,
 */
exports.validateSelected = async function(){
    const current = ConfigManager.getSelectedAccount()
    return await validateSelectedMojangAccount()
}
