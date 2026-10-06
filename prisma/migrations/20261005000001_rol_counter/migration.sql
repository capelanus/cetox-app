-- El counter deja de ser solo de Química: un único rol COUNTER cuya área
-- (Q/B/M) dice de qué mostrador es la cuenta.
UPDATE "Usuario" SET rol = 'COUNTER', area = COALESCE(area, 'Q') WHERE rol = 'COUNTER_QUIMICA';
