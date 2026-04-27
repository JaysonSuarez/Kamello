import { supabaseAdmin } from '../../config/supabase.js';

const OPERATION_SELECT = '*, kamellador:profiles!operations_kamellador_id_fkey(*), client:profiles!operations_client_id_fkey(*), skills(*), operation_ratings(*)';

export async function createOperation(clientId, payload) {
  const { category, skill_id, description, proposed_price, client_lat, client_lng } = payload;

  const { data, error } = await supabaseAdmin
    .from('operations')
    .insert({
      client_id: clientId,
      category,
      skill_id,
      description,
      proposed_price,
      client_lat,
      client_lng,
      status: 'pending',
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
    })
    .select(OPERATION_SELECT)
    .single();

  if (error) {
    const err = new Error('Error creating operation: ' + error.message);
    err.statusCode = 500;
    throw err;
  }
  return data;
}

export async function getMyOperations(userId, role) {
  // role determines which column to check (client_id or kamellador_id)
  const column = role === 'client' ? 'client_id' : 'kamellador_id';
  
  const { data, error } = await supabaseAdmin
    .from('operations')
    .select(OPERATION_SELECT)
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error('Error fetching operations');
    err.statusCode = 500;
    throw err;
  }
  return data;
}

export async function updateOperationStatus(operationId, userId, role, newStatus) {
  // Verificamos que la operación exista y el usuario participe
  const { data: op, error: fetchError } = await supabaseAdmin
    .from('operations')
    .select('*')
    .eq('id', operationId)
    .single();

  if (fetchError || !op) {
    const err = new Error('Operation not found');
    err.statusCode = 404;
    throw err;
  }

  // Validaciones de negocio simples
  if (role === 'client' && op.client_id !== userId) throw new Error('Unauthorized');
  if (role === 'kamellador' && op.kamellador_id && op.kamellador_id !== userId) throw new Error('Unauthorized');

  if (role === 'client' && !['cancelled', 'completed'].includes(newStatus)) {
    throw new Error('Client can only cancel or complete an operation');
  }

  if (role === 'client' && newStatus === 'completed' && !['accepted', 'in_progress'].includes(op.status)) {
    throw new Error('Client can only complete accepted operations');
  }

  // Si kamellador acepta o rechaza, debe estar pending
  if (role === 'kamellador') {
    if (['accepted', 'rejected'].includes(newStatus) && op.status !== 'pending') {
      throw new Error('Can only accept/reject pending operations');
    }
    if (newStatus === 'in_progress' && op.status !== 'accepted') {
      throw new Error('Must be accepted before in_progress');
    }
    if (newStatus === 'completed' && op.status !== 'in_progress') {
       throw new Error('Must be in_progress before completed');
    }
  }

  const updates = { status: newStatus };
  if (role === 'kamellador' && newStatus === 'accepted') {
    updates.kamellador_id = userId;
    updates.agreed_price = op.proposed_price;
    updates.service_code = Math.floor(1000 + Math.random() * 9000).toString();
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('operations')
    .update(updates)
    .eq('id', operationId)
    .eq('status', op.status)
    .select(OPERATION_SELECT)
    .single();

  if (updateError) {
    throw new Error('Error updating operation: ' + updateError.message);
  }

  return data;
}

async function getOperationOrThrow(operationId) {
  const { data: op, error } = await supabaseAdmin
    .from('operations')
    .select('*')
    .eq('id', operationId)
    .single();

  if (error || !op) {
    const err = new Error('Operation not found');
    err.statusCode = 404;
    throw err;
  }

  return op;
}

export async function startOperation(operationId, kamelladorId, serviceCode) {
  const op = await getOperationOrThrow(operationId);

  if (op.kamellador_id !== kamelladorId) {
    throw new Error('Unauthorized');
  }

  if (op.status !== 'accepted') {
    throw new Error('Can only start accepted operations');
  }

  if (op.service_code !== serviceCode) {
    throw new Error('Invalid service code');
  }

  const { data, error } = await supabaseAdmin
    .from('operations')
    .update({ status: 'in_progress' })
    .eq('id', operationId)
    .eq('status', 'accepted')
    .select(OPERATION_SELECT)
    .single();

  if (error) {
    throw new Error('Error starting operation: ' + error.message);
  }

  return data;
}

export async function completeOperation(operationId, kamelladorId) {
  const op = await getOperationOrThrow(operationId);

  if (op.kamellador_id !== kamelladorId) {
    throw new Error('Unauthorized');
  }

  if (op.status !== 'in_progress') {
    throw new Error('Can only complete operations in progress');
  }

  const { data, error } = await supabaseAdmin
    .from('operations')
    .update({ status: 'completed' })
    .eq('id', operationId)
    .eq('status', 'in_progress')
    .select(OPERATION_SELECT)
    .single();

  if (error) {
    throw new Error('Error completing operation: ' + error.message);
  }

  return data;
}

export async function rateOperation(operationId, clientId, payload) {
  const rating = Number(payload.rating);
  const comment = typeof payload.comment === 'string' ? payload.comment.trim() : null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating must be an integer between 1 and 5');
  }

  const op = await getOperationOrThrow(operationId);

  if (op.client_id !== clientId) {
    throw new Error('Unauthorized');
  }

  if (!op.kamellador_id) {
    throw new Error('Operation has no provider');
  }

  if (op.status !== 'completed') {
    throw new Error('Can only rate completed operations');
  }

  const { data: existingRating } = await supabaseAdmin
    .from('operation_ratings')
    .select('id')
    .eq('operation_id', operationId)
    .eq('reviewer_id', clientId)
    .maybeSingle();

  if (existingRating) {
    throw new Error('Operation already rated');
  }

  const { data: ratingRow, error: ratingError } = await supabaseAdmin
    .from('operation_ratings')
    .insert({
      operation_id: operationId,
      reviewer_id: clientId,
      reviewed_id: op.kamellador_id,
      rating,
      comment: comment || null
    })
    .select()
    .single();

  if (ratingError) {
    throw new Error('Error rating operation: ' + ratingError.message);
  }

  const { error: statusError } = await supabaseAdmin
    .from('operations')
    .update({ status: 'rated' })
    .eq('id', operationId)
    .eq('status', 'completed');

  if (statusError) {
    throw new Error('Error updating operation status: ' + statusError.message);
  }

  const { data: aggregate, error: aggregateError } = await supabaseAdmin
    .from('operation_ratings')
    .select('rating')
    .eq('reviewed_id', op.kamellador_id);

  if (aggregateError) {
    throw new Error('Error calculating provider rating: ' + aggregateError.message);
  }

  const ratingCount = aggregate.length;
  const ratingAvg = ratingCount
    ? Number((aggregate.reduce((sum, row) => sum + row.rating, 0) / ratingCount).toFixed(2))
    : 0;

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      rating_avg: ratingAvg,
      rating_count: ratingCount
    })
    .eq('id', op.kamellador_id);

  if (profileError) {
    throw new Error('Error updating provider rating: ' + profileError.message);
  }

  const { data: operation } = await supabaseAdmin
    .from('operations')
    .select(OPERATION_SELECT)
    .eq('id', operationId)
    .single();

  return {
    rating: ratingRow,
    operation
  };
}
