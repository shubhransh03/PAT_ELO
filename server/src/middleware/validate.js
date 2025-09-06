import { z } from 'zod';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return res.status(422).json({ success: false, error: 'Validation Error', details });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return res.status(422).json({ success: false, error: 'Validation Error', details });
    }
    req.query = result.data;
    next();
  };
}

export { z };
