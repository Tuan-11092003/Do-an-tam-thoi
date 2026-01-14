const { OK } = require('../../core/success.response');
const UserService = require('../../services/users.service');

class AdminUsersController {
    async getAllUser(req, res) {
        const { search } = req.query;
        const data = await UserService.getAllUser(search);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    async updateUser(req, res) {
        const { id } = req.params;
        const data = await UserService.updateUserAdmin(id, req.body);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    async deleteUser(req, res) {
        const { id } = req.params;
        const data = await UserService.deleteUser(id);
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new AdminUsersController();

