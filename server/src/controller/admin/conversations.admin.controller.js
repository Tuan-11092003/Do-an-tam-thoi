const ConversationService = require('../../services/conversation.service');
const { OK } = require('../../core/success.response');

class AdminConversationsController {
    async getAllConversation(req, res) {
        const conversations = await ConversationService.getAllConversation();
        new OK({ message: 'success', metadata: conversations }).send(res);
    }
}

module.exports = new AdminConversationsController();

