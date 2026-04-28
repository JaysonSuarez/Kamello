-- ============================================================
-- MIGRACION 006: Inicio de operacion seguro con codigo (PIN)
-- Proyecto: Kamello
-- ============================================================

-- 1. Funcion RPC para iniciar operacion validando el codigo.
-- Esto es mas seguro que hacerlo via UPDATE directo desde el frontend.
CREATE OR REPLACE FUNCTION public.start_operation_with_code(
  p_operation_id UUID,
  p_service_code TEXT
)
RETURNS public.operations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operation public.operations%ROWTYPE;
BEGIN
  -- 1. Obtener la operacion y bloquear la fila.
  SELECT *
  INTO v_operation
  FROM public.operations
  WHERE id = p_operation_id
  FOR UPDATE;

  -- 2. Validar existencia.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operación no encontrada'
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Validar que el usuario sea el kamellador asignado.
  IF v_operation.kamellador_id <> auth.uid() THEN
    RAISE EXCEPTION 'No estás autorizado para iniciar esta operación'
      USING ERRCODE = '42501';
  END IF;

  -- 4. Validar estado actual.
  IF v_operation.status <> 'accepted' THEN
    RAISE EXCEPTION 'La operación debe estar en estado "aceptado" para iniciar'
      USING ERRCODE = '23514';
  END IF;

  -- 5. Validar el codigo de servicio.
  IF v_operation.service_code <> p_service_code THEN
    RAISE EXCEPTION 'El código de servicio es incorrecto. Pídeselo al cliente.'
      USING ERRCODE = '23514';
  END IF;

  -- 6. Actualizar estado.
  UPDATE public.operations
  SET status = 'in_progress',
      updated_at = now()
  WHERE id = p_operation_id
  RETURNING * INTO v_operation;

  RETURN v_operation;
END;
$$;

-- Permisos.
REVOKE ALL ON FUNCTION public.start_operation_with_code(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_operation_with_code(UUID, TEXT) TO authenticated;
