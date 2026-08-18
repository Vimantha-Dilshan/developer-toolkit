-- Orion Sample SQL
-- Demonstrates various SQL features for the SQL Formatter tool
-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP
);
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE usage_events (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE
    SET
        NULL,
        tool_id INT REFERENCES tools(id) ON DELETE CASCADE,
        event_type VARCHAR(30) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Insert sample data
INSERT INTO
    tools (slug, name, category)
VALUES
    (
        'json-formatter',
        'JSON Formatter',
        'formatters'
    ),
    (
        'jwt-decoder',
        'JWT Decoder',
        'security'
    ),
    (
        'uuid-generator',
        'UUID Generator',
        'generators'
    ),
    (
        'regex-tester',
        'Regex Tester',
        'testing'
    ),
    (
        'sql-formatter',
        'SQL Formatter',
        'formatters'
    );
-- Analytical query
SELECT
    t.category,
    t.name AS tool_name,
    COUNT(ue.id) AS total_uses,
    COUNT(DISTINCT ue.user_id) AS unique_users,
    MAX(ue.created_at) AS last_used,
    ROUND(
        COUNT(ue.id) :: NUMERIC / NULLIF(COUNT(DISTINCT ue.user_id), 0),
        2
    ) AS uses_per_user
FROM
    tools t
    LEFT JOIN usage_events ue ON ue.tool_id = t.id
    AND ue.created_at >= NOW() - INTERVAL '30 days'
WHERE
    t.is_active = TRUE
GROUP BY
    t.id,
    t.category,
    t.name
ORDER BY
    total_uses DESC,
    t.name ASC;