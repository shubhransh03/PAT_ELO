export function ok(res, payload = {}, extra = {}) {
  return res.json({ success: true, ...payload, ...extra });
}

export function created(res, payload = {}, extra = {}) {
  return res.status(201).json({ success: true, ...payload, ...extra });
}

export function fail(res, status = 500, error = 'Internal Server Error', details) {
  const body = { success: false, error };
  if (details) body.details = details;
  return res.status(status).json(body);
}
