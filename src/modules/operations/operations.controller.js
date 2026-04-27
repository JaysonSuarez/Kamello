import * as operationsService from './operations.service.js';

function normalizeOperationError(error) {
  if (error.message.includes('Unauthorized')) error.statusCode = 403;
  if (error.message.includes('not found')) error.statusCode = 404;
  if (
    error.message.includes('Can only') ||
    error.message.includes('Must be') ||
    error.message.includes('rating') ||
    error.message.includes('already rated')
  ) {
    error.statusCode = 400;
  }
}

export async function createOperation(req, res, next) {
  try {
    const clientId = req.user.id;
    const { category, skill_id, description, proposed_price, client_lat, client_lng } = req.body;
    
    const operation = await operationsService.createOperation(clientId, {
      category,
      skill_id,
      description,
      proposed_price,
      client_lat,
      client_lng,
    });
    res.status(201).json(operation);
  } catch (error) {
    next(error);
  }
}

export async function getMyOperations(req, res, next) {
  try {
    const operations = await operationsService.getMyOperations(req.user.id, req.user.role);
    res.json(operations);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // El catch validará permisos basado en el rol guardado en la sesión
    const operation = await operationsService.updateOperationStatus(id, req.user.id, req.user.role, status);
    res.json(operation);
  } catch (error) {
    normalizeOperationError(error);
    next(error);
  }
}

export async function startOperation(req, res, next) {
  try {
    const { service_code } = req.body;
    const operation = await operationsService.startOperation(req.params.id, req.user.id, service_code);
    res.json(operation);
  } catch (error) {
    normalizeOperationError(error);
    next(error);
  }
}

export async function completeOperation(req, res, next) {
  try {
    const operation = await operationsService.completeOperation(req.params.id, req.user.id);
    res.json(operation);
  } catch (error) {
    normalizeOperationError(error);
    next(error);
  }
}

export async function rateOperation(req, res, next) {
  try {
    const { rating, comment } = req.body;
    const result = await operationsService.rateOperation(req.params.id, req.user.id, {
      rating,
      comment,
    });
    res.status(201).json(result);
  } catch (error) {
    normalizeOperationError(error);
    next(error);
  }
}
