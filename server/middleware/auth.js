const { getUserClient } = require('../lib/supabase');

// Middleware: Supabase JWT token ellenorzes
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = getUserClient(token);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // A felhasznalot es a supabase klienst hozzaadjuk a request-hez
    req.user = user;
    req.supabase = supabase;
    next();
  } catch (error) {
    console.error('[Auth] Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { requireAuth };
