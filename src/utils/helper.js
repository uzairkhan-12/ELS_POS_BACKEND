// Helper functions will be added here
module.exports = {
    formatResponse: (success, message, data = null, statusCode = 200) => {
        return {
            success,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    },
    
    generateRandomString: (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};