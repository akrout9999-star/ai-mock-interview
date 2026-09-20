import psycopg
from psycopg.rows import dict_row
from config import DATABASE_URL


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")

    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )


def initialize_database():
    with get_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interviews (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
                    target_role VARCHAR(150) NOT NULL,
                    experience_level VARCHAR(50) NOT NULL,
                    interview_type VARCHAR(50) NOT NULL,
                    focus_area VARCHAR(150),
                    difficulty VARCHAR(30) NOT NULL,
                    total_questions INTEGER DEFAULT 10,
                    current_question INTEGER DEFAULT 0,
                    status VARCHAR(30) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interview_messages (
                    id SERIAL PRIMARY KEY,
                    interview_id INTEGER NOT NULL
                        REFERENCES interviews(id) ON DELETE CASCADE,
                    sender VARCHAR(20) NOT NULL,
                    message_type VARCHAR(30) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS answer_evaluations (
                    id SERIAL PRIMARY KEY,
                    interview_id INTEGER NOT NULL
                        REFERENCES interviews(id) ON DELETE CASCADE,
                    message_id INTEGER
                        REFERENCES interview_messages(id) ON DELETE CASCADE,
                    score DECIMAL(4,2),
                    correctness DECIMAL(4,2),
                    clarity DECIMAL(4,2),
                    depth DECIMAL(4,2),
                    relevance DECIMAL(4,2),
                    strengths TEXT,
                    missing_points TEXT,
                    misconceptions TEXT,
                    difficulty_change VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interview_reports (
                    id SERIAL PRIMARY KEY,
                    interview_id INTEGER UNIQUE NOT NULL
                        REFERENCES interviews(id) ON DELETE CASCADE,
                    overall_score DECIMAL(4,2),
                    technical_score DECIMAL(4,2),
                    communication_score DECIMAL(4,2),
                    problem_solving_score DECIMAL(4,2),
                    strengths TEXT,
                    weaknesses TEXT,
                    missing_concepts TEXT,
                    summary TEXT,
                    recommendations TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

        conn.commit()