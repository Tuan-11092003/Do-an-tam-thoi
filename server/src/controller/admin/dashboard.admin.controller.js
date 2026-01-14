const { OK } = require('../../core/success.response');
const UserService = require('../../services/users.service');

class DashboardController {
    async getDashboard(req, res) {
        const data = await UserService.getDashboardAdmin();
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new DashboardController();

