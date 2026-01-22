import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    // Log validation errors for debugging
    console.error('❌ Validation failed for request:', req.method, req.path);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Validation errors:', JSON.stringify(errors.array(), null, 2));

    // Get first error message
    const firstError = errors.array()[0];
    const errorMessage = firstError.msg || 'Validation failed';

    res.status(400).json({
      success: false,
      error: errorMessage,
      details: errors.array(),
    });
  };
};

