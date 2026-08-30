module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { password } = JSON.parse(body);
            const adminPass = process.env.ADMIN_PASS;

            if (password === adminPass) {
                res.statusCode = 200;
                res.json({ success: true });
            } else {
                res.statusCode = 401;
                res.json({ error: 'Invalid password' });
            }
        } catch (e) {
            res.statusCode = 400;
            res.json({ error: 'Bad request' });
        }
    });
};