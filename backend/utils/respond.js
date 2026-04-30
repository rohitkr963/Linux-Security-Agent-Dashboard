/**
 * Consistent JSON response helpers.
 */
const ok      = (res, data, status = 200)   => res.status(status).json(data);
const created = (res, data)                  => res.status(201).json(data);
const badReq  = (res, message)               => res.status(400).json({ error: message });
const notFound= (res, message = 'Not found') => res.status(404).json({ error: message });
const serverErr=(res, message = 'Internal Server Error') => res.status(500).json({ error: message });

module.exports = { ok, created, badReq, notFound, serverErr };
