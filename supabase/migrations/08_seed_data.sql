-- Seed data for stage_sla table
INSERT INTO stage_sla (stage_name, duration) VALUES
    ('Indagación', 5),
    ('Entrevista', 3),
    ('Notificación Apoderado', 2),
    ('Resolución', 10),
    ('Apelación', 5),
    ('Seguimiento', 7);

-- Seed data for process_stages table
INSERT INTO process_stages (stage_order, stage_name) VALUES
    (1, 'Stage 1'),
    (2, 'Stage 2'),
    (3, 'Stage 3'),
    (4, 'Stage 4'),
    (5, 'Stage 5'),
    (6, 'Stage 6'),
    (7, 'Stage 7'),
    (8, 'Stage 8');