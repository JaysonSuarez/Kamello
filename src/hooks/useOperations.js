import { useCallback, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export const ACTIVE_OPERATION_STATUSES = ["pending", "accepted", "in_progress", "completed"];
export const HISTORY_OPERATION_STATUSES = ["accepted", "in_progress", "completed", "rated", "cancelled", "expired"];

export const OPERATION_SELECT = `
  *,
  client:profiles!operations_client_id_fkey(id, full_name, phone, avatar_url),
  kamellador:profiles!operations_kamellador_id_fkey(id, full_name, phone, avatar_url, specialty, rating_avg, rating_count, current_lat, current_lng),
  operation_ratings!operation_ratings_operation_id_fkey(id, rating, comment, reviewer_id, reviewed_id, created_at)
`;

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export function useOperations() {
  const [loadingById, setLoadingById] = useState({});
  const [error, setError] = useState(null);

  const setOperationLoading = useCallback((operationId, isLoading) => {
    setLoadingById((prev) => ({
      ...prev,
      [operationId]: isLoading,
    }));
  }, []);

  const fetchOperation = useCallback(async (operationId) => {
    const { data, error } = await supabase
      .from("operations")
      .select(OPERATION_SELECT)
      .eq("id", operationId)
      .maybeSingle();

    if (error) {
      throw new Error(getErrorMessage(error, "No se pudo cargar la operacion."));
    }

    return data;
  }, []);

  const fetchActiveOperation = useCallback(async (userId, role) => {
    const column = role === "client" || role === "cliente" ? "client_id" : "kamellador_id";

    const { data, error } = await supabase
      .from("operations")
      .select(OPERATION_SELECT)
      .eq(column, userId)
      .in("status", ACTIVE_OPERATION_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(getErrorMessage(error, "No se pudo cargar la operacion activa."));
    }

    return data;
  }, []);

  const fetchHistory = useCallback(async (userId, role, limit = 8) => {
    const column = role === "client" || role === "cliente" ? "client_id" : "kamellador_id";

    const { data, error } = await supabase
      .from("operations")
      .select(OPERATION_SELECT)
      .eq(column, userId)
      .in("status", HISTORY_OPERATION_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(getErrorMessage(error, "No se pudo cargar el historial."));
    }

    return data || [];
  }, []);

  const startOperation = useCallback(async (operationId, pin) => {
    setOperationLoading(operationId, true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado.");

      const { data, error } = await supabase.rpc('start_operation_secure', {
        p_operation_id: operationId,
        p_kamellador_id: user.id,
        p_pin: pin
      });

      if (error) {
        if (error.message.includes('INVALID_PIN')) throw new Error("Código incorrecto.");
        if (error.message.includes('MAX_ATTEMPTS_REACHED')) throw new Error("Has intentado demasiadas veces. Operación cancelada por seguridad.");
        throw new Error(getErrorMessage(error, "No se pudo iniciar el servicio."));
      }
      return data;
    } finally {
      setOperationLoading(operationId, false);
    }
  }, [setOperationLoading]);

  const completeOperation = useCallback(async (operationId) => {
    setError(null);
    setOperationLoading(operationId, true);

    try {
      const { data, error } = await supabase
        .from("operations")
        .update({ status: "completed" })
        .eq("id", operationId)
        .eq("status", "in_progress")
        .select(OPERATION_SELECT)
        .single();

      if (error) throw new Error(getErrorMessage(error, "No se pudo finalizar el trabajo."));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setOperationLoading(operationId, false);
    }
  }, [setOperationLoading]);

  const rateOperation = useCallback(async (operationId, rating, comment = "", tags = []) => {
    setError(null);
    setOperationLoading(operationId, true);

    try {
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new Error("La calificacion debe estar entre 1 y 5.");
      }

      const { error } = await supabase.rpc("rate_operation", {
        p_operation_id: operationId,
        p_rating: parsedRating,
        p_comment: comment,
        p_tags: tags,
      });

      if (error) throw new Error(getErrorMessage(error, "No se pudo guardar la calificacion."));

      return fetchOperation(operationId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setOperationLoading(operationId, false);
    }
  }, [fetchOperation, setOperationLoading]);

  return useMemo(() => ({
    error,
    loadingById,
    fetchOperation,
    fetchActiveOperation,
    fetchHistory,
    startOperation,
    completeOperation,
    rateOperation,
  }), [
    error,
    loadingById,
    fetchOperation,
    fetchActiveOperation,
    fetchHistory,
    startOperation,
    completeOperation,
    rateOperation,
  ]);
}
